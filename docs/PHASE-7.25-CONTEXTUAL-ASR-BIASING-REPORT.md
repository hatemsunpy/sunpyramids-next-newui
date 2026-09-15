# Phase 7.25 — Domain vocabulary / contextual ASR biasing experiment

Date: 2026-09-15

Scope: English (`en-US`) QA experiment only

Production integration: none

Phase 7.5: not started

## Decision

**CONTEXTUAL BIASING: UNSUPPORTED** in the tested runtime.

Chrome exposes `SpeechRecognitionPhrase` and an assignable
`recognition.phrases` property, but the real recognition session rejects the
configured 18-phrase vocabulary at `start()` with
`phrases-not-supported`. The error occurs before the audio lifecycle begins, so
there is no biased transcript and no defensible biased-versus-baseline accuracy
comparison.

**N-BEST: NOT USEFUL** in this sample.

`maxAlternatives = 3` works operationally. Across 24 repeated critical-command
attempts, 45 entity slots were wrong in the primary final transcript. A correct
term appeared only twice in a secondary alternative (2/45, 4.4%): `Nile Cruise`
once and `Luxor` once. It never recovered Aswan, Abu Simbel, or Sharm El Sheikh,
and it preserved zero complete commands. That is insufficient evidence for a
production alternative selector.

Phase 7.5 should remain unchanged and paused pending owner review. Phase 7.25
provides no evidence for parser aliases, production contextual biasing, or
N-best selection.

## Runtime and exact API evidence

The tested device was the owner's regular desktop Chrome profile. Runtime UA:
Chrome 152.0.0.0 on `Windows NT 10.0; Win64; x64`; `navigator.platform` was
`Win32`. The UA string does not establish the physical Windows release.

| Item | Observed runtime result |
| --- | --- |
| Recognition constructors | `window.SpeechRecognition` and `window.webkitSpeechRecognition` were both functions |
| Constructor selected | `SpeechRecognition`; native source string `function SpeechRecognition() { [native code] }` |
| Locale | `en-US` |
| Continuous recognition | Operational in un-biased Modes A and C; the phrase-enabled Mode B failed before recognition, so phrase biasing with continuous recognition is unsupported here |
| `SpeechRecognitionPhrase` | Present as a native function; constructor length `1` |
| Phrase object shape | Prototype exposed `phrase` and `boost` |
| `recognition.phrases` | Present; array assignment succeeded and read back |
| Multiple/replacement behavior | Multiple phrase objects were assigned; successive array replacement on the unused probe instance read back `Nile` and `Luxor`. Replacement across successful recognition sessions could not be tested because phrase-enabled start fails |
| Boost range probe | `0`, `5`, and `10` constructed successfully; `-0.1` and `10.1` threw a range `SyntaxError` stating `[0, 10]` |
| Experimental boost | Moderate value `5` |
| Operational phrase result | Mode B start emitted `phrases-not-supported` twice at 10 ms and `end` at 11 ms; no audio event or transcript |
| `maxAlternatives` | Mode C accepted `3`; per-attempt maximum final alternative count was 1 in 3 attempts, 2 in 4, and 3 in 17 |

This distinguishes API exposure from usable capability. Property presence and
successful assignment did not prove operational contextual biasing.

## Harness, modes, vocabulary, and prompts

The standalone harness lives in
`qa/voice/contextual-biasing/`. Production components do not import it. It makes
no resolver, taxonomy, analytics, LLM, or third-party STT calls and stores no
audio. Transcripts and native events remain in page memory until the operator
downloads the local JSON evidence.

Modes tested or assessed:

| Mode | Configuration | Result |
| --- | --- | --- |
| A | No phrases; `maxAlternatives = 1` | Operational; two complete 27-prompt runs |
| B | 18 phrases at boost 5; `maxAlternatives = 1` | Unsupported at recognizer start |
| C | No phrases; `maxAlternatives = 3` | Operational; two complete 12-attempt critical-command runs |
| D | Phrases plus `maxAlternatives = 3` | Skipped because the same phrase gate already fails in Mode B |

The curated list was: Cairo, Giza, Luxor, Aswan, Abu Simbel, Hurghada, Sharm El
Sheikh, Nile, Nile Cruise, Grand Egyptian Museum, Valley of the Kings, Karnak
Temple, Saqqara, Alexandria, Red Sea, Day Tour, Nile Cruises, and Multi Day
Tours. This is a QA list, not copied production taxonomy.

The 27-prompt matrix contains each of Aswan, Abu Simbel, Sharm El Sheikh, Nile,
Hurghada, Luxor, and Cairo alone, in a short phrase, and in a command. Six
negative controls are `five days in Egypt`, `a cruise for five days`, `trip from
the hotel`, `city tour tomorrow`, `museum visit`, and `desert tour`. The exact
matrix and expected fields are in `protocol.v1.json`.

