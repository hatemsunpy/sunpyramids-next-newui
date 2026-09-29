import { parseLocalCalendarDate } from "@/lib/local-date";
import type { Tour } from "@/types/api";

/** Match the tour-level calendar rules supplied by Laravel. Empty lists are unrestricted. */
export function isTourDateAvailable(tour: Tour | null | undefined, dateString: string): boolean {
  const date = parseLocalCalendarDate(dateString);
  if (!date) return false;

  const availability = tour?.calender_availability;
  if (!availability) return true;

  const { day_numbers = [], day_names = [], month_names = [], years = [] } = availability;
  return (
    (day_numbers.length === 0 || day_numbers.includes(date.day)) &&
    (day_names.length === 0 || day_names.includes(date.weekday)) &&
    (month_names.length === 0 || month_names.includes(date.monthName)) &&
    (years.length === 0 || years.includes(date.year))
  );
}
