# MANDATORY GUARD RULES — ENFORCE BEFORE, DURING, AND AFTER IMPLEMENTATION

The following Guard Rules are HARD CONSTRAINTS.

They are NOT recommendations.

They are NOT optional QA items.

They must be enforced:

1. BEFORE implementation
2. DURING every code change
3. BEFORE every commit
4. BEFORE opening the Pull Request
5. BEFORE declaring the Batch complete

If any change conflicts with these rules:

STOP.

Do NOT work around the rule.

Do NOT silently modify protected behavior.

Report the conflict instead.

---

# IMMUTABLE APPLICATION CONTRACT

THE REFACTOR MUST NOT CHANGE:

* API source of truth
* API endpoint
* locale semantics
* English root routing
* `/en` rejection
* metadata behavior
* canonical behavior
* hreflang behavior
* JSON-LD behavior
* 404 semantics
* transient error behavior
* cache/revalidation behavior
* dashboard propagation
* sitemap behavior
* robots behavior
* customer-flow behavior

For Batch 5 additionally protect:

* cart behavior
* checkout behavior
* pricing behavior
* coupon behavior
* payment behavior
* callback behavior
* booking behavior
* currency behavior
* authentication/session behavior

---

# GUARD RULE 1 — BACKEND REMAINS THE SOURCE OF TRUTH

Laravel remains authoritative.

Never:

* copy production API data into frontend source
* create local production datasets
* create JSON fallbacks
* hardcode production prices
* hardcode tour/cart records
* hardcode discounts
* hardcode payment results
* create alternative frontend business logic

The frontend must continue rendering live backend-controlled data through the existing architecture.

---

# GUARD RULE 2 — NO NEW API CONTRACTS

Do NOT:

* add a new API endpoint
* replace an endpoint
* rename payload fields
* change HTTP methods
* add extra business requests for presentation purposes
* change API request ownership
* duplicate existing requests

Before and after must have the same business request inventory.

---

# GUARD RULE 3 — NO BUSINESS LOGIC REWRITE

Presentation may change completely.

Business logic may not.

For modified commerce code, inspect all:

* handlers
* payload builders
* pricing calculations
* discount calculations
* coupon logic
* cart mutations
* checkout submission
* payment method mapping
* redirects
* callbacks
* cookie usage
* auth/token handling

If extraction is needed:

MOVE LOGIC.

DO NOT REWRITE LOGIC.

---

# GUARD RULE 4 — ERROR SEMANTICS

Do not alter the existing distinction between:

* confirmed 404 / not found
* validation failure
* API/backend failure
* payment failure
* transient/server failure

Do not convert an error into:

* fake success
* fallback production content
* empty state
* 404

unless that was already the existing behavior.

---

# GUARD RULE 5 — LOCALE & ROUTING

Preserve exactly:

* English root URLs
* locale-prefixed URLs
* `/en` rejection
* locale switching
* redirect behavior
* callback routes
* cart/checkout routes
* success routes
* payment redirect routes

Do not normalize or clean route behavior during UI work.

---

# GUARD RULE 6 — SEO

No Batch 5 UI requirement is allowed to modify:

* metadata architecture
* canonical
* hreflang
* JSON-LD
* robots
* sitemap
* generateMetadata behavior

Commerce redesign is not permission to touch SEO infrastructure.

---

# GUARD RULE 7 — CACHE / REVALIDATION

Do not change:

* cache settings
* revalidation periods
* force-cache/no-store semantics
* CDN behavior
* data propagation behavior

Do not add client fetching just to avoid existing server caching.

---

# GUARD RULE 8 — DASHBOARD PROPAGATION

Any backend-controlled content or commerce data must continue to update through the existing backend/API system.

The redesign must not introduce a frontend-deployment dependency for ordinary backend changes.

---

# GUARD RULE 9 — BRAND SOURCE OF TRUTH

The UI may change completely.

The brand may not.

Read and reuse the actual approved values from:

* `DESIGN.md`
* existing `:root`
* existing design tokens
* approved logo assets

Use the exact approved Sun Pyramids colors:

Anchor Blue:
`#163a96`

Amber:
`#f7951d`

Trip Sans:
retained

Do not invent alternative shades.

Do not introduce a competing primary brand color.

---

# GUARD RULE 10 — COLOR USAGE

Continue the approved visual rule:

Anchor Blue:

* headings
* important text hierarchy
* secondary actions
* selected states
* controls
* structural accents

Do NOT use large full-section blue backgrounds unnecessarily.

Amber:

* primary conversion CTA
* small active markers
* restrained emphasis

Do NOT spread Amber across large surfaces.

---

# GUARD RULE 11 — PERFORMANCE

The visual redesign must not require:

* Tailwind enablement
* new UI framework
* animation framework
* GSAP
* Three.js
* WebGL
* new icon library
* new carousel library
* new form/state library

Expected new dependencies:

ZERO.

Prefer:

