import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

// Lighthouse is audit tooling, never a production dependency.
const globalModules = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["root", "-g"], { shell: process.platform === "win32" }).toString().trim();
const lighthouseRoot = join(globalModules, "lighthouse");
const { default: lighthouse } = await import(pathToFileURL(join(lighthouseRoot, "core/index.js")));
const { launch } = await import(pathToFileURL(join(lighthouseRoot, "node_modules/chrome-launcher/dist/index.js")));
const origin = process.env.AUDIT_ORIGIN || "http://localhost:3003";
const phase = process.argv[2] || "baseline";
const routes = {
  home: "/", trips: "/trips", category: "/egypt-tours/one-day-tours/cairo",
  tour: "/tour/explore-the-wonders-of-egypt-during-the-new-year-in-an-extraordinary-7-days", blogs: "/blogs/all-blogs",
  blog: "/blog/best-nile-cruise", events: "/events",
  guide: "/egypt-travel-guide", about: "/about-us", contact: "/contact-us",
  planner: "/make-your-trip", rent: "/rent-car", cart: "/cart",
  checkout: "/cart/checkout", auth: "/auth/sign-in", french: "/fr",
};
const selected = process.argv.slice(3);
const targets = selected.length ? selected : Object.keys(routes);
const profiles = process.env.AUDIT_PROFILE ? [process.env.AUDIT_PROFILE] : ["mobile", "desktop"];
const output = resolve("output/performance", phase);
await mkdir(output, { recursive: true });
await mkdir(join(output, "chrome-profile"), { recursive: true });
const chrome = await launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ["--headless", "--no-sandbox"],
  userDataDir: join(output, "chrome-profile"),
});
const summaries = [];
try {
  for (const name of targets) {
    if (!(name in routes)) throw new Error(`Unknown audit route: ${name}`);
    const url = new URL(routes[name], origin).href;
    const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });
    if (!response.ok) throw new Error(`Cannot audit ${url}: HTTP ${response.status}`);
    await response.text();
    for (const profile of profiles) {
      const audit = await lighthouse(url, {
        port: chrome.port, output: ["json", "html"], logLevel: "error",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      }, profile === "desktop" ? { extends: "lighthouse:default", settings: { formFactor: "desktop", screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } } : undefined);
      if (audit.lhr.runtimeError) throw new Error(`${url}: ${audit.lhr.runtimeError.message}`);
      const prefix = join(output, `${name}-${profile}`);
      await writeFile(`${prefix}.json`, audit.report[0]);
      await writeFile(`${prefix}.html`, audit.report[1]);
      const summary = {
        name, url: audit.lhr.finalDisplayedUrl, profile,
        scores: Object.fromEntries(Object.entries(audit.lhr.categories).map(([key, category]) => [key, Math.round(category.score * 100)])),
        metrics: Object.fromEntries(["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"].map(key => [key, audit.lhr.audits[key].numericValue])),
        warnings: audit.lhr.runWarnings,
      };
      summaries.push(summary);
      console.log(JSON.stringify(summary));
      await writeFile(join(output, "summary.json"), JSON.stringify(summaries, null, 2));
    }
  }
} finally {
  await chrome.kill();
}
