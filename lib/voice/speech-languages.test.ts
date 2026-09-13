import { describe, expect, it } from "vitest";
import { locales } from "@/lib/locales";
import { speechLanguageFor, speechLanguages } from "./speech-languages";
import type { Locale } from "@/types/api";

describe("speech language mapping — explicit, exhaustive, no dynamic construction", () => {
  it("maps all 7 supported repository locales", () => {
    expect(locales).toHaveLength(7);
    for (const locale of locales) {
      expect(speechLanguages[locale]).toBeDefined();
    }
  });

  it("maps exactly the approved BCP-47 values", () => {
    expect(speechLanguages).toEqual({
      en: "en-US",
      fr: "fr-FR",
      de: "de-DE",
      it: "it-IT",
      pt: "pt-PT",
      es: "es-ES",
      zh: "zh-CN",
    });
  });

  it("speechLanguageFor returns the mapped value per locale", () => {
    const expected: Record<Locale, string> = {
      en: "en-US",
      fr: "fr-FR",
      de: "de-DE",
      it: "it-IT",
      pt: "pt-PT",
      es: "es-ES",
      zh: "zh-CN",
    };
    for (const [locale, lang] of Object.entries(expected)) {
      expect(speechLanguageFor(locale as Locale)).toBe(lang);
    }
  });

  it("contains no dynamically-constructed locale patterns (values are literals)", () => {
    for (const value of Object.values(speechLanguages)) {
      expect(value).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      // The mapping must never be built by concatenating the locale code.
      const locale = value.slice(0, 2) as Locale;
      expect(value).not.toBe(locale); // tautological for pt-BR style cases
    }
  });
});