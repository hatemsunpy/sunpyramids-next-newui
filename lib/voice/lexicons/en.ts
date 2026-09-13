import type { LocaleLexicon } from "./types";

const ones: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
};

const tens: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
};

export const enLexicon: LocaleLexicon = {
  numberWords: { ...ones, ...tens, a: 1, an: 1 },
  compoundTens: tens,
  compoundOnes: { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 },
  compoundGlue: [],
  compoundOrder: "tens-first",
  dayUnits: ["day", "days"],
  nightUnits: ["night", "nights"],
  weekUnits: ["week", "weeks"],
  approximateMarkers: ["around", "about", "roughly", "approximately", "almost", "nearly", "or so"],
  fromMarkers: ["from"],
  // "in" introduces destinations ("trip in Cairo") — month names and
  // numbers are checked first so "in November"/"in 5 days" never match here.
  toMarkers: ["to", "into", "in"],
  visitMarkers: ["visit", "visiting", "see", "explore"],
  articles: ["the", "a", "an"],
  monthNames: {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
    june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9,
    sept: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
    // "may"/"june" covered below; "may" needs preposition context (see parser).
    may: 5,
  },
  ambiguousMonths: ["may"],
  monthPrepositions: ["in", "for", "during", "of", "by", "until", "from", "to"],
  clauseMarkers: ["for", "with", "and", "in", "on", "at", "of"],
  peopleNouns: ["people", "person", "travelers", "travellers", "traveler", "traveller", "tourists", "tourist", "guests", "guest"],
  adultNouns: ["adults", "adult"],
  childNouns: ["children", "child", "kids", "kid"],
  infantNouns: ["infants", "infant", "babies", "baby"],
  privateWords: ["private", "privately"],
  groupWords: ["group"],
  categoryAliases: [
    { phrase: "nile cruise", slug: "nile-cruises" },
    { phrase: "nile cruises", slug: "nile-cruises" },
    { phrase: "cruise", slug: "nile-cruises" },
    { phrase: "cruises", slug: "nile-cruises" },
    { phrase: "day tour", slug: "day-tour" },
    { phrase: "day tours", slug: "day-tour" },
    // NOTE: "day trip"/"X day trip" is deliberately NOT a category alias:
    // "5 day trip" must parse as duration-only (required negative case).
    // Users reach Day Tour by saying "day tour".
    { phrase: "one day tour", slug: "day-tour" },
    { phrase: "multi day tour", slug: "multi-days-tours" },
    { phrase: "multi day tours", slug: "multi-days-tours" },
    { phrase: "multi day trip", slug: "multi-days-tours" },
    { phrase: "multi days tour", slug: "multi-days-tours" },
    { phrase: "special offer", slug: "special-offers" },
    { phrase: "special offers", slug: "special-offers" },
  ],
  childPhrases: [
    "luxury nile cruise",
    "luxury cruise",
    "shore excursion",
    "shore excursions",
    "half day tour",
    "half day trip",
    "night tour",
    "night tours",
    "layover",
  ],
  placeAliases: [
    { variant: "louxor", canonical: "luxor" },
    { variant: "luxer", canonical: "luxor" },
    { variant: "assuan", canonical: "aswan" },
    { variant: "assouan", canonical: "aswan" },
    { variant: "aswan", canonical: "aswan" },
    { variant: "giza", canonical: "giza" },
    { variant: "ghiza", canonical: "giza" },
    { variant: "sharm", canonical: "sharm-el-sheikh" },
    { variant: "sharm el sheikh", canonical: "sharm-el-sheikh" },
  ],
  nonPlaceWords: [
    "luxury", "luxurious", "private", "group", "day", "days", "night", "nights",
    "week", "weeks", "tour", "tours", "trip", "trips", "travel", "travels",
    "flight", "flights", "holiday", "holidays", "vacation", "vacations",
    "journey", "journeys", "package", "packages", "deal", "deals", "offer",
    "offers", "cruise", "cruises", "november", "people", "go", "goes", "going",
    "went", "want", "wants", "like", "likes", "need", "needs", "find",
    "show", "get", "best", "good", "cheap", "stay", "hotel", "visit",
  ],
  tourismWords: ["luxury", "museum", "museums", "pyramids", "pyramid", "family", "romantic", "adventure", "beach", "desert", "temple", "temples", "honeymoon", "history", "culture"],
};