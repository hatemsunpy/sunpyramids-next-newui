import { FRONTEND_ORIGIN } from "@/lib/seo";
import { tourPath } from "@/lib/locales";
import {
  SITEMAP_LOCALES,
  SITEMAP_MAX_URLS,
  SITEMAP_MAX_XML_BYTES,
  SITEMAP_PREFERRED_TOUR_CHUNKS,
} from "@/lib/sitemap/config";
import type {
  SitemapApiItem,
  SitemapCatalog,
  SitemapDataset,
  SitemapImage,
  SitemapRecord,
} from "@/lib/sitemap/types";
import { absolutePublicUrl, sitemapRecordXmlEntries } from "@/lib/sitemap/xml";
import type { Locale } from "@/types/api";

const ALL_LOCALES = [...SITEMAP_LOCALES];
const ENGLISH_ONLY: Locale[] = ["en"];

const PAGE_ROUTE_CAPABILITIES: Record<string, { path: string; locales?: Locale[] }> = {
  home: { path: "/" },
  "about-us": { path: "/about-us" },
  "special-page": { path: "/accessible-travel" },
  "book-egypt-trip": { path: "/book-egypt-trip" },
  "contact-us": { path: "/contact-us" },
  "all-blogs": { path: "/blogs/all-blogs" },
  blog: { path: "/egypt-travel-guide" },
  events: { path: "/events" },
  faqs: { path: "/faqs" },
  "make-your-trip": { path: "/make-your-trip" },
  "car-rental": { path: "/rent-car" },
  "privacy-and-cookies": { path: "/privacy-and-cookies" },
  sustainability: { path: "/sustainability" },
  "terms-and-conditions": { path: "/terms-and-conditions" },
  "tours-search-results": { path: "/trips" },
  "one-day-tours": { path: "/egypt-tours/one-day-tours" },
  "nile-cruises": { path: "/egypt-tours/nile-cruises" },
  "plan-your-egypt-journey": { path: "/egypt-tours/plan-your-egypt-journy", locales: ENGLISH_ONLY },
  "tailor-your-egypt-trip": { path: "/egypt-tours/tailor-your-egypt-trip", locales: ENGLISH_ONLY },
  "egypt-sightseeing-tours": { path: "/egypt-tours/egypt-sightseeing-tours" },
  "egypt-travel-packages": { path: "/egypt-tours/egypt-travel-packages" },
  "egypt-vacation-packages": { path: "/egypt-tours/egypt-vacation-packages" },
  "pyramids-tours": { path: "/egypt-tours/pyramids-tours" },
};

function isIndexable(entity: SitemapApiItem) {
  if (entity.enabled === false || entity.active === false) return false;
  return !entity.seo?.robots?.toLowerCase().includes("noindex");
}

