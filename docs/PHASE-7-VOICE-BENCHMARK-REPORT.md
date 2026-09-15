# Phase 7 — deterministic baseline and independent native ASR QA

Production Voice code is frozen. Measurement and recommendations only; no
parser, aliases, taxonomy, fuzzy thresholds, capture settings, Voice UI,
release configuration, LLM, external STT, analytics, commits, or deployment changes.

Phase 6.6 is accepted as two independent gates: **COMMAND CAPTURE
INFRASTRUCTURE = PASS** and **NATIVE ASR SEMANTIC ACCURACY — TEST 3 = FAIL**.
The owner authorized Phase 7 despite the native Test 3 failure. The combined
capture FAIL and previous Phase 7 pause are superseded; original observations
remain in the Phase 6.6 report.

## Frozen baseline and reproducibility

Frozen at `2026-09-13T15:08:49.469Z`, HEAD
`7ce16081e8c9a5df9375b2df3c2734b32d3884f4`. Individual production and input
SHA-256 hashes are in [freeze.v1.json](../qa/voice/freeze.v1.json).
Corpus SHA-256:
`79b401910c3a72d695b4c0ee94e295811cd7c1928e5bf34b8d824beb6c085e5e`.

182 author-labelled known transcripts: 26 per locale, comprising 11 regression,
11 challenge, and four taxonomy-degradation cases. The seven locales are en,
fr, de, it, pt, es, zh. Corpus labels preceded all execution. Additional challenge
examples are not an independent linguist's held-out corpus; regression overlap
with existing tests is disclosed. Taxonomy fixture records and IDs are synthetic,
QA-only, and never imported by production.

The historical approved Phase 7 plan was not found in available repository
files or task attachments. [README.md](../qa/voice/README.md) records the current
owner requirements and exploratory thresholds explicitly, without claiming
the numeric thresholds were previously approved. This is a measured baseline,
not release certification or proof of all natural-language coverage.

Commands:

```text
node qa/voice/freeze.mjs                 # performed once, before baseline
npx vitest run --config qa/voice/vitest.config.ts
npx vitest run --config qa/voice/integration.config.ts
npx vitest run --config qa/voice/asr.config.ts
node qa/voice/summarize.mjs
npx vitest run --maxWorkers=1
```

The benchmark verifies frozen source/input hashes, runs the actual parser,
entity resolver through the capability mapper, and Header projection. No
internal interpretation function is mocked. Warm timing repeats each transcript
100 times; 18,200 CPU pipeline runs exclude ASR, HTTP, imports, Laravel/cache,
and UI. The separate integration run executes the actual internal POST handler
and existing data layer with only HTTP responses replaced by synthetic fixtures.
Neither harness makes outbound requests. Performance is a local observation,
not microphone responsiveness or production throughput.

## A — text / parser results

Raw frozen results are retained in [baseline.v1.results.json](../qa/voice/baseline.v1.results.json).
Nine raw failures comprise four destination-recall findings and five incorrect
expected-filter annotations. Each of the five category phrases explicitly says
one day; their oracle incorrectly omitted `days=1`. Actual `days=1` is supported,
not false confident application. No label was silently repaired and the baseline
was not rerun with adjusted labels.

[Adjudication](../qa/voice/baseline.v1.adjudication.json) and
[separate summary](../qa/voice/baseline.v1.summary.json) expose both denominators:
raw **173/182**, valid-label **173/177**. Raw false-application flags occur in the
five invalid-oracle cases; **zero wrong/extra applicable filters in 177 valid-label
cases**. This is corpus-specific evidence, not a real-ASR accuracy figure.

