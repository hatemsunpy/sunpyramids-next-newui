# Phase 7.5 — Header Voice Release Policy Report

Date: 2026-09-15  
Branch: `feat/header-smart-voice`  
Starting and current HEAD: `7ce16081e8c9a5df9375b2df3c2734b32d3884f4`

Phase 7.5 implements the approved Header-only release policy. It does not
change deterministic interpretation, taxonomy, the Trips query contract, or
Smart Find Trip. No commit or deployment was made.

## 1. Files changed

Phase 7.5 changed or added these files:

- `lib/voice-release-policy.ts`
- `components/voice/VoiceSearchButton.tsx`
- `components/header-smart-voice.test.tsx`
- `docs/PHASE-7.5-HEADER-VOICE-RELEASE-POLICY-REPORT.md`

The working tree also contains accepted Phase 6, 6.5, 6.6, 7, and 7.25 work,
plus unrelated pre-existing Header/navigation changes. Those are listed under
repository status and are not attributed to Phase 7.5.

## 2. Release-policy module and exact map

`lib/voice-release-policy.ts` uses the existing `Locale` type and an exhaustive
`satisfies Record<Locale, VoiceReleasePolicy>` check.

| Locale | Header | Find Trip |
| --- | --- | --- |
| `en` | `smart-auto` | `smart-review` |
| `fr` | `basic-auto` | `smart-review` |
| `de` | `basic-auto` | `smart-review` |
| `it` | `basic-auto` | `smart-review` |
| `pt` | `basic-auto` | `smart-review` |
| `es` | `basic-auto` | `smart-review` |
| `zh` | `basic-auto` | `smart-review` |

No runtime heuristic selects a release mode.

## 3. English Header Smart Auto behavior

For `en`, a finalized Header command is posted once to
`POST /api/voice/resolve`. A structured response with applicable filters and
zero material decisions navigates immediately through the existing localized
Trips URL builder. The Header does not render a final Search button.

## 4. Non-English Header Basic Auto behavior

For `fr`, `de`, `it`, `pt`, `es`, and `zh`, a finalized transcript is copied to
the existing Header `title` input and the existing localized form is submitted
immediately. These paths do not invoke the resolver and do not synthesize
`days`, `destination`, or `main` parameters.

## 5. Safe structured immediate navigation

English resolver output such as `{ destination: "cairo", days: "5" }` with no
decisions immediately navigates to `/trips?destination=cairo&days=5` (query
order is immaterial). The existing URL contract is reused.

## 6. Incomplete but valid structured navigation

If ASR and the resolver safely produce only `{ days: "5", main:
"nile-cruises" }`, the Header immediately navigates with exactly those two
filters. It neither invents nor waits for a missing destination.

## 7. Ambiguity decision behavior

When the resolver reports a material decision, navigation remains blocked and
the compact existing review UI is shown. Selecting the last option immediately
navigates with the applicable and confirmed filters. Automated cases cover an
ambiguous Luxor/Aswan destination and multi-decision flows.

## 8. Approximate-duration decision behavior

An approximate duration remains a decision. In the real-microphone repeat,
Chrome returned `around 1 week in Cairo`; the page stayed at `/`, displayed
Destination `cairo`, and offered `7 Days` and `Ignore this filter`. Selecting
`7 Days` immediately navigated to `/trips?destination=cairo&days=7`.

## 9. Ignore behavior

Ignore removes the relevant unresolved decision. When that is the last
decision and safe applicable filters remain, navigation happens immediately
with those remaining filters. There is no additional Search action.

## 10. Title fallback behavior

A successful resolver response in title mode retains the existing automatic
Header title-search fallback. `Egypt adventure` is copied to the title input
and submitted without confirmation.

## 11. Resolver-failure behavior

Network errors, non-success HTTP responses, unavailable routes, invalid empty
structured responses, and unexpected resolver failures do not auto-submit a
title search. The transcript remains editable and the existing `Smart search is
unavailable` feedback and retry action are shown.

## 12. Typed Header behavior

Typed Header submission is unchanged and bypasses voice resolution. Manually
typing `5 days Cairo` submits the literal `title=5 days Cairo` search.

## 13. Smart Find Trip unchanged

`VoiceFindTripPanel.tsx` and `HomeSearchShortcuts.tsx` were not changed in Phase
7.5. Find Trip keeps its review-first `smart-review` behavior for every locale.

## 14. Tests added or expanded

The Header integration suite now proves:

- an incomplete safe structured subset navigates once with exactly that subset;
- all six non-English locales use their localized title form, make zero
  resolver/upstream calls, and retain their configured recognition locale.

The previous single French behavior case became a six-locale matrix, and one
new incomplete-subset case was added: six net new test cases.

The existing English cases continue to cover exact and reverse word order,
full Nile/Aswan structure, decisions, Ignore, multiple decisions, title
fallback, resolver failure, typed input, mobile isolation, exactly-once
resolution, and command continuation.

## 15. Total regression test count

`npx vitest run --maxWorkers=1` passed: **21 files, 407 tests**.

The focused Header/voice run also passed: **3 files, 60 tests**.

## 16. Typecheck, lint, and build

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS; Next.js 16.3.3 compiled, typechecked, and generated 41 pages |
| `npm run lint` | Existing baseline only: `components/Header.tsx:207` `react-hooks/set-state-in-effect` |
| `git diff --check` | Existing baseline only: trailing blank line in `docs/PHASE-6.5-REAL-MIC-SMOKE-QA.md` |

