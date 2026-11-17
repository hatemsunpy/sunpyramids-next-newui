import { Anchor, ArrowDown, ArrowUpRight, ChevronRight, Route, Ship, Sun } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EgyptEssentials } from "@/components/EgyptEssentials";
import { EgyptMustSee, EgyptWhyTravel } from "@/components/EgyptHighlights";
import { EgyptTravelResources } from "@/components/EgyptTravelResources";
import { JsonLd } from "@/components/JsonLd";
import Image from "@/components/ResponsiveImage";
import { SiteShell } from "@/components/SiteShell";
import { journeyExcerpt } from "@/components/multi-country/excerpt";
import { getTripTaxonomy } from "@/lib/data";
import { destinationsPath } from "@/lib/destination-links";
import { loadEgyptDestination } from "@/lib/egypt-destination";
import { withLocale } from "@/lib/locales";
import { responsiveImageSource } from "@/lib/responsive-image";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale } from "@/types/api";
import directory from "@/styles/destinations-directory.module.scss";
import styles from "@/styles/egypt-destination.module.scss";

const oneDayToursPath = "/egypt-tours/one-day-tours";

const collections = [
  ["oneDay", oneDayToursPath, Sun],
  ["multiDays", "/egypt-tours/multi-days-tours", Route],
  ["nileCruises", "/egypt-tours/nile-cruises", Ship],
  ["shoreExcursions", "/egypt-tours/shore-excursions", Anchor],
] as const;

export async function EgyptDestinationPage({ locale }: { locale: Locale }) {
  const [destination, taxonomy] = await Promise.all([loadEgyptDestination(locale), getTripTaxonomy(locale)]);
  const copy = uiCopy(locale);
  const title = destination.title?.trim() || destination.name?.trim() || copy.destEgypt;
  const description = journeyExcerpt(destination.short_description || destination.description || "");
  const intro = description && description.toLocaleLowerCase(locale) !== title.toLocaleLowerCase(locale)
    ? description
    : copy.bookTripDescription;
  const mobileBanner = typeof destination.phone_banner === "string" ? destination.phone_banner.trim() : undefined;
  const banner = destination.banner?.trim() || destination.featured_image?.trim() || mobileBanner || "/images/mainBanner.webp";
  const places = taxonomy.destinations.flatMap((place) => {
    const slug = place.slug?.trim();
    const name = place.title?.trim() || place.name?.trim();
    if (!slug || !name || place.enabled === false) return [];
    const photo = place.featured_image || place.banner || place.image || place.gallery?.[0];
    return [{ slug, name, photo }];
  });

  return (
    <SiteShell locale={locale} taxonomy={taxonomy}>
      <JsonLd schema={destination.seo?.structure_schema} />
      <main className={directory.directory}>
        <header className={directory.hero}>
          <picture className={directory.heroPhoto}>
            {mobileBanner && mobileBanner !== banner && (
              <source media="(max-width: 640px)" srcSet={`${responsiveImageSource(mobileBanner, 640)} 640w, ${responsiveImageSource(mobileBanner, 828)} 828w`} sizes="100vw" />
            )}
            <Image src={banner} alt="" fill sizes="100vw" fetchPriority="high" loading="eager" />
          </picture>
          <div className={`${directory.wrap} ${directory.heroContent}`}>
            <nav className={directory.breadcrumb} aria-label={copy.destinations}>
              <Link href={withLocale("/", locale)}>{copy.home}</Link>
              <ChevronRight size={15} aria-hidden="true" />
              <Link href={withLocale(destinationsPath, locale)}>{copy.destinations}</Link>
              <ChevronRight size={15} aria-hidden="true" />
              <span aria-current="page">{title}</span>
            </nav>
            <h1>{title}</h1>
            <p>{intro}</p>
            <div className={styles.heroActions}>
              <a href="#egypt-tour-collections" className={directory.heroAction}>
                {copy.exploreTours}<ArrowDown size={17} aria-hidden="true" />
              </a>
              <Link href={withLocale("/make-your-trip", locale)} className={styles.secondaryAction}>
                {copy.makeTrip}<ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </header>

        <section className={`${directory.wrap} ${styles.section}`} id="egypt-tour-collections" aria-labelledby="egypt-tour-collections-heading" tabIndex={-1}>
          <div className={styles.sectionHeading}>
            <h2 className={directory.sectionTitle} id="egypt-tour-collections-heading">{copy.egyptTours}</h2>
            <Link href={withLocale("/trips?destination=egypt", locale)} className={styles.textLink}>
              {copy.exploreTours}<ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <ul className={styles.collectionGrid} role="list">
            {collections.map(([label, href, Icon]) => (
              <li key={href}>
                <Link href={withLocale(href, locale)} className={styles.collectionLink}>
                  <Icon size={23} aria-hidden="true" />
                  <span>{copy[label]}</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {places.length > 0 && (
          <section className={`${directory.wrap} ${styles.section} ${styles.places}`} aria-labelledby="egypt-places-heading">
            <h2 className={directory.sectionTitle} id="egypt-places-heading">{copy.destinations}</h2>
            <ul className={`${directory.grid} ${styles.placeGrid}`} role="list">
              {places.map(({ slug, name, photo }) => (
                <li key={slug}>
                  <Link href={withLocale(`${oneDayToursPath}/${encodeURIComponent(slug)}`, locale)} className={directory.card} prefetch={false}>
                    {photo && <Image src={photo} alt="" fill sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 33vw" />}
                    <div className={directory.cardContent}>
                      <div>
                        <h3>{name}</h3>
                        <span className={directory.cardAction} aria-hidden="true">{copy.exploreTours}</span>
                      </div>
                      <span className={directory.cardArrow} aria-hidden="true"><ArrowUpRight size={19} /></span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <EgyptEssentials locale={locale} />
        <EgyptMustSee locale={locale} destinations={taxonomy.destinations} />
        <EgyptWhyTravel locale={locale} />
        <Suspense fallback={null}>
          <EgyptTravelResources locale={locale} />
        </Suspense>
      </main>
    </SiteShell>
  );
}
