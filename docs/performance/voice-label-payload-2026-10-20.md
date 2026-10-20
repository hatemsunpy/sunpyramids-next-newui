# Voice label payload review — 20 October 2026

The shared header and trip finder previously imported all seven voice UI dictionaries into browser JavaScript. Server wrappers now pass the selected locale's existing labels as plain serializable props. A small client accessor preserves the original missing-key fallback. React `cache` shares this frontend-owned label object within a request; it does not cache API records or change their freshness.

OpenCode implemented the bounded change using the owner-approved `opencode/glm-5.3-flash-free` model. Independent review removed redundant tests and a test that incorrectly claimed to prove bundle exclusion. The dictionaries themselves, JSX layout, styles, event handlers, voice lifecycle and resolver requests are unchanged. There is no delay to Google, Clarity or TikTok.

## Measured local payload

Production builds, normal home HTML, all 13 initial first-party scripts, same compression settings:

| Payload | Before | After | Reduction |
|---|---:|---:|---:|
| Initial JavaScript, raw bytes | 963,903 | 951,211 | 12,692 |
| Initial JavaScript, gzip bytes | 305,610 | 300,751 | 4,859 |
| HTML, gzip bytes | 48,728 | 49,535 | -807 |
| HTML + initial JavaScript, gzip bytes | 354,338 | 350,286 | 4,052 |

The French and Chinese dictionary probes present in the original initial bundle are absent from the new initial scripts. The combined Brotli quality-4 reduction was 4,099 bytes. These are local payload measurements, not a measured Lighthouse score improvement or a guarantee of 70–80.

One live CMS blog-card image URL changed between captures. An independent HTTP 200 request to the unchanged Laravel `blogs/home?page_limit=8&order_by=id,desc` endpoint confirmed that the new URL is the current backend value. HTML compressed differences include that input variation; the JavaScript reduction is directly measured. All captured body text, headings, form actions and links matched. All other captured image attributes matched; the updated card retained its alt text, dimensions, sizes and styles.

## Independent verification

- 549 tests passed across all 50 files, including seven locale roundtrip/value comparisons and the missing-key fallback. Existing voice lifecycle and interaction assertions were retained.
- Scoped ESLint and `git diff --check` passed.
- Next.js 16.3.3 production build passed, including TypeScript. The first build found malformed generated `.next/dev/types` files; their contents were retained as ignored diagnostic text, the two generated files were removed after stopping the owned dev server, and the build was rerun successfully. No project type checks were disabled.
- Next's live MCP reported no compilation or runtime errors after the edit. Agent-browser React inspection confirmed selected-locale props on both voice components; the header voice button and Find Trip voice button retained their labels in the running UI.

Ignored raw evidence is under `output/performance/voice-labels-20261020/`. A passing test/build and smaller transfer do not replace verification of the deployed application on Google PageSpeed.

## Dynamic backend ownership

Only frontend-owned static UI label transport changed. All data that was dynamic remains Laravel-owned and is still fetched through the existing API data layer. No production API records or SEO values were copied into source or JSON. No endpoints, request options, revalidation intervals, stale behavior or API failure handling changed. Dashboard changes continue reaching Next under the existing refresh behavior without a code deployment; the independently verified live image update is consistent with that behavior. An API failure cannot introduce a new permanent fallback through this change.
