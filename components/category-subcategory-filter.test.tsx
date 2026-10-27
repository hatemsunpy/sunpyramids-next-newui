import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CategorySubcategoryFilter } from "@/components/CategorySubcategoryFilter";
import type { ApiPage } from "@/types/api";

const children: ApiPage[] = [
  { id: 32, title: "4 days superior cruise", slug: "4-days-superior-cruise" },
  { id: 33, title: "5 days superior cruise", slug: "5-days-superior-cruise" },
  { id: 34, title: "7 days superior cruise", slug: "7-days-superior-cruise" },
];

const journeyChildren: ApiPage[] = [
  { id: 51, title: "Egypt and Jordan Tour Packages", slug: "egypt-and-jordan-tour-packages" },
  { id: 52, title: "Egypt and Turkey Tour Packages", slug: "egypt-and-turkey-tour-packages" },
  { id: 53, title: "Egypt and Morocco Tour Packages", slug: "egypt-and-morocco-tour-packages" },
  { id: 54, title: "Egypt and Tunisia Tour Packages", slug: "egypt-and-tunisia-tour-packages" },
  { id: 55, title: "Egypt, Jordan and Turkey Tour Packages", slug: "egypt-jordan-turkey-tours" },
];

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

afterEach(() => {
  cleanup();
  mockSearchParams = new URLSearchParams();
});

const journeyHrefs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLAnchorElement>("a.mc-journey-card")).map((card) => card.getAttribute("href"));

