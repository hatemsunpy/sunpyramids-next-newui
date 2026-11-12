"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Check,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react";
import type { Locale } from "@/types/api";
import {
  DEFAULT_WEATHER_CITY_ID,
  isEgyptWeatherCityId,
  isWeatherSnapshot,
  WEATHER_REVALIDATE_SECONDS,
  weatherConditionFromCode,
  weatherUiCopy,
  type EgyptWeatherCityId,
  type EgyptWeatherSnapshot,
  type WeatherIconKind,
} from "@/lib/weather";

const WEATHER_CITY_STORAGE_KEY = "sunpyramids-weather-city";
const WEATHER_CITY_EVENT = "sunpyramids:weather-city";
const WEATHER_STALE_MS = WEATHER_REVALIDATE_SECONDS * 1000;

function subscribeWeatherCity(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(WEATHER_CITY_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(WEATHER_CITY_EVENT, onStoreChange);
  };
}

function getClientWeatherCity(): EgyptWeatherCityId {
  try {
    const saved = window.localStorage.getItem(WEATHER_CITY_STORAGE_KEY);
    return isEgyptWeatherCityId(saved) ? saved : DEFAULT_WEATHER_CITY_ID;
  } catch {
    return DEFAULT_WEATHER_CITY_ID;
  }
}

function getServerWeatherCity(): EgyptWeatherCityId {
  return DEFAULT_WEATHER_CITY_ID;
}

function newerSnapshot(
  client: EgyptWeatherSnapshot | null,
  server: EgyptWeatherSnapshot | null,
): EgyptWeatherSnapshot | null {
  if (!client) return server;
  if (!server) return client;
  const clientMs = Date.parse(client.fetchedAt);
  const serverMs = Date.parse(server.fetchedAt);
  if (Number.isFinite(clientMs) && Number.isFinite(serverMs)) {
    return clientMs >= serverMs ? client : server;
  }
  return client;
}

function isSnapshotStale(snapshot: EgyptWeatherSnapshot | null) {
  if (!snapshot) return true;
  const timestamp = Date.parse(snapshot.fetchedAt);
  return !Number.isFinite(timestamp) || Date.now() - timestamp > WEATHER_STALE_MS;
}

function WeatherGlyph({ kind, className }: { kind: WeatherIconKind; className?: string }) {
  const shared = {
    "aria-hidden": true as const,
    className: `weather-glyph weather-glyph--${kind} ${className ?? ""}`.trim(),
    strokeWidth: 1.8,
  };
  switch (kind) {
    case "clear-day":
      return <Sun {...shared} />;
    case "clear-night":
      return <Moon {...shared} />;
    case "partly-cloudy-day":
      return <CloudSun {...shared} />;
    case "partly-cloudy-night":
      return <CloudMoon {...shared} />;
    case "cloudy":
      return <Cloud {...shared} />;
    case "fog":
      return <CloudFog {...shared} />;
    case "drizzle":
      return <CloudDrizzle {...shared} />;
    case "rain":
      return <CloudRain {...shared} />;
    case "snow":
      return <CloudSnow {...shared} />;
    case "thunderstorm":
      return <CloudLightning {...shared} />;
  }
}

export function HeaderWeather({
  locale = "en",
  initialWeather = null,
}: {
  locale?: Locale;
  initialWeather?: EgyptWeatherSnapshot | null;
}) {
  const copy = weatherUiCopy(locale);
  const [clientWeather, setClientWeather] = useState<EgyptWeatherSnapshot | null>(null);
  const selectedCityId = useSyncExternalStore(
    subscribeWeatherCity,
    getClientWeatherCity,
    getServerWeatherCity,
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const weather = newerSnapshot(clientWeather, initialWeather);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const loadWeather = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setFailed(false);

    try {
      const response = await fetch("/api/weather", { signal: controller.signal });
      if (!response.ok) {
        if (!controller.signal.aborted) setFailed(true);
        return;
      }
      const data: unknown = await response.json();
      if (!controller.signal.aborted) {
        if (isWeatherSnapshot(data)) {
          setClientWeather(data);
          setFailed(false);
        } else {
          setFailed(true);
        }
      }
    } catch {
      if (!controller.signal.aborted) {
        setFailed(true);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && isSnapshotStale(weather)) {
      void loadWeather();
    }
  };

  const handleSelectCity = (cityId: EgyptWeatherCityId) => {
    try {
      window.localStorage.setItem(WEATHER_CITY_STORAGE_KEY, cityId);
    } catch {
      // Storage may be unavailable in private browsing.
    }
    window.dispatchEvent(new Event(WEATHER_CITY_EVENT));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const cities = weather?.cities ?? [];
  const activeReading =
    cities.find((city) => city.id === selectedCityId) ??
    cities.find((city) => city.id === DEFAULT_WEATHER_CITY_ID) ??
    cities[0] ??
    null;

  const activeMeta = activeReading
    ? weatherConditionFromCode(activeReading.weatherCode, activeReading.isDay)
    : null;

  const buttonAria = activeReading && activeMeta
    ? `${copy.buttonAria}: ${copy.cities[activeReading.id]}, ${activeReading.tempC}°C, ${copy.conditions[activeMeta.conditionKey]}`
    : copy.buttonAria;

  return (
    <div className={`weather-dropdown ${open ? "weather-dropdown--open" : ""}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="header-weather-trigger"
        aria-label={buttonAria}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <WeatherGlyph kind={activeMeta?.icon ?? "clear-day"} className="header-weather-icon" />
        <span className="header-weather-temp">
          {activeReading ? (
            <>
              {activeReading.tempC}°<span className="header-weather-unit">C</span>
            </>
          ) : (
            "--°"
          )}
        </span>
      </button>

      {open ? (
        <div className="weather-dropdown-panel" role="region" aria-label={copy.title}>
          <div className="weather-dropdown-head">
            <span className="weather-dropdown-title">{copy.title}</span>
            {activeReading ? (
              <span className="weather-dropdown-active-city">{copy.cities[activeReading.id]}</span>
            ) : null}
          </div>

          {cities.length > 0 ? (
            <ul className="weather-city-list">
              {cities.map((reading) => {
                const { icon, conditionKey } = weatherConditionFromCode(reading.weatherCode, reading.isDay);
                const isSelected = activeReading?.id === reading.id;
                return (
                  <li key={reading.id}>
                    <button
                      type="button"
                      className={`weather-city-item ${isSelected ? "weather-city-item--active" : ""}`}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectCity(reading.id)}
                    >
                      <span className="weather-city-info">
                        <span className="weather-city-name">
                          {copy.cities[reading.id]}
                          {isSelected ? <Check aria-hidden="true" className="weather-city-check" strokeWidth={2.2} /> : null}
                        </span>
                        <span className="weather-city-condition">{copy.conditions[conditionKey]}</span>
                      </span>
                      <span className="weather-city-reading">
                        <WeatherGlyph kind={icon} className="weather-city-icon" />
                        <span className="weather-city-temp">{reading.tempC}°C</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : loading ? (
            <p className="weather-dropdown-status" role="status">{copy.loading}</p>
          ) : (
            <div className="weather-dropdown-status" role="status">
              <p>{failed ? copy.unavailable : copy.loading}</p>
              <button
                type="button"
                className="weather-retry-btn"
                onClick={() => void loadWeather()}
              >
                {copy.retry}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