| Locale | Raw exact case pass | Valid-label case pass | Valid challenge | Valid safety cases | Confirmed wrong/extra application | Parser assessment |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| en | 26/26 | 26/26 | 11/11 | 16/16 | 0/26 | FULL SMART quality candidate |
| fr | 23/26 | 23/25 | 10/10 | 15/16 | 0/25 | SUGGESTION ONLY; destination recall gap |
| de | 26/26 | 26/26 | 11/11 | 16/16 | 0/26 | FULL SMART quality candidate |
| it | 25/26 | 25/25 | 10/10 | 16/16 | 0/25 | FULL SMART quality candidate; one oracle excluded |
| pt | 24/26 | 24/25 | 10/10 | 16/16 | 0/25 | SUGGESTION ONLY pending direction coverage |
| es | 24/26 | 24/25 | 10/10 | 16/16 | 0/25 | SUGGESTION ONLY pending direction coverage |
| zh | 25/26 | 25/25 | 10/10 | 16/16 | 0/25 | FULL SMART quality candidate; one oracle excluded |

Case pass requires exact filters, requested field statuses, review choices, and
informational values, not just one recognized token. Safety includes approximate
duration, ambiguous places/durations, nights, mixed units, invalid values,
unsupported month/travelers/privacy, child categories, unknown places and
taxonomy degradation. The safety row for French fails its expected destination
recall, while duration remains correctly protected by confirmation.
The raw automatic recommendation in the JSON remains unchanged; the table is
an explicitly adjudicated, conservative human assessment. Portuguese/Spanish
valid-label scores exceed 95%, but their known direction misses still warrant
suggestion mode pending stronger coverage.

| Confirmed finding | Actual interpretation | Risk and surface behavior |
| --- | --- | --- |
| fr: `5 jours au Caire` | `days=5`; Cairo proposed with confirmation | Reduced destination recall, safe Header review |
| fr: `environ une semaine au Caire` | Cairo and 7 days both require confirmation | Approximation preserved; no silent 7-day navigation |
| pt: `de Luxor para Assuão por 5 dias` | Destination mention `Assuão por` unresolved; `days=5` | Destination span retains the preposition; Header unavailable-field review |
| es: `de Luxor a Asuán por 5 días` | Destination mention `Asuán por` unresolved; `days=5` | Same controlled fixture miss; no arbitrary destination |

These are deterministic fixture findings, not ASR failures. The fixture uses
English canonical destination titles for every locale; live localized titles
can affect normalized containment and may change these outcomes. Do not claim
the same production defect without checking a current localized taxonomy.
No live data was copied, fetched for automated measurement, or frozen as a
production source. The matrix does not certify locale-specific live taxonomy.

Warm maximum per-case p95 CPU time in milliseconds: en 0.5081, fr 0.3932,
de 0.4241, it 0.4686, pt 0.3533, es 0.2866, zh 0.1151. These are maxima of case
p95s, not a pooled locale p95 or comparative locale performance ranking.

## Separately measured integration behavior

[integration.v1.results.json](../qa/voice/integration.v1.results.json) records
all 182 actual handler responses, request payloads and fixture fetch operations.
168 return HTTP 200 and agree with pure Header projection; 14 return HTTP 503
when destination taxonomy is unavailable. All use `Cache-Control: no-store`.
The handler's taxonomy-availability boundary is therefore distinguished from
the pure mapper's partial capabilities. Do not label a partial pure projection
as a successful Header HTTP response during taxonomy outage.

**Header Smart Voice:** on-demand internal resolver; one POST per completed
command; exact applicable filters with no decisions navigate automatically;
material decisions require review; unsupported/uninterpretable title fallback
uses existing literal search. Manual typed Header search stays literal title
search and bypasses resolver. Capture is continuous, quiet 800 ms after a usable
native final, one bounded restart, 30-second maximum. Existing integration
regressions verify Stop/cancel/unmount/stale sessions, desktop/mobile isolation,
confirmation, and typed parity. Source hashes confirm no Phase 7 behavior change.

