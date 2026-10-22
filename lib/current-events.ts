import type { ApiPage } from "@/types/api";
import { getEventCountdownDays } from "@/lib/local-date";

export function currentEvents(events: ApiPage[], referenceDate = new Date()): ApiPage[] {
  return events.filter((event) => {
    const days = getEventCountdownDays(typeof event.date === "string" ? event.date : undefined, referenceDate);
    // No reliable date means there is no evidence the event has expired.
    return days === null || days >= 0;
  });
}
