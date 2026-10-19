# Local CSS delivery experiment — October18,2026

Status: UI/source/build gates passed in the tested cases; speed improvement is
not established and the target remains unachieved. This is unpublished local code at `http://localhost:3004/`, build
`Mwsj15dRzVPcNOXgS3IOL`. The owner's published Vercel URL is a separate reference.
The preceding accepted local CDN build was `NIg5VPFuV6BIYbyu_Wcdd`.

## Implementation and ownership

OpenCode1.19.0 implemented the experiment with the owner's approved
`opencode/glm-5.3-flash-free`, default variant, `--pure`; reported cost was$0.
Session: `ses_eb18018fbffeAk2yXjspCuJGFB`. The parent reviewed and verified it.
Delegation artifacts are under
`output/performance/delegation/css-route-prototype-20261018{,-review}/`.

Five existing SCSS partials (discovery, editorial, planner, commerce, account)
load through one shared interior stylesheet imported by70 existing non-home
page files. Each page change is exactly one import; the remaining original
bytes are unchanged. The two home pages are byte-unchanged. No layouts, route
handlers, component markup, selectors, declarations, data calls or caches were
changed. Shared phone/country styles remain global: their existing planner-file
tail was split byte-for-byte into `_phone-country.scss` in the same import slot.

The first ordering experiment failed a real `/sustainability` browser check:
equal-specificity editorial rules changed a heading and moved231 rectangles.
It was rejected before building or serving. The correction repeats the existing
accessible-travel, sustainability and legal partials after the five moved
partials, in their original relative order; their global imports also remain.
This restores the observed overrides at the cost of113 duplicated rule instances.
There are no new selectors, higher specificity or changed values.

## Independent checks

- Scoped ESLint over all70 page imports: pass.
- Full tests:530 passed across48 files,146.55s; no timeout/config weakening.
- Next production build and TypeScript: pass; compile35.3s, typecheck22.3s.
- Parent SHA256/archive checks:72 original files match the preceding accepted
  build; exact page-import surgery, exact planner split and expected stylesheet
  imports pass; no unexpected changes among the other accepted source files.
- Sass declaration/rule multiset: original1803 rules plus exactly113 repeated
  existing override rules equals new1916 instances.

Evidence: `output/performance/css-route-2026-10-18/parent-{lint,tests,build}.txt`,
`parent-source-review.json` and the original `before/sha256-manifest.json`.

## Browser evidence and limits

The actual previous compiled stylesheet (`2sp_v1l0-g2gt.css`,255666 bytes) was
recovered from the original isolated browser context's HTTP cache. A reversible
same-DOM comparison applied it to the new build and compared every enumerated
computed style property and every element's rectangle. API/loading state was
therefore identical on both sides. This avoided falsely attributing asynchronously
loaded countries or disabled-to-ready form states to CSS.

All84 samples passed:21 paths at390/1350px and light/dark themes. They cover home,
French home, planner, auth, cart, checkout, trips, tour, category, blogs, article,
booking inquiry, contact, about, guide, events, rent, legal, sustainability,
accessible travel and guest profile. Synthetic offscreen account/planner/commerce
fixtures were also checked on interior routes. Only these intentionally
unrendered fixtures are excluded on the two home pages; actual home elements
are all included. No form, booking, payment or account mutation was submitted.

Additional comparisons passed for an open country-code portal, a calendar opened
with the keyboard, the home menu, and a home→planner→home client navigation.
The round-trip retained a window marker and the interior CSS, confirming that
it did not substitute full document reloads for client navigation.

These are sampled DOM/style/geometry checks, not a guarantee about every possible
future API record or authenticated state. Animation was paused only inside
isolated style comparisons and resumed immediately afterwards. Normal Lighthouse
runs retain all animations and immediate Google, Clarity and TikTok scripts.

Evidence: `browser-built-style-review.json` (84 samples,0 failures),
`browser-restore-built/`, `browser-interactive/` under the same ignored directory.
Two early calendar click attempts did not verify an open dialog and are excluded
from the open-calendar claim; the keyboard case explicitly verified the dialog.
Earlier expanded-Sass and separately minified control probes are diagnostic
only: their minifier/serialization differences are not candidate regressions or
acceptance evidence. The actual prior compiled file is the control used above.

## Asset cost

The unchanged common stylesheet is133353 bytes. The old batch was255666 bytes;
the new root batch is148695 bytes, and the shared interior chunk is123618 bytes.
The cold home omits the interior chunk. With the same local gzip compressor,
the old batch is37958 bytes, new root24242 and interior16741. Thus home saves
13716 compressed bytes for this batch; a cold interior instead adds roughly
3025 compressed bytes and one CSS request. This is a deliberate tradeoff, not a
claim that all routes download less CSS. Existing browser-cache reuse applies
on later interior visits. These numbers exclude headers and unchanged assets.

The actual browser also verified the cold home did not request the interior CSS.
Evidence: `home-assets.json`, `built-css-size-review.json`.

## Speed measurement

Normal local Lighthouse13.3/HeadlessChrome151, all scripts/animations enabled:

| Run | Performance | FCP ms | LCP ms | TBT ms | SI ms | Pre-run CPU % |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Mobile1 |54 |1373.5 |4185.0 |2222.5 |5126.3 |73/28/48 |
| Mobile2 |56 |1631.9 |4492.1 |1548.8 |3365.8 |71/93/68 |
| Mobile3 |49 |1384.6 |5891.4 |1896.0 |3650.2 |38/45/29 |
| Desktop1 |55 |414.0 |2333.3 |971.4 |2316.6 |54/34/25 |

Mobile median54, minimum49; accessibility94, best practices77, SEO100.
Desktop accessibility97, best practices77, SEO100. All Lighthouse warnings were
empty; mobile CLS0.00002427/0.00002427/0.00004504, desktop0.00000687. Available
RAM was about4.0–4.3GiB. Desktop55 is one sample. All results are retained.

The prior CDN-only mobile runs scored63/61/64 and desktop91 with substantially
lower recorded host load. Current scores are worse. These non-matched host
conditions prevent attributing the difference solely to the CSS change, but
they also prevent claiming a speed improvement. No successful repeat was
selected to replace the poor results. No further unchanged measurements are
scheduled on this evidence. The mobile70–80 goal remains **unachieved**; this
experiment has verified byte savings, not Lighthouse speed acceptance.

Network evidence in the sampled old/new mobile and desktop reports lists the
same12 first-party scripts,270804 transfer bytes and850900 decoded bytes; the
interior CSS is absent from the cold-home Lighthouse network results as well
as the brief browser check. This verifies the intended delivery boundary and
does not by itself explain the higher measured blocking time.

Reports: `output/performance/css-after-shell151-2026-10-18-{mobile-r1,mobile-r2,
mobile-r3,desktop-r1}/`. `candidate-validation.json` records all runs, their host
data and the407-file watched-source fingerprint
`dc96fcef1a1624615a80b3318030cc51f1a232c6696b3df6a2f248840d8fed17`.

## Dynamic source guard

1. Existing business/page/SEO records were dynamic before this experiment.
2. Their authoritative source remains Laravel/dashboard and its existing APIs.
3. Existing fetching code, calls and contracts remain byte-unchanged.
4. No frontend-owned production dataset or permanent API snapshot was introduced.
5. Dashboard/API changes still reach Next without a frontend deployment through
   the same existing rendering/revalidation path.
6. Cache intervals, expiry, stale and failure behavior are unchanged.
7. No new fallback data or permanent stale source was added.

The changed CSS is frontend-owned presentation. No deployment, push, commit,
GTM edit or account/hosting configuration change was performed.
