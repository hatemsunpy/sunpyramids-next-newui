import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { CartFlow } from "@/components/CustomerFlows";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { ContactForm } from "@/components/ContactForm";
import { TourBookingCard } from "@/components/tour/TourBookingCard";
import { TourViewSignal } from "@/components/tour/TourViewSignal";
import { resetDocumentTrackingState } from "@/lib/analytics/datalayer";
import type { Tour } from "@/types/api";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/recaptcha", () => ({ generateRecaptchaToken: vi.fn().mockResolvedValue(null) }));

const countries = [{ id: 50, name: "Egypt", code: "EG", phone_code: "+20", length: 10 }];
const usdCurrency = [{ id: 1, title: "US Dollar", name: "USD", symbol: "$", exchange_rate: 1 }];

let cartData: any[];
const apiCalls: { method: string; endpoint: string; body: any }[] = [];
const deferred: Record<string, ((reply: (payload: unknown, status?: number) => void) => void)[]> = {};

function deferEndpoint(endpoint: string) {
  const queue = (deferred[endpoint] ||= []);
  let received: ((payload: unknown, status?: number) => void) | null = null;
  const pending = new Promise<void>((resolve) => {
    queue.push((reply) => {
      received = reply;
      resolve();
    });
  });
  return {
    async respond(payload: unknown, status = 200) {
      await pending;
      received!(payload, status);
    },
  };
}

function cart(list: any[]) {
  cartData = list;
}

function setFlag(enabled: boolean) {
  if (enabled) {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
  } else {
    delete process.env.NEXT_PUBLIC_TRACKING_V2;
  }
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

function defaultEndpoints(endpoint: string): unknown {
  if (endpoint === "countries") return countries;
  if (endpoint === "currencies") return usdCurrency;
  if (endpoint === "cart/list") return cartData;
  return [];
}

function installFetch() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const endpoint = url.pathname.replace(/^\/api\//, "");
    const method = (init?.method || "GET") as string;
    let body: any = undefined;
    if (typeof init?.body === "string") {
      try { body = JSON.parse(init.body); } catch { body = init.body; }
    }
    apiCalls.push({ method, endpoint, body });
    if (!url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ country: "US" }), { status: 200 });
    }
    const queue = deferred[endpoint];
    if (queue?.length) {
      return await new Promise<Response>((resolve) => {
        queue.shift()!((payload: unknown, status = 200) => {
          resolve(new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } }));
        });
      });
    }
    return new Response(JSON.stringify({ status: true, data: defaultEndpoints(endpoint) }), { status: 200 });
  }));
}

function eventsNamed(name: string): Record<string, unknown>[] {
  return ((window.dataLayer ?? []) as unknown[]).filter(
    (entry) => !!entry && typeof entry === "object" && (entry as Record<string, unknown>).event === name,
  ) as Record<string, unknown>[];
}

function ecommerceOf(event: Record<string, unknown>): Record<string, unknown> {
  return event.ecommerce as Record<string, unknown>;
}

// Synthetic fixture rows: mirrors the coupon suite's cart contract.
const tourRow = { type: "tour", id: 1, adults: 2, children: 0, infants: 0, tour: { id: 11, title: "Pyramids Day Tour", adult_price: 100 } };
const rentalRow = { type: "rental", id: 5, total: 80 };
// A row the UI can still render (it shows a fallback label) but whose
// analytics mapping cannot name: an unnameable tour row.
const unmappableRow = { type: "tour", id: 2, adults: 2, children: 0, infants: 0, tour: { id: 22, title: "" } };

function renderCart(checkout = false, strictMode = false) {
  const tree = (
    <CurrencyProvider>
      <CartFlow checkout={checkout} />
    </CurrencyProvider>
  );
  return render(strictMode ? <StrictMode>{tree}</StrictMode> : tree);
}

async function cartLoaded(container: HTMLElement, expected = cartData.length) {
  await waitFor(() => expect(container.querySelectorAll(".summary-item-row").length).toBe(expected));
}

