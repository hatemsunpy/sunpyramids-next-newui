# Lighthouse performance plan — 2026-10-13

Review status: implementation and independent validation completed for the scoped
frontend fixes. **The minimum90 acceptance target is NOT MET.** Final home
samples are54/57/57 mobile and88/97/97 desktop. Final core measurements and
remaining account/media dependencies are documented in lighthouse-audit.md.
No changes were pushed or deployed. GTM account access has been requested for
the next verification step; no marketing timing/scope or CDN stale-window
proposal has been applied.

Target deployment: https://sunpyramids-next-newui.vercel.app/.
Implementation base: ec928b74dc61ada97f2a859a30b383faa7f535dc.
The old `sunpyramids-next.vercel.app` deployment is excluded from acceptance.

The owner requests performance >=90 on mobile and desktop, without changing
the UI or API-controlled data. OpenCode implements; Codex independently reviews
the diff, reruns gates, checks visual/functional parity, and measures the result.

## Confirmed initial measurements

Lighthouse 13.3.0, normal mode, production deployment, simulated mobile/desktop
throttling. Single runs are baseline evidence, not a stability claim.

| Route | Mobile performance | Desktop performance | Mobile LCP | Mobile TBT |
| --- | ---: | ---: | ---: | ---: |
| `/` | 37 | 74 | 6.23 s | 11.34 s |
| `/trips` | 55 | 98 | 4.54 s | 1.58 s |

Raw JSON and HTML reports: `output/performance/deployed-newui-2026-10-13/`.
The complete matrix samples 16 route templates in both device profiles:
home, trips, category, tour, blog list/detail, events, travel guide, about,
contact, trip planner, car rental, cart, checkout, sign-in, and French home.
Empty, redirected or error pages must be identified explicitly; they do not
prove performance for a populated/authenticated customer state.

## Ordered implementation

1. **P1 — repair the ineffective responsive image pipeline.** The installed
   Next.js `get-img-props.js` overrides per-image `unoptimized={false}` when
   `config.unoptimized` is true. The deployed home still emits original image
   URLs without the intended responsive source set. Repair this verified bug
   using the existing image transform service and a custom loader; ensure no
   image is routed through Vercel's billed `/_next/image` service. Preserve
   source URLs, crop, layout, alt text, blur behavior, animation and fallback.
   A tightly scoped image configuration edit is allowed for this verified bug.
2. **P1 — reduce critical-path image and rendering work.** Keep the first hero
   image discoverable and high priority, prevent invisible slides from competing
   with it, and preserve manual navigation, five-second autoplay, transitions
   and reduced-motion behavior. Remove unnecessary blocking preview work only
   if the same loading behavior and final appearance remain intact. Optimize
   discovery backgrounds and oversized below-fold assets from the same sources.
3. **P1 — reduce measured JavaScript and layout cost.** Inspect the production
   bundle and Lighthouse CPU evidence. Split code needed only on interaction,
   reduce observer/layout thrashing, and preserve date picker, voice search,
   gallery, menu, wishlist, currency and form behavior. Keep all third parties
   enabled; no removal, tracking/consent redesign or audit-detection shortcuts.
   Normal-mode analytics/TrustIndex costs must remain visible in the report.
4. **P1 — verify the image service's trust and freshness boundaries.** Cover
   forbidden hosts/protocols/credentials/widths, bounded payload/pixel limits,
   expiry/refresh, concurrent request sharing and uncached fallback to the same
   original image. Bound transform concurrency and memory. Do not cache failures
   or extend backend data TTLs. Add only meaningful regression tests.
5. **P2 — make the audit repeatable.** Repair summary accumulation, report failed
   or redirected routes honestly, retain raw reports, and record Lighthouse,
   Chrome, commit, environment, device and throttling details. Use standard
   throttling and normal URLs. At least three sequential runs on acceptance
   routes; report individual results and medians, including outliers.

## Acceptance and review

- Preserve layout, typography, colors, copy, images, responsive composition,
  animation and customer flows. Compare matching desktop/mobile screenshots
  and exercise interactive controls; API-driven content may vary over time.
- Laravel endpoints, payloads, prices, SEO, locale/routing, error semantics,
  cache/revalidation and dashboard propagation remain unchanged.
- Never copy production records, hardcode CMS content, or create static export.
- Run `npm run test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
  Existing unrelated failures must be proven and reported, never hidden.
- Measure the new production build separately from the currently deployed
  baseline. A local improvement is not evidence of a deployed improvement.
- Performance >=90 must be measured in normal mode on both profiles. Diagnostic
  no-third-party runs can isolate costs but cannot count toward acceptance.
- If an external tag, backend/CDN or hosting constraint prevents the target,
  retain the constraint and document its measured contribution and concrete
  proposed remedy. Do not claim completion or silently change the contract.
- OpenCode must leave changes uncommitted for Codex review. No deploy/push.

## Backend guard

Dynamic data remains owned by Laravel and fetched through existing contracts.
No production data snapshots are introduced. The image service derives bytes
from approved live image URLs with a bounded five-minute cache and falls back
to that same original URL without caching the fallback. Business-data and SEO
cache policies are unchanged. Every modified shared component requires checks
on its consuming route templates. The final report answers all seven mandatory
backend ownership/freshness questions in AGENTS.md.
