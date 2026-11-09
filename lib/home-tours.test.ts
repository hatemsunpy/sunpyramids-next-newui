import { afterEach, describe, expect, it, vi } from "vitest";
import { getHomeTours } from "@/lib/data";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

afterEach(() => vi.unstubAllGlobals());

const endpoint = "tours/home?featured=1&page=1&page_limit=8";
const tours = [{ slug: "live-api-tour", title: "API tour" }];

describe("homepage tour loading", () => {
  it("recovers from a transient server failure without changing the request or freshness", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ data: { data: tours } }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getHomeTours(endpoint, "fr")).toEqual(tours);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [input, options] of fetchMock.mock.calls) {
      expect(String(input)).toContain(`/api/${endpoint}`);
      expect(options).toMatchObject({
        cache: "force-cache",
        next: { revalidate: 300 },
        headers: { "X-Localize": "fr" },
      });
    }
  });

  it("recovers from a failed connection and reads the live response", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(Response.json({ data: tours }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getHomeTours(endpoint, "en")).toEqual(tours);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps a successful empty list empty without extra requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getHomeTours(endpoint, "en")).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("bounds retries and preserves the unavailable result when the API stays down", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getHomeTours(endpoint, "en")).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
