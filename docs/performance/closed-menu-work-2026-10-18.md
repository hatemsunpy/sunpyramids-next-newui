# Country-menu rendering — October18,2026

Local build: `fvys0JiSWVaqqTHkda3V-`, served at `http://localhost:3004/`.
No deployment, push, commit, GTM edit or hosting/account change was performed.
The mobile70–80 target remains **unachieved**: normal mobile runs are53/62/60,
and the current-build desktop sample is87.
This report distinguishes verified rendering-work savings from speed acceptance.

October19 follow-up: the owner-confirmed quiet-window series on this same build
scores61/61/59 mobile, median61. The target remains unachieved. Details and network
qualifications are in `docs/performance/quiet-window-2026-10-19.md`.

## Change and delegation

OpenCode1.19.0, approved `opencode/glm-5.3-flash-free`, default variant, `--pure`,
implemented the extraction. Session: `ses_eb0827d25ffegB25r0nGifENlo`, reported
cost$0, completed with exit0. The parent independently reviewed and ran gates.
Relay artifacts: `output/performance/delegation/closed-menu-work-20261018/`.
Its dirty-tree file list includes earlier work; this extraction changed only:

- `components/PhoneCountryInput.tsx`
- `components/SearchSelectDropdown.tsx`
- `components/phone-country-input.test.tsx`
- new `components/search-select-dropdown.test.tsx`

Each existing option-list subtree moved into one private React component in the
same file, below the unchanged Radix Portal. The Portal already does not render
its children while closed (`@radix-ui/react-menu/dist/index.mjs:113–126`). The
old inline `.map()` still ran in the parent to create unused React elements;
the new child function runs when the existing Portal actually renders content.

No new open flags, effects, state, providers, imports, fetching, delays, Suspense,
memoized data snapshots or dependencies were introduced. The native select still
contains every current option. Existing Portal mount/exit handling, animation,
search input, refs, callbacks, validation and native FormData behavior remain.
Live props flow directly into the extracted lists, including data changed before
first opening or while open.

## Evidence and independent gates

Parent AST comparison expands each new child call back to the original subtree,
rebinding only direct live props and normalizing JSX indentation. It confirms
the original list, parent JSX/hooks/handlers and all other original top-level
statements match. The exact before-archives match their SHA256 manifest; no
unexpected production-source changes or new source files were found. Next's
generated `next-env.d.ts` type references are documented separately, not treated
as a business-code edit.

- Scoped ESLint over the four changed files: pass.
- Full independent Vitest:534 tests in49 files passed,137.93s.
- 407 nongenerated watched source paths stayed unchanged during those gates.
- Next production build/typecheck: pass; compile105s, typecheck7.7s.
- Project dependency manifests unchanged.
- Tests use real Radix DOM and existing network/browser boundaries. New coverage
  checks options updated before opening and while open, selected FormData values,
  non-searchable select keyboard operation, and disabled-field behavior.
  The implementer's initial new disabled-field assertion was corrected to native
  FormData semantics; existing tests and production behavior were not weakened.

Evidence: `output/performance/closed-menu-work-2026-10-18/parent-source-verification.json`,
`parent-lint.txt`, `parent-tests.txt`, `parent-gate-source-stability.json`,
`parent-build.txt`, `before/manifest.json` and `candidate-validation.json`.

## Real-browser validation

The same diagnostic native Array.map counter identified the compiled list
callbacks on the real homepage with live country API data. It records work
counts, not a timing/score improvement. The countries were loaded in both samples.

| Initial closed-menu observation | Before | After |
| --- | ---: | ---: |
| Phone-menu option iterations |386 |0 |
| Nationality-menu option iterations |193 |0 |
| Native select options, including placeholder |194 |194 |
| Visible open menus |0 |0 |

Opening the new phone menu then produced193 iterations and193 visible records,
which also positively checks that the counter still recognizes the new callback.
Both menus matched all193 native country names in order. Phone-menu search showed
the existing empty state; Escape closed it and returned focus. Nationality
selection synchronized the trigger, native select and FormData and returned
focus. Mobile390px/light and desktop1350px/dark were sampled; both open menus
reached opacity1. No real form, payment, booking or account mutation was submitted.
These are sampled behavior checks plus source-parity evidence, not a claim about
every possible state or every animation frame.

The original Chrome DevTools session could not reopen its occupied browser
profile. Validation used an isolated named Playwright CLI session instead; it
was closed before the official audit. No user browser was stopped. Diagnostic
instrumentation exists only in that separate browser and ignored artifacts,
not in production source or official Lighthouse runs.

Evidence: before counter in
`output/performance/closed-menu-work-2026-10-18/baseline-runtime-work.json`;
after checks and snapshots in `output/playwright/closed-menu-20261018/`, including
`runtime-validation.json`. Shared consumers remain home/search, contact,
blog/category filters and the account/planner/commerce flows in CustomerFlows;
their public component interfaces and business handlers are unchanged.

## Speed result and remaining verification

Normal Lighthouse13.3/HeadlessChrome151, fresh profile, immediate tracking and
normal animations, three mobile samples and one desktop sample on the same build:

