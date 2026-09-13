import { describe, expect, it } from "vitest";
import { mapCapabilities } from "./capability-mapper";
import { parseVoiceQuery } from "./parse-voice-query";

const destinations: ApiPage[] = [
  { id: 11, title: "Cairo Tours", slug: "cairo" },
  { id: 12, title: "Luxor Tours", slug: "luxor" },
  { id: 13, title: "Aswan Tours", slug: "aswan" },
  { id: 14, title: "Hurghada Tours", slug: "hurghada" },
  { id: 15, title: "Sharm El Sheikh Tours", slug: "sharm-el-sheikh" },
];

const rootCategories: ApiPage[] = [
  { id: 1, title: "Day Tour", slug: "day-tour" },
  { id: 3, title: "Multi Days Tours", slug: "multi-days-tours" },
  { id: 17, title: "Nile Cruises", slug: "nile-cruises" },
  { id: 53, title: "Special Offers", slug: "special-offers" },
];

const taxonomy: VoiceTaxonomyInput = { destinations, rootCategories };
const emptyTaxonomy: VoiceTaxonomyInput = { destinations: [], rootCategories: [] };

function interpret(transcript: string, locale: Locale = "en", tax: VoiceTaxonomyInput = taxonomy) {
  return mapCapabilities(parseVoiceQuery(transcript, locale), tax);
}

function fieldOf(result: { fields: CapabilityField[] }, field: CapabilityField["field"]) {
  return result.fields.find((f) => f.field === field);
}

describe("capability mapper — destination", () => {
  it("confident live city → applicable with slug", () => {
    const f = fieldOf(interpret("trip to Aswan"), "destination");
    expect(f).toMatchObject({ status: "applicable", slug: "aswan" });
  });

  it("fuzzy single candidate → requires-confirmation (never auto-apply)", () => {
    const f = fieldOf(interpret("trip to Aswn"), "destination");
    expect(f?.status).toBe("requires-confirmation");
    if (f?.status === "requires-confirmation") expect(f.slug).toBe("aswan");
  });

  it("unresolvable place → unresolved field preserved", () => {
    const f = fieldOf(interpret("trip to Paris"), "destination");
    expect(f?.status).toBe("unresolved");
  });

  it("no destination mention → field omitted entirely", () => {
    expect(fieldOf(interpret("5 day trip"), "destination")).toBeUndefined();
  });
});

describe("capability mapper — duration matrix", () => {
  it("exact days in 1–45 → applicable", () => {
    const f = fieldOf(interpret("5 day trip"), "duration");
    expect(f).toMatchObject({ status: "applicable", value: 5, searchKey: "days" });
  });

  it("49 days → invalid (never clamped)", () => {
    expect(fieldOf(interpret("49 days"), "duration")?.status).toBe("invalid");
  });

  it("exact weeks convert: 1 week → 7 applicable; 2 weeks → 14 applicable", () => {
    expect(fieldOf(interpret("one week"), "duration")).toMatchObject({ status: "applicable", value: 7 });
    expect(fieldOf(interpret("two weeks"), "duration")).toMatchObject({ status: "applicable", value: 14 });
  });

  it("6 weeks → 42 applicable; 7 weeks → 49 invalid (no clamp to 45)", () => {
    expect(fieldOf(interpret("six weeks"), "duration")).toMatchObject({ status: "applicable", value: 42 });
    expect(fieldOf(interpret("seven weeks"), "duration")?.status).toBe("invalid");
  });

  it("approximate weeks → requires-confirmation with suggested value, never silent", () => {
    const f = fieldOf(interpret("around one week in Hurghada"), "duration");
    expect(f?.status).toBe("requires-confirmation");
    if (f?.status === "requires-confirmation") {
      expect(f.suggestedValue).toBe(7);
      expect(f.source).toMatchObject({ value: 1, unit: "weeks", approximate: true });
    }
  });

  it("approximate days → requires-confirmation, never an exact filter", () => {
    const f = fieldOf(interpret("roughly 5 days"), "duration");
    expect(f?.status).toBe("requires-confirmation");
    if (f?.status === "requires-confirmation") expect(f.suggestedValue).toBe(5);
  });

  it("nights without cruise context → recognized-but-not-applicable (no N+1)", () => {
    const f = fieldOf(interpret("7 night trip"), "duration");
    expect(f?.status).toBe("recognized-but-not-applicable");
  });

  it("nights WITH explicit Nile Cruise context → requires-confirmation suggesting N+1", () => {
    const f = fieldOf(interpret("7 night Nile cruise"), "duration");
    expect(f?.status).toBe("requires-confirmation");
    if (f?.status === "requires-confirmation") {
      expect(f.suggestedValue).toBe(8);
      expect(f.source).toMatchObject({ value: 7, unit: "nights" });
    }
  });

  it("approximate nights never get a suggestion, even with cruise context", () => {
    const f = fieldOf(interpret("around 7 night Nile cruise"), "duration");
    expect(f?.status).toBe("recognized-but-not-applicable");
  });
});

