# Blog article image delivery — 20 October 2026

Rich article HTML still contained original storage image URLs although structured card/hero images already used the CDN. The server now derives the matching CDN URL from each current article's approved blog image source. It also adds native lazy loading to later dimensioned images. Article content remains supplied by Laravel; no image records or article snapshots were added to production source.

## Scope and preservation

`prepareBlogArticleImages` runs after the existing sanitization and heading generation in `BlogPostPage`. It parses image locations using the existing installed `parse5` 8.0.1 package, now declared as an exact direct production dependency. Edits affect only actual image `src` attributes and eligible `loading` insertions; the article is not reserialized.

Mapping accepts HTTPS `sunpyramidtours.com/storage/media/blogs/` images with approved raster extensions and derives `cdn.sunpyramidstours.com/blogs/…`, retaining encoded path, query and fragment. This host mapping is deployment configuration. The owner confirmed media updates propagate to R2 automatically. Credentials, non-default ports, other paths, external/relative/data URLs, tiny images, SVG and template contents are excluded. Images with `srcset` keep their original `src`.

The first two ordinary article images retain existing loading behavior. Later approved images receive `loading="lazy"` only when both existing dimensions are positive integers above 32, there is no explicit loading attribute and fetch priority is not high. Images of unknown dimensions remain eager. Existing widths, heights, styles, alt text, classes, priority choices and other attributes are preserved. No tracking initialization changes.

## Evidence

- All 12 unique approved image files in the sampled article matched between origin and CDN by SHA-256 and byte count. One origin connection initially timed out; its retained retry succeeded and matched. These probes establish file identity, not a Lighthouse improvement or universal mirror availability.
- For the same captured article HTML: 14 images remained 14; 13 source attributes mapped; 7 loading attributes were added. Text and every other image attribute matched. Removing only image `src`/`loading` slices produced byte-identical remaining HTML. A second transformation was identical to the first.
- In the production browser at a 412 × 915 viewport, six unique article CDN images were initially requested. The third article image was still unrequested offscreen; scrolling to it produced one successful request and a natural width of 1,000. This confirms native lazy behavior in that run, not a guaranteed request count across browsers/viewports.
- The existing malformed external Google Sheets image URL was preserved. The existing `/images/linearNeedHelp.png` 404 was not changed by this work.
- All 564 tests across 51 files passed. A subsequent mechanical flattening of nested conditions was reviewed and the 15 image tests rerun successfully. Scoped ESLint and production builds passed. The build used an attached checkout with matching hashes for all 11 changed source/dependency files.
- Live Next.js 16.3.3 Turbopack MCP reported no compilation/runtime errors after the final helper edit. React inspection confirmed the blog server component and table-of-contents client component; article DOM contained 14 images, 7 lazy and no original-host article image sources. Existing local image-loader/third-party warnings remain.
- The server bundle contains the parser's `sourceCodeLocationInfo` marker; production browser chunks contain none of that marker or helper markers. Source import review finds the helper only in the server blog component and its tests.

The lockfile operation also reconciled the already-declared `sharp` dependency's root/optional metadata. No package versions were changed beyond declaring the already-installed parser directly. Sanitization itself was not rewritten.

## Dynamic ownership and remaining validation

The blog was dynamic before this change and remains Laravel/dashboard-owned through `getBlogReliable`: `blogs/{encoded-slug}?includes=seo,categories,relatedTours`. Its existing `apiFetchReliable` defaults remain `force-cache` with 300-second revalidation; this change adds no cache. Dashboard edits reach a successful subsequent API refresh without a frontend deployment. No endpoint, request contract, SEO, heading extraction, route, fallback or API error behavior changes. Failed API requests cannot introduce a permanent local content source. The helper performs no network or filesystem calls and introduces no runtime CDN fallback.

This depends on the configured CDN mirror continuing to serve the corresponding backend media paths. Identity was checked for the sampled files; future mirror failures use normal browser image failure behavior. Native lazy loading can change when an image appears in the network log while retaining its reserved dimensions and actual pixels.

The local changes are not yet verified by Google on a matching public deployment. The [published 16-route mobile baseline](google-mobile-16-routes-2026-10-20.md) remains 6 passing medians; the site-wide milestone is unresolved.

Raw local evidence: `output/performance/rich-image-20261020/` contains origin/CDN probes and retry, `html-integrity.json`, `browser-lazy-loading.json`, test/lint/build logs, source hashes and live dev diagnostics. Early failed implementation tests are recorded in the delegation tool output; their production predicate and incorrect first-two expectations were corrected before acceptance.
