import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthFlow, PlannerRequestFlow } from "@/components/CustomerFlows";
import { ThankfulGreeting } from "@/components/ThankfulInteractions";
import { ThirdPartyScripts } from "@/components/ThirdPartyScripts";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import {
  SENSITIVE_HANDOFF_KEYS,
  handoffStorageKey,
  readSensitiveHandoff,
  saveSensitiveHandoff,
} from "@/lib/analytics/sensitive-session";
import { resetDocumentTrackingState } from "@/lib/analytics/datalayer";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => window.location.pathname,
  // Dynamic: tests set window.location.search to simulate legacy inbound URLs.
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@/lib/recaptcha", () => ({ generateRecaptchaToken: vi.fn().mockResolvedValue(null) }));

const countries = [{ id: 50, name: "Egypt", code: "EG", phone_code: "+20", length: 10 }];

const apiCalls: { method: string; endpoint: string; body: any }[] = [];

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
    const data =
      endpoint === "countries" ? countries
      : endpoint === "currencies" ? [{ id: 1, title: "US Dollar", name: "USD", symbol: "$", exchange_rate: 1 }]
      : [];
    return new Response(JSON.stringify({ status: true, data }), { status: 200 });
  }));
}

function setFlag(enabled: boolean) {
  if (enabled) {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
  } else {
    delete process.env.NEXT_PUBLIC_TRACKING_V2;
  }
}

function eventsNamed(name: string): Record<string, unknown>[] {
  return ((window.dataLayer ?? []) as unknown[]).filter(
    (entry) => !!entry && typeof entry === "object" && (entry as Record<string, unknown>).event === name,
  ) as Record<string, unknown>[];
}

function authResetEnvelope(): { email?: string; otp?: string } | null {
  const raw = window.sessionStorage.getItem(handoffStorageKey("auth-reset"));
  if (!raw) return null;
  const envelope = JSON.parse(raw) as { value?: { email?: string; otp?: string } };
  return envelope.value ?? null;
}

beforeEach(() => {
  setFlag(true);
  resetDocumentTrackingState();
  push.mockClear();
  apiCalls.length = 0;
  window.dataLayer = [];
  window.history.replaceState({}, "", "/");
  window.sessionStorage.clear();
  installFetch();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.dataLayer = [];
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
  delete process.env.NEXT_PUBLIC_TRACKING_V2;
});

async function submitAuthForm() {
  const form = document.querySelector("form.auth-form")!;
  expect(form.checkValidity()).toBe(true);
  fireEvent.submit(form);
}

