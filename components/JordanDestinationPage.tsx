import "@/styles/interior.scss";
import "@/styles/jordan-destination.scss";
import { ArrowDown, ArrowUpRight, BookOpen, CalendarDays, Compass, MessageCircle, Route } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { JordanQuoteForm } from "@/components/JordanQuoteForm";
import { JordanTourSort } from "@/components/JordanTourSort";
import { JordanTravelFacts, JordanTravelGuide } from "@/components/JordanTravelGuide";
import { Pagination } from "@/components/Pagination";
import Image from "@/components/ResponsiveImage";
import { SiteShell } from "@/components/SiteShell";
import { TourCard } from "@/components/TourCard";
import { destinationDirectoryCopy } from "@/components/destination-directory-copy";
import { jordanDestinationCopy } from "@/components/jordan-destination-copy";
import { jordanTravelCopy } from "@/components/jordan-travel-copy";
import { journeyExcerpt } from "@/components/multi-country/excerpt";
import { getPublicSiteSettings } from "@/lib/data";
import { countryDestinationPreviewPhoto, destinationsPath, jordanDestinationPath } from "@/lib/destination-links";
import { jordanCatalogHref, jordanCatalogParams, jordanTourOrders, jordanTripTypes, type JordanSearchParams } from "@/lib/jordan-catalog-query";
import { loadJordanDestination, loadJordanPlaces, loadJordanTours } from "@/lib/jordan-destination";
import { withLocale } from "@/lib/locales";
import { responsiveImageSource } from "@/lib/responsive-image";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale } from "@/types/api";

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function JordanDestinationPage({ locale, searchParams }: {
  locale: Locale;
  searchParams: JordanSearchParams;
}) {
  const [destination, params] = await Promise.all([loadJordanDestination(locale), searchParams]);
  const requestedPage = Number(first(params.page));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const trip = jordanTripTypes.find((value) => value === first(params.trip)) ?? "all";
  const order = jordanTourOrders.find((value) => value === first(params.order)) ?? "recommended";
  const basePath = withLocale(jordanDestinationPath, locale);
  const cmsImage = destination.banner?.trim() || destination.featured_image?.trim();
  const catalogRequest = loadJordanTours(destination, locale, page, trip, order);
  const [catalog, overviewCatalog, places, settings] = await Promise.all([
    catalogRequest,
    !cmsImage && (page > 1 || trip !== "all" || order !== "recommended")
      ? loadJordanTours(destination, locale, 1)
      : catalogRequest,
    loadJordanPlaces(locale),
    getPublicSiteSettings(locale),
  ]);
  if (catalog && page > catalog.meta.lastPage) redirect(jordanCatalogHref(basePath, trip, order));

  const labels = jordanDestinationCopy[locale];
  const travel = jordanTravelCopy[locale];
  const shared = destinationDirectoryCopy[locale];
  const copy = uiCopy(locale);
  const title = destination.title || destination.name || copy.destJordan;
  const description = journeyExcerpt(destination.description ?? "");
  const story = description && description.toLowerCase() !== title.toLowerCase() ? description : labels.story;
  const discover = labels.discover.replace("{name}", title);
  const guidePhoto = countryDestinationPreviewPhoto("jordan");
  const heroImage = cmsImage || overviewCatalog?.dayTripImage || guidePhoto;
  const mobileImage = typeof destination.phone_banner === "string" ? destination.phone_banner.trim() : undefined;
  const reviewsUrl = settings.socialLinks.find(({ type, url }) => type === "tripadvisor" && url.startsWith("https://"))?.url;
  const tours = catalog?.tours ?? [];

  return (
    <SiteShell locale={locale} settings={settings}>
      <JsonLd schema={destination.seo?.structure_schema} />
      <main className="jordan-destination">
        <header className="jordan-hero">
          <picture className="jordan-hero-photo">
            {mobileImage && mobileImage !== heroImage && (
              <source
                media="(max-width: 760px)"
                srcSet={`${responsiveImageSource(mobileImage, 640)} 640w, ${responsiveImageSource(mobileImage, 828)} 828w`}
                sizes="100vw"
              />
            )}
            <Image src={heroImage} alt="" fill sizes="100vw" fetchPriority="high" loading="eager" />
          </picture>
          <div className="jordan-hero-copy jordan-shell">
            <nav aria-label={labels.breadcrumb} className="jordan-breadcrumb">
              <Link href={withLocale("/", locale)}>{copy.home}</Link>
              <span aria-hidden="true">/</span>
              <Link href={withLocale(destinationsPath, locale)}>{copy.destinations}</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{title}</span>
            </nav>
            <span className="jordan-hero-region">{shared.regions.middleEast}</span>
            <h1>{title}</h1>
            <p>{labels.intro}</p>
            <div className="jordan-hero-actions">
              <Link href={jordanCatalogHref(basePath, "all", "recommended")} className="jordan-primary">
                {copy.exploreTours}<ArrowDown aria-hidden="true" size={18} />
              </Link>
              <a href="#jordan-plan" className="jordan-secondary">
                {travel.quote}<ArrowDown aria-hidden="true" size={17} />
              </a>
            </div>
          </div>
        </header>

        <JordanTravelFacts locale={locale} />
        <nav className="jordan-section-nav" aria-label={copy.exploreTours}>
          <div className="jordan-shell">
            <a href="#discover-jordan"><Compass aria-hidden="true" size={20} />{discover}</a>
            <Link href={jordanCatalogHref(basePath, "day", order)} aria-current={trip === "day" ? "true" : undefined}><CalendarDays aria-hidden="true" size={20} />{labels.day}</Link>
            <Link href={jordanCatalogHref(basePath, "multi-day", order)} aria-current={trip === "multi-day" ? "true" : undefined}><Route aria-hidden="true" size={20} />{labels["multi-day"]}</Link>
            <a href="#jordan-essentials"><BookOpen aria-hidden="true" size={20} />{travel.essentials}</a>
          </div>
        </nav>

        <div className="jordan-shell jordan-guide">
          <section id="discover-jordan" className="jordan-overview" aria-labelledby="discover-jordan-heading" tabIndex={-1}>
            <div className="jordan-overview-copy">
              <h2 id="discover-jordan-heading">{discover}</h2>
              <p>{story}</p>
              <a href="#jordan-tours" className="jordan-text-link">{copy.exploreTours}<ArrowDown aria-hidden="true" size={17} /></a>
            </div>
            <div className="jordan-overview-photo">
              <Image src={guidePhoto} alt="" fill sizes="(max-width: 600px) 90vw, 36vw" />
            </div>
          </section>

          <aside id="jordan-plan" className="jordan-plan" aria-labelledby="jordan-plan-heading" tabIndex={-1}>
            <MessageCircle size={24} aria-hidden="true" />
            <h2 id="jordan-plan-heading">{travel.quote}</h2>
            <p>{labels.plan}</p>
            <JordanQuoteForm labels={{
              adults: copy.adults, children: copy.children, arrival: travel.dates[0], departure: travel.dates[1],
              message: travel.inquiry, action: shared.whatsapp, draft: travel.draft,
            }} />
            <Link href={withLocale("/contact-us", locale)} className="jordan-text-link">{copy.contact}<ArrowUpRight aria-hidden="true" size={16} /></Link>
          </aside>

          <section id="jordan-tours" className="jordan-tours" aria-labelledby="jordan-tours-heading" tabIndex={-1}>
            <div className="jordan-tours-heading">
              <h2 id="jordan-tours-heading">{labels.heading}</h2>
              <JordanTourSort basePath={basePath} trip={trip} order={order} label={labels.sort} options={labels} />
            </div>
            <nav className="jordan-tour-filters" aria-label={labels.heading}>
              {jordanTripTypes.map((value) => (
                <Link key={value} href={jordanCatalogHref(basePath, value, order)} aria-current={value === trip ? "true" : undefined}>
                  {labels[value]}
                </Link>
              ))}
            </nav>
            {catalog && <p className="jordan-results-count">{new Intl.NumberFormat(locale).format(catalog.meta.total)} {copy.tours.toLocaleLowerCase(locale)}</p>}
            {tours.length > 0 ? (
              <div className="jordan-tour-grid">
                {tours.map((tour) => (
                  <TourCard
                    key={tour.id || tour.slug}
                    tour={tour}
                    locale={locale}
                    variant="legacy"
                    showLegacyAction
                    summary={journeyExcerpt(tour.short_description || tour.description || "")}
                    imageSizes="(max-width: 600px) 94vw, (max-width: 980px) 46vw, (max-width: 1460px) 33vw, 460px"
                  />
                ))}
              </div>
            ) : (
              <div className="jordan-tours-status">
                <p>{catalog ? labels.empty : labels.unavailable}</p>
                {trip !== "all" && <Link href={jordanCatalogHref(basePath, "all", order)}>{labels.all}</Link>}
              </div>
            )}
            {catalog && catalog.meta.lastPage > 1 && (
              <div className="discovery-pagination-bar">
                <Pagination page={page} lastPage={catalog.meta.lastPage} basePath={basePath} query={jordanCatalogParams(trip, order)} anchor="jordan-tours" />
              </div>
            )}
          </section>

        </div>
        <JordanTravelGuide locale={locale} places={places} reviewsUrl={reviewsUrl} />
      </main>
    </SiteShell>
  );
}
