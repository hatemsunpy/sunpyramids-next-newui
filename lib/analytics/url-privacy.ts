// URL privacy rules for analytics. Personal identifiers must never reach the
// data layer through URLs; marketing attribution parameters are kept.

// Attribution keys the sanitized page_location keeps; everything NOT in this
// allowlist (and the utm_ prefix) is dropped, so unknown or user-supplied
// query names are never echoed into the data layer.
const ATTRIBUTION_QUERY_KEYS = new Set([
  "gclid",
  "gclsrc",
  "dclid",
  "fbclid",
  "msclkid",
  "ttclid",
  "gbraid",
  "wbraid",
  "gad_source",
]);

export function isAttributionQueryKey(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.startsWith("utm_") || ATTRIBUTION_QUERY_KEYS.has(lower);
}

// Tracking-safe URL: scheme + host + path + attribution-only query, no
// fragment. Malformed input returns "" (rejected, never echoed back); non-http
// protocols rejected, credentials dropped, oversized query keys/values discarded.
export function sanitizePageLocation(href: string, base?: string): string {
  if (typeof href !== "string" || !href.trim()) return "";
  try {
    const fallbackBase = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(href, base || fallbackBase);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    const kept = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (key.length <= 64 && value.length <= 256 && isAttributionQueryKey(key)) kept.append(key, value);
    });
    // Rebuilt from parts so credentials (user:pass@host) cannot survive; a
    // URL object would keep them inside url.toString().
    return `${url.protocol}//${url.host}${url.pathname}${kept.toString() ? `?${kept}` : ""}`;
  } catch {
    return "";
  }
}

// Removes the listed personal identifiers from the address bar after the app
// has consumed them (legacy links stay functional; history and GTM's history
// listener only see the sanitized URL). Other parameters are kept.
export function stripQueryParamsOnSelf(keys: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of keys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (!changed) return;
    const search = url.searchParams.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${search ? `?${search}` : ""}${url.hash}`,
    );
  } catch {
    // History failures must never break the page experience.
  }
}

// Personal identifiers the app itself has historically placed in URLs. Any
// analytics-facing read consumes these and then strips them.
export const SENSITIVE_URL_PARAMS = ["email", "otp", "token", "name"] as const;

// Exact URLSearchParams reads for control flags: substring matching mishandles
// keys that appear inside unrelated values.
export function isUnessentialOptOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("no-third-party") === "1";
  } catch {
    return false;
  }
}

// Presence-only check for sensitive parameter names; values are never read or
// returned.
export function hasSensitiveQuery(query: string): boolean {
  if (!query || typeof query !== "string") return false;
  try {
    const params = new URLSearchParams(query);
    return SENSITIVE_URL_PARAMS.some((key) => params.has(key));
  } catch {
    return false;
  }
}

// Fail-closed document decision: a page that arrived with sensitive
// parameters in its own URL or referrer must not initialize third-party
// tracking or emit app signals for this document's lifetime, regardless of
// the flag. Captured at module load - before any component effect can consume
// or scrub the parameters (?name=, ?email=, ?otp= are stripped after the app
// reads them) - so a parameter-consuming effect can never re-enable tracking.
let initialDocumentSensitive: boolean | null = null;

function captureSensitiveDocument(): boolean {
  if (typeof window === "undefined") return false;
  if (hasSensitiveQuery(window.location.search)) return true;
  if (typeof document !== "undefined" && document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      if (hasSensitiveQuery(referrer.search)) return true;
    } catch {
      // An unparseable referrer stays out of the decision.
    }
  }
  return false;
}

// A full page load starts a fresh document; tests re-capture after
// re-positioning the URL with this.
export function resetDocumentSensitiveDecision(): void {
  initialDocumentSensitive = captureSensitiveDocument();
}

if (typeof window !== "undefined") {
  resetDocumentSensitiveDecision();
}

export function isDocumentSensitive(): boolean {
  return initialDocumentSensitive ?? false;
}