# GTM inspection — 2026-10-14

Target: https://sunpyramids-next-newui.vercel.app/.
Container: GTM-KDF33T7. GA4 measurement: G-NKZ6W32C4J.
This is a read-only account/public-container inspection and isolated browser
diagnostic. No tracking source, account setting, container version, UI, API,
cache policy, marketing trigger or conversion definition was changed or published.

## Confirmed published configuration

The public container script downloaded on this date contains 78 tag entries.
Its compiled resource version field is `228`; this field is not asserted to
be the version number displayed in the GTM account.

| Compiled tag ID | Configuration | Firing condition in the public resource |
| --- | --- | --- |
| 163 | Google tag for G-NKZ6W32C4J | `gtm.init` |
| 210 | Explicit GA4 `page_view` for the same measurement ID | `gtm.js` |
| 99 | Clarity project j4pv3g8ih7 | `gtm.js` |
| 223 | Hotjar site 6532427 | `gtm.js` |
| 194 | TikTok pixel D1IIL93C77U47B7DK3A0 | `gtm.js` |

The condition macro used above is the current event name. These entries are
not gated by a page-path condition in the inspected firing rule. A public
compiled script does not expose the account's friendly tag names, drafts,
permission state, Preview diagnostics or GA4 stream settings.

Script SHA256:
`9ce993fab9b7666048df7fadba2b22e9e1bac093e2b92ce3a083fec351858c0a`.
The downloaded script and extracted rule evidence are retained under
`output/performance/gtm-review-2026-10-14/`.

## Observed requests and counter-tests

All tests below visited the normal production URL. Only the two explicitly
labeled diagnostic tests changed JavaScript behavior inside a separate test
browser context. They are not performance acceptance measurements and did not
change deployed source or other visitors' tracking.

| Test | Result for GA4 G-NKZ6W32C4J |
| --- | --- |
| Normal initial home load | Two `page_view` requests, sequences 1 and 2, approximately 2 ms apart |
| Normal client navigation from home to `/trips` | One additional `page_view`, sequence 3, for `/trips` |
| Diagnostic: add `send_page_view:false` to the frontend `gtag('config', ...)` call | One config override was confirmed, but two initial `page_view` requests remained |
| Diagnostic: ignore that frontend config command entirely | One config was skipped, but two initial `page_view` requests remained |

These observations contradict the unverified hypothesis that changing the
frontend's direct config command alone fixes the duplicate. The strongest
current explanation is overlapping initial page-view emission within GTM:
the Google tag initialization and explicit event tag 210. It still needs
GTM Preview/GA4 DebugView confirmation before a live-container change.
No frontend config-removal or `send_page_view:false` patch was applied.

The published page-load rules confirm that Clarity, Hotjar and TikTok are
eligible on the initial `gtm.js` event. This does not quantify each tag's CPU
contribution. Existing normal/diagnostic Lighthouse measurements show a
substantial aggregate third-party cost, but removing a duplicate analytics
event alone is not a demonstrated route to a mobile score of 90.

## Remaining account access

The owner confirmed they have access and opened the account in another
browser. The available Chrome DevTools connection sees a separate browser;
opening GTM there reached the Google sign-in screen. The alternate browser
control tool failed initialization twice with a missing-path error, including
after reset. The owner's logged-in browser was therefore not inspected.
No cookies, passwords or session tokens were read or transferred.

To finish account inspection, use the accessible inspection browser after
owner sign-in, or inspect an owner-provided GTM container JSON export of the
published version and relevant workspace. Exporting is a read-only operation;
it does not publish or alter the container. Account-side DebugView/Preview
validation remains needed for conversion behavior.

## Concrete proposed validation/change

1. Identify the account tags corresponding to IDs 163 and 210 and record the
   currently published version and workspace changes before editing.
2. In a test workspace, compare the initial page event in Preview with GA4
   DebugView. Verify whether both tags emit the same page view.
3. If confirmed, keep exactly one initial page-view owner. The narrow
   candidate is to pause explicit event tag 210 in that workspace while
   retaining Google tag 163. This is a proposal, not a change already made.
4. Preview home, direct deep link, SPA navigation, back/forward and reload.
   Require one intended page view for each navigation and preserved attribution.
