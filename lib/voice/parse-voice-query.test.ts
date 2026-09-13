import { describe, expect, it } from "vitest";
import { parseVoiceQuery } from "./parse-voice-query";
import type { VoiceIntent } from "./types";

function parse(transcript: string): VoiceIntent {
  return parseVoiceQuery(transcript, "en");
}

describe("parseVoiceQuery — flagship multi-entity query", () => {
  it("Find me a 5 day Nile cruise from Luxor to Aswan for two people", () => {
    const intent = parse("Find me a 5 day Nile cruise from Luxor to Aswan for two people");
    expect(intent.duration).toEqual({ value: 5, unit: "days", approximate: false, raw: "5 day" });
    expect(intent.category?.hints).toEqual(["nile-cruises"]);
    expect(intent.category?.childBlocked).toBe(false);
    expect(intent.origin?.normalized).toBe("luxor");
    expect(intent.destination?.normalized).toBe("aswan");
    expect(intent.travelers).toEqual({ total: 2 });
    expect(intent.month).toBeUndefined();
    expect(intent.privacy).toBeUndefined();
  });
});

describe("parseVoiceQuery — duration", () => {
  it("digits and number words", () => {
    expect(parse("Find a five day trip to Cairo").duration).toMatchObject({ value: 5, unit: "days", approximate: false });
    expect(parse("1 day").duration).toMatchObject({ value: 1, unit: "days" });
    expect(parse("one day").duration).toMatchObject({ value: 1, unit: "days" });
    expect(parse("a day").duration).toMatchObject({ value: 1, unit: "days" });
  });

  it("weeks and nights preserve units", () => {
    expect(parse("one week").duration).toMatchObject({ value: 1, unit: "weeks", approximate: false });
    expect(parse("two weeks").duration).toMatchObject({ value: 2, unit: "weeks" });
    expect(parse("7 nights").duration).toMatchObject({ value: 7, unit: "nights" });
    expect(parse("seven nights").duration).toMatchObject({ value: 7, unit: "nights" });
  });

  it("approximate markers set approximate without changing value/unit", () => {
    expect(parse("around a week").duration).toMatchObject({ value: 1, unit: "weeks", approximate: true });
    expect(parse("about one week in Hurghada").duration).toMatchObject({ value: 1, unit: "weeks", approximate: true });
    expect(parse("roughly 5 days").duration).toMatchObject({ value: 5, unit: "days", approximate: true });
    expect(parse("approximately seven days").duration).toMatchObject({ value: 7, unit: "days", approximate: true });
  });

  it("bare numbers without units are never durations", () => {
    expect(parse("Nile cruise for 2").duration).toBeUndefined();
    expect(parse("November 5").duration).toBeUndefined();
  });
});

describe("parseVoiceQuery — travelers are context-aware", () => {
  it("for two people → total only", () => {
    expect(parse("for two people").travelers).toEqual({ total: 2 });
  });

  it("5 day trip for two people → duration 5 AND travelers 2", () => {
    const intent = parse("5 day trip for two people");
    expect(intent.duration).toMatchObject({ value: 5, unit: "days" });
    expect(intent.travelers).toEqual({ total: 2 });
  });

  it("Nile cruise for 2 (bare number, no people-word) → no travelers, no duration", () => {
    const intent = parse("Nile cruise for 2");
    expect(intent.travelers).toBeUndefined();
    expect(intent.duration).toBeUndefined();
    expect(intent.category?.hints).toEqual(["nile-cruises"]);
  });

  it("2 adults and 1 child → split buckets with computed total", () => {
    expect(parse("2 adults and 1 child").travelers).toEqual({ adults: 2, children: 1, total: 3 });
    expect(parse("two adults").travelers).toEqual({ adults: 2, total: 2 });
  });
});

describe("parseVoiceQuery — month with May disambiguation", () => {
  it("in November → 11", () => {
    expect(parse("trip to Aswan in November").month).toBe(11);
  });

  it("November 5 → month only, 5 is a date not a duration", () => {
    const intent = parse("November 5");
    expect(intent.month).toBe(11);
    expect(intent.duration).toBeUndefined();
  });

  it("bare 'may' as modal verb → no month", () => {
    expect(parse("I may want a trip").month).toBeUndefined();
  });

  it("in May / May 5 → month via context", () => {
    expect(parse("trips in May").month).toBe(5);
    expect(parse("May 5").month).toBe(5);
  });
});

