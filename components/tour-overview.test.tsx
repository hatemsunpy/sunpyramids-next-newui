import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TourOverview } from "@/components/tour/TourOverview";
import type { Tour } from "@/types/api";

afterEach(cleanup);

function tourWithDestinations(destinations: Tour["destinations"]): Tour {
  return { destinations };
}

describe("tour overview quick facts", () => {
  it("preserves the existing live two-destination count under the requested Cities label", () => {
    render(
      <TourOverview
        tour={tourWithDestinations([
          { id: 1, slug: "egypt", name: "Egypt", title: "Egypt", global: true, enabled: true },
          { id: 2, slug: "jordan", name: "Jordan", title: "Jordan", global: false, enabled: true, featured: true },
        ])}
      />,
    );
    expect(screen.getByText("Cities")).toBeInTheDocument();
    expect(screen.getByText("2 Cities")).toBeInTheDocument();
    expect(screen.queryByText("Egypt")).not.toBeInTheDocument();
    expect(screen.queryByText("Jordan")).not.toBeInTheDocument();
  });

  it("uses singular City phrasing for a single counted destination", () => {
    render(
      <TourOverview
        tour={tourWithDestinations([
          { id: 2, slug: "jordan", name: "Jordan", title: "Jordan", global: false, enabled: true, featured: true },
        ])}
      />,
    );
    expect(screen.getByText("1 City")).toBeInTheDocument();
  });
});