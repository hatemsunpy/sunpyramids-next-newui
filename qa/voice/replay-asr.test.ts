import { readFileSync, writeFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { parseVoiceQuery } from "../../lib/voice/parse-voice-query";
import { mapCapabilities } from "../../lib/voice/capability-mapper";
import { headerVoiceResolution } from "../../lib/header-voice-resolution";
import fixture from "./taxonomy.fixture.json";
import type { Locale } from "../../types/api";

type Attempt = { transcript: string; ended: boolean; error: string | null; [key: string]: unknown };
type Row = { id: string; phrase: string; entity: string; shape: string; attempts: Attempt[] };
type Evidence = { locale: string; rows: Row[]; [key: string]: unknown };
const normalize = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const survives = (text: string, entity: string) => (" " + normalize(text) + " ").includes(" " + normalize(entity) + " ");

it("interprets actual native transcripts offline without changing or repairing them", () => {
  const evidence = JSON.parse(readFileSync("qa/voice/asr.v1.native.json", "utf8")) as Evidence;
  let networkCalls = 0;
  vi.stubGlobal("fetch", () => { networkCalls++; throw new Error("No network in ASR replay"); });
  try {
    const results = evidence.rows.flatMap(row => row.attempts.map((attempt, index) => {
      const intended = mapCapabilities(parseVoiceQuery(row.phrase, "en"), fixture);
      const actual = mapCapabilities(parseVoiceQuery(attempt.transcript, "en" as Locale), fixture);
      const intendedHeader = headerVoiceResolution(intended, fixture);
      const actualHeader = headerVoiceResolution(actual, fixture);
      const entitySurvives = survives(attempt.transcript, row.entity);
      const tags: string[] = [];
      if (!entitySurvives) tags.push(row.entity.startsWith("Nile") ? "category-term substitution/missing entity" : "place-name substitution/missing entity");
      if (row.shape === "multi-entity" && !survives(attempt.transcript, "Nile")) tags.push("category/travel-term substitution or omission");
      if (row.shape === "multi-entity" && !survives(attempt.transcript, "Luxor")) tags.push("missing/substituted origin entity");
      if (row.shape === "multi-entity" && row.entity.startsWith("Nile") && !survives(attempt.transcript, "Aswan")) tags.push("missing/substituted Aswan destination");
      if (attempt.error) tags.push(`native error: ${attempt.error}`);
      const actualFilters = actualHeader.mode === "structured" ? actualHeader.applicable : {};
      const intendedFilters = intendedHeader.mode === "structured" ? intendedHeader.applicable : {};
      const wrongApplied = Object.entries(actualFilters).filter(([key,value]) => (intendedFilters as Record<string,string>)[key] !== value);
      const omittedFilters = Object.entries(intendedFilters).filter(([key,value]) => (actualFilters as Record<string,string>)[key] !== value);
      if (row.shape === "multi-entity" && (!actual.intent.duration || actual.intent.duration.value !== 5 || actual.intent.duration.unit !== "days")) tags.push("number/duration substitution or omission");
      const wouldAutoNavigate = attempt.ended && !!attempt.transcript.trim() && !attempt.error && (actualHeader.mode === "title" || !actualHeader.decisions.length);
      return { id: row.id, attempt: index + 1, spokenPhrase: row.phrase,
        entity: row.entity, shape: row.shape, exactAsrTranscript: attempt.transcript,
        entitySurvives, tags: [...new Set(tags)], native: attempt,
        actualCapabilities: actual, actualHeader, intendedHeader,
        wrongApplied, omittedFilters, wouldAutoNavigate,
        unsafeNavigationRisk: wouldAutoNavigate && (wrongApplied.length > 0 || omittedFilters.length > 0),
        downstreamSource: "Offline exact-transcript replay against frozen synthetic taxonomy; not an observed browser resolver POST or navigation",
      };
    }));
    expect(networkCalls).toBe(0);
    writeFileSync("qa/voice/asr.v1.replay.json", JSON.stringify({
      measuredAt: new Date().toISOString(), nativeMetadata: { ...evidence, rows: undefined },
      networkCalls, totalAttempts: results.length, completedRows: evidence.rows.filter(r => r.attempts.some(a=>a.ended)).length,
      entitySurvivalAttempts: results.filter(r=>r.entitySurvives).length,
      falseStructuredApplicationAttempts: results.filter(r=>r.wrongApplied.length).length,
      unsafeNavigationRiskAttempts: results.filter(r=>r.unsafeNavigationRisk).length,
      caution: "One speaker, exploratory matrix. Not population ASR accuracy. Missing entities do not prove endpointing without corroborating evidence. No travel-specific repair.", results,
    }, null, 2) + "\n");
  } finally { vi.unstubAllGlobals(); }
});
