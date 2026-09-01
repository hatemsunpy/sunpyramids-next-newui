# Dynamic Backend Source-of-Truth Guard — MANDATORY

This rule applies to all frontend, migration, SEO, caching, performance,
refactoring, optimization, and release work in this repository.

Laravel Backend / Dashboard remains the authoritative source of truth
for all production data that is confirmed to be backend-controlled.

Next.js must consume that data through the existing API contracts.

Never convert confirmed dynamic backend data into frontend-owned static data.

## Forbidden

The following patterns are prohibited unless explicitly approved by the project owner:

- API data → hardcoded frontend array
- API data → copied JSON file
- Download backend content only once during build
- `force-static` without revalidation for mutable backend-controlled data
- static export of dynamic pages that prevents backend/dashboard changes from propagating
- production fallback data that silently replaces API data
- prices/categories/tours/blogs/events/destinations stored as production records in frontend source
- build-time snapshots that never update after dashboard changes
- copied backend SEO metadata stored permanently in Next source
- copied production entity IDs used as the frontend source of truth

## Required Architecture

For confirmed dynamic data:

Laravel Dashboard
→ Laravel API
→ Next.js data layer
→ optional safe cache/revalidation
→ rendered frontend

Caching does NOT change ownership.

The API must remain the authoritative source.

Acceptable example:

API
→ Next Data Cache / ISR
→ revalidation
→ API refresh

Unacceptable example:

API
→ copied into JSON/source code
→ permanent frontend snapshot

## Caching Rules

Caching and revalidation are allowed and encouraged when appropriate.

Before changing caching for dynamic data, determine:

- API endpoint
- authoritative backend source
- cache type
- revalidation interval
- stale behavior
- API failure behavior
- how dashboard changes reach the frontend

Do not use permanent static generation for mutable backend-controlled content.

Do not use `force-static` with no refresh mechanism for mutable content.

Do not convert API failures into permanent production fallback content.

## Performance Optimization Rules

Performance optimization must preserve dynamic API ownership.

If repeated API requests are expensive:

prefer:
- request memoization
- deduplication
- Data Cache
- ISR/revalidation
- appropriate server caching

never solve performance by copying live business data into frontend source.

## SEO Rules

If SEO is backend/dashboard-controlled, including:

- Meta Title
- Meta Description
- Canonical
- Open Graph
- Twitter metadata
- JSON-LD / Structure Schema

Next must continue reading it from the approved API source.

Caching is allowed.

Hardcoding backend-controlled SEO into frontend source is not allowed.

## Dynamic Data Examples

Unless proven otherwise by the Nuxt/backend ownership audit, these must remain API-driven:

- tours
- tour prices
- availability
- tour options
- offers
- categories
- destinations
- blogs
- events
- travel-guide content
- FAQs
- currencies
- team records when controlled by backend settings
- social links when controlled by backend settings
- page content
- SEO metadata
- JSON-LD

## Intentional Static Content

Static content is allowed when ownership was already confirmed as frontend-owned.

Examples may include:

- UI labels
- navigation labels
- How It Works presentation
- homepage counters
- selected CTA copy
- phone/address/WhatsApp when explicitly classified as deployment config
- approved local logo asset
- partner/certification assets

Do not incorrectly migrate intentional static UI into the backend.

## Mandatory Check Before Completing Any Relevant Task

For every change affecting data fetching, caching, SEO, rendering, or performance, answer:

1. Was this data dynamic before the change?
2. What is its authoritative source?
3. Does the frontend still fetch it from the Laravel API?
4. Was any production data copied into source code or JSON?
5. Can a dashboard/API change still reach Next without a code deployment?
6. What is the cache/revalidation behavior?
7. Could an API failure cause stale fallback data to become the permanent source?

If the answer reveals loss of backend authority, stop and redesign the solution.

## Final Guard

No performance, caching, SEO, migration, or release optimization may replace
confirmed Laravel/API-controlled production data with frontend-owned hardcoded
or permanently static data.

If a proposed optimization requires that behavior, classify it as:

ARCHITECTURE_VIOLATION

and do not implement it without explicit project-owner approval.


## Required Skill

For any task involving API data, rendering, caching, ISR, static generation,
SEO, performance optimization, migration, or production architecture:

Read and apply the `dynamic-backend-source-guard` skill before making changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
