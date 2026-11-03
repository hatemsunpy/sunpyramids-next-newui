# Tracking contract (tracking v2)

This document describes the app's tracking v2 contract, its GTM dependencies,
and the work required before activation.

The analytics layer is a **measurement layer only**. All business data (tours,
prices, availability, carts, bookings, currencies, SEO) stays API-driven from the
Laravel backend per the repository's source-of-truth guard; tracking never
replaces, copies or snapshots that data — it observes the app's own rendered
state and confirmed API responses.

## 1. Contract identity and the shared initializer

- Contract id: `TRACKING_V2_CONTRACT = "sunpyramids_v2"` (`lib/analytics/datalayer.ts`).
- The data layer (`window.dataLayer`) is consumed, never owned: producers push
  only onto the EXISTING queue and create one only when none exists. A queue
  that already carries history (pre-populated by a container or prior script)
  is appended to, never reset.
- A shared initializer (`ensureTrackingContract`) writes the contract exactly
  once per queue, and it writes it **together with explicit sanitized initial
  page fields**:

  ```json
  {
    "tracking_contract": "sunpyramids_v2",
    "page_location": "<origin><path>?<attribution-only query>",
    "page_referrer": "",
    "page_title": "Sun Pyramids Tours"
  }
  ```

  - `page_location` passes the attribution-only sanitizer
    (`lib/analytics/url-privacy.ts` `sanitizePageLocation`): scheme + host +
    path + attribution parameters only (`utm_*`, `gclid`, `gclsrc`, `dclid`,
    `fbclid`, `msclkid`, `ttclid`, `gbraid`, `wbraid`, `gad_source`). Unknown
    keys, oversized keys/values, fragments, credentials and non-http(s)
    protocols never reach the layer; malformed input degrades to `""`.
  - `page_referrer` is always explicit. An explicit empty value clears Google
    Analytics' inherited history-referrer state instead of leaving it
    undefined; a present document referrer is sanitized with the same rules.
  - `page_title` is the static brand value `TRACKING_PAGE_TITLE`
    ("Sun Pyramids Tours") — never a personal name.
- The contract is established **before any producer event and before
  `gtm.start`**, whether the first push is a page view, an early commerce
  event, or the container start. The marker is recognized anywhere in the
  queue (not only at index 0) and is never repeated.
- Before every emitted event the page context is re-established against the
  current route (a child commerce effect can run before the route signal after
  an SPA navigation): on a location change the initializer first pushes a
  **no-event context record** carrying the current sanitized `page_location`,
  the previous DISTINCT sanitized location as `page_referrer` (A→B→A stays
  previous-distinct; `""` stays explicit) and the static `page_title`, with no
  `event` key — data-layer variables update without emitting anything extra.
  The contract marker itself is never repeated.
- Returns `false` only when the queue cannot be established; callers must not
  continue as if initialized.

## 2. Gating (fail-closed)

`trackingSessionEnabled()` (`lib/analytics/datalayer.ts`) gates every producer:

1. `NEXT_PUBLIC_TRACKING_V2` must be exactly `"true"` — the flag **defaults
   off**; leaving it unset preserves legacy measurement.
   This is a Next.js public build-time variable: changing it requires a new
   build and deployment. Changing only the environment of `next start` does
   not change a previously compiled client bundle.
2. The published opt-out `?no-third-party=1` (exact value, read live from the
   URL) always wins — it cannot be bypassed by the flag.
3. The arriving-document decision (below) must not be "sensitive".

