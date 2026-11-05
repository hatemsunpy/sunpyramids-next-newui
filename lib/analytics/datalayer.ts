// Allowlisted analytics data layer (tracking v2, contract "sunpyramids_v2").
//
// - Gate: emits only when NEXT_PUBLIC_TRACKING_V2=true (default keeps legacy
//   behavior); never on a document that arrived with sensitive parameters
//   (fail-closed, decided before effects scrub the URL), and ?no-third-party=1
//   always wins over the flag.
// - Queue: pushes only append to the EXISTING dataLayer; a queue is created
//   only when none exists. The shared initializer writes the contract together
//   with explicit sanitized initial page fields once per queue, before any
//   producer and before gtm.start - an explicit empty page_referrer clears
//   inherited GA history state. Before every emitted event the page context is
//   re-established against the CURRENT route (a child commerce event can beat
//   the route signal after SPA navigation), emitting no extra events - on a
//   location change it pushes a context record with the previous distinct
//   sanitized location as referrer.
// - Commerce: prior ecommerce state is cleared ({ecommerce:null}) before every
//   event; only explicitly mapped, bounded fields reach the layer - raw API
//   payloads, form payloads and user records are never spread.
// - Money is all-or-none: currency code, exchange rate and every item price
//   must be valid before any monetary field is emitted together; a partial
//   basket value never understates a whole-cart total and overflow drops the
//   money entirely.
// - Isolation: a broken queue must never break the page.

import {
  isUnessentialOptOut,
  isDocumentSensitive,
  resetDocumentSensitiveDecision,
  sanitizePageLocation,
} from "./url-privacy";

export const TRACKING_V2_CONTRACT = "sunpyramids_v2";
// Static brand value for page_title; never a personal name.
export const TRACKING_PAGE_TITLE = "Sun Pyramids Tours";

export function isTrackingV2(): boolean {
  return process.env.NEXT_PUBLIC_TRACKING_V2 === "true";
}

type DataLayerWindow = Window & { dataLayer?: unknown[] };

let documentTrackingBlockedCache: boolean | null = null;

export function documentTrackingBlocked(): boolean {
  if (documentTrackingBlockedCache === null) {
    documentTrackingBlockedCache = isDocumentSensitive();
  }
  return documentTrackingBlockedCache;
}

// Sanitized page location of the last established context record; null until
// this document's queue has been initialized.
let establishedPageLocation: string | null = null;
let establishedQueue: unknown[] | null = null;

// Simulates a fresh document load in tests: re-captures the URL decision and
// clears derived caches.
export function resetDocumentTrackingState(): void {
  resetDocumentSensitiveDecision();
  documentTrackingBlockedCache = null;
  establishedPageLocation = null;
  establishedQueue = null;
}

export function trackingSessionEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (!isTrackingV2()) return false;
  // The published third-party opt-out (?no-third-party=1) also disables the
  // app-side event producers; it must not be bypassed by the flag.
  if (isUnessentialOptOut()) return false;
  return !documentTrackingBlocked();
}

function existingDataLayer(): unknown[] | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as DataLayerWindow).dataLayer;
  return Array.isArray(candidate) ? candidate : null;
}

// Reads (or lazily creates) the queue without resetting it.
function dataLayerQueue(): unknown[] | null {
  if (typeof window === "undefined") return null;
  const existing = existingDataLayer();
  if (existing) return existing;
  const created: unknown[] = [];
  try {
    (window as DataLayerWindow).dataLayer = created;
    return created;
  } catch {
    return null;
  }
}

// Shared initializer, once per queue: the v2 contract together with explicit
// sanitized initial page fields before any producer and before gtm.start; a
// An existing marker anywhere in the queue is reused.
function queueHasContract(queue: unknown[]): boolean {
  return queue.some(
    (entry) => entry !== null && typeof entry === "object" && (entry as Record<string, unknown>).tracking_contract === TRACKING_V2_CONTRACT,
  );
}

// Sanitized page defaults: location via the attribution-only sanitizer,
// referrer always explicit ("" clears inherited GA history state), and a
// static brand title - never a personal name.
function initialPageDefaults(): Record<string, unknown> {
  const location = typeof window === "undefined"
    ? ""
    : sanitizePageLocation(`${window.location.origin}${window.location.pathname}${window.location.search}`);
  const referrer = typeof window !== "undefined" && document.referrer ? sanitizePageLocation(document.referrer) : "";
  return {
    tracking_contract: TRACKING_V2_CONTRACT,
    page_location: location,
    page_referrer: referrer,
    page_title: TRACKING_PAGE_TITLE,
  };
}

