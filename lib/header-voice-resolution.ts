import type {
  CapabilityResult,
  CategoryCapability,
  DestinationCapability,
  DurationCapability,
  VoiceTaxonomyInput,
} from "@/lib/voice/types";

export type HeaderVoiceFilters = { days?: string; destination?: string; main?: string };
export type HeaderVoiceDecision = {
  field: keyof HeaderVoiceFilters;
  kind: "choose" | "confirm" | "unavailable";
  options: { value: string; label?: string }[];
};
export type HeaderVoiceResolution =
  | { mode: "title" }
  | { mode: "structured"; applicable: HeaderVoiceFilters; decisions: HeaderVoiceDecision[] };

const validDays = (days: number) => Number.isInteger(days) && days >= 1 && days <= 45;

function durationDecision(capability: DurationCapability): HeaderVoiceDecision {
  if (capability.status !== "requires-confirmation" && capability.status !== "ambiguous") {
    return { field: "days", kind: "unavailable", options: [] };
  }
  const days = capability.status === "requires-confirmation"
    ? [capability.suggestedValue]
    : capability.candidates
      .filter((candidate) => candidate.unit !== "nights")
      .map((candidate) => candidate.unit === "weeks" ? candidate.value * 7 : candidate.value);
  return {
    field: "days",
    kind: capability.status === "ambiguous" ? "choose" : "confirm",
    options: [...new Set(days)].filter(validDays).map((days) => ({ value: String(days) })),
  };
}

function entityDecision(
  capability: DestinationCapability | CategoryCapability,
  taxonomy: VoiceTaxonomyInput,
): HeaderVoiceDecision {
  const field = capability.field === "category" ? "main" : "destination";
  const liveOptions = field === "main" ? taxonomy.rootCategories : taxonomy.destinations;
  const options = "candidates" in capability ? capability.candidates.flatMap((candidate) => {
    const live = liveOptions.find((option) => option.slug === candidate.slug);
    return live?.slug ? [{ value: live.slug, label: live.title || live.name || live.slug }] : [];
  }) : [];
  return {
    field,
    kind: capability.status === "requires-confirmation" ? "confirm" : options.length ? "choose" : "unavailable",
    options,
  };
}

function groupDecisions(decisions: HeaderVoiceDecision[]): HeaderVoiceDecision[] {
  const grouped = new Map<keyof HeaderVoiceFilters, HeaderVoiceDecision>();
  for (const decision of decisions) {
    const previous = grouped.get(decision.field);
    if (!previous) {
      grouped.set(decision.field, decision);
      continue;
    }
    const options = [...new Map(
      [...previous.options, ...decision.options].map((option) => [option.value, option]),
    ).values()];
    grouped.set(decision.field, {
      field: decision.field,
      kind: options.length > 1 ? "choose" : options.length ? "confirm" : "unavailable",
      options,
    });
  }
  return [...grouped.values()];
}

// Project capabilities onto Header's existing query keys without returning
// transcripts, upstream records, or unsupported search constraints.
export function headerVoiceResolution(
  capabilities: CapabilityResult,
  taxonomy: VoiceTaxonomyInput,
): HeaderVoiceResolution {
  const applicable: HeaderVoiceFilters = {};
  const decisions: HeaderVoiceDecision[] = [];
  const hasExactDuration = capabilities.fields.some(
    (field) => field.field === "duration" && field.status === "applicable",
  );
  for (const capability of capabilities.fields) {
    if (capability.field === "duration") {
      if (capability.status === "applicable") applicable.days = String(capability.value);
      // Secondary nights beside explicit days are informational, not decisions.
      else if (capability.status !== "recognized-but-not-applicable" || !hasExactDuration) {
        decisions.push(durationDecision(capability));
      }
    } else if (capability.field === "destination" || capability.field === "category") {
      if (capability.status === "applicable") {
        applicable[capability.field === "category" ? "main" : "destination"] = capability.slug;
      } else if (capability.field !== "category" || !capabilities.intent.category?.childBlocked) {
        decisions.push(entityDecision(capability, taxonomy));
      }
    }
  }
  if (!Object.keys(applicable).length && !decisions.some((decision) => decision.options.length)) {
    return { mode: "title" };
  }
  // Multiple nights suggestions belong to one duration choice, so confirming
  // one value cannot silently dismiss a second duration row.
  return { mode: "structured", applicable, decisions: groupDecisions(decisions) };
}