beforeEach(() => {
  setFlag(true);
  resetDocumentTrackingState();
  push.mockClear();
  cartData = [tourRow];
  apiCalls.length = 0;
  for (const key of Object.keys(deferred)) delete deferred[key];
  setCookie("sunpyramids-token", "test-token");
  window.dataLayer = [];
  window.history.replaceState({}, "", "/");
  installFetch();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.dataLayer = [];
  window.sessionStorage.clear();
  deleteCookie("sunpyramids-token");
  deleteCookie("sunpyramids-checkout-data");
  delete process.env.NEXT_PUBLIC_TRACKING_V2;
});

describe("cart entry signals (view_cart) and money mapping", () => {
  it("emits one view_cart per mounted cart page despite StrictMode double loads", async () => {
    const ui = renderCart(false, true);
    await cartLoaded(ui.container);
    await waitFor(() => expect(eventsNamed("view_cart")).toHaveLength(1));
    // StrictMode's double mount must not double-signal.
    expect(eventsNamed("view_cart")).toHaveLength(1);
  });

  it("maps items and pre-coupon money from the same selected API currency when the currency resolved first", async () => {
    const currencies = deferEndpoint("currencies");
    const list = deferEndpoint("cart/list");
    const ui = renderCart();
    await currencies.respond({ status: true, data: usdCurrency });
    await list.respond({ status: true, data: cartData });
    await cartLoaded(ui.container);
    await waitFor(() => expect(eventsNamed("view_cart")).toHaveLength(1));

    const ecommerce = ecommerceOf(eventsNamed("view_cart")[0]);
    expect(ecommerce.currency).toBe("USD");
    expect(ecommerce.value).toBe(200);
    expect(ecommerce.items).toEqual([
      { item_id: "11", item_name: "Pyramids Day Tour", quantity: 1, item_category: "tour", price: 200 },
    ]);
  });

  it("matches the actual cart display for a half-cent amount", async () => {
    cart([{ ...tourRow, adults: 1, tour: { ...tourRow.tour, adult_price: 100.005 } }]);
    const currencies = deferEndpoint("currencies");
    const list = deferEndpoint("cart/list");
    const ui = renderCart();
    await currencies.respond({ status: true, data: usdCurrency });
    await list.respond({ status: true, data: cartData });
    await cartLoaded(ui.container);
    await waitFor(() => expect(eventsNamed("view_cart")).toHaveLength(1));

    expect(ui.container.querySelector(".summary-item-row .item-price")).toHaveTextContent("$100.00");
    expect(ui.container.querySelector(".total-amount")).toHaveTextContent("$100.00");
    const ecommerce = ecommerceOf(eventsNamed("view_cart")[0]);
    expect(ecommerce.value).toBe(100);
    expect(ecommerce.items).toEqual([
      { item_id: "11", item_name: "Pyramids Day Tour", quantity: 1, item_category: "tour", price: 100 },
    ]);
  });

  it("omits monetary fields until the currency resolves and never re-emits afterwards", async () => {
    const list = deferEndpoint("cart/list");
    const currencies = deferEndpoint("currencies");
    const ui = renderCart();
    await list.respond({ status: true, data: cartData });
    await cartLoaded(ui.container);
    await waitFor(() => expect(eventsNamed("view_cart")).toHaveLength(1));

    // The event itself always went out; money was withheld, not mislabeled.
    const ecommerce = ecommerceOf(eventsNamed("view_cart")[0]);
    expect(ecommerce.items).toEqual([
      { item_id: "11", item_name: "Pyramids Day Tour", quantity: 1, item_category: "tour" },
    ]);
    expect("currency" in ecommerce).toBe(false);
    expect("value" in ecommerce).toBe(false);

    await currencies.respond({ status: true, data: usdCurrency });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(eventsNamed("view_cart")).toHaveLength(1);
  });

  it("never signals entry events for an HTTP 200 cart response with status:false", async () => {
    const list = deferEndpoint("cart/list");
    const ui = renderCart();
    // A body failure that still echoes rows: the rows render, but the load
    // was NEVER accepted, so no entry signal may fire.
    await list.respond({ status: false, data: cartData });
    await cartLoaded(ui.container);
    expect(eventsNamed("view_cart")).toHaveLength(0);
    expect(eventsNamed("begin_checkout")).toHaveLength(0);
  });

  it("suppresses the whole entry event when any cart row cannot be mapped (no partial money)", async () => {
    // One known row + one unnameable row: the partial basket would understate
    // the displayed whole-cart total, so NOTHING may emit.
    cart([tourRow, unmappableRow]);
    const list = deferEndpoint("cart/list");
    const ui = renderCart();
    await list.respond({ status: true, data: cartData });
    await cartLoaded(ui.container, 2);
    expect(eventsNamed("view_cart")).toHaveLength(0);
    expect(eventsNamed("begin_checkout")).toHaveLength(0);

    // The same suppression holds on the checkout identity.
    const uiCheckout = render(
      <CurrencyProvider>
        <CartFlow checkout />
      </CurrencyProvider>,
    );
    const list2 = deferEndpoint("cart/list");
    await list2.respond({ status: true, data: cartData });
    await waitFor(() => expect(uiCheckout.container.querySelectorAll(".summary-item-row").length).toBe(2));
    expect(eventsNamed("view_cart")).toHaveLength(0);
    expect(eventsNamed("begin_checkout")).toHaveLength(0);
  });
});

