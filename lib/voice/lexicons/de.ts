import type { LocaleLexicon } from "./types";

const ones: Record<string, number> = {
  null: 0,
  ein: 1, eine: 1, eins: 1, einen: 1, einem: 1,
  zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8,
  neun: 9, zehn: 10, elf: 11, zwolf: 12, dreizehn: 13, vierzehn: 14,
  funfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19,
};

const tens: Record<string, number> = {
  zwanzig: 20, dreißig: 30, dreissig: 30, vierzig: 40, funfzig: 50, sechzig: 60,
};

// Glued day adjectives (siebentägige = 7 days): single-word stems plus all
// joined compounds, each combined with every adjectival suffix.
function gluedDayAdjectives(): Record<string, number> {
  const out: Record<string, number> = {};
  const suffixes = ["tagig", "tagige", "tagigen", "tagigem", "tagiger", "tagiges"];
  const stems: Record<string, number> = {
    ein: 1, zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9,
  };
  for (const [stem, value] of Object.entries(stems)) {
    for (const suffix of suffixes) out[`${stem}${suffix}`] = value;
  }
  for (const [compound, value] of Object.entries(joinedCompounds())) {
    for (const suffix of suffixes) out[`${compound}${suffix}`] = value;
  }
  return out;
}

// Joined spaced-compound forms (einundzwanzig … neunundvierzig): ones-stem +
// "und" + tens. Spaced variants ("fünf und zwanzig") use the parser's
// compound rule instead.
function joinedCompounds(): Record<string, number> {
  const out: Record<string, number> = {};
  const stems: Record<string, number> = {
    ein: 1, zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9,
  };
  for (const [tenWord, tenValue] of Object.entries(tens)) {
    for (const [stem, oneValue] of Object.entries(stems)) {
      out[`${stem}und${tenWord}`] = tenValue + oneValue;
    }
  }
  return out;
}

export const deLexicon: LocaleLexicon = {
  numberWords: { ...ones, ...tens, ...joinedCompounds() },
  gluedDayAdjectives: gluedDayAdjectives(),
  compoundTens: tens,
  compoundOnes: { ...ones },
  compoundGlue: ["und"],
  compoundOrder: "ones-first",
  dayUnits: ["tag", "tage", "tagen", "tagig", "tagige", "tagigen", "tagigem", "tagiger", "tages"],
  nightUnits: ["nacht", "nachte", "nachten"],
  weekUnits: ["woche", "wochen"],
  approximateMarkers: ["ungefahr", "circa", "etwa", "fast", "beinahe", "rund"],
  fromMarkers: ["von", "vom", "aus", "ab"],
  // Note: zu/zum/zur deliberately excluded — they collide with German
  // infinitive constructions ("zu besuchen"). nach + in cover destinations.
  toMarkers: ["nach", "in"],
  visitMarkers: ["besuchen", "besuch", "besichtigen", "sehen", "entdecken"],
  articles: ["der", "die", "das", "den", "dem", "einen", "einem", "einer", "eines"],
  monthNames: {
    januar: 1, jan: 1, februar: 2, feb: 2, marz: 3, mar: 3, april: 4, apr: 4,
    mai: 5, juni: 6, jun: 6, juli: 7, jul: 7, august: 8, aug: 8,
    september: 9, sep: 9, oktober: 10, okt: 10, november: 11, nov: 11,
    dezember: 12, dez: 12,
  },
  ambiguousMonths: [],
  monthPrepositions: ["in", "im", "fur", "ab", "von"],
  clauseMarkers: ["fur", "mit", "und", "im", "in"],
  peopleNouns: ["personen", "person", "reisende", "reisender", "touristen", "tourist", "gaste"],
  adultNouns: ["erwachsene", "erwachsener", "erwachsenen"],
  childNouns: ["kinder", "kind", "kindern"],
  infantNouns: ["babys", "baby", "kleinkinder", "kleinkind", "sauglinge"],
  privateWords: ["privat", "private", "privater", "privatem", "privaten"],
  groupWords: ["gruppe", "gruppenreise"],
  categoryAliases: [
    { phrase: "nilkreuzfahrt", slug: "nile-cruises" },
    { phrase: "nilkreuzfahrten", slug: "nile-cruises" },
    { phrase: "kreuzfahrt", slug: "nile-cruises" },
    { phrase: "kreuzfahrten", slug: "nile-cruises" },
    { phrase: "tagesausflug", slug: "day-tour" },
    { phrase: "tagesausfluge", slug: "day-tour" },
    { phrase: "tagestour", slug: "day-tour" },
    { phrase: "eintagige tour", slug: "day-tour" },
    { phrase: "mehrtagige reise", slug: "multi-days-tours" },
    { phrase: "mehrtagige tour", slug: "multi-days-tours" },
    { phrase: "mehrtagig", slug: "multi-days-tours" },
    { phrase: "sonderangebot", slug: "special-offers" },
    { phrase: "sonderangebote", slug: "special-offers" },
  ],
  childPhrases: [
    "luxus nilkreuzfahrt",
    "luxusnilkreuzfahrt",
    "luxuskreuzfahrt",
    "landausflug",
    "halbtagestour",
    "halbtag",
    "halben tag",
    "nachttour",
  ],
  placeAliases: [
    { variant: "kairo", canonical: "cairo" },
    { variant: "assuan", canonical: "aswan" },
    { variant: "gizeh", canonical: "giza" },
    { variant: "sharm", canonical: "sharm-el-sheikh" },
    { variant: "sharm el sheikh", canonical: "sharm-el-sheikh" },
  ],
  nonPlaceWords: [
    "luxus", "privat", "gruppe", "tag", "tage", "nacht", "nachte", "woche",
    "wochen", "kreuzfahrt", "november", "personen", "gehen", "wollen",
    "finden", "sehen", "reise", "reisen", "flug", "fluge", "urlaub",
    "aufenthalt", "rundreise", "paket", "angebot", "beste", "hotel",
  ],
  tourismWords: ["luxus", "museum", "museen", "pyramiden", "pyramide", "familie", "romantisch", "abenteuer", "strand", "wuste", "tempel", "flitterwochen", "geschichte", "kultur"],
};