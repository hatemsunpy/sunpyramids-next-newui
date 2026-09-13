import type { LocaleLexicon } from "./types";

const ones: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15,
};

const tens: Record<string, number> = {
  veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
};

// veintiún (normalized veintiun) … veintinueve generated deterministically.
function veintiForms(): Record<string, number> {
  const endings: [string, number][] = [
    ["un", 1], ["dos", 2], ["tres", 3], ["cuatro", 4], ["cinco", 5],
    ["seis", 6], ["siete", 7], ["ocho", 8], ["nueve", 9],
  ];
  const out: Record<string, number> = {};
  for (const [ending, value] of endings) {
    out[`veinti${ending}`] = 20 + value;
  }
  return out;
}

const teens: Record<string, number> = {
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, ...veintiForms(),
};

export const esLexicon: LocaleLexicon = {
  numberWords: { ...ones, ...tens, ...teens },
  compoundTens: tens,
  compoundOnes: {
    un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
    seis: 6, siete: 7, ocho: 8, nueve: 9,
  },
  compoundGlue: ["y"],
  compoundOrder: "tens-first",
  dayUnits: ["dia", "dias"],
  nightUnits: ["noche", "noches"],
  weekUnits: ["semana", "semanas"],
  approximateMarkers: ["alrededor", "aproximadamente", "casi", "mas o menos"],
  fromMarkers: ["de", "desde", "salida de"],
  toMarkers: ["a", "al", "hacia", "para", "en"],
  visitMarkers: ["visitar", "visita", "ver", "conocer", "descubrir"],
  articles: ["el", "la", "los", "las", "un", "una", "del", "al"],
  monthNames: {
    enero: 1, ene: 1, febrero: 2, feb: 2, marzo: 3, mar: 3, abril: 4, abr: 4,
    mayo: 5, may: 5, junio: 6, jun: 6, julio: 7, jul: 7, agosto: 8, ago: 8,
    septiembre: 9, sep: 9, octubre: 10, oct: 10, noviembre: 11, nov: 11,
    diciembre: 12, dic: 12,
  },
  ambiguousMonths: [],
  monthPrepositions: ["en", "para", "de", "el"],
  clauseMarkers: ["para", "con", "y", "e", "en"],
  peopleNouns: ["personas", "persona", "viajeros", "viajero", "turistas", "turista"],
  adultNouns: ["adultos", "adulto"],
  childNouns: ["ninos", "nino", "ninas", "nina"],
  infantNouns: ["bebes", "bebe"],
  privateWords: ["privado", "privada", "en privado"],
  groupWords: ["grupo", "en grupo"],
  categoryAliases: [
    { phrase: "crucero por el nilo", slug: "nile-cruises" },
    { phrase: "crucero nilo", slug: "nile-cruises" },
    { phrase: "crucero", slug: "nile-cruises" },
    { phrase: "cruceros", slug: "nile-cruises" },
    { phrase: "tour de un dia", slug: "day-tour" },
    { phrase: "excursion de un dia", slug: "day-tour" },
    { phrase: "visita de un dia", slug: "day-tour" },
    { phrase: "tour de varios dias", slug: "multi-days-tours" },
    { phrase: "viaje de varios dias", slug: "multi-days-tours" },
    { phrase: "oferta especial", slug: "special-offers" },
    { phrase: "ofertas especiales", slug: "special-offers" },
  ],
  childPhrases: [
    "crucero de lujo",
    "crucero lujo",
    "excursion en tierra",
    "medio dia",
    "tour nocturno",
  ],
  placeAliases: [
    { variant: "el cairo", canonical: "cairo" },
    { variant: "asuan", canonical: "aswan" },
    { variant: "guiza", canonical: "giza" },
    { variant: "sharm", canonical: "sharm-el-sheikh" },
    { variant: "sharm el sheikh", canonical: "sharm-el-sheikh" },
  ],
  nonPlaceWords: [
    "lujo", "privado", "grupo", "dia", "dias", "noche", "noches", "semana",
    "semanas", "crucero", "noviembre", "personas", "ir", "querer",
    "encontrar", "ver", "viaje", "viajes", "vuelo", "vuelos", "vacaciones",
    "estancia", "paquete", "oferta", "mejor", "hotel",
  ],
  tourismWords: ["lujo", "museo", "museos", "piramides", "piramide", "familia", "romantico", "aventura", "playa", "desierto", "templo", "templos", "luna de miel", "historia", "cultura"],
};