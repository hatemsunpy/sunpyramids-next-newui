# Phase 6 — Smart Voice Find Trip

Phase 6 implementation and integration verification are complete. Phase 5 interpretation remains unchanged. Phase 7 has not started. No commits were created.

1. **Files changed/created.** Changed `app/page.tsx`, `app/[locale]/page.tsx`, `components/HomePage.tsx`, `components/HomeSearchShortcuts.tsx`, `styles/_home.scss`, `lib/voice-copy.ts`, `components/home-search-shortcuts.test.tsx`, and `lib/voice-copy.test.ts`. Created `components/voice/VoiceFindTripPanel.tsx`, `components/voice/voice-find-trip-panel.test.tsx`, `tests/homepage-voice-taxonomy.test.tsx`, and this report. Prior working-tree changes were preserved.

2. **Form state.** HomeSearchShortcuts owns one destination, duration, and Voice category value. Only Find Trip's two selects became controlled. Review chips mirror these values; editing the selects updates the review. Switching away from Find Trip clears its values, preserving the previous uncontrolled form's tab-remount defaults.

3. **Server plumbing.** Both homepage routes call the existing `getTripTaxonomy(locale)` in their existing Promise.all. Only root `{ slug, title, name }` objects pass through HomePage to the Find Trip panel. Destination resolution uses the same existing `highlights` list as the select. The second homepage Make Trip form and the tour-page Make Trip CTA receive no Voice taxonomy.

4. **Fetch impact.** Offline tests execute the real homepage/data/API functions with fetch and cookies mocked at system boundaries. Each Page invocation makes **15 API calls**, compared with **12** existing calls: home page, three tour lists, homepage destinations, blogs, FAQs, four public settings, and events; taxonomy adds categories, category counts, and general destinations. generateMetadata separately still reads home SEO as before. SiteShell receives provided settings and does not repeat that settings fetch.

   Homepage destinations use `destinations/home?page_limit=200&parent.slug=egypt&order_by=display_order,asc`; taxonomy uses `destinations?page_limit=200&parent.slug=egypt&order_by=display_order,asc`. They conceptually overlap but are distinct URLs, so cannot deduplicate. Both API wrappers use AbortController signals, which the installed Next fetch guide identifies as opting out of render-pass request memoization. Persistent Data Cache remains separate: all these calls retain `force-cache` and `revalidate: 300`, with locale headers. Existing dev FETCH cache entries were observed for all three taxonomy URLs and both destination URLs, with revalidate 300. This is existing cached API data, not frontend records.

   Server functions execute per dynamic render; valid persistent entries can serve calls without new backend traffic, while expiry/misses use the existing refresh/retry behavior. Recent dev render spans were 5,754.29ms and 1,814.98ms for homepage RSC renders; these include other homepage work and are **not an isolated taxonomy latency delta**. No causal latency regression is claimed from those timings. Build succeeds and `/` and `/[locale]` remain dynamic. No data-layer or cache refactor was made.

5. **Recognition.** The panel reuses useSpeechRecognition, the native browser adapter, normalized errors, and the existing explicit locale-to-speech-language map. It has no routing or Laravel requests. Final transcript consumption is independent of recognition status, so a final result batched with onEnd is processed. Each session applies once; a later session with the same transcript can apply again.

6. **Loading.** After a final transcript, Promise.all dynamically imports the locked parser and capability mapper. Entity resolution is reused through the mapper. The seven lexicons stay together behind this boundary; Phase 5 files were not altered. Production manifest inspection confirms the parser/lexicon and mapper chunks are absent from the homepage's initial client chunk list. Measured generated files: parser/lexicons `34bawccuj12_i.js`, **34,032 bytes raw / 10,864 bytes local gzip**; mapper `2dw4-2m7-e8jc.js`, **10,395 / 3,105 bytes**. Combined deferred files: **44,427 / 13,969 bytes**. These are file measurements including chunk overhead, not a before/after bundle delta or measured network transfer. The compact panel and shared copy remain in initial/shared client code.