| Profile/run | Performance | FCP | LCP | TBT | SI | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile r1 |53 |1445.6ms |4667.9ms |2344.1ms |3656.7ms |0.00002427 |
| Mobile r2 |62 |1379.9ms |4359.7ms |1059.5ms |2929.1ms |0.00002427 |
| Mobile r3 |60 |1381.7ms |4205.2ms |1310.2ms |3456.4ms |0.00002427 |
| Desktop r1 |87 |396.6ms |1065.8ms |237.5ms |1700.3ms |0.000002853 |

Mobile accessibility94, desktop97; best practices77 and SEO100 in all four runs;
Lighthouse warnings empty. The first run's pre-run
CPU samples96/85/88%, available physical RAM1473460KiB (about1.4GiB), benchmark
index1651.5. These are worse scores than the earlier CDN-only samples, and do
not establish a speed improvement. Host conditions are not matched; attributing
the score difference solely to this extraction or solely to the host would be
unsupported. Subsequent mobile r2/r3 pre-run CPU samples were8/6/13% and11/7/9%,
with approximately2.6GiB available RAM. Desktop samples were36/25/7% and about2.3GiB
available RAM. The lower-load mobile results still fall below70, so host load
alone does not explain away the unmet target. There is no Google-hosted result
for this local code.

Mobile r2's hero discovery audit passes eager/high-priority/initial-document
checks; observed resource load delay is12.4ms. Extra image preloading is therefore
not supported by this evidence. Closed-list work reduction and stylesheet bytes
saved are not proof of a Lighthouse score improvement.

The audit produced JSON/HTML/raw evidence successfully. Initial browser cleanup
encountered a process-exit race and refused to stop an unverifiable PID. A fresh
check found the recorded PID absent and zero exact-profile processes; the
cleanup recheck exited0. That wrapper failure is retained separately from the
valid Lighthouse result. The ignored cleanup helper now rechecks a missing
command line and still refuses to stop any live process it cannot identify.

All evidence is retained in
`output/performance/closed-menu-after-shell151-2026-10-18-mobile-r1/`, with r2/r3
and desktop-r1 in their corresponding sibling directories. No further unchanged
score runs are justified by the current evidence. Investigation now targets
remaining startup work; an owner-provided Preview would allow separate hosted
verification. The rendering reduction is verified;70–80 acceptance is not.

## Further startup investigation

The current HTTP response and safely parsed Flight rows confirm header categories
and tour-card records were already projected upstream. Search destination records
contain only id/slug/title/featured_image; removing that unused image field would
save only116 standalone gzip bytes for the observed nine entries. This is not a
material score candidate. No API field, request or production source was changed.
Evidence: `home-flight-inspection.json` in the evidence directory.

A separate isolated Playwright/CDP CPU profile sampled startup at4x CPU throttle,
with caching disabled, normal tracking and an8s post-load observation window.
This is diagnostic evidence only, not a Lighthouse run or score comparison.
It attributed66.3ms of sampled self time to HeaderClient's initial scroll-state
callback. Checking the same callback in all four normal Lighthouse traces found
only0.525–1.016ms total, including0.159–0.613ms layout. The diagnostic hotspot is
not corroborated as a material normal-run cost, so no scheduling edit was made.
The profile also identifies third-party work, but its samples do not authorize
changing required tracking or the visible Trustindex widget. It does not prove
the target impossible under the owner's constraints.

The named diagnostic browser was closed. The profile summary and exact commands
are retained in `startup-cpu-profile-summary.json`, plus `profile-startup.js`
and `profile-startup-result.txt` under
`output/playwright/closed-menu-20261018/`.
Normal-run callback inspection is reproducible with
`output/performance/delegation/inspect-header-trace-20261018.mjs`.
This review made no production-code edits. A Preview of this exact local code
remains pending from the owner for hosted verification; an earlier public75
sample belongs to the deployed reference and cannot validate this build.

At16:04:30UTC a fresh HTTP comparison of the public reference and local3004
returned200 for both. The local page references15 initial Next JS/CSS assets;
the public page references16, and11 of the15 local asset byte hashes are absent
from the public response's initial asset set. Delivered assets are therefore
not identical. This does not identify the remote Git commit, but it rules out
treating that response as byte-identical verification of the current local
candidate. Evidence: `deployed-asset-comparison.json`. No deployment or further
unchanged Lighthouse run was performed for this check.

## Dynamic source guard

1. Country/business/page/SEO records were dynamic before this change.
2. Laravel/dashboard and its existing APIs remain authoritative.
3. Endpoint selection, requests, payloads and fetching code are unchanged.
4. No production dataset or permanent API snapshot was added to frontend source.
5. Dashboard/API updates still propagate through the same existing fetch/render
   path without a frontend deployment; updated-prop tests cover the lists.
6. Cache/revalidation intervals, expiry, stale and failure behavior are unchanged.
7. No new fallback records, permanent stale source or fake successful response
   was introduced. Google, Clarity and TikTok initialization remains unchanged.

The408-file post-build source fingerprint is
`c41c210276c821433abf2af32b3b0bad810463eff7acf0337d0bf20b92b779a8`.
