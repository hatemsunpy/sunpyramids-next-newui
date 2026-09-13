// Locale-safe deterministic transcript normalization.
//
// The raw transcript is NEVER mutated in place: callers keep the original
// and use these helpers to derive comparison forms. Normalization is fully
// deterministic (no randomness, no locale sniffing beyond the caller's locale).

// Normalize for comparison: NFKD decompose (folds fullwidth digits used in
// CJK input), strip combining diacritics, lowercase, turn punctuation
// (hyphens, apostrophes, quotes, slashes) into spaces, collapse whitespace.
// CJK Han text passes through untouched (lowercasing is a no-op there).
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // combining diacriticals block
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tokenize a normalized string on whitespace. CJK text without spaces stays
// a single token — zh parsing uses dedicated regex passes instead.
export function tokensOf(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}

// True when a normalized string is a plain ASCII digit run (any locale may
// speak digits that ASR transcribes as 0-9).
export function isDigitToken(token: string): boolean {
  return /^\d+$/.test(token);
}

// Canonical lookup key: normalized forms are exactly what lexicon tables
// store, so matching is a plain dictionary hit with no per-call transform.
export function lookupKey(raw: string): string {
  return normalizeForMatch(raw);
}