import "@/styles/interior.scss";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CategoryChildrenIndex } from "@/components/CategoryChildrenIndex";
import { CategorySubcategoryFilter } from "@/components/CategorySubcategoryFilter";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import { MultiCountryIntro, MultiCountryOverview } from "@/components/multi-country/MultiCountryIntro";
import { MultiCountryTailorMade } from "@/components/multi-country/MultiCountryTailorMade";
import { TravelMomentsGallery } from "@/components/TravelMomentsGallery";
import { TravellerReviews } from "@/components/TravellerReviews";
import { MultiCountrySubcategoryIntro } from "@/components/multi-country/MultiCountrySubcategoryIntro";
import { MultiCountrySubcategoryToolbar } from "@/components/multi-country/MultiCountrySubcategoryToolbar";
import { McScrollReveal } from "@/components/multi-country/McScrollReveal";
import { MultiCountryTripHelp } from "@/components/multi-country/MultiCountryTripHelp";
import { isMultiCountryParent, isMultiCountrySubcategory } from "@/components/multi-country/routes";
import { EmptyState } from "@/components/EmptyState";
import { JsonLd } from "@/components/JsonLd";
import { Pagination } from "@/components/Pagination";
import { ResultCount } from "@/components/ResultCount";
import { SiteShell } from "@/components/SiteShell";
import { TourCard } from "@/components/TourCard";
import { DestinationCard } from "@/components/DestinationCard";
import { getDestinations, getPublicSiteSettings, getTours, tourListData, tourMeta } from "@/lib/data";
import { resolveEgyptToursPage } from "@/lib/egypt-tours";
import { formatApiError } from "@/lib/api";
import { decodePathSegment, withLocale } from "@/lib/locales";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";
import type { ApiList, ApiPage, Tour } from "@/types/api";

