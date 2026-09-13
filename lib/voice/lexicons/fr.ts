import type { LocaleLexicon } from "./types";

const ones: Record<string, number> = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
  sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13,
  quatorze: 14, quinze: 15, seize: 16,
};

const tens: Record<string, number> = {
  vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
};

// "dix" doubles as a compound head for 17-19 ("dix-sept"): the tens-first
// rule adds correctly, and bare "dix" still resolves via the fallback.
const compoundTens: Record<string, number> = { ...tens, dix: 10 };

export const frLexicon: LocaleLexicon = {
  numberWords: { ...ones, ...tens },
  compoundTens,
  compoundOnes: {
    un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6,
    sept: 7, huit: 8, neuf: 9,
  },
  compoundGlue: ["et"],
  compoundOrder: "tens-first",
  dayUnits: ["jour", "jours", "journee", "journees"],
  nightUnits: ["nuit", "nuits"],
  weekUnits: ["semaine", "semaines"],
  approximateMarkers: ["environ", "presque", "approximativement", "a peu pres", "pres"],
  fromMarkers: ["de", "depuis", "depuis le", "depuis la"],
  toMarkers: ["a", "au", "aux", "vers", "pour", "en"],
  visitMarkers: ["visiter", "visite", "voir", "decouvrir"],
  articles: ["le", "la", "les", "l", "un", "une", "des", "du", "de"],
  monthNames: {
    janvier: 1, janv: 1, fevrier: 2, fevr: 2, mars: 3, avril: 4, avr: 4,
    mai: 5, juin: 6, juillet: 7, juil: 7, aout: 8, septembre: 9, sept: 9,
    octobre: 10, oct: 10, novembre: 11, nov: 11, decembre: 12, dec: 12,
  },
  ambiguousMonths: [],
  monthPrepositions: ["en", "pour", "de", "au", "pendant"],
  clauseMarkers: ["pour", "avec", "et", "en", "de"],
  peopleNouns: ["personnes", "personne", "voyageurs", "voyageur", "touristes", "touriste"],
  adultNouns: ["adultes", "adulte"],
  childNouns: ["enfants", "enfant"],
  infantNouns: ["bebes", "bebe", "nourrissons", "nourrisson"],
  privateWords: ["prive", "privee", "prives", "en prive"],
  groupWords: ["groupe", "en groupe"],
  categoryAliases: [
    { phrase: "croisiere sur le nil", slug: "nile-cruises" },
    { phrase: "croisiere nil", slug: "nile-cruises" },
    { phrase: "croisiere", slug: "nile-cruises" },
    { phrase: "croisieres", slug: "nile-cruises" },
    { phrase: "excursion d une journee", slug: "day-tour" },
    { phrase: "visite d une journee", slug: "day-tour" },
    { phrase: "tour d une journee", slug: "day-tour" },
    { phrase: "plusieurs jours", slug: "multi-days-tours" },
    { phrase: "circuit de plusieurs jours", slug: "multi-days-tours" },
    { phrase: "offre speciale", slug: "special-offers" },
    { phrase: "offres speciales", slug: "special-offers" },
  ],
  childPhrases: [
    "croisiere de luxe",
    "croisiere luxe",
    "excursion a terre",
    "demi journee",
    "demi journees",
    "visite de nuit",
  ],
  placeAliases: [
    { variant: "louxor", canonical: "luxor" },
    { variant: "assouan", canonical: "aswan" },
    { variant: "le caire", canonical: "cairo" },
    { variant: "guizeh", canonical: "giza" },
    { variant: "charm el cheikh", canonical: "sharm-el-sheikh" },
    { variant: "charm", canonical: "sharm-el-sheikh" },
  ],
  nonPlaceWords: [
    "luxe", "prive", "groupe", "jour", "jours", "nuit", "nuits", "semaine",
    "semaines", "croisiere", "novembre", "personnes", "aller", "allez", "vouloir",
    "trouver", "voir", "voyage", "voyages", "vol", "vols", "vacances", "sejour",
    "circuit", "circuits", "forfait", "visite", "meilleur", "hotel",
  ],
  tourismWords: ["luxe", "musee", "musees", "pyramides", "pyramide", "famille", "romantique", "aventure", "plage", "desert", "temple", "temples", "lune de miel", "histoire", "culture"],
};