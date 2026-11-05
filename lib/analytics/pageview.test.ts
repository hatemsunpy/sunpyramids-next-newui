import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emitRoutePageView, resetAppPageViewTracking } from "@/lib/analytics/pageview";
import { resetDocumentTrackingState } from "@/lib/analytics/datalayer";

const ORIGIN = "https://fixture.test";

type Route = { origin: string; pathname: string; search: string; referrer: string };

function signal(overrides: Partial<Route> = {}): Route {
  return { origin: ORIGIN, pathname: "/", search: "", referrer: "", ...overrides };
}

function queue(): Record<string, unknown>[] {
  return window.dataLayer as unknown as Record<string, unknown>[];
}

function trackedEvents(): Record<string, unknown>[] {
  return queue().filter(
    (entry) => !!entry && typeof entry === "object" && "event" in entry,
  ) as Record<string, unknown>[];
}

function setDocumentReferrer(value: string) {
  Object.defineProperty(document, "referrer", { value, configurable: true });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
  window.history.replaceState({}, "", "/");
  resetDocumentTrackingState();
  window.dataLayer = [];
  resetAppPageViewTracking();
  setDocumentReferrer("");
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_TRACKING_V2;
  setDocumentReferrer("");
  resetDocumentTrackingState();
  window.history.replaceState({}, "", "/");
});

describe("emitRoutePageView", () => {
  it("emits the initial load: under v2 the app owns every page view", () => {
    expect(emitRoutePageView(signal())).toBe(true);
    const event = trackedEvents()[0];
    expect(event.event).toBe("app_page_view");
    expect(event.page_location).toBe(`${ORIGIN}/`);
    expect(event.page_title).toBe("Sun Pyramids Tours");
    // External referrer absent: the field is explicit and EMPTY (clears GA's
    // inherited history referrer), never fabricated from another origin.
    expect(event.page_referrer).toBe("");
  });

  it("emits once per adjacent navigation: A -> B -> A yields three events", () => {
    expect(emitRoutePageView(signal())).toBe(true);
    expect(emitRoutePageView(signal({ pathname: "/cart" }))).toBe(true);
    expect(emitRoutePageView(signal({ pathname: "/" }))).toBe(true);
    expect(trackedEvents().map((entry) => entry.page_location as string)).toEqual([
      `${ORIGIN}/`,
      `${ORIGIN}/cart`,
      `${ORIGIN}/`,
    ]);
  });

  it("suppresses adjacent duplicates (rerender or currency update) without losing the next real move", () => {
    emitRoutePageView(signal());
    expect(emitRoutePageView(signal())).toBe(false);
    expect(emitRoutePageView(signal({ pathname: "/cart" }))).toBe(true);
    expect(emitRoutePageView(signal({ pathname: "/cart" }))).toBe(false);
    expect(emitRoutePageView(signal({ pathname: "/cart", search: "?utm_source=y" }))).toBe(true);
    expect(trackedEvents().map((entry) => entry.page_location as string)).toEqual([
      `${ORIGIN}/`,
      `${ORIGIN}/cart`,
      `${ORIGIN}/cart?utm_source=y`,
    ]);
  });

  it("carries the previous sanitized location as the SPA referrer", () => {
    emitRoutePageView(signal({ search: "?utm_source=mail" }));
    emitRoutePageView(signal({ pathname: "/cart", referrer: "https://external.example/whatever" }));
    emitRoutePageView(signal({ pathname: "/checkout" }));
    const [first, second, third] = trackedEvents();
    // The in-app referrer is explicit: empty on the initial load.
    expect(first.page_referrer).toBe("");
    expect(second.page_referrer).toBe(`${ORIGIN}/?utm_source=mail`);
    // The external document referrer never overrides in-app history.
    expect(third.page_referrer).toBe(`${ORIGIN}/cart`);
  });

  it("uses the sanitized document.referrer only on the initial load", () => {
    // RouteAnalytics passes document.referrer as the initial route's referrer.
    setDocumentReferrer(`${ORIGIN}/landing?gclid=xyz`);
    expect(emitRoutePageView(signal({ referrer: `${ORIGIN}/landing?gclid=xyz` }))).toBe(true);
    const initial = trackedEvents()[0];
    expect(initial.page_referrer).toBe(`${ORIGIN}/landing?gclid=xyz`);
  });

  it("never emits when the arriving document referrer carries sensitive parameters", () => {
    // Fail-closed: the external referrer exposes ?email= before any tag, so
    // the whole document stays untracked regardless of the location now.
    // The decision is read on the ARRIVING document - re-capture it.
    setDocumentReferrer(`${ORIGIN}/auth/create-password?email=a@b.com`);
    resetDocumentTrackingState();
    expect(emitRoutePageView(signal())).toBe(false);
    expect(trackedEvents()).toHaveLength(0);
  });

  it("keeps attribution parameters but drops identifiers and fragments", () => {
    expect(
      emitRoutePageView(signal({ pathname: "/auth/create-password", search: "?email=a@b.com&otp=123456&token=t&utm_source=mail#g" })),
    ).toBe(true);
    expect(trackedEvents()[0].page_location).toBe(`${ORIGIN}/auth/create-password?utm_source=mail`);
  });

  it("establishes the tracking contract before the first page view", () => {
    expect(emitRoutePageView(signal())).toBe(true);
    // Shared initializer: contract carries explicit sanitized initial page
    // fields (with the real document origin), here an explicit EMPTY referrer.
    expect(queue()[0]).toEqual({
      tracking_contract: "sunpyramids_v2",
      page_location: `${window.location.origin}/`,
      page_referrer: "",
      page_title: "Sun Pyramids Tours",
    });
    expect(queue()[1]).toEqual({ ecommerce: null });
    expect(queue()[2]).toMatchObject({ event: "app_page_view" });
  });

  it("stays silent when the flag is off", () => {
    delete process.env.NEXT_PUBLIC_TRACKING_V2;
    expect(emitRoutePageView(signal())).toBe(false);
    expect(trackedEvents()).toHaveLength(0);
  });

  it("never emits on a document that arrived with sensitive parameters", () => {
    window.history.replaceState({}, "", "/auth/reset-password?token=t123");
    // The decision belongs to the ARRIVING document: re-capture, then emit.
    resetDocumentTrackingState();
    expect(emitRoutePageView(signal({ pathname: "/auth/reset-password", search: "?token=t123" }))).toBe(false);
    expect(trackedEvents()).toHaveLength(0);
    // Per-document decision: scrubbing afterwards does not re-enable signals.
    window.history.replaceState({}, "", "/auth/reset-password");
    expect(emitRoutePageView(signal({ pathname: "/auth/reset-password" }))).toBe(false);
    expect(trackedEvents()).toHaveLength(0);
  });

  it("respects the exact no-third-party opt-out", () => {
    window.history.replaceState({}, "", "/?no-third-party=1");
    expect(emitRoutePageView(signal())).toBe(false);
    // Exact-value contract: other values do not opt out.
    window.history.replaceState({}, "", "/?no-third-party=2");
    expect(emitRoutePageView(signal())).toBe(true);
  });
});