import { describe, expect, it } from "vitest";
import { buildEgyptToursMenu } from "./egypt-tours-menu";
import type { TripTaxonomy } from "@/types/api";

function taxonomyFixture(): TripTaxonomy {
  return {
    allCategories: [
      { id: 1, title: "One Day Tours", slug: "one-day-tours" },
      { id: 3, title: "Multi Days Tours", slug: "multi-days-tours" },
      { id: 17, title: "Nile Cruises", slug: "nile-cruises" },
      { id: 5, title: "Desert Tours", slug: "desert-tours", parent_id: 3 },
      { id: 6, title: "Pyramids Tours", slug: "pyramids-tours", parent_id: 3 },
      { id: 2, title: "Luxury Nile Cruise", slug: "luxury-nile-cruise", parent_id: 17 },
    ],
    rootCategories: [
      { id: 1, title: "One Day Tours", slug: "one-day-tours" },
      { id: 3, title: "Multi Days Tours", slug: "multi-days-tours" },
    ],
    childCategories: [
      { id: 5, title: "Desert Tours", slug: "desert-tours", parent_id: 3 },
      { id: 6, title: "Pyramids Tours", slug: "pyramids-tours", parent_id: 3 },
      { id: 2, title: "Luxury Nile Cruise", slug: "luxury-nile-cruise", parent_id: 17 },
    ],
    destinations: [
      { id: 11, title: "Cairo Tours", slug: "cairo" },
      { id: 12, title: "Luxor Tours", slug: "luxor" },
      { id: 13, name: "Sharm Name Fallback", slug: "sharm-el-sheikh" },
    ],
    counts: {},
    available: true,
  };
}

describe("buildEgyptToursMenu", () => {
  it("reuses destinations for One Day children in backend order", () => {
    const menu = buildEgyptToursMenu(taxonomyFixture());
    expect(menu.oneDay).toEqual([
      { slug: "cairo", label: "Cairo Tours", title: "Cairo Tours" },
      { slug: "luxor", label: "Luxor Tours", title: "Luxor Tours" },
      { slug: "sharm-el-sheikh", label: "Sharm Name Fallback" },
    ]);
  });

  it("scopes Multi Days children to the live multi-days-tours id only", () => {
    const menu = buildEgyptToursMenu(taxonomyFixture());
    expect(menu.multiDays).toEqual([
      { slug: "desert-tours", label: "Desert Tours", title: "Desert Tours" },
      { slug: "pyramids-tours", label: "Pyramids Tours", title: "Pyramids Tours" },
    ]);
  });

  it("uses title, name, then slug as the child label source", () => {
    const taxonomy = taxonomyFixture();
    taxonomy.destinations = [
      { slug: "taba", title: "  Taba Tours  ", name: "Ignored Name" },
      { slug: "dahab", name: "Dahab Tours" },
      { slug: "siwa" },
    ];
    const menu = buildEgyptToursMenu(taxonomy);
    expect(menu.oneDay).toEqual([
      { slug: "taba", label: "Taba Tours", title: "Taba Tours" },
      { slug: "dahab", label: "Dahab Tours" },
      { slug: "siwa", label: "siwa" },
    ]);
  });

  it("preserves backend featured images for child previews", () => {
    const taxonomy = taxonomyFixture();
    taxonomy.destinations = [
      { slug: "cairo", title: "Cairo Tours", featured_image: "https://cdn.example/cairo.jpg" },
    ];
    taxonomy.childCategories = [
      { id: 5, title: "Desert Tours", slug: "desert-tours", parent_id: 3, featured_image: "https://cdn.example/desert.jpg" },
    ];

    expect(buildEgyptToursMenu(taxonomy)).toEqual({
      oneDay: [{ slug: "cairo", label: "Cairo Tours", title: "Cairo Tours", featured_image: "https://cdn.example/cairo.jpg" }],
      multiDays: [{ slug: "desert-tours", label: "Desert Tours", title: "Desert Tours", featured_image: "https://cdn.example/desert.jpg" }],
    });
  });

  it("drops entries without a usable slug", () => {
    const taxonomy = taxonomyFixture();
    taxonomy.destinations = [
      { title: "No Slug" } as never,
      { slug: "  ", title: "Blank Slug" },
      { slug: "  alexandria  ", title: "Alexandria Tours" },
    ];
    expect(buildEgyptToursMenu(taxonomy).oneDay).toEqual([
      { slug: "alexandria", label: "Alexandria Tours", title: "Alexandria Tours" },
    ]);
  });

  it("returns empty Multi Days when the root id is missing (no invented children)", () => {
    const taxonomy = taxonomyFixture();
    taxonomy.allCategories = taxonomy.allCategories.filter(
      (category) => category.slug !== "multi-days-tours",
    );
    expect(buildEgyptToursMenu(taxonomy).multiDays).toEqual([]);
    // One Day destinations remain unaffected.
    expect(buildEgyptToursMenu(taxonomy).oneDay).toHaveLength(3);
  });

  it("returns empty menu for null taxonomy (header hides child panel)", () => {
    expect(buildEgyptToursMenu(null)).toEqual({ oneDay: [], multiDays: [] });
    expect(buildEgyptToursMenu(undefined)).toEqual({ oneDay: [], multiDays: [] });
  });

  it("does not mutate the input taxonomy", () => {
    const taxonomy = taxonomyFixture();
    const snapshot = JSON.stringify(taxonomy);
    buildEgyptToursMenu(taxonomy);
    expect(JSON.stringify(taxonomy)).toBe(snapshot);
  });
});