describe("capability mapper — category", () => {
  it("explicit root + live taxonomy → applicable main", () => {
    const f = fieldOf(interpret("5 day Nile cruise"), "category");
    expect(f).toMatchObject({ status: "applicable", slug: "nile-cruises", searchKey: "main" });
  });

  it("child-only phrase → recognized-but-not-applicable (no root promotion)", () => {
    const f = fieldOf(interpret("luxury Nile cruise"), "category");
    expect(f?.status).toBe("recognized-but-not-applicable");
  });

  it("root missing from live taxonomy → recognized-but-not-applicable (never fabricated)", () => {
    const noCruises: VoiceTaxonomyInput = {
      destinations,
      rootCategories: rootCategories.filter((c) => c.slug !== "nile-cruises"),
    };
    const f = fieldOf(interpret("Nile cruise", "en", noCruises), "category");
    expect(f?.status).toBe("recognized-but-not-applicable");
  });

  it("generic 'cruise' resolves via the documented strong alias (single cruise root)", () => {
    const f = fieldOf(interpret("Find a cruise from Luxor to Aswan"), "category");
    expect(f).toMatchObject({ status: "applicable", slug: "nile-cruises" });
  });
});

describe("capability mapper — informational fields never apply", () => {
  it("origin/month/travelers/privacy are preserved as recognized-but-not-applicable", () => {
    const result = interpret("Find me a 5 day Nile cruise from Luxor to Aswan for two people in November");
    const byField = new Map(result.fields.map((f) => [f.field, f]));
    expect(byField.get("origin")).toMatchObject({ status: "recognized-but-not-applicable" });
    expect(byField.get("month")).toMatchObject({ status: "recognized-but-not-applicable", value: 11 });
    expect(byField.get("travelers")).toMatchObject({ status: "recognized-but-not-applicable", value: { total: 2 } });
  });

  it("private trip → privacy preserved as not-applicable, no category inferred", () => {
    const result = interpret("private 3 day trip to Cairo");
    expect(fieldOf(result, "privacy")).toMatchObject({ status: "recognized-but-not-applicable", value: "private" });
    expect(fieldOf(result, "category")).toBeUndefined();
  });
});

describe("capability mapper — multi-entity orchestration", () => {
  it("5 day Nile cruise to Aswan → duration + category + destination all applicable", () => {
    const result = interpret("5 day Nile cruise to Aswan");
    expect(fieldOf(result, "duration")).toMatchObject({ status: "applicable", value: 5 });
    expect(fieldOf(result, "category")).toMatchObject({ status: "applicable", slug: "nile-cruises" });
    expect(fieldOf(result, "destination")).toMatchObject({ status: "applicable", slug: "aswan" });
  });

  it("full flagship query classifies every field", () => {
    const result = interpret("Find me a 5 day Nile cruise from Luxor to Aswan for two people");
    expect(fieldOf(result, "duration")).toMatchObject({ status: "applicable", value: 5 });
    expect(fieldOf(result, "category")).toMatchObject({ status: "applicable", slug: "nile-cruises" });
    expect(fieldOf(result, "destination")).toMatchObject({ status: "applicable", slug: "aswan" });
    expect(fieldOf(result, "origin")?.status).toBe("recognized-but-not-applicable");
    expect(fieldOf(result, "travelers")?.status).toBe("recognized-but-not-applicable");
  });

  it("blah blah → no fields at all", () => {
    expect(interpret("blah blah").fields).toEqual([]);
  });
});

