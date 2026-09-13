// Shared lexicon type for all locale dictionaries. Every key is stored in
// POST-normalization form (see normalizeForMatch): lowercase, no diacritics,
// punctuation already folded to spaces. Behavioral tests feed RAW accented
// input through the parser to prove the pipeline end to end.

export type LexiconCategoryAlias = {
  // Normalized phrase (may be multi-token, e.g. "croisiere sur le nil").
  phrase: string;
  // Candidate root-category slug hint. ALWAYS validated against the live
  // root taxonomy at resolve time — never applied blindly.
  slug: string;
};

export type LexiconPlaceAlias = {
  // Normalized spoken variant (e.g. "louxor", "assuan").
  variant: string;
  // Canonical Latin spelling used only as a lookup key against live
  // destination slugs/titles (e.g. "luxor"). Never a production ID.
  canonical: string;
};

export type LocaleLexicon = {
  // Single-token number words: normalized token -> value (0..~60).
  numberWords: Record<string, number>;
  // Multi-token number glue: connectors allowed between tens and ones.
  // Each entry: tens value words and ones value words are separate lookups.
  compoundTens: Record<string, number>;
  compoundOnes: Record<string, number>;
  // Tokens allowed between tens and ones ("et", "e", "y", "und"...).
  compoundGlue: string[];
  // Token order for spaced compounds: tens-first ("twenty five",
  // "vingt deux") vs ones-first (German "fünf und zwanzig").
  compoundOrder: "tens-first" | "ones-first";
  // Duration units: normalized unit tokens per unit (singular/plural/forms).
  dayUnits: string[];
  nightUnits: string[];
  weekUnits: string[];
  // Words marking an approximate quantity ("around", "environ", ...).
  approximateMarkers: string[];
  // Directional markers (normalized, single tokens).
  fromMarkers: string[];
  toMarkers: string[];
  // "visit"-style verbs that introduce a destination.
  visitMarkers: string[];
  // Articles stripped from captured place spans.
  articles: string[];
  // Normalized month name/abbreviation -> 1-12.
  monthNames: Record<string, number>;
  // Month names that are ambiguous with common words ("may" = modal verb).
  // These only count when adjacent to a monthPrepositions token or a day
  // number. Empty for locales without such collisions.
  ambiguousMonths: string[];
  monthPrepositions: string[];
  // Prepositions that end a captured place span ("for two people" must not
  // leak into a destination). Marker lists themselves double as stops.
  clauseMarkers: string[];
  // Traveler nouns by bucket.
  peopleNouns: string[];
  adultNouns: string[];
  childNouns: string[];
  infantNouns: string[];
  // Privacy adjectives.
  privateWords: string[];
  groupWords: string[];
  // Category aliases (root hints) + child-concept phrases that BLOCK root
  // inference when they consume the same span.
  categoryAliases: LexiconCategoryAlias[];
  childPhrases: string[];
  // Place-name pronunciation/spelling variants -> canonical Latin spelling.
  placeAliases: LexiconPlaceAlias[];
  // Single tokens that can never form a valid place mention. Used three
  // ways: (1) a captured span EQUAL to an entry is dropped; (2) a
  // SINGLE-token span matching an entry is dropped, so infinitive/auxiliary
  // verbs ("go" in "want to go to Aswan") can never claim a destination slot
  // and block the real place later in the sentence; (3) backward origin
  // inference ("Luxor to Aswan") is skipped when the candidate span contains
  // any entry ("trip to Aswan" must not infer origin "trip").
  nonPlaceWords: string[];
  // German-style glued number+unit adjectives ("siebentägige" = 7 days):
  // normalized adjective -> day count. Only populated where the language
  // genuinely glues numerals to units; all other locales omit it.
  gluedDayAdjectives?: Record<string, number>;
  // Residual tourism tokens kept for informational review (never constraints).
  tourismWords: string[];
};