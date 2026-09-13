// Deterministic locale-aware voice-query parser.
//
// Pure linguistics: transcript + locale -> VoiceIntent. NO taxonomy access,
// NO network, NO randomness, NO dates/clocks. Entity resolution against live
// data happens in entity-match.ts; search applicability in
// capability-mapper.ts. Identical inputs always produce identical outputs.

import type { Locale } from "@/types/api";
import { lexiconFor } from "./lexicons";
import type { LocaleLexicon } from "./lexicons/types";
import { isDigitToken, normalizeForMatch } from "./normalize";
import type {
  VoiceCategoryMention,
  VoiceDuration,
  VoiceEntityMention,
  VoiceIntent,
  VoiceTravelers,
} from "./types";

export type RichToken = { raw: string; norm: string };

// Split raw text on whitespace, then normalize each piece, keeping a
// back-reference so extracted mentions can report the original spelling.
// A raw piece may expand to several normalized tokens ("well-known" ->
// "well known"); all of them share the same raw piece.
export function tokenizeWithRaw(rawTranscript: string): RichToken[] {
  const out: RichToken[] = [];
  for (const piece of rawTranscript.split(/\s+/)) {
    if (!piece) continue;
    const norm = normalizeForMatch(piece);
    if (!norm) continue;
    for (const part of norm.split(" ")) {
      out.push({ raw: piece, norm: part });
    }
  }
  return out;
}

type PhraseHit = { phrase: string; start: number; end: number };

