import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync, execSync } from "node:child_process";
import { existsSync } from "node:fs";

// Lighthouse is audit tooling, never a production dependency.
const globalModules = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["root", "-g"], { shell: process.platform === "win32" }).toString().trim();
const lighthouseRoot = join(globalModules, "lighthouse");
const { default: lighthouse } = await import(pathToFileURL(join(lighthouseRoot, "core/index.js")));
const { launch } = await import(pathToFileURL(join(lighthouseRoot, "node_modules/chrome-launcher/dist/index.js")));
// Official Lighthouse desktop config (formFactor, throttling, screen emulation,
// user agent). Mobile uses the default config (undefined) which is mobile.
const { default: desktopConfig } = await import(pathToFileURL(join(lighthouseRoot, "core/config/desktop-config.js")));
const lighthousePkg = JSON.parse(await readFile(join(lighthouseRoot, "package.json"), "utf8"));
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
const VALID_PROFILES = ["mobile", "desktop"];
const requestedProfiles = process.env.AUDIT_PROFILE ? [process.env.AUDIT_PROFILE] : ["mobile", "desktop"];
for (const profile of requestedProfiles) {
  if (!VALID_PROFILES.includes(profile)) {
    console.error(`Unknown audit profile: ${JSON.stringify(profile)} (expected "mobile" or "desktop")`);
    process.exit(1);
  }
}
const profiles = requestedProfiles;
const output = resolve("output/performance", phase);
await mkdir(output, { recursive: true });
await mkdir(join(output, "chrome-profile"), { recursive: true });

// Local provenance only: this SHA identifies the LOCAL checkout that produced
// these reports. It is NOT proof of which commit the measured deployment runs.
function localFingerprint() {
  let commit = "unknown";
  try {
    commit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    commit = "unknown";
  }
  let tree = "unknown";
  let treeChangedFiles = -1;
  try {
    const porcelain = execSync("git status --porcelain", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const changed = porcelain.split("\n").filter((line) => line.trim() !== "");
    treeChangedFiles = changed.length;
    tree = changed.length === 0 ? "clean" : "dirty";
  } catch {
    tree = "unknown";
  }
  return { commit, tree, treeChangedFiles };
}

const fingerprint = localFingerprint();
const runMeta = {
  lighthouse: lighthousePkg.version || "unknown",
  ...fingerprint,
  commitNote: "LOCAL checkout SHA (git rev-parse HEAD); not proof of deployed SHA.",
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  origin,
  timestamp: new Date().toISOString(),
  onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
};

// Preserve earlier summary entries across invocations (append, never overwrite).
// Recover ONLY when no summary exists yet; a malformed or non-array summary
// fails loudly instead of being silently discarded.
const summaryPath = join(output, "summary.json");
let summaries;
try {
  const raw = await readFile(summaryPath, "utf8");
  try {
    summaries = JSON.parse(raw);
  } catch {
    console.error(`Existing summary is malformed JSON: ${summaryPath} — refusing to discard it. Move or repair the file, then rerun.`);
    process.exit(1);
  }
  if (!Array.isArray(summaries)) {
    console.error(`Existing summary is not an array: ${summaryPath} — refusing to discard it. Move or repair the file, then rerun.`);
    process.exit(1);
  }
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    summaries = [];
  } else {
    throw error;
  }
}

function uniquePrefix(name, profile) {
  const base = join(output, `${name}-${profile}`);
  if (!existsSync(`${base}.json`) && !existsSync(`${base}.html`)) return base;
  let index = 2;
  while (existsSync(`${base}-r${index}.json`) || existsSync(`${base}-r${index}.html`)) index += 1;
  return `${base}-r${index}`;
}

