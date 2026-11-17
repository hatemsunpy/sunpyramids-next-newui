import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { TripsFilterSidebar } from "@/components/TripsFilterSidebar";
import type { Locale, TripTaxonomy } from "@/types/api";

// Phase 2 propagation + Duration pill tests. Verifies the actual hrefs the
// sidebar renders, so pagination/filter/pill/clear-all URL contracts are
// asserted against real markup. Fully offline.

const taxonomy: TripTaxonomy = {
  allCategories: [
    { id: 1, name: "Day Tour", title: "Day Tour", slug: "day-tour" },
    { id: 3, name: "Multi Days Tours", title: "Multi Days Tours", slug: "multi-days-tours" },
    { id: 17, name: "Nile Cruises", title: "Nile Cruises", slug: "nile-cruises" },
    { id: 13, name: "One Day Tours", title: "One Day Tours", slug: "one-day-tours", parent_id: 1 },
    { id: 23, name: "Shore Excursions", title: "Shore Excursions", slug: "shore-excursions", parent_id: 1 },
    { id: 2, name: "Luxury Nile Cruise", title: "Luxury Nile Cruise", slug: "luxury-nile-cruise", parent_id: 17 },
    { id: 53, name: "Special Offers", title: "Special Offers", slug: "special-offers" },
  ],
  rootCategories: [
    { id: 1, name: "Day Tour", title: "Day Tour", slug: "day-tour" },
    { id: 3, name: "Multi Days Tours", title: "Multi Days Tours", slug: "multi-days-tours" },
    { id: 17, name: "Nile Cruises", title: "Nile Cruises", slug: "nile-cruises" },
  ],
  childCategories: [
    { id: 13, name: "One Day Tours", title: "One Day Tours", slug: "one-day-tours", parent_id: 1 },
    { id: 23, name: "Shore Excursions", title: "Shore Excursions", slug: "shore-excursions", parent_id: 1 },
    { id: 2, name: "Luxury Nile Cruise", title: "Luxury Nile Cruise", slug: "luxury-nile-cruise", parent_id: 17 },
  ],
  destinations: [
    { id: 11, title: "Cairo Tours", slug: "cairo" },
    { id: 12, title: "Luxor Tours", slug: "luxor" },
    { id: 13, title: "Aswan Tours", slug: "aswan" },
  ],
  counts: { "day-tour": 316, "multi-days-tours": 100, "nile-cruises": 70, "shore-excursions": 45, "special-offers": 8 },
  available: true,
};

vi.mock("next/link", () => ({
  default: (props: { href: string; children: React.ReactNode } & Record<string, unknown>) =>
    createElement("a", { ...props, href: props.href }, props.children),
}));

afterEach(() => {
  cleanup();
});

function activeLinkWithLabel(label: string) {
  return screen.getAllByTitle(label).map((el) => el.getAttribute("href"))[0];
}

function tourTypeLink(sidebar: HTMLElement, slug: string) {
  return within(sidebar).getAllByRole("link").find((link) => link.getAttribute("href")?.includes(`main=${slug}`));
}

describe("TripsFilterSidebar — complete Tours Type filter", () => {
  it("renders the five API-backed tour types in the desktop sidebar", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{}} />);
    const sidebar = screen.getByRole("complementary", { name: /filter tours/i });

    expect(within(sidebar).getByRole("button", { name: "Tours Type" })).toBeTruthy();
    [
      ["day-tour", "Day Tour"],
      ["multi-days-tours", "Multi Days Tours"],
      ["nile-cruises", "Nile Cruises"],
      ["shore-excursions", "Shore Excursions"],
      ["special-offers", "Special Offers"],
    ].forEach(([slug, label]) => {
      expect(tourTypeLink(sidebar, slug)?.textContent).toContain(label);
    });
  });

  it("renders the backend count metadata for every tour type", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{}} />);
    const sidebar = screen.getByRole("complementary", { name: /filter tours/i });

    expect(tourTypeLink(sidebar, "day-tour")?.textContent).toContain("316");
    expect(tourTypeLink(sidebar, "shore-excursions")?.textContent).toContain("45");
    expect(tourTypeLink(sidebar, "special-offers")?.textContent).toContain("8");
  });

  it("initializes the selected type from the committed main query", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ main: "shore-excursions" }} />);
    const sidebar = screen.getByRole("complementary", { name: /filter tours/i });
    expect(within(sidebar).getByText("Shore Excursions").closest("a")).toHaveAttribute("aria-current", "true");
  });

  it("preserves existing filters and resets pagination when changing type", () => {
    render(
      <TripsFilterSidebar
        taxonomy={taxonomy}
        locale="en"
        active={{ destination: "aswan", days: 5, page: 9 }}
      />,
    );
    const sidebar = screen.getByRole("complementary", { name: /filter tours/i });
    const href = tourTypeLink(sidebar, "special-offers")?.getAttribute("href") ?? "";

    expect(href).toContain("main=special-offers");
    expect(href).toContain("destination=aswan");
    expect(href).toContain("days=5");
    expect(href).not.toContain("page=");
  });

  it("does not duplicate Shore Excursions in Experience Categories", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{}} />);
    const sidebar = screen.getByRole("complementary", { name: /filter tours/i });
    expect(within(sidebar).getAllByText("Shore Excursions")).toHaveLength(1);
  });
});

