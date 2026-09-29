import Link from "next/link";
import { withLocale } from "@/lib/locales";
import { tourBreadcrumbCategories } from "@/lib/tour-breadcrumb";
import type { Locale, Tour, TripTaxonomy } from "@/types/api";

export function TourBreadcrumb({
  title,
  locale,
  tour,
  taxonomy,
}: {
  title: string;
  locale: Locale;
  tour: Tour | null;
  taxonomy: TripTaxonomy;
}) {
  const categories = tourBreadcrumbCategories(tour, taxonomy);
  const lastCategory = categories.at(-1);
  const backHref = lastCategory
    ? withLocale(`/egypt-tours/${encodeURIComponent(lastCategory.slug)}`, locale)
    : withLocale("/trips", locale);

  return (
    <nav className="tour-breadcrumb" aria-label="Breadcrumb">
      <Link className="tour-breadcrumb-back" href={backHref} aria-label={lastCategory ? `Back to ${lastCategory.label}` : "Back to tours"}>←</Link>
      <span className="tour-breadcrumb-trail">
        <Link href={withLocale("/", locale)}>Home</Link><span aria-hidden="true">›</span>
        {categories.length ? categories.map((category) => (
          <span className="tour-breadcrumb-category" key={category.slug}>
            <Link href={withLocale(`/egypt-tours/${encodeURIComponent(category.slug)}`, locale)}>{category.label}</Link>
            <span aria-hidden="true">›</span>
          </span>
        )) : (
          <><Link href={withLocale("/trips", locale)}>Tours</Link><span aria-hidden="true">›</span></>
        )}
      </span>
      <span className="tour-breadcrumb-current" aria-current="page">{title}</span>
    </nav>
  );
}
