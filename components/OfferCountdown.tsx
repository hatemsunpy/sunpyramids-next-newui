"use client";

import { useEffect, useState } from "react";
import {
  computeOfferCountdown,
  parseOfferEndDate,
  type OfferCountdownParts,
} from "@/lib/offer-countdown";
import type { Locale } from "@/types/api";

const LABELS: Record<Locale, [string, string, string, string]> = {
  en: ["Days", "Hours", "Minutes", "Seconds"],
  fr: ["Jours", "Heures", "Minutes", "Secondes"],
  de: ["Tage", "Stunden", "Minuten", "Sekunden"],
  it: ["Giorni", "Ore", "Minuti", "Secondi"],
  pt: ["Dias", "Horas", "Minutos", "Segundos"],
  es: ["Días", "Horas", "Minutos", "Segundos"],
  zh: ["天", "小时", "分钟", "秒"],
};

const pad = (value: number) => String(value).padStart(2, "0");

export function OfferCountdown({
  endDate,
  locale = "en",
}: {
  endDate: string;
  locale?: Locale;
}) {
  const [countdown, setCountdown] = useState<{
    endDate: string;
    remaining: OfferCountdownParts | null;
  } | null>(null);

  useEffect(() => {
    const endMs = parseOfferEndDate(endDate);
    if (endMs === null) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      const parts = computeOfferCountdown(endMs, Date.now());
      setCountdown({ endDate, remaining: parts });
      if (parts === null && interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const timeout = setTimeout(tick, 0);
    interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [endDate]);

  const remaining = countdown?.endDate === endDate ? countdown.remaining : null;
  if (!remaining) return null;

  const labels = LABELS[locale] ?? LABELS.en;
  const values = [
    pad(remaining.days),
    pad(remaining.hours),
    pad(remaining.minutes),
    pad(remaining.seconds),
  ];

  return (
    <div className="offer-countdown">
      {labels.map((label, index) => (
        <div key={label}>
          <span className="offer-countdown-value">{values[index]}</span>
          <span className="offer-countdown-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
