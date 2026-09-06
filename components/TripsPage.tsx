import type { ApiPage, Locale, Tour, TripTaxonomy } from "@/types/api";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { ResultCount } from "@/components/ResultCount";
import { TourCard } from "@/components/TourCard";
import { TripsFilterSidebar } from "@/components/TripsFilterSidebar";
import { withLocale } from "@/lib/locales";
import { uiCopy } from "@/lib/ui-copy";

type ActiveFilters = {
  main?: string;
  category?: string;
  destination?: string;
  title?: string;
  page?: number;
};

export function TripsPage({
  page,
  tours,
  taxonomy,
  locale = "en",
  active = {},
  meta,
}: {
  page: ApiPage | null;
  tours: Tour[];
  taxonomy: TripTaxonomy;
  locale?: Locale;
  active?: ActiveFilters;
  meta?: { from: number; to: number; total: number; lastPage: number } | null;
}) {
  const copy = uiCopy(locale);
  const tripsPath = withLocale("/trips", locale);

  const breadcrumbs = [
    { label: copy.home || "Home", href: withLocale("/", locale) },
    { label: copy.egyptTours || "Egypt Tours" },
  ];

  // Prepare active URLSearchParams for pagination preserving other query params
  const paginationQuery = new URLSearchParams();
  if (active.title) paginationQuery.set("title", active.title);
  if (active.main) paginationQuery.set("main", active.main);
  if (active.destination) paginationQuery.set("destination", active.destination);
  if (active.category) paginationQuery.set("category", active.category);

  const totalCount = meta?.total ?? tours.length;
  const currentPage = active.page || 1;

  return (
    <main>
      <DiscoveryHero
        title={page?.title || copy.egyptTours}
        breadcrumbs={breadcrumbs}
        eyebrow="Sun Pyramids Tours Catalog"
        description={
          active.title
            ? `${copy.search || "Search"}: "${active.title}"`
            : page?.short_description ||
              page?.description ||
              "Discover authentic, handcrafted Egypt journeys guided by certified Egyptologists."
        }
        totalCount={totalCount}
        bgImage={page?.banner || "/images/mainBanner.png"}
      />

      <section className="discovery-section">
        <div className="discovery-layout">
          <TripsFilterSidebar
            taxonomy={taxonomy}
            active={active}
            locale={locale}
            totalResults={totalCount}
          />

          <div className="discovery-results">
            <h2 className="discovery-results-title">
              {active.title ? `${copy.search || "Search"}: ${active.title}` : copy.egyptTours}
            </h2>
            {tours.length > 0 ? (
              <>
                <div className="discovery-grid">
                  {tours.map((tour) => (
                    <TourCard
                      key={tour.id || tour.slug}
                      tour={tour}
                      locale={locale}
                    />
                  ))}
                </div>

                {meta && (
                  <div className="discovery-pagination-bar">
                    <ResultCount
                      from={meta.from}
                      to={meta.to}
                      total={meta.total}
                    />
                    {meta.lastPage > 1 && (
                      <Pagination
                        page={currentPage}
                        lastPage={meta.lastPage}
                        basePath={tripsPath}
                        query={paginationQuery}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No tours matched your filters"
                description="We couldn't find any tours matching your active criteria. Try clearing filters or searching for another keyword."
                actionLabel={copy.clearAll || "Clear all filters"}
                actionHref={tripsPath}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