## Sample accounting and scoring

There were 79 recognizer start attempts retained in the authoritative complete
artifacts:

- 54 Mode A attempts: two complete 27-prompt baseline runs.
- 1 Mode B start: rejected before audio with `phrases-not-supported`.
- 24 Mode C attempts: four critical commands, three repeats, in two complete
  runs.

Thus 78 attempts reached the audio lifecycle. An earlier three-attempt Mode C
download was an incomplete subset of the first complete run and is not counted
again.

Exact entity survival uses case-folded, punctuation-folded whole-term presence
in the primary final transcript. Full-command preservation requires every
declared important field, accepting `5 day`, `5 days`, or `five day` for the
five-day field. Existing fuzzy suggestions are not counted as entity survival:
they require review and do not show that ASR preserved the entity. This keeps
ASR measurement separate from parser accuracy.

No audio was retained, so missing entities can be measured exactly, while a
separate numeric split between substitution and truncation cannot always be
reconstructed. The raw transcript tables expose that ambiguity rather than
assigning invented labels.

## Baseline results

| Metric | Mode A combined result |
| --- | --- |
| Attempts | 54 |
| Positive / negative attempts | 42 / 12 |
| Exact entity-slot survival | 10/60 (16.7%) |
| Attempts with every expected entity | 5/42 (11.9%) |
| Missing exact entity slots | 50/60 (83.3%) |
| Full-command preservation | 0/14 (0%) |
| Empty final | 19/54 (35.2%) |
| Exact domain insertion in negative controls | 0/12 (0%) |

The two independent baseline runs produced exact entity-slot survival of 4/30
(13.3%) and 6/30 (20.0%), and empty-final rates of 8/27 (29.6%) and 11/27
(40.7%). This spread reinforces that the sample is exploratory, not a population
accuracy estimate.

Baseline entity-slot breakdown:

| Entity | Exact survival |
| --- | ---: |
| Aswan | 0/12 |
| Abu Simbel | 0/6 |
| Sharm El Sheikh | 0/6 |
| Nile | 0/2 |
| Nile Cruise | 0/8 |
| Hurghada | 0/6 |
| Luxor | 3/10 |
| Cairo | 7/10 |

The negative-control result is only a baseline observation. Since Mode B never
reached audio, false insertion under biasing is unmeasurable; zero baseline
insertions must not be presented as proof that biasing is safe.

## Contextual-biasing comparison

Biased entity survival, command preservation, omission, substitution,
false-insertion, and empty-final rates are **not measurable**. Mode B produced
no transcript. A stronger boost was not attempted because the moderate
configuration was operationally unsupported, and the instructions permit a
second level only after useful moderate results.

Aswan, Abu Simbel, Sharm El Sheikh, and Nile/Nile Cruise therefore cannot be
said to improve under contextual biasing. The result for each is “unsupported,”
not “no acoustic improvement.”

Vocabulary-size effects are also unmeasurable. The small 18-item list failed at
start, so a larger live-taxonomy subset was neither justified nor attempted. No
browser phrase-count limit was encountered; only the operational support error
was observed.

## Critical primary transcripts

`[empty]` means no usable primary final transcript.

### Mode A — two complete matrix runs

| Prompt | Primary finals in run order |
| --- | --- |
| `5 day Nile cruise to Aswan` | `5 day night cruise bus one`; `5-day cruise plus one` |
| `5 day trip from Aswan to Abu Simbel` | `5-day trip from us phone to`; `5-day trip from oswan to Abu` |
| `5 day trip from Cairo to Sharm El Sheikh` | `5 day trip from Cairo to sharmshir`; `5-day trip from Cairo to Sharma sheath` |
| `5 day Nile cruise from Luxor to Aswan` | `[empty]`; `[empty]` |

### Mode C — two three-repeat runs

| Prompt | Six primary finals in retained order |
| --- | --- |
| `5 day Nile cruise to Aswan` | `play The Night calls to us one`; `[empty]`; `[empty]`; `5-day Nile cruise to a swan`; `5-day cruise to a swan`; `5 Day Cruise to Swan` |
| `5 day trip from Aswan to Abu Simbel` | `5 day trip`; `[empty]`; `5 day trip from ozone to avosambers`; `5-day trip from bill`; `5-day trip from a storm to absentville`; `5-day trip from Swan to aussemble` |
| `5 day trip from Cairo to Sharm El Sheikh` | `five day trip from Cairo to share machine`; `five day trip from Cairo toshi`; `from Cairo to Shaw machines`; `5-day trip from Cairo to Sharma Sheik`; `5-day trip from Cairo to sharmischief`; `5 day trip from Cairo to Sharma shave` |
| `5 day Nile cruise from Luxor to Aswan` | `59 cruise from`; `find the night cruise from Luxor to ashwan`; `swan`; `5-day night cruise from Luxor to us one`; `5-day night cruise from rock surplus one`; `5 day night cruise from luxur correspond` |

