import type { Locale } from "@/types/api";

export type EgyptWeatherCityId =
  | "cairo"
  | "alexandria"
  | "luxor"
  | "aswan"
  | "hurghada"
  | "sharm";

export type WeatherIconKind =
  | "clear-day"
  | "clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export type WeatherConditionKey =
  | "clear"
  | "mainlyClear"
  | "partlyCloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunderstorm";

export type CityWeatherReading = {
  id: EgyptWeatherCityId;
  tempC: number;
  weatherCode: number;
  isDay: boolean;
};

export type EgyptWeatherSnapshot = {
  fetchedAt: string;
  cities: CityWeatherReading[];
};

export const DEFAULT_WEATHER_CITY_ID: EgyptWeatherCityId = "cairo";
export const WEATHER_REVALIDATE_SECONDS = 900;

export const EGYPT_CITIES: readonly { id: EgyptWeatherCityId; lat: number; lon: number }[] = [
  { id: "cairo", lat: 30.0444, lon: 31.2357 },
  { id: "alexandria", lat: 31.2001, lon: 29.9187 },
  { id: "luxor", lat: 25.6872, lon: 32.6396 },
  { id: "aswan", lat: 24.0889, lon: 32.8998 },
  { id: "hurghada", lat: 27.2579, lon: 33.8116 },
  { id: "sharm", lat: 27.9158, lon: 34.33 },
];

