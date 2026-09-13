import type { Locale } from "@/types/api";
import { deLexicon } from "./de";
import { enLexicon } from "./en";
import { esLexicon } from "./es";
import { frLexicon } from "./fr";
import { itLexicon } from "./it";
import { ptLexicon } from "./pt";
import type { LocaleLexicon } from "./types";
import { zhLexicon } from "./zh";

// Exhaustive map: every repository locale has exactly one lexicon.
// Bundled together for the pure parser layer; per-locale code-splitting is
// a Phase 6 packaging decision, not a parsing concern.
export const lexicons: Record<Locale, LocaleLexicon> = {
  en: enLexicon,
  fr: frLexicon,
  de: deLexicon,
  it: itLexicon,
  pt: ptLexicon,
  es: esLexicon,
  zh: zhLexicon,
};

export function lexiconFor(locale: Locale): LocaleLexicon {
  return lexicons[locale];
}
