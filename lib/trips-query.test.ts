import { describe, expect, it } from "vitest";
import { tripsRequest } from "./trips-query";
import type { TripTaxonomy } from "@/types/api";

// Fixture mirrors the minimum verified production taxonomy shape
// (live API probes 2026-09-10). Tests are fully offline; no production
// network calls are made from this suite.
const roots = [
  { id: 1, name: "Day Tour", title: "Day Tour", slug: "day-tour" },
  { id: 3, name: "Multi Days Tours", title: "Multi Days Tours", slug: "multi-days-tours" },
  { id: 17, name: "Nile Cruises", title: "Nile Cruises", slug: "nile-cruises" },
  { id: 53, name: "Special Offers", title: "Special Offers", slug: "special-offers" },
];
const children = [
  { id: 13, name: "One Day Tours", title: "One Day Tours", slug: "one-day-tours", parent_id: 1 },
  { id: 23, name: "Shore Excursions", title: "Shore Excursions", slug: "shore-excursions", parent_id: 1 },
  { id: 5, name: "Culture Tours", title: "Culture Tours", slug: "culture-tours", parent_id: 3 },
  { id: 2, name: "Luxury Nile Cruise", title: "Luxury Nile Cruise", slug: "luxury-nile-cruise", parent_id: 17 },
];
const taxonomy: TripTaxonomy = {
  allCategories: [...roots, ...children],
  rootCategories: roots,
  childCategories: children,
  destinations: [
    { id: 11, title: "Cairo Tours", slug: "cairo" },
    { id: 12, title: "Luxor Tours", slug: "luxor" },
    { id: 13, title: "Aswan Tours", slug: "aswan" },
  ],
  counts: { "day-tour": 316, "multi-days-tours": 100, "nile-cruises": 70, "special-offers": 20 },
  available: true,
};

const BASE = "tours?exists=wishlisted&order_by=display_order%2Casc";

