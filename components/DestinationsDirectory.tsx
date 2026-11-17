import { ArrowDown, ArrowUpRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { destinationDirectoryCopy, type DestinationRegion } from "@/components/destination-directory-copy";
import { DestinationsCatalog, type DestinationCatalogItem } from "@/components/DestinationsCatalog";
import { DestinationsTravelPlanning } from "@/components/DestinationsTravelPlanning";
import { JsonLd } from "@/components/JsonLd";
import Image from "@/components/ResponsiveImage";
import { SiteShell } from "@/components/SiteShell";
import { journeyExcerpt } from "@/components/multi-country/excerpt";
import { getPublicSiteSettings } from "@/lib/data";
import {
  countryDestinationHref,
  countryDestinationPreviewPhoto,
  DESTINATION_DIRECTORY_LINKS,
  jordanDestinationSlug,
} from "@/lib/destination-links";
import { loadDestinationsPage, loadDirectoryDestinations } from "@/lib/destinations-directory";
import { withLocale } from "@/lib/locales";
import { responsiveImageSource } from "@/lib/responsive-image";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale } from "@/types/api";
import styles from "@/styles/destinations-directory.module.scss";

// Region chips group the directory's navigation links without changing Laravel taxonomy.
const regions = {
  egypt: "africa", jordan: "middleEast", morocco: "africa", tunisia: "africa",
  turkey: "europe", greece: "europe", tanzania: "africa",
} satisfies Record<(typeof DESTINATION_DIRECTORY_LINKS)[number][1], DestinationRegion>;

// Captions describe the site's editorial photographs when a country has no CMS image.
const photoCaptions = {
  egypt: "Giza", jordan: "Petra", morocco: "Chefchaouen", tunisia: "El Jem",
  turkey: "İstanbul", greece: "Acropolis of Athens", tanzania: "Serengeti National Park",
} satisfies Record<(typeof DESTINATION_DIRECTORY_LINKS)[number][1], string>;

export async function DestinationsDirectory({ locale }: { locale: Locale }) {
  const [page, destinations, settings] = await Promise.all([
    loadDestinationsPage(locale), loadDirectoryDestinations(locale), getPublicSiteSettings(locale),
  ]);
  const reviewsUrl = settings.socialLinks.find(({ type, url }) => type === "tripadvisor" && url.startsWith("https://"))?.url;
  const copy = uiCopy(locale);
  const details = destinationDirectoryCopy[locale];
  const title = page.title || copy.destinations;
  const intro = journeyExcerpt(page.short_description ?? "") || copy.destinationsIntro;
  const content = sanitizeHtml(page.content);
  const mobileBanner = typeof page.phone_banner === "string" ? page.phone_banner : undefined;
  const banner = page.banner || mobileBanner || "/images/mainBanner.webp";
  const cards: DestinationCatalogItem[] = DESTINATION_DIRECTORY_LINKS.map(([label, slug]) => {
    const destination = (slug === "jordan" ? destinations.get(jordanDestinationSlug) : undefined) ?? destinations.get(slug);
    const name = destination?.title || destination?.name || copy[label];
    const dashboardPhoto = destination?.featured_image?.trim() || destination?.banner?.trim() || destination?.gallery?.find((image) => image.trim())?.trim();
    const photo = dashboardPhoto || countryDestinationPreviewPhoto(slug);
    const description = journeyExcerpt(destination?.short_description || destination?.description || "");
    const hasDescription = description && description.toLocaleLowerCase(locale) !== name.trim().toLocaleLowerCase(locale);
    const caption = !hasDescription && !dashboardPhoto ? photoCaptions[slug] : undefined;
    const featured = slug === "egypt";
    const region = regions[slug];
    return {
      slug, region, featured,
      card: (
        <Link href={withLocale(countryDestinationHref(slug), locale)} className={styles.card} prefetch={false}>
          <Image src={photo} alt="" fill sizes={featured ? "(max-width: 990px) 100vw, 50vw" : "(max-width: 990px) 50vw, 25vw"} />
          <div className={styles.cardContent}>
            <div>
              <span className={styles.cardRegion}>{slug === "turkey" ? details.transcontinental : details.regions[region]}</span>
              <h3>{name}</h3>
              {hasDescription && <p>{description}</p>}
              {caption && <p className={styles.photoCaption}>{caption}</p>}
              <span className={styles.cardAction} aria-hidden="true">{copy.exploreTours}</span>
            </div>
            <span className={styles.cardArrow} aria-hidden="true"><ArrowUpRight size={19} /></span>
          </div>
        </Link>
      ),
    };
  });
  const number = new Intl.NumberFormat(locale);
  const overview = details.overview
    .replace("{destinations}", number.format(cards.length))
    .replace("{regions}", number.format(new Set(cards.map(({ region }) => region)).size));

  return (
    <SiteShell locale={locale} settings={settings}>
      <JsonLd schema={page.seo?.structure_schema} />
      <main className={styles.directory}>
        <header className={styles.hero}>
          <picture className={styles.heroPhoto}>
            {mobileBanner && mobileBanner !== banner && (
              <source media="(max-width: 640px)" srcSet={`${responsiveImageSource(mobileBanner, 640)} 640w, ${responsiveImageSource(mobileBanner, 828)} 828w`} sizes="100vw" />
            )}
            <Image src={banner} alt="" fill sizes="100vw" fetchPriority="high" loading="eager" />
          </picture>
          <div className={`${styles.wrap} ${styles.heroContent}`}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href={withLocale("/", locale)}>{copy.home}</Link>
              <ChevronRight size={15} aria-hidden="true" />
              <span aria-current="page">{title}</span>
            </nav>
            <div className={styles.heroOverview}>{overview}</div>
            <h1>{title}</h1>
            <p>{intro}</p>
            <a href="#all-destinations" className={styles.heroAction}>
              {copy.allDestinations} <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
        </header>

        <DestinationsCatalog items={cards} locale={locale} labels={{
          title: copy.allDestinations, browse: details.browse, all: details.all, showing: details.showing, regions: details.regions,
        }} />
        {content && <div className={`${styles.wrap} ${styles.pageContent}`} dangerouslySetInnerHTML={{ __html: content }} />}
        <DestinationsTravelPlanning locale={locale} reviewsUrl={reviewsUrl} />
      </main>
    </SiteShell>
  );
}
