import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { RouteAnalytics } from "@/components/RouteAnalytics";
import {
  DIRECT_GA_SRC,
  GA_MEASUREMENT_ID,
  GTM_SRC,
  ThirdPartyScripts,
} from "@/components/ThirdPartyScripts";
import { TRACKING_V2_CONTRACT, emitViewItem, resetDocumentTrackingState } from "@/lib/analytics/datalayer";
import { emitRoutePageView, resetAppPageViewTracking } from "@/lib/analytics/pageview";

const nav = vi.hoisted(() => ({
  pathname: "/",
  search: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
}));

declare global {
  interface Window {
    __sunpyramidsGtagQueued?: boolean;
    __sunpyramidsGtmStartPushed?: boolean;
    __sunpyramidsGaFallbackAttempted?: boolean;
  }
}

function queue(): Record<string, unknown>[] {
  return (window.dataLayer ?? []) as unknown as Record<string, unknown>[];
}

function trackedEvents(): Record<string, unknown>[] {
  return queue().filter(
    (entry) => !!entry && typeof entry === "object" && "event" in entry,
  ) as Record<string, unknown>[];
}

function pageContextAtEvents(event: string) {
  const model: Record<string, unknown> = {};
  const contexts: { location: unknown; referrer: unknown }[] = [];
  for (const entry of queue()) {
    Object.assign(model, entry);
    if (entry.event === event) contexts.push({ location: model.page_location, referrer: model.page_referrer });
  }
  return contexts;
}

// The component signals the live document address, so the mock navigation is
// applied to real history as an applied SPA navigation would.
function navigate(pathname: string, search = "") {
  nav.pathname = pathname;
  nav.search = search;
  window.history.replaceState({}, "", `${pathname}${search}`);
}

function setDocumentReferrer(value: string) {
  Object.defineProperty(document, "referrer", { value, configurable: true });
}

// The shared initializer's full entry: contract + explicit sanitized initial
// page fields (explicit EMPTY referrer clears inherited GA history state).
function expectedContractEntry(location: string): Record<string, unknown> {
  return {
    tracking_contract: TRACKING_V2_CONTRACT,
    page_location: location,
    page_referrer: "",
    page_title: "Sun Pyramids Tours",
  };
}

function resetTrackingDom() {
  document.head
    .querySelectorAll('script[src*="googletagmanager.com"]')
    .forEach((node) => node.remove());
  delete window.__sunpyramidsGtagQueued;
  delete window.__sunpyramidsGtmStartPushed;
  delete window.__sunpyramidsGaFallbackAttempted;
  delete (window as unknown as Record<string, unknown>).dataLayer;
  delete (window as unknown as Record<string, unknown>).gtag;
  navigate("/");
  resetAppPageViewTracking();
  resetDocumentTrackingState();
  setDocumentReferrer("");
}

beforeEach(() => {
  resetTrackingDom();
});

afterEach(() => {
  cleanup();
  delete process.env.NEXT_PUBLIC_TRACKING_V2;
  resetTrackingDom();
});

