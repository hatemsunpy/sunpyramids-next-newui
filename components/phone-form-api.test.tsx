import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AccountFlow, CartFlow, PlannerRequestFlow } from "@/components/CustomerFlows";
import { ContactForm } from "@/components/ContactForm";
import { CurrencyProvider } from "@/components/CurrencyProvider";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/recaptcha", () => ({ generateRecaptchaToken: vi.fn().mockResolvedValue(null) }));

const requests: { endpoint: string; method: string; body: Record<string, unknown> }[] = [];
const countries = [{ id: 50, name: "Egypt", code: "EG", phone_code: "+20", length: 10 }];

beforeEach(() => {
  requests.length = 0;
  document.cookie = "sunpyramids-token=test-token; path=/";
  vi.stubGlobal("fetch", vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const endpoint = new URL(String(url)).pathname.replace(/^\/api\//, "");
    const method = init?.method || "GET";
    if (method !== "GET") requests.push({ endpoint, method, body: JSON.parse(String(init?.body)) });
    const data = endpoint === "countries" ? countries
      : endpoint === "currencies" ? [{ id: 1, title: "US Dollar", name: "USD", symbol: "$", exchange_rate: 1 }]
      : endpoint === "profile/me" ? { name: "Test Guest", email: "guest@example.com", phone: "+20 1012345678" }
      : endpoint.startsWith("locations") ? { data: [{ id: 1, name: "Pickup" }] }
      : endpoint === "car/rental/available/destinations" ? [{ id: 2, name: "Dropoff" }]
      : [];
    return new Response(JSON.stringify({ status: true, data }), { status: 200 });
  }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.localStorage.clear();
  document.cookie = "sunpyramids-token=; path=/; max-age=0";
});

function fill(form: HTMLFormElement, name: string, value: string) {
  fireEvent.change(form.querySelector(`[name="${name}"]`)!, { target: { value } });
}

async function fillPhone() {
  await waitFor(() => expect(screen.getByRole("button", { name: "Country calling code: Egypt +20" })).toBeEnabled());
  fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), { target: { value: "1012345678" } });
}

it("sends the full phone through the real contact API client and resets the field on success", async () => {
  const ui = render(<ContactForm />);
  const form = ui.container.querySelector("form")!;
  await fillPhone();
  fill(form, "name", "Test Guest");
  fill(form, "email", "guest@example.com");
  fill(form, "country", "Egypt");
  fill(form, "message", "Please contact me.");
  fireEvent.submit(form);
  await waitFor(() => expect(requests).toContainEqual(expect.objectContaining({
    endpoint: "contact-requests", method: "POST", body: expect.objectContaining({ phone: "+201012345678" }),
  })));
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Phone number without country code" })).toHaveValue(""));
});

it("sends the full checkout phone with the existing booking fields", async () => {
  const ui = render(<CurrencyProvider><CartFlow checkout /></CurrencyProvider>);
  const form = ui.container.querySelector(".checkout-form-container") as HTMLFormElement;
  await fillPhone();
  fill(form, "fullName", "Test Guest");
  fill(form, "email", "guest@example.com");
  fill(form, "country", "Egypt");
  fill(form, "state", "Cairo");
  expect(form.checkValidity()).toBe(true);
  fireEvent.submit(form);
  await waitFor(() => expect(requests).toContainEqual(expect.objectContaining({
    endpoint: "bookings", method: "POST", body: expect.objectContaining({ phone: "+201012345678", currency_id: 1, payment_method_id: 9 }),
  })));
});

it("keeps the profile API phone unchanged when saving other details, and sends a full edited number", async () => {
  const ui = render(<AccountFlow />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Country calling code: Egypt +20" })).toBeEnabled());
  const form = ui.container.querySelector(".account-form") as HTMLFormElement;
  fireEvent.submit(form);
  await waitFor(() => expect(requests).toContainEqual(expect.objectContaining({
    endpoint: "profile", method: "PATCH", body: expect.objectContaining({ phone: "+20 1012345678" }),
  })));
  fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), { target: { value: "1098765432" } });
  fireEvent.submit(form);
  await waitFor(() => expect(requests).toContainEqual(expect.objectContaining({
    endpoint: "profile", method: "PATCH", body: expect.objectContaining({ phone: "+201098765432" }),
  })));
});

it("sends the selected calling code in the custom-trip phone_number field", async () => {
  const ui = render(<CurrencyProvider><PlannerRequestFlow route="make-your-trip" /></CurrencyProvider>);
  await fillPhone();
  const form = ui.container.querySelector("form")!;
  fill(form, "fullName", "Test Guest");
  fill(form, "email", "guest@example.com");
  fireEvent.click(form.querySelector('input[value="not_sure"]')!);
  fill(form, "days", "5");
  fireEvent.pointerDown(screen.getByRole("button", { name: "Nationality" }), { button: 0, ctrlKey: false });
  fireEvent.click(await screen.findByRole("menuitem", { name: "Egypt" }));
  expect(form.checkValidity()).toBe(true);
  fireEvent.submit(form);
  await waitFor(() => expect(requests).toContainEqual(expect.objectContaining({
    endpoint: "custom/trips", method: "POST", body: expect.objectContaining({ phone_number: "+201012345678" }),
  })));
});

it("sends the full rental phone and keeps the route check before adding to the cart", async () => {
  const ui = render(<CurrencyProvider><PlannerRequestFlow route="rent-car" /></CurrencyProvider>);
  await fillPhone();
  const form = ui.container.querySelector("form")!;
  fill(form, "fullName", "Test Guest");
  fill(form, "email", "guest@example.com");
  fill(form, "pickupLocationId", "1");
  await waitFor(() => expect(form.querySelector('select[name="destinationId"]')).toBeEnabled());
  fill(form, "destinationId", "2");
  fill(form, "pickupTime", "10:00");
  fill(form, "nationality", "Egypt");
  fireEvent.click(form.querySelector("#planner-pickup-date")!);
  fireEvent.click(screen.getByRole("button", { name: "Today" }));
  expect(form.checkValidity()).toBe(true);
  fireEvent.submit(form);
  await waitFor(() => expect(requests).toContainEqual(expect.objectContaining({
    endpoint: "cart/rentals/append", method: "POST", body: expect.objectContaining({ phone: "+201012345678", currency_id: 1 }),
  })));
  expect(requests.findIndex((request) => request.endpoint === "car/rental/search/for/route"))
    .toBeLessThan(requests.findIndex((request) => request.endpoint === "cart/rentals/append"));
});

it("does not send a contact request when country loading fails", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: "Unavailable" }), { status: 503 }));
  const ui = render(<ContactForm />);
  await screen.findByRole("alert");
  const form = ui.container.querySelector("form")!;
  expect(form.checkValidity()).toBe(false);
  fireEvent.submit(form);
  expect(requests).toHaveLength(0);
});