describe("auth password reset flows never put email or OTP in a URL", () => {
  it("hands the email to confirm-code through the session handoff only", async () => {
    render(<AuthFlow mode="forget-password" />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "traveler@example.com" } });
    await submitAuthForm();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/auth/confirm-code"));
    expect(authResetEnvelope()).toEqual({ email: "traveler@example.com" });
  });

  it("pre-fills confirm-code from a legacy ?email link and strips it from the address bar", async () => {
    window.history.replaceState({}, "", "/auth/confirm-code?email=legacy@example.com&gclid=keep-me");
    render(<AuthFlow mode="confirm-code" />);

    const email = await waitFor(() => {
      const input = screen.getByLabelText(/Email/i) as HTMLInputElement;
      expect(input.value).toBe("legacy@example.com");
      return input;
    });
    expect(email.value).toBe("legacy@example.com");
    // The legacy identifier is consumed then removed; attribution stays.
    expect(window.location.search).toBe("?gclid=keep-me");
    expect(authResetEnvelope()).toEqual({ email: "legacy@example.com" });
    expect(window.location.pathname).toBe("/auth/confirm-code");

    fireEvent.change(screen.getByLabelText(/Confirmation code/i), { target: { value: "123456" } });
    await submitAuthForm();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/auth/create-password"));
    expect(authResetEnvelope()).toEqual({ email: "legacy@example.com", otp: "123456" });
  });

  it("REPLACES stale stored reset context when a fresh legacy link arrives", async () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset, { email: "stale@x.com", otp: "999999" });
    window.history.replaceState({}, "", "/auth/confirm-code?email=fresh@example.com");
    render(<AuthFlow mode="confirm-code" />);

    const email = await waitFor(() => {
      const input = screen.getByLabelText(/Email/i) as HTMLInputElement;
      expect(input.value).toBe("fresh@example.com");
      return input;
    });
    expect(email.value).toBe("fresh@example.com");
    // The new attempt must not inherit the old attempt's confirmation code.
    const otp = screen.getByLabelText(/Confirmation code/i) as HTMLInputElement;
    expect(otp.value).toBe("");
    expect(readSensitiveHandoff<{ email?: string; otp?: string }>(SENSITIVE_HANDOFF_KEYS.authReset))
      .toEqual({ email: "fresh@example.com" });
  });

  it("does not combine a legacy create-password email with a stored OTP", async () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset, { email: "stale@x.com", otp: "999999" });
    window.history.replaceState({}, "", "/auth/create-password?email=fresh@example.com");
    render(<AuthFlow mode="create-password" />);

    await waitFor(() => {
      const input = screen.getByLabelText(/Email/i) as HTMLInputElement;
      expect(input.value).toBe("fresh@example.com");
    });
    const otp = screen.getByLabelText(/Confirmation code/i) as HTMLInputElement;
    expect(otp.value).toBe("");
  });

  it("empty legacy ?email= and ?otp= never revive stale context or autofill stale values", async () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset, { email: "stale@x.com", otp: "999999" });
    // Legacy link with EMPTY identifiers: presence marks a fresh attempt
    // whose values are simply absent - the stale context must never combine.
    window.history.replaceState({}, "", "/auth/create-password?email=&otp=&gclid=keep-me");
    render(<AuthFlow mode="create-password" />);

    await waitFor(() => {
      const input = screen.getByLabelText(/Email/i) as HTMLInputElement;
      expect(input.value).toBe("");
    });
    const otp = screen.getByLabelText(/Confirmation code/i) as HTMLInputElement;
    expect(otp.value).toBe("");
    expect(authResetEnvelope()).toBeNull();
    expect(window.location.search).toBe("?gclid=keep-me");

    // Completing THIS attempt submits the typed values, never stale ones.
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "typed@example.com" } });
    fireEvent.change(otp, { target: { value: "777777" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "typed-password-7" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "typed-password-7" } });
    await submitAuthForm();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/auth/sign-in"));
    const reset = apiCalls.find((call) => call.endpoint === "auth/password/reset" && call.method === "POST");
    expect(reset!.body).toEqual({
      email: "typed@example.com",
      otp: "777777",
      password: "typed-password-7",
      password_confirmation: "typed-password-7",
    });
  });

  it("begins a new attempt by clearing stale context even when the request fails", async () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset, { email: "stale@x.com", otp: "999999" });
    // The forget-password POST fails: the new attempt still owns the tab's
    // reset context from submission time, not from request success.
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (!url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      if (url.pathname.includes("auth/password/forget")) return new Response("Unavailable", { status: 500 });
      const endpoint = url.pathname.replace(/^\/api\//, "");
      return new Response(JSON.stringify({ status: true, data: endpoint === "countries" ? countries : [] }), { status: 200 });
    }));
    render(<AuthFlow mode="forget-password" />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "other@example.com" } });
    await submitAuthForm();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    // Stale context must never survive into the (failed) new attempt.
    expect(authResetEnvelope()).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("completes the reset from the stored handoff and clears the session context", async () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset, { email: "finish@example.com", otp: "654321" });
    render(<AuthFlow mode="create-password" />);

    const email = await waitFor(() => {
      const input = screen.getByLabelText(/Email/i) as HTMLInputElement;
      expect(input.value).toBe("finish@example.com");
      return input;
    });
    expect(email.value).toBe("finish@example.com");
    const otp = screen.getByLabelText(/Confirmation code/i) as HTMLInputElement;
    expect(otp.value).toBe("654321");

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "new-password-1" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "new-password-1" } });
    await submitAuthForm();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/auth/sign-in"));
    await waitFor(() => expect(authResetEnvelope()).toBeNull());
    const reset = apiCalls.find((call) => call.endpoint === "auth/password/reset" && call.method === "POST");
    expect(reset!.body).toEqual({
      email: "finish@example.com",
      otp: "654321",
      password: "new-password-1",
      password_confirmation: "new-password-1",
    });
  });

  it("keeps the legacy reset-password ?token contract working without stripping the URL", async () => {
    window.history.replaceState({}, "", "/auth/reset-password?email=legacy@example.com&token=tok-123");
    // The decision belongs to the ARRIVING document: re-capture the module
    // load read for the re-positioned URL (it carries identifiers).
    resetDocumentTrackingState();
    render(<AuthFlow mode="reset-password" />);

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "typed-password-7" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "typed-password-7" } });
    await submitAuthForm();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/auth/sign-in"));
    const reset = apiCalls.find((call) => call.endpoint === "auth/password/reset" && call.method === "POST");
    expect(reset!.body).toEqual({
      email: "legacy@example.com",
      otp: "tok-123",
      password: "typed-password-7",
      password_confirmation: "typed-password-7",
    });
    // The legacy email-link contract is preserved, not silently broken.
    expect(window.location.search).toBe("?email=legacy@example.com&token=tok-123");
    // The document ARRIVED with secrets in its URL, so tracking never
    // initialized on it - the flag stays on, yet the queue stays untouched.
    expect(((window.dataLayer ?? []) as unknown[])).toHaveLength(0);
    expect(((window.dataLayer ?? []) as unknown[]).some(
      (entry) => (entry as Record<string, unknown>).tracking_contract !== undefined,
    )).toBe(false);
  });

  it("recovers the handoff within the same document when storage is blocked", async () => {
    const fail = () => {
      throw new Error("blocked storage");
    };
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(fail);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(fail);
    const first = render(<AuthFlow mode="forget-password" />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "traveler@example.com" } });
    await submitAuthForm();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/auth/confirm-code"));
    first.unmount();

    // Same document SPA navigation: the in-memory fallback recovers the
    // email even though sessionStorage is unavailable.
    render(<AuthFlow mode="confirm-code" />);
    await waitFor(() => {
      expect((screen.getByLabelText(/Email/i) as HTMLInputElement).value).toBe("traveler@example.com");
    });
  });
});

