# Lighthouse audit and implementation review — 2026-10-13

Latest validated source and measurements:
[Lighthouse results — 2026-10-14](lighthouse-results-2026-10-14.md).
That report supersedes this earlier stage's scores and gate counts.

Follow-up on 2026-10-14: [GTM inspection](gtm-review-2026-10-14.md) confirms
published Google-tag and explicit page-view rules and reproduces the duplicate
even with the frontend config command skipped in an isolated browser. The
owner's account is open in another browser that the available connection
cannot inspect. No tracking or account change has been applied.

**Acceptance: NOT MET.** The latest normal-mode home median is **57 mobile / 97 desktop**, with desktop samples **88, 97, 97**. Mobile samples are **54, 57, 57**. A median over 90 does not satisfy a minimum 90 requirement when individual measurements fall below it. No changes have been pushed or deployed in this pass.

Target deployment: https://sunpyramids-next-newui.vercel.app/.
Implementation base: ec928b74dc61ada97f2a859a30b383faa7f535dc; current reviewed source fingerprint: f0a4237251b8a5455e8bed73509f93be6802c521f7455f5f0824ac88798d32b3.
The obsolete sunpyramids-next.vercel.app results are excluded.

## Measurement method and limits

Lighthouse 13.3.0, Chromium 151.0.0.0, Node 24.13.1, Windows x64. Standard default simulated mobile throttling and official Lighthouse desktop configuration; desktop 1350×940, mobile Lighthouse default emulation. Audits ran sequentially on production builds with marketing tags enabled, fresh browser profiles, and all four Lighthouse categories. This is laboratory evidence; it is not field INP, CrUX, a physical-device test or a guarantee for all networks.

Deployed baseline covers 16 route templates ×2 profiles. A full local production matrix followed the delegated implementation. Final measurements cover 6 core templates and three home runs per profile after wishlist extraction and raw-image sharing. The other 10 templates have not been remeasured against the final source. Root and French root are distinct samples. The local build uses live APIs; local and Vercel hosting, upstream caches, tags and backend content can differ. Differences between those environments cannot be attributed entirely to code. The recorded local checkout SHA does not prove the remote deployment SHA.

HTTP 200 and nonempty body checks passed for these reports. Anonymous cart/checkout and sign-in samples do not establish performance of populated carts, authenticated accounts, payment providers, availability or conversion completion. No purchase or paid external action was performed.

## Performance matrix

Values are mobile / desktop. The middle column represents an earlier local build, not the final code. A dash means no final-stage remeasurement; it is not a pass. Home intermediate values are the first of three runs; final values are medians.

| Template | Correct deployed baseline | Earlier full local matrix | Final local build |
| --- | ---: | ---: | ---: |
| home | 37 / 74 | 46 / 78 | 57 / 97 (medians) |
| trips | 55 / 98 | 54 / 97 | 61 / 97 |
| category | 55 / 77 | 54 / 81 | 56 / 93 |
| tour | 54 / 92 | 60 / 98 | 66 / 97 |
| blogs | 54 / 94 | 61 / 96 | — / — |
| blog | 48 / 78 | 59 / 77 | 68 / 99 |
| events | 55 / 96 | 71 / 96 | — / — |
| guide | 48 / 94 | 64 / 96 | — / — |
| about | 69 / 79 | 67 / 96 | — / — |
| contact | 72 / 98 | 62 / 99 | — / — |
| planner | 71 / 97 | 64 / 99 | — / — |
| rent | 65 / 96 | 64 / 98 | — / — |
| cart | 44 / 97 | 46 / 88 | — / — |
| checkout | 71 / 95 | 66 / 99 | — / — |
| auth | 73 / 92 | 70 / 99 | — / — |
| french | 43 / 66 | 48 / 81 | 57 / 84 |

Home deployed samples: mobile 37,48,51; desktop 74,85,87. The initial37 mobile result had TBT11.34s and is retained as an outlier. The48 mobile repeat warned that origin-data clearing timed out; it is retained with the warning. Combined home medians are48/85, while the two warning-free mobile samples span 37–51. Those baseline repeats do not establish stable production performance.

Final home mobile LCP:4.30,5.03,4.96s; TBT:1369,1098,1208 ms. Final home desktop LCP:2.04,1.17,1.08s; TBT:116,75,110 ms. All 16 final reports have no Lighthouse run warnings.

| Final mobile template | Performance | LCP | TBT | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| home (median) | 57 | 4.96s | 1208 ms | 94 | 77 | 100 |
| trips | 61 | 4.28 s | 1266 ms | 100 | 77 | 100 |
| category | 56 | 5.20 s | 1214 ms | 94 | 77 | 100 |
| tour | 66 | 3.93 s | 960 ms | 100 | 77 | 100 |
| blog | 68 | 3.79 s | 833 ms | 97 | 73 | 100 |
| french | 57 | 4.84 s | 1398 ms | 94 | 77 | 100 |

