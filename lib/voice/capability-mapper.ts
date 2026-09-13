// Search Capability Mapper: VoiceIntent (+ resolved entities) -> per-field
// classifications against the EXISTING /trips + Find Trip capabilities.
//
// The mapper never invents filters. It only classifies what the parser
// understood into: applicable | ambiguous | invalid |
// recognized-but-not-applicable | requires-confirmation. Phase 6 renders
// review UI from these; Phase 5 produces no URLs, no navigation, no fetches.

import { resolveDestination, scanBareDestinations } from "./entity-match";
import { lexiconFor } from "./lexicons";
import type {
  CapabilityField,
  CapabilityResult,
  DurationCapability,
  VoiceDuration,
  VoiceIntent,
  VoiceTaxonomyInput,
} from "./types";

// Find Trip duration capability: the visible duration select spans 1–45.
const MIN_DURATION_DAYS = 1;
const MAX_DURATION_DAYS = 45;

// Only this root slug is treated as the single-cruise strong alias target.
// "cruise" alone resolves to it ONLY when the live taxonomy contains it.
const NILE_CRUISES_SLUG = "nile-cruises";

function liveRootSlugs(taxonomy: VoiceTaxonomyInput): Set<string> {
  return new Set(
    (taxonomy.rootCategories ?? [])
      .map((c) => c.slug)
      .filter((slug): slug is string => Boolean(slug)),
  );
}

function inRangeDays(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_DURATION_DAYS && value <= MAX_DURATION_DAYS;
}

