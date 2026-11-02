import Link from "next/link";
import { ArrowDown, ArrowUpRight, Clock3, Compass, Route } from "lucide-react";
import ResponsiveImage from "@/components/ResponsiveImage";
import { withLocale } from "@/lib/locales";
import { responsiveImageSource } from "@/lib/responsive-image";
import type { ApiPage, Locale, Tour } from "@/types/api";
import { multiCountryCopy } from "./copy";
import { subcategoryCopy } from "./subcategory-copy";
import { collectionDuration, collectionPlaces } from "./collection-facts";
import { journeyExcerpt } from "./excerpt";
import { multiCountryParentPath } from "./routes";
import "@/styles/multi-country.scss";
import "@/styles/multi-country-subcategory.scss";

export function MultiCountrySubcategoryIntro({ page, locale, tours, total }: {
  page: ApiPage;
  locale: Locale;
  tours: Tour[];
  total: number;
}) {
  const labels = multiCountryCopy(locale);
  const copy = subcategoryCopy(locale);
  const title = page.title || page.name || labels.parent;
  const excerptSource = page.short_description || page.description || page.content || "";
  const banner = page.banner || page.featured_image || "";
  const phoneBanner = typeof page.phone_banner === "string" ? page.phone_banner : "";
  const duration = collectionDuration(tours);
  const hasPlaces = collectionPlaces(tours).length > 0;

  return (
    <header className="mc-dossier mc-shell">
      <nav className="mc-sub-crumbs" aria-label={labels.crumbs}>
        <Link href={withLocale("/", locale)}>{labels.home}</Link>
        <span aria-hidden="true">/</span>
        <Link href={withLocale(multiCountryParentPath, locale)}>{labels.parent}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>
      {(banner || phoneBanner) && (
        <div className="mc-dossier-photo">
          <picture>
            {banner && phoneBanner && <source media="(max-width: 768px)" srcSet={responsiveImageSource(phoneBanner, 1080)} />}
            <ResponsiveImage src={banner || phoneBanner} alt={title} fill priority sizes="(max-width: 1328px) 100vw, 1280px" />
          </picture>
        </div>
      )}
      <div className={`mc-dossier-sheet${banner || phoneBanner ? " has-photo" : ""}`}>
        <div className="mc-dossier-copy">
          <p className="mc-dossier-kicker"><Compass size={17} aria-hidden="true" />{copy.collection}</p>
          <h1>{title}</h1>
          {excerptSource && <p className="mc-dossier-excerpt">{journeyExcerpt(excerptSource)}</p>}
          <div className="mc-sub-actions">
            <a className="mc-primary" href="#mc-results">{labels.explore}<ArrowDown size={17} aria-hidden="true" /></a>
            <Link className="mc-text-link" href={withLocale("/make-your-trip", locale)}>{labels.plan}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
        {(total > 0 || duration) && <dl className="mc-dossier-facts">
          {total > 0 && <div><dt><Route size={18} aria-hidden="true" />{copy.itineraries}</dt><dd>{total.toLocaleString(locale)}</dd></div>}
          {duration && <div><dt><Clock3 size={18} aria-hidden="true" />{copy.duration}</dt><dd>{duration}<span>{copy.days}</span></dd></div>}
        </dl>}
      </div>
      <nav className="mc-chapter-nav" aria-label={copy.pageNav}>
        <a href="#mc-results">{copy.itineraries}<ArrowDown size={14} aria-hidden="true" /></a>
        {hasPlaces && <a href="#mc-places">{copy.places}</a>}
        {excerptSource && <a href="#mc-overview-title">{copy.about}</a>}
        <a href="#mc-traveller-reviews">{copy.reviews}</a>
        <a href="#mc-trip-help">{copy.plan}<ArrowUpRight size={14} aria-hidden="true" /></a>
      </nav>
    </header>
  );
}