## Reviewed fixes

1. **Responsive delivery actually enabled.** Installed Next 16.3.3 overrides individual image optimization when global unoptimized is true. Removed that conflicting setting and selected the existing approved custom loader. Remote raster images now emit responsive source sets through /media/image; local assets, SVG and GIF retain their source handling. No image is sent to the Vercel billed /_next/image service. Sharp was already a baseline dependency; no dependency was added.
2. **Bounded optional transforms.** Four slots cover download, buffer, metadata and resize together; eight distinct pending transforms maximum. Identical requests share work. Raster transforms preserve orientation and geometry, use WebP85, and inherit source expiry. Animated multi-page files, invalid payloads, upstream failure and overload retain the same original live image via an uncached redirect. Invalid URL/width requests return 400. Output memory is bounded to 32 MiB/128 entries; source bodies are limited to 12 MiB and decoding to 40 million pixels.
3. **Reuse fresh remote bytes.** Blur previews and variants share fresh bytes per server process, with a separate 32 MiB/128-entry source cache and 16 pending fetches. Existing preview force-cache/revalidate 300 and transform no-store request modes are retained. A cached preview response must have a plausible origin Date within the300-second horizon before its raw bytes can be reused. Different widths inherit that original expiry; they do not restart it. Expired cached preview responses do not satisfy fresh transform requests. This is an in-process optimization, not proof of shared serverless-instance or CDN caching.
4. **Reduce shipped commerce code and serialized data.** Moved the existing wishlist function unchanged into a small helper and retained a compatibility export. Cards pass only id/title/wishlisted_exists to their wishlist island; full API results remain available for server rendering. Measured trips HTML/RSC shrank992780→336740 bytes and home505323→347617 at that stage. The trips initial script graph stopped including unrelated payment/auth/date-picker code. These byte observations are more direct evidence than cross-host score deltas.
5. **Reduce avoidable client work.** Only active hero media is eager/high priority; hidden prepared media is lazy/low. Autoplay, transitions, manual controls and reduced motion are preserved. Card-stack prefetch margin reduced 1000→400 without changing rendered content. Pointer effects coalesce writes per animation frame and accept nested SVG targets. Image blur observer ignores unrelated style mutations.
6. **Repeatable audit evidence.** Audit runner appends reports and summary entries, refuses malformed summaries, validates profiles, reports failures with a nonzero exit, uses official desktop configuration and records provenance/warnings. Diagnostic query flags are never used for acceptance.

## Independent review and validation

OpenCode used opencode/muse-spark-1.3-contributor-free with xhigh. Codex provided the plan and bounded brief, reviewed the actual diff, and returned corrections for SVG hover, whole-request concurrency, expiry tests and summary error handling. OpenCode's resumed process stalled before its benchmark work and was stopped; relay completion was not claimed. Codex independently finished verification, wishlist extraction, raw-byte sharing and final measurements. Raw delegation events and the transition record are retained.

Final gates:45 test files /509 tests passed; ESLint passed; TypeScript noEmit passed; production build passed. A transient Vitest worker-start timeout on a targeted invocation was resolved by the normal full-suite rerun; tests were not skipped. New tests verify real Sharp pixels, dimensions, refresh, deduplication, complete download concurrency, overload, animation fallback, failure retry, host/width validation and source-expiry sharing. Existing wishlist assertions are unchanged; only the helper mock import moved.

Protected source hash comparison is clean for API/data/SEO/locale/query/currency/payment-support/routing types and proxy files. The next.config image-loader exception is explicitly reviewed; redirects/headers/routing are unchanged. The extracted wishlist function matches the baseline implementation. No package or lockfile change is present. Build pages retain dynamic rendering; no force-static or static export was introduced.

Eight screenshot pairs cover home/trips/tour/blog at1350×940 and 390×844, with reduced motion and loaded above-fold images. Layout, copy, typography and composition match in the inspected pairs; image compression and third-party badge timing produce small pixel differences. This does not certify pixel identity across all routes or guarantee identical third-party timing. Final browser checks with motion enabled confirmed eight hero dots, previous0→7, next7→0, SVG-target hover variables 50%/50%, and unchanged anonymous wishlist login feedback. CSS/design tokens were not changed in this diff.

## Remaining findings and concrete next work

**P1 — mobile blocking time and marketing tags.** Normal final home TBT is 1.10–1.37s. An earlier diagnostic run with no-third-party=1 measured 120 ms TBT and performance 79 mobile; diagnostic desktop measured 86 with 0 ms TBT. This supports a substantial third-party cost, but the diagnostic was an earlier source stage and still failed90: tags are not the sole cause. GTM/GA4, TikTok, Clarity, TrustIndex and some Hotjar activity appear in the recorded normal requests. No tag or conversion event was removed, deferred or route-scoped.