describe("capability mapper — taxonomy failure degrades safely", () => {
  it("empty taxonomy: intent still parsed, nothing applicable, no throw", () => {
    const result = interpret("Nile cruise to Aswan", "en", emptyTaxonomy);
    expect(result.intent.destination?.normalized).toBe("aswan");
    expect(result.intent.category?.hints).toEqual(["nile-cruises"]);
    expect(fieldOf(result, "destination")?.status).toBe("recognized-but-not-applicable");
    expect(fieldOf(result, "category")?.status).toBe("recognized-but-not-applicable");
  });

  it("undefined taxonomy lists degrade the same way", () => {
    const result = mapCapabilities(
      parseVoiceQuery("5 day trip to Cairo", "en"),
      { destinations: undefined as never, rootCategories: undefined as never },
    );
    expect(result.fields.length).toBeGreaterThan(0);
    expect(fieldOf(result, "destination")?.status).toBe("recognized-but-not-applicable");
  });
});

describe("capability mapper — negatives (anti-inference)", () => {
  it("5 day trip → duration only, no category field", () => {
    const result = interpret("5 day trip");
    expect(fieldOf(result, "duration")?.status).toBe("applicable");
    expect(fieldOf(result, "category")).toBeUndefined();
  });

  it("luxury trip → no category field at all", () => {
    const result = interpret("luxury trip");
    expect(fieldOf(result, "category")).toBeUndefined();
  });

  it("Pyramids → no destination field (nothing to mis-map)", () => {
    const result = interpret("Pyramids");
    expect(fieldOf(result, "destination")).toBeUndefined();
  });
});

import type { ApiPage, Locale } from "@/types/api";
import type { CapabilityField, VoiceTaxonomyInput } from "./types";

describe("correction — bare destinations (telegraphic queries)", () => {
  const durationsOf = (result: { fields: CapabilityField[] }) =>
    result.fields.filter((f) => f.field === "duration");

  it("Cairo 5 days → destination + days both applicable", () => {
    const result = interpret("Cairo 5 days");
    expect(fieldOf(result, "destination")).toMatchObject({ status: "applicable", slug: "cairo" });
    expect(fieldOf(result, "duration")).toMatchObject({ status: "applicable", value: 5 });
  });

  it("Trip Cairo 5 days → generic word ignored, Cairo applicable", () => {
    const result = interpret("Trip Cairo 5 days");
    expect(fieldOf(result, "destination")).toMatchObject({ status: "applicable", slug: "cairo" });
    expect(fieldOf(result, "duration")).toMatchObject({ status: "applicable", value: 5 });
  });

  it("Luxor 7 days → luxor applicable", () => {
    expect(fieldOf(interpret("Luxor 7 days"), "destination")).toMatchObject({
      status: "applicable",
      slug: "luxor",
    });
  });

  it("from Luxor → origin only, NO destination fallback", () => {
    const result = interpret("from Luxor");
    expect(fieldOf(result, "origin")).toMatchObject({ status: "recognized-but-not-applicable" });
    expect(fieldOf(result, "destination")).toBeUndefined();
  });

  it("Luxor Aswan cruise → ambiguous, no invented origin/destination direction", () => {
    const result = interpret("Luxor Aswan cruise");
    const destination = fieldOf(result, "destination");
    expect(destination?.status).toBe("ambiguous");
    if (destination?.status === "ambiguous") {
      expect(destination.candidates.map((c) => c.slug).sort()).toEqual(["aswan", "luxor"]);
    }
    expect(fieldOf(result, "origin")).toBeUndefined();
    expect(result.intent.origin).toBeUndefined();
  });

  it("Pyramids 3 days → no Cairo inference; duration still parsed", () => {
    const result = interpret("Pyramids 3 days");
    expect(fieldOf(result, "destination")).toBeUndefined();
    expect(fieldOf(result, "duration")).toMatchObject({ status: "applicable", value: 3 });
  });

  it("Abu Simbel 2 days → no Aswan inference when not a live destination", () => {
    const result = interpret("Abu Simbel 2 days");
    expect(fieldOf(result, "destination")).toBeUndefined();
    expect(fieldOf(result, "duration")).toMatchObject({ status: "applicable", value: 2 });
  });

  it("Abu Simbel resolves when it IS a live destination (exact entity, not Aswan)", () => {
    const withAbuSimbel: VoiceTaxonomyInput = {
      destinations: [...destinations, { id: 99, title: "Abu Simbel Tours", slug: "abu-simbel" }],
      rootCategories,
    };
    const result = interpret("Abu Simbel 2 days", "en", withAbuSimbel);
    expect(fieldOf(result, "destination")).toMatchObject({ status: "applicable", slug: "abu-simbel" });
  });

  it("trip to Aswan → still no category (root behavior unchanged)", () => {
    const result = interpret("trip to Aswan");
    expect(fieldOf(result, "destination")).toMatchObject({ status: "applicable", slug: "aswan" });
    expect(fieldOf(result, "category")).toBeUndefined();
  });

  it("Nile cruise → root applies with live taxonomy, no destination invented", () => {
    const result = interpret("Nile cruise");
    expect(fieldOf(result, "category")).toMatchObject({ status: "applicable", slug: "nile-cruises" });
    expect(fieldOf(result, "destination")).toBeUndefined();
  });

  it("bare durations list keeps every mention for the mapper", () => {
    const result = interpret("3 nights 4 days");
    expect(result.intent.duration).toMatchObject({ value: 3, unit: "nights" });
    expect(result.intent.additionalDurations).toEqual([
      expect.objectContaining({ value: 4, unit: "days", approximate: false }),
    ]);
    expect(durationsOf(result)).toHaveLength(2);
  });
});