describe("TripsFilterSidebar — Multi-Country", () => {
  const multiCountryTaxonomy: TripTaxonomy = {
    ...taxonomy,
    allCategories: [
      ...taxonomy.allCategories,
      { id: 1001, title: "Multi-Country tour packages", slug: "middle-east-tours" },
      { id: 1002, title: "Egypt and Jordan", slug: "egypt-and-jordan-tour-packages", parent_id: 1001 },
    ],
  };

  it("shows the parent and its live children when the facet count omits the parent", () => {
    render(<TripsFilterSidebar taxonomy={multiCountryTaxonomy} />);
    const sidebar = within(screen.getByRole("complementary", { name: /filter tours/i }));
    const types = within(sidebar.getByRole("button", { name: "Tours Type" }).parentElement!);
    const destinations = within(sidebar.getByRole("button", { name: "Destinations" }).parentElement!);

    expect(types.getByRole("link", { name: "Multi-Country" })).toHaveAttribute("href", "/trips?main=middle-east-tours");
    expect(destinations.getByRole("link", { name: "Egypt and Jordan" })).toHaveAttribute("href", "/trips?category=1002");
    expect(destinations.getByRole("link", { name: "Cairo Tours" })).toHaveAttribute("href", "/trips?destination=cairo");
    expect(sidebar.getAllByRole("link", { name: "Egypt and Jordan" })).toHaveLength(1);
  });

  it("keeps the matching type selected and preserves independent filters when choosing a combination", () => {
    render(
      <TripsFilterSidebar
        taxonomy={multiCountryTaxonomy}
        active={{ main: "middle-east-tours", destination: "cairo", days: 7, page: 2 }}
      />,
    );
    const sidebar = within(screen.getByRole("complementary", { name: /filter tours/i }));

    expect(sidebar.getByRole("link", { name: "Multi-Country" })).toHaveAttribute("aria-current", "true");
    expect(sidebar.getByRole("link", { name: "Egypt and Jordan" })).toHaveAttribute(
      "href", "/trips?main=middle-east-tours&destination=cairo&category=1002&days=7",
    );
  });

  it("replaces a selected combination with a country destination while preserving duration", () => {
    render(
      <TripsFilterSidebar
        taxonomy={multiCountryTaxonomy}
        active={{ category: "1002", days: 7, page: 2 }}
      />,
    );
    const sidebar = within(screen.getByRole("complementary", { name: /filter tours/i }));

    expect(sidebar.getByRole("link", { name: "Greece" })).toHaveAttribute("href", "/trips?destination=greece&days=7");
  });
});

describe("TripsFilterSidebar — country destinations", () => {
  it("links each footer country to the Laravel destination filter", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} />);
    const sidebar = within(screen.getByRole("complementary", { name: /filter tours/i }));
    const destinations = within(sidebar.getByRole("button", { name: "Destinations" }).parentElement!);

    for (const country of ["Jordan", "Morocco", "Tunisia", "Turkey", "Greece", "Tanzania"]) {
      expect(destinations.getByRole("link", { name: country })).toHaveAttribute("href", `/trips?destination=${country.toLowerCase()}`);
    }
  });

  it("shows the localized selection and clears it when choosing an API destination", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="es" active={{ destination: "Greece", days: 6 }} />);
    const sidebar = within(screen.getByRole("complementary", { name: /filter tours/i }));

    const greece = sidebar.getByRole("link", { name: "Grecia" });
    expect(greece).toHaveAttribute("aria-current", "true");
    expect(greece).toHaveAttribute("href", "/es/trips?days=6");
    expect(sidebar.getByRole("link", { name: "Cairo Tours" })).toHaveAttribute("href", "/es/trips?destination=cairo&days=6");
  });

  it("switches from an old country keyword link to the exact destination", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} active={{ title: "Jordan" }} />);
    const sidebar = within(screen.getByRole("complementary", { name: /filter tours/i }));

    const jordan = sidebar.getByRole("link", { name: "Jordan" });
    expect(jordan).not.toHaveAttribute("aria-current");
    expect(jordan).toHaveAttribute("href", "/trips?destination=jordan");
  });
});

