import { describe, expect, it } from "vitest";
import { parseVoiceQuery } from "./parse-voice-query";
import { mapCapabilities } from "./capability-mapper";
import type { ApiPage, Locale } from "@/types/api";
import type { VoiceTaxonomyInput } from "./types";

// Representative NATURAL voice phrasings per locale (not mechanical
// translations). Each block covers: destination+days, category+duration,
// origin→destination, number words, month, travelers, private/group,
// approximate duration, and a negative no-inference case.

const destinations: ApiPage[] = [
  { id: 11, title: "Cairo Tours", slug: "cairo" },
  { id: 12, title: "Luxor Tours", slug: "luxor" },
  { id: 13, title: "Aswan Tours", slug: "aswan" },
  { id: 14, title: "Hurghada Tours", slug: "hurghada" },
  { id: 15, title: "Sharm El Sheikh Tours", slug: "sharm-el-sheikh" },
];
const rootCategories: ApiPage[] = [
  { id: 1, title: "Day Tour", slug: "day-tour" },
  { id: 3, title: "Multi Days Tours", slug: "multi-days-tours" },
  { id: 17, title: "Nile Cruises", slug: "nile-cruises" },
];
const taxonomy: VoiceTaxonomyInput = { destinations, rootCategories };

function full(transcript: string, locale: Locale) {
  return mapCapabilities(parseVoiceQuery(transcript, locale), taxonomy);
}

describe("multilingual — French", () => {
  it("destination + exact days", () => {
    const r = full("Trouve-moi une croisière de 5 jours à Louxor", "fr");
    expect(r.intent.duration).toMatchObject({ value: 5, unit: "days", approximate: false });
    expect(r.intent.category?.hints).toEqual(["nile-cruises"]);
    expect(r.intent.destination?.normalized).toBe("louxor");
  });

  it("origin → destination with depuis/à", () => {
    const r = full("de Louxor à Assouan", "fr");
    expect(r.intent.origin?.normalized).toBe("louxor");
    expect(r.intent.destination?.normalized).toBe("assouan");
  });

  it("number words, month, travelers, private", () => {
    expect(full("Je veux un voyage de cinq jours", "fr").intent.duration).toMatchObject({ value: 5, unit: "days" });
    expect(full("en novembre", "fr").intent.month).toBe(11);
    expect(full("pour deux personnes", "fr").intent.travelers).toEqual({ total: 2 });
    expect(full("pour deux personnes", "fr").intent.destination).toBeUndefined();
    expect(full("voyage privé pour deux", "fr").intent.privacy).toBe("private");
  });

  it("approximate duration requires confirmation", () => {
    const r = full("environ une semaine", "fr");
    expect(r.intent.duration).toMatchObject({ value: 1, unit: "weeks", approximate: true });
  });

  it("negative: no category inferred from destination alone", () => {
    const r = full("un voyage à Assouan", "fr");
    expect(r.intent.destination?.normalized).toBe("assouan");
    expect(r.intent.category).toBeUndefined();
  });
});

