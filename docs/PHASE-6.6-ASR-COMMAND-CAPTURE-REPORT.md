# Phase 6.6 — Header ASR command capture

Phase 6.6 is **accepted** under the owner's revised two-gate classification:
**COMMAND CAPTURE INFRASTRUCTURE = PASS**;
**NATIVE ASR SEMANTIC ACCURACY — TEST 3 = FAIL**.
Phase 7 is now authorized for measurement only. The native observations below
are preserved as collected; no further capture tuning is authorized.
No commit or deployment is requested or performed.
This report distinguishes controlled capture tests from native microphone evidence.

1. **Pre-change lifecycle.** Native `continuous=false`, `interimResults=true`,
   `maxAlternatives=1`. The adapter concatenated the changed result batch from
   `resultIndex` and marked it final if any entry was final. The shared hook
   replaced `finalTranscript` on every final, cleared interim text, and set
   `processing`. Native `onend` cleared the recognizer and returned to idle.
   `VoiceSearchButton` posted as soon as a nonempty final appeared, independently
   of `onend`. There was no segment accumulator or complete-command boundary.
   Native `onend` could follow the first phrase segment immediately.

2. **Failing regression demonstrated before production edits.** Added
   `assembles an ended first segment and a short continuation before one resolver
   POST` in `components/header-smart-voice.test.tsx`. The pre-change focused run
   failed at the assertion that no early request existed. Its first actual mock
   network call was `POST /api/voice/resolve` with
   `{"transcript":"5 day Nile cruise","locale":"en"}`; three upstream taxonomy
   requests followed. The regression requires one application POST with
   `{"transcript":"5 day Nile cruise to Aswan","locale":"en"}` and canonical
   days/category/destination navigation. Upstream taxonomy calls are counted
   separately from resolver POSTs.

3. **Chosen strategy.** Continuous Header recognition plus an 800 ms quiet
   finalization window, with at most one continuation restart after an unexpected
   native end with useful final text. This is a configurable command adapter in
   the existing shared hook, not another hook or parser.

4. **Evidence and limits of the choice.** The owner supplied the real-microphone
   premature-finalization incident for single-utterance recognition. Before
   implementing this change, a temporary native continuous probe was run twice
   in the user's regular Chrome on Windows. Both constructors were functions;
   `SpeechRecognition` was selected, locale `en-US`, continuous/interim enabled,
   one alternative. Attempt 1 detected speech but returned an empty final.
   Attempt 2 produced these actual result snapshots:

   ```text
   interim: "5"
   interim: "5 days"
   interim: ["5", " days North"]
   interim: ["5 days", " North"]
   interim: ["5 days", " Nightcore"]
   interim: ["5 days", " North Coast"]
   interim: ["5 days", " North Coast of"]
   interim: ["5 days", " nightclub1"]
   final:   "5 days nightclub1"
   manual Stop → speechend → audioend → end
   ```

   Continuous recognition stayed active through the final result until Stop;
   therefore a final segment alone is not a command completion signal. Neither
   probe proves acoustically correct recognition of Aswan. Neither demonstrated
   an unexpected `onend` with continuous enabled. The one-restart fallback covers
   the explicitly required ended-segment regression; it is not claimed to have
   been exercised by these continuous probes. No aliases were added. The probe
   sent zero resolver requests and was removed afterward.

5. **Configuration.** Only Header `VoiceSearchButton` opts into
   `HEADER_COMMAND_CAPTURE`: continuous `true`, interim `true`, alternatives `1`,
   quiet `800` ms, maximum restarts `1`, maximum capture `30,000` ms. The adapter
   accepts explicit optional continuous/indexed-result options. Basic Voice and
   Smart Find Trip retain single-utterance recognition and their original hook
   behavior.

6. **Finalization.** Native final segments update capture state and the interim
   preview; they do not become the hook's command `finalTranscript`. The quiet
   timer is first armed only after a usable nonempty ASR final; initial interim
   decoding gaps or empty finals cannot prematurely stop live speech. Once
   armed, new final/interim activity resets the timer. At quiet expiry the active engine is stopped
   to flush its final results. On native end the assembled final text is emitted
   exactly once, then the command ends. Only that command final reaches the
   existing Header resolver effect. If no engine remains, quiet expiry completes
   directly. Interim text is never promoted to final text.

