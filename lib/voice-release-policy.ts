import type { Locale } from "@/types/api";

export type HeaderVoiceMode = "smart-auto" | "basic-auto";
export type FindTripVoiceMode = "smart-review";

export type VoiceReleasePolicy = {
  header: HeaderVoiceMode;
  findTrip: FindTripVoiceMode;
};

export const voiceReleasePolicy = {
  en: { header: "smart-auto", findTrip: "smart-review" },
  fr: { header: "basic-auto", findTrip: "smart-review" },
  de: { header: "basic-auto", findTrip: "smart-review" },
  it: { header: "basic-auto", findTrip: "smart-review" },
  pt: { header: "basic-auto", findTrip: "smart-review" },
  es: { header: "basic-auto", findTrip: "smart-review" },
  zh: { header: "basic-auto", findTrip: "smart-review" },
} satisfies Record<Locale, VoiceReleasePolicy>;
