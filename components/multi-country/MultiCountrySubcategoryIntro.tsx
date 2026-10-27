import Link from "next/link";
import { ArrowDown, ArrowUpRight, Route } from "lucide-react";
import ResponsiveImage from "@/components/ResponsiveImage";
import { withLocale } from "@/lib/locales";
import { responsiveImageSource } from "@/lib/responsive-image";
import type { ApiPage, Locale } from "@/types/api";
import { multiCountryCopy } from "./copy";
import { journeyExcerpt } from "./excerpt";
import { multiCountryParentPath } from "./routes";
import "@/styles/multi-country.scss";

// Compact server-rendered intro for the journey subcategory pages. Deliberately
// distinct from the Multi Country parent hero: split layout below the global
// header, rounded API image panel, no full-bleed background.
export async function MultiCountrySubcategoryIntro({ page, locale }: {
  page: ApiPage;
  locale: Locale;
}) {
  const labels = multiCountryCopy(locale);
  const title = page.title || page.name || "Multi Country";
  const excerptSource = page.short_description || page.description || page.content || "";
  const excerpt = excerptSource ? journeyExcerpt(excerptSource) : "";
  const banner = page.banner || "";
  const phoneBanner = typeof page.phone_banner === "string" && page.phone_banner ? page.phone_banner : "";
  const panelImage = banner || phoneBanner;

  return (
    <header className="mc-sub-intro">
      <div className="mc-sub-shell mc-sub-intro-inner">
        <div className="mc-sub-intro-text">
          <nav className="mc-sub-crumbs" aria-label={labels.crumbs}>
            <Link href={withLocale("/", locale)}>{labels.home}</Link>
            <span className="mc-sub-crumbs-sep" aria-hidden="true">/</span>
            <Link href={withLocale(multiCountryParentPath, locale)}>{labels.parent}</Link>
            <span className="mc-sub-crumbs-sep" aria-hidden="true">/</span>
            <span aria-current="page">{title}</span>
          </nav>
          <h1>{title}</h1>
          {excerpt && <p className="mc-sub-excerpt">{excerpt}</p>}
          <div className="mc-sub-actions">
            <a className="mc-primary" href="#mc-results">{labels.explore}<ArrowDown size={16} aria-hidden="true" /></a>
            <Link className="mc-text-link" href={withLocale("/make-your-trip", locale)}>{labels.plan}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="mc-sub-intro-media">
          {panelImage ? (
            <picture>
              {banner && phoneBanner && (
                <source media="(max-width: 768px)" srcSet={responsiveImageSource(phoneBanner, 1080)} />
              )}
              <ResponsiveImage
                src={panelImage}
                alt={title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 46vw"
              />
            </picture>
          ) : (
            <div className="mc-sub-media-fallback">
              <Route size={34} aria-hidden="true" />
              <span>{labels.photo}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