7. **Timing.** The 800 ms quiet window is a documented UX engineering starting
   point, not a linguistic rule or statistically optimal value. Normal Stop
   completion follows native `onend` promptly. A separate 1,000 ms drain bound
   aborts an unresponsive stopped engine; this is not a normal extra delay after
   `onend`. Empty continuation results do not extend a command merely because
   an earlier engine already produced useful final text.

8. **Bounds.** One native restart maximum per explicit command; the original
   quiet deadline survives restart and empty end events. Thirty seconds maximum
   capture, then bounded native draining. No infinite end/restart cycle.

9. **Deduplication.** Header capture requests complete indexed native snapshots,
   including final/interim distinctions. Each snapshot replaces current indexed
   segments, so growing/repeated events and disappearing interim tails do not
   append duplicates. Engine boundaries have separate indexes. Word overlap
   across restarted engines is removed without spelling repair or travel
   semantics. Every explicit mic start creates fresh capture state; identical
   text in two commands legitimately resolves twice.

10. **Stop, cancel, and errors.** Stop disables continuation, accepts the native
    final flush, and finishes once the engine settles. Escape/cancel/unmount/
    locale cleanup close capture, clear every timer, invalidate callbacks, and
    abort the active engine; no command final is emitted. A continuation
    `no-speech` with useful final text completes that text once. Without final
    text, no-speech remains an error. Permission, audio capture, network,
    unavailable-language, and unknown failures remain errors and never silently
    submit a partial command.

11. **Implementation files.**
    `lib/voice/command-speech-recognizer.ts` (new command adapter),
    `lib/voice/speech-recognizer.ts` (optional config/indexed snapshot contract),
    `lib/voice/browser-speech-recognizer.ts` (opt-in native config/snapshots),
    `lib/voice/use-speech-recognition.ts` (optional command capability), and
    `components/voice/VoiceSearchButton.tsx` (Header opt-in). Existing
    `docs/PHASE-6.5-REAL-MIC-SMOKE-QA.md` and `next-env.d.ts` modifications predated
    Phase 6.6 and were preserved.

12. **Tests.** New command adapter coverage for segment assembly, no early final,
    native end/continuation, Stop's delayed final flush, stale callbacks, cancel,
    interim/final quiet resets, no-speech with/without useful finals, genuine
    infrastructure errors, restart bound, indexed overlap/growing results,
    replay across restarts, capture limit, and missing native end. Header tests
    cover one full resolver POST, natural quiet completion, identical separate
    commands, Escape/unmount during continuation, and independent pending
    desktop/mobile captures. Adapter tests verify explicit continuous/indexed
    capture. Existing Header title-mode lifecycle fixtures now explicitly finish
    the command with Stop/end; parser tests were not edited. Existing structured
    search, confirmations, mobile isolation, literal typed title search, and
    Smart Find Trip review-only tests remain in the full suite.

13. **Total regression tests.** First implementation's full run: **400 tests,
    21 files passed** (`npx vitest run --maxWorkers=1`, exit 0). After the native
    interim-cutoff defect, one further regression was added. This work adds
    27 tests: 20 command boundary tests, six Header
    integration tests, and one native adapter test. The new interim-gap test
    failed before correction (`stopCalls=1`, expected zero). The corrected full
    run passed **401 tests across 21 files**, exit 0. Tests with controlled fake
    ASR establish capture behavior; they do not establish native ASR quality.

14. **Validation.** First implementation: `npx tsc --noEmit` passed (exit 0). Full Vitest passed above.
    `npm run lint` exited 1 with exactly the known unchanged
    `components/Header.tsx:109` `react-hooks/set-state-in-effect` error and no
    new lint findings. `npm run build` passed (exit 0): Next 16.3.3/Turbopack
    compiled successfully, completed TypeScript and generated pages. Next MCP
    `get_compilation_issues` returned `{"issues":[]}`. Runtime metadata confirms this
    workspace at `http://localhost:3000`. A pre-microphone runtime console issue
    concerning a script tag in `app/layout.tsx:41` was recorded separately; this
    file is unchanged. Corrected-policy validation also completed: **401 tests
    passed**, typecheck passed, production build passed, and full lint again
    reported only the same unchanged Header line 109 error (no new findings).
    The user's connected native Chrome is used for microphone
    validation rather than a new CLI-managed browser.

