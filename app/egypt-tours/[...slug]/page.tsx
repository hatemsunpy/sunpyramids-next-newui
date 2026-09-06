import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import { EmptyState } from "@/components/EmptyState";
import { JsonLd } from "@/components/JsonLd";
import { Pagination } from "@/components/Pagination";
import { ResultCount } from "@/components/ResultCount";
import { SiteShell } from "@/components/SiteShell";
import { TourCard } from "@/components/TourCard";
import { DestinationCard } from "@/components/DestinationCard";
import { getCategoryReliable, getDestinationReliable, getDestinations, getPageReliable, getTours, tourListData, tourMeta } from "@/lib/data";
import { formatApiError, type ApiResult } from "@/lib/api";
import { decodePathSegment } from "@/lib/locales";
import { metadataFromPage } from "@/lib/seo";
import type { ApiList, ApiPage, Locale, Tour } from "@/types/api";

const pageSlugMap: Record<string, string> = {
  "one-day-tours": "one-day-tours",
  "multi-days-tours": "multi-days-tours",
  "nile-cruises": "nile-cruises",
  "shore-excursions": "shore-excursions",
};

const marketingPageKeyMap: Record<string, string> = {
  "egypt-sightseeing-tours": "egypt-sightseeing-tours",
  "egypt-travel-packages": "egypt-travel-packages",
  "egypt-vacation-packages": "egypt-vacation-packages",
  "pyramids-tours": "pyramids-tours",
};

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function routePath(slug: string[]) {
  return `/egypt-tours/${slug.map(encodeURIComponent).join("/")}`;
}
async function resolveEgyptToursPage(slug: string[], locale: Locale): Promise<ApiResult<ApiPage | null>> {
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
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug.map(decodePathSegment);
  const result = await resolveEgyptToursPage(slug, "en");
  if (!result.ok) {
    if (result.reason === "not_found") notFound();
    throw new Error(`Failed to fetch egypt-tours page "${slug.join("/")}": ${formatApiError(result)}`);
  }
  return metadataFromPage(result.value, routePath(slug), "en");
}

export default async function Page({ params, searchParams }: Props) {
  const slug = (await params).slug.map(decodePathSegment);
  const query = await searchParams;
  const rawPage = query.page;
  const currentPage = Math.max(
    1,
    parseInt(Array.isArray(rawPage) ? rawPage[0] : rawPage || "1", 10) || 1,
  );
  const isOneDayRoute = slug[0] === "one-day-tours";
  const isOneDayIndex = isOneDayRoute && slug.length === 1;
  const filterSlug = slug.at(-1) || slug[0];
  const limit = isOneDayRoute ? 24 : 12;
  const [pageResult, itemsResponse] = await Promise.all([
    resolveEgyptToursPage(slug, "en"),
    isOneDayIndex
      ? getDestinations("destinations?parent.slug=egypt&order_by=display_order,asc", "en")
      : isOneDayRoute
        ? getTours(
            `tours?exists=wishlisted&destinations.slug=${encodeURIComponent(filterSlug)}&categories.slug[]=night-tours&categories.slug[]=one-day-tours&categories.slug[]=half-day-tour&categories.slug[]=layover&order_by=display_order,asc`,
            "en",
            limit,
            currentPage,
          )
        : getTours(`tours?categories.slug=${encodeURIComponent(filterSlug)}&order_by=display_order,asc`, "en", limit, currentPage),
  ]);
  if (!pageResult.ok) {
    if (pageResult.reason === "not_found") notFound();
    throw new Error(`Failed to fetch egypt-tours page "${slug.join("/")}": ${formatApiError(pageResult)}`);
  }
  const page = pageResult.value;
  if (!page) notFound();
  const items = isOneDayIndex
    ? (itemsResponse as ApiPage[])
    : tourListData(itemsResponse as ApiList<Tour> | null);
  const meta = isOneDayIndex ? null : tourMeta(itemsResponse as ApiList<Tour> | null);

  // Validate the requested page against the API-provided last page and redirect
  // back to a valid page instead of rendering an empty out-of-range listing.
  if (!isOneDayIndex && meta && currentPage > meta.lastPage) {
    redirect(meta.lastPage > 1 ? `${routePath(slug)}?page=${meta.lastPage}` : routePath(slug));
  }

  const pageTitle = page?.title || page?.name || "Egypt Tours";
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Egypt Tours", href: slug.length > 1 ? "/egypt-tours/one-day-tours" : undefined },
    ...(slug.length > 1 ? [{ label: pageTitle }] : []),
  ];

  return (
    <SiteShell locale="en">
      <JsonLd schema={page.seo?.structure_schema} />
      <main>
        <DiscoveryHero
          title={pageTitle}
          breadcrumbs={breadcrumbs}
          eyebrow={isOneDayIndex ? "Egypt Destinations" : "Curated Egypt Packages"}
          description={page?.short_description || page?.description || page?.content}
          totalCount={isOneDayIndex ? items.length : meta?.total}
          bgImage={page?.banner || "/images/mainBanner.png"}
        />
        <section className="discovery-section">
          <div className="container-shell">
            {isOneDayIndex ? (
              items.length > 0 ? (
                <div className="destination-mosaic-grid">
                  {items.map((destination) => (
                    <DestinationCard
                      key={destination.id || destination.slug}
                      destination={destination}
                      basePath="/egypt-tours/one-day-tours"
                      locale="en"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No destinations currently listed"
                  description="We are updating our destinations catalog. Please check back shortly."
                  actionLabel="Explore all tours"
                  actionHref="/trips"
                />
              )
            ) : items.length > 0 ? (
              <>
                <div className="discovery-full-grid">
                  {items.map((tour) => (
                    <TourCard key={tour.id || tour.slug} tour={tour as Tour} locale="en" />
                  ))}
                </div>
                {meta && (
                  <div className="discovery-pagination-bar">
                    <ResultCount from={meta.from} to={meta.to} total={meta.total} />
                    {meta.lastPage > 1 && (
                      <Pagination
                        page={currentPage}
                        lastPage={meta.lastPage}
                        basePath={routePath(slug)}
                        query={new URLSearchParams()}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No tours available in this category"
                description="We are currently updating our itinerary departures for this selection. Please browse all our Egypt tours."
                actionLabel="Browse all Egypt tours"
                actionHref="/trips"
              />
            )}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
