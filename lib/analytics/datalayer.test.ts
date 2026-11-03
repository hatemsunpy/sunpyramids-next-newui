import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  TRACKING_V2_CONTRACT,
  analyticsCurrencyCode,
  buildEcommerceBasket,
  buildEcommerceItem,
  convertAnalyticsAmount,
  emitAddPaymentInfo,
  emitAddToCart,
  emitBeginCheckout,
  emitGenerateLead,
  emitRemoveFromCart,
  emitViewCart,
  emitViewItem,
  ensureTrackingContract,
  isTrackingV2,
  resetDocumentTrackingState,
} from "@/lib/analytics/datalayer";
import { resetAppPageViewTracking } from "@/lib/analytics/pageview";

const USD = { name: "USD", exchange_rate: 1 };
const EUR = { name: "EUR", exchange_rate: 0.925 };

function queue(): Record<string, unknown>[] {
  return window.dataLayer as unknown as Record<string, unknown>[];
}

function trackedEvents(): Record<string, unknown>[] {
  return queue().filter(
    (entry) => !!entry && typeof entry === "object" && "event" in entry,
  ) as Record<string, unknown>[];
}

function contractMarkers(): unknown[] {
  return queue().filter(
    (entry) => !!entry && typeof entry === "object" && (entry as Record<string, unknown>).tracking_contract === TRACKING_V2_CONTRACT,
  );
}

// The shared initializer's full entry: contract + explicit sanitized initial
// page fields. page_title is the static brand value, never a personal name.
function expectedContractEntry(location: string, referrer = ""): Record<string, unknown> {
  return {
    tracking_contract: TRACKING_V2_CONTRACT,
    page_location: location,
    page_referrer: referrer,
    page_title: "Sun Pyramids Tours",
  };
}

function setFlag(enabled: boolean) {
  if (enabled) {
    process.env.NEXT_PUBLIC_TRACKING_V2 = "true";
  } else {
    delete process.env.NEXT_PUBLIC_TRACKING_V2;
  }
}

beforeEach(() => {
  setFlag(true);
  // Restore the document BEFORE re-capturing its decision: the arriving-URL
  // read must reflect this test's fresh document, never the previous test's.
  window.history.replaceState({}, "", "/");
  resetDocumentTrackingState();
  window.dataLayer = [];
  resetAppPageViewTracking();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_TRACKING_V2;
  window.history.replaceState({}, "", "/");
});

describe("tracking v2 flag", () => {
  it("defaults to off when the env flag is missing", () => {
    setFlag(false);
    expect(isTrackingV2()).toBe(false);
  });

  it("exposes the published contract id", () => {
    expect(TRACKING_V2_CONTRACT).toBe("sunpyramids_v2");
  });
});

describe("money conversion", () => {
  it("converts base amounts with the selected API currency only", () => {
    expect(convertAnalyticsAmount(100, USD)).toBe(100);
    expect(convertAnalyticsAmount(100, EUR)).toBe(92.5);
  });

  it("rounds like the displayed currency amount", () => {
    expect(convertAnalyticsAmount(100.005, USD)).toBe(100);
    expect(convertAnalyticsAmount(2.675, USD)).toBe(2.67);
    expect(convertAnalyticsAmount(33.333333, EUR)).toBe(30.83);
  });

  it("omits money instead of relabelling base values", () => {
    expect(convertAnalyticsAmount(100, null)).toBeNull();
    expect(convertAnalyticsAmount(100, {})).toBeNull();
    expect(convertAnalyticsAmount(100, { name: "EUR" })).toBeNull();
    expect(convertAnalyticsAmount(100, { name: "EUR", exchange_rate: 0 })).toBeNull();
    expect(convertAnalyticsAmount(-5, USD)).toBeNull();
    expect(convertAnalyticsAmount(null, USD)).toBeNull();
  });

  it("rejects non-finite converted amounts instead of emitting overflow", () => {
    expect(convertAnalyticsAmount(1e308, { name: "USD", exchange_rate: 2 })).toBeNull();
  });

  it("drops all money when the basket sum itself overflows", () => {
    // Each item converts fine; only the SUM overflows - the whole event's
    // money (currency included) must go, never a silent wrong total.
    const basket = buildEcommerceBasket(
      [
        { itemId: 1, itemName: "A", amountBase: 1.7e308 },
        { itemId: 2, itemName: "B", amountBase: 1.7e308 },
      ],
      USD,
    );
    expect(basket?.items).toHaveLength(2);
    expect(basket?.items.every((item) => item.price === undefined)).toBe(true);
    expect(basket?.value).toBeNull();
    expect(basket?.currency).toBeNull();
  });

  it("accepts exactly three-letter ISO currency codes", () => {
    expect(analyticsCurrencyCode(USD)).toBe("USD");
    expect(analyticsCurrencyCode({ name: "eur", exchange_rate: 1 })).toBe("EUR");
    expect(analyticsCurrencyCode({ name: "", exchange_rate: 1 })).toBeNull();
    expect(analyticsCurrencyCode({ name: "US Dollar", exchange_rate: 1 })).toBeNull();
    expect(analyticsCurrencyCode({ name: "USDX", exchange_rate: 1 })).toBeNull();
    expect(analyticsCurrencyCode(null)).toBeNull();
  });
});

