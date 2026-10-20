// Verifies the server picker serializes faithfully (keysets + values) and that
// the client accessor preserves the property-name fallback for missing keys.
// JSON roundtrip here only proves serializability; bundle exclusion of
// lib/voice-copy.ts is verified separately at the source/build level.
import { describe, expect, it } from "vitest";
import { voiceCopy } from "@/lib/voice-copy";
import { pickVoiceLabels } from "@/lib/home-client-labels";
import { readVoiceLabels } from "@/lib/voice-client-labels";
import type { Locale } from "@/types/api";

const ALL_LOCALES: Locale[] = ["en", "fr", "de", "it", "pt", "es", "zh"];

describe("pickVoiceLabels / readVoiceLabels", () => {
  it.each(ALL_LOCALES)("%s: roundtripped picker matches voiceCopy keyset and every value through the client accessor", (locale) => {
    const plain = pickVoiceLabels(locale);
    const copy = voiceCopy(locale);
    const roundtripped: Record<string, string> = JSON.parse(JSON.stringify(plain));
    expect(Object.keys(roundtripped).sort()).toEqual(Object.keys(copy).sort());
    for (const [key, expected] of Object.entries(copy)) {
      expect(readVoiceLabels(roundtripped)[key]).toBe(expected);
    }
  });

  it("missing key falls back to the property name", () => {
    const copy = readVoiceLabels(pickVoiceLabels("en"));
    expect(copy.someFutureKey).toBe("someFutureKey");
  });
});
