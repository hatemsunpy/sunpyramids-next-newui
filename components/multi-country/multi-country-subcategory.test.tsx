import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  isMultiCountryParent,
  isMultiCountrySubcategory,
  subcategoryOrderHref,
} from "@/components/multi-country/routes";
import { MultiCountrySubcategoryToolbar } from "@/components/multi-country/MultiCountrySubcategoryToolbar";

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

afterEach(() => {
  cleanup();
  mockSearchParams = new URLSearchParams();
});

describe("multi-country route classifier", () => {
  it("recognizes the five canonical journey subcategories", () => {
    for (const slug of [
      "egypt-and-jordan-tour-packages",
      "egypt-and-turkey-tour-packages",
      "egypt-and-morocco-tour-packages",
      "egypt-and-tunisia-tour-packages",
      "egypt-jordan-turkey-tours",
    ]) {
      expect(isMultiCountrySubcategory([slug])).toBe(true);
    }
  });

  it("rejects the parent, other categories and nested paths", () => {
    expect(isMultiCountryParent(["middle-east-tours"])).toBe(true);
    expect(isMultiCountrySubcategory(["middle-east-tours"])).toBe(false);
    expect(isMultiCountrySubcategory(["nile-cruises"])).toBe(false);
    expect(isMultiCountrySubcategory(["middle-east-tours", "egypt-and-jordan-tour-packages"])).toBe(false);
    expect(isMultiCountryParent(["egypt-and-jordan-tour-packages"])).toBe(false);
  });
});

describe("subcategoryOrderHref", () => {
  it("applies a non-default order while resetting pagination", () => {
    expect(subcategoryOrderHref("/egypt-tours/egypt-and-jordan-tour-packages", "page=2", "price,asc"))
      .toBe("/egypt-tours/egypt-and-jordan-tour-packages?order=price%2Casc");
  });

  it("preserves unrelated params and drops the default order", () => {
    expect(subcategoryOrderHref("/p", "page=2&order=price%2Casc&flag=x", "display_order,asc"))
      .toBe("/p?flag=x");
  });

  it("returns the bare path when nothing remains", () => {
    expect(subcategoryOrderHref("/p", "page=3", "display_order,asc")).toBe("/p");
  });
});

describe("MultiCountrySubcategoryToolbar", () => {
  it("renders the localized heading, meta-only count and parent return link", () => {
    mockSearchParams = new URLSearchParams("order=price%2Casc");
    const { container } = render(
      <MultiCountrySubcategoryToolbar
        basePath="/egypt-tours/egypt-and-jordan-tour-packages"
        currentOrder="price,asc"
        from={1}
        to={3}
        total={5}
      />
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Egypt Multi-Country Tour Packages" });
    expect(heading.id).toBe("mc-results");
    expect(screen.getByText("Showing 1–3 of 5 experiences")).toBeDefined();
    expect(screen.getByRole("link", { name: "All journeys" }).getAttribute("href")).toBe("/egypt-tours/middle-east-tours");
    expect(screen.getByRole("button", { name: "Sort by" })).toBeDefined();
    expect(container.querySelector<HTMLElement>(".search-select-value")?.textContent).toBe("Lowest Price");
  });

  it("localizes the toolbar and prefixes the return link", () => {
    render(
      <MultiCountrySubcategoryToolbar
        basePath="/fr/egypt-tours/egypt-and-jordan-tour-packages"
        locale="fr"
        from={1}
        to={2}
        total={2}
      />
    );

    expect(screen.getByRole("heading", { name: "Explorer la collection" })).toBeDefined();
    expect(screen.getByText("Affichage de 1–2 sur 2 expériences")).toBeDefined();
    expect(screen.getByRole("link", { name: "Tous les voyages" }).getAttribute("href")).toBe("/fr/egypt-tours/middle-east-tours");
    expect(screen.getByRole("button", { name: "Trier par" })).toBeDefined();
  });

  it("hides count and sort when the API meta reports no experiences", () => {
    const { container } = render(
      <MultiCountrySubcategoryToolbar basePath="/egypt-tours/egypt-and-turkey-tour-packages" from={0} to={0} total={0} />
    );

    expect(screen.getByRole("heading", { name: "Egypt Multi-Country Tour Packages" })).toBeDefined();
    expect(screen.queryByText(/Showing/)).toBeNull();
    expect(container.querySelector(".mc-sub-sort")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sort by" })).toBeNull();
    expect(screen.getByRole("link", { name: "All journeys" })).toBeDefined();
  });
});