describe("RouteAnalytics app_page_view", () => {
  it("keeps commerce on the new route when a child emits before the route effect", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    const signalRoute = () => emitRoutePageView({
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      referrer: document.referrer,
    });
    navigate("/tour/a");
    signalRoute();
    for (const path of ["/tour/b", "/tour/a"]) {
      navigate(path);
      emitViewItem({ itemId: path, itemName: "Synthetic tour" }, null);
      signalRoute();
    }
    const origin = window.location.origin;
    expect(pageContextAtEvents("view_item")).toEqual([
      { location: `${origin}/tour/b`, referrer: `${origin}/tour/a` },
      { location: `${origin}/tour/a`, referrer: `${origin}/tour/b` },
    ]);
    expect(trackedEvents().filter(entry => entry.event === "app_page_view")).toHaveLength(3);
    expect(queue().filter(entry => entry.tracking_contract === TRACKING_V2_CONTRACT)).toHaveLength(1);
  });

  it("sanitizes inherited page context when reusing or replacing a marked queue", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    for (let replacement = 0; replacement < 2; replacement++) {
      window.dataLayer = [{
        tracking_contract: TRACKING_V2_CONTRACT,
        page_location: "https://unsafe.invalid/?email=private@example.com",
        page_referrer: "https://unsafe.invalid/?token=private",
      }];
      const existing = window.dataLayer;
      emitViewItem({ itemId: "synthetic", itemName: "Synthetic tour" }, null);
      expect(window.dataLayer).toBe(existing);
      expect(pageContextAtEvents("view_item")).toEqual([
        { location: `${window.location.origin}/`, referrer: "" },
      ]);
      expect(queue().filter(entry => entry.tracking_contract === TRACKING_V2_CONTRACT)).toHaveLength(1);
    }
  });

  it("emits the initial load once under StrictMode (the app owns every page view)", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    render(<StrictMode><RouteAnalytics /></StrictMode>);
    expect(trackedEvents()).toHaveLength(1);
    const event = trackedEvents()[0];
    expect(event.event).toBe("app_page_view");
    expect(event.page_location).toBe(`${window.location.origin}/`);
    expect(event.page_title).toBe("Sun Pyramids Tours");
    // No external referrer on the initial load: explicit and empty.
    expect(event.page_referrer).toBe("");
    // Queue layout on the first signal: contract, then commerce clear, then event.
    expect(queue()[0]).toEqual(expectedContractEntry(`${window.location.origin}/`));
    expect(queue()[1]).toEqual({ ecommerce: null });
  });

  it("emits one sanitized app_page_view for a client navigation", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    const ui = render(<RouteAnalytics />);
    navigate("/cart", "?email=a@b.com&utm_source=mail#g");
    ui.rerender(<RouteAnalytics />);
    expect(trackedEvents()).toHaveLength(2);
    const event = trackedEvents()[1];
    expect(event.page_location).toBe(`${window.location.origin}/cart?utm_source=mail`);
    // SPA navigation: the previous IN-APP location is the referrer.
    expect(event.page_referrer).toBe(`${window.location.origin}/`);
  });

  it("suppresses adjacent duplicates but keeps the A -> B -> A sequence", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    const ui = render(<RouteAnalytics />);
    navigate("/cart");
    ui.rerender(<RouteAnalytics />);
    ui.rerender(<RouteAnalytics />);
    expect(trackedEvents().map((entry) => entry.page_location as string)).toEqual([
      `${window.location.origin}/`,
      `${window.location.origin}/cart`,
    ]);
    navigate("/");
    ui.rerender(<RouteAnalytics />);
    expect(trackedEvents().map((entry) => entry.page_location as string)).toEqual([
      `${window.location.origin}/`,
      `${window.location.origin}/cart`,
      `${window.location.origin}/`,
    ]);
  });

  it("uses the sanitized external document.referrer only for the initial load", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    setDocumentReferrer(`${window.location.origin}/landing?gclid=xyz`);
    const ui = render(<RouteAnalytics />);
    const initial = trackedEvents()[0];
    expect(initial.page_referrer).toBe(`${window.location.origin}/landing?gclid=xyz`);
    navigate("/tours");
    ui.rerender(<RouteAnalytics />);
    expect(trackedEvents()[1].page_referrer).toBe(`${window.location.origin}/`);
  });

  it("never emits when the arriving document referrer carries sensitive parameters", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    // The decision belongs to the ARRIVING document: set the referrer first,
    // then re-capture the module-load read before any component renders.
    setDocumentReferrer(`${window.location.origin}/auth/create-password?email=a@b.com`);
    resetDocumentTrackingState();
    render(<RouteAnalytics />);
    expect(window.dataLayer).toBeUndefined();
  });

  it("never emits on a document that arrived with sensitive parameters", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    window.history.replaceState({}, "", "/auth/reset-password?token=t123");
    resetAppPageViewTracking();
    resetDocumentTrackingState();
    render(<RouteAnalytics />);
    expect(window.dataLayer).toBeUndefined();
  });

  it("emits nothing at all when the flag is off", () => {
    const ui = render(<RouteAnalytics />);
    navigate("/cart", "?utm_source=mail");
    ui.rerender(<RouteAnalytics />);
    navigate("/");
    ui.rerender(<RouteAnalytics />);
    expect(window.dataLayer).toBeUndefined();
  });
});

