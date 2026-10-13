# Sun Pyramids Tours — Agent Guide (agent.md)

> Crawled from live codebase on 2026-10-13. Complements mandatory `AGENTS.md`
> (Dynamic Backend Source-of-Truth Guard). Read `AGENTS.md` first before any
> data/caching/SEO/performance work, and load the `dynamic-backend-source-guard`
> skill for those tasks.

---

## 1. Project Overview

- **Product:** Sun Pyramids Tours — direct booking site for an Egyptian travel operator
- **Stack (verified `package.json`):** Next.js 16.3.3 (App Router), React 19.2,
  TypeScript 5.9, Sass 1.101, Vitest 5 + Testing Library + jsdom
- **Runtime:** `npm run dev` (Next dev; repo convention port 3003)
- **Backend (source of truth):** Laravel API at `https://sunpyramidtours.com/api/`
  configured in `lib/config.ts` as `API_BASE` via `NEXT_PUBLIC_API_URL`
- **Legacy reference only:** `nuxt_sunpyramids/` (Nuxt). Never validate against
  production Nuxt host; Next preview is not production.

### Key Directories (verified)

```
app/                    # App Router: English root + app/[locale]/… (see §4)
components/             # ~90 .tsx: Header, SiteShell, tour/, voice/, home, cart, blog
components/voice/       # VoiceSearchButton.tsx, VoiceFindTripPanel.tsx (+ tests)
components/tour/        # Modular tour sections composed by TourPage.tsx
lib/                    # api.ts, data.ts, trips-query.ts, seo.ts, locales.ts, …
lib/voice/              # speech recognizers, parser, mapper, lexicons/ (7 locales)
lib/sitemap/            # sitemap builders (API-backed, unstable_cache)
styles/                 # Global SCSS design tokens
types/api.ts            # API TypeScript contracts (protected)
tests/                  # 3 top-level test files; 19 component + 18 lib test files
proxy.ts                # locale header injection (see §4)
```

---

## 2. Architecture Guardrails (from AGENTS.md — binding)

**Laravel Backend / Dashboard is authoritative** for confirmed backend-controlled
data. Next.js consumes via existing API contracts. Never convert dynamic data
into frontend-owned static data.

Forbidden: API data → hardcoded array/JSON; `force-static` without revalidation
for mutable data; static export blocking dashboard propagation; silent fallback
data replacing API data; build-time snapshots that never refresh; copied SEO
metadata/IDs as source of truth.

Required flow: `Laravel Dashboard → Laravel API → Next.js data layer →
optional cache/ISR → render`. Caching never transfers ownership.

Pre-completion check for any data/caching/SEO/render/perf change: (1) was data
dynamic before? (2) authoritative source? (3) still fetched from Laravel API?
(4) any production data copied into source/JSON? (5) dashboard change reaches
Next without deploy? (6) cache/revalidation behavior? (7) can API failure make
fallback permanent? If authority is lost → stop, redesign, report
`ARCHITECTURE_VIOLATION` if optimization requires it.

---

## 3. Data Fetching (verified `lib/api.ts`, `lib/trips-query.ts`)

### Primitives (`lib/api.ts`)

- `apiFetch<T>` — `force-cache` + `next: { revalidate: 300 }`, 12 s abort
  timeout, headers `Accept/X-Localize/Authorization Bearer`, returns `T | null`.
- `apiFetchReliable<T>` — retry w/ backoff, returns `ApiResult<T>`
  (`ok | not_found | invalid_response | error`). Use with
  `resolveRequiredApiResult` / `notFound()` in `lib/resolve-api-result.ts`
  (404 only on confirmed `not_found`; transient errors throw, never fake 404).
- `buildUrl` joins endpoint onto `API_BASE`. `X-Localize: <locale>`.

### Trips query (`lib/trips-query.ts` — Phase 2 state: DONE, locked)

`tripsRequest(searchParams, taxonomy)` builds `tours?…` with
`exists=wishlisted`, `order_by=display_order,asc`, plus:

- `main` slug → root + all descendants via `parent_id` traversal of
  `allCategories` (matches Laravel facet scope).
