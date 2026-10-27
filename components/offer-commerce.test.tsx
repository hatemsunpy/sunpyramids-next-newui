import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TourBookingCard } from "@/components/tour/TourBookingCard";
import { CartFlow } from "@/components/CustomerFlows";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2030-01-01T12:00:00Z"));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  ["2030-01-01T00:00:00Z", "$100.00", "$80.00"],
  ["2030-01-02T00:00:00Z", "$80.00", null],
])("booking panel respects API expiry %s", (offer_end_date, current, absent) => {
  const { container } = render(<TourBookingCard
    tour={{ title: "Synthetic booking offer", adult_price: 100, offer: 20, offer_end_date }}
    locale="en" selectedOptions={[]} onSelectedOptionsChange={() => {}}
  />);
  expect(container.querySelector(".tour-price-current")).toHaveTextContent(current);
  expect(container.querySelector(".tour-mobile-booking-bar strong")).toHaveTextContent(current);
  if (absent) {
    expect(screen.queryByText(absent)).not.toBeInTheDocument();
    expect(container.querySelector(".tour-price-original")).toBeNull();
  } else {
    expect(container.querySelector(".tour-price-original")).toHaveTextContent("$100.00");
  }
});

it.each([
  ["2030-01-01T00:00:00Z", "$250.00", "$200.00"],
  ["2030-01-02T00:00:00Z", "$200.00", "$250.00"],
])("cart estimates respect API expiry %s while preserving passenger rates", async (offer_end_date, expected, absent) => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status: true, data: [{
    id: 1, type: "tour", adults: 2, children: 1,
    tour: { id: 2, title: "Synthetic cart offer", adult_price: 100, child_price: 50, offer: 20, offer_end_date },
  }] }), { status: 200 })));
  render(<CartFlow />);
  expect((await screen.findAllByText(expected)).length).toBeGreaterThan(0);
  expect(screen.queryByText(absent)).not.toBeInTheDocument();
});
