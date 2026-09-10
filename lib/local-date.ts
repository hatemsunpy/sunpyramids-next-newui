/**
 * Parse a booking date string into local calendar parts without UTC conversion.
 *
 * Booking dates arrive as "2026-09-25T00:00:00.000000Z" (API) or "2026-09-25"
 * (date input). Passing these through `new Date()` converts midnight UTC to the
 * previous local day in UTC-negative time zones, which breaks calendar-day and
 * season matching. This parser extracts the numeric year/month/day directly and
 * constructs a local Date via `new Date(y, m, d)`.
 *
 * Returns null for malformed input.
 */
export type LocalCalendarDate = {
  year: number;
  monthIndex: number; // 0-based
  day: number; // 1-based day of month
  weekday: string; // e.g. "monday"
  monthName: string; // e.g. "september"
  date: Date; // local Date object
};

export function parseLocalCalendarDate(value?: string): LocalCalendarDate | null {
  if (!value) return null;
  const match = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;

  const date = new Date(year, monthIndex, day);
  if (Number.isNaN(date.getTime())) return null;

  return {
    year,
    monthIndex,
    day,
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase(),
    monthName: date.toLocaleDateString("en-US", { month: "long" }).toLowerCase(),
    date,
  };
}

export function formatCalendarDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Return current calendar year, month (1-based), and day in Africa/Cairo timezone.
 */
export function getCairoCalendarDate(referenceDate = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(referenceDate);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return { year, month, day };
}

/**
 * Return yesterday's calendar date (YYYY-MM-DD) evaluated in Africa/Cairo timezone.
 */
export function getYesterdayCalendarDate(referenceDate = new Date()): string {
  const { year, month, day } = getCairoCalendarDate(referenceDate);
  const yesterdayDate = new Date(Date.UTC(year, month - 1, day - 1));
  const y = yesterdayDate.getUTCFullYear();
  const m = String(yesterdayDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(yesterdayDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calculate the exact integer calendar day difference between an event date and
 * today's calendar date in Africa/Cairo.
 *
 * Returns:
 *  0: Event is today
 *  1: Event is tomorrow
 *  N: Event is in N days
 *  <0: Event is in the past
 *  null: Malformed date string
 */
export function getEventCountdownDays(
  eventDateStr?: string,
  referenceDate = new Date(),
): number | null {
  if (!eventDateStr) return null;
  const match = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(eventDateStr);
  if (!match) return null;

  const eventYear = Number(match[1]);
  const eventMonth = Number(match[2]);
  const eventDay = Number(match[3]);

  const { year: cairoYear, month: cairoMonth, day: cairoDay } =
    getCairoCalendarDate(referenceDate);

  const eventUtc = Date.UTC(eventYear, eventMonth - 1, eventDay);
  const cairoUtc = Date.UTC(cairoYear, cairoMonth - 1, cairoDay);

  return Math.round((eventUtc - cairoUtc) / 86400000);
}

