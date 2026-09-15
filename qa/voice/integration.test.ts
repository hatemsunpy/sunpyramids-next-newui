import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { expect, it, vi } from "vitest";
import { POST } from "../../app/api/voice/resolve/route";
import corpus from "./corpus.v1.json";
import fixture from "./taxonomy.fixture.json";
import freeze from "./freeze.v1.json";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

it("records actual Header handler responses using only fixture HTTP boundaries", async () => {
  for (const [path, hash] of Object.entries(freeze.production)) {
    expect(createHash("sha256").update(readFileSync(path)).digest("hex"), path).toBe(hash);
  }
  const baseline = JSON.parse(readFileSync("qa/voice/baseline.v1.results.json", "utf8")) as {
    results: { id: string; header: unknown }[];
  };
  const results = [];
  let unexpectedNetworkAttempts = 0;
  try {
    for (const row of corpus.cases) {
      let destinations = fixture.destinations;
      let categories = fixture.rootCategories;
      if (row.taxonomy === "destination-removed") destinations = destinations.filter(d => d.slug !== "cairo");
      if (row.taxonomy === "destinations-unavailable" || row.taxonomy === "all-unavailable") destinations = [];
      if (row.taxonomy === "category-removed" || row.taxonomy === "all-unavailable") categories = categories.filter(c => c.slug !== "nile-cruises");
      const fixtureRequests: string[] = [];
      vi.stubGlobal("fetch", async (input: string | URL | Request) => {
        const pathname = new URL(String(input)).pathname;
        fixtureRequests.push(pathname);
        if (pathname.endsWith("/destinations")) return Response.json({ data: destinations });
        if (pathname.endsWith("/categories/count")) return Response.json({ data: Object.fromEntries(categories.map(c => [c.slug, 1])) });
        if (pathname.endsWith("/categories")) return Response.json({ data: categories.map(c => ({ ...c, parent_id: null })) });
        unexpectedNetworkAttempts++;
        throw new Error("Offline fixture rejects unexpected request");
      });
      const payload = { transcript: row.transcript, locale: row.locale };
      const response = await POST(new Request("https://fixture.test/api/voice/resolve", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      }));
      const body = await response.json();
      const expectedStatus = destinations.length ? 200 : 503;
      expect(response.status, row.id).toBe(expectedStatus);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      if (expectedStatus === 503) expect(body).toEqual({ error: "resolution-unavailable" });
      else expect(body, row.id).toEqual(baseline.results.find(r => r.id === row.id)!.header);
      results.push({ id: row.id, payload, status: response.status, body,
        cacheControl: response.headers.get("Cache-Control"), fixtureRequests,
        source: "Actual POST function; synthetic in-process Request; fetch replaced at HTTP boundary, not live browser traffic" });
    }
    expect(unexpectedNetworkAttempts).toBe(0);
    writeFileSync("qa/voice/integration.v1.results.json", JSON.stringify({
      measuredAt: new Date().toISOString(), unexpectedNetworkAttempts,
      outboundNetworkCalls: 0, total: results.length, results,
    }, null, 2) + "\n");
  } finally { vi.unstubAllGlobals(); }
});