describe("parseVoiceQuery — origin/destination direction", () => {
  it("from Luxor to Aswan → origin + destination", () => {
    const intent = parse("Find a cruise from Luxor to Aswan");
    expect(intent.origin?.normalized).toBe("luxor");
    expect(intent.destination?.normalized).toBe("aswan");
  });

  it("bare 'from Luxor' → origin only, never destination", () => {
    const intent = parse("from Luxor");
    expect(intent.origin?.normalized).toBe("luxor");
    expect(intent.destination).toBeUndefined();
  });

  it("bare 'Luxor to Aswan' → origin inferred by unambiguous X-to-Y grammar", () => {
    const intent = parse("Luxor to Aswan");
    expect(intent.origin?.normalized).toBe("luxor");
    expect(intent.destination?.normalized).toBe("aswan");
  });

  it("'trip to Aswan' → destination only, no origin inference from generic words", () => {
    const intent = parse("trip to Aswan");
    expect(intent.destination?.normalized).toBe("aswan");
    expect(intent.origin).toBeUndefined();
  });

  it("'Luxor Aswan cruise' (no markers) → no directional semantics invented", () => {
    const intent = parse("Luxor Aswan cruise");
    expect(intent.origin).toBeUndefined();
    expect(intent.destination).toBeUndefined();
    expect(intent.category?.hints).toEqual(["nile-cruises"]);
  });

  it("'want to go to Aswan' → infinitive 'go' never claims the destination slot", () => {
    const intent = parse("I want to go to Aswan");
    expect(intent.destination?.normalized).toBe("aswan");
  });

  it("visit-verb introduces destination", () => {
    expect(parse("I want to visit Giza in November").destination?.normalized).toBe("giza");
  });
});

describe("parseVoiceQuery — category explicitness", () => {
  it("5 day trip → duration only, NO category", () => {
    const intent = parse("5 day trip");
    expect(intent.duration).toMatchObject({ value: 5, unit: "days" });
    expect(intent.category).toBeUndefined();
  });

  it("trip to Aswan → destination only, NO Nile Cruise inference", () => {
    const intent = parse("trip to Aswan");
    expect(intent.category).toBeUndefined();
  });

  it("luxury trip → NO root category (luxury is not a root lexeme)", () => {
    const intent = parse("luxury trip");
    expect(intent.category).toBeUndefined();
    expect(intent.keywords).toContain("luxury");
  });

  it("luxury Nile cruise → child-blocked, hints empty (no silent root promotion)", () => {
    const intent = parse("luxury Nile cruise");
    expect(intent.category).toBeDefined();
    expect(intent.category?.hints).toEqual([]);
    expect(intent.category?.childBlocked).toBe(true);
  });

  it("shore excursion → child-blocked", () => {
    const intent = parse("shore excursion to Alexandria");
    expect(intent.category?.childBlocked).toBe(true);
    expect(intent.category?.hints).toEqual([]);
  });

  it("5 day Nile cruise → duration + root category", () => {
    const intent = parse("5 day Nile cruise");
    expect(intent.duration).toMatchObject({ value: 5, unit: "days" });
    expect(intent.category?.hints).toEqual(["nile-cruises"]);
  });
});

describe("parseVoiceQuery — privacy", () => {
  it("private trip → private; does not infer a category", () => {
    const intent = parse("private 3 day trip to Cairo");
    expect(intent.privacy).toBe("private");
    expect(intent.duration).toMatchObject({ value: 3, unit: "days" });
    expect(intent.destination?.normalized).toBe("cairo");
    expect(intent.category).toBeUndefined();
  });

  it("group tour → group", () => {
    expect(parse("group tour to Luxor").privacy).toBe("group");
  });
});

describe("parseVoiceQuery — negatives and robustness", () => {
  it("Abu Simbel for 2 people → travelers only, no destination", () => {
    const intent = parse("Abu Simbel for 2 people");
    expect(intent.travelers).toEqual({ total: 2 });
    expect(intent.destination).toBeUndefined();
    expect(intent.origin).toBeUndefined();
  });

  it("Pyramids → keyword only, no silent Cairo mapping", () => {
    const intent = parse("Pyramids");
    expect(intent.destination).toBeUndefined();
    expect(intent.category).toBeUndefined();
    expect(intent.keywords).toContain("pyramids");
  });

  it("49 days → duration value preserved (mapper classifies invalid)", () => {
    expect(parse("49 days").duration).toMatchObject({ value: 49, unit: "days" });
  });

  it("seven weeks → weeks preserved (mapper converts to 49 → invalid)", () => {
    expect(parse("seven weeks").duration).toMatchObject({ value: 7, unit: "weeks" });
  });

  it("blah blah → empty intent, no crash", () => {
    const intent = parse("blah blah");
    expect(intent.duration).toBeUndefined();
    expect(intent.destination).toBeUndefined();
    expect(intent.origin).toBeUndefined();
    expect(intent.category).toBeUndefined();
    expect(intent.month).toBeUndefined();
    expect(intent.travelers).toBeUndefined();
    expect(intent.privacy).toBeUndefined();
  });

  it("empty transcript → empty intent, no crash", () => {
    const intent = parse("   ");
    expect(intent.rawTranscript).toBe("   ");
    expect(intent.duration).toBeUndefined();
  });

  it("raw transcript and locale always preserved", () => {
    const intent = parse("Find me a 5 day trip", "en");
    expect(intent.rawTranscript).toBe("Find me a 5 day trip");
    expect(intent.locale).toBe("en");
  });
});