**Smart Find Trip:** same deterministic interpretation functions, loaded on
demand in the client against existing live props. It uses the existing default
recognizer, not Header's continuous command-capture option. Voice populates
reviewed form state; it never auto-submits. Destination/duration remain visible
and required; root category is a removable reviewed chip. Existing Search,
validation, manual edits, stale-category clearing and locale routing remain
authoritative. Its review boundary reduces consequences of ASR substitutions,
but does not improve ASR or guarantee the user notices a wrong value.

## B — real native ASR QA

Runtime actually detected in connected Chrome 152 on Windows x64 desktop:
both `SpeechRecognition` and `webkitSpeechRecognition` are functions; selected
constructor is `function SpeechRecognition() { [native code] }`, configured
locale `en-US`. The UA's `Windows NT 10.0` does not identify the physical Windows
version. Native QA uses the user's microphone, not a fake recognizer.

The focused matrix has nine terms, each alone, in a short phrase, and in a
multi-entity command: Cairo, Giza, Luxor, Aswan, Abu Simbel, Hurghada,
Sharm El Sheikh, Nile, Nile Cruise. The frozen prompts are in
[asr-matrix.v1.json](../qa/voice/asr-matrix.v1.json).
All 27 rows completed, with 45 attempts including retries. The owner's attached
`phase7-native-asr-20260913-v1.json` matches [asr.v1.native.json](../qa/voice/asr.v1.native.json)
byte-for-byte (SHA-256 `aaf2694175a735c2f7cf43036df1b5906d2348f816ca8464bc6a48714ef3d0a8`).
The complete native events, configured instance properties and exact transcripts
are retained, including six empty transcripts and all unsuccessful attempts.
No native error event was recorded. Results are not selected from successful retries.

The transient developer matrix panel runs native continuous recognition with
`en-US`, interim results, one alternative, a requested five-second wait before Stop,
and a 30-second watchdog. It does not navigate or call the resolver. This tests
native transcription context, not the production Header capture lifecycle or
Find Trip default endpointing. Native final indexed segments, errors and event
times were retained in memory and exported as the requested development QA note.
Some recorded Stop times are earlier than the requested wait; do not claim every
attempt followed a standardized five-second protocol. The frozen Luxor multi-entity
prompt repeats Luxor as origin/destination, and the Nile Cruise multi-entity prompt
contains a duplicated `cruise`. Both remain disclosed and unchanged. These limitations,
one speaker, retries and one browser prevent population accuracy or context-effect claims.

[asr.v1.replay.json](../qa/voice/asr.v1.replay.json) interprets every exact transcript
against the frozen synthetic taxonomy with zero network calls. This is offline
replay, **not** 45 observed Header POSTs or actual navigations. Literal target-term
survival occurs in 16/45 attempts; it counts occurrence anywhere, not full command
correctness (including origin/destination roles). No wrong/extra structured filter
was applied relative to the intended fixture interpretation. Eleven attempts would
permit navigation while omitting intended structured filters: three incomplete
structured searches and eight literal-title fallbacks. This separates false
confident structured application from confident incomplete/literal navigation risk.
Zero wrong destination applications in this small sample does not authorize auto mode.