function normalizedLastmod(updatedAt: string | null | undefined) {
  if (!updatedAt) return undefined;
  const timestamp = Date.parse(updatedAt);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function entityMedia(entity: SitemapApiItem): SitemapImage[] {
  const candidates = [entity.featured_image, entity.banner, entity.image, ...(entity.gallery ?? [])];
  const seen = new Set<string>();
  return candidates.flatMap((candidate) => {
    if (!candidate || seen.has(candidate)) return [];
    try {
      const url = new URL(candidate);
      if (!/^https?:$/.test(url.protocol)) return [];
      seen.add(url.toString());
      return [{ loc: url.toString(), title: entity.title || entity.name }];
    } catch {
      return [];
    }
  });
}

function sitemapRecord(
  path: string,
  entity: SitemapApiItem,
  locales: Locale[] = ALL_LOCALES,
): SitemapRecord | null {
  if (!path || path.startsWith("/en/") || path === "/en") return null;
  return {
    loc: absolutePublicUrl(path),
    lastmod: normalizedLastmod(entity.updated_at),
    locales,
    images: entityMedia(entity),
  };
}

function linkedPublicPath(entity: SitemapApiItem) {
  if (!entity.link) return null;
  try {
    const link = new URL(entity.link);
    if (link.hostname !== new URL(FRONTEND_ORIGIN).hostname) return null;
    return link.pathname === "/" ? "/" : link.pathname.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function uniqueGroup(records: Array<SitemapRecord | null>, globallySeen: Set<string>) {
  const local = new Set<string>();
  return records.flatMap((entry) => {
    if (!entry || local.has(entry.loc) || globallySeen.has(entry.loc)) return [];
    local.add(entry.loc);
    globallySeen.add(entry.loc);
    return [entry];
  }).sort((a, b) => a.loc.localeCompare(b.loc));
}

function chunkTours(records: SitemapRecord[]) {
  const chunks: SitemapRecord[][] = [];
  let chunk: SitemapRecord[] = [];
  let byteCount = 512;
  let urlCount = 0;
  const targetRecordsPerChunk = Math.ceil(records.length / SITEMAP_PREFERRED_TOUR_CHUNKS);

  for (const entry of records) {
    const variants = sitemapRecordXmlEntries(entry);
    const bytes = variants.reduce((total, xml) => total + Buffer.byteLength(xml, "utf8") + 1, 0);
    if (
      chunk.length &&
      (chunk.length >= targetRecordsPerChunk ||
        urlCount + variants.length > SITEMAP_MAX_URLS ||
        byteCount + bytes > SITEMAP_MAX_XML_BYTES)
    ) {
      chunks.push(chunk);
      chunk = [];
      byteCount = 512;
      urlCount = 0;
    }
    chunk.push(entry);
    byteCount += bytes;
    urlCount += variants.length;
  }
  if (chunk.length) chunks.push(chunk);
  return chunks;
}

export function buildSitemapCatalog(dataset: SitemapDataset): SitemapCatalog {
  const globallySeen = new Set<string>();

  const pages = uniqueGroup(dataset.pages.flatMap((entity) => {
    if (!entity.key || !isIndexable(entity)) return [];
    const capability = PAGE_ROUTE_CAPABILITIES[entity.key];
    return capability ? [sitemapRecord(capability.path, entity, capability.locales ?? ALL_LOCALES)] : [];
  }), globallySeen);

  const posts = uniqueGroup(dataset.blogs.map((entity) =>
    entity.slug && isIndexable(entity) ? sitemapRecord(`/blog/${entity.slug}`, entity) : null,
  ), globallySeen);

  const eventIds = new Set(dataset.events.map((entity) => entity.id).filter((id): id is number => id != null));
  const events = uniqueGroup(dataset.events.map((entity) =>
    entity.slug && isIndexable(entity) ? sitemapRecord(`/event/${entity.slug}`, entity) : null,
  ), globallySeen);

  const blogCategoryById = new Map(
    dataset.blogCategories
      .filter((entity): entity is SitemapApiItem & { id: number } => entity.id != null)
      .map((entity) => [entity.id, entity]),
  );
  const travelGuide = uniqueGroup(dataset.blogCategories.map((entity) => {
    if (!entity.slug || !isIndexable(entity)) return null;
    if (entity.parent_id == null) return sitemapRecord(`/egypt-travel-guide/${entity.slug}`, entity);
    const parent = blogCategoryById.get(Number(entity.parent_id));
    if (!parent?.slug || parent.parent_id != null) return null;
    return sitemapRecord(`/egypt-travel-guide/${parent.slug}/${entity.slug}`, entity);
  }), globallySeen);

  const categoryRecords = dataset.categories.map((entity) => {
    const isEventCategory = Number(entity.parent_id) === 55 || eventIds.has(entity.id ?? -1) || entity.id === 55;
    if (!entity.slug || !isIndexable(entity) || isEventCategory) return null;
    return sitemapRecord(linkedPublicPath(entity) || `/egypt-tours/${entity.slug}`, entity);
  });
  const destinationRecords = dataset.destinations.map((entity) =>
    entity.slug && isIndexable(entity) ? sitemapRecord(`/egypt-tours/one-day-tours/${entity.slug}`, entity) : null,
  );
  const taxonomies = uniqueGroup([...categoryRecords, ...destinationRecords], globallySeen);

  const tours = uniqueGroup(dataset.tours.map((entity) =>
    entity.slug && isIndexable(entity) ? sitemapRecord(tourPath(entity.slug, "en"), entity) : null,
  ), globallySeen);

  return { pages, posts, events, travelGuide, taxonomies, tourChunks: chunkTours(tours) };
}

export function catalogGroups(catalog: SitemapCatalog) {
  return [
    { route: "/sitemap-pages.xml", records: pageSitemapRecords(catalog) },
    { route: "/sitemap-posts.xml", records: catalog.posts },
    ...catalog.tourChunks.map((records, index) => ({ route: `/sitemap-tours-${index + 1}.xml`, records })),
  ];
}

export function pageSitemapRecords(catalog: SitemapCatalog) {
  return [...catalog.pages, ...catalog.events, ...catalog.travelGuide, ...catalog.taxonomies]
    .sort((a, b) => a.loc.localeCompare(b.loc));
}

export function latestLastmod(records: SitemapRecord[]) {
  return records.reduce<string | undefined>((latest, entry) =>
    !entry.lastmod || (latest && latest >= entry.lastmod) ? latest : entry.lastmod,
  undefined);
}
