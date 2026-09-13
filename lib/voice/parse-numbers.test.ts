import { describe, expect, it } from "vitest";
import { lexiconFor } from "./lexicons";
import { numberAt, tokenizeWithRaw } from "./parse-voice-query";
import type { Locale } from "@/types/api";

// numberAt is positional: tests assert the value parsed AT the given index.
// Overlapping later positions may independently re-parse (e.g. "twenty
// five" yields 25 at index 0 and 5 at index 1); the duration/traveler
// extractors always consume from the first match, so only position-0
// behavior is contractually significant here.
function at(transcript: string, locale: Locale, index = 0): number | null {
  const tokens = tokenizeWithRaw(transcript);
  return numberAt(tokens, index, lexiconFor(locale))?.value ?? null;
}

describe("numberAt — English", () => {
  it("digits and single words", () => {
    expect(at("5", "en")).toBe(5);
    expect(at("five", "en")).toBe(5);
    expect(at("twelve", "en")).toBe(12);
    expect(at("twenty", "en")).toBe(20);
  });

  it("spaced and hyphenated compounds", () => {
    expect(at("twenty five people", "en")).toBe(25);
    expect(at("forty-two days", "en")).toBe(42);
  });

  it("bare tens without ones", () => {
    expect(at("thirty", "en")).toBe(30);
  });

  it("unknown tokens yield null", () => {
    expect(at("banana", "en")).toBeNull();
  });
});

describe("numberAt — French multi-token numbers", () => {
  it("single words and teens", () => {
    expect(at("cinq", "fr")).toBe(5);
    expect(at("douze", "fr")).toBe(12);
    expect(at("seize", "fr")).toBe(16);
  });

  it("dix-sept style compounds (hyphen folded to space)", () => {
    expect(at("dix-sept jours", "fr")).toBe(17);
    expect(at("dix huit", "fr")).toBe(18);
    expect(at("dix", "fr")).toBe(10);
  });

  it("vingt et un / vingt-deux with optional glue", () => {
    expect(at("vingt et un", "fr")).toBe(21);
    expect(at("vingt deux", "fr")).toBe(22);
    expect(at("quarante cinq", "fr")).toBe(45);
  });
});

describe("numberAt — German compounds", () => {
  it("single words incl. umlaut-folded forms", () => {
    expect(at("fünf", "de")).toBe(5);
    expect(at("zwölf", "de")).toBe(12);
    expect(at("dreißig", "de")).toBe(30);
  });

  it("joined compounds (einundzwanzig)", () => {
    expect(at("einundzwanzig", "de")).toBe(21);
    expect(at("fünfundvierzig", "de")).toBe(45);
  });

  it("spaced ones-und-tens compounds", () => {
    expect(at("fünf und zwanzig", "de")).toBe(25);
  });
});

describe("numberAt — Italian joined compounds with elision", () => {
  it("ventuno / ventotto elision forms", () => {
    expect(at("ventuno", "it")).toBe(21);
    expect(at("ventotto", "it")).toBe(28);
    expect(at("trentacinque", "it")).toBe(35);
  });
});

describe("numberAt — Portuguese compounds", () => {
  it("vinte e um / trinta e cinco", () => {
    expect(at("vinte e um", "pt")).toBe(21);
    expect(at("trinta e cinco", "pt")).toBe(35);
  });

  it("both orthographies for 14/16-19 (catorze/quatorze, dezasseis/dezesseis)", () => {
    expect(at("catorze", "pt")).toBe(14);
    expect(at("quatorze", "pt")).toBe(14);
    expect(at("dezasseis", "pt")).toBe(16);
    expect(at("dezesseis", "pt")).toBe(16);
  });
});

describe("numberAt — Spanish veinti- and y-compounds", () => {
  it("veintidos / veintiocho joined forms", () => {
    expect(at("veintidos", "es")).toBe(22);
    expect(at("veintiocho", "es")).toBe(28);
  });

  it("treinta y cinco", () => {
    expect(at("treinta y cinco", "es")).toBe(35);
  });

  it("accent-stripped dieciseis", () => {
    expect(at("dieciséis", "es")).toBe(16);
    expect(at("dieciseis", "es")).toBe(16);
  });
});

describe("numberAt — article-as-one resolves lexically (unit gating happens at extraction)", () => {
  it("bare articles still resolve (extraction requires unit adjacency)", () => {
    expect(at("a", "en")).toBe(1);
    expect(at("un", "fr")).toBe(1);
    expect(at("ein", "de")).toBe(1);
  });
});