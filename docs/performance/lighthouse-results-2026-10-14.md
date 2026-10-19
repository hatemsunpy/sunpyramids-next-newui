# Lighthouse results — 2026-10-14

**The >=90 performance target is not met.** The current home-copy split removes
11764 computed gzip bytes of initial modern JavaScript while adding1199 gzip
bytes of HTML. Fresh Chrome154 normal home mobile runs scored **53 /56 /50**
(median **53**), desktop **87 /96 /96** (median **96**), without warnings.
Two Chrome151 runs scored54/61 with cache-clearing timeout warnings.
These browser versions and warned runs must not be pooled into a median or used
to claim a causal speed improvement. The implementation and current verification
are recorded in the home-copy section below. All scores describe local builds.

The earlier always-visible hydration experiment has home mobile
**49 / 60 / 60** (median 60), desktop **97 / 96 / 97**
(median 97), with normal third-party scripts enabled. Mobile TBT is
**1304 / 1144 / 1119ms**; the preceding warm home sample was 1821ms. These are
different local samples, not a controlled causal comparison. No >=90 mobile
claim is made. The pre-calendar local production build
was audited in normal mode across 16 templates, producing 36 successful reports
without Lighthouse warnings. Home's three mobile scores are **50 / 61 / 59**
(median 59), and desktop scores are **93 / 97 / 96** (median 96). Every mobile
template remains below 90, as do three desktop templates. These are local
production-build results, not deployed Vercel scores.

The user waived the remaining manual GTM Preview navigation step. No further
manual Preview confirmation is required for this continuation. No GTM candidate
was imported/published, and no code was committed, pushed or deployed.

## Reviewed implementation

OpenCode used `opencode/muse-spark-1.3-contributor-free`, variant `xhigh`.
Codex wrote the bounded briefs, reviewed the actual diff and corrected recovery,
cleanup, URL matching, taxonomy projection and SSR test issues independently.
One combined implementer session stalled and was stopped; the separate helper/
projection session completed. That continuation was verified by Codex. The
subsequent calendar phase has separate evidence below.

- GTM is the normal GA4 library loader. Original public IDs and js/config queue
  commands remain. A bounded direct fallback handles missing/failed delivery.
  All six normal home reports requested **one** Google library, versus two in
  the previous local stage. This removes an observed duplicate approximately
  201KB transfer; it does not prove an equivalent CPU or score improvement.
- `optionCost` moved unchanged into `lib/option-cost.ts`, retaining compatibility
  exports. TourBookingCard no longer imports the large CustomerFlows module for
  this arithmetic. Observed first-party script transfers on the tour mobile
  samples changed from 308405 to 296552 bytes; different local samples do not
  establish score causality.
- Initial HomePopularTours props retain only raw fields used by TourCard.
  Existing API fetches, client filters and prices remain unchanged. Actual home
  desktop HTML changed from 347861 to 346940 bytes; this reduction is modest.
  The larger synthetic fixture reduction is not used as a page measurement.

No continuation changes were made to UI/CSS, image sources, API endpoints,
payloads, business cache TTLs, media cache TTLs, SEO or dependencies. Earlier
image-delivery and client-work optimizations remain documented in
`lighthouse-audit.md`.

## Independent verification

- Full project-default Vitest: **47 files / 524 tests passed**, exit 0.
- Full ESLint, TypeScript and Turbopack production build: passed, exit 0.
  Build used installed Next 16.3.3 under available Node 22.23.2; normal audits
  used Lighthouse 13.3.0, Chromium 151 and Node 24.13.1.
- Production home/tour desktop/mobile: all HTTP 200; title, heading, card
  text/link/image, price and form inventories match their before captures.
  Home mobile and both tour screenshots are pixel-identical. Home desktop has
  small pixel variance (mean absolute RGB difference 1.38/255); its baseline
  caught the loading bar and not-yet-visible capability-dependent microphone.
  It is not reported as pixel-identical. The image/layout/copy sources were
  unchanged by this continuation.
