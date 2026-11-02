import Link from "next/link";
import { ArrowUpRight, CalendarDays, Users } from "lucide-react";
import { CompareSelectButton } from "./MultiCountryCompareClient";
import { TourCard } from "@/components/TourCard";
import { tourPath } from "@/lib/locales";
import type { Locale, Tour } from "@/types/api";
import { subcategoryCopy } from "./subcategory-copy";

// Keep shared pricing, offer validity and wishlist behavior; restyle only here.
export function MultiCountryTourList({ tours, locale }: { tours: Tour[]; locale: Locale }) {
  const copy = subcategoryCopy(locale);
  return (
    <div className="mc-itinerary-list">
      {tours.map((tour) => (
        <div className="mc-itinerary" key={tour.id || tour.slug}>
          <TourCard tour={tour} locale={locale} className="mc-editorial-tour" imageSizes="(max-width: 700px) 100vw, 38vw" />
          {tour.slug && <div className="mc-itinerary-compare"><CompareSelectButton slug={tour.slug} title={tour.title || tour.name || tour.slug} /></div>}
          <div className="mc-itinerary-footer">
            <dl>
              {typeof tour.type === "string" && tour.type.trim() && <div><dt><Users size={16} aria-hidden="true" />{copy.style}</dt><dd>{tour.type}</dd></div>}
              {typeof tour.run === "string" && tour.run.trim() && <div><dt><CalendarDays size={16} aria-hidden="true" />{copy.departures}</dt><dd>{tour.run}</dd></div>}
            </dl>
            {tour.slug && <Link href={tourPath(tour.slug, locale)}>{copy.view}<ArrowUpRight size={18} aria-hidden="true" /></Link>}
          </div>
        </div>
      ))}
    </div>
  );
}