describe("thankful greeting uses the session handoff, never the URL", () => {
  it("greets from the stored handoff when the URL is clean", async () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.thankfulName, { text: "Hatem Sun" });
    render(<ThankfulGreeting template="Thank you, {name}!" fallback="Thank you for reaching out!" />);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thank you, Hatem Sun!"));
    expect(window.location.search).toBe("");
  });

  it("consumes a legacy ?name link, stores it, and removes the identifier from the URL", async () => {
    window.history.replaceState({}, "", "/thankful?name=Hatem%20Sun&gclid=keep-me");
    render(<ThankfulGreeting template="Thank you, {name}!" fallback="Thank you!" />);

    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thank you, Hatem Sun!"));
    expect(window.location.search).toBe("?gclid=keep-me");
    const envelope = JSON.parse(
      window.sessionStorage.getItem(handoffStorageKey("thankful-name"))!,
    ) as { value?: { text?: string } };
    expect(envelope.value).toEqual({ text: "Hatem Sun" });
  });

  it("falls back to the generic copy when nothing is stored or provided", () => {
    render(<ThankfulGreeting template="Thank you, {name}!" fallback="Thank you for reaching out!" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thank you for reaching out!");
  });

  it("a fresh legacy ?name replaces a stale stored greeting and re-saves it", async () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.thankfulName, { text: "Stale Person" });
    window.history.replaceState({}, "", "/thankful?name=Fresh%20Name&gclid=keep-me");
    render(<ThankfulGreeting template="Thank you, {name}!" fallback="Thank you!" />);

    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thank you, Fresh Name!"));
    // The stale name never survives a fresh identifier, and the URL is scrubbed.
    expect(window.location.search).toBe("?gclid=keep-me");
    const envelope = JSON.parse(
      window.sessionStorage.getItem(handoffStorageKey("thankful-name"))!,
    ) as { value?: { text?: string } };
    expect(envelope.value).toEqual({ text: "Fresh Name" });
  });

  it("an empty legacy ?name clears the stale handoff and shows the fallback", async () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.thankfulName, { text: "Stale Person" });
    window.history.replaceState({}, "", "/thankful?name=&gclid=keep-me");
    render(<ThankfulGreeting template="Thank you, {name}!" fallback="Thank you!" />);

    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thank you!"));
    // Presence without data must not revive stored personal data.
    expect(window.sessionStorage.getItem(handoffStorageKey("thankful-name"))).toBeNull();
    expect(window.location.search).toBe("?gclid=keep-me");
  });
});

