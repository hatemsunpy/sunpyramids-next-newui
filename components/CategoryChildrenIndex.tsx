import { notFound } from "next/navigation";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import { EmptyState } from "@/components/EmptyState";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { TourCard } from "@/components/TourCard";
import { DestinationCard } from "@/components/DestinationCard";
import {
  getCategories,
  getCategoryReliable,
  getTours,
  tourListData,
  tourMeta,
} from "@/lib/data";
import { resolveEgyptToursPage } from "@/lib/egypt-tours";
import { formatApiError } from "@/lib/api";
import { withLocale } from "@/lib/locales";
import type { ApiList, ApiPage, Locale, Tour } from "@/types/api";

type Props = {
  slug: string[];
  locale?: Locale;
};

export async function CategoryChildrenIndex({ slug, locale = "en" }: Props) {
  const rootSlug = slug[0];
  const [pageResult, categoryResult] = await Promise.all([
    resolveEgyptToursPage(slug, locale),
    getCategoryReliable(rootSlug, locale),
  ]);

  if (!pageResult.ok) {
    if (pageResult.reason === "not_found") notFound();
    throw new Error(
      `Failed to fetch egypt-tours page "${slug.join("/")}": ${formatApiError(pageResult)}`,
    );
  }
  const page = pageResult.value;
  if (!page) notFound();

  // 1. Fetch enabled child categories from live API under this parent category
  const categoryId =
    categoryResult.ok && categoryResult.value?.id
      ? categoryResult.value.id
      : page?.id;

  const subcategories = categoryId
    ? await getCategories(
        `categories?parent_id=${categoryId}&enabled=1&includes=children`,
        locale,
        100,
      )
    : [];

  // 2. Fallback to embedded children if parent_id query returned empty
  let rawChildren = subcategories;
  if (rawChildren.length === 0) {
    const embedded =
      (categoryResult.ok
        ? (categoryResult.value as ApiPage & { children?: ApiPage[] })
        : null
      )?.children ??
      (page as ApiPage & { children?: ApiPage[] })?.children ??
      [];
    rawChildren = embedded;
  }

  const orderOf = (item: ApiPage) =>
    typeof item.display_order === "number" ? item.display_order : 999;
  const sortedChildren = [...rawChildren].sort(
    (a, b) => orderOf(a) - orderOf(b) || (a.id ?? 0) - (b.id ?? 0),
  );

  // Filter out any category that does not have active tours attached to it (e.g. Dahabiyat)
  const tourCountChecks = await Promise.all(
    sortedChildren.map(async (child) => {
      const subChildren = (child.children as ApiPage[] | undefined) || [];
      let queryParam = "";
      if (subChildren.length > 0) {
        queryParam = subChildren
          .filter((sub) => sub.id != null)
          .map((sub) => `categories.id[]=${sub.id}`)
          .join("&");
      } else if (child.id != null) {
        queryParam = `categories.id[]=${child.id}`;
      } else if (child.slug) {
        queryParam = `categories.slug=${encodeURIComponent(child.slug)}`;
      }

      if (!queryParam) return { child, count: 0 };

      const toursResponse = await getTours(`tours?${queryParam}`, locale, 1, 1);
      const meta = tourMeta(toursResponse as ApiList<Tour> | null);
      return { child, count: meta.total };
    })
  );

  const children = tourCountChecks
    .filter((item) => item.count > 0)
    .map((item) => item.child);

  const pageTitle =
    page?.title ||
    page?.name ||
    (rootSlug === "nile-cruises" ? "Nile Cruises" : "Multi Days Tours");

  const breadcrumbs = [
    { label: "Home", href: withLocale("/", locale) },
    { label: "Egypt Tours" },
    { label: pageTitle },
  ];

  // Fallback to tours listing if the category has no children
  if (children.length === 0) {
    const toursResponse = await getTours(
      `tours?categories.slug=${encodeURIComponent(rootSlug)}&order_by=display_order,asc`,
      locale,
      12,
      1,
    );
    const tours = tourListData(toursResponse as ApiList<Tour> | null);
    const meta = tourMeta(toursResponse as ApiList<Tour> | null);

    return (
      <SiteShell locale={locale}>
        <JsonLd schema={page.seo?.structure_schema} />
        <main>
          <DiscoveryHero
            title={pageTitle}
            breadcrumbs={breadcrumbs}
            eyebrow="Curated Egypt Packages"
            description={page?.short_description || page?.description || page?.content}
            totalCount={meta?.total}
            bgImage={page?.banner || "/images/mainBanner.png"}
            locale={locale}
          />
          <section className="discovery-section">
            <div className="container-shell">
              {tours.length > 0 ? (
                <div className="discovery-full-grid">
                  {tours.map((tour) => (
                    <TourCard key={tour.id || tour.slug} tour={tour as Tour} locale={locale} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No tours available in this category"
                  description="We are currently updating our itinerary departures for this selection. Please browse all our Egypt tours."
                  actionLabel="Browse all Egypt tours"
                  actionHref={withLocale("/trips", locale)}
                />
              )}
            </div>
          </section>
        </main>
      </SiteShell>
    );
  }

  const eyebrow =
    rootSlug === "nile-cruises"
      ? "Nile Cruise Collection"
      : "Curated Egypt Packages";

  return (
    <SiteShell locale={locale}>
      <JsonLd schema={page.seo?.structure_schema} />
      <main>
        <DiscoveryHero
          title={pageTitle}
          breadcrumbs={breadcrumbs}
          eyebrow={eyebrow}
          description={page?.short_description || page?.description || page?.content}
          totalCount={children.length}
          bgImage={page?.banner || "/images/mainBanner.png"}
          locale={locale}
        />
        <section className="discovery-section">
          <div className="container-shell">
            <div className="destination-mosaic-grid">
              {children.map((child) => (
                <DestinationCard
                  key={child.id || child.slug}
                  destination={child}
                  basePath={`/egypt-tours/${rootSlug}`}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
