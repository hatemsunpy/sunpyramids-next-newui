import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TourBookingCard } from "@/components/tour/TourBookingCard";
import type { Tour } from "@/types/api";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2030-01-01T12:00:00Z"));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }))));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it.each([
  { adult_price: 0 },
  { adult_price: "0" },
  { adult_price: 100, is_inquiry: true },
])("shows availability inquiries instead of checkout for %j", (pricing) => {
  render(<TourBookingCard tour={{ id: 1, title: "Synthetic inquiry tour", ...pricing }}
    locale="en" selectedOptions={[]} onSelectedOptionsChange={() => {}} />);

  expect(screen.getByRole("heading", { name: "Contact Us For Checking Availability" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Full Name" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Book now/ })).not.toBeInTheDocument();
  expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
});

// Regression: selecting a zero-priced season previously left a $0 checkout open.
it("switches a zero-priced season to inquiry and restores the booking when the date is cleared", () => {
  const tour: Tour = {
    id: 1, title: "Synthetic seasonal tour", adult_price: 100,
    options: [{ id: 5, name: "Synthetic transfer", adult_price: 45 }],
    seasons: [{
      calender_availability: {
        day_numbers: [1], day_names: ["tuesday"], month_names: ["january"], years_numbers: [2030],
      },
      pricing_groups: [{ from: 1, to: 10, price: "0", child_price: 0 }],
    }],
  };
  const { container } = render(<TourBookingCard tour={tour} locale="en"
    selectedOptions={[5]} onSelectedOptionsChange={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Increase Adults (12+)" }));
  expect(container.querySelector(".tour-price-current")).toHaveTextContent("$200.00");
  fireEvent.click(container.querySelector<HTMLButtonElement>(".tour-mobile-booking-bar button")!);
  fireEvent.click(screen.getByPlaceholderText("Select date"));
  const day = [...container.querySelectorAll<HTMLButtonElement>(
    ".flowbite-datepicker-cell:not(.is-other-month)",
  )].find((button) => button.textContent === "1")!;
  fireEvent.click(day);

  expect(screen.getByRole("heading", { name: "Contact Us For Checking Availability" })).toBeInTheDocument();
  expect(screen.getByText("2030-01-01")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Book now/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Check availability/ })).toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "Check tour availability" })).toBeInTheDocument();
  expect(document.body.style.overflow).toBe("hidden");

  fireEvent.click(screen.getByRole("button", { name: "Change inquiry date" }));
  expect(screen.queryByRole("heading", { name: "Contact Us For Checking Availability" })).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText("Select date")).toHaveValue("");
  expect(container.querySelector(".tour-price-current")).toHaveTextContent("$200.00");
  expect(container.querySelector(".tour-mobile-booking-bar strong")).toHaveTextContent("$290.00");
  expect(screen.getByRole("dialog", { name: "Book this tour" })).toBeInTheDocument();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
});