These transcripts show clear substitutions (`night` for Nile, `Swan`/`us one`
for Aswan, and several unrelated Abu Simbel and Sharm forms) alongside empty or
truncated finals. Without audio, cases such as `5 day trip` cannot be reliably
partitioned between ASR omission and capture timing, so no standalone
substitution percentage is claimed.

## N-best results

Across the 24 Mode C attempts:

| Metric | Result |
| --- | ---: |
| Primary exact entity-slot survival | 9/54 (16.7%) |
| Primary missing exact entity slots | 45/54 (83.3%) |
| Attempts with every expected entity | 0/24 |
| Full-command preservation | 0/24 |
| Empty final | 3/24 (12.5%) |
| Failed primary entity slots recovered by a secondary alternative | 2/45 (4.4%) |

The two recovery examples were:

1. Primary `5 Day Cruise to Swan`; alternative 2 `5 day Nile cruise to Swan`
   recovered `Nile Cruise` but not Aswan.
2. Primary `5 day night cruise from luxur correspond`; alternative 2
   `5 day night cruise from Luxor correspond` recovered Luxor but not Nile
   Cruise or Aswan.

Negative controls were not repeated in Mode C because N-best does not apply a
domain vocabulary and the requested repeated sample targets the four critical
commands. No claim about N-best false insertion is made.

## Architecture boundary

A future live vocabulary could be built without copying production records:
reuse the existing Laravel/API taxonomy path, normalize and deduplicate a
bounded in-memory list of current destination and root-category names when the
user starts voice input, and let normal cache refresh carry Dashboard changes to
Next. Unsupported browsers must continue with ordinary native recognition.

That architecture is technically compatible with the backend source-of-truth
guard, but it is not proposed for implementation from this experiment because
the tested runtime rejects phrase biasing. Phrase count, loading latency, cache
behavior, and over-bias risk would require a runtime where the small vocabulary
first works. No production adapter, maximum phrase policy, or selector should be
added on the present evidence.

The two N-best recoveries do not justify a selector. If later evidence crosses a
pre-approved usefulness gate, any selector should compare only against current
live destination/category names, require one unambiguous exact domain match with
a documented margin, and defer when two live entities remain plausible. This is
an architectural constraint, not an implementation in Phase 7.25.

## Validation, privacy, and repository state

QA validation commands and final results are recorded after the evidence files
were finalized:

- `node qa/voice/contextual-biasing/harness.test.mjs` — PASS.
- `node qa/voice/contextual-biasing/analyze.mjs` — PASS; all evidence-shape
  assertions and derived totals passed.
- `node qa/voice/freeze.mjs` — PASS; no output and exit code 0.
- `npx vitest run --maxWorkers=1` — PASS: 21 files, 401 tests.
- `node --check` for `app.js` and `analyze.mjs` — PASS.

The Phase 7 freeze inputs and expectations were not edited. Production Voice,
Header, parser, lexicons/aliases, capability mapper, taxonomy APIs, trips query,
and release policy were not changed by Phase 7.25. Existing modified production
files from the previously accepted phases remain in the working tree; they are
not Phase 7.25 edits.

Phase 7.25 changed only the standalone QA harness, its local evidence/analysis,
its README, and this report. No audio, analytics, production transcript storage,
external STT, or LLM was used. The retained JSON contains text transcripts,
recognition configuration, alternatives/confidence, and native event timing
only.

Files added or changed for Phase 7.25:

- `qa/voice/contextual-biasing/index.html`
- `qa/voice/contextual-biasing/styles.css`
- `qa/voice/contextual-biasing/app.js`
- `qa/voice/contextual-biasing/protocol.v1.json`
- `qa/voice/contextual-biasing/harness.test.mjs`
- `qa/voice/contextual-biasing/analyze.mjs`
- `qa/voice/contextual-biasing/analysis.v1.json`
- `qa/voice/contextual-biasing/native-baseline.v1.json`
- `qa/voice/contextual-biasing/native-baseline-repeat.v1.json`
- `qa/voice/contextual-biasing/native-biased-unsupported.v1.json`
- `qa/voice/contextual-biasing/native-nbest-critical.v1.json`
- `qa/voice/contextual-biasing/native-nbest-critical-repeat.v1.json`
- `qa/voice/contextual-biasing/README.md`
- `docs/PHASE-7.25-CONTEXTUAL-ASR-BIASING-REPORT.md`

HEAD remains `7ce16081e8c9a5df9375b2df3c2734b32d3884f4` on
`feat/header-smart-voice`. Zero commits and zero deployments were made for this
experiment. The final `git status --short` is included in the delivery message
because it also contains earlier accepted and unrelated working-tree changes.
