# Phase 7.25 contextual ASR experiment

This standalone page measures native browser transcription before the existing
parser. It is not imported by production code and makes no resolver, taxonomy,
analytics, LLM, or third-party STT calls. It never records audio. Attempts stay
in page memory until the operator explicitly downloads the QA JSON artifact.

Serve this directory from a localhost origin, open it in the target browser,
and use the visible runtime evidence before enabling any supported mode:

```text
python -m http.server 4173 --directory qa/voice/contextual-biasing
```

Modes A–D match the Phase 7.25 protocol. Phrase modes are disabled when the
runtime does not expose both `SpeechRecognitionPhrase` and assignable
`recognition.phrases`. A successful assignment is only capability evidence;
actual microphone attempts must still be checked for native errors such as
`phrases-not-supported`.

The initial vocabulary is an 18-item curated QA list. It is not a production
taxonomy source. Any future production proposal must derive a bounded list from
the existing Laravel/API taxonomy and preserve its normal cache refresh.

Run the evidence analyzer after placing the exported JSON files beside the
harness:

```text
node qa/voice/contextual-biasing/analyze.mjs
```

The analyzer validates the expected Mode A, B, and C evidence shapes and writes
`analysis.v1.json`. Mode B is represented by its real recognizer-start failure;
the current runtime exposes and accepts phrase objects but returns
`phrases-not-supported` before the audio lifecycle begins.