15. **Post-implementation real microphone Test 3 sequence.** First implementation
    failed real capture. On a Windows x64 desktop (UA `Windows NT 10.0; Win64;
    x64`), native Chrome 152.0.0.0,
    `SpeechRecognition` (verified `[native code]`), locale `en-US`, continuous/
    interim true and alternatives 1, the owner confirmed speaking the full
    `5 day Nile cruise to Aswan` on five separate mic attempts. The exact native
    result snapshots and times below are milliseconds since observation was
    armed. Each line is a browser result event; brackets denote multiple indexed
    results in that event. All are interim except the labelled finals.

    ```text
    Instance 1: start 36276; speechstart 37852
    41049 "5"
    41064 "5D"
    41082 "5D night"
    41130 "5D night Cruise"
    41149 ["5D", " night Cruise"]
    41149 ["5D night", " Cruise"]
    41190 FINAL ""
    speechend/audioend 41963; end 42705

    Instance 2: start 46021; speechstart 46935
    48235 "5"
    48266 "5-day"
    48644 "5-day night"
    speechend/audioend 49456
    49553 FINAL ""; end 49553

    Instance 3: start 50525; speechstart 51467
    52231 "5"
    52400 "5 days"
    52719 "5 Days Night"
    52814 ["5", " Days Night"]
    52885 ["5", " days"]
    52997 "5 days"
    53167 ["5 Days", " Night"]
    53199 "5 days"
    53324 ["5 Days", " Night"]
    53505 "five days not response"
    speechend/audioend 54311
    54369 FINAL "five days not response"; end 54370

    Instance 4: start 57367; speechstart 58702
    59503 "5"
    59715 "5 days"
    59930 "5 days not"
    60151 ["5", " days not"]
    60329 ["5 days", " not"]
    60638 "5 days not"
    speechend/audioend 61444
    61587 FINAL "5 days not"; end 61588

    Instance 5: start 62972; speechstart 64036
    64938 "5"
    65112 "5D"
    65418 "5D night"
    speechend/audioend 66221
    66446 FINAL ""; end 66447
    ```

    The owner reported the same destination cutoff. The first policy armed
    quiet completion from initial interim text. Stops consistently corresponded
    to the latest interim + about 800 ms, before a usable complete native final.
    This exposed a capture-layer defect rather than just an acoustic alias
    problem. A focused initial-interim-gap regression was added before correcting
    the policy. The correction and mandatory automated checks were completed
    before the corrected native repeat recorded below. No native error event or automatic restart
    was observed in these five explicit user commands.

    **Corrected-policy native repeat: FAIL.** The owner replied “Spoken once;
    waited for result.” The browser capture actually contains five mic clicks;
    they are reported separately rather than presented as duplicate requests
    for a single command. The requested spoken phrase remained
    `5 day Nile cruise to Aswan`; the precise spoken content of each additional
    click was not independently reconfirmed. Same native browser/device and
    configuration as above. The actual result/event sequence was:

    ```text
    Instance 1: mic click/start 68555/68567; speechstart 69597
    70414 "5"
    70716 "5 days"
    70964 "5 days not"
    71058 ["5", " days not"]
    71322 ["5 days", " not Christmas"]
    71857 ["5 days not", " Christmas"]
    71858 "5 days not Christmas"
    72853 FINAL "5 days not Christmas"
    native Stop 73662; speechend/audioend 73665; end 73814

    Instance 2: mic click/start 77419/77426
    audioend 78199; error "aborted"/end 78204; no speech results

    Instance 3: mic click/start 81687/81694; speechstart 82721
    83421 "5"
    83731 "5 days"
    84001 ["5", " days"]
    84122 ["5", " days North"]
    84342 ["5 days", " North"]
    84437 ["5 days", " North Cruise"]
    84702 ["5 days North", " Cruise"]
    84718 ["5 days North", " cruise bus"]
    85019 ["5 days North", " cruise 1"]
    85115 ["5 days North cruise", " 1"]
    86001 FINAL "5 days North cruise 1"
    native Stop 86810; speechend/audioend 86811; end 86969

    Instance 4: mic click/start 98067/98074; speechstart 99512
    100329 "5"
    100606 "5 days"
    100935 ["5", " days"]
    101098 ["5", " Days Night"]
    101166 ["5 Days", " Night"]
    101245 ["5 Days", " Night Cruise"]
    101554 ["5 Days", " Night cruise to"]
    101664 ["5 Days Night", " cruise to"]
    101757 ["5 Days Night", " cruise to a"]
    101773 ["5 Days Night", " cruise to a SP"]
    101911 ["5 Days Night cruise", " to a SP"]
    101995 ["5 Days Night cruise", " to a spar"]
    102113 ["5 Days Night cruise to", " a spar"]
    102747 FINAL "5 Days Night cruise to a spar"
    native Stop 103549; speechend/audioend 103550
    103673 FINAL snapshot ["5 Days Night cruise to a spar", ""]
    end 103674

    Instance 5: mic click/start 105360/105366; speechstart 106602
    107526 "5"
    107947 "5 days"
    108179 ["5", " days"]
    108620 "5 days"
    108635 ["5 days", " Cruise"]
    109042 ["5 days", " cruise to"]
    109272 ["5 days", " Cruise"]
    109276 "5 days Cruise"
    109429 ["5 days cruise", " 1"]
    110525 FINAL "5 days cruise 1"
    native Stop 111325; speechend/audioend 111326; end 111462
    ```

    All corrected automatic Stops followed the first usable native final by
    800–809 ms. In instance 5, the interim-to-final decoding gap was 1,096 ms;
    the corrected capture waited through it instead of stopping at 800 ms.
    Native transcription still failed to supply a reliably recognized Aswan.
    Instance 4 did capture the destination portion acoustically as `to a spar`;
    no spelling/alias repair was applied. The remaining observed failure is in
    native ASR transcription. No unexpected native-end restart was observed.
    Test 3 canonical acceptance failed, so Tests 5/6 were not started.

