# Phase 6.5 — Header Smart Voice correction

Completed on 2026-09-13. Phase 7 remains **paused** pending explicit approval. No commits were created.

1. **Root cause confirmed.** The Header still implemented the Phase 4 Basic Voice contract: write the final transcript into its `title` input and call `requestSubmit()`. The Phase 5 interpreter was available but was not connected to Header Voice. This caused spoken “5 days Cairo” to become a literal title search.

2. **Architecture chosen.** A final voice transcript triggers one on-demand internal POST. The server uses the existing deterministic parser, live taxonomy and capability mapper. Header receives a small DTO containing applicable existing filters and decisions. Safe results navigate immediately; other results open a compact dropdown. This avoids adding taxonomy work to every global Header render and keeps the parser and taxonomy out of the Header client bundle. Repository architecture and installed Next 16.3.3 Route Handler documentation were inspected before implementation; no existing internal resolver/server-action boundary served this purpose.

3. **Files changed.** Production changes are confined to:

   - `app/api/voice/resolve/route.ts` — new internal resolver.
   - `lib/header-voice-resolution.ts` — projection of locked capabilities into Header filters/decisions.
   - `components/voice/VoiceSearchButton.tsx` — on-demand request, structured navigation, scoped review and failure handling.
   - `components/Header.tsx` — locale keys and a stable mobile drawer-close callback.
   - `lib/voice-copy.ts` — five new UI strings in all seven supported locales.
   - `styles/_navigation.scss` — compact dropdown styles using existing theme tokens.

   New tests: `components/header-smart-voice.test.tsx`, `tests/voice-resolver.test.ts`, and offline fixture `tests/test-utils/header-voice-api.ts`. Existing lifecycle tests in `components/header-voice.test.tsx` and `components/voice/voice-search-button.test.tsx` now model the resolver's explicit title-fallback response and await asynchronous finalization. This report is the remaining new file.

4. **Internal boundary added.** `POST /api/voice/resolve` accepts only `{ transcript, locale }`. It returns either `{ mode: "title" }` or `{ mode: "structured", applicable, decisions }`. This is a Next boundary, with no new Laravel endpoint or public Trips query contract. Responses have `Cache-Control: no-store`; the production build lists the route as dynamic.

5. **Dynamic source and caching.** `getTripTaxonomy(locale)` remains unchanged. It retrieves three existing Laravel sources in parallel: `categories?page_limit=200&order_by=display_order,asc`, `categories/count`, and `destinations?page_limit=200&parent.slug=egypt&order_by=display_order,asc`. Existing API functions retain `force-cache`, 300-second revalidation, locale/auth headers and retry behavior. Root applicability still comes from the existing parent/count taxonomy rules. Labels and entity slugs come from live API records. An empty required taxonomy source produces an unavailable response rather than masquerading as successful title fallback. Because the existing aggregate does not expose per-source failure status, this is deliberately conservative for an empty destination source or empty root source when a root category is requested.

6. **“5 days Cairo”.** Voice resolves `days=5` and `destination=cairo`, then navigates to `/trips?destination=cairo&days=5`. “Cairo 5 days” produces the same filters. There is no `title` parameter, and the title form is not submitted. Query parameter order does not alter the existing Trips contract.

7. **“5 day Nile cruise to Aswan”.** Voice resolves `days=5`, `destination=aswan`, and `main=nile-cruises` after validating the destination/root category against the supplied taxonomy. “Nile cruise to Aswan for 5 days” produces the same filters. “3 day trip to Luxor” applies duration/destination without inferring a category. Recognized privacy/traveler information does not generate unsupported query keys.

8. **Title fallback.** Automatic native title submission is allowed only after successful interpretation finds neither applicable filters nor useful confirmation options, such as “Egypt adventure”. Infrastructure failures never automatically title-submit: they put the transcript in the initiating input and show a localized explanation permitting manual editing/submission.

9. **Confirmation.** Approximate duration, fuzzy destination, conflicting durations, multiple destinations, and cruise nights-to-days suggestions wait for explicit choices. Every remaining material field decision must be resolved before navigation. Multiple nights suggestions share one duration choice. An unresolved requested filter beside applicable filters requires an explicit “Ignore this filter” choice before a broader search. Dismiss/Escape do not submit. Informational fields, including a blocked child-category concept, do not invent filters. Ignoring all filters leaves review feedback rather than initiating an empty or automatic title search.

10. **Desktop/mobile.** Each initiating form owns its recognizer, request and confirmation state. Mobile structured success closes the drawer. Closing/unmounting, a new voice session, locale change, or manual input/submission invalidates pending work so stale results cannot navigate or overwrite typed input. Runtime checks at desktop and 390 × 844 mobile sizes confirmed the dropdown fits within the viewport. The browser used a fake native recognizer and resolver-response fixture; no real microphone was activated. React introspection confirmed separate desktop/mobile `VoiceSearchButton` instances and mobile review state. Mobile confirmation navigated with destination/duration and closed the drawer.