describe("TripsFilterSidebar — days propagation through filter links", () => {
  it("days=5 + add destination → days preserved in the destination link", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ days: 5 }} />);
    const aswan = screen.getAllByRole("link", { name: /aswan tours/i })
      .map((el) => el.getAttribute("href"))
      .find((h) => h?.includes("destination=aswan"));
    expect(aswan).toContain("days=5");
    expect(aswan).toContain("destination=aswan");
  });

  it("days=5 + add main → days preserved in the category link", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ days: 5 }} />);
    const nile = screen.getAllByRole("link", { name: /nile cruises/i })
      .map((el) => el.getAttribute("href"))
      .find((h) => h?.includes("main=nile-cruises"));
    expect(nile).toContain("days=5");
    expect(nile).toContain("main=nile-cruises");
  });

  it("days=5 + main + destination, remove destination → days and main preserved", () => {
    render(
      <TripsFilterSidebar
        taxonomy={taxonomy}
        locale="en"
        active={{ days: 5, main: "nile-cruises", destination: "aswan" }}
      />,
    );
    const removeDest = activeLinkWithLabel('Remove filter "Aswan Tours"');
    expect(removeDest).toContain("days=5");
    expect(removeDest).toContain("main=nile-cruises");
    expect(removeDest).not.toContain("destination=aswan");
  });

  it("days=5 + main, remove main → days preserved", () => {
    render(
      <TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ days: 5, main: "nile-cruises" }} />,
    );
    const removeMain = activeLinkWithLabel('Remove filter "Nile Cruises"');
    expect(removeMain).toContain("days=5");
    expect(removeMain).not.toContain("main=");
  });

  it("invalid days (absent from active state) → generated filter URLs do not propagate days", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{}} />);
    const aswan = screen.getAllByRole("link", { name: /aswan tours/i })
      .map((el) => el.getAttribute("href"))
      .find((h) => h?.includes("destination=aswan"));
    expect(aswan).not.toContain("days=");
  });
});

describe("TripsFilterSidebar — Duration active pill", () => {
  it("days=1 → visible '1 Day' pill, removal strips only days", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ days: 1, destination: "aswan" }} />);
    const pill = screen.getByTitle('Remove filter "1 Day"');
    expect(pill.textContent).toContain("1 Day");
    const href = pill.getAttribute("href") ?? "";
    expect(href).toContain("destination=aswan");
    expect(href).not.toContain("days=");
  });

  it("days=5 → visible '5 Days' pill", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ days: 5 }} />);
    expect(screen.getByTitle('Remove filter "5 Days"').textContent).toContain("5 Days");
  });

  it("days=5 canonical from 05 via active state (sidebar renders normalized value)", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ days: 5 }} />);
    expect(screen.getByTitle('Remove filter "5 Days"')).toBeTruthy();
    expect(screen.queryByTitle('Remove filter "05 Days"')).toBeNull();
  });

  it("no days → no duration pill", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ destination: "aswan" }} />);
    expect(screen.queryByTitle(/Remove filter "\d+ Days?"/)).toBeNull();
  });

  it("days=1 unqualified → '1 Day' pill only; no fabricated 'Day Tour' pill without explicit main", () => {
    render(<TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ days: 1 }} />);
    expect(screen.getByTitle('Remove filter "1 Day"')).toBeTruthy();
    expect(screen.queryByTitle('Remove filter "Day Tour"')).toBeNull();
  });

  it("remove Duration from days+destination+main → days removed only, others preserved", () => {
    render(
      <TripsFilterSidebar
        taxonomy={taxonomy}
        locale="en"
        active={{ days: 5, destination: "aswan", main: "nile-cruises" }}
      />,
    );
    const href = activeLinkWithLabel('Remove filter "5 Days"');
    expect(href).toContain("destination=aswan");
    expect(href).toContain("main=nile-cruises");
    expect(href).not.toContain("days=");
  });

  it("Clear All with days → /trips without any params (days included)", () => {
    render(
      <TripsFilterSidebar
        taxonomy={taxonomy}
        locale="en"
        active={{ days: 5, destination: "aswan", main: "nile-cruises" }}
      />,
    );
    const clearAll = screen.getAllByRole("link", { name: /clear all/i })
      .map((el) => el.getAttribute("href"))
      .find((h) => h === "/trips" || h?.startsWith("/trips?") === false);
    expect(clearAll).toBe("/trips");
  });

  it("active filter count badge includes days", () => {
    render(
      <TripsFilterSidebar taxonomy={taxonomy} locale="en" active={{ days: 5, main: "nile-cruises" }} />,
    );
    const badge = screen.getByText("2", { selector: ".badge" });
    expect(badge).toBeTruthy();
  });
});

describe("TripsFilterSidebar — localized Duration pill", () => {
  const locales: [Locale, string, string][] = [
    ["fr", "1 Jour", "5 Jours"],
    ["de", "1 Tag", "5 Tage"],
    ["it", "1 Giorno", "5 Giorni"],
    ["pt", "1 Dia", "5 Dias"],
    ["es", "1 Día", "5 Días"],
    ["zh", "1天", "5天"],
  ];

  it.each(locales)("%s → localized pill labels", (locale, one, five) => {
    const { unmount } = render(<TripsFilterSidebar taxonomy={taxonomy} locale={locale} active={{ days: 1 }} />);
    expect(screen.getByTitle(`Remove filter "${one}"`)).toBeTruthy();
    unmount();

    render(<TripsFilterSidebar taxonomy={taxonomy} locale={locale} active={{ days: 5 }} />);
    expect(screen.getByTitle(`Remove filter "${five}"`)).toBeTruthy();
  });
});