describe("item building", () => {
  it("emits the bounded allowlist and nothing else", () => {
    const item = buildEcommerceItem(
      { itemId: 9, itemName: " Nile Cruise ", quantity: 1, itemCategory: "tour", amountBase: 150 } as never,
      USD,
    );
    expect(item).toEqual({ item_id: "9", item_name: "Nile Cruise", quantity: 1, item_category: "tour", price: 150 });
    expect(Object.keys(item as object)).toEqual(["item_id", "item_name", "quantity", "item_category", "price"]);
  });

  it("drops unnameable rows and defaults quantity to one booking group", () => {
    expect(buildEcommerceItem({ itemId: 1, itemName: "  " }, USD)).toBeNull();
    expect(buildEcommerceItem({ itemId: "", itemName: "x" }, USD)).toBeNull();
    expect(buildEcommerceItem({ itemId: 0, itemName: "x" }, USD)).toBeNull();
    expect(buildEcommerceItem({ itemId: 1, itemName: "x" }, USD)).toEqual({ item_id: "1", item_name: "x", quantity: 1 });
  });

  it("drops all money together when any input row is unnameable (never a partial whole-cart total)", () => {
    const basket = buildEcommerceBasket(
      [
        { itemId: 1, itemName: "A", amountBase: 100 },
        { itemId: 2, itemName: "B", amountBase: 60 },
        { itemId: 3, itemName: "   ", amountBase: 10 },
      ],
      USD,
    );
    // The named items stay moneyless: a partial sum would understate the
    // displayed whole-cart total.
    expect(basket?.items.map((item) => item.item_name)).toEqual(["A", "B"]);
    expect(basket?.items.every((item) => item.price === undefined)).toBe(true);
    expect(basket?.value).toBeNull();
    expect(basket?.currency).toBeNull();
  });

  it("sums the basket value so it always equals item price x quantity", () => {
    const basket = buildEcommerceBasket(
      [
        { itemId: 1, itemName: "A", amountBase: 100 },
        { itemId: 2, itemName: "B", amountBase: 50.25, quantity: 2 },
      ],
      USD,
    );
    expect(basket?.value).toBe(200.5);
    expect(basket?.items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0)).toBe(basket?.value);
  });

  it("drops all money together when one cart item has no agreed price", () => {
    const basket = buildEcommerceBasket(
      [
        { itemId: 1, itemName: "A", amountBase: 100 },
        { itemId: 2, itemName: "B", amountBase: null },
      ],
      EUR,
    );
    expect(basket?.items.map((item) => item.item_name)).toEqual(["A", "B"]);
    expect(basket?.items.every((item) => item.price === undefined)).toBe(true);
    expect(basket?.value).toBeNull();
    expect(basket?.currency).toBeNull();
  });

  it("drops all money when the currency code is not three letters", () => {
    const basket = buildEcommerceBasket(
      [{ itemId: 1, itemName: "A", amountBase: 100 }],
      { name: "US Dollar", exchange_rate: 1 },
    );
    expect(basket?.items[0]?.price).toBeUndefined();
    expect(basket?.value).toBeNull();
    expect(basket?.currency).toBeNull();
  });

  it("omits money when no price is agreed", () => {
    const basket = buildEcommerceBasket([{ itemId: "car-rental", itemName: "Car rental", itemCategory: "rental" }], null);
    expect(basket?.items[0]?.price).toBeUndefined();
    expect(basket?.value).toBeNull();
    expect(basket?.currency).toBeNull();
  });
});

