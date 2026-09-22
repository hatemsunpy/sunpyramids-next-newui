import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CategorySubcategoryFilter } from "@/components/CategorySubcategoryFilter";
import type { ApiPage } from "@/types/api";

const children: ApiPage[] = [
  { id: 32, title: "4 days superior cruise", slug: "4-days-superior-cruise" },
  { id: 33, title: "5 days superior cruise", slug: "5-days-superior-cruise" },
  { id: 34, title: "7 days superior cruise", slug: "7-days-superior-cruise" },
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
});

describe("CategorySubcategoryFilter", () => {
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
});