export const OPEN_METEO_EGYPT_URL =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${EGYPT_CITIES.map((city) => city.lat).join(",")}` +
  `&longitude=${EGYPT_CITIES.map((city) => city.lon).join(",")}` +
  "&current=temperature_2m,weather_code,is_day" +
  "&timezone=Africa%2FCairo";

export function isEgyptWeatherCityId(value: unknown): value is EgyptWeatherCityId {
  return typeof value === "string" && EGYPT_CITIES.some((city) => city.id === value);
}

export function isWeatherSnapshot(value: unknown): value is EgyptWeatherSnapshot {
  if (!value || typeof value !== "object") return false;
  const record = value as { fetchedAt?: unknown; cities?: unknown };
  if (typeof record.fetchedAt !== "string" || !Array.isArray(record.cities) || record.cities.length === 0) {
    return false;
  }
  return record.cities.every((city) => {
    if (!city || typeof city !== "object") return false;
    const item = city as Partial<CityWeatherReading>;
    return (
      isEgyptWeatherCityId(item.id) &&
      typeof item.tempC === "number" &&
      Number.isFinite(item.tempC) &&
      typeof item.weatherCode === "number" &&
      Number.isFinite(item.weatherCode) &&
      typeof item.isDay === "boolean"
    );
  });
}

export function weatherConditionFromCode(
  code: number,
  isDay: boolean,
): { icon: WeatherIconKind; conditionKey: WeatherConditionKey } {
  if (code === 0) {
    return { icon: isDay ? "clear-day" : "clear-night", conditionKey: "clear" };
  }
  if (code === 1) {
    return { icon: isDay ? "clear-day" : "clear-night", conditionKey: "mainlyClear" };
  }
  if (code === 2) {
    return { icon: isDay ? "partly-cloudy-day" : "partly-cloudy-night", conditionKey: "partlyCloudy" };
  }
  if (code === 3) {
    return { icon: "cloudy", conditionKey: "overcast" };
  }
  if (code === 45 || code === 48) {
    return { icon: "fog", conditionKey: "fog" };
  }
  if ((code >= 51 && code <= 57)) {
    return { icon: "drizzle", conditionKey: "drizzle" };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { icon: "rain", conditionKey: "rain" };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { icon: "snow", conditionKey: "snow" };
  }
  if (code >= 95 && code <= 99) {
    return { icon: "thunderstorm", conditionKey: "thunderstorm" };
  }
  return { icon: isDay ? "partly-cloudy-day" : "partly-cloudy-night", conditionKey: "partlyCloudy" };
}

export function parseOpenMeteoResponse(
  payload: unknown,
  fetchedAt = new Date().toISOString(),
): EgyptWeatherSnapshot | null {
  const entries = Array.isArray(payload) ? payload : payload && typeof payload === "object" ? [payload] : null;
  if (!entries || entries.length !== EGYPT_CITIES.length) return null;

  const cities: CityWeatherReading[] = [];
  for (let index = 0; index < EGYPT_CITIES.length; index += 1) {
    const raw = entries[index] as {
      current?: {
        temperature_2m?: unknown;
        weather_code?: unknown;
        is_day?: unknown;
      };
    } | null;
    const temp = raw?.current?.temperature_2m;
    const code = raw?.current?.weather_code;
    const isDay = raw?.current?.is_day;
    if (
      typeof temp !== "number" ||
      !Number.isFinite(temp) ||
      typeof code !== "number" ||
      !Number.isFinite(code)
    ) {
      return null;
    }
    const rounded = Math.round(temp);
    cities.push({
      id: EGYPT_CITIES[index].id,
      tempC: Object.is(rounded, -0) ? 0 : rounded,
      weatherCode: code,
      isDay: isDay === undefined ? true : Boolean(isDay),
    });
  }

  return { fetchedAt, cities };
}

export async function getEgyptWeather(): Promise<EgyptWeatherSnapshot | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(OPEN_METEO_EGYPT_URL, {
      headers: { Accept: "application/json" },
      cache: "force-cache",
      next: { revalidate: WEATHER_REVALIDATE_SECONDS },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return parseOpenMeteoResponse(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export type WeatherUiCopy = {
  title: string;
  buttonAria: string;
  loading: string;
  unavailable: string;
  retry: string;
  cities: Record<EgyptWeatherCityId, string>;
  conditions: Record<WeatherConditionKey, string>;
};

const WEATHER_COPY: Record<Locale, WeatherUiCopy> = {
  en: {
    title: "Weather in Egypt",
    buttonAria: "Weather in Egypt",
    loading: "Loading Egypt weather...",
    unavailable: "Weather is temporarily unavailable.",
    retry: "Retry",
    cities: {
      cairo: "Cairo",
      alexandria: "Alexandria",
      luxor: "Luxor",
      aswan: "Aswan",
      hurghada: "Hurghada",
      sharm: "Sharm El Sheikh",
    },
    conditions: {
      clear: "Clear sky",
      mainlyClear: "Mainly clear",
      partlyCloudy: "Partly cloudy",
      overcast: "Cloudy",
      fog: "Foggy",
      drizzle: "Light drizzle",
      rain: "Rain",
      snow: "Snow",
      thunderstorm: "Thunderstorm",
    },
  },
  fr: {
    title: "Météo en Égypte",
    buttonAria: "Météo en Égypte",
    loading: "Chargement de la météo...",
    unavailable: "Météo temporairement indisponible.",
    retry: "Réessayer",
    cities: {
      cairo: "Le Caire",
      alexandria: "Alexandrie",
      luxor: "Louxor",
      aswan: "Assouan",
      hurghada: "Hurghada",
      sharm: "Charm el-Cheikh",
    },
    conditions: {
      clear: "Ciel dégagé",
      mainlyClear: "Plutôt dégagé",
      partlyCloudy: "Partiellement nuageux",
      overcast: "Nuageux",
      fog: "Brouillard",
      drizzle: "Bruine légère",
      rain: "Pluie",
      snow: "Neige",
      thunderstorm: "Orage",
    },
  },
  de: {
    title: "Wetter in Ägypten",
    buttonAria: "Wetter in Ägypten",
    loading: "Wetter wird geladen...",
    unavailable: "Wetterdaten vorübergehend nicht verfügbar.",
    retry: "Erneut versuchen",
    cities: {
      cairo: "Kairo",
      alexandria: "Alexandria",
      luxor: "Luxor",
      aswan: "Assuan",
      hurghada: "Hurghada",
      sharm: "Scharm el-Scheich",
    },
    conditions: {
      clear: "Klarer Himmel",
      mainlyClear: "Überwiegend klar",
      partlyCloudy: "Teilweise bewölkt",
      overcast: "Bewölkt",
      fog: "Nebel",
      drizzle: "Leichter Nieselregen",
      rain: "Regen",
      snow: "Schnee",
      thunderstorm: "Gewitter",
    },
  },
  it: {
    title: "Meteo in Egitto",
    buttonAria: "Meteo in Egitto",
    loading: "Caricamento meteo...",
    unavailable: "Meteo temporaneamente non disponibile.",
    retry: "Riprova",
    cities: {
      cairo: "Il Cairo",
      alexandria: "Alessandria",
      luxor: "Luxor",
      aswan: "Assuan",
      hurghada: "Hurghada",
      sharm: "Sharm el-Sheikh",
    },
    conditions: {
      clear: "Cielo sereno",
      mainlyClear: "Prevalentemente sereno",
      partlyCloudy: "Parzialmente nuvoloso",
      overcast: "Nuvoloso",
      fog: "Nebbia",
      drizzle: "Pioggerella",
      rain: "Pioggia",
      snow: "Neve",
      thunderstorm: "Temporale",
    },
  },
  pt: {
    title: "Clima no Egito",
    buttonAria: "Clima no Egito",
    loading: "Carregando clima...",
    unavailable: "Clima temporariamente indisponível.",
    retry: "Tentar novamente",
    cities: {
      cairo: "Cairo",
      alexandria: "Alexandria",
      luxor: "Luxor",
      aswan: "Assuã",
      hurghada: "Hurghada",
      sharm: "Sharm El Sheikh",
    },
    conditions: {
      clear: "Céu limpo",
      mainlyClear: "Predominantemente limpo",
      partlyCloudy: "Parcialmente nublado",
      overcast: "Nublado",
      fog: "Nevoeiro",
      drizzle: "Garoa leve",
      rain: "Chuva",
      snow: "Neve",
      thunderstorm: "Tempestade",
    },
  },
  es: {
    title: "Clima en Egipto",
    buttonAria: "Clima en Egipto",
    loading: "Cargando el clima...",
    unavailable: "Clima temporalmente no disponible.",
    retry: "Reintentar",
    cities: {
      cairo: "El Cairo",
      alexandria: "Alejandría",
      luxor: "Lúxor",
      aswan: "Asuán",
      hurghada: "Hurgada",
      sharm: "Sharm el-Sheij",
    },
    conditions: {
      clear: "Cielo despejado",
      mainlyClear: "Mayormente despejado",
      partlyCloudy: "Parcialmente nublado",
      overcast: "Nublado",
      fog: "Niebla",
      drizzle: "Llovizna ligera",
      rain: "Lluvia",
      snow: "Nieve",
      thunderstorm: "Tormenta",
    },
  },
  zh: {
    title: "埃及天气",
    buttonAria: "埃及天气",
    loading: "正在加载天气...",
    unavailable: "天气数据暂时不可用。",
    retry: "重试",
    cities: {
      cairo: "开罗",
      alexandria: "亚历山大",
      luxor: "卢克索",
      aswan: "阿斯旺",
      hurghada: "赫尔格达",
      sharm: "沙姆沙伊赫",
    },
    conditions: {
      clear: "晴朗",
      mainlyClear: "大部晴朗",
      partlyCloudy: "多云",
      overcast: "阴天",
      fog: "有雾",
      drizzle: "小雨",
      rain: "降雨",
      snow: "降雪",
      thunderstorm: "雷暴",
    },
  },
};

export function weatherUiCopy(locale: Locale): WeatherUiCopy {
  return WEATHER_COPY[locale] ?? WEATHER_COPY.en;
}
