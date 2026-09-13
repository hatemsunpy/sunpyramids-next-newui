import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/voice/resolve/route";
import { createHeaderVoiceApiFixture } from "@/tests/test-utils/header-voice-api";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
let api: ReturnType<typeof createHeaderVoiceApiFixture>;
beforeEach(() => { api = createHeaderVoiceApiFixture(); vi.stubGlobal("fetch", vi.fn(api.fetch)); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function request(body: unknown, headers: Record<string, string> = {}) { return new Request("https://fixture.test/api/voice/resolve", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) }); }

describe("on-demand internal Voice resolver", () => {
  it.each([
    { transcript: "5 days Cairo", locale: "ar" }, { transcript: 5, locale: "en" },
    { transcript: "", locale: "en" }, { transcript: " ", locale: "en" },
    { transcript: "x".repeat(1001), locale: "en" }, { transcript: "5 days Cairo", locale: { en: true } },
    { transcript: "5 days Cairo", locale: "en", injected: true }, null, [],
  ].map((body) => [body]))("invalid input %j is rejected before taxonomy work", async (body) => {
    const response = await POST(request(body)); expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid-input" }); expect(api.upstreamRequests).toHaveLength(0);
  });

  it.each([
    ["cross-origin", { Origin: "https://external.test" }, 403],
    ["cross-site", { "Sec-Fetch-Site": "cross-site" }, 403],
    ["wrong content type", { "Content-Type": "text/plain" }, 415],
  ] as const)("%s request is rejected before fetching", async (_scenario, headers, expected) => {
    expect((await POST(request({ transcript: "5 days Cairo", locale: "en" }, headers))).status).toBe(expected);
    expect(api.upstreamRequests).toHaveLength(0);
  });

  it("malformed JSON and oversized streamed bodies are rejected without upstream calls", async () => {
    for (const body of ["{", JSON.stringify({ transcript: "x".repeat(9000), locale: "en" })]) {
      const response = await POST(new Request("https://fixture.test/api/voice/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body }));
      expect(response.status).toBe(400);
    }
    expect(api.upstreamRequests).toHaveLength(0);
  });

  it("structured response omits raw intent/upstream records and does not persist or cache the transcript", async () => {
    const persist = vi.spyOn(Storage.prototype, "setItem"); const log = vi.spyOn(console, "log");
    const transcript = "private 5 day trip to Cairo for two people";
    const response = await POST(request({ transcript, locale: "en" }, { Origin: "https://fixture.test" }));
    expect(response.headers.get("Cache-Control")).toBe("no-store"); expect(response.headers.get("Set-Cookie")).toBeNull();
    expect(await response.json()).toEqual({ mode: "structured", applicable: { days: "5", destination: "cairo" }, decisions: [] });
    expect(persist).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
    persist.mockRestore(); log.mockRestore();
  });

  it("missing destination taxonomy returns unavailable rather than fabricating a title fallback", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: [] })));
    const response = await POST(request({ transcript: "5 days Cairo", locale: "en" }));
    expect(response.status).toBe(503); expect(await response.json()).toEqual({ error: "resolution-unavailable" });
  });

  it("unexpected resolver failure returns a generic error without leaking internal details", async () => {
    const headers = await import("next/headers");
    const cookieFailure = vi.spyOn(headers, "cookies").mockRejectedValueOnce(new Error("internal-secret-detail"));
    const response = await POST(request({ transcript: "5 days Cairo", locale: "en" }));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("internal-secret-detail");
    cookieFailure.mockRestore();
  });

  it("observes payload bytes and local fixture resolution timing without a release threshold", async () => {
    const start = performance.now(); const response = await POST(request({ transcript: "5 days Cairo", locale: "en" }));
    const payload = await response.text();
    expect(response.status).toBe(200); expect(api.upstreamRequests).toHaveLength(3);
    console.info("Voice resolver fixture observation", { bytes: new TextEncoder().encode(payload).length, localMs: Number((performance.now() - start).toFixed(2)) });
  });
});
