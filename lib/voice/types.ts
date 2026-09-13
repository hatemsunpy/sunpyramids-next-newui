// Normalized internal voice-recognition types shared by the adapter, the
// browser implementation, and the React hook. These types deliberately do not
// reference browser globals so the whole voice layer stays SSR-safe.

import type { ApiPage, Locale } from "@/types/api";

// Deterministic internal error codes normalized from browser
// SpeechRecognitionErrorEvent.error values (and our own unsupported state).
export type SpeechErrorCode =
  | "permission"
  | "no-speech"
  | "audio-capture"
  | "network"
  | "language-unavailable"
  | "aborted"
  | "unsupported"
  | "unknown";

export type SpeechError = {
  code: SpeechErrorCode;
  // True when the abort originated from our own cancel()/cleanup action.
  intentional?: boolean;
  // The raw browser error string when one was reported (never shown to users).
  rawCode?: string;
};

// Finite, deterministic recognition lifecycle exposed by the hook.
export type SpeechStatus = "idle" | "starting" | "listening" | "processing" | "error";

// Maps a raw browser SpeechRecognition error string onto the internal model.
// Unknown or newer vendor error codes degrade to "unknown" instead of crashing.
const BROWSER_ERROR_CODES: Record<string, SpeechErrorCode> = {
  "not-allowed": "permission",
  "service-not-allowed": "permission",
  "no-speech": "no-speech",
  "audio-capture": "audio-capture",
  "network": "network",
  "language-not-supported": "language-unavailable",
  "language-unavailable": "language-unavailable",
  "aborted": "aborted",
};

export function normalizeSpeechErrorCode(raw: string): SpeechErrorCode {
  return BROWSER_ERROR_CODES[raw] ?? "unknown";
}

// ---------------------------------------------------------------------------
// Phase 5: deterministic voice-query interpretation model.
//
// Three separated stages consume these types:
//   1. parse-voice-query.ts  — pure linguistics, NO taxonomy access.
//   2. entity-match.ts       — resolves mentions against live caller data.
//   3. capability-mapper.ts  — maps resolved intent onto existing search
//                              capabilities, emitting per-field statuses.
// ---------------------------------------------------------------------------

export type DurationUnit = "days" | "nights" | "weeks";

export type VoiceDuration = {
  value: number;
  // The unit is ALWAYS preserved as spoken. Unit conversion (weeks → days,
  // nights → suggested days) happens only in the capability mapper, never
  // in the parser.
  unit: DurationUnit;
  approximate: boolean;
  raw: string;
};

// Deterministic match provenance. These are heuristic implementation scores,
// NOT measured probabilities — see ConfidenceLevel documentation in the
// capability mapper. Only exact/alias/normalized may auto-apply.
export type ConfidenceLevel =
  | "exact"
  | "alias"
  | "normalized"
  | "fuzzy"
  | "ambiguous"
  | "unresolved";

export type VoiceEntityMention = {
  // Spoken fragment as transcribed (trimmed, original casing/punctuation).
  raw: string;
  // Normalized comparison form (see normalize.ts).
  normalized: string;
  confidence: ConfidenceLevel;
};

export type VoiceCategoryMention = VoiceEntityMention & {
  // Candidate root-category slugs from lexicon aliases, in match order.
  // Empty when the mention matched a known child concept only.
  hints: string[];
  // True when a longer child-concept phrase consumed the span (e.g. "luxury
  // nile cruise"), blocking silent promotion to the root category.
  childBlocked: boolean;
};

export type VoiceTravelers = {
  total?: number;
  adults?: number;
  children?: number;
};

export type VoiceIntent = {
  rawTranscript: string;
  locale: Locale;
  origin?: VoiceEntityMention;
  destination?: VoiceEntityMention;
  duration?: VoiceDuration;
  // Every additional complete duration expression in transcript order.
  // The parser never drops a second mention ("3 nights 4 days" keeps both);
  // the capability mapper — never the parser — decides which explicit value
  // is applicable, ambiguous, or unsupported. Set only when 2+ mentions exist.
  additionalDurations?: VoiceDuration[];
  // Calendar month 1–12. Recognized but not applicable to current search.
  month?: number;
  travelers?: VoiceTravelers;
  category?: VoiceCategoryMention;
  privacy?: "private" | "group";
  // Residual recognized tourism tokens, informational only. Phase 5 NEVER
  // turns these into search constraints (no hidden title-search fallback).
  keywords?: string[];
};

export type CapabilityStatus =
  | "applicable"
  | "ambiguous"
  | "invalid"
  | "recognized-but-not-applicable"
  | "requires-confirmation";

export type EntityCandidate = {
  slug: string;
  title?: string;
};

export type DestinationCapability =
  | { field: "destination"; status: "applicable"; slug: string; title?: string; raw: string }
  | { field: "destination"; status: "requires-confirmation"; slug: string; candidates: EntityCandidate[]; raw: string }
  | { field: "destination"; status: "ambiguous"; candidates: EntityCandidate[]; raw: string }
  | { field: "destination"; status: "recognized-but-not-applicable" | "unresolved"; raw?: string };

export type DurationCapability =
  | { field: "duration"; status: "applicable"; value: number; searchKey: "days"; raw: string }
  | { field: "duration"; status: "requires-confirmation"; source: VoiceDuration; suggestedValue: number; raw: string }
  // Multiple explicit day-equivalent mentions that disagree ("5 days or 7
  // days"): neither is silently applied; Phase 6 asks the user to choose.
  | { field: "duration"; status: "ambiguous"; candidates: VoiceDuration[]; raw: string }
  | { field: "duration"; status: "invalid"; raw: string }
  | { field: "duration"; status: "recognized-but-not-applicable"; raw: string };

export type CategoryCapability =
  | { field: "category"; status: "applicable"; slug: string; searchKey: "main"; raw: string }
  | { field: "category"; status: "ambiguous"; candidates: EntityCandidate[]; raw: string }
  | { field: "category"; status: "recognized-but-not-applicable" | "unresolved"; raw?: string };

export type InformationalCapability = {
  field: "origin" | "month" | "travelers" | "privacy";
  status: "recognized-but-not-applicable";
  // Preserved structured value for future review UI (Phase 6 renders it).
  value: VoiceEntityMention | number | VoiceTravelers | "private" | "group";
  raw?: string;
};

export type CapabilityField =
  | DestinationCapability
  | DurationCapability
  | CategoryCapability
  | InformationalCapability;

export type CapabilityResult = {
  intent: VoiceIntent;
  fields: CapabilityField[];
};

// Subset of live taxonomy data the resolver/mapper accepts from callers.
// Callers pass CURRENT server/prop data — the parser layer never fetches.
export type VoiceTaxonomyInput = {
  destinations: ApiPage[];
  rootCategories: ApiPage[];
};