import type { LocaleLexicon } from "./types";

const ones: Record<string, number> = {
  zero: 0, un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5,
  sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12,
  tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17,
  diciotto: 18, diciannove: 19,
};

const tens: Record<string, number> = {
  venti: 20, trenta: 30, quaranta: 40, cinquanta: 50, sessanta: 60,
};

// Joined Italian compounds. The tens' final vowel drops only before uno
// and otto (ventuno, ventotto, trentuno, trentotto); every other ending
// keeps it (ventidue, trentacinque, quarantasette).
function joinedCompounds(): Record<string, number> {
  const out: Record<string, number> = {};
  const stems: [string, number][] = [["venti", 20], ["trenta", 30], ["quaranta", 40], ["cinquanta", 50]];
  const endings: [string, number][] = [
    ["uno", 1], ["due", 2], ["tre", 3], ["quattro", 4], ["cinque", 5],
    ["sei", 6], ["sette", 7], ["otto", 8], ["nove", 9],
  ];
  for (const [tens, tenValue] of stems) {
    for (const [ending, oneValue] of endings) {
      const stem = ending === "uno" || ending === "otto" ? tens.slice(0, -1) : tens;
      out[`${stem}${ending}`] = tenValue + oneValue;
    }
  }
  return out;
}

export const itLexicon: LocaleLexicon = {
  numberWords: { ...ones, ...tens, ...joinedCompounds() },
  compoundTens: tens,
  compoundOnes: { ...ones },
  compoundGlue: [],
  compoundOrder: "tens-first",
  dayUnits: ["giorno", "giorni", "giornata", "giornate"],
  nightUnits: ["notte", "notti"],
  weekUnits: ["settimana", "settimane"],
  approximateMarkers: ["circa", "quasi", "pressappoco", "incirca"],
  fromMarkers: ["da", "dal", "dalla", "partenza da"],
  // "ad" (a + vowel: "ad Aswan") included alongside "a".
  toMarkers: ["a", "ad", "al", "alla", "in", "verso", "per"],
  visitMarkers: ["visitare", "visita", "vedere", "scoprire"],
  articles: ["il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "del", "della"],
  monthNames: {
    gennaio: 1, gen: 1, febbraio: 2, feb: 2, marzo: 3, mar: 3, aprile: 4, apr: 4,
    maggio: 5, mag: 5, giugno: 6, giu: 6, luglio: 7, lug: 7, agosto: 8, ago: 8,
    settembre: 9, set: 9, ottobre: 10, ott: 10, novembre: 11, nov: 11,
    dicembre: 12, dic: 12,
  },
  ambiguousMonths: [],
  monthPrepositions: ["in", "per", "di", "a", "da"],
  clauseMarkers: ["per", "con", "e", "ed", "in"],
  peopleNouns: ["persone", "persona", "viaggiatori", "viaggiatore", "turisti", "turista", "ospiti"],
  adultNouns: ["adulti", "adulto"],
  childNouns: ["bambini", "bambino", "ragazzi", "ragazzo"],
  infantNouns: ["neonati", "neonato", "bimbi", "bimbo"],
  privateWords: ["privato", "privata", "privati", "private"],
  groupWords: ["gruppo", "di gruppo"],
  categoryAliases: [
    { phrase: "crociera sul nilo", slug: "nile-cruises" },
    { phrase: "crociera nilo", slug: "nile-cruises" },
    { phrase: "crociera", slug: "nile-cruises" },
    { phrase: "crociere", slug: "nile-cruises" },
    { phrase: "tour di un giorno", slug: "day-tour" },
    { phrase: "tour giornaliero", slug: "day-tour" },
    { phrase: "gita di un giorno", slug: "day-tour" },
    { phrase: "tour di piu giorni", slug: "multi-days-tours" },
    { phrase: "viaggio di piu giorni", slug: "multi-days-tours" },
    { phrase: "offerta speciale", slug: "special-offers" },
    { phrase: "offerte speciali", slug: "special-offers" },
  ],
  childPhrases: [
    "crociera di lusso",
    "crociera lusso",
    "escursione a terra",
    "mezza giornata",
    "mezze giornate",
    "tour notturno",
  ],
  placeAliases: [
    { variant: "luksor", canonical: "luxor" },
    { variant: "assuan", canonical: "aswan" },
    { variant: "il cairo", canonical: "cairo" },
    { variant: "gizeh", canonical: "giza" },
    { variant: "sharm", canonical: "sharm-el-sheikh" },
    { variant: "sharm el sheikh", canonical: "sharm-el-sheikh" },
  ],
  nonPlaceWords: [
    "lusso", "privato", "gruppo", "giorno", "giorni", "notte", "notti",
    "settimana", "settimane", "crociera", "novembre", "persone", "andare",
    "volere", "trovare", "vedere", "viaggio", "viaggi", "volo", "voli",
    "vacanza", "vacanze", "soggiorno", "pacchetto", "offerta", "migliore",
    "hotel",
  ],
  tourismWords: ["lusso", "museo", "musei", "piramidi", "piramide", "famiglia", "romantico", "avventura", "spiaggia", "deserto", "tempio", "templi", "luna di miele", "storia", "cultura"],
};