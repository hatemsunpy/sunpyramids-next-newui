# Tour stylesheet delivery review — 20 October 2026

The candidate removes tour-only redesign, typography and hover rules from the initial stylesheet payload of unrelated routes. It does not change CSS declarations, selectors, component markup or business data. These are local payload and correctness results, **not a measured Google score improvement**. The published Google baseline remains [6 of 16 routes at the mobile milestone](google-mobile-16-routes-2026-10-20.md).

## Implementation and cascade

`styles/tour-detail.scss` imports the extracted redesign partial, then the existing typography and hover partials. Both tour page routes import this entry before `interior.scss`. Seven cascade-sensitive rules remain at their original position in `app/globals.scss`; the other 320 redesign rules move to `styles/_tour-page-redesign.scss` in their original order. Shared legacy tour/add-on rules and animation keyframes remain global.

The first extraction was rejected: browser comparison found changed prose colors/width, bottom padding and booking grid behavior. Keeping the seven original rules fixed those differences. Compiled-rule comparison against commit `8535753af750f1dbd9664a7f4cf8439f1918e46a` preserves all 2,340 original rule/declaration records across the global and batch entries. This structural check alone is not UI proof.

Next.js retains stylesheets after client navigation. The observed initial tour order is global → batch → tour → interior; entering a tour from a blog/trips page gives global → batch → interior → tour. Both orders were compared in Chromium using the actual compiled CSS and the same frozen DOM.

## Payload

Gzip sizes were calculated from downloaded response bytes using the same compression method before and after. They describe CSS payload, not total page weight or network latency.

| Initial route | Before gzip | After gzip | Difference | Stylesheet requests |
| --- | ---: | ---: | ---: | --- |
| Home | 47,904 B | 40,378 B | −7,526 B | 2 → 2 |
| Blog article | 64,645 B | 57,119 B | −7,526 B | 3 → 3 |
| Cart | 64,645 B | 57,119 B | −7,526 B | 3 → 3 |
| Tour detail | 64,645 B | 65,650 B | **+1,005 B** | **3 → 4** |

The extra tour request/compression overhead is a tradeoff for removing these rules from other initial routes. No claim is made that tour performance improves from this split.

## Verification and limits

- Production build and scoped ESLint passed in an attached isolated checkout with matching dependency versions and verified source hashes.
- Twenty-two initial-load cases compared 25,804 elements (77,412 normal/pseudo-element style records), including closed/open tour booking panels, mobile/desktop, light/dark and normal/reduced motion. All final comparisons matched styles and geometry.
- Desktop gallery hover and keyboard focus comparisons matched; the desktop hover screenshot pair had identical PNG bytes.
- Eight additional cases exercised the stylesheet order observed after client navigation. Initial theme-switch checks showed inherited-color differences on offscreen line breaks/Trustindex stars. A control applying the **same original CSS twice** reproduced the star differences. Rechecking the settled theme, including all three affected cases, produced zero differences. Original attempts and the control remain in the raw evidence.
- Actual production navigation blog → trips → tour → back → forward preserved `performance.timeOrigin` and rendered the tour with the expected retained stylesheet order.
- Next.js 16.3.3 Turbopack dev MCP reported no compilation/runtime errors. A React-enabled browser inspected the live tour booking component with API-derived props, changed the gallery photo, opened the booking panel and closed it with Escape. No booking was submitted.

Frozen DOM comparisons isolate cascade behavior; they do not establish full end-to-end pixel identity, API freshness or performance scores. Local runs use live mutable backend data. A public deployment of this candidate still needs Google verification.

Raw evidence is retained locally under `output/performance/route-css-20261020/`: `partition-integrity.json`, `before/summary.json`, `after/summary.json`, `v2-computed-parity-summary.json`, focus/hover/screenshot results, `v2-csr-parity.json`, `v2-same-css-theme-control.json`, `v2-csr-settled-dark.json` and `dev-*` diagnostics. Rejected candidates remain separately retained.

## Backend authority

No data layer, endpoint, API contract, metadata, revalidation or failure behavior changes. Dynamic records remain Laravel-owned and continue through the existing API calls. No production records or JSON snapshots were introduced. Dashboard changes reach Next through the same existing refresh behavior; API errors cannot create a new permanent fallback source. Google, Clarity and TikTok initialization is untouched.
