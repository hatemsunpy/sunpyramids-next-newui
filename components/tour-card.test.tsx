import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { TourCard } from "@/components/TourCard";
import { RelatedTours } from "@/components/tour/RelatedTours";
import type { Tour } from "@/types/api";
import { toTourCardData } from "@/lib/tour-card-data";

vi.mock("@/components/CustomerFlows", () => ({
  toggleWishlist: vi.fn(),
}));

vi.mock("@/components/CurrencyProvider", () => ({
  useCurrency: () => ({
    format: (val: number | string) => `$${Number(val).toFixed(2)}`,
    currency: "USD",
  }),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TourCard Special Offer Badge", () => {
  it.each([
    ["expired", "2030-01-01T11:59:59Z"],
    ["at expiry", "2030-01-01T12:00:00Z"],
    ["invalid", "invalid-date"],
  ])("shows only the API base price for an %s deadline, even in a promoted category", (_state, offer_end_date) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00Z"));
    const tour: Tour = {
      title: "Synthetic expired offer", price: 100, offer: 20, offer_end_date,
      categories: [{ id: 53, slug: "special-offers", title: "Special Offers" }],
    };
    const { container } = render(<TourCard tour={tour} locale="en" isSpecialOffer />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.queryByText("$80.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Special Offer")).not.toBeInTheDocument();
    expect(container.querySelector(".tour-card-collection-badge")).toHaveTextContent("Special Offers");
    expect(container.querySelector(".tour-card-price-original")).toBeNull();
    expect(container.querySelector(".offer-countdown")).toBeNull();
  });

  it("keeps the base price when the API disables the discount", () => {
    const { container } = render(<TourCard tour={{ price: 100, offer: 0, offer_end_date: "2030-12-01T00:00:00Z" }} isSpecialOffer />);
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(container.querySelector(".tour-card-price-original")).toBeNull();
    expect(screen.queryByText("Special Offer")).not.toBeInTheDocument();
    expect(screen.getByText("Special Offers")).toBeInTheDocument();
  });

  it("localizes the collection badge from API category membership without inventing a discount", () => {
    render(<TourCard tour={{ price: 100, offer: 0, categories: [{ slug: "special-offers" }] }} locale="fr" />);
    expect(screen.getByText("Offres spéciales")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.queryByText("Offre spéciale")).not.toBeInTheDocument();
  });

  it("restores the base price and removes promotion UI when an open card reaches expiry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
    const { container } = render(<TourCard tour={{ price: 100, offer: 20, offer_end_date: "2030-01-01T00:00:05Z" }} />);
    expect(screen.getByText("$80.00")).toBeInTheDocument();
    expect(screen.getByText("Special Offer")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.queryByText("$80.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Special Offer")).not.toBeInTheDocument();
    expect(container.querySelector(".tour-card-price-original")).toBeNull();
    expect(container.querySelector(".offer-countdown")).toBeNull();
  });

  it("preserves the API expiry through client projection and displays its countdown without changing prices", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
    const tour = toTourCardData({ title: "Synthetic timed offer", price: 100, offer: 10, offer_end_date: "2030-01-03T00:00:00Z" });
    render(<TourCard tour={tour} locale="en" />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("Days")).toBeInTheDocument();
    expect(screen.getByText("$90.00")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("does not render Special Offer badge for a standard tour", () => {
    const tour: Tour = { id: 1, title: "Standard Tour", price: 100 };
    render(<TourCard tour={tour} locale="en" />);
    expect(screen.queryByText("Special Offer")).not.toBeInTheDocument();
    expect(screen.queryByText("Special Offers")).not.toBeInTheDocument();
  });

  it("renders Special Offer badge when isSpecialOffer prop is true", () => {
    const tour: Tour = { id: 2, title: "Promoted Tour", price: 100 };
    render(<TourCard tour={tour} locale="en" isSpecialOffer />);
    expect(screen.getByText("Special Offer")).toBeInTheDocument();
  });

  it("renders Special Offer badge when tour.offer is greater than zero", () => {
    const tour: Tour = { id: 3, title: "Discounted Tour", price: 100, offer: 10 };
    render(<TourCard tour={tour} locale="en" />);
    expect(screen.getByText("Special Offer")).toBeInTheDocument();
  });

  it("renders Special Offer badge when tour belongs to special-offers category", () => {
    const tour: Tour = {
      id: 4,
      title: "Categorized Tour",
      price: 100,
      categories: [{ id: 53, slug: "special-offers", title: "Special Offers" }],
    };
    render(<TourCard tour={tour} locale="en" />);
    expect(screen.getByText("Special Offer")).toBeInTheDocument();
  });

  it("displays discounted price and strikethrough original price when offer percentage is present", () => {
    const tour: Tour = { id: 5, title: "Sale Tour", price: 100, offer: 20 };
    render(<TourCard tour={tour} locale="en" />);
    // 20% off $100 = $80.00
    expect(screen.getByText("$80.00")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });
});

describe("TourCard summary and variants", () => {
  it.each([
    { label: "legacy API description", variant: "legacy" as const, summary: undefined, meta: "Backend metadata", expected: "Original API description" },
    { label: "default backend metadata", variant: undefined, summary: undefined, meta: "Backend metadata", expected: "Backend metadata" },
    { label: "missing backend metadata", variant: undefined, summary: undefined, meta: undefined, expected: null },
    { label: "explicit metadata summary", variant: undefined, summary: "Preview metadata", meta: "Backend metadata", expected: "Preview metadata" },
    { label: "empty metadata summary", variant: undefined, summary: "", meta: "Backend metadata", expected: null },
  ])("renders the $label", ({ variant, summary, meta, expected }) => {
    const { container } = render(
      <TourCard tour={{ title: "Synthetic tour", short_description: "Original API description", seo: { meta_description: meta } }} summary={summary} variant={variant} />,
    );
    expect(screen.getByRole("heading", { name: "Synthetic tour" })).toBeInTheDocument();
    if (expected) {
      expect(container.querySelector(".tour-card-summary")).toHaveTextContent(expected);
    } else {
      expect(container.querySelector(".tour-card-summary")).toBeNull();
    }
  });

  it("keeps the seasonal legacy card free of the new CTA", () => {
    render(<TourCard tour={{ title: "Seasonal sample", slug: "sample", price: 100 }} variant="legacy" />);
    expect(screen.queryByRole("link", { name: "View tour: Seasonal sample" })).toBeNull();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("links the localized frosted action directly to the localized tour route", () => {
    render(<TourCard tour={{ title: "Sample circuit", slug: "sample" }} locale="fr" />);
    const cta = screen.getByRole("link", { name: "Voir le circuit: Sample circuit" });
    expect(cta).toHaveAttribute("href", "/fr/tour/sample");
    expect(cta.parentElement?.closest("a")).toBeNull();
  });

  it("keeps related-tour base pricing even when the API contains an offer", () => {
    render(<RelatedTours tours={[{ id: 999, title: "Related sample", slug: "related", price: 100, offer: 20, wishlisted_exists: true }]} locale="en" />);
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.queryByText("$80.00")).toBeNull();
    expect(screen.getByRole("link", { name: "View tour: Related sample" })).toHaveAttribute("href", "/tour/related");
    expect(screen.getByRole("button", { name: "Remove from wishlist" })).toHaveAttribute("aria-pressed", "true");
  });
});