describe("correction — multiple duration mentions", () => {
  const durationsOf = (result: { fields: CapabilityField[] }) =>
    result.fields.filter((f) => f.field === "duration");

  it("3 nights 4 days → explicit 4 days applicable; 3 nights retained", () => {
    const result = interpret("3 nights 4 days");
    const applicable = durationsOf(result).find((f) => f.status === "applicable");
    expect(applicable).toMatchObject({ value: 4, searchKey: "days", raw: "4 days" });
    expect(durationsOf(result).find((f) => f.status === "recognized-but-not-applicable")).toMatchObject({
      raw: "3 nights",
    });
  });

  it("7 nights 8 days Nile cruise → 8 days applicable, no N+1, nights preserved", () => {
    const result = interpret("7 nights 8 days Nile cruise");
    expect(fieldOf(result, "category")).toMatchObject({ status: "applicable", slug: "nile-cruises" });
    const ds = durationsOf(result);
    expect(ds.find((f) => f.status === "applicable")).toMatchObject({ value: 8, searchKey: "days" });
    expect(ds.some((f) => f.status === "recognized-but-not-applicable" && f.raw === "7 nights")).toBe(true);
    expect(ds.some((f) => f.status === "requires-confirmation")).toBe(false);
  });

  it("3 nights alone → recognized, no automatic days", () => {
    const result = interpret("3 nights");
    expect(durationsOf(result)).toEqual([
      { field: "duration", status: "recognized-but-not-applicable", raw: "3 nights" },
    ]);
  });

  it("5 days or 7 days → ambiguous, neither silently applied", () => {
    const result = interpret("5 days or 7 days");
    const ds = durationsOf(result);
    expect(ds).toHaveLength(1);
    expect(ds[0]?.status).toBe("ambiguous");
    if (ds[0]?.status === "ambiguous") {
      expect(ds[0].candidates.map((c) => c.value).sort((a, b) => a - b)).toEqual([5, 7]);
    }
  });

  it("about 5 days, maybe 7 days → ambiguous, never one exact filter", () => {
    const result = interpret("about 5 days, maybe 7 days");
    const ds = durationsOf(result);
    expect(ds).toHaveLength(1);
    expect(ds[0]?.status).toBe("ambiguous");
    expect(ds.some((f) => f.status === "applicable")).toBe(false);
  });

  it("around 5 days → requires confirmation (unchanged)", () => {
    const f = fieldOf(interpret("around 5 days"), "duration");
    expect(f?.status).toBe("requires-confirmation");
    if (f?.status === "requires-confirmation") expect(f.suggestedValue).toBe(5);
  });

  it("around 3 nights, 4 days → exact 4 days applicable; approximate nights retained", () => {
    const result = interpret("around 3 nights, 4 days");
    expect(result.intent.additionalDurations?.[0]).toMatchObject({ value: 4, unit: "days", approximate: false });
    const ds = durationsOf(result);
    expect(ds.find((f) => f.status === "applicable")).toMatchObject({ value: 4, searchKey: "days" });
    expect(ds.some((f) => f.status === "recognized-but-not-applicable" && f.raw === "3 nights,")).toBe(true);
  });

  it("two weeks / 14 days → consistent, applied once as 14 days", () => {
    const result = interpret("two weeks / 14 days");
    const ds = durationsOf(result);
    expect(ds).toHaveLength(1);
    expect(ds[0]).toMatchObject({ status: "applicable", value: 14, searchKey: "days", raw: "14 days" });
  });
});