7. **Applicable population.** Confident live destination matches and valid 1–45-day durations populate the existing selects. Fields not confidently addressed remain unchanged. Destination/duration chips are informational mirrors; their selects are the editing controls.

8. **Category state.** Category has no permanent select or hidden input. A live root slug is stored in parent form/search state and displayed using its localized live taxonomy label. Its remove button clears the state. The existing submit handler adds `main` only for a currently valid applied category; removal omits it. Traditional search remains `/trips?days=5&destination=aswan`; reviewed cruise search adds `&main=nile-cruises`. Both use withLocale and FormData for the visible fields.

9. **Destination review.** Bare-place ambiguity renders live candidate buttons without prefilling. Fuzzy matches render confirmation buttons without prefilling. Selecting a candidate validates its slug against the supplied live options, updates the select and applied mirror, and sets aria-pressed from current form truth. Buttons remain mounted to preserve predictable focus and permit changing the choice.

10. **Duration review.** Approximate and cruise-context nights suggestions require a button click. Multiple conflicting day/week expressions show choices and do not prefill. Plain nights remain informational. `3 nights 4 days` applies only the explicitly spoken four days and preserves nights as secondary information. Confirmation buttons are bounded to existing select options; suggestions outside 1–45 remain unapplied. No silent nights-to-days conversion was introduced.

11. **Unsupported review.** Origin, localized calendar month, traveler counts, privacy, child concepts, unresolved categories/destinations, and tourism keywords appear as information or unapplied suggestions. The review explains that only current trip filters affect search. There are no title-search fallbacks, unsupported hidden fields/query parameters, automatic Make Trip calls, or alternate routes.

12. **New sessions.** Mic start clears old transcript/review suggestions and errors while keeping current visible selections. An already-applied category stays visibly removable while recognition runs; a new final interpretation clears it unless that interpretation applies another category. Recognition errors retain all valid selections and category, with retry. Unmount aborts recognition; asynchronous parsing is disposed, and old session results are ignored.

13. **Validation parity.** Initial values remain empty. Names remain `place` and `duration`; required remains on both; destination values retain slug-or-ID fallback; duration options remain 1–45. Native Search validation is preserved. There is no requestSubmit, programmatic submit, validation bypass, invented missing field, or auto-navigation from Smart Voice. Tests also verify FormData and English/French routing.

14. **Accessibility and appearance.** Real type=button controls, localized mic labels, aria-pressed, a polite status region, semantic labeled review sections, text/check marks independent of color, and visible focus rings are provided. Interim text is aria-hidden rather than repeatedly announced. Choice selection retains focus. Touch targets are at least 44px. The panel uses existing theme tokens and Trip Sans; it introduces no animation, so reduced motion needs no extra override. Browser inspection verified the full review at 390px in light/dark modes without horizontal overflow and at desktop width. Existing tabs were not redesigned. Next MCP returned no compilation or runtime/config errors.

15. **Localization.** Twenty-five Smart Voice keys are explicitly typed and supplied for en/fr/de/it/pt/es/zh through the existing voiceCopy architecture. Month labels use Intl.DateTimeFormat for the current locale. The French word Destination legitimately matches English; the localization assertion permits that word while checking the other translations.

16. **Tests by touched/new file.** `components/voice/voice-find-trip-panel.test.tsx`: **27**, all new; `components/home-search-shortcuts.test.tsx`: **6 total**, three added; `lib/voice-copy.test.ts`: **11 total**, seven added; `tests/homepage-voice-taxonomy.test.tsx`: **2**, both new. **39 tests added**, with **46** in these four files. Recognizer events and entity records are fixtures. Smart Voice tests deny fetch and verify no Storage writes; homepage tests mock fetch so no test contacts production Laravel.

