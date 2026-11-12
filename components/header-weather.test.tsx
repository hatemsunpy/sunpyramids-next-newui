import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Header } from "@/components/Header";
import { GET as getWeatherRoute } from "@/app/api/weather/route";
import {
  EGYPT_CITIES,
  parseOpenMeteoResponse,
  weatherConditionFromCode,
  type EgyptWeatherSnapshot,
} from "@/lib/weather";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const sampleSnapshot: EgyptWeatherSnapshot = {
  fetchedAt: new Date().toISOString(),
  cities: [
    { id: "cairo", tempC: 25, weatherCode: 0, isDay: true },
    { id: "alexandria", tempC: 22, weatherCode: 2, isDay: true },
    { id: "luxor", tempC: 31, weatherCode: 1, isDay: true },
    { id: "aswan", tempC: 33, weatherCode: 0, isDay: true },
    { id: "hurghada", tempC: 28, weatherCode: 3, isDay: true },
    { id: "sharm", tempC: 29, weatherCode: 0, isDay: false },
  ],
};

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Egypt weather parser & WMO mapping", () => {
  it("parses a multi-city Open-Meteo payload in city order", () => {
    const raw = EGYPT_CITIES.map((_, index) => ({
      current: {
        temperature_2m: 20.4 + index,
        weather_code: index === 1 ? 2 : 0,
        is_day: 1,
      },
    }));

    const parsed = parseOpenMeteoResponse(raw, "2026-11-12T15:00:00.000Z");
    expect(parsed).not.toBeNull();
    expect(parsed?.cities).toHaveLength(EGYPT_CITIES.length);
    expect(parsed?.cities[0]).toEqual({ id: "cairo", tempC: 20, weatherCode: 0, isDay: true });
    expect(parsed?.cities[1]).toEqual({ id: "alexandria", tempC: 21, weatherCode: 2, isDay: true });
  });

  it("returns null on malformed or incomplete Open-Meteo payloads", () => {
    expect(parseOpenMeteoResponse(null)).toBeNull();
    expect(parseOpenMeteoResponse([{ current: { temperature_2m: 25 } }])).toBeNull();
  });

  it("maps day/night WMO weather codes accurately", () => {
    expect(weatherConditionFromCode(0, true)).toEqual({ icon: "clear-day", conditionKey: "clear" });
    expect(weatherConditionFromCode(0, false)).toEqual({ icon: "clear-night", conditionKey: "clear" });
    expect(weatherConditionFromCode(63, true)).toEqual({ icon: "rain", conditionKey: "rain" });
    expect(weatherConditionFromCode(95, true)).toEqual({ icon: "thunderstorm", conditionKey: "thunderstorm" });
  });
});

describe("/api/weather route", () => {
  it("returns 200 with cache headers when Open-Meteo succeeds", async () => {
    const raw = EGYPT_CITIES.map((_, index) => ({
      current: { temperature_2m: 24 + index, weather_code: 0, is_day: 1 },
    }));
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(raw)));

    const response = await getWeatherRoute();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=900");
    const body = (await response.json()) as EgyptWeatherSnapshot;
    expect(body.cities[0].id).toBe("cairo");
    expect(body.cities[0].tempC).toBe(24);
  });

  it("returns 503 with no-store when Open-Meteo fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("error", { status: 502 })));

    const response = await getWeatherRoute();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("HeaderWeather UI", () => {
  it("renders Cairo temperature in the header badge and switches cities via dropdown", () => {
    render(<Header locale="en" weather={sampleSnapshot} />);

    const trigger = screen.getByRole("button", { name: /Weather in Egypt: Cairo, 25°C, Clear sky/i });
    expect(trigger).toHaveTextContent("25°C");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const panel = screen.getByRole("region", { name: "Weather in Egypt" });
    expect(within(panel).getByRole("button", { name: /Cairo/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(panel).getByRole("button", { name: /Luxor/i })).toBeInTheDocument();
    expect(within(panel).getByText("31°C")).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole("button", { name: /Luxor/i }));
    expect(screen.queryByRole("region", { name: "Weather in Egypt" })).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("31°C");
    expect(window.localStorage.getItem("sunpyramids-weather-city")).toBe("luxor");
  });

  it("loads weather from /api/weather on open when initialWeather is absent and closes on Escape", async () => {
    const fetchMock = vi.fn(async () => Response.json(sampleSnapshot));
    vi.stubGlobal("fetch", fetchMock);

    render(<Header locale="fr" />);
    const trigger = screen.getByRole("button", { name: "Météo en Égypte" });
    expect(trigger).toHaveTextContent("--°");
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(trigger);
    await waitFor(() => {
      expect(trigger).toHaveTextContent("25°C");
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/weather", expect.any(Object));
    const panel = screen.getByRole("region", { name: "Météo en Égypte" });
    expect(within(panel).getByRole("button", { name: /Le Caire/i })).toHaveAttribute("aria-pressed", "true");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "Météo en Égypte" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("shows a controlled unavailable state and retry button when /api/weather fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "weather-unavailable" }, { status: 503 })));

    render(<Header locale="en" />);
    const trigger = screen.getByRole("button", { name: "Weather in Egypt" });
    await act(async () => {
      fireEvent.click(trigger);
    });

    await waitFor(() => {
      expect(screen.getByText("Weather is temporarily unavailable.")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
