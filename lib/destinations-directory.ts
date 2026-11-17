import { cache } from "react";
import { apiFetchReliable, formatApiError } from "@/lib/api";
import { getPageReliable } from "@/lib/data";
import { DESTINATION_DIRECTORY_LINKS, jordanDestinationSlug } from "@/lib/destination-links";
import { resolveRequiredApiResult } from "@/lib/resolve-api-result";
import type { ApiList, ApiPage, Locale } from "@/types/api";

export const loadDestinationsPage = cache(async (locale: Locale) =>
  resolveRequiredApiResult(await getPageReliable("destinations", locale), "Destinations page"),
);

const directoryQuery = new URLSearchParams({ page_limit: "20" });
for (const [, slug] of DESTINATION_DIRECTORY_LINKS) directoryQuery.append("slug[]", slug);
directoryQuery.append("slug[]", jordanDestinationSlug);

export async function loadDirectoryDestinations(locale: Locale) {
  const result = await apiFetchReliable<ApiList<ApiPage>>(`destinations?${directoryQuery}`, { locale });
  if (!result.ok) throw new Error(`Failed to fetch Destinations: ${formatApiError(result)}`);

  const data = result.value?.data;
  const records = Array.isArray(data) ? data : data?.data;
  if (!Array.isArray(records)) throw new Error("Failed to fetch Destinations: invalid list response");

  const destinations = new Map<string, ApiPage>();
  for (const record of records) {
    if (record.slug) destinations.set(record.slug.toLowerCase(), record);
  }
  return destinations;
}