describe("CategorySubcategoryFilter", () => {
  it("keeps rich-text CMS links as readable text inside a journey card", () => {
    render(
      <CategorySubcategoryFilter
        variant="journeys"
        childrenCategories={[{ id: 9001, slug: "sample-journey", title: "Sample journey", description: '<p>Discover <a href="/other">history &amp; culture</a> and Jordan&#8217;s sights.</p>' }]}
        basePath="/egypt-tours/sample-collection"
      />
    );

    const card = screen.getByRole("link", { name: "Sample journey" });
    expect(card.textContent).toContain("Discover history & culture and Jordan’s sights.");
    expect(card.querySelector("a")).toBeNull();
    expect(card.getAttribute("href")).toBe("/egypt-tours/sample-journey");
  });

  it("renders null if no children categories", () => {
    const { container } = render(
      <CategorySubcategoryFilter
        childrenCategories={[]}
        basePath="/egypt-tours/nile-cruises/superior-nile-cruise"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders All pill and each child category button", () => {
    render(
      <CategorySubcategoryFilter
        childrenCategories={children}
        basePath="/egypt-tours/nile-cruises/superior-nile-cruise"
      />
    );

    expect(screen.getByText("All")).toBeDefined();
    expect(screen.getByText("4 days superior cruise")).toBeDefined();
    expect(screen.getByText("5 days superior cruise")).toBeDefined();
    expect(screen.getByText("7 days superior cruise")).toBeDefined();
  });

  it("marks the active subcategory properly", () => {
    render(
      <CategorySubcategoryFilter
        childrenCategories={children}
        basePath="/egypt-tours/nile-cruises/superior-nile-cruise"
        activeSub="4-days-superior-cruise"
      />
    );

    const activeLink = screen.getByText("4 days superior cruise").closest("a");
    expect(activeLink?.className).toContain("is-active");

    const allLink = screen.getByText("All").closest("a");
    expect(allLink?.className).not.toContain("is-active");
  });

  it("links journey cards directly to canonical combinations, ignoring legacy parent queries", () => {
    mockSearchParams = new URLSearchParams("sub=egypt-and-jordan-tour-packages&order=price%2Casc&page=3");
    render(
      <CategorySubcategoryFilter
        variant="journeys"
        childrenCategories={journeyChildren}
        basePath="/egypt-tours/middle-east-tours"
        activeSub="egypt-jordan-turkey-tours"
      />
    );

    expect(screen.getByRole("link", { name: "Egypt and Jordan Tour Packages" }).getAttribute("href")).toBe("/egypt-tours/egypt-and-jordan-tour-packages");
    expect(screen.getByRole("link", { name: "Egypt and Turkey Tour Packages" }).getAttribute("href")).toBe("/egypt-tours/egypt-and-turkey-tour-packages");
    expect(screen.getByRole("link", { name: "Egypt and Morocco Tour Packages" }).getAttribute("href")).toBe("/egypt-tours/egypt-and-morocco-tour-packages");
    expect(screen.getByRole("link", { name: "Egypt and Tunisia Tour Packages" }).getAttribute("href")).toBe("/egypt-tours/egypt-and-tunisia-tour-packages");
    const triple = screen.getByRole("link", { name: "Egypt, Jordan and Turkey Tour Packages" });
    expect(triple.getAttribute("href")).toBe("/egypt-tours/egypt-jordan-turkey-tours");
    expect(triple.textContent).toContain("Explore tours");
    expect(screen.queryByText("Selected · Clear selection")).toBeNull();
  });

  it("prefixes direct journey links with the active locale", () => {
    render(
      <CategorySubcategoryFilter
        variant="journeys"
        childrenCategories={journeyChildren}
        basePath="/fr/egypt-tours/middle-east-tours"
        locale="fr"
        activeSub="egypt-and-jordan-tour-packages"
      />
    );

    expect(screen.getByRole("link", { name: "Egypt and Jordan Tour Packages" }).getAttribute("href")).toBe("/fr/egypt-tours/egypt-and-jordan-tour-packages");
    expect(screen.getByRole("link", { name: "Egypt, Jordan and Turkey Tour Packages" }).getAttribute("href")).toBe("/fr/egypt-tours/egypt-jordan-turkey-tours");
  });

  it("moves the triple-country combination to the last journey card without reordering others", () => {
    const apiOrder: ApiPage[] = [
      journeyChildren[4],
      journeyChildren[2],
      journeyChildren[0],
      journeyChildren[3],
      journeyChildren[1],
    ];
    const { container } = render(
      <CategorySubcategoryFilter
        variant="journeys"
        childrenCategories={apiOrder}
        basePath="/egypt-tours/middle-east-tours"
      />
    );

    const firstHrefs = journeyHrefs(container);
    expect(firstHrefs).toEqual([
      "/egypt-tours/egypt-and-morocco-tour-packages",
      "/egypt-tours/egypt-and-jordan-tour-packages",
      "/egypt-tours/egypt-and-tunisia-tour-packages",
      "/egypt-tours/egypt-and-turkey-tour-packages",
      "/egypt-tours/egypt-jordan-turkey-tours",
    ]);
    expect(apiOrder.map((child) => child.slug)).toEqual([
      "egypt-jordan-turkey-tours",
      "egypt-and-morocco-tour-packages",
      "egypt-and-jordan-tour-packages",
      "egypt-and-tunisia-tour-packages",
      "egypt-and-turkey-tour-packages",
    ]);

    cleanup();
    const second = render(
      <CategorySubcategoryFilter
        variant="journeys"
        childrenCategories={apiOrder}
        basePath="/egypt-tours/middle-east-tours"
      />
    );
    expect(journeyHrefs(second.container)).toEqual(firstHrefs);
  });

  it("omits the All journeys pill for the journeys variant while keeping the five cards", () => {
    render(
      <CategorySubcategoryFilter
        variant="journeys"
        childrenCategories={journeyChildren}
        basePath="/egypt-tours/middle-east-tours"
        activeSub="egypt-jordan-turkey-tours"
      />
    );

    expect(screen.queryByText("All journeys")).toBeNull();
    expect(screen.getByRole("link", { name: "Egypt, Jordan and Turkey Tour Packages" })).toBeDefined();
  });

  it("keeps default pills as query-filter toggles that reset page", () => {
    mockSearchParams = new URLSearchParams("order=price%2Casc&page=2");
    render(
      <CategorySubcategoryFilter
        childrenCategories={children}
        basePath="/egypt-tours/nile-cruises/superior-nile-cruise"
        activeSub="4-days-superior-cruise"
        currentOrder="price,asc"
      />
    );

    expect(screen.getByRole("link", { name: "All" }).getAttribute("href")).toBe("/egypt-tours/nile-cruises/superior-nile-cruise?order=price%2Casc");
    expect(screen.getByRole("link", { name: "4 days superior cruise" }).getAttribute("href")).toBe("/egypt-tours/nile-cruises/superior-nile-cruise?order=price%2Casc");
    expect(screen.getByRole("link", { name: "5 days superior cruise" }).getAttribute("href")).toBe("/egypt-tours/nile-cruises/superior-nile-cruise?order=price%2Casc&sub=5-days-superior-cruise");
  });
});