describe("multilingual — German", () => {
  it("destination + exact days with hyphenated adjective", () => {
    const r = full("Ich möchte eine 7-tägige Nilkreuzfahrt von Luxor nach Assuan", "de");
    expect(r.intent.duration).toMatchObject({ value: 7, unit: "days", approximate: false });
    expect(r.intent.category?.hints).toEqual(["nile-cruises"]);
    expect(r.intent.origin?.normalized).toBe("luxor");
    expect(r.intent.destination?.normalized).toBe("assuan");
  });

  it("glued adjective form siebentägige", () => {
    const r = full("Ich möchte eine siebentägige Nilkreuzfahrt", "de");
    expect(r.intent.duration).toMatchObject({ value: 7, unit: "days" });
    expect(r.intent.category?.hints).toEqual(["nile-cruises"]);
  });

  it("origin → destination with von/nach", () => {
    const r = full("von Luxor nach Assuan", "de");
    expect(r.intent.origin?.normalized).toBe("luxor");
    expect(r.intent.destination?.normalized).toBe("assuan");
  });

  it("number words, month, travelers, private", () => {
    expect(full("Ich möchte fünf Tage", "de").intent.duration).toMatchObject({ value: 5, unit: "days" });
    expect(full("im November", "de").intent.month).toBe(11);
    expect(full("für zwei Personen", "de").intent.travelers).toEqual({ total: 2 });
    expect(full("für zwei Personen", "de").intent.destination).toBeUndefined();
    expect(full("eine private Tour nach Luxor", "de").intent.privacy).toBe("private");
  });

  it("approximate duration requires confirmation", () => {
    const r = full("ungefähr eine Woche", "de");
    expect(r.intent.duration).toMatchObject({ value: 1, unit: "weeks", approximate: true });
  });

  it("negative: no category inferred from destination alone", () => {
    const r = full("eine Reise nach Assuan", "de");
    expect(r.intent.destination?.normalized).toBe("assuan");
    expect(r.intent.category).toBeUndefined();
  });
});

describe("multilingual — Italian", () => {
  it("destination + exact days with ad-preposition", () => {
    const r = full("Vorrei una crociera sul Nilo di 5 giorni da Luxor ad Aswan", "it");
    expect(r.intent.duration).toMatchObject({ value: 5, unit: "days", approximate: false });
    expect(r.intent.category?.hints).toEqual(["nile-cruises"]);
    expect(r.intent.origin?.normalized).toBe("luxor");
    expect(r.intent.destination?.normalized).toBe("aswan");
  });

  it("origin → destination with da/a", () => {
    const r = full("da Luxor ad Aswan", "it");
    expect(r.intent.origin?.normalized).toBe("luxor");
    expect(r.intent.destination?.normalized).toBe("aswan");
  });

  it("number words, month, travelers, private", () => {
    expect(full("cinque giorni", "it").intent.duration).toMatchObject({ value: 5, unit: "days" });
    expect(full("a novembre", "it").intent.month).toBe(11);
    expect(full("per due persone", "it").intent.travelers).toEqual({ total: 2 });
    expect(full("per due persone", "it").intent.destination).toBeUndefined();
    expect(full("un tour privato", "it").intent.privacy).toBe("private");
  });

  it("approximate duration requires confirmation", () => {
    const r = full("circa una settimana", "it");
    expect(r.intent.duration).toMatchObject({ value: 1, unit: "weeks", approximate: true });
  });

  it("negative: no category inferred from destination alone", () => {
    const r = full("un viaggio ad Aswan", "it");
    expect(r.intent.destination?.normalized).toBe("aswan");
    expect(r.intent.category).toBeUndefined();
  });
});

describe("multilingual — Portuguese", () => {
  it("destination + exact days", () => {
    const r = full("Quero um cruzeiro no Nilo de 5 dias de Luxor para Assuão", "pt");
    expect(r.intent.duration).toMatchObject({ value: 5, unit: "days", approximate: false });
    expect(r.intent.category?.hints).toEqual(["nile-cruises"]);
    expect(r.intent.origin?.normalized).toBe("luxor");
    expect(r.intent.destination?.normalized).toBe("assuao");
  });

  it("origin → destination with de/para", () => {
    const r = full("de Luxor para Assuão", "pt");
    expect(r.intent.origin?.normalized).toBe("luxor");
    expect(r.intent.destination?.normalized).toBe("assuao");
  });

  it("number words, month, travelers, private", () => {
    expect(full("cinco dias", "pt").intent.duration).toMatchObject({ value: 5, unit: "days" });
    expect(full("em novembro", "pt").intent.month).toBe(11);
    expect(full("para duas pessoas", "pt").intent.travelers).toEqual({ total: 2 });
    expect(full("para duas pessoas", "pt").intent.destination).toBeUndefined();
    expect(full("viagem privada", "pt").intent.privacy).toBe("private");
  });

  it("approximate duration requires confirmation", () => {
    const r = full("quase uma semana", "pt");
    expect(r.intent.duration).toMatchObject({ value: 1, unit: "weeks", approximate: true });
  });

  it("negative: no category inferred from destination alone", () => {
    const r = full("uma viagem para Assuão", "pt");
    expect(r.intent.destination?.normalized).toBe("assuao");
    expect(r.intent.category).toBeUndefined();
  });
});