type Props = {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function routePath(slug: string[]) {
  return `/egypt-tours/${slug.map(encodeURIComponent).join("/")}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const slug = resolved.slug.map(decodePathSegment);
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const result = await resolveEgyptToursPage(slug, locale);
  if (!result.ok) {
    if (result.reason === "not_found") notFound();
    throw new Error(`Failed to fetch egypt-tours page "${slug.join("/")}": ${formatApiError(result)}`);
  }
  return metadataFromPage(result.value, `/${locale}${routePath(slug)}`, locale);
}

export default async function Page({ params, searchParams }: Props) {
  const resolved = await params;
  const slug = resolved.slug.map(decodePathSegment);
  const query = await searchParams;
  const rawPage = query.page;
  const currentPage = Math.max(
    1,
    parseInt(Array.isArray(rawPage) ? rawPage[0] : rawPage || "1", 10) || 1,
  );
  const rawSub = query.sub;
  const activeSub = typeof rawSub === "string" ? rawSub : Array.isArray(rawSub) ? rawSub[0] : undefined;
  const rawOrder = query.order;
  const currentOrder = typeof rawOrder === "string" ? rawOrder : Array.isArray(rawOrder) ? rawOrder[0] : "display_order,asc";

  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const isMultiCountry = isMultiCountryParent(slug);
  const isMcSubcategory = isMultiCountrySubcategory(slug);
  const isOneDayRoute = slug?.[0] === "one-day-tours";
  const isOneDayIndex = isOneDayRoute && slug.length === 1;
  const isCategoryChildrenIndex = slug.length === 1 && (slug[0] === "multi-days-tours" || slug[0] === "nile-cruises");
  const filterSlug = slug.at(-1) || slug[0];
  const limit = isOneDayRoute ? 24 : 12;

  if (isCategoryChildrenIndex) {
    return <CategoryChildrenIndex slug={slug} locale={locale} />;
  }

  const pageResult = await resolveEgyptToursPage(slug, locale);
  if (!pageResult.ok) {
    if (pageResult.reason === "not_found") notFound();
    throw new Error(`Failed to fetch egypt-tours page "${slug.join("/")}": ${formatApiError(pageResult)}`);
  }
  const page = pageResult.value;
  if (!page) notFound();

  const children = (page.children as ApiPage[] | undefined) || [];
  const hasChildren = children.length > 0;

  let itemsResponse: ApiList<Tour> | ApiPage[] | null = null;

  if (isOneDayIndex) {
    itemsResponse = await getDestinations("destinations?parent.slug=egypt&order_by=display_order,asc", locale);
  } else if (isOneDayRoute) {
    itemsResponse = await getTours(
      `tours?exists=wishlisted&destinations.slug=${encodeURIComponent(filterSlug)}&categories.slug[]=night-tours&categories.slug[]=one-day-tours&categories.slug[]=half-day-tour&categories.slug[]=layover&order_by=display_order,asc`,
      locale,
      limit,
      currentPage,
    );
  } else if (hasChildren) {
    let catFilter = "";
    if (activeSub && activeSub !== "all") {
      const matchedChild = children.find(
        (c) => String(c.id) === activeSub || c.slug === activeSub
      );
      if (matchedChild && matchedChild.id != null) {
        catFilter = `categories.id[]=${matchedChild.id}`;
      } else {
        catFilter = `categories.slug=${encodeURIComponent(activeSub)}`;
      }
    } else {
      catFilter = children
        .filter((c) => c.id != null)
        .map((c) => `categories.id[]=${c.id}`)
        .join("&");
    }

    let toursEndpoint = "tours";
    if (currentOrder === "price,asc") {
      toursEndpoint = `tours/asc/${currentPage}`;
    } else if (currentOrder === "price,desc") {
      toursEndpoint = `tours/desc/${currentPage}`;
    } else {
      toursEndpoint = `tours?order_by=${encodeURIComponent(currentOrder)}`;
    }

    const sep = toursEndpoint.includes("?") ? "&" : "?";
    itemsResponse = await getTours(
      `${toursEndpoint}${sep}exists=wishlisted&${catFilter}`,
      locale,
      limit,
      currentPage,
    );
  } else {
    let toursEndpoint = "tours";
    if (currentOrder === "price,asc") {
      toursEndpoint = `tours/asc/${currentPage}`;
    } else if (currentOrder === "price,desc") {
      toursEndpoint = `tours/desc/${currentPage}`;
    } else {
      toursEndpoint = `tours?order_by=${encodeURIComponent(currentOrder)}`;
    }
    const sep = toursEndpoint.includes("?") ? "&" : "?";
    itemsResponse = await getTours(
      `${toursEndpoint}${sep}categories.slug=${encodeURIComponent(filterSlug)}`,
      locale,
      limit,
      currentPage,
    );
  }

  const items = isOneDayIndex
    ? (itemsResponse as ApiPage[])
    : tourListData(itemsResponse as ApiList<Tour> | null);
  const meta = isOneDayIndex ? null : tourMeta(itemsResponse as ApiList<Tour> | null);

  // Validate the requested page against the API-provided last page and redirect
  // back to a valid page instead of rendering an empty out-of-range listing.
  if (!isOneDayIndex && meta && currentPage > meta.lastPage) {
    const targetParams = new URLSearchParams();
    if (activeSub && activeSub !== "all") targetParams.set("sub", activeSub);
    if (currentOrder && currentOrder !== "display_order,asc") targetParams.set("order", currentOrder);
    if (meta.lastPage > 1) targetParams.set("page", String(meta.lastPage));
    const qs = targetParams.toString();
    redirect(qs ? `/${locale}${routePath(slug)}?${qs}` : `/${locale}${routePath(slug)}`);
  }

  const paginationQuery = new URLSearchParams();
  if (activeSub && activeSub !== "all") paginationQuery.set("sub", activeSub);
  if (currentOrder && currentOrder !== "display_order,asc") paginationQuery.set("order", currentOrder);

  const pageTitle = page?.title || page?.name || "Egypt Tours";
  const breadcrumbs = [
    { label: "Home", href: withLocale("/", locale) },
    { label: "Egypt Tours", href: slug.length > 1 ? withLocale(`/egypt-tours/${slug[0]}`, locale) : undefined },
    ...(slug.length > 1 ? [{ label: pageTitle }] : []),
  ];

  const settings = isMultiCountry ? await getPublicSiteSettings(locale) : undefined;

  return (
    <SiteShell locale={locale} settings={settings}>
      <JsonLd schema={page.seo?.structure_schema} />
      <main className={isMultiCountry ? "multi-country-page" : isMcSubcategory ? "multi-country-subcategory-page" : undefined}>
        {isMultiCountry ? <MultiCountryIntro page={page} categoryCount={children.length} locale={locale} /> : isMcSubcategory ? (
          <MultiCountrySubcategoryIntro page={page} locale={locale} />
        ) : <DiscoveryHero
          title={pageTitle}
          breadcrumbs={breadcrumbs}
          eyebrow={isOneDayIndex ? "Egypt Destinations" : "Curated Egypt Packages"}
          description={page?.short_description || page?.description || page?.content}
          totalCount={isOneDayIndex ? items.length : meta?.total}
          bgImage={page?.banner || "/images/mainBanner.webp"}
          mobileBgImage={typeof page.phone_banner === "string" ? page.phone_banner : undefined}
        />}
        <section className="discovery-section" id={isMultiCountry ? "multi-country-tours" : undefined}>
          <div className="container-shell">
            {hasChildren && (
              <CategorySubcategoryFilter
                variant={isMultiCountry ? "journeys" : "pills"}
                childrenCategories={children}
                basePath={`/${locale}${routePath(slug)}`}
                locale={locale}
                activeSub={activeSub}
                currentOrder={currentOrder}
              />
            )}
            {isMcSubcategory && (
              <MultiCountrySubcategoryToolbar
                basePath={`/${locale}${routePath(slug)}`}
                locale={locale}
                currentOrder={currentOrder}
                from={meta?.from ?? 0}
                to={meta?.to ?? 0}
                total={meta?.total ?? 0}
              />
            )}
            {isOneDayIndex ? (
              items.length > 0 ? (
                <div className="destination-mosaic-grid">
                  {items.map((destination) => (
                    <DestinationCard
                      key={destination.id || destination.slug}
                      destination={destination}
                      basePath="/egypt-tours/one-day-tours"
                      locale={locale}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No destinations currently listed"
                  description="We are updating our destinations catalog. Please check back shortly."
                  actionLabel="Explore all tours"
                  actionHref={withLocale("/trips", locale)}
                />
              )
            ) : items.length > 0 ? (
              <>
                <div className="discovery-full-grid">
                  {items.map((tour) => (
                    <TourCard key={tour.id || tour.slug} tour={tour as Tour} locale={locale} />
                  ))}
                </div>
                {meta && (
                  <div className="discovery-pagination-bar">
                    <ResultCount from={meta.from} to={meta.to} total={meta.total} />
                    {meta.lastPage > 1 && (
                      <Pagination
                        page={currentPage}
                        lastPage={meta.lastPage}
                        basePath={`/${locale}${routePath(slug)}`}
                        query={paginationQuery}
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
                actionHref={withLocale("/trips", locale)}
              />
            )}
          </div>
        </section>
        {isMultiCountry && <MultiCountryOverview page={page} locale={locale} />}
        {isMultiCountry && <MultiCountryTailorMade locale={locale} />}
        {isMultiCountry && <>
          <TravelMomentsGallery socialLinks={settings?.socialLinks ?? []} locale={locale} className="mc-social-gallery mc-shell" />
          <TravellerReviews containerId="multi-country-reviews" locale={locale} className="mc-reviews mc-shell" />
          <MultiCountryTripHelp locale={locale} />
        </>}
        {isMcSubcategory && <MultiCountryOverview page={page} locale={locale} fullFirst />}
        {(isMultiCountry || isMcSubcategory) && (
          <McScrollReveal key={`${locale}:${slug.join("/")}:${currentOrder}:${currentPage}:${activeSub || ""}`} selector=".category-sub-pill.mc-journey-card, .discovery-full-grid > *, .mc-overview" />
        )}
      </main>
    </SiteShell>
  );
}
