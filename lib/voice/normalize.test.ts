import { describe, expect, it } from "vitest";
import { isDigitToken, lookupKey, normalizeForMatch, tokensOf } from "./normalize";

describe("normalizeForMatch", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeForMatch("  Find   A Trip ")).toBe("find a trip");
  });

  it("strips diacritics deterministically (fr/de/it/pt/es)", () => {
    expect(normalizeForMatch("croisière")).toBe("croisiere");
    expect(normalizeForMatch("décembre")).toBe("decembre");
    expect(normalizeForMatch("fünf")).toBe("funf");
    expect(normalizeForMatch("zwölf")).toBe("zwolf");
    expect(normalizeForMatch("niños")).toBe("ninos");
    expect(normalizeForMatch("coração")).toBe("coracao");
  });

  it("keeps German ß (NFKD does not decompose it)", () => {
    expect(normalizeForMatch("dreißig")).toBe("dreißig");
  });

  it("folds hyphens/apostrophes/quotes/slashes to spaces", () => {
    expect(normalizeForMatch("multi-day")).toBe("multi day");
    expect(normalizeForMatch("d'une")).toBe("d une");
    expect(normalizeForMatch("l'horloge")).toBe("l horloge");
    expect(normalizeForMatch("3-nights/4-days")).toBe("3 nights 4 days");
  });

  it("folds fullwidth digits (CJK ASR output)", () => {
    expect(normalizeForMatch("５天")).toBe("5天");
  });

  it("preserves Han text and mixed digit-unit runs", () => {
    expect(normalizeForMatch("找一条七天游轮")).toBe("找一条七天游轮");
    expect(normalizeForMatch("5天卢克索")).toBe("5天卢克索");
  });

  it("strips punctuation-only transcripts to empty", () => {
    expect(normalizeForMatch("... !!!")).toBe("");
  });
});

describe("tokensOf", () => {
  it("splits on whitespace, drops empties", () => {
    expect(tokensOf("find  a trip")).toEqual(["find", "a", "trip"]);
    expect(tokensOf("")).toEqual([]);
  });

  it("keeps spaceless CJK as a single token", () => {
    expect(tokensOf("找一条七天游轮")).toEqual(["找一条七天游轮"]);
  });
});

describe("isDigitToken", () => {
  it("matches ASCII digit runs only", () => {
    expect(isDigitToken("5")).toBe(true);
    expect(isDigitToken("45")).toBe(true);
    expect(isDigitToken("five")).toBe(false);
    expect(isDigitToken("5.5")).toBe(false);
    expect(isDigitToken("")).toBe(false);
  });
});

describe("lookupKey", () => {
  it("is normalizeForMatch (single canonical comparison form)", () => {
    expect(lookupKey("Louxor")).toBe("louxor");
  });
});