describe("sensitive arriving documents keep every tracking surface off", () => {
  // Real layout composition: the identifier-consuming leaf (the greeting)
  // renders as a SIBLING of the script loader in the same document. The
  // arriving-document decision is captured before any effect can scrub the
  // ?name= parameter, so the composition stays silent in EITHER mode - and
  // the identifier is still consumed and stripped for the user journey.
  it.each([
    ["v2", true],
    ["legacy", false],
  ])("%s: ThankfulGreeting next to ThirdPartyScripts never initializes tracking", async (_mode, flag) => {
    setFlag(flag);
    window.history.replaceState({}, "", "/thankful?name=Hatem%20Sun&gclid=keep-me");
    // The decision belongs to the ARRIVING document: re-capture it BEFORE
    // any effect runs.
    resetDocumentTrackingState();
    render(
      <>
        <ThankfulGreeting template="Thank you, {name}!" fallback="Thank you!" />
        <ThirdPartyScripts />
      </>,
    );

    // The greeting still works for the visitor.
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thank you, Hatem Sun!"));
    expect(window.location.search).toBe("?gclid=keep-me");
    // Zero tracking: no third-party scripts and no data-layer writes at all,
    // even though the URL was already scrubbed by the consuming effect.
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(0);
    expect(window.dataLayer).toHaveLength(0);
  });

  it("v2 initializes exactly once on a clean document rendered as the same composition", async () => {
    setFlag(true);
    window.history.replaceState({}, "", "/thankful?gclid=keep-me");
    resetDocumentTrackingState();
    render(
      <>
        <ThankfulGreeting template="Thank you, {name}!" fallback="Thank you!" />
        <ThirdPartyScripts />
      </>,
    );

    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thank you!"));
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(1);
    const queue = (window.dataLayer ?? []) as unknown[];
    expect(queue.filter((entry) => (entry as Record<string, unknown>).event === "gtm.js")).toHaveLength(1);
    // No identifiers travel into the data layer: the page_location carries
    // attribution only.
    const contract = queue.find(
      (entry) => (entry as Record<string, unknown>).tracking_contract !== undefined,
    ) as Record<string, unknown> | undefined;
    expect(contract?.page_location).toBe(`${window.location.origin}/thankful?gclid=keep-me`);
  });
});

describe("make-your-trip lead signal", () => {
  async function fillPlannerForm() {
    await waitFor(() => expect(screen.getByRole("button", { name: /Request Custom Itinerary/i })).toBeEnabled());
    fireEvent.click(screen.getByLabelText(/Not sure/i));
    fireEvent.change(screen.getByLabelText(/Desired Trip Length/i), { target: { value: "14" } });
    fireEvent.change(document.querySelector<HTMLInputElement>("input[name='fullName']")!, { target: { value: "Hatem Planner" } });
    fireEvent.change(document.querySelector<HTMLInputElement>("input[name='email']")!, { target: { value: "traveler@example.com" } });
    // The tel input has no name attribute; the hidden wrapper input named
    // "phone" is programmed by the component, never a validated field.
    fireEvent.change(screen.getByRole("textbox", { name: "Phone number without country code" }), { target: { value: "1012345678" } });
    fireEvent.pointerDown(screen.getByRole("button", { name: /Nationality/i }), { button: 0, ctrlKey: false });
    fireEvent.click(await screen.findByRole("menuitem", { name: /Egypt/ }));
  }

  it("emits generate_lead as custom_trip and navigates to a clean /thankful", async () => {
    const ui = render(
      <CurrencyProvider>
        <PlannerRequestFlow route="make-your-trip" />
      </CurrencyProvider>,
    );
    await fillPlannerForm();

    const form = ui.container.querySelector("form.planner-form-card")!;
    expect(form.checkValidity()).toBe(true);
    fireEvent.submit(form);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/thankful"));
    const leads = eventsNamed("generate_lead");
    expect(leads).toHaveLength(1);
    expect(leads[0].form_type).toBe("custom_trip");
    expect(String(push.mock.calls.at(-1)![0])).not.toContain("name=");
    expect(window.location.pathname).toBe("/");
    const envelope = JSON.parse(
      window.sessionStorage.getItem(handoffStorageKey("thankful-name"))!,
    ) as { value?: { text?: string } };
    expect(envelope.value).toEqual({ text: "Hatem Planner" });
    const posted = apiCalls.find((call) => call.endpoint === "custom/trips" && call.method === "POST");
    expect(posted!.body.email).toBe("traveler@example.com");
  });

  it("never emits generate_lead or navigates when the trip request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const endpoint = url.pathname.replace(/^\/api\//, "");
      const method = (init?.method || "GET") as string;
      if (!url.pathname.startsWith("/api/")) return new Response(JSON.stringify({ country: "US" }), { status: 200 });
      if (method === "POST") return new Response("Unavailable", { status: 500 });
      return new Response(JSON.stringify({ status: true, data: endpoint === "countries" ? countries : [] }), { status: 200 });
    }));
    const ui = render(
      <CurrencyProvider>
        <PlannerRequestFlow route="make-your-trip" />
      </CurrencyProvider>,
    );
    await fillPlannerForm();

    fireEvent.submit(ui.container.querySelector("form.planner-form-card")!);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(eventsNamed("generate_lead")).toHaveLength(0);
    expect(push).not.toHaveBeenCalled();
  });
});