// Longest-first greedy phrase matching over normalized tokens. Returns hits
// in position order; spans never overlap.
function findPhrases(tokens: RichToken[], phrases: string[]): PhraseHit[] {
  const byLength = [...new Set(phrases)]
    .map((p) => ({ phrase: p, parts: p.split(" ").filter(Boolean) }))
    .filter((p) => p.parts.length > 0)
    .sort((a, b) => b.parts.length - a.parts.length);
  const claimed = new Array<boolean>(tokens.length).fill(false);
  const hits: PhraseHit[] = [];
  for (const { phrase, parts } of byLength) {
    for (let i = 0; i + parts.length <= tokens.length; i += 1) {
      if (claimed.slice(i, i + parts.length).some(Boolean)) continue;
      let ok = true;
      for (let k = 0; k < parts.length; k += 1) {
        if (tokens[i + k].norm !== parts[k]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let k = 0; k < parts.length; k += 1) claimed[i + k] = true;
      hits.push({ phrase, start: i, end: i + parts.length });
    }
  }
  hits.sort((a, b) => a.start - b.start);
  return hits;
}

export function spanRaw(tokens: RichToken[], start: number, end: number): string {
  const seen: string[] = [];
  for (let i = start; i < end; i += 1) {
    const raw = tokens[i].raw;
    if (seen[seen.length - 1] !== raw) seen.push(raw);
  }
  return seen.join(" ").trim();
}

export function spanNorm(tokens: RichToken[], start: number, end: number): string {
  return tokens
    .slice(start, end)
    .map((t) => t.norm)
    .join(" ");
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

export type ParsedNumber = { value: number; length: number };

// Deterministic cardinal parsing for the travel domain (durations 1-45,
// traveler counts). Covers digits, single-word numerals, and spaced
// compounds (tens + [glue] + ones; German ones + glue + tens).
export function numberAt(tokens: RichToken[], index: number, lex: LocaleLexicon): ParsedNumber | null {
  const token = tokens[index]?.norm;
  if (!token) return null;
  if (isDigitToken(token)) return { value: Number(token), length: 1 };
  if (lex.compoundOrder === "ones-first") {
    // German "fünf und zwanzig": the compound check must run BEFORE the
    // single-word fallback, otherwise "fünf" returns 5 immediately.
    const one = lex.compoundOnes[token];
    if (one !== undefined && one >= 1 && one <= 9 && lex.compoundGlue.includes(tokens[index + 1]?.norm ?? "")) {
      const ten = lex.compoundTens[tokens[index + 2]?.norm ?? ""];
      if (ten !== undefined) return { value: ten + one, length: 3 };
    }
  } else {
    const ten = lex.compoundTens[token];
    if (ten !== undefined) {
      // Optional glue then ones: "twenty five", "vingt et un", "dix-sept".
      let j = index + 1;
      if (lex.compoundGlue.includes(tokens[j]?.norm ?? "")) j += 1;
      const one = lex.compoundOnes[tokens[j]?.norm ?? ""];
      if (one !== undefined && one >= 1 && one <= 9) {
        return { value: ten + one, length: j - index + 1 };
      }
      return { value: ten, length: 1 };
    }
  }
  const single = lex.numberWords[token];
  if (single !== undefined) return { value: single, length: 1 };
  return null;
}

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

function unitOf(token: string, lex: LocaleLexicon): "days" | "nights" | "weeks" | null {
  if (lex.dayUnits.includes(token)) return "days";
  if (lex.nightUnits.includes(token)) return "nights";
  if (lex.weekUnits.includes(token)) return "weeks";
  return null;
}

// Token indexes where an approximate marker occurs (bigrams reported at
// their start index).
function approximateOccurrences(tokens: RichToken[], lex: LocaleLexicon): number[] {
  const singles = new Set<string>();
  const bigrams = new Set<string>();
  for (const marker of lex.approximateMarkers) {
    const parts = marker.split(" ").filter(Boolean);
    if (parts.length === 1) singles.add(parts[0]);
    else if (parts.length === 2) bigrams.add(`${parts[0]} ${parts[1]}`);
  }
  const out: number[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (singles.has(tokens[i].norm)) out.push(i);
    if (i + 1 < tokens.length && bigrams.has(`${tokens[i].norm} ${tokens[i + 1].norm}`)) out.push(i);
  }
  return out;
}

// An approximate marker flags a duration mention only when it sits inside
// the mention's ±3 window AND no other mention's number is strictly closer.
// Without the nearest-mention rule, "around" in "around 3 nights, 4 days"
// would bleed onto the explicitly exact "4 days" and wrongly downgrade it.
// Ties attach to every tied mention (conservative: more confirmation, never
// a silent wrong filter).
function attributeApproximate(
  hits: { start: number; end: number }[],
  markers: number[],
): boolean[] {
  return hits.map((hit, index) => {
    const lo = hit.start - 3;
    const hi = hit.end + 2;
    for (const marker of markers) {
      if (marker < lo || marker > hi) continue;
      const distance = Math.abs(marker - hit.start);
      let nearer = false;
      for (let other = 0; other < hits.length; other += 1) {
        if (other === index) continue;
        if (Math.abs(marker - hits[other].start) < distance) {
          nearer = true;
          break;
        }
      }
      if (!nearer) return true;
    }
    return false;
  });
}

// All complete duration expressions in transcript order. The parser keeps
// every mention ("3 nights 4 days" yields both) and never prefers one
// because the backend supports days — selection belongs to the mapper.
function extractDurations(
  tokens: RichToken[],
  lex: LocaleLexicon,
): { duration: VoiceDuration; end: number }[] {
  type RawHit = { value: number; unit: VoiceDuration["unit"]; start: number; end: number };
  const found: RawHit[] = [];
  let i = 0;
  while (i < tokens.length) {
    // Glued number+unit adjectives ("siebentägige" = 7 days): single token
    // carrying both value and days meaning. Only populated where the
    // language genuinely glues numerals to units.
    const glued = lex.gluedDayAdjectives?.[tokens[i].norm];
    if (glued !== undefined) {
      found.push({ value: glued, unit: "days", start: i, end: i + 1 });
      i += 1;
      continue;
    }
    const num = numberAt(tokens, i, lex);
    if (!num) {
      i += 1;
      continue;
    }
    const unitToken = tokens[i + num.length];
    if (!unitToken) {
      i += 1;
      continue;
    }
    const unit = unitOf(unitToken.norm, lex);
    if (!unit) {
      i += 1;
      continue;
    }
    // Date guard: a number directly following a month name is a calendar
    // date ("May 5 days" is not a thing users say), never a duration.
    const prev = tokens[i - 1]?.norm;
    if (prev && lex.monthNames[prev] !== undefined) {
      i += 1;
      continue;
    }
    found.push({ value: num.value, unit, start: i, end: i + num.length + 1 });
    i = i + num.length + 1;
  }
  const markers = approximateOccurrences(tokens, lex);
  const flags = attributeApproximate(found, markers);
  return found.map((hit, index) => ({
    duration: {
      value: hit.value,
      unit: hit.unit,
      approximate: flags[index],
      raw: spanRaw(tokens, hit.start, hit.end),
    },
    end: hit.end,
  }));
}

// ---------------------------------------------------------------------------
// Month
// ---------------------------------------------------------------------------

function isDayNumber(token: string | undefined): boolean {
  if (!token || !isDigitToken(token)) return false;
  const value = Number(token);
  return value >= 1 && value <= 31;
}

function extractMonth(tokens: RichToken[], lex: LocaleLexicon): { month: number; end: number } | null {
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i].norm;
    const month = lex.monthNames[token];
    if (month === undefined) continue;
    if (lex.ambiguousMonths.includes(token)) {
      // e.g. English "may" (modal verb): require preposition or day-number
      // context ("in May", "May 5", "5 May").
      const left = tokens[i - 1]?.norm ?? "";
      const right = tokens[i + 1]?.norm ?? "";
      const prepositional = lex.monthPrepositions.includes(left);
      const dated = isDayNumber(left) || isDayNumber(right);
      if (!prepositional && !dated) continue;
    }
    return { month, end: i + 1 };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Travelers
// ---------------------------------------------------------------------------

function nounBucket(token: string, lex: LocaleLexicon): "total" | "adults" | "children" | null {
  if (lex.peopleNouns.includes(token) || lex.infantNouns.includes(token)) return "total";
  if (lex.adultNouns.includes(token)) return "adults";
  if (lex.childNouns.includes(token)) return "children";
  return null;
}

function extractTravelers(tokens: RichToken[], lex: LocaleLexicon): VoiceTravelers | null {
  let total: number | undefined;
  let adults: number | undefined;
  let children: number | undefined;
  for (let i = 0; i < tokens.length; i += 1) {
    const num = numberAt(tokens, i, lex);
    if (!num) continue;
    const noun = tokens[i + num.length]?.norm;
    if (!noun) continue;
    const bucket = nounBucket(noun, lex);
    if (!bucket) continue;
    if (bucket === "total" && total === undefined) total = num.value;
    if (bucket === "adults" && adults === undefined) adults = num.value;
    if (bucket === "children" && children === undefined) children = num.value;
  }
  if (total === undefined && adults === undefined && children === undefined) return null;
  const result: VoiceTravelers = {};
  if (total !== undefined) result.total = total;
  if (adults !== undefined) result.adults = adults;
  if (children !== undefined) result.children = children;
  if (result.total === undefined && (adults !== undefined || children !== undefined)) {
    result.total = (adults ?? 0) + (children ?? 0);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

function extractPrivacy(tokens: RichToken[], lex: LocaleLexicon): "private" | "group" | undefined {
  const privateHits = findPhrases(tokens, lex.privateWords);
  const groupHits = findPhrases(tokens, lex.groupWords);
  const firstPrivate = privateHits[0]?.start ?? Number.POSITIVE_INFINITY;
  const firstGroup = groupHits[0]?.start ?? Number.POSITIVE_INFINITY;
  if (firstPrivate === Number.POSITIVE_INFINITY && firstGroup === Number.POSITIVE_INFINITY) return undefined;
  return firstPrivate <= firstGroup ? "private" : "group";
}

// ---------------------------------------------------------------------------
// Category (explicit lexemes only — never inferred from other entities)
// ---------------------------------------------------------------------------

function extractCategory(tokens: RichToken[], lex: LocaleLexicon): VoiceCategoryMention | null {
  const childHits = findPhrases(tokens, lex.childPhrases);
  const childSpans: [number, number][] = childHits.map((h) => [h.start, h.end]);

  const aliasHits = findPhrases(
    tokens,
    lex.categoryAliases.map((a) => a.phrase),
  );
  const bySlug = new Map<string, { slug: string; start: number; end: number }>();
  for (const hit of aliasHits) {
    const overlapsChild = childSpans.some(([s, e]) => hit.start < e && s < hit.end);
    if (overlapsChild) continue;
    const slug = lex.categoryAliases.find((a) => a.phrase === hit.phrase)?.slug;
    if (!slug) continue;
    if (!bySlug.has(slug)) bySlug.set(slug, { slug, start: hit.start, end: hit.end });
  }

  const hints = [...bySlug.values()].map((h) => h.slug);
  if (hints.length === 0 && childSpans.length === 0) return null;

  const firstStart = Math.min(
    ...(childHits.map((h) => h.start)),
    ...[...bySlug.values()].map((h) => h.start),
  );
  const firstEnd = Math.max(
    ...(childHits.map((h) => h.end)),
    ...[...bySlug.values()].map((h) => h.end),
  );
  return {
    raw: spanRaw(tokens, firstStart, firstEnd),
    normalized: spanNorm(tokens, firstStart, firstEnd),
    confidence: "alias",
    hints,
    childBlocked: childSpans.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Origin / destination (directional grammar preserved)
// ---------------------------------------------------------------------------

function matchMarkerAt(tokens: RichToken[], index: number, markers: string[]): number {
  let best = 0;
  for (const marker of markers) {
    const parts = marker.split(" ").filter(Boolean);
    if (parts.length === 0 || index + parts.length > tokens.length) continue;
    let ok = true;
    for (let k = 0; k < parts.length; k += 1) {
      if (tokens[index + k].norm !== parts[k]) {
        ok = false;
        break;
      }
    }
    if (ok && parts.length > best) best = parts.length;
  }
  return best;
}

function isPlaceStopToken(norm: string, lex: LocaleLexicon): boolean {
  if (!norm) return true;
  if (numberAt([{ raw: "", norm } as RichToken], 0, lex)) return true;
  if (lex.monthNames[norm] !== undefined) return true;
  if (
    lex.dayUnits.includes(norm) ||
    lex.nightUnits.includes(norm) ||
    lex.weekUnits.includes(norm) ||
    lex.peopleNouns.includes(norm) ||
    lex.adultNouns.includes(norm) ||
    lex.childNouns.includes(norm) ||
    lex.infantNouns.includes(norm) ||
    lex.privateWords.includes(norm) ||
    lex.groupWords.includes(norm) ||
    lex.clauseMarkers.includes(norm)
  ) {
    return true;
  }
  // A new directional/visit marker always ends the current span.
  if (
    matchMarkerAt([{ raw: "", norm } as RichToken], 0, lex.fromMarkers) > 0 ||
    matchMarkerAt([{ raw: "", norm } as RichToken], 0, lex.toMarkers) > 0 ||
    matchMarkerAt([{ raw: "", norm } as RichToken], 0, lex.visitMarkers) > 0
  ) {
    return true;
  }
  return false;
}

function capturePlaceSpan(
  tokens: RichToken[],
  from: number,
  lex: LocaleLexicon,
  maxTokens = 4,
): { start: number; end: number } | null {
  let start = from;
  // Skip leading articles ("the Pyramids" -> "Pyramids").
  while (start < tokens.length && lex.articles.includes(tokens[start].norm)) start += 1;
  let end = start;
  while (end < tokens.length && end - start < maxTokens && !isPlaceStopToken(tokens[end].norm, lex)) {
    end += 1;
  }
  // Strip trailing articles ("Cairo the" can occur after normalization splits).
  while (end - 1 >= start && lex.articles.includes(tokens[end - 1].norm)) end -= 1;
  if (end <= start) return null;
  const joined = spanNorm(tokens, start, end);
  if (!joined) return null;
  // A span that IS a known non-place word is never a place ("de luxe").
  if (lex.nonPlaceWords.includes(joined)) return null;
  // A single common word (infinitive verbs like "go", generic travel words)
  // is never a place: "want to go to Aswan" must not claim "go" and block
  // the real destination later in the sentence.
  if (end - start === 1 && lex.nonPlaceWords.includes(tokens[start].norm)) return null;
  return { start, end };
}

function mentionOf(tokens: RichToken[], span: { start: number; end: number }): VoiceEntityMention {
  return {
    raw: spanRaw(tokens, span.start, span.end),
    normalized: spanNorm(tokens, span.start, span.end),
    confidence: "unresolved",
  };
}

function extractDirections(
  tokens: RichToken[],
  lex: LocaleLexicon,
): { origin?: VoiceEntityMention; destination?: VoiceEntityMention } {
  let origin: VoiceEntityMention | undefined;
  let destination: VoiceEntityMention | undefined;
  // Backward origin inference for bare "X to Y" ("Luxor to Aswan"): when a
  // to-marker yields a destination and no origin was found, the tokens
  // immediately before the marker form an origin candidate — unless any of
  // them is a generic non-place word ("trip to Aswan" must NOT infer origin
  // "trip"). Conservative: at most 3 tokens, none numeric/month/unit/noun.
  const inferBackwardOrigin = (markerIndex: number): void => {
    if (origin) return;
    const parts: RichToken[] = [];
    for (let j = markerIndex - 1; j >= 0 && parts.length < 3; j -= 1) {
      const norm = tokens[j].norm;
      if (
        matchMarkerAt(tokens, j, lex.fromMarkers) > 0 ||
        matchMarkerAt(tokens, j, lex.toMarkers) > 0 ||
        matchMarkerAt(tokens, j, lex.visitMarkers) > 0 ||
        lex.clauseMarkers.includes(norm) ||
        lex.monthNames[norm] !== undefined ||
        numberAt(tokens, j, lex) !== null ||
        unitOf(norm, lex) !== null ||
        nounBucket(norm, lex) !== null ||
        lex.privateWords.includes(norm) ||
        lex.groupWords.includes(norm)
      ) {
        break;
      }
      parts.unshift(tokens[j]);
    }
    const cleaned = parts.filter((t) => !lex.articles.includes(t.norm));
    if (cleaned.length === 0) return;
    if (cleaned.some((t) => lex.nonPlaceWords.includes(t.norm))) return;
    const start = tokens.indexOf(cleaned[0]);
    const end = tokens.indexOf(cleaned[cleaned.length - 1]) + 1;
    origin = mentionOf(tokens, { start, end });
  };
  let i = 0;
  while (i < tokens.length) {
    const fromLen = matchMarkerAt(tokens, i, lex.fromMarkers);
    if (fromLen > 0) {
      const span = capturePlaceSpan(tokens, i + fromLen, lex);
      if (span && !origin) origin = mentionOf(tokens, span);
      i = span ? span.end : i + fromLen;
      continue;
    }
    const toLen = matchMarkerAt(tokens, i, lex.toMarkers);
    if (toLen > 0) {
      const next = tokens[i + toLen]?.norm ?? "";
      // Numeric guard: "for two people", "in zwei Wochen" — a number after
      // the marker means traveler/duration context, never a destination.
      const nextIsNumber = numberAt(tokens, i + toLen, lex) !== null;
      // Month guard: "in November" is a month, handled by month extraction.
      const nextIsMonth = lex.monthNames[next] !== undefined;
      if (!nextIsNumber && !nextIsMonth) {
        const span = capturePlaceSpan(tokens, i + toLen, lex);
        if (span && !destination) {
          destination = mentionOf(tokens, span);
          inferBackwardOrigin(i);
        }
        i = span ? span.end : i + toLen;
        continue;
      }
      i += toLen;
      continue;
    }
    const visitLen = matchMarkerAt(tokens, i, lex.visitMarkers);
    if (visitLen > 0) {
      const span = capturePlaceSpan(tokens, i + visitLen, lex);
      if (span && !destination) destination = mentionOf(tokens, span);
      i = span ? span.end : i + visitLen;
      continue;
    }
    i += 1;
  }
  return { origin, destination };
}

// ---------------------------------------------------------------------------
// Bare-place segmentation (telegraphic queries: "Cairo 5 days").
// ---------------------------------------------------------------------------

export type BareSpan = { start: number; end: number };

// Maximal runs of tokens that could belong to a place name: anything that is
// NOT a number, month, duration unit, traveler noun, privacy word, clause
// marker, or directional/visit marker. Pure linguistics — no taxonomy. The
// resolver matches these spans against live data; generic words ("trip")
// simply fail to resolve there.
export function barePlaceSegments(tokens: RichToken[], lex: LocaleLexicon): BareSpan[] {
  const out: BareSpan[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (isPlaceStopToken(tokens[i].norm, lex)) {
      i += 1;
      continue;
    }
    let j = i;
    while (j < tokens.length && !isPlaceStopToken(tokens[j].norm, lex)) j += 1;
    if (j > i) out.push({ start: i, end: j });
    i = j;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Residual tourism keywords (informational only — never search constraints)
// ---------------------------------------------------------------------------

function extractKeywords(
  tokens: RichToken[],
  lex: LocaleLexicon,
  consumed: [number, number][],
): string[] {
  const hits = findPhrases(tokens, lex.tourismWords).filter(
    (h) => !consumed.some(([s, e]) => h.start < e && s < h.end),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const hit of hits) {
    if (!seen.has(hit.phrase)) {
      seen.add(hit.phrase);
      out.push(hit.phrase);
    }
    if (out.length >= 8) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Chinese: regex passes over the normalized string (no whitespace to split)
// ---------------------------------------------------------------------------

const ZH_DIGIT = "[一二三四五六七八九两]";
const ZH_TEN = "十";
// Shared Han/Arabic numeral pattern: Arabic digits, lone 十 (=10),
// 十+digit (十五=15), digits+十[+digit] (二十=20, 四十五=45).
const ZH_NUM = `(?:\\d+|十${ZH_DIGIT}?|${ZH_DIGIT}+十?${ZH_DIGIT}?)`;

function parseZhNumeral(raw: string): number | null {
  if (/^\d+$/.test(raw)) return Number(raw);
  if (/百|千|万/.test(raw)) return null;
  if (!raw.includes(ZH_TEN)) {
    if (raw.length !== 1) return null;
    const digitMap: Record<string, number> = {
      一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
    };
    return digitMap[raw] ?? null;
  }
  const parts = raw.split(ZH_TEN);
  if (parts.length !== 2) return null;
  const left = parts[0] === "" ? 1 : parseZhNumeral(parts[0]);
  const right = parts[1] === "" ? 0 : parseZhNumeral(parts[1]);
  if (left === null || right === null) return null;
  return left * 10 + right;
}

type ZhSpan = { start: number; end: number };

function findZhMonths(normalized: string): { month: number; span: ZhSpan }[] {
  const out: { month: number; span: ZhSpan }[] = [];
  const re = new RegExp(`(${ZH_NUM})月(份)?`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    const value = parseZhNumeral(m[1]);
    if (value !== null && value >= 1 && value <= 12) {
      out.push({ month: value, span: { start: m.index, end: m.index + m[0].length } });
    }
  }
  return out;
}

function findZhDurations(
  normalized: string,
  raw: string,
): { duration: VoiceDuration; span: ZhSpan }[] {
  const out: { duration: VoiceDuration; span: ZhSpan }[] = [];
  const re = new RegExp(
    `(大约|大概)?(${ZH_NUM})(天|日|周|星期|礼拜|晚|夜)(左右|上下)?`,
    "g",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    const unitRaw = m[3];
    const start = m.index + (m[1] ? m[1].length : 0);
    // 日 directly following a month expression is a calendar date (6月5日),
    // never a duration — mirrors the token-path date guard.
    if (unitRaw === "日") {
      const before = normalized.slice(Math.max(0, start - 4), start);
      if (/(?:\d+|[一二三四五六七八九两十]+)月$/.test(before)) continue;
    }
    const value = parseZhNumeral(m[2]);
    if (value === null) continue;
    const unit = unitRaw === "天" || unitRaw === "日" ? "days" : unitRaw === "周" || unitRaw === "星期" || unitRaw === "礼拜" ? "weeks" : "nights";
    const approximate = Boolean(m[1] || m[4]);
    const span = { start, end: m.index + m[0].length };
    out.push({
      duration: {
        value,
        unit,
        approximate,
        raw: raw.length === normalized.length ? raw.slice(span.start, span.end) : m[0],
      },
      span,
    });
  }
  return out;
}

function trimZhSpan(normalized: string, start: number, end: number): ZhSpan | null {
  const leading = /^(?:这|那|个|的)+/;
  const trailing = /(?:的|地|得|着|了|过|吗|呢|吧|啊|和|跟|与|去|玩|旅游|旅行|度假|住|出发|到达|抵达)+$/;
  let s = start;
  let e = end;
  const head = normalized.slice(s, e).replace(leading, "");
  s += normalized.slice(s, e).length - head.length;
  const trimmed = normalized.slice(s, e).replace(trailing, "");
  e = s + trimmed.length;
  if (e <= s) return null;
  return { start: s, end: e };
}

// Cut a captured zh place span before any content tail that belongs to a
// different intent field: durations ("阿斯旺的七天…"), category phrases,
// traveler nouns, months, or clause particles. Without this, greedy spans
// like "阿斯旺的七天尼罗河游轮" could never resolve to a live destination.
function cutZhContentTail(normalized: string, span: ZhSpan, lex: LocaleLexicon): ZhSpan {
  const text = normalized.slice(span.start, span.end);
  const cuts: number[] = [];
  const dur = text.match(new RegExp(`${ZH_NUM}(?:天|日|周|星期|礼拜|晚|夜)`));
  if (dur?.index !== undefined) cuts.push(dur.index);
  const month = text.match(new RegExp(`${ZH_NUM}月`));
  if (month?.index !== undefined) cuts.push(month.index);
  for (const phrase of [...lex.childPhrases, ...lex.categoryAliases.map((a) => a.phrase)]) {
    const index = text.indexOf(phrase);
    if (index > 0) cuts.push(index);
  }
  const traveler = text.match(new RegExp(`${ZH_NUM}(?:个|名|位)?(?:人|成人|大人|儿童|小孩|婴儿|宝宝|游客|旅客)`));
  if (traveler?.index !== undefined && traveler.index > 0) cuts.push(traveler.index);
  const particle = text.search(/[和跟与去玩]/);
  if (particle > 0) cuts.push(particle);
  if (cuts.length === 0) return span;
  return { start: span.start, end: span.start + Math.min(...cuts) };
}

function findZhDirections(
  normalized: string,
  lex: LocaleLexicon,
): { origin?: VoiceEntityMention; destination?: VoiceEntityMention } {
  // "去年" (last year) contains 去 — it is not a direction marker.
  const cleaned = normalized.replace(/去年/g, "  ");
  const result: { origin?: VoiceEntityMention; destination?: VoiceEntityMention } = {};

  const mentionText = (span: ZhSpan): string | null => {
    const cut = cutZhContentTail(cleaned, span, lex);
    const trimmed = trimZhSpan(cleaned, cut.start, cut.end);
    if (!trimmed) return null;
    const text = cleaned.slice(trimmed.start, trimmed.end);
    if (!text) return null;
    // Pure numbers are quantities, never places.
    if (/^(?:\d+|[一二三四五六七八九两十]+)$/.test(text)) return null;
    // A bare month expression after the marker is a month, not a place.
    if (new RegExp(`^${ZH_NUM}月(份)?$`).test(text)) return null;
    return text;
  };
  const build = (text: string): VoiceEntityMention => ({ raw: text, normalized: text, confidence: "unresolved" });

  const pair = cleaned.match(/(?:从|自从)([^，。,.!?]+?)(?:到|去|往|前往|抵达|在)([^，。,.!?]+)/);
  if (pair?.index !== undefined) {
    const g1start = pair.index + pair[0].indexOf(pair[1]);
    const g2start = pair.index + pair[0].lastIndexOf(pair[2]);
    const originText = mentionText({ start: g1start, end: g1start + pair[1].length });
    const destText = mentionText({ start: g2start, end: g2start + pair[2].length });
    if (originText) result.origin = build(originText);
    if (destText) result.destination = build(destText);
    if (result.origin || result.destination) return result;
  }

  // Lone 从 ("从卢克索出发") yields an origin without a destination — but
  // only when no paired 到/去/etc. exists (otherwise the pair branch above
  // owns that 从 and re-matching it would swallow the destination too).
  const pairMatched = pair !== null;
  if (!pairMatched && !result.origin) {
    const loneFrom = cleaned.match(/(?:从|自从)([^，。,.!?]+)/);
    if (loneFrom?.index !== undefined) {
      const text = mentionText({
        start: loneFrom.index + loneFrom[0].indexOf(loneFrom[1]),
        end: loneFrom.index + loneFrom[0].indexOf(loneFrom[1]) + loneFrom[1].length,
      });
      if (text) result.origin = build(text);
    }
  }

  if (!result.destination) {
    const single = cleaned.match(/(?:到|去|往|前往|抵达|在|参观|游览|游玩)([^，。,.!?]+)/);
    if (single?.index !== undefined) {
      const text = mentionText({
        start: single.index + single[0].indexOf(single[1]),
        end: single.index + single[0].indexOf(single[1]) + single[1].length,
      });
      if (text) {
        result.destination = build(text);
        // Backward origin for bare "X到Y" ("卢克索到阿斯旺"): take text back
        // to the previous delimiter/start, guarded like the token path.
        // Functional characters (pronouns, 想/要/去/在, particles) anywhere
        // in the candidate reject it: "我想去开罗" yields no origin.
        if (!result.origin) {
          const before = cleaned.slice(0, single.index).split(/[，。,.!?]/).pop() ?? "";
          const candidate = before.replace(/^(?:这|那|个|的)+/, "").trim();
          const functional = new Set(
            lex.nonPlaceWords.filter((w) => w.length === 1),
          );
          const hasFunctional = [...candidate].some((ch) => functional.has(ch));
          if (
            candidate &&
            candidate.length <= 6 &&
            !hasFunctional &&
            !lex.nonPlaceWords.includes(candidate) &&
            !/^(?:\d+|[一二三四五六七八九两十]+)$/.test(candidate) &&
            !new RegExp(`^${ZH_NUM}月(份)?$`).test(candidate)
          ) {
            result.origin = build(candidate);
          }
        }
      }
    }
  }

  return result;
}

function findZhTravelers(normalized: string): VoiceTravelers | null {
  let adults: number | undefined;
  let children: number | undefined;
  let total: number | undefined;
  // Colloquial "两大一小" (2 adults, 1 child).
  const family = normalized.match(new RegExp(`(${ZH_NUM})大(${ZH_NUM})小`));
  if (family) {
    adults = parseZhNumeral(family[1]) ?? undefined;
    children = parseZhNumeral(family[2]) ?? undefined;
  }
  const re = new RegExp(`(${ZH_NUM})(?:个|名|位)?(人|成人|大人|儿童|小孩|婴儿|宝宝|游客|旅客)`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    const value = parseZhNumeral(m[1]);
    if (value === null) continue;
    const noun = m[2];
    if ((noun === "成人" || noun === "大人") && adults === undefined) adults = value;
    else if ((noun === "儿童" || noun === "小孩") && children === undefined) children = value;
    else if (total === undefined) total = value;
  }
  if (total === undefined && adults === undefined && children === undefined) return null;
  const result: VoiceTravelers = {};
  if (total !== undefined) result.total = total;
  if (adults !== undefined) result.adults = adults;
  if (children !== undefined) result.children = children;
  if (result.total === undefined && (adults !== undefined || children !== undefined)) {
    result.total = (adults ?? 0) + (children ?? 0);
  }
  return result;
}

function findZhPrivacy(normalized: string): "private" | "group" | undefined {
  const markers: { word: string; value: "private" | "group" }[] = [
    { word: "私人", value: "private" },
    { word: "私家", value: "private" },
    { word: "包团", value: "private" },
    { word: "单独", value: "private" },
    { word: "团队", value: "group" },
    { word: "团体", value: "group" },
    { word: "拼团", value: "group" },
    { word: "跟团", value: "group" },
  ];
  let best: { index: number; value: "private" | "group" } | null = null;
  for (const { word, value } of markers) {
    const index = normalized.indexOf(word);
    if (index >= 0 && (!best || index < best.index)) best = { index, value };
  }
  return best?.value;
}

function findZhCategory(
  normalized: string,
  lex: LocaleLexicon,
): { hints: string[]; childBlocked: boolean; raw: string } | null {
  type Span = { start: number; end: number; slug?: string; child: boolean };
  const spans: Span[] = [];
  const claim = (start: number, end: number, slug: string | undefined, child: boolean) => {
    if (spans.some((s) => start < s.end && s.start < end)) return;
    spans.push({ start, end, slug, child });
  };
  const phrases = [...lex.childPhrases.map((p) => ({ p, child: true })), ...lex.categoryAliases.map((a) => ({ p: a.phrase, child: false }))].sort(
    (a, b) => b.p.length - a.p.length,
  );
  for (const { p, child } of phrases) {
    let from = 0;
    for (;;) {
      const index = normalized.indexOf(p, from);
      if (index < 0) break;
      const slug = child ? undefined : lex.categoryAliases.find((a) => a.phrase === p)?.slug;
      claim(index, index + p.length, slug, child);
      from = index + p.length;
    }
  }
  if (spans.length === 0) return null;
  spans.sort((a, b) => a.start - b.start);
  const hints: string[] = [];
  for (const span of spans) {
    if (span.slug && !hints.includes(span.slug)) hints.push(span.slug);
  }
  return {
    hints,
    childBlocked: spans.some((s) => s.child),
    raw: normalized.slice(spans[0].start, spans[spans.length - 1].end),
  };
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function parseVoiceQuery(transcript: string, locale: Locale): VoiceIntent {
  const lex = lexiconFor(locale);
  const intent: VoiceIntent = { rawTranscript: transcript, locale };

  if (!transcript.trim()) return intent;

  if (locale === "zh") {
    return parseZh(transcript, intent, lex);
  }

  const tokens = tokenizeWithRaw(transcript);

  const durationHits = extractDurations(tokens, lex);
  if (durationHits.length > 0) {
    intent.duration = durationHits[0].duration;
    if (durationHits.length > 1) {
      intent.additionalDurations = durationHits.slice(1).map((h) => h.duration);
    }
  }

  const monthHit = extractMonth(tokens, lex);
  if (monthHit) intent.month = monthHit.month;

  const travelers = extractTravelers(tokens, lex);
  if (travelers) intent.travelers = travelers;

  const privacy = extractPrivacy(tokens, lex);
  if (privacy) intent.privacy = privacy;

  const category = extractCategory(tokens, lex);
  const categorySpans: [number, number][] = [];
  if (category) {
    // Re-derive claimed spans so keyword extraction can skip them.
    const hits = findPhrases(tokens, [
      ...lex.childPhrases,
      ...lex.categoryAliases.map((a) => a.phrase),
    ]);
    for (const hit of hits) categorySpans.push([hit.start, hit.end]);
    intent.category = category;
  }

  const { origin, destination } = extractDirections(tokens, lex);
  if (origin) intent.origin = origin;
  if (destination) intent.destination = destination;

  const keywords = extractKeywords(tokens, lex, categorySpans);
  if (keywords.length > 0) intent.keywords = keywords;

  return intent;
}

function parseZh(transcript: string, intent: VoiceIntent, lex: LocaleLexicon): VoiceIntent {
  const normalized = normalizeForMatch(transcript);
  if (!normalized) return intent;
  const raw = transcript;

  const months = findZhMonths(normalized);
  if (months.length > 0) intent.month = months[0].month;

  const durationHits = findZhDurations(normalized, raw);
  if (durationHits.length > 0) {
    intent.duration = durationHits[0].duration;
    if (durationHits.length > 1) {
      intent.additionalDurations = durationHits.slice(1).map((h) => h.duration);
    }
  }

  const travelers = findZhTravelers(normalized);
  if (travelers) intent.travelers = travelers;

  const privacy = findZhPrivacy(normalized);
  if (privacy) intent.privacy = privacy;

  const category = findZhCategory(normalized, lex);
  const consumed: [number, number][] = [];
  if (category) {
    intent.category = {
      raw: category.raw,
      normalized: category.raw,
      confidence: "alias",
      hints: category.hints,
      childBlocked: category.childBlocked,
    };
    // Re-derive spans for keyword exclusion.
    const phrases = [...lex.childPhrases, ...lex.categoryAliases.map((a) => a.phrase)].sort((a, b) => b.length - a.length);
    for (const phrase of phrases) {
      let from = 0;
      for (;;) {
        const index = normalized.indexOf(phrase, from);
        if (index < 0) break;
        if (!consumed.some(([s, e]) => index < e && s < index + phrase.length)) {
          consumed.push([index, index + phrase.length]);
        }
        from = index + phrase.length;
      }
    }
  }

  const { origin, destination } = findZhDirections(normalized, lex);
  if (origin) intent.origin = origin;
  if (destination) intent.destination = destination;

  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const word of lex.tourismWords) {
    const index = normalized.indexOf(word);
    if (index < 0 || seen.has(word)) continue;
    if (consumed.some(([s, e]) => index < e && s < index + word.length)) continue;
    seen.add(word);
    keywords.push(word);
    if (keywords.length >= 8) break;
  }
  if (keywords.length > 0) intent.keywords = keywords;

  return intent;
}