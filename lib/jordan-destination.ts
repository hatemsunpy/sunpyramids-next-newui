import { cache } from "react";
import { apiFetchReliable } from "@/lib/api";
import { getDestinationReliable, tourListData, tourMeta } from "@/lib/data";
import { jordanDestinationSlug } from "@/lib/destination-links";
import type { JordanTourOrder, JordanTripType } from "@/lib/jordan-catalog-query";
import { resolveRequiredApiResult } from "@/lib/resolve-api-result";
import type { ApiList, ApiPage, Locale, Tour } from "@/types/api";

export const loadJordanDestination = cache(async (locale: Locale) => {
  return resolveRequiredApiResult<ApiPage>(await getDestinationReliable(jordanDestinationSlug, locale), "Jordan destination");
});

export const loadJordanPlaces = cache(async (locale: Locale) => {
  // The older Jordan record includes some incorrectly tagged tours. Use its
  // places and the new destination's places, as defined by Laravel's hierarchy.
  const placesQuery = new URLSearchParams({ page_limit: "200" });
  placesQuery.append("parent.slug[]", jordanDestinationSlug);
  placesQuery.append("parent.slug[]", "jordan");
  const placesResult = await apiFetchReliable<ApiList<ApiPage>>(`destinations?${placesQuery}`, { locale });
  if (!placesResult.ok || !placesResult.value?.data) return null;
  const places = placesResult.value.data;
  return Array.isArray(places) ? places : places.data ?? [];
});

const orderBy: Record<JordanTourOrder, string> = {
  recommended: "display_order,asc",
  shortest: "duration_in_days,asc|display_order,asc",
  longest: "duration_in_days,desc|display_order,asc",
};

export async function loadJordanTours(
  destination: ApiPage,
  locale: Locale,
  page: number,
  trip: JordanTripType = "all",
  order: JordanTourOrder = "recommended",
) {
  if (destination.id == null) return null;
  const places = await loadJordanPlaces(locale);
  if (!places) return null;
  const placeIds = new Set([destination.id]);
  for (const place of places) {
    if (place.id != null) placeIds.add(place.id);
  }

  const tourQuery = new URLSearchParams({
    exists: "wishlisted",
    order_by: orderBy[order],
    page_limit: "12",
    page: String(page),
  });
  for (const id of placeIds) tourQuery.append("destinations.id[]", String(id));
  if (trip === "day") tourQuery.set("duration_in_days", "1");
  if (trip === "multi-day") tourQuery.set("duration_in_days", "gt::1");

  const result = await apiFetchReliable<ApiList<Tour>>(`tours?${tourQuery}`, { locale });
  if (!result.ok || !result.value?.data) return null;

  const tours = tourListData(result.value);
  const dayTrip = tours.findLast((tour) => Number(tour.duration_in_days) === 1 && !!tour.gallery?.[0]);
  return { tours, meta: tourMeta(result.value), dayTripImage: dayTrip?.gallery?.[0] };
}
