// Destination entity resolution against live caller-supplied data.
//
// The parser only understands language; THIS module decides whether a spoken
// mention corresponds to a real, currently available destination. It never
// invents slugs and never copies production data — every resolved slug comes
// straight from the ApiPage list the caller passed in.
//
// Resolution order (§13 of the approved plan):
//   1. exact slug → 2. exact live title → 3. approved alias (validated) →
//   4. normalized token containment → 5. fuzzy suggestion (never auto-apply)

import type { ApiPage, Locale } from "@/types/api";
import { normalizeForMatch } from "./normalize";
import { barePlaceSegments, spanNorm, spanRaw, tokenizeWithRaw } from "./parse-voice-query";
import type { EntityCandidate, VoiceEntityMention } from "./types";
import type { LocaleLexicon } from "./lexicons/types";

export type DestinationResolution =
  | { status: "exact"; slug: string; title?: string }
  | { status: "alias"; slug: string; title?: string }
  | { status: "normalized"; slug: string; title?: string }
  | { status: "fuzzy"; slug: string; candidates: EntityCandidate[] }
  | { status: "ambiguous"; candidates: EntityCandidate[] }
  | { status: "unresolved" };

type IndexEntry = { slug: string; title?: string; kind: "slug" | "title" };

function destinationTitle(destination: ApiPage): string | undefined {
  return destination.title || destination.name || undefined;
}

function buildIndex(destinations: ApiPage[]): Map<string, IndexEntry[]> {
  const index = new Map<string, IndexEntry[]>();
  const add = (key: string, entry: IndexEntry) => {
    const normalized = normalizeForMatch(key);
    if (!normalized) return;
    const list = index.get(normalized) ?? [];
    list.push(entry);
    index.set(normalized, list);
  };
  for (const destination of destinations) {
    if (!destination.slug) continue;
    add(destination.slug, { slug: destination.slug, title: destinationTitle(destination), kind: "slug" });
    const title = destinationTitle(destination);
    if (title) add(title, { slug: destination.slug, title, kind: "title" });
  }
  return index;
}

function uniqueCandidates(entries: IndexEntry[]): EntityCandidate[] {
  const seen = new Map<string, EntityCandidate>();
  for (const entry of entries) {
    if (!seen.has(entry.slug)) seen.set(entry.slug, { slug: entry.slug, title: entry.title });
  }
  return [...seen.values()];
}

// Bounded Levenshtein distance with early exit past maxDistance.
export function levenshteinCapped(a: string, b: string, maxDistance: number): number {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min(prev[j] + 1, next[j - 1] + 1, prev[j - 1] + cost);
      if (next[j] < rowMin) rowMin = next[j];
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    prev = next;
  }
  return prev[b.length];
}