16. **Test 3 assembled transcript.** First implementation: empty/no completed text
    for instances 1, 2, 5; `five days not response` for instance 3; `5 days not`
    for instance 4. Aswan was not captured.
    Corrected-policy completed commands: `5 days not Christmas`,
    `5 days North cruise 1`, `5 Days Night cruise to a spar`,
    `5 days cruise 1`. Instance 2 was aborted without a command final.
    Native finals were retained once and the empty final tail in instance 4
    did not duplicate or erase the useful finalized text.

17. **Test 3 resolver POST count/payload/status/full response.** First implementation
    had two actual POSTs across five explicit user commands: one per nonempty
    completed final, not duplicate posts for a command. Exact payloads:
    `{"transcript":"five days not response","locale":"en"}` and
    `{"transcript":"5 days not","locale":"en"}`. Request 1 ended with
    `net::ERR_ABORTED` and no observed HTTP response. Request 2 had HTTP 200 then
    `net::ERR_ABORTED`. Starting another mic command cancels pending resolver
    work. Full response JSON was unavailable because the response body was
    aborted/not retained (`Network.getResponseBody` returned no data); no
    response is fabricated or reconstructed. Instances 1, 2, 5 emitted zero
    resolver POSTs.

    Corrected-policy actual application POSTs: **four across five explicit mic
    clicks**, exactly one per completed command and zero for the aborted command.
    All have `POST /api/voice/resolve`, UI locale `en`. Full exchanges:

    ```json
    {"transcript":"5 days not Christmas","locale":"en"}
    ```
    HTTP 200, completed body:
    ```json
    {"mode":"structured","applicable":{"days":"5"},"decisions":[]}
    ```

    ```json
    {"transcript":"5 days North cruise 1","locale":"en"}
    ```
    HTTP 200, completed body:
    ```json
    {"mode":"structured","applicable":{"days":"5","main":"nile-cruises"},"decisions":[]}
    ```

    ```json
    {"transcript":"5 Days Night cruise to a spar","locale":"en"}
    ```
    Aborted (`net::ERR_ABORTED`) after another explicit mic start. No HTTP
    response/status/full JSON was observed or recoverable; this exchange is not
    represented as a completed resolver result or confirmation test.

    ```json
    {"transcript":"5 days cruise 1","locale":"en"}
    ```
    HTTP 200, completed body:
    ```json
    {"mode":"structured","applicable":{"days":"5","main":"nile-cruises"},"decisions":[]}
    ```

    The three full JSON responses were retrieved directly with browser
    `Network.getResponseBody`; none was synthesized from parser fixtures.