describe("multilingual — Spanish", () => {
  it("destination + exact days", () => {
    const r = full("Quiero un crucero por el Nilo de 5 días de Luxor a Asuán", "es");
    expect(r.intent.duration).toMatchObject({ value: 5, unit: "days", approximate: false });
    expect(r.intent.category?.hints).toEqual(["nile-cruises"]);
    expect(r.intent.origin?.normalized).toBe("luxor");
    expect(r.intent.destination?.normalized).toBe("asuan");
  });

  it("origin → destination with de/a", () => {
    const r = full("de Luxor a Asuán", "es");
    expect(r.intent.origin?.normalized).toBe("luxor");
    expect(r.intent.destination?.normalized).toBe("asuan");
  });

  it("number words, month, travelers, private", () => {
    expect(full("cinco días", "es").intent.duration).toMatchObject({ value: 5, unit: "days" });
    expect(full("en noviembre", "es").intent.month).toBe(11);
    expect(full("para dos personas", "es").intent.travelers).toEqual({ total: 2 });
    expect(full("para dos personas", "es").intent.destination).toBeUndefined();
    expect(full("tour privado", "es").intent.privacy).toBe("private");
  });

  it("approximate duration requires confirmation", () => {
    const r = full("alrededor de una semana", "es");
    expect(r.intent.duration).toMatchObject({ value: 1, unit: "weeks", approximate: true });
  });

  it("negative: no category inferred from destination alone", () => {
    const r = full("un viaje a Asuán", "es");
    expect(r.intent.destination?.normalized).toBe("asuan");
    expect(r.intent.category).toBeUndefined();
  });
});

describe("multilingual — Chinese", () => {
  it("destination + exact days + category + origin in one spaceless query", () => {
    const r = full("找一条从卢克索到阿斯旺的七天尼罗河游轮", "zh");
    expect(r.intent.duration).toMatchObject({ value: 7, unit: "days", approximate: false });
    expect(r.intent.category?.hints).toEqual(["nile-cruises"]);
    expect(r.intent.origin?.normalized).toBe("卢克索");
    expect(r.intent.destination?.normalized).toBe("阿斯旺");
  });

  it("origin → destination bare pattern", () => {
    const r = full("卢克索到阿斯旺", "zh");
    expect(r.intent.origin?.normalized).toBe("卢克索");
    expect(r.intent.destination?.normalized).toBe("阿斯旺");
  });

  it("Han numerals, month, travelers, private", () => {
    expect(full("五天", "zh").intent.duration).toMatchObject({ value: 5, unit: "days" });
    expect(full("两天一夜游", "zh").intent.duration).toMatchObject({ value: 2, unit: "days" });
    expect(full("十一月去开罗", "zh").intent.month).toBe(11);
    expect(full("两个人", "zh").intent.travelers).toEqual({ total: 2 });
    expect(full("两个人", "zh").intent.destination).toBeUndefined();
    expect(full("我想预订私人旅游", "zh").intent.privacy).toBe("private");
    expect(full("我想预订私人旅游", "zh").intent.origin).toBeUndefined();
  });

  it("approximate duration (leading and trailing markers)", () => {
    expect(full("大约五天的行程", "zh").intent.duration).toMatchObject({
      value: 5,
      unit: "days",
      approximate: true,
    });
    expect(full("五天左右", "zh").intent.duration).toMatchObject({
      value: 5,
      unit: "days",
      approximate: true,
    });
  });

  it("date guard: 6月5日 yields month only, never a duration", () => {
    const r = full("6月5日", "zh");
    expect(r.intent.month).toBe(6);
    expect(r.intent.duration).toBeUndefined();
  });

  it("negative: destination without category inference", () => {
    const r = full("去阿斯旺旅行", "zh");
    expect(r.intent.destination?.normalized).toBe("阿斯旺");
    expect(r.intent.category).toBeUndefined();
  });
});