| Term | Context | Spoken prompt | Exact native transcripts, in attempt order |
| --- | --- | --- | --- |
| Cairo | alone | Cairo | `[empty]`; `Cairo` |
| Cairo | short | trip to Cairo | `trip to Cairo` |
| Cairo | multi-entity | 5 day Nile cruise from Luxor to Cairo | `5-day night cruise from Luxor to Cairo`; `5-day night cruise to Cairo`; `to Cairo`; `5-day night cruise from Cairo`; `5 day Noel cruise from Luxor to Cairo` |
| Giza | alone | Giza | `Giza` |
| Giza | short | trip to Giza | `[empty]`; `trip to Giza` |
| Giza | multi-entity | 5 day Nile cruise from Luxor to Giza | `5-day night cruise from Luxor to Giza` |
| Luxor | alone | Luxor | `Luxor` |
| Luxor | short | trip to Luxor | `trip to Luxor` |
| Luxor | multi-entity | 5 day Nile cruise from Luxor to Luxor | `5-day Nile cruise from Luxor to loksburg`; `5-day night cruise from Luxor to Luxor` |
| Aswan | alone | Aswan | `[empty]`; `swan`; `Aswan` |
| Aswan | short | trip to Aswan | `trip to ashwan` |
| Aswan | multi-entity | 5 day Nile cruise from Luxor to Aswan | `five day inner cruise from Luxor to oswan` |
| Abu Simbel | alone | Abu Simbel | `Apple symbol`; `Apple symbol` |
| Abu Simbel | short | trip to Abu Simbel | `direct to Apple symbol`; `trip to Abu sample` |
| Abu Simbel | multi-entity | 5 day Nile cruise from Luxor to Abu Simbel | `5 day North cruise from rockstar to assemble` |
| Hurghada | alone | Hurghada | `[empty]`; `[empty]`; `regarda` |
| Hurghada | short | trip to Hurghada | `drive to Hurghada` |
| Hurghada | multi-entity | 5 day Nile cruise from Luxor to Hurghada | `5 day night cruise from Luxor to` |
| Sharm El Sheikh | alone | Sharm El Sheikh | `pharmacy`; `[empty]`; `charm shade` |
| Sharm El Sheikh | short | trip to Sharm El Sheikh | `drive to shorehamshire` |
| Sharm El Sheikh | multi-entity | 5 day Nile cruise from Luxor to Sharm El Sheikh | `5 day night cruise from Luxor to Sharma sheath` |
| Nile | alone | Nile | `Noel` |
| Nile | short | a Nile trip | `annoyal trip`; `an oil trip` |
| Nile | multi-entity | 5 day Nile cruise from Luxor to Aswan | `5-day night cruise from luxur to us one` |
| Nile Cruise | alone | Nile Cruise | `Nayak Cruise` |
| Nile Cruise | short | a Nile Cruise trip | `annoyal cruise trip` |
| Nile Cruise | multi-entity | 5 day Nile Cruise cruise from Luxor to Aswan | `5-day night cruise from Luxor to ashwan`; `5-day night cruise from Luxor to oswan`; `5-day night cruise cruise from Luxor to Aswan` |

ASR failure classification examples:

| Class | Observed transcript evidence | Assessment |
| --- | --- | --- |
| Place-name substitution | `Aswan` → `swan`; `Abu Simbel` → `Apple symbol`; `Sharm El Sheikh` → `pharmacy` | Native semantic corruption; unrelated word substitution/hallucination |
| Category/travel-term substitution | `Nile` → `Noel`; `Nile cruise` → `night cruise` / `North cruise` | Native error. Existing validated `cruise` category matching may still work; no night/Nile repair |
| Missing phrase segment | Full Cairo command → `to Cairo`; Hurghada command → `5 day night cruise from Luxor to` | Native incomplete final text; endpointing/cutoff cause not established |
| Number/duration omission | Full five-day Cairo command → `to Cairo` | Duration absent; recognized five/five-day forms otherwise remain supported |
| Endpointing/cutoff | Missing segments without independently controlled audio/timing evidence | NOT ESTABLISHED by this matrix; do not conflate with the corrected Phase 6.6 interim cutoff |
| Application interpretation | Exact-transcript replay; unknown/fuzzy names remain unresolved or require review | No wrong/extra application observed; lost ASR meaning cannot be inferred safely |

Actual Header native checks are separately recorded in
[header-native.v1.json](../qa/voice/header-native.v1.json), using the live internal
resolver and live taxonomy rather than the replay fixture.

