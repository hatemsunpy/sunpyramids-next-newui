# Published mobile audit review — 20 October 2026

Target: https://sunpyramids-next-newui.vercel.app/
Deployment: dpl_H2xqHwmR5p43zv1vuZvPbgbfeRY9; app SHA 58facbb59e8d0050f157dc48b0a634e928f3a0c0.
[Complete cloud run](https://github.com/hatemsunpy/sunpyramids-next-newui/actions/runs/39269448641). Lighthouse 13.5.0; official full Stable Chrome 155.0.8059.84; Ubuntu 24.04; normal tracking; default simulated mobile profile.

Homepage: 33 / 34 / 40; median **34**. The only homepage gate failure is below 70; API and required SDK delivery checks passed, with no Lighthouse warnings. **The 70–80 target has not been achieved.**

All 16 routes returned HTTP 200/nonempty and valid mobile reports. This is ONE exploratory sweep, not three-run route medians.

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

- No new app optimization in PR 58; target not reached

## Dynamic source guard

No application change in PR 58. Existing dynamic data stays Laravel-owned and API-fetched. No production data copied into source/JSON; downloaded reports are ignored diagnostic artifacts. Dashboard changes still propagate under existing cache/revalidation behavior without frontend code deployment. API failures, SEO ownership, routes, and stale behavior remain unchanged.


## Separate CPU diagnostic (not acceptance)

A normal public-home visit with Google, Clarity and TikTok script HTTP 200 deliveries was captured on Windows / full Chrome 151.0.7922.34, mobile viewport 412x823 and CPU 4x. It is not a Lighthouse score, and is not comparable with the Ubuntu / Chrome 155 cloud scores. No JavaScript console errors were observed.

The initial local self-time ranking suggested useMemo 97.4ms. Parent inspection disproved attributing that to an expensive application calculation: 94.982ms came from ONE sample in the Next router useMemo hook, whose callback only constructs a router object; other calls were Motion and PhoneCountryInput. Profile sample median 1.568ms, p95 2.648ms, maximum 94.982ms. That isolated gap may include scheduling/throttling noise. Do not refactor application memoization or claim CPU savings from this sample.

The cloud workflow adds a separate home capture with `AUDIT_JS_SAMPLING=1` and the `disabled-by-default-v8.cpu_profiler` trace category. It uses an isolated `diagnostic-` phase, marks summaries `diagnosticOnly`, retains its raw trace and refuses a capture with no CPU samples. Both acceptance gates reject diagnostic summaries; the home gate also rejects a sampled Lighthouse report. Default acceptance flags, mobile throttling and immediate tracking remain unchanged. Diagnostic scores are excluded from all acceptance medians.

## Verification of the audit changes

Independent actionlint, Node syntax and scoped ESLint checks accompany 25 existing offline gate cases and seven added isolation checks. These include normal evidence as a passing control, diagnostic summaries and sampled LHRs rejected from acceptance, and both directions of summary-history mixing rejected before Chrome launch. Fixture scores are not website measurements. Application builds/tests are not repeated for these tooling/documentation-only changes.
