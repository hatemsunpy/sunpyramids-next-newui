import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WhyTravelWithSunPyramids } from "@/components/WhyTravelWithSunPyramids";

afterEach(cleanup);

describe("WhyTravelWithSunPyramids", () => {
  it("renders the approved English trust content as a labelled section", () => {
    const { container } = render(<WhyTravelWithSunPyramids />);

    expect(screen.getByRole("heading", { level: 2, name: /Why travel with Sun Pyramids Tours\?/i })).toBeInTheDocument();
    expect(container.querySelectorAll("article")).toHaveLength(4);
    expect(screen.getByText("100K+ travelers served")).toBeInTheDocument();
    expect(screen.getByText("50+ years of expertise")).toBeInTheDocument();
    expect(screen.getByText("60+ destinations and experiences")).toBeInTheDocument();
    expect(screen.getByText("5.0 rating on Tripadvisor")).toBeInTheDocument();
    expect(container.querySelectorAll('.home-why-travel__underline[aria-hidden="true"]')).toHaveLength(4);
  });

  it("uses the existing locale dictionary for localized homepage copy", () => {
    render(<WhyTravelWithSunPyramids locale="fr" />);

    expect(screen.getByRole("heading", { level: 2, name: /Pourquoi voyager avec Sun Pyramids Tours/i })).toBeInTheDocument();
    expect(screen.getByText("Plus de 100 000 voyageurs accompagnés")).toBeInTheDocument();
  });
});
