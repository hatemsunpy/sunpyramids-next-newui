import { unstable_cache } from "next/cache";
import { API_BASE } from "@/lib/config";
import { loadSitemapDataset } from "@/lib/sitemap/api";
import { buildSitemapCatalog } from "@/lib/sitemap/builders";
import { SITEMAP_REVALIDATE_SECONDS } from "@/lib/sitemap/config";

// Cache the compact, normalized catalog rather than the rich raw API payload.
// The raw response is currently much larger than Next's per-item Data Cache limit.
// Building before returning keeps this atomic: any required-source error throws,
// so an expired last-known-good catalog is never replaced by partial data.
export const getSitemapCatalog = unstable_cache(
  async () => buildSitemapCatalog(await loadSitemapDataset()),
  ["sunpyramids-sitemap-phase1-catalog-v5", API_BASE],
  { revalidate: SITEMAP_REVALIDATE_SECONDS },
);
