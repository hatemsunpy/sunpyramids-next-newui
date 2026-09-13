// Explicit locale → BCP-47 speech recognition language mapping.
// Constructed exhaustively per repository locale: no dynamic template strings.

import type { Locale } from "@/types/api";
import { locales } from "@/lib/locales";

// Record<Locale, string> makes this compile-time exhaustive: adding a new
// Locale in types/api.ts without adding its speech language here is a
// type error (missing property).
export const speechLanguages: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  es: "es-ES",
  zh: "zh-CN",
};

export function speechLanguageFor(locale: Locale): string {
  return speechLanguages[locale];
}

// Compile-time exhaustiveness proof: every repository locale must have a
// speech language mapped. (Runtime guard also used by tests.)
export const mappedLocales: readonly Locale[] = locales;