export function resolveDestination(
  mention: VoiceEntityMention,
  destinations: ApiPage[],
  lexicon: LocaleLexicon,
): DestinationResolution {
  const query = mention.normalized.trim().toLowerCase();
  if (!query || destinations.length === 0) return { status: "unresolved" };
  const index = buildIndex(destinations);

  // 1–2. Exact slug or exact live title.
  const exact = index.get(query) ?? [];
  if (exact.length > 0) {
    const slugExact = exact.find((e) => e.kind === "slug");
    if (slugExact) return { status: "exact", slug: slugExact.slug, title: slugExact.title };
    if (exact.length === 1) return { status: "exact", slug: exact[0].slug, title: exact[0].title };
    return { status: "ambiguous", candidates: uniqueCandidates(exact) };
  }

  // 3. Approved alias: variant -> canonical spelling, then the canonical
  // spelling must itself resolve against LIVE slugs/titles. An alias whose
  // canonical form matches nothing is rejected (no silent mapping).
  const alias = lexicon.placeAliases.find((a) => a.variant === query);
  if (alias) {
    const canonical = normalizeForMatch(alias.canonical);
    const live = index.get(canonical) ?? [];
    if (live.length > 0) {
      const slugHit = live.find((e) => e.kind === "slug") ?? live[0];
      return { status: "alias", slug: slugHit.slug, title: slugHit.title };
    }
  }

  // 4. Normalized token containment: every mention token appears in a live
  // title's tokens (e.g. "luxor" inside "Luxor Tours") or vice versa.
  const queryTokens = new Set(query.split(" ").filter(Boolean));
  const contained: IndexEntry[] = [];
  for (const destination of destinations) {
    if (!destination.slug) continue;
    const titleTokens = new Set(
      normalizeForMatch(destinationTitle(destination) ?? "").split(" ").filter(Boolean),
    );
    const slugTokens = new Set(normalizeForMatch(destination.slug).split(" ").filter(Boolean));
    const covers = (needles: Set<string>, haystack: Set<string>) =>
      needles.size > 0 && [...needles].every((t) => haystack.has(t));
    if (covers(queryTokens, titleTokens) || covers(titleTokens, queryTokens) || covers(queryTokens, slugTokens)) {
      contained.push({ slug: destination.slug, title: destinationTitle(destination), kind: "title" });
    }
  }
  const containedUnique = uniqueCandidates(contained);
  if (containedUnique.length === 1) {
    return { status: "normalized", slug: containedUnique[0].slug, title: containedUnique[0].title };
  }
  if (containedUnique.length > 1) {
    return { status: "ambiguous", candidates: containedUnique };
  }

  // 5. Fuzzy suggestion only (never auto-applied by callers). Conservative:
  // mention must be at least 4 chars; distance cap scales with length.
  if (query.length >= 4) {
    const maxDistance = query.length <= 5 ? 1 : 2;
    const fuzzy: EntityCandidate[] = [];
    const seen = new Set<string>();
    for (const destination of destinations) {
      if (!destination.slug) continue;
      const keys = [normalizeForMatch(destination.slug)];
      const title = destinationTitle(destination);
      if (title) keys.push(normalizeForMatch(title));
      for (const key of keys) {
        if (!key || Math.abs(key.length - query.length) > maxDistance) continue;
        if (levenshteinCapped(query, key, maxDistance) <= maxDistance && !seen.has(destination.slug)) {
          seen.add(destination.slug);
          fuzzy.push({ slug: destination.slug, title });
        }
      }
    }
    if (fuzzy.length === 1) {
      return { status: "fuzzy", slug: fuzzy[0].slug, candidates: fuzzy };
    }
    if (fuzzy.length > 1) {
      return { status: "ambiguous", candidates: fuzzy };
    }
  }

  return { status: "unresolved" };
}

// ---------------------------------------------------------------------------
// Bare-place fallback for telegraphic queries ("Cairo 5 days").
// ---------------------------------------------------------------------------

export type BareDestinationScan =
  | { status: "none" }
  | { status: "single"; mention: VoiceEntityMention; resolution: DestinationResolution }
  | { status: "multiple"; mentions: VoiceEntityMention[]; candidates: EntityCandidate[] };

// Conservative by construction:
// - Runs only when explicit directional parsing found NO origin/destination
//   (callers enforce this); it never overrides directional language.
// - Auto-applies only exact live slug/title, an approved alias resolving to
//   exactly one live destination, or a safe normalized exact match. Fuzzy
//   never auto-applies (surfaced as requires-confirmation by callers).
// - Two or more distinct live places → ambiguous, never an invented
//   origin/destination direction.
// - No geographic inference: attractions resolve only if they ARE a live
//   destination (exact slug/title). There is no Pyramids→Cairo style mapping
//   anywhere in this module.
const MAX_BARE_SPAN_TOKENS = 4;

