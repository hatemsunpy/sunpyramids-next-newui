import { describe, expect, it } from "vitest";
import { buildSitemapCatalog, catalogGroups, pageSitemapRecords } from "@/lib/sitemap/builders";
import type { SitemapDataset } from "@/lib/sitemap/types";

const dataset: SitemapDataset = {
  pages: [{ key: "home" }],
  tours: Array.from({ length: 6 }, (_, index) => ({ slug: `tour-${index + 1}` })),
  blogs: [{ slug: "post-example" }],
  events: [{ id: 70, slug: "event-example" }],
  categories: [{ id: 10, slug: "category-example" }],
  destinations: [{ slug: "destination-example" }],
  blogCategories: [
    { id: 1, slug: "guide-parent", parent_id: null },
    { id: 2, slug: "guide-child", parent_id: 1 },
  ],
};

describe("sitemap index grouping", () => {
  it("keeps every non-tour family in pages or posts and splits tours into three files", () => {
    const catalog = buildSitemapCatalog(dataset);
    const groups = catalogGroups(catalog);

    expect(groups.map(({ route }) => route)).toEqual([
      "/sitemap-pages.xml",
      "/sitemap-posts.xml",
      "/sitemap-tours-1.xml",
      "/sitemap-tours-2.xml",
      "/sitemap-tours-3.xml",
    ]);
    expect(pageSitemapRecords(catalog).map(({ loc }) => new URL(loc).pathname)).toEqual([
      "/",
      "/egypt-tours/category-example",
      "/egypt-tours/one-day-tours/destination-example",
      "/egypt-travel-guide/guide-parent",
      "/egypt-travel-guide/guide-parent/guide-child",
      "/event/event-example",
    ].sort((a, b) => a.localeCompare(b)));
    expect(catalog.posts.map(({ loc }) => new URL(loc).pathname)).toEqual(["/blog/post-example"]);
    expect(catalog.tourChunks.map((chunk) => chunk.length)).toEqual([2, 2, 2]);
  });
});