describe("multilingual — resolved end-to-end spot checks", () => {
  it("fr Louxor resolves to the live luxor slug", () => {
    const r = full("Trouve-moi une croisière de 5 jours à Louxor", "fr");
    const dest = r.fields.find((f) => f.field === "destination");
    expect(dest).toMatchObject({ status: "applicable", slug: "luxor" });
  });

  it("de Assuan resolves to the live aswan slug", () => {
    const r = full("Ich möchte eine 7-tägige Nilkreuzfahrt von Luxor nach Assuan", "de");
    const dest = r.fields.find((f) => f.field === "destination");
    expect(dest).toMatchObject({ status: "applicable", slug: "aswan" });
    const cat = r.fields.find((f) => f.field === "category");
    expect(cat).toMatchObject({ status: "applicable", slug: "nile-cruises" });
  });

  it("zh 阿斯旺 resolves via alias to the live aswan slug", () => {
    const r = full("找一条从卢克索到阿斯旺的七天尼罗河游轮", "zh");
    const dest = r.fields.find((f) => f.field === "destination");
    expect(dest).toMatchObject({ status: "applicable", slug: "aswan" });
    const origin = r.fields.find((f) => f.field === "origin");
    expect(origin?.status).toBe("recognized-but-not-applicable");
  });
});

describe("multilingual — bare destinations (telegraphic queries)", () => {
  const destinationOf = (result: { fields: { field: string }[] }) =>
    result.fields.find((f) => f.field === "destination");
  const durationOf = (result: { fields: { field: string }[] }) =>
    result.fields.find((f) => f.field === "duration");

  it("fr: Le Caire, 5 jours → cairo applicable", () => {
    const r = full("Le Caire, 5 jours", "fr");
    expect(destinationOf(r)).toMatchObject({ status: "applicable", slug: "cairo" });
    expect(durationOf(r)).toMatchObject({ status: "applicable", value: 5 });
  });

  it("de: Kairo, 5 Tage → cairo applicable via alias", () => {
    const r = full("Kairo, 5 Tage", "de");
    expect(destinationOf(r)).toMatchObject({ status: "applicable", slug: "cairo" });
    expect(durationOf(r)).toMatchObject({ status: "applicable", value: 5 });
  });

  it("it: Il Cairo, 5 giorni → cairo applicable", () => {
    const r = full("Il Cairo, 5 giorni", "it");
    expect(destinationOf(r)).toMatchObject({ status: "applicable", slug: "cairo" });
    expect(durationOf(r)).toMatchObject({ status: "applicable", value: 5 });
  });

  it("pt: O Cairo, 5 dias → cairo applicable via alias", () => {
    const r = full("O Cairo, 5 dias", "pt");
    expect(destinationOf(r)).toMatchObject({ status: "applicable", slug: "cairo" });
    expect(durationOf(r)).toMatchObject({ status: "applicable", value: 5 });
  });

  it("es: El Cairo, 5 días → cairo applicable via alias", () => {
    const r = full("El Cairo, 5 días", "es");
    expect(destinationOf(r)).toMatchObject({ status: "applicable", slug: "cairo" });
    expect(durationOf(r)).toMatchObject({ status: "applicable", value: 5 });
  });

  it("zh: 开罗三天游 → cairo + 3 days", () => {
    const r = full("开罗三天游", "zh");
    expect(destinationOf(r)).toMatchObject({ status: "applicable", slug: "cairo" });
    expect(durationOf(r)).toMatchObject({ status: "applicable", value: 3 });
  });
});