export function scanBareDestinations(
  transcript: string,
  locale: Locale,
  lexicon: LocaleLexicon,
  destinations: ApiPage[],
): BareDestinationScan {
  if (!transcript.trim() || destinations.length === 0) return { status: "none" };
  if (locale === "zh") return scanBareZh(transcript, lexicon, destinations);

  const tokens = tokenizeWithRaw(transcript);
  const auto = new Map<string, { mention: VoiceEntityMention; rank: number; order: number; title?: string }>();
  const fuzzy = new Map<string, { mention: VoiceEntityMention; order: number; candidates: EntityCandidate[] }>();
  const ambiguous: EntityCandidate[] = [];
  let order = 0;
  const consider = (mention: VoiceEntityMention, resolution: DestinationResolution): void => {
    if (resolution.status === "exact" || resolution.status === "alias" || resolution.status === "normalized") {
      const rank = resolution.status === "exact" ? 0 : resolution.status === "alias" ? 1 : 2;
      const prev = auto.get(resolution.slug);
      if (!prev || rank < prev.rank) {
        auto.set(resolution.slug, {
          mention,
          rank,
          order: prev?.order ?? order,
          title: resolution.title,
        });
      }
    } else if (resolution.status === "fuzzy") {
      if (!auto.has(resolution.slug) && !fuzzy.has(resolution.slug)) {
        fuzzy.set(resolution.slug, { mention, order, candidates: resolution.candidates });
      }
    } else if (resolution.status === "ambiguous") {
      for (const candidate of resolution.candidates) {
        if (!ambiguous.some((a) => a.slug === candidate.slug)) ambiguous.push(candidate);
      }
    }
    order += 1;
  };

  for (const segment of barePlaceSegments(tokens, lexicon)) {
    for (let start = segment.start; start < segment.end; start += 1) {
      for (let length = 1; length <= MAX_BARE_SPAN_TOKENS && start + length <= segment.end; length += 1) {
        const norms: string[] = [];
        for (let k = start; k < start + length; k += 1) norms.push(tokens[k].norm);
        // A span of pure articles ("le", "the") is never a place.
        if (norms.every((n) => lexicon.articles.includes(n))) continue;
        const mention: VoiceEntityMention = {
          raw: spanRaw(tokens, start, start + length),
          normalized: spanNorm(tokens, start, start + length),
          confidence: "unresolved",
        };
        consider(mention, resolveDestination(mention, destinations, lexicon));
      }
    }
  }

  const slugs = [...auto.keys()];
  if (slugs.length === 1) {
    const slug = slugs[0];
    const best = auto.get(slug);
    if (!best) return { status: "none" };
    const status = best.rank === 0 ? "exact" : best.rank === 1 ? "alias" : "normalized";
    const resolution: DestinationResolution =
      status === "exact"
        ? { status, slug, title: best.title }
        : status === "alias"
          ? { status, slug, title: best.title }
          : { status, slug, title: best.title };
    return { status: "single", mention: best.mention, resolution };
  }
  if (slugs.length > 1 || ambiguous.length > 1) {
    const ordered = slugs
      .map((slug) => ({ slug, order: auto.get(slug)?.order ?? 0, title: auto.get(slug)?.title }))
      .sort((a, b) => a.order - b.order);
    const candidates: EntityCandidate[] = ordered.map((o) => ({ slug: o.slug, title: o.title }));
    for (const candidate of ambiguous) {
      if (!candidates.some((a) => a.slug === candidate.slug)) candidates.push(candidate);
    }
    return {
      status: "multiple",
      mentions: ordered.map((o) => auto.get(o.slug)?.mention).filter((m): m is VoiceEntityMention => Boolean(m)),
      candidates,
    };
  }
  if (ambiguous.length === 1) {
    return { status: "multiple", mentions: [], candidates: ambiguous };
  }
  const fuzzySlugs = [...fuzzy.keys()];
  if (fuzzySlugs.length === 1) {
    const hit = fuzzy.get(fuzzySlugs[0]);
    if (!hit) return { status: "none" };
    return {
      status: "single",
      mention: hit.mention,
      resolution: { status: "fuzzy", slug: fuzzySlugs[0], candidates: hit.candidates },
    };
  }
  if (fuzzySlugs.length > 1) {
    const candidates: EntityCandidate[] = [];
    const mentions: VoiceEntityMention[] = [];
    for (const slug of fuzzySlugs) {
      const hit = fuzzy.get(slug);
      if (!hit) continue;
      mentions.push(hit.mention);
      for (const candidate of hit.candidates) {
        if (!candidates.some((a) => a.slug === candidate.slug)) candidates.push(candidate);
      }
    }
    return { status: "multiple", mentions, candidates };
  }
  return { status: "none" };
}

