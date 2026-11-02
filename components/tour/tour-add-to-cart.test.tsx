import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { TourBookingCard } from "@/components/tour/TourBookingCard";
import { CartFlow } from "@/components/CustomerFlows";
import { API_BASE } from "@/lib/config";
import type { Locale, Tour } from "@/types/api";

const router = vi.hoisted(() => ({ push: vi.fn() }));

// Only HTTP and Next navigation are mocked. Real booking and cart components
// use their default USD formatting.
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));

const APPEND_URL = new URL("cart/tours/append", API_BASE).toString();

const APPEND_BODY = {
  tour_id: 101,
  start_date: "2030-01-01",
  adults: 2,
  children: 1,
  infants: 1,
  options: [7],
};

// Synthetic fixture: no production record is copied into tests.
const cartTour: Tour = {
  id: 101,
  title: "Synthetic add-to-cart tour",
  adult_price: 100,
  child_price: 50,
  infant_price: 25,
  options: [{ id: 7, name: "Synthetic transfer add-on", adult_price: 20, child_price: 10 }],
};

function appendSuccess() {
  return new Response(JSON.stringify({ data: null, message: "Tour added to cart successfully", status: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Mirrors TourPageLayout's controlled selectedOptions contract.
function BookingHarness({ tour, locale = "en" }: { tour: Tour; locale?: Locale }) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  return <TourBookingCard tour={tour} locale={locale} selectedOptions={selectedOptions} onSelectedOptionsChange={setSelectedOptions} />;
}

function renderBooking(tour: Tour = cartTour, locale: Locale = "en") {
  return render(<BookingHarness tour={tour} locale={locale} />);
}

function selectCalendarDay(container: HTMLElement, day: string) {
  fireEvent.click(screen.getByPlaceholderText("Select date"));
  const cell = [...container.querySelectorAll<HTMLButtonElement>(".flowbite-datepicker-cell:not(.is-other-month)")].find(
    (button) => button.textContent === day,
  )!;
  fireEvent.click(cell);
}

function submitFrom(container: HTMLElement) {
  const form = container.querySelector<HTMLElement>(".tour-booking-form")!;
  fireEvent.click(within(form).getByRole("button", { name: /Book now/ }));
}

async function renderFilledAndSubmit(tour: Tour = cartTour) {
  const fetchSpy = vi.fn().mockResolvedValue(appendSuccess());
  vi.stubGlobal("fetch", fetchSpy);
  const { container } = renderBooking(tour);
  selectCalendarDay(container, "1");
  fireEvent.click(screen.getByRole("button", { name: "Increase Adults (12+)" }));
  fireEvent.click(screen.getByRole("button", { name: "Increase Children (3 - 11)" }));
  fireEvent.click(screen.getByRole("button", { name: "Increase Infants (0 - 2)" }));
  const addOn = container.querySelector<HTMLInputElement>('.tour-booking-addon-list input[type="checkbox"]')!;
  fireEvent.click(addOn);
  submitFrom(container);
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/cart"));
  return { container, fetchSpy };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2030-01-01T12:00:00Z"));
  router.push.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.cookie = "sunpyramids-token=; path=/; max-age=0";
});

it("submits the exact append request and navigates to the cart only after success", async () => {
  const { container, fetchSpy } = await renderFilledAndSubmit();

  expect(within(container.querySelector(".tour-booking-total")!).getByText("$325.00")).toBeInTheDocument();
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  const [url, init] = fetchSpy.mock.calls[0];
  expect(String(url)).toBe(APPEND_URL);
  expect(init.method).toBe("POST");
  expect(init.cache).toBe("no-store");
  expect(init.headers).toEqual({
    Accept: "application/json",
    "X-Localize": "en",
    "Content-Type": "application/json",
  });
  expect(JSON.parse(init.body as string)).toEqual(APPEND_BODY);
  expect(router.push).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith("/cart");
});

it.each([
  { label: "an English guest submission", token: null, locale: "en" as const, destination: "/cart" },
  { label: "a French signed-in submission", token: "synthetic-add-to-cart-token", locale: "fr" as const, destination: "/fr/cart" },
])("$label preserves identity and localized navigation", async ({ token, locale, destination }) => {
  const fetchSpy = vi.fn().mockResolvedValue(appendSuccess());
  vi.stubGlobal("fetch", fetchSpy);
  if (token) {
    document.cookie = `sunpyramids-token=${encodeURIComponent(token)}; path=/`;
  }
  const { container } = renderBooking(cartTour, locale);
  selectCalendarDay(container, "1");
  submitFrom(container);

  await waitFor(() => expect(router.push).toHaveBeenCalledWith(destination));
  const [, init] = fetchSpy.mock.calls[0];
  const body = JSON.parse(init.body as string);
  expect(body).toEqual({ tour_id: 101, start_date: "2030-01-01", adults: 1, children: 0, infants: 0, options: [] });
  // The browser sends no token when absent and only forwards the cookie token
  // when present; identity ownership stays on the backend.
  expect(init.headers).toEqual(token
    ? { Accept: "application/json", "X-Localize": locale, "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { Accept: "application/json", "X-Localize": locale, "Content-Type": "application/json" });
});

it("does not submit an append request without a booking date", async () => {
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  const { container } = renderBooking();

  submitFrom(container);

  expect(fetchSpy).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong. Please try again.");
  expect(within(container.querySelector(".tour-booking-form")!).getByRole("button", { name: /Book now/ })).toBeEnabled();
});

it("does not submit an append request for a day outside the tour calendar", async () => {
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  const seasonalTour: Tour = { ...cartTour, calender_availability: { day_numbers: [15] } };
  const { container } = renderBooking(seasonalTour);

  fireEvent.click(screen.getByPlaceholderText("Select date"));
  const day1 = [...container.querySelectorAll<HTMLButtonElement>(".flowbite-datepicker-cell:not(.is-other-month)")].find(
    (button) => button.textContent === "1",
  )!;
  expect(day1).toBeDisabled();
  fireEvent.click(day1);
  expect(screen.getByPlaceholderText("Select date")).toHaveValue("");

  submitFrom(container);

  expect(fetchSpy).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toBeInTheDocument();
});

it("offers no append path for an inquiry tour", async () => {
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  const { container } = renderBooking({ ...cartTour, is_inquiry: true });

  fireEvent.click(container.querySelector(".tour-mobile-booking-bar button")!);
  expect(screen.getByRole("dialog", { name: "Check tour availability" })).toBeInTheDocument();
  expect(container.querySelector(".tour-booking-form")).toBeNull();
  expect(screen.queryByRole("button", { name: /Book now/ })).toBeNull();
  expect(container.querySelector(".tour-mobile-booking-bar button")).toHaveTextContent("Check availability");
  // The inquiry card's ContactForm may fetch its own support data, but the
  // append endpoint must be unreachable in this mode.
  const appendCalls = fetchSpy.mock.calls.filter(([input]) => String(input).includes("cart/tours/append"));
  expect(appendCalls).toHaveLength(0);
  expect(router.push).not.toHaveBeenCalled();
});

it.each([
  { label: "an HTTP 400 validation failure", respond: () => new Response(JSON.stringify({ message: "The given data was invalid.", status: false }), { status: 400 }) },
  { label: "an HTTP 500 server failure", respond: () => new Response(JSON.stringify({ message: "Server error. Please try again." }), { status: 500 }) },
  { label: "a network failure", respond: () => Promise.reject(new TypeError("Failed to fetch")) },
])("shows an error, keeps retry available, and never navigates on $label", async ({ respond }) => {
  const fetchSpy = vi.fn().mockImplementation(respond);
  vi.stubGlobal("fetch", fetchSpy);
  const { container } = renderBooking();
  selectCalendarDay(container, "1");
  submitFrom(container);

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong. Please try again."));

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(String(fetchSpy.mock.calls[0][0])).toBe(APPEND_URL);
  expect(JSON.parse(fetchSpy.mock.calls[0][1].body as string)).toEqual({ tour_id: 101, start_date: "2030-01-01", adults: 1, children: 0, infants: 0, options: [] });
  expect(router.push).not.toHaveBeenCalled();

  const retryButton = within(container.querySelector(".tour-booking-form")!).getByRole("button", { name: /Book now/ });
  expect(retryButton).toBeEnabled();
  fireEvent.click(retryButton);
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
  expect(JSON.parse(fetchSpy.mock.calls[1][1].body as string)).toEqual({ tour_id: 101, start_date: "2030-01-01", adults: 1, children: 0, infants: 0, options: [] });
  expect(router.push).not.toHaveBeenCalled();
});

it("does not issue duplicate appends while a submission is pending", async () => {
  let resolveAppend!: (response: Response) => void;
  const fetchSpy = vi.fn(() => new Promise<Response>((resolve) => { resolveAppend = resolve; }));
  vi.stubGlobal("fetch", fetchSpy);
  const { container } = renderBooking();
  selectCalendarDay(container, "1");
  const form = container.querySelector(".tour-booking-form")!;
  fireEvent.click(within(form).getByRole("button", { name: /Book now/ }));

  const pendingButton = await waitFor(() => {
    const button = within(form).getByRole("button", { name: "Booking..." });
    expect(button).toBeDisabled();
    return button;
  });
  expect(router.push).not.toHaveBeenCalled();

  fireEvent.click(pendingButton);

  resolveAppend(appendSuccess());
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/cart"));
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledTimes(1);
});

it("submits the same payload from the mobile booking panel", async () => {
  const fetchSpy = vi.fn().mockResolvedValue(appendSuccess());
  vi.stubGlobal("fetch", fetchSpy);
  const { container } = renderBooking();
  fireEvent.click(container.querySelector(".tour-mobile-booking-bar button")!);
  expect(screen.getByRole("dialog", { name: "Book this tour" })).toBeInTheDocument();

  selectCalendarDay(container, "1");
  submitFrom(container);

  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/cart"));
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  const [, init] = fetchSpy.mock.calls[0];
  expect(String(init.method)).toBe("POST");
  expect(JSON.parse(init.body as string)).toEqual({ tour_id: 101, start_date: "2030-01-01", adults: 1, children: 0, infants: 0, options: [] });
});

it("renders the append outcome in the real CartFlow from the server list response (HTTP double)", async () => {
  const appendedOptions = [{ id: 7, name: "Synthetic transfer add-on", adult_price: 20, child_price: 10 }];
  const listRow = {
    id: 11,
    type: "tour",
    start_date: "2030-01-01",
    adults: 2,
    children: 1,
    infants: 1,
    tour: { id: 101, slug: "synthetic-add-to-cart-tour", title: "Synthetic add-to-cart tour", image: null, adult_price: 100, child_price: 50, infant_price: 25 },
    options: appendedOptions,
  };
  const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
    const pathname = new URL(String(input)).pathname;
    if (pathname.endsWith("/cart/tours/append")) return appendSuccess();
    if (pathname.endsWith("/cart/list")) {
      return new Response(JSON.stringify({ data: [listRow], message: "Cart retrieved successfully", status: true }), { status: 200 });
    }
    throw new TypeError(`Unexpected test request: ${String(input)}`);
  });
  vi.stubGlobal("fetch", fetchSpy);

  const { container } = renderBooking();
  selectCalendarDay(container, "1");
  fireEvent.click(screen.getByRole("button", { name: "Increase Adults (12+)" }));
  fireEvent.click(screen.getByRole("button", { name: "Increase Children (3 - 11)" }));
  fireEvent.click(screen.getByRole("button", { name: "Increase Infants (0 - 2)" }));
  fireEvent.click(container.querySelector<HTMLInputElement>('.tour-booking-addon-list input[type="checkbox"]')!);
  submitFrom(container);
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/cart"));
  const appendCall = fetchSpy.mock.calls.find(([input]) => new URL(String(input)).pathname.endsWith("/cart/tours/append"))!;
  expect(JSON.parse(appendCall[1].body as string)).toEqual(APPEND_BODY);

  cleanup();
  render(<CartFlow />);

  expect(await screen.findAllByText("Synthetic add-to-cart tour")).not.toHaveLength(0);
  expect(screen.getAllByText(/2030-01-01/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/2 Adults, 1 Children, 1 Infants/).length).toBeGreaterThan(0);
  expect(screen.getByText(/Synthetic transfer add-on/)).toBeInTheDocument();
  expect(screen.getAllByText("$325.00").length).toBeGreaterThan(0);
  expect(screen.getByText("Subtotal")).toBeInTheDocument();

  const listCall = fetchSpy.mock.calls.find(([input]) => new URL(String(input)).pathname.endsWith("/cart/list"))!;
  expect(listCall[1].method).toBe("GET");
  expect(listCall[1].headers["X-Localize"]).toBe("en");
});