17. **Regression suite.** **336 tests across 18 files pass.** Initial cold worker starts timed out before tests ran; later full and focused runs completed without worker errors. Existing Phase 3–5 parser, resolver, mapper, Header Voice, and trips contracts remain covered.

18. **Required checks.** `npx vitest run --maxWorkers=1 --reporter=verbose`: PASS. `npx tsc --noEmit`: PASS. `npm run lint`: only the known unrelated `components/Header.tsx:109` react-hooks/set-state-in-effect error; zero new errors/warnings. `npm run build`: PASS, including production TypeScript and static generation; homepage routes are dynamic. Runtime compilation/error checks: PASS. Final edits after build only strengthened test coverage; production code was unchanged.

19. **Dependencies/network.** No package or lockfile changes in Phase 6; zero runtime dependencies added. Server renders reuse three existing taxonomy endpoints. The Voice panel makes no Laravel/application API fetch. Parser code chunks are loaded locally after recognition. Native speech recognition retains its existing browser-managed network behavior; no new speech service was integrated.

20. **Privacy.** Transcript lives only in the hook/panel's transient React state. It is neither persisted, logged, serialized into a form/query, nor explicitly sent to analytics. Review DOM has data-hj-suppress and data-clarity-mask attributes for recording-tool masking. Tests verify no Storage writes and no fetch calls in Smart Voice interactions; browser inspection verified only place/duration in FormData and no hidden transcript fields. Existing site-wide third-party scripts remain unchanged; this phase does not audit their remote configurations.

21. **Scope exclusions.** No analytics instrumentation, LLM, third-party STT, benchmark/release gating, global Voice redesign, trips filter redesign, or unrelated homepage refactor. No Phase 5 interpretation contradiction was found.

22. **Protected impact.** Start/end SHA-256 comparisons verified **38 unchanged files**, including all lib/voice files, Header, TripsPage, TripsFilterSidebar, trips-query, data/API/client-API/locales/SEO, and package/lockfile. Those protected areas have **zero Phase 6 changes**; pre-existing working-tree diffs are still present. Metadata, canonical, hreflang, JSON-LD, `/en` rejection, 404/error contracts, currency, cart, checkout and payment were not changed.

23. **Git status.** Working tree remains uncommitted, with Phase 6 files plus previously present modified/untracked work. Existing modified files retained: Header, TripsFilterSidebar, TripsPage, trips-query, ui-copy, package/lockfile, and navigation SCSS. Existing untracked groups retained: .vscode, earlier Voice/trips tests and foundation/parser code, mandatory guard document, test utilities, and Vitest config. Phase 6 adds route/HomePage/home-SCSS modifications, the panel/tests, and this report; HomeSearchShortcuts and voice-copy/test changes sit on the existing prior-phase work. No unrelated cleanup or staging occurred.

24. **Commits.** **Zero commits.**

25. **Remaining decisions.** None required to finish Phase 6. Chosen session/category/focus behaviors are documented above. Phase 7 benchmark/release gating remains explicitly deferred until project-owner approval.

## Dynamic backend guard

| Mandatory question | Verification |
| --- | --- |
| Was the data already dynamic? | Yes: destinations and category taxonomy. |
| Authoritative source? | Laravel API/dashboard, through the existing data layer. |
| Does Next still fetch it? | Yes; existing functions and endpoints are reused server-side. |
| Production records copied to source/JSON? | No. Only deterministic test fixtures and UI copy were added. |
| Dashboard changes without code deployment? | Yes; existing API refresh/revalidation path is retained. |
| Cache/revalidation? | Existing force-cache, 300 seconds; no configuration changes. |
| Can failure install permanent fallback records? | No new fallback dataset or snapshot exists. Existing reliable-fetch/cache behavior remains; unavailable capability data cannot fabricate applicable entities. |

Backend ownership, routing/locale/validation parity, protected files, brand tokens, dependency guard, and privacy implementation checks pass. The known pre-existing Header lint error remains outside this phase.