// Establishes the v2 contract (exactly once per queue, with the sanitized
// initial page fields) and keeps the queue's page context aligned with the
// CURRENT route before every emitted event. Child commerce can emit before a
// SPA navigation's route-signal effect runs (child effects fire first in
// React), so on a location change a no-event context record is pushed first:
// it carries the current sanitized location, the previous distinct sanitized
// location as referrer (A->B->A stays previous-distinct; "" stays explicit),
// and no event key, so DLVs update without emitting anything extra. The
// contract marker itself is never repeated. Returns false only when the queue
// cannot be established; callers must not continue as if initialized.
export function ensureTrackingContract(): boolean {
  const queue = dataLayerQueue();
  if (!queue) return false;
  try {
    if (queue !== establishedQueue) {
      establishedQueue = queue;
      establishedPageLocation = null;
    }
    const location = typeof window === "undefined"
      ? ""
      : sanitizePageLocation(`${window.location.origin}${window.location.pathname}${window.location.search}`);
    if (!queueHasContract(queue)) {
      queue.push(initialPageDefaults());
      establishedPageLocation = location;
      return true;
    }
    if (establishedPageLocation === null) {
      // A marker alone does not establish safe page defaults. Preserve it,
      // but replace any inherited page context before a consumer can fire.
      const defaults = initialPageDefaults();
      queue.push({
        page_location: defaults.page_location,
        page_referrer: defaults.page_referrer,
        page_title: defaults.page_title,
      });
      establishedPageLocation = location;
      return true;
    }
    if (location === establishedPageLocation) return true;
    queue.push({
      page_location: location,
      page_referrer: establishedPageLocation,
      page_title: TRACKING_PAGE_TITLE,
    });
    establishedPageLocation = location;
    return true;
  } catch {
    return false;
  }
}

function clearEcommerceState(queue: unknown[]): void {
  queue.push({ ecommerce: null });
}

export function pushTrackingEvent(payload: Record<string, unknown>): boolean {
  const queue = dataLayerQueue();
  if (!queue) return false;
  try {
    if (!ensureTrackingContract()) return false;
    clearEcommerceState(queue);
    queue.push(payload);
    return true;
  } catch {
    return false;
  }
}

// Money: the UI's own conversion. amountBase is the same base amount the UI
// formats through the selected API currency; uncertainties are omitted
// consistently for the whole event, never for some items only.
export type AnalyticsCurrency = { name?: string; exchange_rate?: number } | null | undefined;

function roundMoney(value: number): number {
  // Match CurrencyProvider's displayed amount, including half-cent rounding.
  return Number(value.toFixed(2));
}

export function convertAnalyticsAmount(amountBase: number | null | undefined, currency: AnalyticsCurrency): number | null {
  if (amountBase == null || !Number.isFinite(amountBase) || amountBase < 0) return null;
  const rate = currency?.exchange_rate;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return null;
  const converted = roundMoney(amountBase * rate);
  return Number.isFinite(converted) ? converted : null;
}

// Three-letter ISO currency code only; anything else downgrades the event to
// moneyless items instead of guessing a currency label.
export function analyticsCurrencyCode(currency: AnalyticsCurrency): string | null {
  const name = currency?.name;
  return typeof name === "string" && /^[A-Za-z]{3}$/.test(name) ? name.toUpperCase() : null;
}

export type AnalyticsItemInput = {
  itemId: string | number;
  itemName: string;
  quantity?: number;
  itemCategory?: string;
  amountBase?: number | null;
};

export type EcommerceItem = {
  item_id: string;
  item_name: string;
  quantity: number;
  item_category?: string;
  price?: number;
};

export function buildEcommerceItem(input: AnalyticsItemInput, currency: AnalyticsCurrency): EcommerceItem | null {
  if (!input || input.itemId == null || input.itemId === "" || input.itemId === 0) return null;
  const itemName = typeof input.itemName === "string" ? input.itemName.trim() : "";
  if (!itemName) return null;
  // A booking group is one cart row: travellers are priced inside the total,
  // NOT multiplied into quantity.
  const quantity = typeof input.quantity === "number" && Number.isFinite(input.quantity) && input.quantity > 0
    ? input.quantity
    : 1;
  const item: EcommerceItem = { item_id: String(input.itemId), item_name: itemName, quantity };
  if (input.itemCategory) item.item_category = String(input.itemCategory);
  const price = convertAnalyticsAmount(input.amountBase, currency);
  if (price !== null) item.price = price;
  return item;
}