describe("tripsRequest baseline (pre-D1) — single filters", () => {
  it("empty params → base endpoint, defaults", () => {
    const r = tripsRequest({}, taxonomy);
    expect(r.endpoint).toBe(BASE);
    expect(r).toEqual({ endpoint: BASE, page: 1, main: "", category: "", destination: "", title: "" });
  });

  it("title only", () => {
    const r = tripsRequest({ title: "nile cruise" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&title=*nile+cruise*`);
    expect(r.title).toBe("nile cruise");
  });

  it("title is trimmed and echoed trimmed", () => {
    const r = tripsRequest({ title: "  cairo  " }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&title=*cairo*`);
    expect(r.title).toBe("cairo");
  });

  it("whitespace-only title is dropped", () => {
    expect(tripsRequest({ title: "   " }, taxonomy).endpoint).toBe(BASE);
  });

  it("title array → first value", () => {
    expect(tripsRequest({ title: ["cairo", "luxor"] }, taxonomy).endpoint)
      .toBe(`${BASE}&title=*cairo*`);
  });

  it("main with one child (nile-cruises → luxury-nile-cruise id 2)", () => {
    expect(tripsRequest({ main: "nile-cruises" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=2`);
  });

  it("main with multiple children, childCategories order preserved (day-tour → 13,23)", () => {
    expect(tripsRequest({ main: "day-tour" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=13&categories.id%5B%5D=23`);
  });

  it("main with no children falls back to root id (special-offers → 53)", () => {
    expect(tripsRequest({ main: "special-offers" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=53`);
  });

  it("unknown main slug → no category filter, slug still echoed", () => {
    const r = tripsRequest({ main: "does-not-exist" }, taxonomy);
    expect(r.endpoint).toBe(BASE);
    expect(r.main).toBe("does-not-exist");
  });

  it("numeric category only", () => {
    expect(tripsRequest({ category: "13" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=13`);
  });

  it("non-numeric category without main → no category filter, echoed", () => {
    const r = tripsRequest({ category: "culture-tours" }, taxonomy);
    expect(r.endpoint).toBe(BASE);
    expect(r.category).toBe("culture-tours");
  });

  it("destination only", () => {
    expect(tripsRequest({ destination: "aswan" }, taxonomy).endpoint)
      .toBe(`${BASE}&destinations.slug%5B%5D=aswan`);
  });

  it("page only → echoed in result, not in endpoint (caller adds pagination)", () => {
    const r = tripsRequest({ page: "3" }, taxonomy);
    expect(r.endpoint).toBe(BASE);
    expect(r.page).toBe(3);
  });

  it("page invalid/zero/negative normalizes to 1", () => {
    expect(tripsRequest({ page: "abc" }, taxonomy).page).toBe(1);
    expect(tripsRequest({ page: "0" }, taxonomy).page).toBe(1);
    expect(tripsRequest({ page: "-2" }, taxonomy).page).toBe(1);
  });

  it("page array → first value", () => {
    expect(tripsRequest({ page: ["7", "2"] }, taxonomy).page).toBe(7);
  });
});

describe("tripsRequest baseline (pre-D1) — combinations", () => {
  it("main + destination", () => {
    expect(tripsRequest({ main: "nile-cruises", destination: "aswan" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=2&destinations.slug%5B%5D=aswan`);
  });

  it("main + title", () => {
    expect(tripsRequest({ main: "nile-cruises", title: "nile cruise" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=2&title=*nile+cruise*`);
  });

  it("numeric category takes precedence over main (else-if contract)", () => {
    const r = tripsRequest({ main: "nile-cruises", category: "13" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&categories.id%5B%5D=13`);
    expect(r.main).toBe("nile-cruises"); // echoed, not applied
  });

  it("category + destination", () => {
    expect(tripsRequest({ category: "13", destination: "aswan" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=13&destinations.slug%5B%5D=aswan`);
  });

  it("category + title", () => {
    expect(tripsRequest({ category: "13", title: "cairo" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=13&title=*cairo*`);
  });

  it("destination + title", () => {
    expect(tripsRequest({ destination: "aswan", title: "cairo" }, taxonomy).endpoint)
      .toBe(`${BASE}&destinations.slug%5B%5D=aswan&title=*cairo*`);
  });

  it("main + destination + title", () => {
    expect(tripsRequest({ main: "nile-cruises", destination: "aswan", title: "nile" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=2&destinations.slug%5B%5D=aswan&title=*nile*`);
  });

  it("category + destination + title", () => {
    expect(tripsRequest({ category: "13", destination: "aswan", title: "cairo" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=13&destinations.slug%5B%5D=aswan&title=*cairo*`);
  });

  it("all filters + pagination combined", () => {
    const r = tripsRequest(
      { main: "day-tour", destination: "luxor", title: "temple", page: "4" },
      taxonomy,
    );
    expect(r.endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=13&categories.id%5B%5D=23&destinations.slug%5B%5D=luxor&title=*temple*`);
    expect(r.page).toBe(4);
  });

  it("empty-string params behave as absent", () => {
    expect(tripsRequest({ title: "", main: "", destination: "", category: "" }, taxonomy).endpoint)
      .toBe(BASE);
  });

  it("unknown/unconsumed params are ignored", () => {
    const r = tripsRequest({ foo: "bar", sort: "price" }, taxonomy);
    expect(r.endpoint).toBe(BASE);
    expect((r as Record<string, unknown>).foo).toBeUndefined();
  });
});

describe("tripsRequest D1 (Hybrid) — days search contract", () => {
  const DUR = (n: number) => `&duration_in_days=${n}`;

  it("days=5 alone → duration_in_days=5, NO implicit main/category", () => {
    const r = tripsRequest({ days: "5" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}${DUR(5)}`);
    expect(r.main).toBe("");
    expect(r.category).toBe("");
    expect(r.days).toBe(5);
  });

  it("days=1 alone → Day Tour root-category behavior (legacy replica), no duration filter", () => {
    const r = tripsRequest({ days: "1" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&categories.id%5B%5D=13&categories.id%5B%5D=23`);
    expect(r.main).toBe("");
    expect(r.category).toBe("");
  });

  it("days=1 + destination → no explicit main/category → Day Tour fallback, destination preserved, no duration_in_days", () => {
    const r = tripsRequest({ days: "1", destination: "aswan" }, taxonomy);
    expect(r.endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=13&categories.id%5B%5D=23&destinations.slug%5B%5D=aswan`);
    expect(r.main).toBe("");
    expect(r.category).toBe("");
  });

  it("main + days=1 → explicit main preserved exactly, duration_in_days=1 AND-ed (nile-cruises)", () => {
    const r = tripsRequest({ main: "nile-cruises", days: "1" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&categories.id%5B%5D=2${DUR(1)}`);
    expect(r.main).toBe("nile-cruises");
  });

  it("main + days=1 → explicit main preserved exactly, duration_in_days=1 AND-ed (day-tour)", () => {
    const r = tripsRequest({ main: "day-tour", days: "1" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&categories.id%5B%5D=13&categories.id%5B%5D=23${DUR(1)}`);
    expect(r.main).toBe("day-tour");
  });

  it("category + days=1 → numeric category preserved, duration_in_days=1 AND-ed", () => {
    const r = tripsRequest({ category: "5", days: "1" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&categories.id%5B%5D=5${DUR(1)}`);
    expect(r.category).toBe("5");
  });

  it("non-numeric category + days=1 → category param is explicit → duration AND-ed, no Day Tour fallback", () => {
    const r = tripsRequest({ category: "culture-tours", days: "1" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}${DUR(1)}`);
    expect(r.category).toBe("culture-tours");
  });

  it("main + days=5 → explicit main preserved exactly, duration AND-ed (nile-cruises)", () => {
    const r = tripsRequest({ main: "nile-cruises", days: "5" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&categories.id%5B%5D=2${DUR(5)}`);
    expect(r.main).toBe("nile-cruises");
  });

  it("main + days=5 → explicit main preserved exactly (day-tour; zero-result combination is legitimate)", () => {
    const r = tripsRequest({ main: "day-tour", days: "5" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&categories.id%5B%5D=13&categories.id%5B%5D=23${DUR(5)}`);
    expect(r.main).toBe("day-tour");
  });

  it("category + days=5 → numeric category preserved, duration AND-ed", () => {
    const r = tripsRequest({ category: "5", days: "5" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}&categories.id%5B%5D=5${DUR(5)}`);
    expect(r.category).toBe("5");
  });

  it("destination + days=5 → both applied (verified live: aswan+5d=25 results)", () => {
    expect(tripsRequest({ destination: "aswan", days: "5" }, taxonomy).endpoint)
      .toBe(`${BASE}&destinations.slug%5B%5D=aswan${DUR(5)}`);
  });

  it("title + days=5 → both applied", () => {
    expect(tripsRequest({ title: "cairo", days: "5" }, taxonomy).endpoint)
      .toBe(`${BASE}&title=*cairo*${DUR(5)}`);
  });

  it("destination + title + days=5 → all three applied", () => {
    expect(tripsRequest({ destination: "aswan", title: "cruise", days: "5" }, taxonomy).endpoint)
      .toBe(`${BASE}&destinations.slug%5B%5D=aswan&title=*cruise*${DUR(5)}`);
  });

  it("page + days=5 → pagination behavior unchanged, duration applied", () => {
    const r = tripsRequest({ page: "2", days: "5" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}${DUR(5)}`);
    expect(r.page).toBe(2);
  });

  it("main + destination + days=5 → category + destination + duration", () => {
    expect(tripsRequest({ main: "nile-cruises", destination: "aswan", days: "5" }, taxonomy).endpoint)
      .toBe(`${BASE}&categories.id%5B%5D=2&destinations.slug%5B%5D=aswan${DUR(5)}`);
  });

  it("invalid days values are ignored, current request behavior retained", () => {
    expect(tripsRequest({ days: "0" }, taxonomy).endpoint).toBe(BASE);
    expect(tripsRequest({ days: "-1" }, taxonomy).endpoint).toBe(BASE);
    expect(tripsRequest({ days: "abc" }, taxonomy).endpoint).toBe(BASE);
    expect(tripsRequest({ days: "" }, taxonomy).endpoint).toBe(BASE);
    expect(tripsRequest({ days: "  " }, taxonomy).endpoint).toBe(BASE);
    expect(tripsRequest({ days: "05" }, taxonomy).endpoint).toBe(`${BASE}${DUR(5)}`);
    // Phase 2 return contract: invalid days → active days = undefined
    expect(tripsRequest({ days: "abc" }, taxonomy).days).toBeUndefined();
    expect(tripsRequest({ days: "0" }, taxonomy).days).toBeUndefined();
    expect(tripsRequest({ days: "-1" }, taxonomy).days).toBeUndefined();
    expect(tripsRequest({ days: "" }, taxonomy).days).toBeUndefined();
  });

  it("days array → first value (existing normalization conventions)", () => {
    const r = tripsRequest({ days: ["5", "7"] }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}${DUR(5)}`);
    expect(r.days).toBe(5);
  });

  it("days decimal/non-integer → ignored (only whole-number day counts are valid; no coercion)", () => {
    expect(tripsRequest({ days: "5.7" }, taxonomy).endpoint).toBe(BASE);
    expect(tripsRequest({ days: "5.7" }, taxonomy).days).toBeUndefined();
    expect(tripsRequest({ days: "5e2" }, taxonomy).endpoint).toBe(BASE);
    expect(tripsRequest({ days: "0x5" }, taxonomy).endpoint).toBe(BASE);
  });

  it("return contract: canonical normalized days — 05/1/padded forms normalize consistently", () => {
    expect(tripsRequest({ days: "5" }, taxonomy).days).toBe(5);
    expect(tripsRequest({ days: "05" }, taxonomy).days).toBe(5);
    expect(tripsRequest({ days: "1" }, taxonomy).days).toBe(1);
    expect(tripsRequest({ days: ["7", "3"] }, taxonomy).days).toBe(7);
    expect(tripsRequest({}, taxonomy).days).toBeUndefined();
  });

  it("unknown main slug + days=5 → unknown main adds no category filter, duration still applied", () => {
    const r = tripsRequest({ main: "does-not-exist", days: "5" }, taxonomy);
    expect(r.endpoint).toBe(`${BASE}${DUR(5)}`);
    expect(r.main).toBe("does-not-exist");
  });

  it("typo'd distination remains ignored in Phase 1 (D2 fix is Phase 2)", () => {
    expect(tripsRequest({ distination: "aswan", days: "5" }, taxonomy).endpoint)
      .toBe(`${BASE}${DUR(5)}`);
  });
});