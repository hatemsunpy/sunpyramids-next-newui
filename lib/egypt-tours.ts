import {
  getCategoryReliable,
  getDestinationReliable,
  getPageReliable,
} from "@/lib/data";
import type { ApiResult } from "@/lib/api";
import type { ApiPage, Locale } from "@/types/api";

export const pageSlugMap: Record<string, string> = {
  "one-day-tours": "one-day-tours",
  "multi-days-tours": "multi-days-tours",
  "nile-cruises": "nile-cruises",
  "shore-excursions": "shore-excursions",
};

export const marketingPageKeyMap: Record<string, string> = {
  "egypt-sightseeing-tours": "egypt-sightseeing-tours",
  "egypt-travel-packages": "egypt-travel-packages",
  "egypt-vacation-packages": "egypt-vacation-packages",
  "pyramids-tours": "pyramids-tours",
};

export async function resolveEgyptToursPage(
  slug: string[],
  locale: Locale,
): Promise<ApiResult<ApiPage | null>> {
  const root = slug[0];
  const childSlug = slug.length > 1 ? slug[slug.length - 1] : null;
  if (childSlug) {
    if (root === "one-day-tours") {
      return getDestinationReliable(childSlug, locale);
    }
    return getCategoryReliable(childSlug, locale);
  }
  if (root === "multi-days-tours" || root === "shore-excursions") {
    return getCategoryReliable(root, locale);
  }
  const pageSlug = pageSlugMap[root] || marketingPageKeyMap[root];
  if (pageSlug) return getPageReliable(pageSlug, locale);
  return getCategoryReliable(root, locale);
}
