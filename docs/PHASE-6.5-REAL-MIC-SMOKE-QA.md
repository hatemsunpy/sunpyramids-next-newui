# Phase 6.5 — Real-microphone smoke QA

Date: 2026-09-13. Target: current local implementation at `http://localhost:3000`, using the user's regular Chrome profile.

Browser/device: Chrome 152.0.0.0, Windows desktop (Win64; browser UA reports Windows NT 10.0). Runtime inspection detected both `window.SpeechRecognition` and `window.webkitSpeechRecognition` as functions. Constructor source reports `SpeechRecognition() { [native code] }`. The native instance is configured with `lang: en-US`, `continuous: false`, `interimResults: true`. No constructor, recognition event or resolver response was faked or replaced in this QA tab.

| Test | Spoken phrase / typed input | Actual browser ASR transcript | Resulting action / final URL | Status |
| --- | --- | --- | --- | --- |
| 1 | “5 days Cairo”; user explicitly accepted the observed real-microphone result as PASS | Not directly captured; request payload and resolver response still pending | User supplied `http://localhost:3000/trips?destination=cairo&days=5` and screenshot showing active Cairo Tours and 5 Days chips, Cairo destination selected, no literal Search chip and no `title` parameter | PASS — user accepted; actual resolver exchange still requested |
| 2 | “Cairo 5 days” | Not run | Not run | PENDING |
| 3 | “5 day Nile cruise to Aswan” | Not run | Not run | PENDING |
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

The original Test 1 remains PASS as explicitly accepted. The separate repeat is evidence-pending, not classified as an application failure. Tests 2, 3, 5 and 6 have not yet been run. Do not fabricate any exchange fields or substitute a synthetic POST for microphone evidence.

No microphone audio was recorded by QA tooling. No transcripts were added to analytics, cookies or persistent production storage. This development note contains only the requested QA observations. No implementation changes or commits were made for this smoke check. Phase 7 remains paused; passing smoke QA does not authorize automatic resumption under the updated instruction.
