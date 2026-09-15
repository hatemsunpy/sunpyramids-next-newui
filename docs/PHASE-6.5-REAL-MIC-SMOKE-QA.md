# Phase 6.5 — Real-microphone smoke QA

Date: 2026-09-13. Target: current local implementation at `http://localhost:3000`, using the user's regular Chrome profile.

Browser/device: Chrome 152.0.0.0, Windows desktop (Win64; browser UA reports Windows NT 10.0). Runtime inspection detected both `window.SpeechRecognition` and `window.webkitSpeechRecognition` as functions. Constructor source reports `SpeechRecognition() { [native code] }`. The native instance is configured with `lang: en-US`, `continuous: false`, `interimResults: true`. No constructor, recognition event or resolver response was faked or replaced in this QA tab.

| Test | Spoken phrase / typed input | Actual browser ASR transcript | Resulting action / final URL | Status |
| --- | --- | --- | --- | --- |
| 1 | “5 days Cairo”; fresh real-microphone repeat on recovered dev server | `"5 days Cairo"` (verified from DevTools HAR POST payload) | HTTP 200, resolver `{"mode":"structured","applicable":{"destination":"cairo","days":"5"},"decisions":[]}`; navigated to `http://localhost:3000/trips?destination=cairo&days=5` with active Cairo Tours and 5 Days filters, zero `title` parameter | PASS — verified via `localhost.har` |
| 2 | “Cairo 5 days” | `"Cairo 5 days"` (verified from DevTools HAR POST payload) | HTTP 200, resolver `{"mode":"structured","applicable":{"destination":"cairo","days":"5"},"decisions":[]}`; navigated to `http://localhost:3000/trips?destination=cairo&days=5` with active Cairo Tours and 5 Days filters, zero `title` parameter | PASS — verified via `Cairo 5 days.har` |
| 3 | “5 day Nile cruise to Aswan” | `"5 day night Cruise"` (Chrome ASR dropped “to Aswan” and heard “Nile” as “night”) | HTTP 200, resolver `{"mode":"structured","applicable":{"days":"5","main":"nile-cruises"},"decisions":[]}`; navigated to `/trips?days=5&main=nile-cruises` missing `destination=aswan` | FAIL — ASR TRANSCRIPT FAILURE (verified via `5 day Nile cruise.har`) |
| 4 | Manually typed “5 days Cairo”; microphone unused | N/A — typed input | Native GET `/trips?title=5+days+Cairo`; literal Search UI; zero internal resolver requests | PASS |
| 5 | “around one week in Cairo” | Not run | Not run | PENDING |
| 6 | “Luxor Aswan cruise” | Not run | Not run | PENDING |

The agent was observing a new localhost tab while the user was speaking in the Vercel preview. The user subsequently supplied the preview URL and screenshot, resolving the tab mismatch. That earlier preview result was `/trips?title=5+days+Cairo`, with literal Search UI and zero results; it failed the expected voice URL on the outdated preview. Local permission inspection (`prompt`) therefore does not describe permission in the preview where the user spoke. The native constructor and `en-US` instance configuration above were measured in localhost, not in that preview. The old local `title` URL belongs to Test 4 and is not evidence of automatic voice title fallback in the correction.

After choosing manual localhost QA, the user supplied the canonical Cairo/5-day URL and screenshot recorded in Test 1. This establishes the expected resulting URL and active filter UI. The screenshot alone does not expose the spoken input, actual browser ASR transcript or resolver response; those remain pending and are not inferred from query parameters. Tests 2, 3, 5 and 6 also remain pending.

## Deployment boundary check

A small invalid-input POST `{ "locale": "en", "transcript": 5 }` was sent to both resolver paths. This uses no microphone transcript and is rejected before taxonomy work in the corrected implementation.

| Target | Observed response |
| --- | --- |
| `http://localhost:3000/api/voice/resolve` | HTTP 400, JSON `{ "error": "invalid-input" }` — expected resolver validation |
| `https://sunpyramids-next-newui.vercel.app/api/voice/resolve` | HTTP 200 with `text/html` containing the Next “404: This page could not be found” page — no resolver JSON boundary served |

Classification: the supplied preview is not serving the accepted Phase 6.5 resolver. This is a deployment/test-target mismatch affecting Header integration; it does not establish a new defect in the corrected local parser/resolver, taxonomy, confirmation UI or ASR. The original voice resolver response and raw ASR transcript in the preview were not captured and must not be inferred from the URL. No alias change is justified.