**Test 5 — PASS:** spoken `around one week in Cairo`, native final
`around 1 week in Cairo`, locale `en-US`. One captured POST payload was
`{"transcript":"around 1 week in Cairo","locale":"en"}`; HTTP 200, no-store;
full response `{"mode":"structured","applicable":{"destination":"cairo"},"decisions":[{"field":"days","kind":"confirm","options":[{"value":"7"}]}]}`.
The page stayed at `/` with duration confirmation and Cairo applicable. After
explicitly choosing 7 Days, the actual URL was `/trips?destination=cairo&days=7`,
with Cairo Tours + 7 Days active and no title. Approximation and Cairo survived;
no automatic exact seven-day navigation occurred.

**Test 6 — FAIL, native ASR semantic preservation:** the intended phrase was
`Luxor Aswan cruise`. One attempt was requested, but four user-initiated native
starts and four corresponding POSTs were observed. Their exact final transcripts
were `look for a swan Cruise`, `Cruise`, `loksor oswan Cruise`, and
`locksor Swan crows`; neither exact place pair survived in any attempt. All four
responses were HTTP 200 with `Cache-Control: no-store`. Full payloads, responses,
native final/Stop/end times, document URLs and UI state are in the Header evidence.

The `Cruise` response was decision-free `main=nile-cruises` and caused actual
navigation to `/trips?main=nile-cruises`, leaving Nile Cruises active and no
destination or title. This is direct evidence of incomplete automatic Header
navigation after native entity loss. The other three responses required Aswan
confirmation when the altered transcript retained a fuzzy Aswan form. The final
observed UI heard `locksor Swan crows` and offered Aswan Tours / Ignore / Dismiss;
it did not choose a destination. The resolver, live taxonomy, and confirmation UI
handled the text they actually received safely. They could not reproduce the
expected two-place ambiguity because native finals lost Luxor and altered Aswan.
Interim hypotheses briefly contained `Luxor`, but Chrome replaced them before the
final; adopting interim text would be speculative and is not recommended.

Prior accepted native Test 3 is retained as ASR evidence: “Nile” became
Night/North/other text; “Aswan” became absent or `a spar`. The three completed
200 responses correctly applied the actual transcripts, including
`days=5&main=nile-cruises` with no Aswan. The incomplete search auto-navigated.
This proves a possible confident incomplete navigation; it does not establish
a population frequency or falsely blame parser/capture infrastructure.

Failure tags remain separate: endpointing/cutoff, place-name substitution,
category-term substitution, number/duration substitution, missing phrase
segment, unrelated hallucination, application interpretation failure.
Missing/substituted text does not prove cutoff without corroborating event
and speaker evidence. Speculative Nile/night or Aswan/a-spar repair is prohibited.

## Surface-specific release recommendations

No ASR percentage is combined with parser case accuracy. English native evidence
is already insufficient to authorize Header automatic structured navigation.
Other locales have no measured native matrix; that means insufficient evidence,
not 0% accuracy. Each receives an independent assessment below.

| Locale / native locale | Parser assessment | Real ASR assessment | Header recommendation | Find Trip recommendation |
| --- | --- | --- | --- | --- |
| en / en-US | FULL SMART quality candidate | Completed exploratory matrix: substitution and missing entities; insufficient for auto navigation | SMART CONFIRMATION | FULL SMART REVIEW recommended; review mitigates risk, default-recognizer ASR not independently certified |
| fr / fr-FR | SUGGESTION ONLY | NOT MEASURED | BASIC VOICE ONLY pending native QA | SUGGESTION ONLY |
| de / de-DE | FULL SMART quality candidate | NOT MEASURED | BASIC VOICE ONLY pending native QA | SUGGESTION ONLY until native evaluation; FULL SMART REVIEW candidate |
| it / it-IT | FULL SMART quality candidate | NOT MEASURED | BASIC VOICE ONLY pending native QA | SUGGESTION ONLY until native evaluation; FULL SMART REVIEW candidate |
| pt / pt-PT | SUGGESTION ONLY | NOT MEASURED | BASIC VOICE ONLY pending native QA | SUGGESTION ONLY |
| es / es-ES | SUGGESTION ONLY | NOT MEASURED | BASIC VOICE ONLY pending native QA | SUGGESTION ONLY |
| zh / zh-CN | FULL SMART quality candidate | NOT MEASURED | BASIC VOICE ONLY pending native QA | SUGGESTION ONLY until native evaluation; FULL SMART REVIEW candidate |