5. Validate the existing lead/cart/checkout/conversion events using the
   owner's test method. Do not create a real purchase just to validate tracking.
6. Review per-tag sampling, load timing or route scope separately for Clarity,
   Hotjar and TikTok with the marketing owner. Do not remove these tags as part
   of the duplicate-page-view correction.
7. Only after validation and owner approval, publish the selected container
   change with a named version and rollback target. Repeat normal-mode mobile
   and desktop Lighthouse on the deployed site; no score is promised in advance.

Google's page-view documentation explains default config emission and the
risk of duplicate manual/automatic pageviews:
https://developers.google.com/analytics/devguides/collection/ga4/views?hl=en.
The isolated tests here are the evidence that a frontend-only change does not
resolve the current observed duplicate.

## Export inspection and candidate review completed

The owner supplied `C:/Users/HaTeM/Downloads/GTM-KDF33T7_v228.json`.
Its public container ID and version match GTM-KDF33T7 / 228. It contains
49 configured tags, 52 triggers and 39 variables; the 78 compiled entries
include generated runtime/listener entries and are a different count.
The source file's SHA256 is
`e82120e1098ff89c08ac63899ea88dcc2808cd624164f4005fc9c814ff173132`.

Actual exported names:

| ID | Account tag name | Exported activation |
| --- | --- | --- |
| 163 | Google Tag (G-NKZ6W32C4J) | Built-in initialization trigger 2147479573 |
| 210 | GA4 - page_view II Tag | Built-in All Pages trigger 2147479553 |
| 99 | Microsoft Clarity - Official | All Pages |
| 223 | AUTO Hotjar Tracking Code | All Pages |
| 194 | Tik Tok Pixel | All Pages |

OpenCode prepared a local review copy with only tag 210 paused. Codex reviewed
the artifact and independently compared the complete parsed documents.
Exactly one property was added: `containerVersion.tag[31].paused = true`.
Every other field, all other tags, triggers, variables, templates, metadata
and collection ordering are preserved. The original download is unchanged.
This proves configured conversion definitions were preserved, not that a real
purchase or lead has been tested.

Candidate: `output/performance/gtm-review-2026-10-14/candidate/GTM-KDF33T7_v228-pageview-review.json`.
Candidate SHA256:
`c468187c0d2506a9142e8b9e8931272b54bf5c563b1f4ffa97c51a594dae961f`.
Independent verification: `candidate/independent-check.json` in that directory.
The delegation completed normally; it did not edit application source.
The reviewed application source hashes still match the previous verification.

## Independent browser simulation results

An isolated Puppeteer browser intercepted only the public container script.
The candidate simulation used the existing compiled paused-tag representation
for tag 210; it retained the rest of the published runtime. This tests the
runtime hypothesis but is not an actual GTM compilation or account Preview.
Both modes used normal production URLs and left frontend tracking code intact.
SPA link clicks were invoked programmatically; no forms, bookings or payment
actions were submitted and no synthetic conversion events were injected.

| Route/action on the supplied Vercel deployment | Normal page_view requests | Simulated pause-210 |
| --- | ---: | ---: |
| Initial home | 2 | 1 |
| SPA navigation to /trips | 1 | 1 |
| History back to home | 1 | 1 |
| Reload home | 2 | 1 |
| Direct blog/best-nile-cruise | 2 | 1 |

The same shared-container change was also simulated on
`https://sunpyramidstours.com/`: initial home and reload both emitted 2 requests
normally and 1 with the simulated pause. The first candidate attempt there
hit a connection timeout; the bounded retry succeeded. This is a delivery
failure in that attempt, not evidence of a tracking regression.

Raw sanitized evidence: `pageview-simulation.json` and
`pageview-simulation-main-site.json` in the output directory.
These results support a causal role for the explicit initial event tag 210
in the duplicate. Account-side Preview/DebugView and conversion validation
remain required before publishing. No performance score was measured for
this candidate; it must not be described as achieving mobile90.

The narrow next step is a separate GTM workspace based on published v228:
pause tag 210 there, review the workspace diff (only that pause), and run
Preview/DebugView before any publication. A full-file import must be compared
against current drafts to avoid overwriting newer workspace work.
The container affects both domains, so publication is a shared tracking change.
No draft was imported and no live container or application was changed here.
