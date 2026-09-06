import Image from "next/image";
import Link from "next/link";
import type { Locale, Tour } from "@/types/api";
import { tourPath } from "@/lib/locales";
import { PriceText } from "@/components/PriceText";

function imageOf(item: Tour) {
  return item.featured_image || item.image || item.banner || item.gallery?.[0] || item.images?.[0] || "/images/mainBanner.png";
}

function placeOf(tour: Tour) {
  const destination = tour.destinations?.[0]?.title || tour.destinations?.[0]?.name;
  return destination || tour.city || tour.destination || "Egypt";
}

function categoryOf(tour: Tour) {
  return tour.categories?.[0]?.title || tour.categories?.[0]?.name || tour.category?.name || "Egypt Tours";
}

function priceOf(tour: Tour) {
  return tour.price ?? tour.start_from ?? tour.adult_price;
}

export function TourCard({ tour, locale = "en", className = "" }: { tour: Tour; locale?: Locale; className?: string }) {
  const slug = tour.slug || String(tour.id || "");
  const title = tour.title || tour.name || "Egypt Tour";
  const description = tour.short_description || tour.description || title;
  const price = priceOf(tour);

  return (
    <article className={`tour-card ${className}`.trim()}>
      <Link href={tourPath(slug, locale)}>
        <div className="tour-card-media">
          <Image src={imageOf(tour)} alt={title} fill sizes="(max-width: 768px) 100vw, 25vw" />
        </div>
        <div className="tour-card-body">
          <h3 className="line-clamp-2">{title}</h3>
          <p className="line-clamp-2 tour-card-summary">{description}</p>
          <div className="tour-card-meta">
            <span>{placeOf(tour)}</span>
            <span>{categoryOf(tour)}</span>
          </div>
          <div className="tour-card-bottom">
            <div>
              <span>Start From</span>
              <strong>{price !== null && price !== undefined ? <PriceText amount={price} /> : "Request Price"}</strong>
            </div>
            <p>{tour.duration || "Flexible"}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}
