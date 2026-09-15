import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { expect, it, vi } from "vitest";
import { parseVoiceQuery } from "../../lib/voice/parse-voice-query";
import { mapCapabilities } from "../../lib/voice/capability-mapper";
import { headerVoiceResolution } from "../../lib/header-voice-resolution";
import type { VoiceTaxonomyInput } from "../../lib/voice/types";
import type { Locale } from "../../types/api";
import corpus from "./corpus.v1.json";
import fixture from "./taxonomy.fixture.json";
import freeze from "./freeze.v1.json";

const canonical = (value: Record<string, unknown>) => JSON.stringify(
  Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))));
const safetyKinds = /approximate|ambiguity|nights|mixed-units|out-of-range|zero|child-category|month|travelers|privacy|unknown-place|removed|unavailable/;

it("measures the frozen offline baseline without network or production edits", () => {
  for (const [path, hash] of Object.entries({ ...freeze.production, ...freeze.inputs })) {
    expect(createHash("sha256").update(readFileSync(path)).digest("hex"), path).toBe(hash);
  }
  let networkCalls = 0;
  vi.stubGlobal("fetch", () => { networkCalls++; throw new Error("Offline benchmark forbids network"); });
  try {
    const results = corpus.cases.map(row => {
      const taxonomy: VoiceTaxonomyInput = structuredClone(fixture);
      if (row.taxonomy === "destination-removed") taxonomy.destinations = taxonomy.destinations.filter(d => d.slug !== "cairo");
      if (row.taxonomy === "destinations-unavailable" || row.taxonomy === "all-unavailable") taxonomy.destinations = [];
      if (row.taxonomy === "category-removed" || row.taxonomy === "all-unavailable") taxonomy.rootCategories = taxonomy.rootCategories.filter(c => c.slug !== "nile-cruises");
      const run = () => mapCapabilities(parseVoiceQuery(row.transcript, row.locale as Locale), taxonomy);
      const capabilities = run();
      const header = headerVoiceResolution(capabilities, taxonomy);
      const filters: Record<string, string> = {};
      for (const f of capabilities.fields) {
        if (f.status !== "applicable") continue;
        if (f.field === "duration") filters.days = String(f.value);
        if (f.field === "destination") filters.destination = f.slug;
        if (f.field === "category") filters.main = f.slug;
      }
      const expectedFilters = row.expected.filters as Record<string, string>;
      const wrongApplied = Object.entries(filters).filter(([key, value]) => expectedFilters[key] !== value);
      const missing = Object.entries(expectedFilters).filter(([key, value]) => filters[key] !== value);
      const statusFailures = Object.entries(row.expected.statuses).filter(([field, status]) =>
        !capabilities.fields.some(f => f.field === field && f.status === status));
      const failures: string[] = [];
      if (canonical(filters) !== canonical(expectedFilters)) failures.push("filter-set");
      if (statusFailures.length) failures.push("capability-status");
      for (const [field, value] of [["month", 11], ["travelers", { total: 2 }], ["privacy", "private"]] as const) {
        if (row.id.endsWith(`-${field}`) && JSON.stringify(capabilities.intent[field]) !== JSON.stringify(value)) failures.push(`informational-${field}`);
      }
      if (row.id.endsWith("-approximate")) {
        const decision = header.mode === "structured" ? header.decisions.find(d => d.field === "days") : undefined;
        if (!decision || decision.kind !== "confirm" || decision.options.map(o => o.value).join() !== "7") failures.push("approximate-review");
      }
      for (const [kind, field, expected] of [["place-ambiguity", "destination", ["aswan", "luxor"]], ["duration-ambiguity", "days", ["5", "7"]]] as const) {
        if (!row.id.endsWith(`-${kind}`)) continue;
        const decision = header.mode === "structured" ? header.decisions.find(d => d.field === field) : undefined;
        if (!decision || decision.kind !== "choose" || canonical({ options: decision.options.map(o => o.value).sort() }) !== canonical({ options: [...expected] })) failures.push(`${kind}-review`);
      }
      if (header.mode === "structured" && canonical(header.applicable) !== canonical(filters)) failures.push("header-projection");
      const timings: number[] = [];
      for (let repeat = 0; repeat < 100; repeat++) {
        const start = performance.now(); run(); timings.push(performance.now() - start);
      }
      timings.sort((a,b) => a-b);
      return { ...row, filters, capabilities, header, headerAction: header.mode === "title" ? "literal-title-fallback" : header.decisions.length ? "review" : "auto-navigation", findTripAction: "review-only; existing required destination/duration validation", wrongApplied, missing, statusFailures, failures, pass: !failures.length, safetyCase: safetyKinds.test(row.id), warmMs: { median: timings[50], p95: timings[94] } };
    });
    const locales = [...new Set(results.map(r => r.locale))].map(locale => {
      const rows = results.filter(r => r.locale === locale);
      const challenge = rows.filter(r => r.partition === "challenge");
      const safety = rows.filter(r => r.safetyCase);
      const pass = rows.filter(r => r.pass).length;
      const challengePass = challenge.filter(r => r.pass).length;
      const falseApplication = rows.filter(r => r.wrongApplied.length).length;
      const safetyPass = safety.filter(r => r.pass).length;
      return { locale, total: rows.length, pass, percent: 100*pass/rows.length, exactFilters: rows.filter(r => canonical(r.filters) === canonical(r.expected.filters)).length, challenge: { total: challenge.length, pass: challengePass }, safety: { total: safety.length, pass: safetyPass }, falseConfidentApplicationCases: falseApplication, missingExpectedFiltersCases: rows.filter(r => r.missing.length).length, parserRecommendation: pass/rows.length >= .95 && challengePass/challenge.length >= .95 && falseApplication === 0 && safetyPass === safety.length ? "FULL SMART quality (exploratory text only)" : "SUGGESTION ONLY", failures: rows.filter(r => !r.pass).map(r => r.id) };
    });
    expect(networkCalls).toBe(0);
    writeFileSync("qa/voice/baseline.v1.results.json", JSON.stringify({ measuredAt: new Date().toISOString(), freeze, networkCalls, repetitionsPerCase: 100, scope: "Known transcripts; not ASR quality; warm CPU only", locales, results }, null, 2) + "\n");
    console.log(JSON.stringify({ networkCalls, locales }, null, 2));
  } finally { vi.unstubAllGlobals(); }
});