let failures = 0;
const chrome = await launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ["--headless", "--no-sandbox"],
  userDataDir: join(output, "chrome-profile"),
});
try {
  for (const name of targets) {
    if (!(name in routes)) throw new Error(`Unknown audit route: ${name}`);
    const requestedUrl = new URL(routes[name], origin).href;
    let httpStatus = 0;
    let bodyLength = 0;
    try {
      const response = await fetch(requestedUrl, { signal: AbortSignal.timeout(90_000) });
      httpStatus = response.status;
      const body = await response.text();
      bodyLength = body.length;
      if (!response.ok) {
        failures += 1;
        const summary = {
          name, requestedUrl, url: requestedUrl, profile: profiles.join("+"),
          status: "failed", httpStatus, bodyLength,
          error: `HTTP ${response.status}`,
          ...runMeta,
        };
        summaries.push(summary);
        console.log(JSON.stringify(summary));
        await writeFile(summaryPath, JSON.stringify(summaries, null, 2));
        continue;
      }
      if (!bodyLength) {
        failures += 1;
        const summary = {
          name, requestedUrl, url: requestedUrl, profile: profiles.join("+"),
          status: "empty", httpStatus, bodyLength,
          error: "Empty response body",
          ...runMeta,
        };
        summaries.push(summary);
        console.log(JSON.stringify(summary));
        await writeFile(summaryPath, JSON.stringify(summaries, null, 2));
        continue;
      }
    } catch (error) {
      failures += 1;
      const summary = {
        name, requestedUrl, url: requestedUrl, profile: profiles.join("+"),
        status: "failed", httpStatus, bodyLength,
        error: error instanceof Error ? error.message : String(error),
        ...runMeta,
      };
      summaries.push(summary);
      console.log(JSON.stringify(summary));
      await writeFile(summaryPath, JSON.stringify(summaries, null, 2));
      continue;
    }
    for (const profile of profiles) {
      // Validated above: only "mobile" (default config) or "desktop" (official
      // desktop config) reach this point, so the label always matches reality.
      const config = profile === "desktop" ? desktopConfig : undefined;
      try {
        const audit = await lighthouse(requestedUrl, {
          port: chrome.port, output: ["json", "html"], logLevel: "error",
          onlyCategories: runMeta.onlyCategories,
        }, config);
        if (audit.lhr.runtimeError) throw new Error(audit.lhr.runtimeError.message);
        const prefix = uniquePrefix(name, profile);
        await writeFile(`${prefix}.json`, audit.report[0]);
        await writeFile(`${prefix}.html`, audit.report[1]);
        const finalUrl = audit.lhr.finalDisplayedUrl || requestedUrl;
        const summary = {
          name, requestedUrl, url: finalUrl, profile,
          status: finalUrl !== requestedUrl ? "redirected" : "ok",
          httpStatus, bodyLength,
          redirected: finalUrl !== requestedUrl,
          report: `${prefix.split(/[\\/]/).pop()}.json`,
          scores: Object.fromEntries(Object.entries(audit.lhr.categories).map(([key, category]) => [key, Math.round(category.score * 100)])),
          metrics: Object.fromEntries(["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"].map(key => [key, audit.lhr.audits[key].numericValue])),
          // Kept verbatim (including throttling/storage warnings): warnings are
          // lab evidence and must stay visible, never filtered for nicer medians.
          warnings: audit.lhr.runWarnings,
          chromeUserAgent: audit.lhr.userAgent,
          lighthouseVersion: audit.lhr.lighthouseVersion,
          settings: {
            formFactor: profile,
            throttling: config?.settings?.throttling || "lighthouse-default-mobile",
            screenEmulation: config?.settings?.screenEmulation || "lighthouse-default-mobile",
            throttlingMethod: audit.lhr.configSettings?.throttlingMethod,
          },
          ...runMeta,
        };
        summaries.push(summary);
        console.log(JSON.stringify(summary));
        await writeFile(summaryPath, JSON.stringify(summaries, null, 2));
      } catch (error) {
        failures += 1;
        const summary = {
          name, requestedUrl, url: requestedUrl, profile,
          status: "failed", httpStatus, bodyLength,
          error: error instanceof Error ? error.message : String(error),
          settings: { formFactor: profile },
          ...runMeta,
        };
        summaries.push(summary);
        console.log(JSON.stringify(summary));
        await writeFile(summaryPath, JSON.stringify(summaries, null, 2));
      }
    }
  }
} finally {
  await chrome.kill();
}
// Reports are persisted above; a nonzero exit now prevents automation from
// treating failed/empty routes as passing runs.
if (failures > 0) {
  console.error(`${failures} audit failure(s) recorded in ${summaryPath}`);
  process.exitCode = 1;
}