The corrected implementation remains local and uncommitted. No deployment was performed as part of this smoke check. Complete Test 1's transcript/resolver evidence and the remaining voice cases on localhost. Regular Chrome disappeared from the browser-tool inventory after the preview screenshot was supplied; only the in-app browser was exposed at the last inspection, so automated observation awaits reconnection to regular Chrome.

The user chose to test localhost manually rather than reconnect Chrome. Manual QA handoff: open the local build in regular Chrome, enable DevTools Network Preserve log and filter `voice/resolve`. Record only the request `transcript`/`locale`, resolver Response, final URL and relevant UI/pass-fail observations for each requested case. The typed case should produce no resolver POST. Await these results before closing Phase 6.5 or beginning Phase 7. A successful text-corpus test does not substitute for microphone/ASR evidence.

Regular Chrome reconnected for the subsequent instruction. The agent inspected the user's canonical localhost result tab without reloading it. Retained CDP Network request/response events contained no `/api/voice/resolve` exchange from Test 1. Its exact ASR transcript, sent body, HTTP status and response cannot be recovered from that available event buffer and must not be reconstructed. User DevTools may still contain the exchange if recording was enabled during the test. Network inspection was enabled for subsequent checks, without adding application logging. Runtime constructor inspection again detected both native constructor names on Chrome 152 / Windows, document language `en`.

Updated user instruction: report Test 1's actual exchange before continuing Tests 2, 3, 5 and 6. If those tests all pass, report the complete microphone QA first; do not begin Phase 7 automatically. Test 4 remains accepted and need not be repeated. Await the retained user DevTools exchange or clearly identify any new microphone capture as a separate repeat session.

### Evidence-only Test 1 repeat — pending exchange

The user subsequently authorized a separate real-microphone repeat of “5 days Cairo” with DevTools Network Preserve log, a `voice/resolve` filter and old entries cleared. The agent sent the DevTools opening shortcut and enabled transient CDP Network inspection before prompting the user to prepare that panel and speak. DevTools controls themselves are outside the exposed page accessibility surface; their setup was user-confirmed by “Prepared and spoken”.

The observed localhost tab remained `http://localhost:3000/trips?destination=cairo&days=5` with Cairo Tours and 5 Days active and no literal Search chip. This URL/UI already existed before the repeat, so it does not independently establish a fresh action. The post-prompt CDP event buffer contained no new resolver exchange. Exact transcript, actual request, status and full response remain unavailable pending the user's visible DevTools entry. The agent requested that entry before clearing it or repeating again. A later attempt to inspect actual recognizer instances timed out; no new configured-locale measurement is claimed for this repeat. The earlier native Chrome/Windows runtime checks remain recorded above.

### User-requested retry — FAIL: local resolver route availability

On the subsequent “again” instruction, regular Chrome reconnected under a new browser connection. The user's same localhost tab was now at `http://localhost:3000/`. Before the spoken prompt, transient Network capture was enabled. Runtime inspection detected both constructor names as functions with native `SpeechRecognition` source, Chrome 152.0.0.0 / Windows Win64. No actual native instances were returned by the locale inspection at that moment, so this retry's configured recognition locale was not directly measured; the earlier observed locale was `en-US`.

The user confirmed “Spoken” for the requested phrase “5 days Cairo”. Afterward, the Header input visibly contained `5 days Cairo`, and the UI stated: “Smart search is unavailable. Your spoken text is in the search field; you can edit it and submit manually.” There was no navigation: final URL remained `http://localhost:3000/`, with no trips active filters. The exact native ASR event and POST payload were not captured; the visible input is recorded separately and is not substituted for an exact event transcript.

Read-only browser resource timing showed a fetch entry for `http://localhost:3000/api/voice/resolve` with `responseStatus: 404`, duration approximately 377.4 ms, and transfer size 4311 bytes. The debugger request/response buffer did not contain that exchange, so actual headers and full response body remain unavailable. No structured resolver JSON was observed. A separate CLI invalid-input POST `{ "locale": "en", "transcript": 5 }` reproduced HTTP 404 with missing-page HTML; this probe is not the microphone request.

The route file `app/api/voice/resolve/route.ts` exists in the current workspace. At this inspection HEAD was `7ce16081e8c9a5df9375b2df3c2734b32d3884f4` with a clean working tree before this note update, changed externally since the earlier uncommitted baseline. The earlier statement that Phase 6.5 remained uncommitted describes the earlier session, not current Git state.

