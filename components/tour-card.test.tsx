import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TourCard } from "@/components/TourCard";
import type { Tour } from "@/types/api";

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
});

describe("TourCard Special Offer Badge", () => {
  it("does not render Special Offer badge for a standard tour", () => {
    const tour: Tour = { id: 1, title: "Standard Tour", price: 100 };
    render(<TourCard tour={tour} locale="en" />);
    expect(screen.queryByText("Special Offer")).not.toBeInTheDocument();
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