// Chinese has no whitespace to segment, so the bare scan matches live
// destination keys (and validated aliases) as substrings of the spaceless
// normalized transcript, longest-first with overlap claiming.
function scanBareZh(
  transcript: string,
  lexicon: LocaleLexicon,
  destinations: ApiPage[],
): BareDestinationScan {
  const spaceless = normalizeForMatch(transcript).replace(/\s+/g, "");
  if (!spaceless) return { status: "none" };
  type Key = { key: string; slug: string; title?: string; kind: "slug" | "title" | "alias" };
  const keys: Key[] = [];
  for (const destination of destinations) {
    if (!destination.slug) continue;
    const title = destination.title || destination.name || undefined;
    const slugKey = normalizeForMatch(destination.slug).replace(/\s+/g, "");
    if (slugKey.length >= 2) keys.push({ key: slugKey, slug: destination.slug, title, kind: "slug" });
    if (title) {
      const titleKey = normalizeForMatch(title).replace(/\s+/g, "");
      if (titleKey.length >= 2 && titleKey !== slugKey) {
        keys.push({ key: titleKey, slug: destination.slug, title, kind: "title" });
      }
    }
  }
  const live = new Map<string, { slug: string; title?: string }>();
  for (const key of keys) {
    if (!live.has(key.key)) live.set(key.key, { slug: key.slug, title: key.title });
  }
  for (const alias of lexicon.placeAliases) {
    const variant = normalizeForMatch(alias.variant).replace(/\s+/g, "");
    if (variant.length < 2) continue;
    const canonical = normalizeForMatch(alias.canonical).replace(/\s+/g, "");
    const target = live.get(canonical);
    if (target) keys.push({ key: variant, slug: target.slug, title: target.title, kind: "alias" });
  }
  const claimed = new Array<boolean>(spaceless.length).fill(false);
  const hits: { index: number; key: string; slug: string; title?: string; kind: Key["kind"] }[] = [];
  for (const { key, slug, title, kind } of [...keys].sort((a, b) => b.key.length - a.key.length)) {
    let from = 0;
    for (;;) {
      const index = spaceless.indexOf(key, from);
      if (index < 0) break;
      let overlap = false;
      for (let k = index; k < index + key.length; k += 1) {
        if (claimed[k]) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        for (let k = index; k < index + key.length; k += 1) claimed[k] = true;
        hits.push({ index, key, slug, title, kind });
      }
      from = index + key.length;
    }
  }
  hits.sort((a, b) => a.index - b.index);
  const slugs = [...new Set(hits.map((h) => h.slug))];
  if (slugs.length === 0) return { status: "none" };
  if (slugs.length === 1) {
    const first = hits[0];
    const resolution: DestinationResolution =
      first.kind === "alias"
        ? { status: "alias", slug: first.slug, title: first.title }
        : { status: "exact", slug: first.slug, title: first.title };
    return {
      status: "single",
      mention: { raw: first.key, normalized: first.key, confidence: "unresolved" },
      resolution,
    };
  }
  return {
    status: "multiple",
    mentions: slugs.map((slug) => {
      const first = hits.find((h) => h.slug === slug);
      const text = first?.key ?? slug;
      return { raw: text, normalized: text, confidence: "unresolved" as const };
    }),
    candidates: slugs.map((slug) => {
      const first = hits.find((h) => h.slug === slug);
      return { slug, title: first?.title };
    }),
  };
}