- Actual production network recovery: normal GTM loading, blocked GTM and
  blocked GTM-produced Google library all passed. Each ended with one successful
  Google library response and the original config queue. Failure retries are
  bounded; sufficiently late GTM delivery after direct fallback can still load
  a second SDK. These checks do not certify conversions or a GTM publication.
- Six synthetic SSR parity cases, two pricing assertions and ten isolated DOM
  lifecycle checks also passed; adapter limitations are retained in artifacts.
- Protected API/data/SEO/locale/routing files match baseline hashes with line
  endings normalized. Package and lock files remain unchanged.

Earlier worker-startup failures and a stopped Node 24 build are preserved in
the worklog. After memory became available, the unchanged default full suite
and Node 22 production build actually passed. A Webpack diagnostic rejected the
existing empty PostCSS config; no configuration change or Webpack measurement
was made. Development MCP remains unverified: port 3000 now serves a different
application and returned HTML, not a valid MCP response. Production verification
was performed only against this project's own port 3004.

## Normal local production performance

Home is the median of three runs; other templates have one run per profile.
All individual reports and low results are retained. Local memory availability
varied during the batch, so small cross-stage score differences are not treated
as controlled causal evidence. Acceptance still requires repeated normal-mode
measurements on the actual deployment after further work.

| Template | Mobile | Desktop |
| --- | ---: | ---: |
| Home, median | 59 | 96 |
| Trips | 63 | 97 |
| Category | 51 | 63 |
| Tour | 55 | 97 |
| Blog listing | 63 | 95 |
| Blog article | 53 | 94 |
| Events | 66 | 98 |
| Travel guide | 52 | 99 |
| About | 75 | 81 |
| Contact | 72 | 98 |
| Planner | 65 | 89 |
| Rent car | 73 | 98 |
| Cart | 50 | 99 |
| Checkout, anonymous | 69 | 97 |
| Sign in | 70 | 98 |
| French home | 46 | 94 |

Best Practices remains 73–77, primarily from third-party cookies/Chrome issues
for Clarity, TikTok and Google Ads. Some blog pages also request the existing
missing `/images/linearNeedHelp.png`. SEO is 92 on the blog listing and 100 on
the other audited templates. Backend-owned metadata was not replaced to alter
these scores.

## Remaining measured work

1. **First-party rendering and main-thread work.** A separate diagnostic home
   run with `?no-third-party=1` loaded no external scripts yet scored only
   66 mobile (LCP approximately 4.7s, TBT approximately 630ms), versus 97 desktop
   with 0ms TBT. This diagnostic is excluded from acceptance. Tags are a
   contributor, not a sufficient explanation for the entire gap. Further
   profiling must preserve the same SSR, interaction, motion and API behavior.