Classification: Header integration / local resolver route-serving availability. HTTP 404 prevents resolver interpretation; parser, live taxonomy and confirmation UI are not implicated by the available evidence. Root cause of the missing running route remains undetermined. This repeat failed the expected functional result. Stop remaining microphone Tests 2, 3, 5 and 6 and keep Phase 7 paused. Original accepted Test 1 and typed Test 4 remain PASS. No aliases, application logging, implementation fixes, server restart or commit were performed.

## Local route-serving investigation and recovery

The user then authorized an environment-only investigation. The workspace was `D:\Sun Pyramids\sun pyramids tours - Web\sunpyramids-next-newui`; `git branch --show-current` returned `feat/header-smart-voice`, `git rev-parse HEAD` returned `7ce16081e8c9a5df9375b2df3c2734b32d3884f4`, and `git status --short` showed only this QA note modified. `app/api/voice/resolve/route.ts` exists at that exact path and exports `POST` (the async handler). `app/` exists and `src/app/` does not. No source route or configuration edits were made.

Before restart, port 3000 was owned by PID 13280 (`node ... next/dist/server/lib/start-server.js`), parent PID 13564 (`next dev`), launched from the workspace's `node_modules` path. Both processes were created on 2026-09-10 and were therefore stale relative to the current QA session. Windows process inspection did not expose a separate working-directory field; the executable command paths and generated artifacts identify the current workspace. The parent/worker relationship was verified before stopping them. No other port owner was stopped.

Read-only `.next` inspection showed `/api/voice/resolve/route` in `.next/dev/server/app-paths-manifest.json`, `.next/app-path-routes-manifest.json`, `.next/server/app-paths-manifest.json`, and the corresponding dev/server route bundles. The dev log contained `Compiling /api/voice/resolve ...` and no route compilation error involving this handler, `header-voice-resolution` or `lib/voice/*`. The pre-restart synthetic POST `{ "locale": "en", "transcript": 5 }` returned HTTP 404, `text/html; charset=utf-8`, Next missing-page HTML.

The confirmed project PIDs were stopped without reset, checkout, stash, clean, source deletion or `.next` deletion. The normal `npm run dev` was started from the exact workspace. Next 16.3.3 became ready at `http://localhost:3000` after 18.7 seconds; the new server processes were PID 10520 (`next dev`) and PID 9532 (`start-server.js`), created on 2026-09-13. The post-restart synthetic probe returned HTTP 400, `Content-Type: application/json`, body `{ "error": "invalid-input" }`. The server log recorded `POST /api/voice/resolve 400` followed by route compilation. This confirms the root cause as **STALE OR MISMATCHED LOCAL DEV-SERVER ROUTE REGISTRATION**. Restart alone recovered the route; no implementation changes were needed.

### Fresh real-microphone Test 1 repeat on healthy dev server — PASS

On the subsequent run on the fresh dev server, the user conducted a real-microphone repeat of “5 days Cairo” with DevTools Network Preserve log enabled, exporting the resulting network traffic directly to `C:\Users\HaTeM\Desktop\localhost.har`.

Inspection of the authoritative HAR export confirmed the complete, live HTTP transaction:
- **Timestamp**: `2026-09-13T13:25:26.141Z`
- **Request**: `POST http://localhost:3000/api/voice/resolve`
- **Request Headers**: `Content-Type: application/json`, `Origin: http://localhost:3000`, `Sec-Fetch-Site: same-origin`, `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`
- **Exact Request Payload**: `{"transcript":"5 days Cairo","locale":"en"}`
- **HTTP Status**: `200 OK`
- **Response Headers**: `content-type: application/json`, `cache-control: no-store`
- **Exact Resolver Response Body**: `{"mode":"structured","applicable":{"destination":"cairo","days":"5"},"decisions":[]}`
- **Subsequent Action**: Header initiated structured navigation to `/trips?destination=cairo&days=5` (RSC payload requested at `http://localhost:3000/trips?destination=cairo&days=5&_rsc=64EBvAagmAisvzuu` with HTTP 200).
- **Final URL**: `http://localhost:3000/trips?destination=cairo&days=5`
- **Verification**: Zero `title=` parameter in URL or request; active trips filters reflect Cairo Tours and 5 Days; literal search chip absent.

Result: **TEST 1 — PASS**.

### Real-microphone Test 2 — Reverse Word Order — PASS

The user conducted Test 2 by speaking “Cairo 5 days” into the native microphone on the fresh dev server with DevTools Network Preserve log enabled, exporting the traffic to `C:\Users\HaTeM\Desktop\Cairo 5 days.har`.

