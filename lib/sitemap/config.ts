import type { Locale } from "@/types/api";

export const SITEMAP_REVALIDATE_SECONDS = 60 * 60 * 24;
export const SITEMAP_API_TIMEOUT_MS = 20_000;
export const SITEMAP_API_MAX_ATTEMPTS = 3;
export const SITEMAP_API_PAGE_LIMIT = 100;
export const SITEMAP_MAX_URLS = 45_000;
export const SITEMAP_MAX_XML_BYTES = 45 * 1024 * 1024;
export const SITEMAP_PREFERRED_TOUR_CHUNKS = 3;

export const SITEMAP_LOCALES: readonly Locale[] = ["en", "fr", "de", "it", "pt", "es", "zh"];

export const SITEMAP_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": `public, s-maxage=${SITEMAP_REVALIDATE_SECONDS}, stale-while-revalidate=${SITEMAP_REVALIDATE_SECONDS}`,
} as const;
