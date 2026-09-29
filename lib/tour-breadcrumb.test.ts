import { describe, expect, it } from "vitest";
import { tourBreadcrumbCategories } from "./tour-breadcrumb";
import type { Tour, TripTaxonomy } from "@/types/api";

const taxonomy: Pick<TripTaxonomy, "allCategories"> = {
  allCategories: [
    { id: 10, title: "Parent A", slug: "parent-a", parent_id: null },
    { id: 11, title: "Child A", slug: "child-a", parent_id: 10 },
    { id: 20, title: "Parent B", slug: "parent-b", parent_id: null },
    { id: 21, title: "Child B", slug: "child-b", parent_id: 20 },
  ],
};

describe("tourBreadcrumbCategories", () => {
  it("resolves a tour's parent and child from the API taxonomy", () => {
    const tour: Tour = { categories: [{ id: 11, title: "Child A", slug: "child-a" }] };
    expect(tourBreadcrumbCategories(tour, taxonomy)).toEqual([
      { label: "Parent A", slug: "parent-a" },
      { label: "Child A", slug: "child-a" },
    ]);
  });

  it("prefers the deeper assigned category and preserves API order for unrelated ties", () => {
    const tour: Tour = {
      categories: [
        { id: 10, title: "Parent A", slug: "parent-a" },
        { id: 21, title: "Child B", slug: "child-b" },
        { id: 11, title: "Child A", slug: "child-a" },
      ],
    };
    expect(tourBreadcrumbCategories(tour, taxonomy)).toEqual([
      { label: "Parent B", slug: "parent-b" },
      { label: "Child B", slug: "child-b" },
    ]);
  });

  it("shows the assigned category when taxonomy cannot resolve its parent", () => {
    const tour: Tour = { categories: [{ id: 11, title: "Child A", slug: "child-a" }] };
    expect(tourBreadcrumbCategories(tour, { allCategories: [] })).toEqual([
      { label: "Child A", slug: "child-a" },
    ]);
  });

  it("returns no category when the tour has no assignment", () => {
    expect(tourBreadcrumbCategories({ categories: [] }, taxonomy)).toEqual([]);
  });
});