describe("tracking contract", () => {
  it("establishes the v2 contract before any event, including the earliest producer", () => {
    expect(emitViewItem({ itemId: 1, itemName: "A" }, null)).toBe(true);
    expect(queue()[0]).toEqual(expectedContractEntry(`${window.location.origin}/`));
    expect(queue()[1]).toEqual({ ecommerce: null });
    expect(queue()[2]).toMatchObject({ event: "view_item" });
    // A later event must not push a second marker.
    expect(emitGenerateLead("contact")).toBe(true);
    expect(contractMarkers()).toHaveLength(1);
  });

  it("is shared with the container-start push instead of duplicated", () => {
    emitViewItem({ itemId: 1, itemName: "A" }, null);
    expect(ensureTrackingContract()).toBe(true);
    expect(contractMarkers()).toHaveLength(1);
    expect(queue()[0]).toEqual(expectedContractEntry(`${window.location.origin}/`));
  });

  it("recognizes a pre-populated queue, never resets it, and never re-marks the contract", () => {
    // The container arrived with history (gtm.js already ran): the initializer
    // must append, never clear, and must recognize the marker anywhere.
    const existing: unknown[] = [{ ecommerce: null }, { event: "gtm.js", "gtm.start": 1 }];
    window.dataLayer = existing;
    expect(emitViewItem({ itemId: 7, itemName: "B" }, null)).toBe(true);
    expect(window.dataLayer).toBe(existing);
    expect(existing[0]).toEqual({ ecommerce: null });
    expect(existing[1]).toEqual({ event: "gtm.js", "gtm.start": 1 });
    expect(contractMarkers()).toHaveLength(1);
    // Only ONE marker even after further emits (no duplicate initialization).
    expect(emitGenerateLead("contact")).toBe(true);
    expect(contractMarkers()).toHaveLength(1);
    const markerIndex = existing.findIndex(
      (entry) => (entry as Record<string, unknown>).tracking_contract === TRACKING_V2_CONTRACT,
    );
    expect(markerIndex).toBe(2);
  });

  it("carries explicit sanitized initial page fields on the contract entry", () => {
    const original = document.referrer;
    Object.defineProperty(document, "referrer", {
      value: "https://mail.example.com/read?utm_source=mail&email=a%40b.com",
      configurable: true,
    });
    try {
      window.history.replaceState({}, "", "/cart?gclid=abc&email=x%40y.com");
      expect(emitGenerateLead("contact")).toBe(true);
      expect(queue()[0]).toEqual(expectedContractEntry(
        `${window.location.origin}/cart?gclid=abc`,
        "https://mail.example.com/read?utm_source=mail",
      ));
    } finally {
      Object.defineProperty(document, "referrer", { value: original, configurable: true });
    }
  });
});

describe("commerce emits", () => {
  it("clears prior ecommerce state before the event and never mutates an existing queue", () => {
    const existing: unknown[] = [];
    window.dataLayer = existing;
    const ok = emitAddToCart([{ itemId: 11, itemName: "Tour", itemCategory: "tour", amountBase: 200 }], USD);
    expect(ok).toBe(true);
    expect(window.dataLayer).toBe(existing);
    expect(existing).toHaveLength(3);
    expect(existing[0]).toEqual(expectedContractEntry(`${window.location.origin}/`));
    expect(existing[1]).toEqual({ ecommerce: null });
    expect(existing[2]).toMatchObject({ event: "add_to_cart" });
  });

  it("carries converted money with currency agreement", () => {
    emitAddToCart([{ itemId: 11, itemName: "Tour", amountBase: 100 }], EUR);
    const { ecommerce } = trackedEvents()[0] as { ecommerce: Record<string, unknown> };
    expect(ecommerce.currency).toBe("EUR");
    expect(ecommerce.value).toBe(92.5);
    expect(ecommerce.items).toEqual([{ item_id: "11", item_name: "Tour", quantity: 1, price: 92.5 }]);
  });

  it("omits monetary fields together when currency is unavailable", () => {
    emitViewItem({ itemId: 11, itemName: "Tour", itemCategory: "tour" }, null);
    const { ecommerce } = trackedEvents()[0] as { ecommerce: Record<string, unknown> };
    expect(ecommerce).toEqual({ items: [{ item_id: "11", item_name: "Tour", quantity: 1, item_category: "tour" }] });
  });

  it("emits the explicit payment_type enum only", () => {
    emitAddPaymentInfo([{ itemId: 1, itemName: "A", amountBase: 10 }], USD, "paypal");
    const { event, ecommerce } = trackedEvents()[0] as { event: string; ecommerce: Record<string, unknown> };
    expect(event).toBe("add_payment_info");
    expect(ecommerce.payment_type).toBe("paypal");
    // No purchase / tax / shipping / delivery fields exist on any producer.
    for (const field of ["tax", "shipping", "handling", "delivery", "purchase"]) {
      expect(ecommerce).not.toHaveProperty(field);
    }
    // Anything outside the enum is rejected outright.
    expect(emitAddPaymentInfo([{ itemId: 1, itemName: "A" }], USD, "wallet" as never)).toBe(false);
    expect(trackedEvents()).toHaveLength(1);
  });

  it("names every commerce event type", () => {
    emitRemoveFromCart([{ itemId: 1, itemName: "A", amountBase: 10 }], USD);
    emitBeginCheckout([{ itemId: 1, itemName: "A", amountBase: 10 }], USD);
    emitViewCart([{ itemId: 1, itemName: "A", amountBase: 10 }], USD);
    expect(trackedEvents().map((entry) => entry.event)).toEqual([
      "remove_from_cart",
      "begin_checkout",
      "view_cart",
    ]);
  });

  it("never emits for an empty basket", () => {
    expect(emitAddToCart([], USD)).toBe(false);
    expect(emitAddToCart([{ itemId: 0, itemName: "x" }], USD)).toBe(false);
    expect(trackedEvents()).toHaveLength(0);
  });
});

