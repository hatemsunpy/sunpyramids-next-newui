import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SectionHeading } from "@/components/SectionHeading";
import { homeCopy } from "@/lib/home-copy";

afterEach(cleanup);

describe("SectionHeading", () => {
  it("renders the eyebrow suphead pill above the title", () => {
    const { container } = render(
      <SectionHeading align="center" eyebrow="Best Tours to Egypt" title="Popular Distination" />,
    );

    const eyebrow = screen.getByText("Best Tours to Egypt");
    expect(eyebrow).toHaveClass("section-heading-eyebrow");

    const heading = screen.getByRole("heading", { level: 2, name: "Popular Distination" });
    expect(eyebrowPrecedesHeading(eyebrow, heading)).toBe(true);
    expect(container.querySelectorAll(".section-heading-eyebrow")).toHaveLength(1);
  });

  it("does not render an eyebrow pill when the prop is omitted", () => {
    const { container } = render(<SectionHeading title="Our Travel Blogs" />);

    expect(container.querySelector(".section-heading-eyebrow")).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Our Travel Blogs" })).toBeInTheDocument();
  });
});

describe("homeCopy popularEyebrow", () => {
  it("exposes the approved English suphead copy", () => {
    expect(homeCopy("en").popularEyebrow).toBe("Best Tours to Egypt");
  });

  it("uses the locale dictionary for localized suphead copy", () => {
    expect(homeCopy("fr").popularEyebrow).toBe("Meilleurs circuits en Égypte");
    expect(homeCopy("de").popularEyebrow).toBe("Beste Touren nach Ägypten");
  });
});

function eyebrowPrecedesHeading(eyebrow: HTMLElement, heading: HTMLElement): boolean {
  return Boolean(eyebrow.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING);
}