11. **Typed search preserved.** The native form action, GET behavior and input `name="title"` are unchanged. Manually typing “5 days Cairo” and submitting still sends `title=5 days Cairo`, with zero resolver/taxonomy work introduced by the voice integration. Passive invalidation listeners do not prevent or reinterpret native submissions.

12. **Privacy/security.** Supported locale, nonempty string transcript, maximum 1,000 UTF-16 code units, JSON media type, only the two allowed keys, and maximum 8,192 streamed body bytes are enforced before taxonomy work. Arrays, malformed JSON, nonstring values and excess properties are rejected. Cross-origin/cross-site browser requests are rejected. Structured responses contain no raw transcript, intent or upstream records; generic errors expose no internal details. Transcripts are transient component/request data, with no added logs, storage, analytics or cookies. Transcript-bearing feedback is masked for existing session-recording conventions and rendered as escaped React text. Upstream taxonomy requests contain no transcript. Successful structured URLs use only `days`, `destination`, `main`; permitted literal fallback and user-initiated manual title submission retain the existing title-search behavior.

13. **Tests.** Added **38** tests: 21 Header integration cases and 17 resolver cases. The primary regression runs the real Header, internal handler, parser, capability mapper, taxonomy data function and API function against an offline network fixture containing Cairo. Other coverage includes every required example, fuzzy/ambiguous/approximate/nights confirmation, multiple unresolved fields, explicit ignore, title fallback, service failure, typed GET behavior, mobile isolation/closure, French routing/speech language, stale resolution, dismissal, validation and privacy. Only native recognition/navigation, Next cookie access and network boundaries are mocked. Final `npx vitest run --maxWorkers=1`: **374 passed, 20 files** (336 existing + 38 new). No test was skipped.

14. **Checks.** `npx tsc --noEmit` and `npm run build` pass on the final implementation. `npm run lint` reports the single previously documented `react-hooks/set-state-in-effect` error at `components/Header.tsx:109`, in the unchanged navigation-dropdown effect. Targeted lint passes for all other changed TypeScript files. `git diff --check` passes. Next `get_compilation_issues` returns no issues and `get_errors` returns no configuration/session errors. A request to the running internal route with a nonstring transcript returns HTTP 400 and generic `invalid-input`.

15. **Request/performance impact.** Normal Header rendering/typed search triggers **zero additional resolver or taxonomy calls**, verified before voice interaction. Each completed voice session triggers **one application POST** and three existing cached taxonomy fetch operations; confirmation adds no request. These are three operations, not a guarantee of three outbound network requests when the Data Cache is warm. Existing retries may increase attempts on upstream failures. The real handler with the offline network fixture produced an **84-byte JSON response** for the reported regression and took **1.44 ms** in the focused local observation. This excludes network latency, cache misses, cold compilation and browser recognition; it is an implementation observation, not a Phase 7 benchmark or release gate. No cache tuning occurred.

16. **Protected files.** SHA-256 comparison against the clean starting tree confirms **39 protected files unchanged**, including all `lib/voice/**` files, data/API layers, Trips query/parser/rendering/sidebar, locale helper, proxy, SiteShell, Smart Find Trip panel and package manifests/lockfile. Header is the explicitly authorized integration change. No backend, booking, SEO, availability, price, or other production data source was changed.

17. **Phase 5 semantics.** Parser, aliases, lexicons, entity resolution and capability mapper remain byte-for-byte unchanged. The new projection translates their results into Header interaction state; it does not broaden interpretation rules. Smart Find Trip remains unchanged.

18. **Git status.** Work began clean on `feat/smart-voice-search`. The correction leaves six tracked files modified and six files untracked (the five implementation/test additions plus this report), with nothing staged. HEAD remains `099f5df54e87bd63ba7748f519d2ba442a3c0804`.

19. **Commits and Phase 7.** **Zero commits** created. Phase 7 has not resumed and requires explicit approval.

## Mandatory backend authority check

| Required question | Answer |
| --- | --- |
| Was this data dynamic before the change? | Yes: destination/root-category taxonomy is Laravel-controlled. |
| Authoritative source? | Laravel Dashboard → existing Laravel APIs. |
| Does Next still fetch it from Laravel? | Yes, through unchanged `getTripTaxonomy` and API functions. |
| Production records copied into source/JSON? | No. Entity fixtures exist only in test code. |
| Can dashboard/API changes reach Next without a deployment? | Yes, through existing request-driven cache refresh/revalidation. |
| Cache/revalidation behavior? | Existing API `force-cache` with 300-second revalidation; internal interpretation responses are not cached. Existing stale/error/retry behavior is preserved. |
| Could failure make production fallback data permanent? | No new fallback records exist. A missing required source returns unavailable. Existing cached data remains API-owned and subject to refresh; it is never copied into a permanent frontend source. |
