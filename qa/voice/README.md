# Phase 7 frozen baseline v1

Production Voice code is frozen at the hashes in freeze.v1.json. This is a
measurement harness, never a production taxonomy source or runtime import.
The supplied historical Phase 7 plan was not found in the repository or task
attachments. This protocol records the currently supplied requirements and
explicit exploratory thresholds; it does not claim these thresholds were
previously approved.

182 known-transcript cases: 26 per locale (en, fr, de, it, pt, es, zh), with
11 regression, 11 challenge, and four taxonomy degradation cases per locale.
Natural language labels are authored before execution, not generated from
parser outputs. Some regression examples overlap existing tests. The challenge
partition is additional coverage, not an independently authored held-out set.
Synthetic fixture IDs are QA-only. No production API access is permitted.

Metrics: exact canonical filter set, expected capability statuses, confirmation
options, informational values, missing expected filters, and false confident
application (an extra or wrong applicable filter). Each denominator is reported.
Header projection and Find Trip capabilities are recorded separately. No ASR
accuracy percentage is inferred from text data. Latency is warm CPU time only,
excluding browser recognition, import, HTTP, Laravel/cache, and UI time.

Exploratory parser recommendation: FULL SMART quality requires at least 95%
exact cases overall, at least 95% on challenge cases, zero false confident
application, and 100% safety-case success (approximation, ambiguity, nights,
invalid values, unsupported fields, child categories, taxonomy degradation).
Otherwise recommend SUGGESTION ONLY pending review of failures. These are
conservative evaluation thresholds, not a statistically certified release gate.

Real ASR: 27 English Egyptian entity matrix rows plus Header Tests 5 and 6.
Each row must record native constructor, configured locale, intended phrase,
actual transcript, native events, and explicit error. Repeat uncertain errors
without changing aliases. Other locales are NOT MEASURED until a proficient
speaker is available. No locale receives Header FULL SMART AUTO based only
on parser quality or a single speaker. Place/category substitution, numbers,
missing segments, cutoff, hallucination, and interpretation are separate tags.
Absent native evidence means insufficient ASR evidence, not 0% accuracy.

Run once after freezing:

    node qa/voice/freeze.mjs
    npx vitest run --config qa/voice/vitest.config.ts
    npx vitest run --maxWorkers=1

Do not regenerate the freeze or modify labels after seeing results. A future
corpus change needs a new version. Manual QA may only update results artifacts.
No audio, analytics, LLM, external STT, or persistent production logging.
Release recommendations distinguish Header FULL SMART AUTO / SMART CONFIRMATION /
BASIC VOICE ONLY from Find Trip FULL SMART REVIEW / SUGGESTION ONLY /
BASIC VOICE ONLY. No recommendation is implemented automatically.
