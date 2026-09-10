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

export function getYesterdayCalendarDate(referenceDate = new Date()): string {
  const yesterday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 1,
  );
  return formatCalendarDate(yesterday);
}