export function mapCapabilities(intent: VoiceIntent, taxonomy: VoiceTaxonomyInput): CapabilityResult {
  const fields: CapabilityField[] = [];
  const safeTaxonomy: VoiceTaxonomyInput = {
    destinations: taxonomy?.destinations ?? [],
    rootCategories: taxonomy?.rootCategories ?? [],
  };

  // -- Destination ---------------------------------------------------------
  // Explicit directional parsing owns origin/destination whenever it found
  // either. The bare-place fallback runs ONLY when both are absent ("Cairo
  // 5 days"); "from Luxor" therefore never gains an invented destination.
  if (intent.destination) {
    const mention = intent.destination;
    if (safeTaxonomy.destinations.length === 0) {
      fields.push({ field: "destination", status: "recognized-but-not-applicable", raw: mention.raw });
    } else {
      const resolved = resolveDestination(mention, safeTaxonomy.destinations, lexiconFor(intent.locale));
      if (resolved.status === "exact" || resolved.status === "alias" || resolved.status === "normalized") {
        fields.push({ field: "destination", status: "applicable", slug: resolved.slug, title: resolved.title, raw: mention.raw });
      } else if (resolved.status === "fuzzy") {
        fields.push({ field: "destination", status: "requires-confirmation", slug: resolved.slug, candidates: resolved.candidates, raw: mention.raw });
      } else if (resolved.status === "ambiguous") {
        fields.push({ field: "destination", status: "ambiguous", candidates: resolved.candidates, raw: mention.raw });
      } else {
        fields.push({ field: "destination", status: "unresolved", raw: mention.raw });
      }
    }
  } else if (!intent.origin && safeTaxonomy.destinations.length > 0) {
    const scan = scanBareDestinations(
      intent.rawTranscript,
      intent.locale,
      lexiconFor(intent.locale),
      safeTaxonomy.destinations,
    );
    if (scan.status === "single") {
      const resolution = scan.resolution;
      if (resolution.status === "exact" || resolution.status === "alias" || resolution.status === "normalized") {
        fields.push({
          field: "destination",
          status: "applicable",
          slug: resolution.slug,
          title: resolution.title,
          raw: scan.mention.raw,
        });
      } else if (resolution.status === "fuzzy") {
        fields.push({
          field: "destination",
          status: "requires-confirmation",
          slug: resolution.slug,
          candidates: resolution.candidates,
          raw: scan.mention.raw,
        });
      }
    } else if (scan.status === "multiple") {
      fields.push({
        field: "destination",
        status: "ambiguous",
        candidates: scan.candidates,
        raw: scan.mentions.map((m) => m.raw).join(" ") || intent.rawTranscript.trim(),
      });
    }
  }

  // -- Duration ------------------------------------------------------------
  // The parser hands over EVERY explicit mention; the mapper selects.
  // Selection policy (textual order never decides capability):
  // - One unambiguous exact days/weeks value → applicable (prefer the
  //   explicitly spoken days mention: "3 nights 4 days" applies 4 days
  //   because the USER said 4 days — never 3 nights → 4 days). Other
  //   mentions are retained as secondary recognized information; an
  //   approximate nights phrase never downgrades an exact days value.
  // - Equivalent expressions of one value ("two weeks / 14 days") →
  //   consistent, applied once.
  // - Conflicting day values ("5 days or 7 days", "about 5 days, maybe 7
  //   days") → ambiguous; neither silently applied.
  const durationMentions = intent.duration
    ? [intent.duration, ...(intent.additionalDurations ?? [])]
    : [];
  const convertedDays = (duration: VoiceDuration): number =>
    duration.unit === "weeks" ? duration.value * 7 : duration.value;
  const isDayUnit = (duration: VoiceDuration): boolean =>
    duration.unit === "days" || duration.unit === "weeks";
  const cruiseContext =
    (intent.category?.hints ?? []).length === 1 &&
    (intent.category?.hints ?? [])[0] === NILE_CRUISES_SLUG;
  const classifySingleDuration = (duration: VoiceDuration): DurationCapability => {
    if (duration.unit === "days") {
      if (duration.approximate) {
        // Approximate durations are never silently narrowed to an exact filter.
        return { field: "duration", status: "requires-confirmation", source: duration, suggestedValue: duration.value, raw: duration.raw };
      }
      if (inRangeDays(duration.value)) {
        return { field: "duration", status: "applicable", value: duration.value, searchKey: "days", raw: duration.raw };
      }
      return { field: "duration", status: "invalid", raw: duration.raw };
    }
    if (duration.unit === "weeks") {
      const days = duration.value * 7;
      if (duration.approximate) {
        return { field: "duration", status: "requires-confirmation", source: duration, suggestedValue: days, raw: duration.raw };
      }
      if (inRangeDays(days)) {
        return { field: "duration", status: "applicable", value: days, searchKey: "days", raw: duration.raw };
      }
      // Out-of-range converted values are invalid — never clamped.
      return { field: "duration", status: "invalid", raw: duration.raw };
    }
    // Nights: recognized-but-not-directly-applicable. With explicit Nile
    // Cruise context the mapper MAY propose N+1 as a structured suggestion
    // (requires confirmation); the parser never claims N+1 is universal.
    if (!duration.approximate && cruiseContext) {
      return {
        field: "duration",
        status: "requires-confirmation",
        source: duration,
        suggestedValue: duration.value + 1,
        raw: duration.raw,
      };
    }
    return { field: "duration", status: "recognized-but-not-applicable", raw: duration.raw };
  };
  if (durationMentions.length === 1) {
    fields.push(classifySingleDuration(durationMentions[0]));
  } else if (durationMentions.length > 1) {
    const exactDay = durationMentions.filter((m) => !m.approximate && isDayUnit(m));
    const distinctValues = [...new Set(exactDay.map(convertedDays))];
    const conflictingApproximate = durationMentions.filter(
      (m) =>
        m.approximate &&
        isDayUnit(m) &&
        distinctValues.length === 1 &&
        convertedDays(m) !== distinctValues[0],
    );
    if (exactDay.length > 0 && distinctValues.length === 1 && conflictingApproximate.length === 0) {
      const value = distinctValues[0];
      if (!inRangeDays(value)) {
        fields.push({ field: "duration", status: "invalid", raw: exactDay[0].raw });
      } else {
        const selected =
          exactDay.find((m) => m.unit === "days" && m.value === value) ?? exactDay[0];
        fields.push({ field: "duration", status: "applicable", value, searchKey: "days", raw: selected.raw });
      }
      // Retain every non-equivalent mention as secondary recognized info.
      // Exact duplicates of the applied value ("two weeks" beside "14 days")
      // are consistent, not secondary. Nights are preserved, never converted.
      for (const mention of durationMentions) {
        if (exactDay.includes(mention) && convertedDays(mention) === value) continue;
        if (mention.unit === "nights" || mention.approximate) {
          fields.push({ field: "duration", status: "recognized-but-not-applicable", raw: mention.raw });
        }
      }
    } else if (exactDay.length > 0 && (distinctValues.length > 1 || conflictingApproximate.length > 0)) {
      const candidates = [...exactDay, ...conflictingApproximate];
      fields.push({
        field: "duration",
        status: "ambiguous",
        candidates,
        raw: candidates.map((c) => c.raw).join(" / "),
      });
    } else {
      const dayRelevant = durationMentions.filter(isDayUnit);
      if (dayRelevant.length > 1) {
        const distinctConverted = [...new Set(dayRelevant.map(convertedDays))];
        if (distinctConverted.length > 1) {
          fields.push({
            field: "duration",
            status: "ambiguous",
            candidates: dayRelevant,
            raw: dayRelevant.map((c) => c.raw).join(" / "),
          });
        } else {
          const source = dayRelevant[0];
          fields.push({
            field: "duration",
            status: "requires-confirmation",
            source,
            suggestedValue: convertedDays(source),
            raw: source.raw,
          });
        }
      } else {
        for (const mention of durationMentions) fields.push(classifySingleDuration(mention));
      }
    }
  }

  // -- Category (root only, explicit only) ---------------------------------
  if (intent.category) {
    const mention = intent.category;
    const distinct = [...new Set(mention.hints)];
    if (distinct.length > 1) {
      fields.push({
        field: "category",
        status: "ambiguous",
        candidates: distinct.map((slug) => ({ slug })),
        raw: mention.raw,
      });
    } else if (distinct.length === 1) {
      const slug = distinct[0];
      if (liveRootSlugs(safeTaxonomy).has(slug)) {
        fields.push({ field: "category", status: "applicable", slug, searchKey: "main", raw: mention.raw });
      } else {
        // Linguistically recognized, but the live taxonomy has no such root
        // (renamed/removed/unavailable) — never fabricate it.
        fields.push({ field: "category", status: "recognized-but-not-applicable", raw: mention.raw });
      }
    } else {
      // Child-concept phrase ("luxury nile cruise") or no usable hint:
      // never silently promote to a root.
      fields.push({ field: "category", status: "recognized-but-not-applicable", raw: mention.raw });
    }
  }

  // -- Informational only (parsed, never applicable to current search) -----
  if (intent.origin) {
    fields.push({ field: "origin", status: "recognized-but-not-applicable", value: intent.origin, raw: intent.origin.raw });
  }
  if (intent.month !== undefined) {
    fields.push({ field: "month", status: "recognized-but-not-applicable", value: intent.month });
  }
  if (intent.travelers) {
    fields.push({ field: "travelers", status: "recognized-but-not-applicable", value: intent.travelers });
  }
  if (intent.privacy) {
    fields.push({ field: "privacy", status: "recognized-but-not-applicable", value: intent.privacy });
  }

  return { intent, fields };
}

// Convenience: full pipeline from raw transcript to classified capabilities.
export function interpretVoiceQuery(
  intent: VoiceIntent,
  taxonomy: VoiceTaxonomyInput,
): CapabilityResult {
  return mapCapabilities(intent, taxonomy);
}