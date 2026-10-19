# Mobile verification — October19,2026

The mobile70–80 target remains **unachieved**. Three requested local runs scored
**61/61/59**, median61, using the unchanged production build
`fvys0JiSWVaqqTHkda3V-` at `http://localhost:3004/`.

The owner confirmed the device was ready for a quiet ten-minute window. These
runs use the same Lighthouse13.3, HeadlessChrome151, default simulated mobile
throttling and fresh browser profiles as the previous local series. No tracking
was blocked or delayed, and no UI, business request or production source changed.
408 source paths were checked against the independently tested build manifest;
no nongenerated path changed. The earlier534-test gate is retained evidence for
that build, not claimed as a newly executed test suite today.

| Run | Score | FCP | LCP | TBT | SI | CLS | Pre-run CPU | Available RAM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
|1 |61 |1522ms |3472ms |1706ms |4763ms |0.0000243 |11/15/19% |10.99GiB |
|2 |61 |1383ms |3760ms |1372ms |4320ms |0.0000243 |14/8/9% |10.75GiB |
|3 |59 |1454ms |4055ms |1304ms |4782ms |0.005084 |11/35/63% |10.63GiB |

Run3 was not uniformly low contention. Runs1/2 began with lower CPU load and
substantially more free RAM than the preceding day; the successful low-load run2
still scores61. Reducing host load alone therefore has not established70–80.
These measurements do not establish the cause of every score difference or prove
that the target is impossible under the owner's requirements.

All reports have HTTP200 home responses, no redirect, accessibility94 and SEO100;
best practices are73/77/77. Lighthouse run warnings are empty. That does not mean
all requests succeeded: run1 records a currency fetch connection timeout and a
failed country fetch. Runs2/3 complete currencies200 and country preflight204 /
fetch200. Run2 also contains one unfinished image entry at the end of recording;
an unfinished entry alone is not proof of a failed request. Run1 is retained as a
valid lab result but does not establish complete live-data functional acceptance.

The required GTM/Google-tag, Clarity and TikTok SDK script requests return200 in
all three runs. This verifies loader delivery, not the correctness of every
analytics event. Their unchanged initialization and measurement contracts remain
protected. No GTM, hosting or account configuration was edited.

The three runner commands completed with exit0. Their own audit browsers exited,
and a final process check found no browser with any of the exact three audit
profile paths. No user browser or unrelated process was stopped.

Evidence is retained under:

- `output/performance/quiet-shell151-2026-10-19-mobile-r1/`
- `output/performance/quiet-shell151-2026-10-19-mobile-r2/`
- `output/performance/quiet-shell151-2026-10-19-mobile-r3/`
- `output/performance/quiet-2026-10-19/validation.json`

Each run includes JSON/HTML Lighthouse reports, trace/network artifacts, host
samples and browser ownership metadata. The source/build checks and SDK response
status summaries are in `validation.json`. The earlier local/deployed asset
comparison found different delivered files; no matching hosted Preview has been
provided. Hosted verification of these changes remains pending. Another unchanged
local score run is not justified by this three-run series alone.

Laravel and its current APIs still own all live production data. Request
contracts, locales, SEO, rendering behavior, cache/revalidation, expiry, API-error
handling and dashboard propagation remain unchanged. No production dataset was
copied into frontend source and no fallback content was introduced. This phase
made no deployment, push, commit, dependency or production-code change.
