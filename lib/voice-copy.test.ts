import { describe, expect, it } from "vitest";
import { smartVoiceKeys, voiceCopy } from "./voice-copy";
import { locales } from "@/lib/locales";
import type { Locale } from "@/types/api";

describe("voiceCopy — localized recognition lifecycle/error strings", () => {
  it.each(locales)("%s provides every Smart Voice key without English fallback", (locale) => {
    for (const key of smartVoiceKeys) {
      expect(voiceCopy(locale)[key]).not.toBe(key);
      expect(voiceCopy(locale)[key].trim()).not.toBe("");
      if (locale !== "en" && key !== "destination") expect(voiceCopy(locale)[key]).not.toBe(voiceCopy("en")[key]);
    }
  });
  it("returns English keys for en", () => {
    const copy = voiceCopy("en");
    expect(copy.voiceSearch).toBe("Search by voice");
    expect(copy.listening).toBe("Listening…");
    expect(copy.noSpeech).toContain("No speech detected");
  });

  it("returns localized strings for every supported locale (no English leak for known keys)", () => {
    const samples: Partial<Record<Locale, string>> = {
      fr: "Rechercher à la voix",
      de: "Sprachsuche",
      it: "Cerca con la voce",
      pt: "Pesquisar por voz",
      es: "Buscar por voz",
      zh: "语音搜索",
    };
    for (const [locale, expected] of Object.entries(samples)) {
      expect(voiceCopy(locale as Locale).voiceSearch).toBe(expected);
    }
  });

  it("covers every repository locale without falling back to raw key names", () => {
    const keys = [
      "voiceSearch",
      "listening",
      "processing",
      "noSpeech",
      "permissionDenied",
      "recognitionUnavailable",
      "recognitionError",
      "cancelled",
    ];
    for (const locale of locales) {
      const copy = voiceCopy(locale);
      for (const key of keys) {
        // Proxy fallback returns the key name when missing — assert real copy.
        expect(copy[key], `${locale}.${key}`).not.toBe(key);
      }
    }
  });

  it("unknown key degrades to the key name via the Proxy fallback", () => {
    expect(voiceCopy("en").someFutureKey).toBe("someFutureKey");
  });
});