export type EcommerceBasket = {
  items: EcommerceItem[];
  currency: string | null;
  value: number | null;
};

export function buildEcommerceBasket(inputs: AnalyticsItemInput[] | null, currency: AnalyticsCurrency): EcommerceBasket | null {
  if (!Array.isArray(inputs)) return null;
  const mapped = inputs.map((input) => buildEcommerceItem(input, currency));
  const items = mapped.filter((item): item is EcommerceItem => item !== null);
  if (items.length === 0) return null;
  const currencyCode = analyticsCurrencyCode(currency);
  const moneyless = items.map((item) => {
    const rest = { ...item };
    delete rest.price;
    return rest;
  });
  // All-or-none money: currency and value emit only when every contributing
  // item has a valid converted price under a valid three-letter code. An
  // INCOMPLETE mapping (any input row unnameable) also drops all monetary
  // fields together - a partial sum would understate the displayed whole-cart
  // total. Overflow anywhere in the sum downgrades to moneyless too.
  if (items.length !== inputs.length || !currencyCode || !items.every((item) => typeof item.price === "number")) {
    return { items: moneyless, currency: null, value: null };
  }
  const value = roundMoney(items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0));
  if (!Number.isFinite(value)) {
    return { items: moneyless, currency: null, value: null };
  }
  return { items, currency: currencyCode, value };
}

export type CommerceEventName =
  | "view_item"
  | "add_to_cart"
  | "view_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "add_payment_info";

export type PaymentSignalType = "card" | "paypal";

function emitCommerce(eventName: CommerceEventName, basket: EcommerceBasket | null): boolean {
  if (!trackingSessionEnabled()) return false;
  if (!basket || basket.items.length === 0) return false;
  const ecommerce: Record<string, unknown> = { items: basket.items };
  if (basket.currency && basket.value !== null) {
    ecommerce.currency = basket.currency;
    ecommerce.value = basket.value;
  }
  return pushTrackingEvent({ event: eventName, ecommerce });
}

export function emitViewItem(input: AnalyticsItemInput, currency: AnalyticsCurrency): boolean {
  return emitCommerce("view_item", buildEcommerceBasket([input], currency));
}

// Cart-level emitters accept null: callers pass the whole-cart mapping, which
// is null when the cart cannot be fully mapped - an unmappable cart emits no
// event at all rather than a partial one.
export function emitAddToCart(inputs: AnalyticsItemInput[] | null, currency: AnalyticsCurrency): boolean {
  return emitCommerce("add_to_cart", buildEcommerceBasket(inputs, currency));
}

export function emitViewCart(inputs: AnalyticsItemInput[] | null, currency: AnalyticsCurrency): boolean {
  return emitCommerce("view_cart", buildEcommerceBasket(inputs, currency));
}

export function emitBeginCheckout(inputs: AnalyticsItemInput[] | null, currency: AnalyticsCurrency): boolean {
  return emitCommerce("begin_checkout", buildEcommerceBasket(inputs, currency));
}

export function emitRemoveFromCart(inputs: AnalyticsItemInput[] | null, currency: AnalyticsCurrency): boolean {
  return emitCommerce("remove_from_cart", buildEcommerceBasket(inputs, currency));
}

export function emitAddPaymentInfo(
  inputs: AnalyticsItemInput[] | null,
  currency: AnalyticsCurrency,
  paymentType: PaymentSignalType,
): boolean {
  if (paymentType !== "card" && paymentType !== "paypal") return false;
  if (!trackingSessionEnabled()) return false;
  const basket = buildEcommerceBasket(inputs, currency);
  if (!basket || basket.items.length === 0) return false;
  const ecommerce: Record<string, unknown> = { items: basket.items };
  if (basket.currency && basket.value !== null) {
    ecommerce.currency = basket.currency;
    ecommerce.value = basket.value;
  }
  ecommerce.payment_type = paymentType;
  return pushTrackingEvent({ event: "add_payment_info", ecommerce });
}

// Lead events: non-commerce, fixed form_type classification.
export type LeadFormType = "contact" | "tour_inquiry" | "custom_trip";

export function emitGenerateLead(formType: LeadFormType): boolean {
  if (!trackingSessionEnabled()) return false;
  return pushTrackingEvent({ event: "generate_lead", form_type: formType });
}