2. **Image delivery.** The category desktop banner's `/media/image` request
   took approximately 4.62s. That includes proxy/queue/source/transform/delivery
   time; this observation alone does not isolate the slow substep or prove rate
   limiting. The URL derives from an API-provided `r2.dev` image. Cloudflare says
   [r2.dev public access is for non-production use and rate-limited](https://developers.cloudflare.com/r2/platform/limits/),
   while [a bucket custom domain enables Cloudflare Cache](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/).
   Inspect the actual bucket/domain and Vercel cache headers before changing
   delivery. Custom-domain/region/cache access has been requested from the owner.
   No longer TTL, stale window, static image copy or backend URL rewrite was
   applied. [Vercel cache header precedence](https://vercel.com/docs/caching/cache-control-headers)
   must be considered when verifying real edge HIT/MISS behavior.
   A subsequent public probe against the **existing deployed code** confirmed
   that Vercel caching already works: the same banner returned MISS in 3.11s,
   then HIT in 0.49s, with the existing 300-second freshness policy. Original R2
   HEAD returned 200 in approximately 446ms, 569226 bytes and no Cache-Control.
   This is evidence of a cold/warm delivery gap, not absent Vercel caching or
   proven R2 rate limiting. The deployed code is separate from the working tree.
3. **Tracking policy.** Repeated normal samples still show substantial Google,
   GTM, TikTok, Clarity and Trustindex CPU. Do not silently remove tags, defer
   them beyond measurement, or claim the one-library fix resolves page-view
   ownership. The existing tag-210 pause candidate remains unpublished.

### Read-only follow-up review

OpenCode's subsequent read-only session completed with two candidates: avoid
building closed date-picker grids and narrow gallery preload work. Codex checked
both against source and the actual traces. No guest-photo requests occurred in
either the normal home sample or the diagnostic sample, so the gallery proposal
is not established as an initial-LCP remedy. Closed calendar calculations are
real but their contribution to the measured blocking time remains unprofiled.
The closed-calendar hypothesis was subsequently implemented in a bounded phase;
the gallery proposal was not implemented. Neither is represented as a proven
>=90 fix.

## Subsequent closed-calendar phase

OpenCode session `ses_ec5f7f967ffeujZoYfSVF28aNQ` completed with the same model
and variant. Its two-file diff adds closed-state guards to the day/year memo
calculations and three regression scenarios to the existing date-picker test.
Codex independently reviewed both files: min/max/availability, date selection,
today, month/year navigation, input values, UI markup and styles are unchanged.
Shared consumers include home search, CustomerFlows (planner/rental flows) and
tour booking. No API fetching or business rules were changed.

The four targeted tests passed with the project-default Vitest configuration.
Closed SSR HTML is identical for five synthetic date/month/time fixtures.
The real dev browser and React inspection showed empty closed-grid memos,
42 cells on opening/reopening, and no Next compilation/runtime errors. This
phase is not covered by relabeling the earlier 524-test or 36-report results.
The subsequent Turbopack production build and lint passed. Normal home samples
are mobile **43 / 59**, desktop **94**; these include a cold/warm image-delivery
variation and do not demonstrate a calendar score improvement. Consult
`output/performance/delegation/calendar-verification.json` for the separate
source fingerprint and completion evidence. The >=90 target remains unmet.

## Always-visible hydration experiment

After the owner reiterated that UI, API calls and dynamic ownership must stay
unchanged, two further read-only OpenCode diagnoses examined closed dropdown
work and route-specific CSS loading. No changes were made from those proposals.
The dropdown report's claim of a hard 7.6ms cost ceiling is not accepted:
Lighthouse task URL attribution alone does not bound component work invoked by
React. CSS extraction has real shared-selector/cascade concerns; a standalone
Sass comparison found only 3104 gzip bytes saved by omitting commerce globally,
before bundler verification. No CSS rules/import order were changed.

OpenCode session `ses_ec5dcb99affeULkwqHN30Ig7Y8` implemented five always-visible
React `Activity` boundaries in HomePage, following the installed React 19.2.7
feature and its [official hydration guidance](https://react.dev/reference/react/Activity#speeding-up-interactions-during-page-load).
No sections are hidden and no loading placeholders or DOM wrappers are added.
The intended effect is smaller hydration units; a performance benefit remains
to be measured. Codex's source comparison removes only those boundaries and
their import, then confirms identical emitted code to the preceding HomePage.
Only HomePage differs from the calendar source fingerprint. The dev runtime
has five Activity boundaries, no Next compilation/runtime errors, and unchanged
form/card presence. Targeted lint and a fresh production build passed.
Production runtime checks passed: the same API request multiset (methods,
endpoints, queries and bodies), 194 country options, 42 calendar cells, identical
selected date/phone FormData values, eight popular cards before/filter/restore,
one successful normal Google library, and no React hydration/page errors. No
contact request, order or payment was submitted by this test.

Home/tour desktop/mobile title, heading, card, price and form inventories all
match. Both mobile screenshots are pixel-identical. Desktop home differs in
external TrustIndex badge readiness; desktop tour differs in thumbnail/blur
readiness. These differences were visually inspected, and all 64 tour image
tags are byte-identical across captures. Desktop captures are not described as
pixel-identical. No CSS, typography, image URLs or component markup was edited.

Six normal home reports passed without Lighthouse warnings. Mobile performance
49/60/60 and desktop 97/96/97 still fail the user's combined >=90 target. All
low samples are retained. The feature provides hydration units without hiding
content; the observed lower blocking time does not establish sole causation or
a deployed improvement. French home separately scored **53 mobile / 96 desktop**,
with normal tags, HTTP200 and no Lighthouse warnings; mobile LCP remained 12.54s.
There are eight reports in this final phase. Evidence:
`output/performance/delegation/activity-verification.json` and
`output/performance/activity-normal/`.

The remaining work is not represented as complete. Clarification was requested
about actively required third-party tools and the actual R2/CDN custom hostname
to prepare the next material optimization. All existing tags remain enabled;
no Cloudflare, DigitalOcean, Vercel or GTM settings were changed.

A fresh HEAD of the exact first hero image on `sunpyramidtours.com/storage`
returned HTTP200 in705ms with Apache/Ubuntu headers and no Cache-Control, Age or
CF-Cache-Status. That single response does not establish the configuration of
every image/CDN path. The origin probe also retains an excluded guessed-path
404, which is not evidence of a broken asset on the site. Existing measured R2
URLs are used for any actual cache conclusion.

The owner clarified that Vercel currently hosts the development frontend,
Laravel is on DigitalOcean, and both will ultimately run on DigitalOcean with
Cloudflare R2/CDN. Vercel-specific cache behavior is therefore temporary evidence,
not the final deployment architecture. The owner subsequently confirmed
**DigitalOcean App Platform** and backend **https://sunpyramidtours.com** (matching
the existing API config). A separate image custom domain remains unconfirmed;
the backend domain must not be assumed to be that CDN domain. No dashboard login
is required to continue code work. Earlier inspection-browser tabs were logged out and both desktop
UI runtimes failed to initialize. No credentials, access tokens, domains, cache
rules or hosting settings were changed. Do not infer absent CDN configuration
solely from the sampled `r2.dev` URL.

For the future App Platform deployment, retain a Node web service running the
existing `next build` / `next start` commands. The mutable API-backed pages must
remain dynamic. Verify cold/warm `/media/image` responses and effective cache
age on the actual custom domain; the current Vercel HIT is not evidence of a
DigitalOcean HIT. Avoid adding a second independent 300-second freshness window.
DigitalOcean documents that dynamic service responses are not cached by default
and describes header-controlled caching and edge settings in its
[App Platform edge guide](https://docs.digitalocean.com/products/app-platform/how-to/configure-edge-settings/).
Keep React streaming and HTML/RSC separation intact when checking any edge layer.
This is a deployment verification plan; no App Platform app was configured or
deployed and no new hosting performance claim is made.

## Mobile90 Motion experiment — rejected and reverted

The active objective is >=90 mobile across the original audit scope; it remains
unmet. A fresh pre-experiment normal home run scored50, LCP4.50s and TBT1858.5ms
(`output/performance/mobile90-baseline/`). Earlier normal-source medians remain
the acceptance reference; one fresh run is not a controlled causal baseline.

OpenCode session `ses_ec59d3dafffePNkSgDxS6HT5AI` implemented `LazyMotion`/`m`
conversion. Parent review corrected invalid named imports from `motion/react-m`
to namespace imports. Five closed-calendar SSR fixtures and a structural source
comparison passed, but that did not establish interactive fidelity. A fresh
browser test held the observed feature implementation chunk and found the opened
calendar at opacity0, becoming opacity1 only after releasing the request. This
contradicts the delegate's claim that early interaction would stay functional
without transitions. The asynchronous variant was rejected and archived.

The first two delayed-chunk probes held Turbopack's initial async-loader stub,
stalling unrelated hydration; their timeouts are retained as inconclusive harness
attempts. The corrected third probe targets the feature implementation itself:
`output/performance/mobile90-motion-slow-load-r3.json`.

A synchronous `domMax` variant retained all animation features immediately. Its
four calendar tests, focused lint, five SSR fixtures, Next dev compilation/runtime
checks and Node22.23.2 production build passed (Next16.3.3, compilation76s,
TypeScript32.6s). Home and tour title/card/price/form inventories were equal on
mobile and desktop; home interactions and business request multiset were equal,
with no React errors. Screenshots are not all pixel-identical: home captures
differ in the unchanged navigation progress strip, desktop tour in external
Trustindex badge readiness; mobile tour is identical.

Three normal mobile home runs scored **55 /60 /59**, median **59**. TBT was
1741.5 /1324.5 /1260ms. There were no Lighthouse warnings. The observed Next
script set increased from288005 to289153 computed gzip bytes (+1148), and raw
JavaScript increased320 bytes. No convincing performance gain was established;
the synchronous variant was also rejected rather than retaining extra machinery.
Evidence: `output/performance/mobile90-motion-normal/`,
`mobile90-motion-after/bundle-comparison.json` and `parity.json`.

Only this experiment was reverted. `mobile90-motion-rollback.json` confirms exact
normalized source hashes equal the pre-experiment snapshot, including all earlier
performance fixes. The new provider was removed; existing uncommitted work was
preserved. Candidate build/test/score results above describe a rejected variant,
not current code. No commit, deployment, tracking timing, GTM or CDN change occurred.
The original API contracts, dynamic Laravel ownership and cache/revalidation/error
semantics remain unchanged. Further work targets measured bundle composition.

## Owner clarification and local GTM review

The owner confirmed Clarity, TikTok and Google tags are required. A separate
local review copy proposes pausing only Ahrefs (81), Plausible (150) and Hotjar
(223); their omission from the required list is not proof of global non-use.
OpenCode prepared the generator using `opencode/muse-spark-1.3-contributor-free`
with `xhigh`. Parent review fixed incorrect nesting in its array validation,
then executed the generator and an independent recursive diff. Exactly three
`paused:true` fields were added. All 46 other tags, including Google/pageview210,
Clarity99 and TikTok194, and all other export fields remain equal. Counts remain
49 tags / 52 triggers / 39 variables. Original export, earlier separate pageview
candidate, production code and protected API-source hashes remain unchanged.

Evidence: `output/performance/gtm-unused-review-2026-10-14/README.md`,
`manifest.json` and `independent-check.json` in that folder. This old v228 review
copy must not overwrite a newer live workspace. No import or publication occurred.
Three existing normal mobile reports observed about 9KB combined from Plausible
and Hotjar and no matching Ahrefs request; that observation does not establish
CPU savings or predict a score of90. No new Lighthouse result is claimed.

The latest owner screenshot shows **None — CDN disabled, use local storage**
selected in the Laravel Media settings form. It does not independently establish
the persisted configuration or override evidence of existing R2 image URLs.
Selecting Cloudflare R2 to reveal its settings is the next inspection step;
saving requires verifying the public image hostname and existing-file URL behavior.
No backend/CDN settings were changed. The R2 custom image hostname remains unknown.

## Backend authority and evidence

Tours/options were dynamic before the change and remain Laravel-owned. Next
continues fetching through the existing API contracts. The projection copies
no production records into source/JSON; it only narrows per-request client
serialization. Dashboard/API updates still propagate through unchanged refresh
behavior without frontend deployment. No permanent API-failure fallback, TTL
change or SEO ownership change was introduced.

Current code hashes and gate results:
`output/performance/delegation/continuation-verification.json`.
Normal reports/summary: `output/performance/continuation-normal/`.
Diagnostic reports: `output/performance/continuation-diagnostic/`.
Production UI/recovery evidence: `output/performance/continuation-after/`.
Earlier failure history and implementation notes:
`docs/performance/continuation-2026-10-14.md`.

## Current home-copy split — parent review

OpenCode session `ses_ec57e22b3ffe63SKqVsCedikO3` implemented the bounded brief
using `opencode/muse-spark-1.3-contributor-free`, variant `xhigh`. Five synchronous
server wrappers now resolve only the existing labels needed by their matching
client components: Header, BottomBar, HomeSearchShortcuts, HomePopularTours and
HomeNeedHelpForm. The original dictionaries and every string remain unchanged.
The picker resolves each key through the original Proxy, preserving locale,
English and property-name fallbacks, and passes a plain serializable object.

Independent parent checks passed:

-35 wrapper/locale boundary cases across all seven locales, including English
  fallback for missing translated keys. Exact keys and original prop identities
  were checked; these checks alone do not certify complete page interactions.
-All five emitted client implementations match the pre-phase source after
  normalizing only the component rename and label injection. Protected API,
  routing, SEO, tracking and earlier performance source hashes are unchanged.
-Focused ESLint on11 production files, Next16.3.3 production build and TypeScript
  passed. API-backed routes remain dynamic. Four Vitest files passed51 tests;
  the combined run failed overall because the remaining voice-suite worker
  did not start. Its isolated rerun passed27 tests. No tests were weakened.
-Next dev MCP reported no compilation/config/session errors. React inspection
  confirmed the server/client boundaries. The calendar showed42 cells at
  opacity1, and countries loaded194 options including the placeholder.
-Production home/tour desktop/mobile inventories match title, heading, cards,
  prices and form controls. Calendar/filter/phone checks and the business API
  request multiset match the baseline, with no React/page errors. Home desktop
  and mobile screenshots are pixel-identical. Tour desktop differs only in the
  external Trustindex badge bounds; tour mobile in the first thumbnail's image
  readiness. These two images are not claimed pixel-identical.

Both production harnesses saved all results and independently passed comparison,
then hung during browser teardown. Their owned browser trees and processes were
terminated. Saved assertions are retained, but clean process exits are not claimed.

The preserved production analyzer shows **zero client output parts** from
`lib/home-copy.ts`, versus32999 raw source bytes before. This route graph includes
lazy modules; per-source compressed estimates are not additive network cost.
Actual initial modern Next script files changed from912942 to878044 raw bytes,
and288005 to276241 computed gzip bytes. HTML changed from347440 to350659 raw
bytes and47391 to48590 computed gzip bytes. Net computed gzip reduction across
these scripts plus HTML is **10565 bytes**. Nomodule scripts are excluded. These
are consistently computed artifact sizes, not browser wire-byte or CPU savings.

Chrome151 mobile home scored54/61, both with cache-clearing timeout warnings.
A fresh Chrome154 profile scored53 mobile without warnings. Reusing that profile
then caused three `Storage.getUsageAndQuota` protocol failures before new reports;
they remain failed measurement records, not site scores. A separate fresh Chrome154
desktop profile scored87 without warnings (LCP1095ms, TBT89.5ms, Speed Index6444ms).
Two further fresh-profile batches scored56/50 mobile and96/96 desktop, without
warnings. Mobile LCP was4861/11895ms and TBT1080.5/967.5ms. The three Chrome154
home samples therefore have median53 mobile and96 desktop. The11895ms
LCP outlier is retained; these samples do not prove that the smaller bundle
improved speed. No French score was produced by the failed reused-profile run.
Browser versions and warned runs are kept separate. No speed improvement or90
claim follows from the smaller bundle. Current repeated-run evidence is recorded
in `output/performance/delegation/mobile90-copy-verification.json`.

The changed data is frontend-owned presentation copy. Business records were
dynamic before and remain Laravel-owned, fetched through the same APIs. No
production records were copied into source or JSON. Dashboard updates still
propagate without frontend deployment through unchanged refresh behavior.
Cache/revalidation, stale/error behavior and SEO ownership are unchanged; no
permanent fallback was added. Google, Clarity and TikTok retain current immediate
loading/measurement timing. No commit, push, deployment, GTM or CDN change occurred.

Evidence: `output/performance/mobile90-copy-{baseline,before,before-r2,after,analyze}/`,
`mobile90-copy-label-boundaries.json`, `mobile90-copy-scope.json`, and
`output/performance/delegation/mobile90-copy/`.