- **D1 Hybrid (locked):** unqualified `days=1` (no main/category) resolves to
  `day-tour` root children; `duration_in_days` sent only when `days > 1` or
  (`days === 1` with explicit main/category).
- `destination → destinations.slug[]`, `title → title=*…*` (trimmed),
  returns `{ endpoint, page, main, category, destination, title, days }`
  with `days: days > 0 ? days : undefined` (normalized `days` in active-filter
  state; pagination/sidebar preserve `days`; Duration pill removes only `days`;
  Clear All removes `days`; `distination` typo fixed to `destination`).
- Do not touch `Header/voice` files during trips-filter work and vice versa.

### Page pattern

```tsx
export async function generateMetadata({ params }) {
  const locale = await resolvePrefixedLocale(params); // never use raw params
  const entity = resolveRequiredApiResult(await getEntityReliable(slug, locale), `…`);
  return metadataFromPage(entity, path, locale);
}
```

Revalidation: fetch-level `revalidate: 300` default (tours 180). Never add
client fetching to bypass server cache; never `force-static` mutable data.

---

## 4. Routing & Locales (verified `lib/locales.ts`, `proxy.ts`)

- **Locales:** `en` (default, NO prefix), `fr de it pt es zh` (prefixed).
  `locales`, `prefixedLocales`, `localePrefix/withLocale/stripLocale`,
  `localeFromPathname` (`/en…` → `en` root semantics; unknown → `en`).
- **`/en` rejection:** `resolvePrefixedLocale` in `lib/route-helpers.ts` calls
  `notFound()` for `/en` paths — never "normalize" this away.
- **Proxy:** `proxy.ts` sets `x-sunpyramids-route-locale` request header from
  pathname; root layout reads it for `<html lang>`. Matcher excludes
  `_next/static|_next/image|favicon.ico`.
- **Routes (dual):** every public page exists as `app/<route>/page.tsx`
  (English) + `app/[locale]/<route>/page.tsx`. Includes: `/`, `tour/[slug]`,
  `trips`, `egypt-tours/[...]`, `blog/[slug]`, `blogs/all-blogs`,
  `egypt-travel-guide`, `event/[slug]`, `events`, `faqs`, `cart`, `cart/checkout`,
  `auth/*`, `profile/*`, `order/payment/callback/*` (paypal/fawaterk),
  `make-your-trip`, `rent-car`, `contact-us`, `about-us`, legal pages.
- **Params are promises:** `Promise<{ locale; slug }>` — always `await` +
  `decodePathSegment` before use.

---

## 5. Components (verified)

### `SiteShell.tsx` — root wrapper: `CurrencyProvider`, `Header`, `Footer`,
`WhatsAppButton`, `BottomBar`; fetches `settings` + `taxonomy` if absent.

### `Header.tsx` (~583 lines, client) — Phase 4 state: Basic Voice integrated

- Desktop (>1260 px): two persistent tiers (brand/utilities + nav/conversion).
- Mobile (≤1260 px): right sheet ≤440 px, focus trap + `inert` background,
  Escape/backdrop dismiss.
- Search forms (desktop + mobile) each own `input[name="title"]`; voice uses
  **explicit per-form refs** (`formRef`/`inputRef` → `VoiceSearchButton`) —
  never `document.querySelector`. Forms stay independent.
- Theme via `html[data-theme]`, persisted `sunpyramids-theme`.
- Voice: `VoiceSearchButton type="button"` beside each search control, existing
  icon conventions only (no new icon lib). Mic shell renders visibly from
  start; recognizer may lazy-load (dynamic import / code-split) with measured
  bundle impact documented.
