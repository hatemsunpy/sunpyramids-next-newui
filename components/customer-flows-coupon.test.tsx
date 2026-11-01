import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CartFlow } from "@/components/CustomerFlows";
import { CurrencyProvider } from "@/components/CurrencyProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const countries = [{ id: 50, name: "Egypt", code: "EG", phone_code: "+20", length: 10 }];

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
      received!((payload), status);
    },
  };
}

function cart(list: any[]) {
  cartData = list;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
}

function cookieValue(name: string) {
  const raw = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  return raw ? decodeURIComponent(raw.split("=").slice(1).join("=")) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

beforeEach(() => {
  cartData = [{ type: "tour", id: 1, adults: 2, children: 0, infants: 0, tour: { id: 11, title: "Pyramids Day Tour", adult_price: 100 } }];
  apiCalls.length = 0;
  for (const key of Object.keys(deferred)) delete deferred[key];
  setCookie("sunpyramids-token", "test-token");
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
    const data =
      endpoint === "countries" ? countries
      : endpoint === "currencies" ? [{ id: 1, title: "US Dollar", name: "USD", symbol: "$", exchange_rate: 1 }]
      : endpoint === "cart/list" ? cartData
      : [];
    return new Response(JSON.stringify({ status: true, data }), { status: 200 });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.localStorage.clear();
  deleteCookie("sunpyramids-token");
  deleteCookie("sunpyramids-checkout-data");
});

function renderCart(checkout = false) {
  return render(
    <CurrencyProvider>
      <CartFlow checkout={checkout} />
    </CurrencyProvider>,
  );
}

async function cartLoaded(container: HTMLElement) {
  await waitFor(() => expect(container.querySelectorAll(".summary-item-row").length).toBe(cartData.length));
}

async function applyCode(code: string) {
  fireEvent.change(screen.getByLabelText("Add Coupon code.."), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
}

it.each([
  { code: "SUMMER10", id: 55, value: 7, type: "percentage", label: "Discount (7%)", amount: "-$14.00", total: "$186.00", pill: "✓ Discount 7%" },
  { code: "FIXED25", id: 56, value: 25, type: "fixed", label: "Discount", amount: "-$25.00", total: "$175.00", pill: "✓ Discount $25.00" },
])("applies a validated $type coupon using the backend data contract", async ({ code, id, value, type, label, amount, total, pill }) => {
  const endpoint = `coupons/${code}/validate`;
  const validate = deferEndpoint(endpoint);
  const ui = renderCart();
  await cartLoaded(ui.container);

  await applyCode(code);
  await validate.respond({ status: true, message: "Coupon applied", data: { id, value, discount_type: type } });

  expect(apiCalls).toContainEqual(expect.objectContaining({ method: "GET", endpoint }));
  await waitFor(() => {
    expect(ui.container.querySelector(".discount-row span")?.textContent).toBe(label);
    expect(ui.container.querySelector(".discount-row strong")).toHaveTextContent(amount);
    expect(ui.container.querySelector(".total-amount")).toHaveTextContent(total);
    expect(ui.container.querySelector(".applied-coupon-pill")).toHaveTextContent(pill);
  });

  const restored = JSON.parse(cookieValue("sunpyramids-checkout-data")!);
  expect(restored.discountID).toBe(id);
  expect(restored.discountValue).toBe(value);
  expect(restored.discountType).toBe(type);
});

it("rejects an expired or invalid coupon rejection from the validate API", async () => {
  const validate = deferEndpoint("coupons/OLD1/validate");
  const ui = renderCart();
  await cartLoaded(ui.container);

  applyCode("OLD1");
  await validate.respond({ status: false, message: "The coupon has expired", data: null }, 400);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("The coupon has expired");
  expect(ui.container.querySelector(".discount-row")).toBeNull();
  expect(ui.container.querySelector(".applied-coupon-pill")).toBeNull();
  const stored = cookieValue("sunpyramids-checkout-data");
  expect(stored?.includes("discountID")).toBeFalsy();
});

it("rejects a malformed validate response that passes without usable coupon data", async () => {
  const validate = deferEndpoint("coupons/GHOST/validate");
  const ui = renderCart();
  await cartLoaded(ui.container);

  applyCode("GHOST");
  await validate.respond({ status: false, message: "Coupon not valid", data: null }, 200);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Something went wrong. Please try again.");
  expect(ui.container.querySelector(".discount-row")).toBeNull();
  expect(cookieValue("sunpyramids-checkout-data")).toBe("{}");
});

it("requires the auth token before asking the API to validate a coupon", async () => {
  deleteCookie("sunpyramids-token");
  const ui = renderCart();
  await cartLoaded(ui.container);

  applyCode("SUMMER10");

  expect(await screen.findByText("Log in")).toBeInTheDocument();
  expect(apiCalls.filter((call) => call.endpoint.startsWith("coupons/"))).toHaveLength(0);
});

it("ignores a stale coupon response after the customer edits the code", async () => {
  const staleRequest = deferEndpoint("coupons/OLD1/validate");
  const freshRequest = deferEndpoint("coupons/NEW2/validate");
  const ui = renderCart();
  await cartLoaded(ui.container);

  applyCode("OLD1");
  applyCode("NEW2");
  await staleRequest.respond({ status: true, data: { id: 55, value: 7, discount_type: "percentage" } });

  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(ui.container.querySelector(".discount-row")).toBeNull();
  expect(cookieValue("sunpyramids-checkout-data")).toBeNull();

  await freshRequest.respond({ status: true, data: { id: 66, value: 5, discount_type: "percentage" } });
  await waitFor(() => {
    expect(ui.container.querySelector(".discount-row strong")).toHaveTextContent("-$10.00");
  });
  expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();

  const restored = JSON.parse(cookieValue("sunpyramids-checkout-data")!);
  expect(restored.discountID).toBe(66);
  expect(restored.discountValue).toBe(5);
  expect(restored.discountType).toBe("percentage");
});

it("clears the validated coupon when the authoritative cart becomes empty", async () => {
  const validate = deferEndpoint("coupons/SUMMER10/validate");
  const ui = renderCart();
  await cartLoaded(ui.container);
  applyCode("SUMMER10");
  const response = validate.respond({ status: true, data: { id: 55, value: 7, discount_type: "percentage" } });
  await waitFor(() => expect(ui.container.querySelector(".discount-row")).not.toBeNull());
  await response;

  cart([]);
  fireEvent.click(ui.container.querySelector(".btn-remove-item")!);

  await waitFor(() => {
    expect(ui.container.querySelector(".summary-coupon-area")).toBeNull();
    expect(ui.container.querySelector(".applied-coupon-pill")).toBeNull();
  });
  const stored = cookieValue("sunpyramids-checkout-data");
  expect(stored?.includes("discountID")).toBeFalsy();
  expect(stored?.includes("discountValue")).toBeFalsy();
});

it("keeps cart updates loading when the coupon input changes", async () => {
  const ui = renderCart();
  await cartLoaded(ui.container);
  const refresh = deferEndpoint("cart/list");
  fireEvent.click(screen.getByRole("button", { name: "Delete Pyramids Day Tour" }));
  await waitFor(() => expect(apiCalls.filter((call) => call.endpoint === "cart/list")).toHaveLength(2));

  fireEvent.change(screen.getByLabelText("Add Coupon code.."), { target: { value: "NEXT" } });

  expect(screen.getByRole("button", { name: "Delete Pyramids Day Tour" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  await refresh.respond({ status: true, data: [] });
  await screen.findByText("Add tours or car rentals to continue.");
});

it("does not persist a coupon after its cart page unmounts", async () => {
  const validate = deferEndpoint("coupons/SLOW/validate");
  const ui = renderCart();
  await cartLoaded(ui.container);
  await applyCode("SLOW");
  ui.unmount();

  await validate.respond({ status: true, data: { id: 55, value: 7, discount_type: "percentage" } });
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(cookieValue("sunpyramids-checkout-data")).toBeNull();
});

it("restores the coupon display after checkout remount and sends coupon_id to the booking API", async () => {
  setCookie("sunpyramids-checkout-data", JSON.stringify({ discountID: 55, discountValue: 7, discountType: "percentage" }));
  const ui = renderCart(true);
  await cartLoaded(ui.container);

  await waitFor(() => {
    expect(ui.container.querySelector(".discount-row")).not.toBeNull();
    expect(ui.container.querySelector(".discount-row strong")).toHaveTextContent("-$14.00");
    expect(ui.container.querySelector(".applied-coupon-pill")).toHaveTextContent("✓ Discount 7%");
  });

  const form = ui.container.querySelector(".checkout-form-container") as HTMLFormElement;
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Phone number without country code" })).toBeInTheDocument());
  fireEvent.change(form.querySelector('[name="fullName"]')!, { target: { value: "Test Guest" } });
  fireEvent.change(form.querySelector('[name="email"]')!, { target: { value: "guest@example.com" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), { target: { value: "1012345678" } });
  fireEvent.change(form.querySelector('[name="country"]')!, { target: { value: "Egypt" } });
  fireEvent.change(form.querySelector('[name="state"]')!, { target: { value: "Cairo" } });
  expect(form.checkValidity()).toBe(true);
  fireEvent.submit(form);

  await waitFor(() => {
    expect(apiCalls).toContainEqual(expect.objectContaining({
      method: "POST",
      endpoint: "bookings",
      body: expect.objectContaining({ coupon_id: 55, email: "guest@example.com" }),
    }));
  });
});

it("keeps the booking payload unchanged when no coupon was validated", async () => {
  const ui = renderCart(true);
  await cartLoaded(ui.container);

  const form = ui.container.querySelector(".checkout-form-container") as HTMLFormElement;
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Phone number without country code" })).toBeInTheDocument());
  fireEvent.change(form.querySelector('[name="fullName"]')!, { target: { value: "Test Guest" } });
  fireEvent.change(form.querySelector('[name="email"]')!, { target: { value: "guest@example.com" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), { target: { value: "1012345678" } });
  fireEvent.change(form.querySelector('[name="country"]')!, { target: { value: "Egypt" } });
  fireEvent.change(form.querySelector('[name="state"]')!, { target: { value: "Cairo" } });
  expect(form.checkValidity()).toBe(true);
  fireEvent.submit(form);

  await waitFor(() => {
    const booking = apiCalls.find((call) => call.method === "POST" && call.endpoint === "bookings");
    expect(booking).toBeDefined();
    expect(booking!.body.coupon_id).toBeUndefined();
  });
});