**Arriving-document sensitivity** (`lib/analytics/url-privacy.ts
`isDocumentSensitive`) is captured at module load — before any component
effect can consume or scrub parameters — and holds for the document's entire
lifetime:

- the document URL or the external `document.referrer` carrying any sensitive
  parameter NAME (`email`, `otp`, `token`, `name`, presence-only; values are
  never read or echoed) marks the document sensitive;
- a sensitive document initializes NO third-party tracking and emits NO app
  signals, regardless of the flag (the legacy behavior is blocked too);
- scrubbing the parameters afterwards (`stripQueryParamsOnSelf`) never
  re-enables tracking within the same document; only a fresh page load
  re-captures the decision.
- `stripQueryParamsOnSelf` removes the consumed identifiers from the address
  bar. This does not erase the original request; the arriving-document policy
  keeps that document untracked after the scrub too.

## 3. Page views (the app owns every page view)

`lib/analytics/pageview.ts` `emitRoutePageView` + `components/RouteAnalytics`:

- The v2 Google tag runs with `send_page_view=false`; the app sends the initial
  load AND every SPA navigation itself. Initial view + each adjacent navigation
  emit once; adjacent same-location signals ( StrictMode rerender, currency
  update) are recorded without emitting; A→B→A yields three events.
- `page_location` is the sanitized live address (attribution-only query).
- `page_referrer` is the previous sanitized IN-APP location after navigation
  and the sanitized document.referrer only on the initial load — explicit,
  `""` when absent, never fabricated.
- `page_title` is the static brand value.
- The initial page view is emitted once per document across siblings: the
  page-view module state (last location) is shared, so `RouteAnalytics` and
  `ThirdPartyScripts` (both present in `app/layout.tsx`) cannot double-fire;
  whoever runs first emits, the other stays silent at the same location.

## 4. Commerce events and the bounded item mapping

Producers (`lib/analytics/datalayer.ts`): `view_item`, `add_to_cart`,
`view_cart`, `remove_from_cart`, `begin_checkout`, `add_payment_info`.

- Every event is preceded in the queue by an explicit commerce-state clear
  (`{ "ecommerce": null }`) — prior GA4 ecommerce state can never leak into a
  later event.
- Items are built from a bounded allowlist only (`buildEcommerceItem`):
  `item_id` (non-empty, non-zero), `item_name` (non-empty after trim),
  `quantity` (defaults to 1 — a cart ROW is one booking group; travelers are
  priced inside the total, never multiplied into quantity), optional
  `item_category`, and optional `price`.
- `view_item` carries NO monetary fields: the page price depends on the
  visitor's own selection; cart events own the agreed money.
  (`components/tour/TourViewSignal.tsx` compares by tour ID: same-id
  selection/currency rerenders stay silent, a different tour — A→B→A
  included — signals again, once per tour id per mounted tour page.)
- Money is the UI's own conversion (`convertAnalyticsAmount` with the selected
  API currency the UI formats with): `currency` must have a three-letter code
  format and `value` equals Σ item.price × item.quantity. The API remains the
  source of available currencies; the regex does not validate ISO membership.
  Each converted row uses the UI's existing `toFixed(2)` rounding, including
  half-cent amounts; basket value sums those rounded rows before coupons.
  This measures the cart items, not a verified paid settlement total.
- Money is **all-or-none** (`buildEcommerceBasket`): if ANY item lacks a valid
  converted price, or the currency code is not three letters, or ANY input row
  is unnameable, or the summed value overflows — the event ships moneyless
  items and omits `currency` and `value` together. A partial basket value never
  understates a displayed whole-cart total.
- Cart-level producers additionally accept `null`: the cart-page mapper
  (`cartAnalyticsInputs` in `components/CustomerFlows.tsx`) returns `null` when
  ANY row cannot be mapped, and a `null` mapping emits **no event at all**
  rather than a partial one.
- No purchase, tax, shipping, delivery or handling fields exist anywhere in
  the contract; there is no `purchase` event.

### Where each commerce event fires

- `view_item` — `TourViewSignal` (tour page, once per tour id).
- `add_to_cart` — tour booking card after an ACCEPTED cart append
  (`TourBookingCard.tsx`: HTTP-200 with body `status:false` is UI success but
  never emits; 4xx/5xx/network failures never emit; money agrees with the UI
  total including priced add-ons chosen by picked visitors).
  The rental planner also emits after accepted `cart/rentals/append`, without
  monetary fields because the request has no agreed rental quote yet.
- `view_cart` / `begin_checkout` — once per cart-page identity
  (`checkout` flag + locale) in `CustomerFlows.tsx`, only from the ACCEPTED
  `cart/list` load of that identity (HTTP 200 with `status:false` is never
  accepted); a checkout/locale change expires both the emitted marker and the
  accepted snapshot, so stale in-flight responses from a previous identity
  never overwrite the cart, re-accept it, or emit under the new one.
- `remove_from_cart` — after a CONFIRMED delete/clear, before the cart
  refresh so a failing refresh cannot lose the signal; the snapshot is the
  pre-mutation row set; body `status:false` and failed requests never emit.
- `add_payment_info` — only after an ACCEPTED bookings submission with a
  positive safe-integer booking id (`CustomerFlows.tsx`), with
  `payment_type: "card" | "paypal"`.
  Payment-method radio clicks (including the default pre-checked card) never
  emit; rejected submissions (`status:false`), HTTP failures and validation
  failures never emit.

## 5. Lead events and sensitive-value handoffs

- `emitGenerateLead(formType)` with the fixed classification
  `"contact" | "tour_inquiry" | "custom_trip"`: general contact → `contact`,
  tour inquiry block → `tour_inquiry`, planner (make-your-trip) →
  `custom_trip` (`components/ContactForm.tsx`,
  `components/CustomerFlows.tsx` `PlannerRequestFlow`).
- Lead events are non-commerce: they carry no `ecommerce` block at all.
- Names/emails/OTP never travel through URLs the app writes; the destination
  `/thankful` push is clean (attribution parameters unaffected).
- The greeting name (`ThankfulGreeting`) is read from the tab-scoped session
  handoff (`SENSITIVE_HANDOFF_KEYS.thankfulName` in
  `lib/analytics/sensitive-session.ts`), never from a URL the app writes.
  Legacy inbound `?name=` links keep working: the fresh value OVERRIDES any
  stale stored name, an EMPTY `?name=` clears the stale handoff instead of
  reviving it, and the identifier is stripped from the address bar either way.
- Password-reset context (`auth-reset` handoff): legacy `?email=`/`?otp=`
  links are consumed and stripped; ANY legacy parameter — including an empty
  one — makes the link a FRESH attempt that replaces stale stored context
  (a new attempt never combines one person's email with another's token), and
  a brand-new reset attempt begins at forget-password SUBMISSION: submitting
  clears the previous attempt's context even when that request fails.
  Completing the reset (create-password / reset-password) clears the handoff;
  the legacy `?token=` reset-password contract keeps working and is preserved
  (not stripped) — such an arriving document simply stays untracked.

## 6. Sender topology

- `components/ThirdPartyScripts.tsx` loads the container `GTM_SRC`
  (`GTM-KDF33T7`) with the direct GA fallback (`DIRECT_GA_SRC`,
  `GA_MEASUREMENT_ID = "G-NKZ6W32C4J"`, `GA_FALLBACK_TIMEOUT_MS = 2500`).
- In v2 exactly one sender exists: the GTM container only — the direct GA
  fallback stream is refused (no fallback script, no replay, no
  `gtag("config")` commands), and `gtm.start` is pushed only after the
  contract and the app-owned initial page view.
- In legacy mode (flag off) the historical behavior is preserved:
  `gtag("js")`, `gtag("config", <measurement id>)`, then `gtm.start` — with no
  contract marker and no app page-view ownership.

## 7. Verified deployment / backend notes (explicit boundaries)

These are the reviewed, honest boundary conditions of the current system —
recorded here so no later work invents capabilities the stack does not have:

- [GTM workspace 231](https://tagmanager.google.com/#/container/accounts/4701470093/containers/11356716/workspaces/231)
  contains the imported draft and **is not published**. Keep the app flag unset
  or false until coordinated activation. Import/export verification confirms
  the saved configuration, not tag execution or GA4 receipt. Preview/DebugView
  on the v2 build remain required; block collectors for local fixture tests.
- On 2026-11-02 the authenticated GA4 Admin UI showed stream **8101715951**,
  property **438934835**, measurement ID **G-NKZ6W32C4J**, with **Page changes
  based on browser history events enabled**. No setting was saved. The live
  legacy app uses this same ID: coordinate disabling history pageviews with
  the manual v2 rollout, or use an isolated test stream. Google documents that
  [history pageviews can fire even with send_page_view=false](https://developers.google.com/analytics/devguides/collection/ga4/views#disable_page_changes_based_on_browser_history_events).
- Google Ads primary conversion actions and GA4 import relationships have not
  been verified. Review their mapping before replacing legacy sends; do not
  assume that import deduplication or Ads conversion coverage is complete.
- **Fawaterk** (payment gateway): `updateInvoice` returns `data: null` with
  `status: true`, and the "paid" status is written separately. There is no
  verified paid-state snapshot to key a purchase/settlement signal on — which
  is why the contract deliberately has NO purchase event.
- The PayPal flow's capture is a `providerverification`, not a full booking
  settlement.
- The bookings POST fires before settlement and carries PII; it is the
  acceptance boundary for `add_payment_info` and nothing more.
- The backend behavior above was read from local Laravel source. Whether that
  version matches the deployed backend has not been verified. No backend was
  run or changed by this work.

## 8. Test map

The following tests cover app behavior (`npm test -- <files>`, Vitest + jsdom).
They do not prove live GTM execution or GA4 delivery:

| File | Covers |
| --- | --- |
| `lib/analytics/datalayer.test.ts` | flag default/opt-out, money all-or-none (incl. basket overflow and incomplete mapping), contract shape + once-per-queue + pre-populated queues + sanitized initial page fields, payment_type enum, no fee fields, lead classification, queue-failure isolation |
| `lib/analytics/pageview.test.ts` | initial + SPA page views, A→B→A, adjacent dedupe, referrer semantics (explicit empty; previous distinct location; sanitized document.referrer only on initial load), sensitive document/referrer blocking, exact opt-out |
| `lib/analytics/url-privacy.test.ts` | sanitizer allowlist/negative cases, exact opt-out read, presence-only sensitive detection, arriving-document decision persistence through scrubbing, sensitive-referrer treatment |
| `lib/analytics/sensitive-session.test.ts` | tab-scoped handoff envelopes (storage-blocked fallback, sanitization boundaries) |
| `components/analytics-pageview.test.tsx` | RouteAnalytics under StrictMode, sensitive arriving documents (both flags), zero scripts under opt-out, ThirdPartyScripts v2 switch (contract before gtm start, single sender, legacy preservation), RouteAnalytics + ThirdPartyScripts sibling exactly-once composition |
| `components/analytics-commerce-events.test.tsx` | cart entry/mutation/checkout/payment signals against the real cart-page logic (accepted-status gating, identity changes, stale responses, unmappable rows, money before currency), tour booking card add_to_cart success/failure gating, TourViewSignal id semantics, lead classification + no-ecommerce guarantee |
| `components/flow-sensitive-urls.test.tsx` | auth reset handoff lifecycle (fresh links, empty legacy params, failed new attempts, storage-blocked recovery, legacy ?token contract), ThankfulGreeting lifecycle, ThankfulGreeting + ThirdPartyScripts sensitive-document composition (both flags), planner lead signal |
| `components/third-party-scripts.test.tsx` | script loading surface (loader identity, single container, no duplicate streaming) |