18. **Test 3 final URL and active filters.** First implementation remained
    `http://localhost:3000/`; no trips navigation or active trips filters were
    observed. Corrected-policy first completed result navigated to
    `/trips?days=5`; subsequent completed results navigated to
    `/trips?days=5&main=nile-cruises`. Final observed URL:
    `http://localhost:3000/trips?days=5&main=nile-cruises`.
    Browser active filters were **Nile Cruises** and **5 Days**; Aswan was absent.
    There was no `title` parameter or literal Search chip. Target:
    `/trips?main=nile-cruises&destination=aswan&days=5`, no title.

19. **Real-microphone Test 5.** Not run because Test 3 failed. Expected approximate
    duration review for `around one week in Cairo`, then explicit 7 Days choice.

20. **Real-microphone Test 6.** Not run because Test 3 failed. Expected destination
    choice for `Luxor Aswan cruise`, no arbitrary automatic destination, then
    explicit Aswan choice with no invented duration or origin.

21. **Protected interpretation contracts.** Parser semantics, parser tests,
    aliases, taxonomy sources, fuzzy thresholds, capability mapping, resolver
    endpoint, and trips query contract are unchanged in this work. Typed Header
    remains native GET/title. Smart Find Trip remains review-only. No Nile/night
    or other ASR compensation alias.

22. **Privacy and backend ownership.** No audio recording, analytics additions,
    application transcript logging, external STT, LLM calls, or transcript
    persistence. Temporary QA observations are in browser memory and this local
    development note only. Existing on-demand resolver request remains no-store;
    Laravel taxonomy remains authoritative through the existing API and 300 s
    revalidation. No production records copied into source or JSON, no cache
    changes, and Dashboard changes still propagate without a code deployment.
    Existing unavailable behavior remains; no permanent fallback source added.
    Both transient native observers were removed. Final removal was verified
    in the browser (`observerRemoved:true`); native prototype methods and the
    temporary click listener were restored/removed. No application logging was
    added for this capture.

23. **Git status.** Starting branch `feat/header-smart-voice`,
    HEAD `7ce16081e8c9a5df9375b2df3c2734b32d3884f4`; existing QA note and generated
    `next-env.d.ts` changes were already present.
    Current Phase 6.6 changes are the five implementation files above, four
    existing test files, the new command adapter test, and this report. No
    protected interpretation or API files changed; HEAD remains the starting
    commit. Native QA uses a fresh tab in the same Chrome profile after the
    original tab's debugger would not reattach even after DevTools closed.
    Later status inspection also showed unrelated changes in
    `styles/_navigation.scss` and `styles/_shell.scss`; this work did not edit
    those files. `next-env.d.ts` became clean through normal Next generation.
    The old QA note's pre-existing trailing blank-line warning was preserved;
    the Phase 6.6 tracked code/test diff has no whitespace-check failures.

24. **Commits.** Zero commits made for Phase 6.6.

25. **Revised independent gates (owner accepted).**
    **COMMAND CAPTURE INFRASTRUCTURE = PASS.** All 401 regression tests pass;
    indexed segment assembly, bounded finalization, Stop/cancel/unmount/stale
    sessions, one POST per completed command, and typed Header parity are covered.
    The initial-interim 800 ms premature Stop was reproduced and corrected.
    **NATIVE ASR SEMANTIC ACCURACY — TEST 3 = FAIL.** Real native Test 3 still
    missed the required Aswan destination. This is **NATIVE BROWSER ASR
    TRANSCRIPTION QUALITY**, not command capture implementation failure.
    Nile → Night/North is category/travel-term substitution; Aswan → absent/
    "a spar" is place-name substitution/missing entity. The resolver handled
    the actual transcripts; no speculative repair is approved.
    The original combined FAIL classification is superseded by these two gates.
    No further capture, parser, taxonomy, aliases, fuzzy, LLM, or STT tuning.
    Phase 7 = **GO**, benchmark/release recommendations only. Tests 5/6 may be
    measured in Phase 7. Do not implement recommended release modes automatically.
    Zero commits.
