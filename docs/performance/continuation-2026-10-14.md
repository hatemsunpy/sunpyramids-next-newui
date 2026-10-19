# Performance continuation — 2026-10-14

> Historical worklog. The final validated status and current measured scores
> are in [Lighthouse results — 2026-10-14](lighthouse-results-2026-10-14.md).
> Later successful retries supersede the pending gate states below.

The owner explicitly requested skipping the remaining manual GTM Preview
navigation check and continuing performance implementation. Do not ask them to
repeat that step. Their captured GA4 screen shows one GA4 page view for the
recorded home load, alongside separate Ads hits; it was disconnected when
captured. This is partial evidence, not a passed live navigation/conversion audit.
The agent has not imported or published the GTM candidate.

## Current bounded implementation

OpenCode implements, Codex independently reviews and measures:

1. Use the existing GTM Google tag as the normal GA4-library loader, retaining
   the original dataLayer/js/config commands and IDs. Add a bounded direct
   fallback for failed or missing delivery. Do not remove tags, rename events,
   apply long measurement-avoidance timers or assume the Preview tag pause was
   published. The prior normal mobile report downloaded two approximately
   201KB copies of the same Google library with different loader query strings.
2. Move optionCost's exact existing implementation to a small shared module,
   retaining compatibility exports and all arithmetic. TourBookingCard must
   not import auth/cart/payment components just to use this calculation.
3. Project only fields actually read by TourCard across the HomePopularTours
   client boundary. Preserve raw rendered values, SSR, client filters, source
   URLs, nested offer-category checks and wishlist behavior. The Laravel API
   query/result/freshness remain unchanged; no production snapshot is introduced.

No UI/CSS, media cache, SEO, routing, endpoint, payload, pricing algorithm or
dependency changes are authorized by this bounded continuation brief. The
earlier reviewed working-tree changes remain intact.

## Independent review and evidence

OpenCode used `opencode/muse-spark-1.3-contributor-free`, variant `xhigh`.
The first combined session implemented the library loading change but stalled
after worker startup failures and was stopped. A separate bounded session
completed the pricing-helper move and card projection. Codex reviewed the
actual source and corrected exact URL matching, failed-script recovery,
cleanup/remount behavior, nested taxonomy projection and the SSR test setup.

- The pricing helper body matches its original implementation exactly after
  line-ending normalization. Two independent arithmetic assertions passed.
- Six synthetic full/projected card fixtures render identical static markup
  through the actual TourCard source. Input data remains unmodified. This
  verifier uses small Next/router/currency adapters, so it does not replace the
  complete application suite.
- Ten isolated Chromium DOM checks passed for loader matching, normal queue,
  fallback, failed-node recovery, remount and cleanup. These execute the actual
  source after native type erasure, with an effect adapter and inert scripts;
  they do not certify React StrictMode or live analytics/conversions.
- The current development home runtime loaded one Google library, via GTM.
  All 16 card text/link/image inventories match the production capture from
  before this continuation. One Day displayed eight cards; returning to
  Recommended restored the exact original 16-card inventory after the existing
  transition settled. An earlier immediate capture observed the outgoing
  animation content and is retained separately.
- Protected API, data, locale, routing, SEO and type sources match the baseline
  hashes with CRLF normalized to LF. Package and lock files are unchanged.

Evidence: `output/performance/delegation/targeted-projection-check.json`,
`script-dom-check.json`, `current-dev-home.json`,
`continuation-source-check.json`, `dev-filter-check.json` and the preserved
delegation briefs/results. Synthetic byte reductions are not measured page
reductions. Development runtime evidence is excluded from Lighthouse acceptance.

## Application gates and performance acceptance

The current source passed `node node_modules/typescript/bin/tsc --noEmit`
and targeted ESLint on all eight continuation production/test files, both
with exit 0. `git diff --check` also passed (line-ending warnings only).
The unchanged three SSR projection tests passed with
`vitest run lib/tour-card-data.test.tsx --environment=node --configLoader=runner --no-file-parallelism`.
This SSR-only override avoids constructing jsdom; it is not a pass for the
remaining DOM tests or the full suite.

The latest targeted Vitest retry failed to start all three workers; no test
assertions ran. Existing card tests failed at startup too. Standalone jsdom
imports eventually completed in approximately three to four minutes, exceeding
the installed worker's 60-second startup deadline. This supports an environment
startup problem; it does not establish its root cause or prove the suite passes.
Node/pool/config-loader retries did not resolve startup. Tests, dependency files
and assertions were not weakened to obtain a pass.

The default Node 24 Turbopack production build remained at compilation for more
than 20 minutes and was stopped without a successful result. A documented
`--webpack` diagnostic attempt reported that the existing empty PostCSS config
must export a plugins key; it was stopped and the config remains unchanged.
No Webpack measurements were taken. A separate default build using available
Node 22 is a retry, not evidence of success until it exits successfully.

At the time of these failures, Windows reported approximately 0.5–1.2 GB free
physical memory out of 16 GB. Resource pressure is observed, not proven as the
sole cause. User-owned servers and applications were not stopped.

Fresh production build, application gates, production visual comparison and
normal-mode Lighthouse samples remain required. The prior 509-test pass belongs
to the earlier source stage and is not a pass for this continuation. The 90
target remains unmet: the earlier local home medians were 57 mobile / 97 desktop,
with a desktop run below 90; these are not scores for the current source or the
deployed site after these changes. No commit, push, deployment or GTM publication
has been performed for this continuation.

### Successful retry after memory became available

Windows free physical memory subsequently increased to approximately 6.6 GB.
The default Turbopack build under Node 22.23.2 completed successfully (compile
11.1 minutes, build TypeScript passed, exit 0). All mutable application routes
remain server-rendered on demand; robots.txt is the static exception.
Full project ESLint passed. The project-default threads suite then passed
**47 files / 524 tests**, with no timeout/worker override or weakened assertions.
The supported vmThreads targeted retry also passed 3 files / 20 tests. Keep the
earlier startup failures as evidence; they do not negate these actual successful
retries, and the correlation with available memory does not prove a sole cause.

Production home/tour desktop/mobile captures all returned 200. Their title,
heading, card text/link/image, price and form inventories match the earlier
captures exactly. HTML sizes changed from 347861 to 346940 (home desktop),
347951 to 347030 (home mobile), 508362 to 507349 (tour desktop), and 508362
to 507439 (tour mobile). This continuation's page-byte reduction is modest;
the much larger synthetic fixture reduction must not be used in its place.
Screenshots are preserved in `output/performance/continuation-after/`.
Fresh normal-mode Lighthouse samples are being recorded separately.

## Backend authority check

Tours and options were dynamic before this work and remain owned by Laravel.
The existing API fetches, endpoints and error behavior are unchanged. Projection
only narrows serialization after fetching; it does not copy production records
into frontend source or JSON. Dashboard updates still reach Next through the
existing fetch/revalidation behavior without a code deployment. No cache TTL,
SEO ownership or permanent production fallback was introduced or changed.

The existing dev server is reachable through agent-browser/React introspection
and MCP metadata/routes. MCP's full compilation-issues request timed out during
preflight; retry after implementation and record the actual result. Production
build and browser checks are still required and must not be replaced by a claim
that this timed-out check passed.