describe("ThirdPartyScripts tracking v2 switch", () => {
  it("keeps the UI working and loads no container if its queue cannot initialize", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    const blocked: unknown[] = [];
    Object.freeze(blocked);
    window.dataLayer = blocked;
    expect(() => render(<ThirdPartyScripts />)).not.toThrow();
    expect(window.dataLayer).toBe(blocked);
    expect(trackedEvents()).toHaveLength(0);
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(0);
  });

  it("emits the initial page view with the contract before gtm.start and skips config", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    render(<StrictMode><ThirdPartyScripts /></StrictMode>);

    const entries = queue();
    expect(entries[0]).toEqual(expectedContractEntry(`${window.location.origin}/`));
    expect(entries[1]).toEqual({ ecommerce: null });
    expect(entries[2]).toMatchObject({ event: "app_page_view", page_location: `${window.location.origin}/` });
    expect(entries[3]).toMatchObject({ event: "gtm.js" });
    // StrictMode must not duplicate the initial page view or gtm.start.
    expect(trackedEvents().filter((entry) => entry.event === "app_page_view")).toHaveLength(1);
    expect(entries.filter((entry) => (entry as Record<string, unknown>).event === "gtm.js")).toHaveLength(1);
    // No gtag js/config commands in v2: the app owns every page view.
    for (const entry of entries) {
      expect(Array.isArray(entry)).toBe(false);
    }
    expect(document.querySelectorAll(`script[src="${GTM_SRC}"]`)).toHaveLength(1);
    expect(document.querySelectorAll(`script[src="${DIRECT_GA_SRC}"]`)).toHaveLength(0);
  });

  it("keeps a single GA4 sender: no direct fallback stream and no replay", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    render(<ThirdPartyScripts />);
    const node = document.querySelector<HTMLScriptElement>(`script[src="${GTM_SRC}"]`);
    act(() => { node!.dispatchEvent(new Event("error")); });
    expect(document.querySelectorAll(`script[src="${DIRECT_GA_SRC}"]`)).toHaveLength(0);
    // In v2 the fallback is refused before any attempt flag is touched.
    expect(window.__sunpyramidsGaFallbackAttempted).toBeUndefined();
  });

  it("preserves the legacy behavior while the flag stays off", () => {
    render(<StrictMode><ThirdPartyScripts /></StrictMode>);
    const entries = queue();
    // gtag("js"), gtag("config"), gtm.start
    expect(entries).toHaveLength(3);
    expect(entries[1]).toEqual(["config", GA_MEASUREMENT_ID]);
    // No contract marker and no app page-view ownership in legacy mode.
    for (const entry of entries) {
      expect("tracking_contract" in (entry as Record<string, unknown>)).toBe(false);
      expect("event" in (entry as Record<string, unknown>) && (entry as Record<string, unknown>).event === "app_page_view").toBe(false);
    }
  });

  it("sibling composition stays exactly-once: RouteAnalytics plus ThirdPartyScripts emit one initial view", () => {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    // Real layout order: both analytics leaves live in the same document.
    render(
      <>
        <RouteAnalytics />
        <ThirdPartyScripts />
      </>,
    );
    // The shared page-view module dedupes across siblings: one contract, one
    // initial view, one container start - never a duplicated page view.
    expect(trackedEvents().filter((entry) => entry.event === "app_page_view")).toHaveLength(1);
    expect(trackedEvents().filter((entry) => entry.event === "gtm.js")).toHaveLength(1);
    expect(
      queue().filter(
        (entry) => (entry as Record<string, unknown>).tracking_contract === TRACKING_V2_CONTRACT,
      ),
    ).toHaveLength(1);
    expect(document.querySelectorAll(`script[src="${GTM_SRC}"]`)).toHaveLength(1);
    expect(document.querySelectorAll(`script[src="${DIRECT_GA_SRC}"]`)).toHaveLength(0);
  });

  it.each([
    ["v2", true],
    ["legacy", false],
  ])("loads zero third-party scripts on a %s document with sensitive parameters", (_mode, flag) => {
    if (flag) process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
    window.history.replaceState({}, "", "/auth/reset-password?token=t123");
    // The decision belongs to the ARRIVING document: re-capture it here.
    resetDocumentTrackingState();
    render(<ThirdPartyScripts />);
    expect(window.dataLayer).toBeUndefined();
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(0);
  });

  it("loads no scripts when the no-third-party opt-out is set", () => {
    window.history.replaceState({}, "", "/?no-third-party=1");
    render(<ThirdPartyScripts />);
    expect(window.dataLayer).toBeUndefined();
    expect(document.querySelectorAll('script[src*="googletagmanager.com"]')).toHaveLength(0);
  });
});