describe("cart mutation signals (remove_from_cart)", () => {
  it("fires remove_from_cart once after the confirmed delete, before the cart refresh", async () => {
    const list = deferEndpoint("cart/list");
    const ui = renderCart();
    await list.respond({ status: true, data: cartData });
    await cartLoaded(ui.container);

    const removeDeferral = deferEndpoint("cart/remove/11");
    fireEvent.click(screen.getByRole("button", { name: "Delete Pyramids Day Tour" }));
    await removeDeferral.respond({ status: true, message: "Deleted" });

    await waitFor(() => expect(eventsNamed("remove_from_cart")).toHaveLength(1));
    const ecommerce = ecommerceOf(eventsNamed("remove_from_cart")[0]);
    expect(ecommerce.currency).toBe("USD");
    expect(ecommerce.value).toBe(200);
    expect(ecommerce.items).toEqual([
      { item_id: "11", item_name: "Pyramids Day Tour", quantity: 1, item_category: "tour", price: 200 },
    ]);
    // The post-delete refresh must not produce a second remove signal.
    await waitFor(() => expect(apiCalls.filter((call) => call.endpoint === "cart/list")).toHaveLength(2));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(eventsNamed("remove_from_cart")).toHaveLength(1);
  });

  it("never signals remove_from_cart for HTTP 200 with status:false", async () => {
    const ui = renderCart();
    await cartLoaded(ui.container);
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const endpoint = url.pathname.replace(/^\/api\//, "");
      const method = (init?.method || "GET") as string;
      apiCalls.push({ method, endpoint, body: undefined });
      if (!url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      if (endpoint === "cart/remove/11") {
        return new Response(JSON.stringify({ status: false, message: "Validation failed" }), { status: 200 });
      }
      return new Response(JSON.stringify({ status: true, data: defaultEndpoints(endpoint) }), { status: 200 });
    }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Pyramids Day Tour" }));
    await waitFor(() => expect(apiCalls.some((call) => call.endpoint === "cart/remove/11")).toBe(true));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(eventsNamed("remove_from_cart")).toHaveLength(0);
    // The row stays because loadCart keeps the authoritative list.
    expect(ui.container.querySelectorAll(".summary-item-row").length).toBe(1);
  });

  it("never signals remove_from_cart on a failed delete request", async () => {
    const ui = renderCart();
    await cartLoaded(ui.container);
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/cart/remove/11")) return new Response("Unavailable", { status: 500 });
      const endpoint = url.pathname.replace(/^\/api\//, "");
      if (!url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      return new Response(JSON.stringify({ status: true, data: defaultEndpoints(endpoint) }), { status: 200 });
    }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Pyramids Day Tour" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(eventsNamed("remove_from_cart")).toHaveLength(0);
  });

  it("clears the cart into one multi-row remove_from_cart event", async () => {
    cart([tourRow, rentalRow]);
    const ui = renderCart(false, true);
    await cartLoaded(ui.container);
    fireEvent.click(screen.getByRole("button", { name: /Clear all/i }));
    await waitFor(() => expect(eventsNamed("remove_from_cart")).toHaveLength(1));
    const ecommerce = ecommerceOf(eventsNamed("remove_from_cart")[0]);
    expect(ecommerce.items).toEqual([
      { item_id: "11", item_name: "Pyramids Day Tour", quantity: 1, item_category: "tour", price: 200 },
      { item_id: "5", item_name: "Car rental", item_category: "rental", quantity: 1, price: 80 },
    ]);
    expect(ecommerce.value).toBe(280);
  });

  it("emits no analytics events at all while the v2 flag is off", async () => {
    setFlag(false);
    const ui = renderCart();
    await cartLoaded(ui.container);
    fireEvent.click(screen.getByRole("button", { name: "Delete Pyramids Day Tour" }));
    await waitFor(() => expect(apiCalls.some((call) => call.endpoint === "cart/remove/11")).toBe(true));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(((window.dataLayer ?? []) as unknown[]).length).toBe(0);
  });
});

describe("checkout signals (begin_checkout / add_payment_info)", () => {
  function checkoutForm(ui: { container: HTMLElement }) {
    return ui.container.querySelector(".checkout-form-container") as HTMLFormElement;
  }

  async function fillCheckout(ui: { container: HTMLElement }) {
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Phone number without country code" })).toBeInTheDocument());
    const form = checkoutForm(ui);
    fireEvent.change(form.querySelector('[name="fullName"]')!, { target: { value: "Test Guest" } });
    fireEvent.change(form.querySelector('[name="email"]')!, { target: { value: "guest@example.com" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), { target: { value: "1012345678" } });
    fireEvent.change(form.querySelector('[name="country"]')!, { target: { value: "Egypt" } });
    fireEvent.change(form.querySelector('[name="state"]')!, { target: { value: "Cairo" } });
    expect(form.checkValidity()).toBe(true);
  }

  function stubBookings(respond: () => Response | Promise<Response>) {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const endpoint = url.pathname.replace(/^\/api\//, "");
      const method = (init?.method || "GET") as string;
      let body: any = undefined;
      if (typeof init?.body === "string") {
        try { body = JSON.parse(init.body); } catch { body = init.body; }
      }
      apiCalls.push({ method, endpoint, body });
      if (!url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      if (method === "POST" && endpoint === "bookings") return await respond();
      return new Response(JSON.stringify({ status: true, data: defaultEndpoints(endpoint) }), { status: 200 });
    }));
  }

  it("emits begin_checkout once after the accepted load and money stays currency-agreed", async () => {
    const ui = renderCart(true);
    await cartLoaded(ui.container);
    await waitFor(() => expect(eventsNamed("begin_checkout")).toHaveLength(1));
    expect(ecommerceOf(eventsNamed("begin_checkout")[0]).value).toBe(200);
    // An incidental rerender at the same identity stays silent.
    ui.rerender(<CurrencyProvider><CartFlow checkout /></CurrencyProvider>);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(eventsNamed("begin_checkout")).toHaveLength(1);
  });

  it("emits add_payment_info once for the ACCEPTED default-card submission, not for radio clicks", async () => {
    const ui = renderCart(true);
    await cartLoaded(ui.container);
    await waitFor(() => expect(eventsNamed("begin_checkout")).toHaveLength(1));
    expect(ui.container.querySelector('input[name="paymentMethod"][value="card"]')).toBeChecked();
    expect(eventsNamed("add_payment_info")).toHaveLength(0);

    stubBookings(() => new Response(JSON.stringify({ status: true, data: { booking: { id: 77 } } }), { status: 200 }));
    await fillCheckout(ui);
    fireEvent.submit(checkoutForm(ui));
    await waitFor(() => expect(eventsNamed("add_payment_info")).toHaveLength(1));
    const ecommerce = ecommerceOf(eventsNamed("add_payment_info")[0]);
    expect(ecommerce.payment_type).toBe("card");
    expect(ecommerce.value).toBe(200);
    // No purchase event exists in the contract, and the checkout never
    // carries tax/shipping/delivery/handling fee fields.
    expect(eventsNamed("purchase")).toHaveLength(0);
    for (const field of ["tax", "shipping", "handling", "delivery"]) {
      expect(ecommerce).not.toHaveProperty(field);
    }
    // Selected-but-unsubmitted attempts stay quiet: no further clicks fired.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(eventsNamed("add_payment_info")).toHaveLength(1);
  });

  it("emits add_payment_info for a paypal submission", async () => {
    const ui = renderCart(true);
    await cartLoaded(ui.container);
    stubBookings(() => new Response(JSON.stringify({ status: true, data: { booking: { id: 88 } } }), { status: 200 }));
    await fillCheckout(ui);
    fireEvent.click(ui.container.querySelector<HTMLInputElement>('input[name="paymentMethod"][value="paypal"]')!);
    expect(eventsNamed("add_payment_info")).toHaveLength(0);
    fireEvent.submit(checkoutForm(ui));
    await waitFor(() => expect(eventsNamed("add_payment_info")).toHaveLength(1));
    expect(ecommerceOf(eventsNamed("add_payment_info")[0]).payment_type).toBe("paypal");
  });

  it("stays silent when the submission is rejected or the API fails", async () => {
    const ui = renderCart(true);
    await cartLoaded(ui.container);

    // Validation failure (missing required guest fields) -> nothing fires.
    fireEvent.submit(checkoutForm(ui));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(eventsNamed("add_payment_info")).toHaveLength(0);

    stubBookings(() => new Response(JSON.stringify({ status: false, message: "Validation failed", data: { booking: { id: 1 } } }), { status: 200 }));
    await fillCheckout(ui);
    const submit = checkoutForm(ui).querySelector('button[type="submit"]')!;
    fireEvent.submit(checkoutForm(ui));
    expect(submit).toBeDisabled();
    await waitFor(() => expect(submit).toBeEnabled());
    expect(eventsNamed("add_payment_info")).toHaveLength(0);

    stubBookings(() => new Response("Unavailable", { status: 400 }));
    fireEvent.submit(checkoutForm(ui));
    await waitFor(() => expect(apiCalls.filter((call) => call.method === "POST" && call.endpoint === "bookings")).toHaveLength(2));
    await screen.findByRole("alert");
    expect(eventsNamed("add_payment_info")).toHaveLength(0);
  });

  it("does not count a response without a valid booking identity as payment info", async () => {
    const ui = renderCart(true);
    await cartLoaded(ui.container);
    stubBookings(() => new Response(JSON.stringify({
      status: true,
      message: "Synthetic booking response",
      data: { booking: { id: 0 } },
    }), { status: 200 }));
    await fillCheckout(ui);
    const submit = checkoutForm(ui).querySelector('button[type="submit"]')!;
    fireEvent.submit(checkoutForm(ui));
    expect(submit).toBeDisabled();
    await waitFor(() => expect(submit).toBeEnabled());
    expect(eventsNamed("add_payment_info")).toHaveLength(0);
  });

  it("signals again when the checkout identity changes (locale), once per identity", async () => {
    const ui = renderCart(true);
    await cartLoaded(ui.container);
    await waitFor(() => expect(eventsNamed("begin_checkout")).toHaveLength(1));
    ui.rerender(<CurrencyProvider><CartFlow checkout locale="fr" /></CurrencyProvider>);
    await waitFor(() => expect(eventsNamed("begin_checkout")).toHaveLength(2));
    // The fr identity signals with the same cart snapshot and currency.
    expect(ecommerceOf(eventsNamed("begin_checkout")[1]).items).toEqual(
      [{ item_id: "11", item_name: "Pyramids Day Tour", quantity: 1, item_category: "tour", price: 200 }],
    );
  });
});

describe("tour booking card signals", () => {
  const cartTour: Tour = {
    id: 101,
    title: "Synthetic add-to-cart tour",
    adult_price: 100,
    child_price: 50,
    infant_price: 25,
    options: [{ id: 7, name: "Synthetic transfer add-on", adult_price: 20, child_price: 10 }],
    category: { name: "Day Tours" },
  };

  function BookingHarness({ tour }: { tour: Tour }) {
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    return <TourBookingCard tour={tour} locale="en" selectedOptions={selectedOptions} onSelectedOptionsChange={setSelectedOptions} />;
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

  async function appendRespondsSuccess() {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const endpoint = url.pathname.replace(/^\/api\//, "");
      const method = (init?.method || "GET") as string;
      apiCalls.push({ method, endpoint, body: undefined });
      if (!url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      if (method === "POST" && endpoint === "cart/tours/append") {
        return new Response(JSON.stringify({ data: null, message: "Tour added to cart successfully", status: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ status: true, data: defaultEndpoints(endpoint) }), { status: 200 });
    }));
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2030-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Deferred currencies + immediate response: the currency is resolved before
  // any interaction, so the emit cannot race the selected currency.
  async function renderBookingCard(tour: Tour) {
    const currencies = deferEndpoint("currencies");
    const ui = render(<CurrencyProvider><BookingHarness tour={tour} /></CurrencyProvider>);
    await currencies.respond({ status: true, data: usdCurrency });
    await new Promise((resolve) => setTimeout(resolve, 0));
    return ui;
  }

  it("emits converted money that agrees with the UI total once per success", async () => {
    const { container } = await renderBookingCard(cartTour);
    selectCalendarDay(container, "1");
    fireEvent.click(screen.getByRole("button", { name: "Increase Adults (12+)" }));
    submitFrom(container);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/cart"));
    const added = eventsNamed("add_to_cart");
    expect(added).toHaveLength(1);
    const ecommerce = ecommerceOf(added[0]);
    expect(ecommerce.currency).toBe("USD");
    expect(ecommerce.value).toBe(200);
    expect(ecommerce.items).toEqual([
      { item_id: "101", item_name: "Synthetic add-to-cart tour", quantity: 1, item_category: "Day Tours", price: 200 },
    ]);
  });

  it("includes priced add-ons and only counts visitors who picked them", async () => {
    const { container } = await renderBookingCard(cartTour);
    selectCalendarDay(container, "1");
    fireEvent.click(container.querySelector<HTMLInputElement>('.tour-booking-addon-list input[type="checkbox"]')!);
    submitFrom(container);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/cart"));
    const ecommerce = ecommerceOf(eventsNamed("add_to_cart")[0]);
    expect(ecommerce.value).toBe(120);
    expect(ecommerce.items).toEqual([
      { item_id: "101", item_name: "Synthetic add-to-cart tour", quantity: 1, item_category: "Day Tours", price: 120 },
    ]);
  });

  it("treats HTTP 200 with status:false as UI success but never signals add_to_cart", async () => {
    const { container } = await renderBookingCard(cartTour);
    // Re-stub only AFTER the currency handshake: a custom stub installed
    // earlier would not serve the deferred currencies request at all.
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const endpoint = url.pathname.replace(/^\/api\//, "");
      const method = (init?.method || "GET") as string;
      if (!url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      if (method === "POST" && endpoint === "cart/tours/append") {
        return new Response(JSON.stringify({ data: null, message: "Invalid", status: false }), { status: 200 });
      }
      return new Response(JSON.stringify({ status: true, data: defaultEndpoints(endpoint) }), { status: 200 });
    }));
    selectCalendarDay(container, "1");
    submitFrom(container);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/cart"));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(eventsNamed("add_to_cart")).toHaveLength(0);
  });

  it.each([
    { label: "a HTTP 400 failure", respond: () => new Response(JSON.stringify({ message: "Invalid" }), { status: 400 }) },
    { label: "a network failure", respond: () => Promise.reject(new TypeError("Failed to fetch")) },
  ])("never signals add_to_cart on $label", async ({ respond }) => {
    const { container } = await renderBookingCard(cartTour);
    // Re-stub only AFTER the currency handshake (see the status:false test).
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const endpoint = url.pathname.replace(/^\/api\//, "");
      const method = (init?.method || "GET") as string;
      if (!url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      if (method === "POST" && endpoint === "cart/tours/append") return await respond();
      return new Response(JSON.stringify({ status: true, data: defaultEndpoints(endpoint) }), { status: 200 });
    }));
    selectCalendarDay(container, "1");
    submitFrom(container);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong. Please try again."));
    expect(push).not.toHaveBeenCalled();
    expect(eventsNamed("add_to_cart")).toHaveLength(0);
  });

  it("stays silent with the v2 flag off", async () => {
    setFlag(false);
    await appendRespondsSuccess();
    const { container } = render(<CurrencyProvider><BookingHarness tour={cartTour} /></CurrencyProvider>);
    selectCalendarDay(container, "1");
    submitFrom(container);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/cart"));
    expect(((window.dataLayer ?? []) as unknown[]).length).toBe(0);
  });
});

describe("tour view signals (view_item)", () => {
  const tourA: Tour = { id: 500, title: "Pyramids Day Tour", category: { name: "Day Tours" } };
  const tourB: Tour = { id: 501, title: "Luxor Nile Cruise", category: { name: "Nile Cruises" } };

  function viewItemEvents(): Record<string, unknown>[] {
    return eventsNamed("view_item");
  }

  it("emits view_item once per distinct tour id: A -> B -> A on one mounted layout", () => {
    const ui = render(<TourViewSignal tour={tourA} />);
    ui.rerender(<TourViewSignal tour={tourB} />);
    ui.rerender(<TourViewSignal tour={tourA} />);
    expect(viewItemEvents()).toHaveLength(3);
    expect(viewItemEvents().map((entry) => (entry.ecommerce as Record<string, unknown>).items[0].item_id)).toEqual([
      "500",
      "501",
      "500",
    ]);
  });

  it("stays silent when the same tour id arrives on a rebuilt object (selection or currency rerender)", () => {
    const ui = render(<TourViewSignal tour={tourA} />);
    expect(viewItemEvents()).toHaveLength(1);
    // A rebuilt tour object (extra options/currency state) with the SAME id
    // must not re-signal.
    ui.rerender(<TourViewSignal tour={{ ...tourA, child_price: 55 } as Tour} />);
    expect(viewItemEvents()).toHaveLength(1);
  });

  it("carries no monetary fields: per contract page price depends on the visitor's selection", () => {
    const priced: Tour = { id: 502, title: "Priced Tour", adult_price: 999, category: { name: "Day Tours" } };
    render(<TourViewSignal tour={priced} />);
    const ecommerce = ecommerceOf(viewItemEvents()[0]);
    expect(ecommerce).toEqual({
      items: [{ item_id: "502", item_name: "Priced Tour", quantity: 1, item_category: "Day Tours" }],
    });
    expect("currency" in ecommerce).toBe(false);
    expect("value" in ecommerce).toBe(false);
  });

  it("is silent on missing id or title and when the flag is off", () => {
    render(<TourViewSignal tour={{ id: null as never, title: "Broken" } as Tour} />);
    render(<TourViewSignal tour={{ id: 3, title: "  " } as Tour} />);
    expect(viewItemEvents()).toHaveLength(0);
    setFlag(false);
    render(<TourViewSignal tour={tourA} />);
    expect(viewItemEvents()).toHaveLength(0);
  });
});

describe("lead signals", () => {
  function fillTourInquiry() {
    fireEvent.change(screen.getByRole("textbox", { name: "Full Name" }), { target: { value: "Test Guest" } });
    fireEvent.pointerDown(screen.getByRole("button", { name: "Nationality" }), { button: 0, ctrlKey: false });
    fireEvent.click(screen.getByRole("menuitem", { name: "Egypt" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), { target: { value: "1012345678" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), { target: { value: "guest@example.com" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Write Us...." }), { target: { value: "Please confirm availability." } });
  }

  function fillGeneralContact(ui: { container: HTMLElement }) {
    // The general contact form has no labels except the phone field; the rest
    // are typed by name. The phone is a required validated field like the
    // tour inquiry's.
    fireEvent.change(ui.container.querySelector<HTMLInputElement>('input[name="name"]')!, { target: { value: "Test Guest" } });
    fireEvent.change(ui.container.querySelector<HTMLInputElement>('input[name="email"]')!, { target: { value: "guest@example.com" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), { target: { value: "1012345678" } });
    fireEvent.change(ui.container.querySelector<HTMLInputElement>('input[name="country"]')!, { target: { value: "Egypt" } });
    fireEvent.change(ui.container.querySelector<HTMLTextAreaElement>('textarea[name="message"]')!, { target: { value: "Please call me back." } });
  }

  it("classifies a tour inquiry as generate_lead with form_type tour_inquiry", async () => {
    const ui = render(<ContactForm tourId={19} tourTitle="Star Watching Adventure" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled());
    fillTourInquiry();
    fireEvent.submit(ui.container.querySelector("form")!);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/thankful"));
    const leads = eventsNamed("generate_lead");
    expect(leads).toHaveLength(1);
    expect(leads[0].form_type).toBe("tour_inquiry");
    // The visitor's name must not travel through the destination URL.
    expect(String(push.mock.calls.at(-1)![0])).not.toContain("name=");
  });

  it("classifies a general contact message as generate_lead with form_type contact", async () => {
    const ui = render(<ContactForm />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Send a Message" })).toBeEnabled());
    fillGeneralContact(ui);
    fireEvent.submit(ui.container.querySelector("form")!);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/thankful"));
    expect(eventsNamed("generate_lead")).toHaveLength(1);
    expect(eventsNamed("generate_lead")[0].form_type).toBe("contact");
    // Lead events are non-commerce: they carry no ecommerce block at all
    // (neither null nor items).
    expect(eventsNamed("generate_lead").every((entry) => !("ecommerce" in entry))).toBe(true);
    expect(eventsNamed("generate_lead").every((entry) => !("items" in entry))).toBe(true);
  });

  it("keeps failed contact submissions silent and on the form", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const endpoint = url.pathname.replace(/^\/api\//, "");
      const method = (init?.method || "GET") as string;
      if (!url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      if (method === "POST") return new Response("Unavailable", { status: 400 });
      return new Response(JSON.stringify({ status: true, data: defaultEndpoints(endpoint) }), { status: 200 });
    }));
    const ui = render(<ContactForm tourId={19} tourTitle="Star Watching Adventure" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled());
    fillTourInquiry();
    fireEvent.submit(ui.container.querySelector("form")!);

    await waitFor(() => expect(ui.container.querySelector("form")!.checkValidity()).toBe(true));
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled());
    expect(window.location.pathname).not.toBe("/thankful");
    expect(push).not.toHaveBeenCalled();
    expect(eventsNamed("generate_lead")).toHaveLength(0);
  });
});