* Server Components
* React
* SCSS
* native HTML
* native CSS
* small existing client islands

---

# GUARD RULE 12 — EXTERNAL UI SOURCES

MotionSites, 21st.dev, and React Bits may be used for actual visual patterns.

But:

USE THE PATTERN.

DO NOT IMPORT THE ARCHITECTURE.

Before adopting an element verify:

* FREE
* SSR safe
* dynamic-data safe
* accessible
* mobile safe
* reduced-motion safe
* acceptable JS cost
* no heavy runtime requirement

Reject an element if it conflicts with any protected rule.

---

# GUARD RULE 13 — PROTECTED FILE DISCIPLINE

These files/areas are protected unless an existing verified bug requires otherwise:

* `lib/api.ts`
* `lib/client-api.ts`
* `lib/data.ts`
* `lib/config.ts`
* `lib/resolve-api-result.ts`
* `lib/seo.ts`
* `lib/locales.ts`
* `lib/route-helpers.ts`
* `lib/trips-query.ts`
* `lib/local-date.ts`
* `lib/currencies.ts`
* `lib/recaptcha.ts`
* `lib/sanitize-html.ts`
* `lib/sitemap/**`
* `proxy.ts`
* `next.config.ts`
* `types/api.ts`

If the redesign appears to require modifying one:

STOP AND REPORT.

Do not modify it automatically.

---

# GUARD RULE 14 — CUSTOMER FLOWS

Visual changes must not alter:

* defaults
* min/max values
* validation
* query consumption
* request payloads
* endpoint selection
* success behavior
* failure behavior
* redirect behavior

A visually better interaction that changes flow semantics is still a regression.

---

# GUARD RULE 15 — NO NEW MARKETING CLAIMS

Do not invent:

* guarantees
* refund claims
* free cancellation claims
* no-hidden-fee claims
* secure-payment claims
* review counts
* rankings
* response times
* awards
* savings percentages
* operator guarantees

Use only:

* Laravel/CMS data
* approved project configuration
* approved existing static brand content

If a claim has no approved source:

REMOVE IT.

---

# GUARD RULE 16 — SHARED COMPONENT IMPACT

If a shared component is modified, audit every route that consumes it.

Do not accidentally redesign or alter behavior on routes belonging to another Batch.

For every shared component modification report:

* intended routes
* out-of-scope routes
* behavioral effect
* visual effect

If an out-of-scope route changes unintentionally:

restore compatibility.

---

# GUARD RULE 17 — DIFF-BASED VERIFICATION

Do not rely only on runtime tests.

Before completion compare actual source diffs for:

* API calls
* payloads
* handlers
* pricing
* coupon logic
* payment IDs
* redirects
* callbacks
* cookies
* protected files

The report must be based on code inspection, not assumptions.

---

# GUARD RULE 18 — CORRECT BASELINE

All parity checks must compare against the actual current Batch base:

`origin/main`

after all previously approved Batches have been merged.

Do NOT compare against an outdated local baseline.

---

# GUARD RULE 19 — HARD STOP CONDITIONS

STOP immediately if implementation requires:

* API schema change
* backend change
* protected query change
* pricing rewrite
* coupon logic rewrite
* payment method change
* redirect allowlist change
* metadata change
* route semantics change
* locale semantics change
* cache/revalidation change
* new state architecture
* framework migration
* new heavy dependency

Return:

`BLOCKED BY PROTECTED CONTRACT`

instead of working around it.

---

# GUARD RULE 20 — REQUIRED FINAL GUARD REPORT

At the end of Batch 5 include a dedicated:

## Guard Rules Verification

Report each:

API source of truth:
PASS / FAIL

API endpoints:
PASS / FAIL

Payloads:
PASS / FAIL

Routing:
PASS / FAIL

Locale:
PASS / FAIL

`/en` rejection:
PASS / FAIL

Metadata:
PASS / FAIL

Canonical:
PASS / FAIL

Hreflang:
PASS / FAIL

JSON-LD:
PASS / FAIL

404 semantics:
PASS / FAIL

Transient errors:
PASS / FAIL

Cache/revalidation:
PASS / FAIL

Dashboard propagation:
PASS / FAIL

Sitemap:
PASS / FAIL

Customer flow:
PASS / FAIL

Cart:
PASS / FAIL

Pricing:
PASS / FAIL

Coupon:
PASS / FAIL

Checkout:
PASS / FAIL

Payment:
PASS / FAIL

Callbacks:
PASS / FAIL

Brand colors:
PASS / FAIL

Dynamic backend:
PASS / FAIL

Performance guard:
PASS / FAIL

New production data hardcoded:
NO

New dependencies:
NONE

Protected file diff:
ZERO

Unauthorized business logic changes:
ZERO

If ANY Guard Rule fails:

PR STATUS MUST BE:

`NEEDS CORRECTION`

or

`BLOCKED BY PROTECTED CONTRACT`

Never:

`READY TO MERGE`.