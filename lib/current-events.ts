import type { ApiPage } from "@/types/api";
import { getEventCountdownDays } from "@/lib/local-date";

export function currentEvents(events: ApiPage[], referenceDate = new Date()): ApiPage[] {
  return events
    .map((event) => ({
      event,
      days: getEventCountdownDays(typeof event.date === "string" ? event.date : undefined, referenceDate),
    }))
    // Keep undated events, but place them after events with confirmed dates.
    .filter(({ days }) => days === null || days >= 0)
    .sort((a, b) => {
      if (a.days === null) return b.days === null ? 0 : 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    })
    .map(({ event }) => event);
}