The lint finding is in a pre-existing unrelated Header navigation diff. Phase
7.5 did not change `components/Header.tsx`. No new validation failure was found.

The relevant installed Next.js 16.3.3 linking/navigation and Route Handler
documentation was read before implementation.

## 17. Manual real-microphone results

Browser/device evidence uses the owner's regular desktop Chrome profile. The
accepted Phase 7.25 runtime record identifies Chrome 152.0.0.0, Windows UA with
`navigator.platform = Win32`, native `SpeechRecognition` and
`webkitSpeechRecognition` constructors, and configured English locale
`en-US`. The UA does not establish the physical Windows release.

| Check | Spoken input | Browser result | Outcome |
| --- | --- | --- | --- |
| Exact structured | `5 days Cairo` | Immediate `/trips?destination=cairo&days=5`; active `Cairo Tours` and `5 Days`; no `title` | PASS |
| Approximate duration | `around one week in Cairo` | Actual visible transcript `around 1 week in Cairo`; review stayed at `/`; Destination `cairo`; `7 Days` decision | PASS |
| Last decision | Selected `7 Days` | Immediate `/trips?destination=cairo&days=7`; active `Cairo Tours` and `7 Days`; no second Search button | PASS |

The exact transcript is not retained by the UI after immediate navigation and
was not persisted or logged for this smoke check. The exact resulting filters
were directly verified in the browser. An additional imperfect-transcript
microphone attempt was optional and was not repeated; the exact safe-subset
behavior is covered deterministically in the automated Header test.

## 18. Resolver calls by locale

| Locale group | Header resolver behavior |
| --- | --- |
| `en` | Exactly one `POST /api/voice/resolve` per completed mic session |
| `fr`, `de`, `it`, `pt`, `es`, `zh` | Zero resolver calls; existing localized title form submission |

Find Trip retains its existing shared interpretation path and was not changed.

## 19. Runtime dependency impact

Zero runtime dependencies were added or changed. `package.json` and
`package-lock.json` have no Phase 7.5 diff.

## 20. Network/API impact

English Header voice retains one internal resolver POST. That route retains the
existing live taxonomy reads and cache policy. Non-English Header voice now
bypasses that resolver path, so it makes no structured-resolution or taxonomy
requests before submitting the existing localized title search. No API
contract changed.

## 21. Privacy verification

No audio recording, audio storage, transcript analytics, local/session storage,
or production logging was added. Voice status and review content remain masked
with `data-hj-suppress` and `data-clarity-mask="true"`. Non-English Basic Auto
uses the already-existing title query behavior. The manual check added no
application instrumentation or persistence.

## 22. Parser, aliases, taxonomy, and contract unchanged

Phase 7.5 has no diff in the parser, locale lexicons, entity matching, fuzzy
thresholds, number/duration/direction interpretation, capability mapper,
resolver contract, taxonomy data, resolver Route Handler, or Trips query
contract. Live Laravel/API taxonomy remains authoritative.

Dynamic-source guard answers:

1. Taxonomy was dynamic before and remains dynamic.
2. Laravel/API remains the authoritative source.
3. English structured resolution still fetches through the existing API data layer.
4. No production data was copied into source or JSON.
5. Dashboard/API changes can still reach Next without a code deployment.
6. Existing taxonomy requests retain `force-cache` with 300-second revalidation.
7. No permanent fallback source was added for API failures.

## 23. Phase 7 baseline unchanged

The benchmark corpus, taxonomy fixture, adjudication, expected results, and
benchmark tests were not edited. The full suite still passes all 407 tests.
The refreshed freeze manifest records the current permitted Header surface;
its frozen input hashes remain the Phase 7 values, including corpus
`79b40191...`, taxonomy fixture `247665f7...`, ASR matrix `d3e68d46...`, and
benchmark test `ca27a85f...`.

## 24. Phase 7.25 experiment remains production-isolated

Production code has no `SpeechRecognitionPhrase`, `recognition.phrases`,
contextual-biasing, boost, or N-best selection integration. Production keeps
`maxAlternatives = 1`. The only production search hits for the word `phrases`
are ordinary parser-local arrays, unrelated to the browser contextual API.

Accepted evidence hashes remain:

- baseline `1490F5FDEF2086CD...`
- baseline repeat `16F8207610EBAABB...`
- biased unsupported `2A3A09D52E6C06AA...`
- N-best critical `9AD6C23D567F2137...`
- N-best critical repeat `8A194BFC74F089A8...`

## 25. Git status

The repository remains intentionally dirty because accepted earlier phases and
unrelated Header/navigation work are uncommitted. Current tracked modifications
include `components/Header.tsx`, Header and voice tests/components, accepted
speech-capture files, `next-env.d.ts`, navigation/shell styles, and the Phase
6.5 QA note. Untracked accepted artifacts include the Phase 6.6, 7, and 7.25
reports, command recognizer files, and `qa/voice/`.

Phase 7.5 specifically adds the policy module and this report and edits the
Header voice component and Header smart-voice test.

## 26. Commits

Zero commits were created. HEAD remains
`7ce16081e8c9a5df9375b2df3c2734b32d3884f4`.

## 27. Remaining blockers before deployment

Phase 7.5 has no newly discovered functional blocker. Deployment remains
blocked on explicit owner approval, as requested. The repository-wide lint
command is not green because of the documented pre-existing Header navigation
finding; it must be fixed in its owning scope or explicitly accepted by the
release gate. No deployment was attempted, and Phase 8 was not started.
