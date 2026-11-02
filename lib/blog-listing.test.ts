import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch, apiFetchReliable } = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  apiFetchReliable: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ apiFetch, apiFetchReliable }));

// Import after the vi.mock hoisting so lib/data.ts consumes the mocked apiFetch.
import { getBlogListing } from "./data";

beforeEach(() => {
  apiFetch.mockReset();
  apiFetch.mockResolvedValue(null);
});

describe("getBlogListing API contract", () => {
  it("requests the newest added articles first (created_at desc) as the server-side default", async () => {
    const listing = await getBlogListing("en");

    expect(apiFetch).toHaveBeenCalledWith(
      "blogs?includes=categories%2Cseo&page_limit=10&order_by=created_at%2Cdesc&page=1",
      { locale: "en" },
    );
    expect(listing).toEqual({ blogs: [], currentPage: 1, lastPage: 1 });
  });

  it("keeps the page_limit and title-filter contract when a search title is provided", async () => {
    await getBlogListing("fr", "cairo");

    expect(apiFetch).toHaveBeenCalledWith(
      "blogs?includes=categories%2Cseo&page_limit=10&order_by=created_at%2Cdesc&page=1&title=*cairo*",
      { locale: "fr" },
    );
  });
});