Inspection of the HAR export confirmed the complete transaction:
- **Timestamp**: `2026-09-13T14:05:55.378Z`
- **Request**: `POST http://localhost:3000/api/voice/resolve`
- **Request Headers**: `Content-Type: application/json`, `Origin: http://localhost:3000`, `Sec-Fetch-Site: same-origin`, `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36`
- **Exact Request Payload**: `{"transcript":"Cairo 5 days","locale":"en"}`
- **HTTP Status**: `200 OK`
- **Response Headers**: `content-type: application/json`, `cache-control: no-store`
- **Exact Resolver Response Body**: `{"mode":"structured","applicable":{"destination":"cairo","days":"5"},"decisions":[]}`
- **Subsequent Action**: Header initiated structured navigation to `/trips?destination=cairo&days=5` (RSC payload requested at `http://localhost:3000/trips?destination=cairo&days=5&_rsc=c2k_0iY7vcqBvuxh` with HTTP 200).
- **Final URL**: `http://localhost:3000/trips?destination=cairo&days=5`
- **Verification**: Zero `title=` parameter; reverse word order correctly recognized and mapped to structured filters `destination=cairo` and `days=5`.

Result: **TEST 2 — PASS**.

### Real-microphone Test 3 — Category + Destination + Duration — FAIL: ASR TRANSCRIPT FAILURE

The user conducted Test 3 targeting “5 day Nile cruise to Aswan” on the fresh dev server with DevTools Network Preserve log enabled, exporting the traffic to `C:\Users\HaTeM\Desktop\5 day Nile cruise.har`. The user reported that Chrome stopped recognizing before “to Aswan” could be processed.

Inspection of the HAR export confirmed:
- **Spoken Phrase**: `5 day Nile cruise to Aswan`
- **Timestamp**: `2026-09-13T14:11:34.149Z`
- **Request**: `POST http://localhost:3000/api/voice/resolve`
- **Request Headers**: `Content-Type: application/json`, `Origin: http://localhost:3000`, `Sec-Fetch-Site: same-origin`
- **Exact Request Payload**: `{"transcript":"5 day night Cruise","locale":"en"}`
- **HTTP Status**: `200 OK`
- **Exact Resolver Response Body**: `{"mode":"structured","applicable":{"days":"5","main":"nile-cruises"},"decisions":[]}`
- **Subsequent Action**: Header navigated to `/trips?days=5&main=nile-cruises` (RSC payload requested at `http://localhost:3000/trips?days=5&main=nile-cruises&_rsc=wZiL8475MA6yjFQe` with HTTP 200).
- **Final URL**: `http://localhost:3000/trips?days=5&main=nile-cruises`

#### Failure Analysis & Classification:
- **Classification**: **1. ASR TRANSCRIPT FAILURE**
  The browser's native speech recognition engine returned `"5 day night Cruise"`. It finalized the utterance prematurely (dropping `"to Aswan"`) and misheard `"Nile"` as `"night"`.
- **Resolver & Integration Evaluation**: The resolver correctly interpreted the transcript it was provided (`days=5` and `main=nile-cruises` via fuzzy match on `night Cruise`), and the Header navigated without `title=`. The defect is that the destination entity was never captured by the browser SpeechRecognition instance.
- **Protocol Action & Reproducibility Check**:
  In accordance with the Failure Handling instructions:
  1. A reproducibility check was performed: the user retried speaking “5 day Nile cruise to Aswan” continuously.
  2. The failure was confirmed reproducible: Chrome's native SpeechRecognition repeatedly cut off before “to Aswan” could be spoken or captured, producing transcripts that truncated after "cruise" (e.g. `days=5&main=nile-cruises` or title fallback `5 de Noel Crows`, `play The United crows`).
  3. Subsequent tests (Tests 5 and 6) are **STOPPED**.
  4. No code changes, aliases, or parser alterations were made.
  5. The failure is classified as a confirmed **1. ASR TRANSCRIPT FAILURE**.
  6. Phase 7 remains **PAUSED** awaiting explicit owner approval.

No parser semantics changed. No aliases were added. No application logging or persistent transcript storage was added. No commit was created by this investigation. Phase 7 remains paused pending owner approval.

No microphone audio was recorded by QA tooling. No transcripts were added to analytics, cookies or persistent production storage. This development note contains only the requested QA observations. No implementation changes or commits were made for this smoke check. Phase 7 remains paused; passing smoke QA does not authorize automatic resumption under the updated instruction.