describe("lead emits", () => {
  it("uses the fixed form_type classification", () => {
    expect(emitGenerateLead("contact")).toBe(true);
    expect(emitGenerateLead("tour_inquiry")).toBe(true);
    expect(emitGenerateLead("custom_trip")).toBe(true);
    expect(trackedEvents().map((entry) => ({ event: entry.event, form_type: entry.form_type }))).toEqual([
      { event: "generate_lead", form_type: "contact" },
      { event: "generate_lead", form_type: "tour_inquiry" },
      { event: "generate_lead", form_type: "custom_trip" },
    ]);
  });

  it("clears commerce state before lead events too", () => {
    emitViewItem({ itemId: 1, itemName: "A", amountBase: 10 }, USD);
    emitGenerateLead("contact");
    expect(queue()).toHaveLength(5);
    expect(queue()[3]).toEqual({ ecommerce: null });
    expect(queue()[4]).toMatchObject({ event: "generate_lead" });
  });
});

describe("flag gating, document policy and opt-out", () => {
  it("stays silent entirely when the flag is off", () => {
    setFlag(false);
    expect(emitAddToCart([{ itemId: 1, itemName: "A", amountBase: 10 }], USD)).toBe(false);
    expect(emitGenerateLead("contact")).toBe(false);
    expect(queue()).toHaveLength(0);
  });

  it("never emits on a document that arrived with sensitive parameters", () => {
    window.history.replaceState({}, "", "/auth/reset-password?token=t123");
    resetDocumentTrackingState();
    expect(emitAddToCart([{ itemId: 1, itemName: "A", amountBase: 10 }], USD)).toBe(false);
    expect(emitGenerateLead("contact")).toBe(false);
    expect(queue()).toHaveLength(0);
    // The decision is per document: scrubbing the URL afterwards does not
    // re-enable signals until a fresh document load.
    window.history.replaceState({}, "", "/auth/confirm-code");
    expect(emitGenerateLead("contact")).toBe(false);
  });

  it("respects the exact no-third-party opt-out even when the flag is on", () => {
    window.history.replaceState({}, "", "/cart?no-third-party=1");
    expect(emitAddToCart([{ itemId: 1, itemName: "A", amountBase: 10 }], USD)).toBe(false);
    expect(queue()).toHaveLength(0);
  });

  it("isolates queue failures", () => {
    const hostile: unknown[] = [];
    Object.defineProperty(hostile, "push", {
      value: () => {
        throw new Error("blocked queue");
      },
    });
    window.dataLayer = hostile;
    expect(() => emitAddToCart([{ itemId: 1, itemName: "A", amountBase: 10 }], USD)).not.toThrow();
    expect(emitAddToCart([{ itemId: 1, itemName: "A", amountBase: 10 }], USD)).toBe(false);
  });
});
