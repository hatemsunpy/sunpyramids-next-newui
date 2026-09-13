import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { TripsPage } from "@/components/TripsPage";
import type { ApiPage, Locale, Tour, TripTaxonomy } from "@/types/api";

// Phase 2 pagination tests: /trips pagination links must preserve the active
// days constraint. Verifies the actual hrefs rendered for page navigation.

const taxonomy: TripTaxonomy = {
  allCategories: [
    { id: 1, name: "Day Tour", title: "Day Tour", slug: "day-tour" },
    { id: 17, name: "Nile Cruises", title: "Nile Cruises", slug: "nile-cruises" },
  ],
  rootCategories: [
    { id: 1, name: "Day Tour", title: "Day Tour", slug: "day-tour" },
    { id: 17, name: "Nile Cruises", title: "Nile Cruises", slug: "nile-cruises" },
  ],
  childCategories: [],
  destinations: [
    { id: 13, title: "Aswan Tours", slug: "aswan" },
  ],
  counts: {},
  available: true,
};

const page: ApiPage = { title: "Egypt Tours" };
const tours: Tour[] = [
  { id: 1, title: "Cairo Day Tour", slug: "cairo-day-tour" },
  { id: 2, title: "Luxor Day Tour", slug: "luxor-day-tour" },
];
const meta = { from: 1, to: 24, total: 48, lastPage: 2 };

vi.mock("next/link", () => ({
  default: (props: { href: string; children: React.ReactNode } & Record<string, unknown>) =>
    createElement("a", { ...props, href: props.href }, props.children),
}));

afterEach(() => {
  cleanup();
});

function page2Href() {
  const next = screen.getByRole("link", { name: /next/i });
  return next.getAttribute("href") ?? "";
}

describe("TripsPage pagination — days propagation", () => {
  it("days=5 → page 2 preserves days=5", () => {
    render(
      <TripsPage page={page} tours={tours} taxonomy={taxonomy} locale="en" active={{ days: 5, page: 1 }} meta={meta} />,
    );
    const href = page2Href();
    expect(href).toContain("days=5");
    expect(href).toContain("page=2");
  });

  it("days=5 + destination → page 2 preserves both", () => {
    render(
      <TripsPage
        page={page}
        tours={tours}
        taxonomy={taxonomy}
        locale="en"
        active={{ days: 5, destination: "aswan", page: 1 }}
        meta={meta}
      />,
    );
    const href = page2Href();
    expect(href).toContain("days=5");
    expect(href).toContain("destination=aswan");
    expect(href).toContain("page=2");
  });

  it("days=5 + main + destination → page 2 preserves all", () => {
    render(
      <TripsPage
        page={page}
        tours={tours}
        taxonomy={taxonomy}
        locale="en"
        active={{ days: 5, main: "nile-cruises", destination: "aswan", page: 1 }}
        meta={meta}
      />,
    );
    const href = page2Href();
    expect(href).toContain("days=5");
    expect(href).toContain("main=nile-cruises");
    expect(href).toContain("destination=aswan");
    expect(href).toContain("page=2");
  });

  it("no days → pagination unchanged (no days param generated)", () => {
    render(
      <TripsPage page={page} tours={tours} taxonomy={taxonomy} locale="en" active={{ page: 1 }} meta={meta} />,
    );
    expect(page2Href()).not.toContain("days=");
  });

  it("existing filters without days → pagination preserves title as before (regression)", () => {
    render(
      <TripsPage
        page={page}
        tours={tours}
        taxonomy={taxonomy}
        locale="en"
        active={{ title: "cairo", page: 1 }}
        meta={meta}
      />,
    );
    expect(page2Href()).toContain("title=cairo");
    expect(page2Href()).toContain("page=2");
  });
});