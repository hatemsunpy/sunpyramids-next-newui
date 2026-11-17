import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetchReliable } from "@/lib/api";
import { loadJordanTours } from "@/lib/jordan-destination";

vi.mock("@/lib/api", () => ({ apiFetchReliable: vi.fn() }));

const fetchApi = vi.mocked(apiFetchReliable);

describe("Jordan tour catalog", () => {
  beforeEach(() => fetchApi.mockReset());

  it("uses the current destination and its related places from Laravel", async () => {
    fetchApi.mockResolvedValueOnce({ ok: true, value: { data: { data: [{ id: 2001 }, { id: 2002 }, { id: 2002 }] } } });
    fetchApi.mockResolvedValueOnce({ ok: true, value: { data: { data: [], total: 19, last_page: 2 } } });

    const catalog = await loadJordanTours({ id: 2003 }, "fr", 2);
    const placeQuery = new URLSearchParams(fetchApi.mock.calls[0][0].split("?")[1]);
    const tourQuery = new URLSearchParams(fetchApi.mock.calls[1][0].split("?")[1]);

    expect(placeQuery.getAll("parent.slug[]")).toEqual(["jordan-tours", "jordan"]);
    expect(tourQuery.getAll("destinations.id[]")).toEqual(["2003", "2001", "2002"]);
    expect(tourQuery.get("page")).toBe("2");
    expect(fetchApi.mock.calls[1][1]).toEqual({ locale: "fr" });
    expect(catalog?.meta.lastPage).toBe(2);
  });

  it("reports an unavailable catalog when the place lookup fails", async () => {
    fetchApi.mockResolvedValueOnce({ ok: false, reason: "error" });

    await expect(loadJordanTours({ id: 2003 }, "en", 1)).resolves.toBeNull();
    expect(fetchApi).toHaveBeenCalledTimes(1);
  });

  it.each([["day", "1"], ["multi-day", "gt::1"]] as const)("applies the %s duration filter without dropping Jordan's places", async (trip, duration) => {
    fetchApi.mockResolvedValueOnce({ ok: true, value: { data: [{ id: 2001 }] } });
    fetchApi.mockResolvedValueOnce({ ok: true, value: { data: [] } });

    await loadJordanTours({ id: 2003 }, "en", 2, trip, "longest");
    const query = new URLSearchParams(fetchApi.mock.calls[1][0].split("?")[1]);
    expect(query.get("duration_in_days")).toBe(duration);
    expect(query.get("order_by")).toBe("duration_in_days,desc|display_order,asc");
    expect(query.getAll("destinations.id[]")).toEqual(["2003", "2001"]);
    expect(query.get("page")).toBe("2");
  });
});
