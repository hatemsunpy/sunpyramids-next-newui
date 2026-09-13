import type { LocaleLexicon } from "./types";

const ones: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12,
  treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezasseis: 16,
  dezesseis: 16, dezassete: 17, dezessete: 17, dezoito: 18, dezanove: 19,
  dezenove: 19,
};

const tens: Record<string, number> = {
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60,
};

export const ptLexicon: LocaleLexicon = {
  numberWords: { ...ones, ...tens },
  compoundTens: tens,
  compoundOnes: { ...ones },
  compoundGlue: ["e"],
  compoundOrder: "tens-first",
  dayUnits: ["dia", "dias"],
  nightUnits: ["noite", "noites"],
  weekUnits: ["semana", "semanas"],
  approximateMarkers: ["cerca", "aproximadamente", "quase", "por volta"],
  fromMarkers: ["de", "desde", "a partir de"],
  toMarkers: ["para", "a", "ate", "em"],
  visitMarkers: ["visitar", "visita", "ver", "conhecer", "descobrir"],
  articles: ["o", "a", "os", "as", "um", "uma", "do", "da", "dos", "das", "no", "na"],
  monthNames: {
    janeiro: 1, jan: 1, fevereiro: 2, fev: 2, marco: 3, mar: 3, abril: 4, abr: 4,
    maio: 5, mai: 5, junho: 6, jun: 6, julho: 7, jul: 7, agosto: 8, ago: 8,
    setembro: 9, set: 9, outubro: 10, out: 10, novembro: 11, nov: 11,
    dezembro: 12, dez: 12,
  },
  ambiguousMonths: [],
  monthPrepositions: ["em", "para", "de", "no", "na"],
  clauseMarkers: ["para", "com", "e", "em"],
  peopleNouns: ["pessoas", "pessoa", "viajantes", "viajante", "turistas", "turista"],
  adultNouns: ["adultos", "adulto"],
  childNouns: ["criancas", "crianca"],
  infantNouns: ["bebes", "bebe"],
  privateWords: ["privado", "privada", "particular"],
  groupWords: ["grupo", "em grupo"],
  categoryAliases: [
    { phrase: "cruzeiro no nilo", slug: "nile-cruises" },
    { phrase: "cruzeiro nilo", slug: "nile-cruises" },
    { phrase: "cruzeiro", slug: "nile-cruises" },
    { phrase: "cruzeiros", slug: "nile-cruises" },
    { phrase: "passeio de um dia", slug: "day-tour" },
    { phrase: "tour de um dia", slug: "day-tour" },
    { phrase: "excursao de um dia", slug: "day-tour" },
    { phrase: "passeio de varios dias", slug: "multi-days-tours" },
    { phrase: "viagem de varios dias", slug: "multi-days-tours" },
    { phrase: "oferta especial", slug: "special-offers" },
    { phrase: "ofertas especiais", slug: "special-offers" },
  ],
  childPhrases: [
    "cruzeiro de luxo",
    "cruzeiro luxo",
    "excursao em terra",
    "meio dia",
    "passeio noturno",
  ],
  placeAliases: [
    { variant: "luxor", canonical: "luxor" },
    { variant: "assuao", canonical: "aswan" },
    { variant: "o cairo", canonical: "cairo" },
    { variant: "gize", canonical: "giza" },
    { variant: "sharm", canonical: "sharm-el-sheikh" },
    { variant: "sharm el sheikh", canonical: "sharm-el-sheikh" },
  ],
  nonPlaceWords: [
    "luxo", "privado", "grupo", "dia", "dias", "noite", "noites", "semana",
    "semanas", "cruzeiro", "novembro", "pessoas", "ir", "querer", "encontrar",
    "ver", "viagem", "viagens", "voo", "voos", "ferias", "estadia",
    "pacote", "oferta", "melhor", "hotel",
  ],
  tourismWords: ["luxo", "museu", "museus", "piramides", "piramide", "familia", "romantico", "aventura", "praia", "deserto", "templo", "templos", "lua de mel", "historia", "cultura"],
};