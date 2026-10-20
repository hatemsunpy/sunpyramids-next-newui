# Published mobile audit review — 20 October 2026

Acceptance source selected by the owner: **Google PageSpeed Insights for every audited route**. The completed [16-route Google mobile matrix](google-mobile-16-routes-2026-10-20.md) has three eligible reports per route: **6 medians at least 70; 10 below 70**. The site-wide milestone is not achieved. Google homepage mobile median is **82** (52/82/87), desktop median **83** (72/83/88); desktop 90 is not established. The earlier separate GitHub/Chrome 155 home median was **40**. The published application code was unchanged between these Google captures; mutable CMS content remained live. A subsequently reviewed local voice-label payload change is documented separately below.

Target: https://sunpyramids-next-newui.vercel.app/
Deployment: dpl_H2xqHwmR5p43zv1vuZvPbgbfeRY9; app SHA 58facbb59e8d0050f157dc48b0a634e928f3a0c0.
[Complete cloud run](https://github.com/hatemsunpy/sunpyramids-next-newui/actions/runs/39269448641). Lighthouse 13.5.0; official full Stable Chrome 155.0.8059.84; Ubuntu 24.04; normal tracking; default simulated mobile profile.

Initial cloud capture on 19 October: homepage 33 / 34 / 40; median **34**. The only homepage gate failure is below 70; API and required SDK delivery checks passed, with no Lighthouse warnings. **That capture does not meet the 70–80 target.**

In that initial capture, all 16 routes returned HTTP 200/nonempty and valid mobile reports. This is ONE exploratory sweep, not three-run route medians.

| Route | Performance | Accessibility | Best practices | SEO | LCP ms | TBT ms |
|---|---:|---:|---:|---:|---:|---:|
| home | 34 | 94 | 77 | 100 | 13836 | 1286 |
| trips | 41 | 100 | 77 | 100 | 13349 | 1397 |
| category | 42 | 94 | 77 | 100 | 12038 | 1284 |
| tour | 62 | 100 | 77 | 100 | 3779 | 1655 |
| blogs | 63 | 95 | 73 | 92 | 3803 | 1364 |
| blog | 60 | 97 | 73 | 100 | 4053 | 1084 |
| events | 55 | 100 | 77 | 100 | 5339 | 1325 |
| guide | 44 | 100 | 77 | 100 | 11688 | 1405 |
| about | 67 | 100 | 77 | 100 | 3328 | 1301 |
| contact | 67 | 96 | 77 | 100 | 3254 | 1374 |
| planner | 41 | 100 | 73 | 100 | 12619 | 1544 |
| rent | 67 | 100 | 73 | 100 | 3257 | 1495 |
| cart | 52 | 100 | 77 | 100 | 5227 | 1217 |
| checkout | 34 | 100 | 77 | 69 | 13334 | 1513 |
| auth | 67 | 100 | 77 | 100 | 3026 | 1704 |
| french | 42 | 94 | 77 | 100 | 12818 | 1430 |

## Evidence and priorities

1. Home observed LCP breakdown: image loaded in approximately 41ms after 215ms discovery delay, with approximately 2116ms render delay. Simulated LCP is 13.84s; these are different metrics and must not be mixed. Existing high-priority/eager/discoverable initial image checks pass. Additional image compression alone cannot be claimed to solve this render delay.

2. Blocking JavaScript spans all routes (TBT 1.08–1.70s). Home longest simulated task: Google gtag 800ms; GTM 349ms; TikTok 318ms; largest first-party runtime task 221ms. User requires immediate Google/Clarity/TikTok; no delay or script blocking is authorized. Hotjar remains active despite being unused per owner, but no live GTM change has been made.

3. Homepage, checkout, trips, planner and French home need further paint/JavaScript diagnosis. Current raw Lighthouse traces omit CPU samples by default; a separate normal-load CPU diagnostic is required before attributing minified framework time to a component.

4. Best-practices 73–77 includes third-party cookie findings. These scores are not evidence of an own-code security defect. Checkout SEO 69 must be assessed against its intended indexability; do not remove private-flow noindex directives just to raise audit scores.

## Limits

- One exploratory run per non-home route, not repeated per-route medians

- Anonymous empty-cart and signed-out flows only

- Lighthouse 13.5 / Chrome 155 results cannot establish change from older 13.3 / shell 151 measurements

- SDK deliveries pass; not proof all analytics events preserve measurement

- The voice-label optimization described below has not been verified on the public alias; the site-wide target is not reached

## Dynamic source guard

The audit tooling does not change application behavior. The subsequent application change only moves frontend-owned voice UI label dictionaries out of the browser bundle. Existing dynamic data stays Laravel-owned and API-fetched. No production data copied into source/JSON; downloaded reports are ignored diagnostic artifacts. Dashboard changes still propagate under existing cache/revalidation behavior without frontend code deployment. API failures, SEO ownership, routes, and stale behavior remain unchanged.


## Separate CPU diagnostic (not acceptance)

A normal public-home visit with Google, Clarity and TikTok script HTTP 200 deliveries was captured on Windows / full Chrome 151.0.7922.34, mobile viewport 412x823 and CPU 4x. It is not a Lighthouse score, and is not comparable with the Ubuntu / Chrome 155 cloud scores. No JavaScript console errors were observed.

The initial local self-time ranking suggested useMemo 97.4ms. Parent inspection disproved attributing that to an expensive application calculation: 94.982ms came from ONE sample in the Next router useMemo hook, whose callback only constructs a router object; other calls were Motion and PhoneCountryInput. Profile sample median 1.568ms, p95 2.648ms, maximum 94.982ms. That isolated gap may include scheduling/throttling noise. Do not refactor application memoization or claim CPU savings from this sample.

The cloud workflow adds a separate home capture with `AUDIT_JS_SAMPLING=1` and the `disabled-by-default-v8.cpu_profiler` trace category. It uses an isolated `diagnostic-` phase, marks summaries `diagnosticOnly`, retains its raw trace and refuses a capture with no CPU samples. Both acceptance gates reject diagnostic summaries; the home gate also rejects a sampled Lighthouse report. Default acceptance flags, mobile throttling and immediate tracking remain unchanged. Diagnostic scores are excluded from all acceptance medians.

## Verification of the audit changes

Independent actionlint, Node syntax and scoped ESLint checks accompany 25 existing offline gate cases and seven added isolation checks. These include normal evidence as a passing control, diagnostic summaries and sampled LHRs rejected from acceptance, and both directions of summary-history mixing rejected before Chrome launch. Fixture scores are not website measurements. These were tooling/documentation-only checks; the later application change has its own full build and 549-test validation.

## Follow-up on 20 October: independent Google reports

Google PageSpeed UI succeeded despite the direct API returning its daily-quota error. Three sequential reports measured the SAME production application SHA 58facbb, with no application changes between them:

| Run | Mobile | Desktop | Mobile LCP | Mobile TBT | Google report |
|---|---:|---:|---:|---:|---|
| 1 | 52 | 72 | 12.2 s | 430 ms | [Report 1](https://pagespeed.web.dev/analysis/https-sunpyramids-next-newui-vercel-app/6kobllt325?form_factor=mobile) |
| 2 | 82 | 83 | 3.8 s | 240 ms | [Report 2](https://pagespeed.web.dev/analysis/https-sunpyramids-next-newui-vercel-app/0tyx3z0fop?form_factor=mobile) |
| 3 | 87 | 88 | 3.8 s | 120 ms | [Report 3](https://pagespeed.web.dev/analysis/https-sunpyramids-next-newui-vercel-app/70wc0a9t2b?form_factor=mobile) |

Mobile median 82, range 52–87; desktop median 83, range 72–88. The mobile homepage median exceeds the 70–80 milestone, but the 52 sample remains and no site-wide minimum or desktop 90 has been established. This is verification of the existing deployment, not a causal speed improvement from PR 58. Google used Lighthouse 13.5.0 / HeadlessChromium 153.0.8010.36 and reported no CrUX field data. Do not combine these scores with the separate Chrome 155 workflow samples into one median.

## Follow-up cloud capture and CPU attribution

[Cloud run 39393062210](https://github.com/hatemsunpy/sunpyramids-next-newui/actions/runs/39393062210) completed on 20 October. Normal home scores 33/40/41, median 40; the only home gate failure remains below 70. Required API and SDK delivery checks passed. All 16 exploratory routes returned HTTP 200/nonempty reports, performance 39–70; contact and rent reached 70. The gate is still failing and no weak samples have been discarded.

The isolated CPU capture succeeded and retained 23,143 page-process samples; it is excluded from all acceptance scores. Median sample interval 174µs, p95 249µs, maximum 8.924ms, with no gaps over 10ms in that page profile. Sampled self time attributed to first-party URLs totals approximately 244ms; Google Tag Manager URLs 345ms, TikTok 144ms, Clarity 117ms, Hotjar 45ms and Trustindex 41ms. These are observed sampled attribution estimates, not simulated TBT, and unassigned/native/idle time remains separate. The leading first-party frame was Turbopack module initialization (~55ms across 294 samples); no large application calculation has been identified that justifies changing the locked UI/API behavior.

The current evidence supports further investigation of paint timing and the remaining startup cost. It does not establish why Chrome 153/Google and Chrome 155/GitHub differ, or prove that changing a particular application component will stabilize every run above 70. Immediate required tracking, UI, API calls and dynamic ownership are preserved.

[Cloud run 39400454456](https://github.com/hatemsunpy/sunpyramids-next-newui/actions/runs/39400454456) later completed against the same public application. Home 35/37/38, median 37; the home gate again failed only for its score. All 16 exploratory routes returned valid reports; nine were below the separate workflow's 70 threshold. This is not a deployed regression from the voice-label commit: that commit was only on the PR branch, while the audited alias still ran app SHA 58facbb. Google remains the owner-selected acceptance source.

## Subsequent local application change

[Voice-label payload review](voice-label-payload-2026-10-20.md) records a bounded OpenCode implementation and independent review. Initial JavaScript is 12,692 raw bytes / 4,859 gzip bytes smaller; measured HTML plus JavaScript is about 4KB gzip smaller, with a documented live CMS image-URL input change. All 549 tests, scoped ESLint, live Next/browser checks and the production build passed. UI declarations, voice behavior, API requests, dynamic ownership and immediate tracking are unchanged. These local results do not establish a deployed Google performance improvement.