- Voice behavior contract: final transcript replaces title value (trim only),
  then existing `form.requestSubmit()` — no manual URL/router/API/second
  search fn. Interim never submits. Exactly-once per session via
  session/result guard (not bare `finalTranscript` check). Manual submit
  during session cancels/invalidates recognition. Mic toggles start/stop,
  Escape aborts w/o submit, one recognizer at a time, drawer close aborts
  safely (no late submit). Unsupported runtime: mic hidden/non-interactive,
  typed search intact. Errors → localized copy near control, input preserved,
  retry allowed, no vendor codes/console spam. Brand tokens Anchor Blue
  `#163a96` / Amber `#f7951d` via semantic vars; a11y: `aria-label`
  idle/listening, `aria-pressed`, live region (final announced once, no
  interim spam), keyboard + ~44 px target, reduced-motion respected.

### `components/tour/` — `TourHero/Overview/Itinerary/Inclusions/Pricing/
BookingCard/Gallery/Breadcrumb…` composed in `TourPage.tsx → TourPageLayout`;
inquiry tours (`is_inquiry`) render `ContactForm` not booking panel. Tour pages
fetch `getTourReliable` + `getRelatedTours` (≤12) and render API-driven
`JsonLd`.

---

## 6. Voice Stack (verified `lib/voice/*`, `lib/voice-copy.ts`)

```
lib/voice/browser-speech-recognizer.ts  # Web Speech wrapper
lib/voice/command-speech-recognizer.ts  # structured commands
lib/voice/use-speech-recognition.ts     # session hook (exactly-once owner)
lib/voice/parse-voice-query.ts          # deterministic parser (Phase-gated)
lib/voice/capability-mapper.ts          # recognized-but-not-applicable guard
lib/voice/normalize.ts + entity-match.ts + speech-languages.ts + types.ts
lib/voice/lexicons/{en,fr,de,it,pt,es,zh}.ts
lib/voice-copy.ts                       # basic UI strings only (7 locales)
lib/header-voice-resolution.ts + lib/voice-release-policy.ts
```

Rules: no audio storage/upload/transcript persistence/logging; no
cookies/localStorage/sessionStorage for voice; typed Find Trip stays
destination+duration only (no permanent Category selector); no invented
filters — reuse `/trips` root-category logic; high-confidence category only
when root supported by `?main=`, else ambiguous.

---

## 7. SEO & Metadata (verified `lib/seo.ts`, sitemap, robots)

- `metadataFromPage(page, path, locale)` builds `Metadata` from backend
  `SeoFields` (`meta_title/description`, canonical → `FRONTEND_ORIGIN`,
  OG/Twitter/robots); falls back to title/description/brand; emits `x-default`
  + 7-locale `alternates`. Never hardcode SEO values.
- `JsonLd` renders only API `structure_schema`. Never generate schema locally.
- Sitemaps (`app/sitemap*.xml`): dynamic, `revalidate: 86400`, built by
  `lib/sitemap/*` via `unstable_cache getSitemapCatalog`.
- `robots.ts` disallows `/api/ /admin/ /dashboard/ /cart/checkout`.
- `next.config.ts`: `skipTrailingSlashRedirect`, `images.unoptimized: true`
  (Vercel 402 workaround) + remotePatterns (sunpyramidtours.com,
  sunpyramidstours.com, R2), sitemap rewrite, legacy 301 redirects.

---

## 8. Design System (from DESIGN.md — binding for UI work)

Anchor Blue `#163a96` (headings/selected/accents, never full-section bg) +
Amber `#f7951d` (primary CTA pill, active markers, restrained). Trip Sans only
(400/500/700). Shell `1440px` (`--spt-shell`), readable `780px`, semantic
surface/ink/muted/border/link/focus/error tokens with dark-mode values; never
filter photography; logo white-backing in dark. Buttons/cards/inputs/nav per
Editorial Trip Desk (`aria-current` + 3 px Amber underline). Guard 12: external
patterns (MotionSites/21st.dev/React Bits) only if free, SSR-safe, dynamic-data
safe, accessible, mobile/reduced-motion safe, cheap JS. Guard 11: zero new deps
(Tailwind/UI/animation/GSAP/3D/carousel/form libs banned) — server components +
React + SCSS + native HTML/CSS + small client islands.

---

## 9. Testing & Validation

- Framework: Vitest + RTL + jsdom. **Measured:** 3 `tests/` files + 19
  component `.test.*` + 18 `lib` `.test.*` ≈ 40 test files.
- Commands: `npm test` = `vitest run --configLoader=runner
  --no-file-parallelism`; `npm run test:watch`; `npx tsc --noEmit`;
  `npm run lint` (existing `Header.tsx:108` lint note must not worsen);
  `npm run build`.
- Phase gates: preserve all prior-phase regression tests; Phase 2 adds
  days-contract/D2/pagination/sidebar/pill/removal/Clear-All/locale tests;
  Phase 4 adds support/desktop-mobile/isolation/interim/error/rerender/
  identical-sessions/stop-cancel/unmount/typed-unchanged tests. Any new
  failure blocks the phase. Zero commits on feature branches until approval.

---

## 10. Protected Files (Guard 13 + phase scopes — stop & report if touched)

`lib/api.ts, lib/client-api.ts, lib/data.ts, lib/config.ts,
lib/resolve-api-result.ts, lib/seo.ts, lib/locales.ts, lib/route-helpers.ts,
lib/trips-query.ts, lib/local-date.ts, lib/currencies.ts, lib/recaptcha.ts,
lib/sanitize-html.ts, lib/sitemap/**, proxy.ts, next.config.ts, types/api.ts`
+ `app/trips/page.tsx`, `app/[locale]/trips/page.tsx` (metadata/canonical/
locale/404/cache/sitemap/API untouched). Phase 2 scope ≈ trips-query,
HomeSearchShortcuts, TripsPage, TripsFilterSidebar (+ locale copy/style for
pill). Phase 4 scope ≈ Header, `components/voice/*`, `lib/voice-copy.ts`
(+ header/nav SCSS, tiny voice module). No parser/Smart-Voice/analytics in
Phase 4; no Voice work in Phase 2.

---

## 11. Common Tasks

- **New page:** `app/[locale]/<route>/page.tsx` (+ English root mirror) →
  `lib/data.ts` fetch → `generateMetadata` via `metadataFromPage` →
  `SiteShell` composition → sitemap config if public.
- **New API consumer:** type in `types/api.ts` → fn in `lib/data.ts` via
  `apiFetch/Reliable` → `listData()` pagination → `revalidate: 300` (180 tours).
- **Caching:** fetch-level `next: { revalidate: N }` only; never `force-static`
  mutable data; answer the §2 seven-question check.
- **Dynamic (API-owned):** tours/prices/availability/options/offers,
  categories/destinations, blogs/events/guides/FAQs, currencies, team/social
  (when backend settings), page content, SEO/JSON-LD. **Static (safe):** UI/nav
  labels, How-It-Works, counters, CTA copy, phone/address/WhatsApp (deploy
  config), approved logo/partner assets.

## 12. Gotchas (verified)

| Symptom | Fix |
|---|---|
| `locale` wrong/`/en` works | use `resolvePrefixedLocale`, never raw params; `/en` must 404 |
| Hydration theme flash | `app/layout.tsx` head bootstrap syncs `data-theme` pre-paint |
| Images 402 | `unoptimized: true` + remotePatterns; don't re-enable optimizer |
| Silent null data | `apiFetchReliable` + `resolveRequiredApiResult` for required data |
| Voice double-submit | session/result guard; interim never submits; manual submit cancels session |
| Voice targets wrong form | pass explicit `formRef`/`inputRef` per instance |
| Mobile drawer focus | `inert` + effect-managed focus/Escape |
| CSS vars missing | check `:root`/`[data-theme]` in `styles/globals.scss` |
| `PYTHONIOENCODING` crash dumping memories on Win PS | set `PYTHONIOENCODING=utf-8` first |

## 13. Skills & Checklist

Skills: `dynamic-backend-source-guard` (mandatory for §2 work), `codeguard`,
`technical-seo-auditor`. Pre-completion: no hardcoded backend data; API
authoritative; revalidation set; locales/SEO-from-API/dark-mode/a11y ok;
`vitest`, `tsc --noEmit`, `lint`, `build` green; protected-file diff zero
unless bug-approved; no new prod deps/data; dashboard propagation intact.