Two GA4 page_view requests for G-NKZ6W32C4J occurred 8 ms apart on one audited navigation in final-normal/home-mobile-r3.json. Duplicate requests in that sample are confirmed; the exact GTM configuration causing them has not been inspected. Next action: inspect container GTM-KDF33T7 in GTM Preview and GA4 DebugView, identify the redundant initialization, and validate load/navigation and conversion events before changing it. The existing third-party-performance-approval-report explicitly requires marketing/tag-owner approval for deferral, scope or removal. Plugin discovery returned no matching GTM connector; account inspection remains dependent on available authorized access. A request for that access is pending.

**P1 — cold image delivery.** A measured uncached hero transform took4.9s after byte-sharing work. A native upstream connection timeout also occurred during earlier server activity. Warm cache benefit does not establish acceptable cold behavior. Next action: inspect approved media hosting/CDN and deployment-region latency, then measure original download and transform separately. Source transport/CDN changes require confirmed ownership and cannot replace API image URLs with a permanent frontend copy. An optional exact header proposal is saved separately; it adds only 30s stale-while-revalidate for derived images, is not applied and cannot eliminate truly uncached latency or tag CPU.

**P2 — existing best-practices failures.** Scores73–77 include third-party cookies and DevTools cookie issues from Clarity/advertising tags. Blog console evidence includes existing /images/linearNeedHelp.png404, while a WebP asset exists. Restoring that decoration would change the currently rendered UI and is excluded from this strict UI-preserving pass. No external tracking or consent policy was silently changed to raise a score.

**P2 — existing accessibility/SEO limits.** Home accessibility 94 mobile includes insufficient contrast on original-price text (#a5a5a5 on white); changing that color would change the UI. Public core pages scored 100 SEO; blog-list SEO 92 and checkout 69 were observed in the full matrix. Private checkout noindex is intentional and should not be removed to chase a score. These Lighthouse checks do not replace an authenticated-flow accessibility or technical indexing audit.

## Dynamic backend source-of-truth verification

1. Was the data dynamic before? Yes: tours/prices/options/categories/destinations/content/SEO and their image URLs are API-controlled. Frontend UI labels remain intentionally static.
2. Authoritative source? Existing Laravel dashboard/API, with approved media URLs provided by that system.
3. Does Next still fetch through Laravel? Yes. Protected API/data modules and request contracts are unchanged. The wishlist helper calls the same endpoint with the same cookie check, locale and payload behavior.
4. Production data copied into source/JSON? No. Source caches contain derived or live image bytes keyed by URL, not frontend-owned business records. Test fixture images and audit reports are not production fallback data.
5. Can dashboard updates propagate without deployment? Yes, through existing fetch/revalidation paths. No build-only snapshot was introduced. Freshness within existing cache windows is not instant propagation.
6. Cache behavior? Business/SEO cache and private no-store semantics are unchanged. Existing blur preview 300-second behavior remains. Shared raw bytes expire within their verified 300-second horizon; transform response max-age/s-maxage decreases with source age and must-revalidate is retained. A different image width cannot extend the cached source horizon. The optional stale-window proposal is not applied.
7. Can API failure make a permanent fallback authoritative? No. Existing business API error semantics remain; failed image processing retries or redirects uncached to the same live source. No copied record/image URL substitutes for backend ownership.

Guard conclusions: API source/endpoints/payloads, pricing/cart/coupon/checkout/payment/callbacks, routing/locales, metadata/canonical/hreflang/JSON-LD, robots/sitemap, dashboard propagation and brand tokens preserved by source inspection. No new dependency or hardcoded production record. Protected business diffs:zero; intended image-only config exception documented. Commerce behavior was not exhaustively retested with real accounts or payments, so no such runtime certification is implied.

## Evidence and repeat command

- Baseline JSON/HTML: output/performance/deployed-newui-2026-10-13/; repeats: deployed-baseline-repeat/.
- Earlier full local matrix: output/performance/verified-after/.
- Final source core JSON/HTML and summary: output/performance/final-shared-bytes/.
- Diagnostic JSON/HTML: output/performance/diagnostic-after/ (excluded from acceptance).
- Review, fingerprints and visual/runtime evidence: output/performance/after/.
- Delegation briefs/events: output/performance/delegation/.
- Pending proposals: output/performance/proposals/remaining-work.md and image-stale-window.patch (not applied).

PowerShell, after starting a production build on the chosen port:

```powershell
$env:AUDIT_ORIGIN='http://localhost:3004'
$env:CHROME_PATH='C:/Users/HaTeM/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'
node scripts/performance-audit.mjs review-repeat home home home trips category tour blog french
```

Use the actual deployment URL after deploying to test production. No local score should be relabeled as a deployed score. The90 acceptance task remains open pending additional verified work and normal-mode deployment measurements.