Header **FULL SMART AUTO is not supported by current native evidence**.
Recommend compact structured review and explicit Search for English Header,
without implementing that mode during measurement. Track wrong confident
destination/duration application separately from incomplete searches: both can
produce technically valid but unintended URLs. Confirmation can reduce this
navigation risk; it does not reconstruct lost meaning or improve ASR.

Find Trip's review-first flow and existing required fields remain the safer
surface for strong parser locales, because recognition does not submit. Basic
Voice is a fallback surface mode, not an ASR repair or proof of transcription
quality. No single global mode is recommended for both surfaces.

LLM position: **NOT REQUIRED / NOT JUSTIFIED**. Current corrupted ASR does not
justify guessing destinations or adding external STT. Further evidence should
precede any narrowly scoped proposal; no release-mode implementation is automatic.

## Validation, privacy and backend authority

- Original full regression suite: **401 tests, 21 files PASS**, exit 0.
- Frozen text benchmark: one measurement test PASS; separate offline actual
  handler measurement: one test PASS. These are outside the original suite.
- TypeScript: `npx tsc --noEmit` PASS.
- Lint: full run has only the known unchanged `components/Header.tsx:109`
  `react-hooks/set-state-in-effect` error. `npx eslint qa/voice` PASS.
- Phase 6.6 production build already PASS after the last production correction;
  Phase 7 changes only QA/docs, with no new production behavior.
- No analytics, LLM, external STT, audio recording, production logging, cookies,
  local/session storage of QA transcripts, production taxonomy snapshots, or
  new dependencies. Development artifacts contain only requested QA text/events.

Mandatory backend guard: data was dynamic and remains Laravel/API-owned;
production still uses existing API contracts; no production records copied to
source/JSON; Dashboard changes still propagate without deployment; existing
taxonomy revalidation is 300 seconds and resolver response remains no-store;
no failure becomes permanent fallback content. Production rendering, metadata,
SEO, route/query contracts, data fetching and cache configuration are unchanged.

Existing Phase 6.6 code/test work, older QA note and unrelated style changes are
preserved. Phase 7 additions are QA fixtures, measurement harness/results and
reports only. HEAD unchanged; **zero commits**. Final verification checked every
one of the 31 frozen production/input hashes with zero changes and confirmed zero
diff in protected parser, lexicon, resolver, taxonomy/data, query, API route,
Header projection and Find Trip files during Phase 7.

## Final Phase 7 gate

- Text / deterministic layer: baseline complete and reproducible; locale-specific
  parser recommendations above apply only to this 182-case synthetic-fixture corpus.
- English real ASR: evidence complete for this exploratory one-speaker session;
  semantic preservation is insufficient for Header automatic navigation.
- Header Smart Voice: **SMART CONFIRMATION recommended for en-US**. FULL SMART AUTO
  is not released by this evidence. Other native locales remain BASIC VOICE ONLY
  pending proficient-speaker QA.
- Smart Find Trip: **FULL SMART REVIEW recommended for English** because the flow
  exposes fields and requires Search; the matrix did not exercise its default
  recognition endpointing, so this is a surface-risk recommendation rather than
  ASR certification. Other locale recommendations remain as shown above.
- Phase 6.6 capture infrastructure remains PASS. Tests 3 and 6 remain native ASR
  semantic failures. Test 5 remains PASS.
- No release-mode implementation, parser repair, alias, LLM, external STT, commit,
  deployment, analytics, or production logging was added.
