import type { CSSProperties } from "react";
import Image from "@/components/ResponsiveImage";
import Link from "next/link";
import { PriceText } from "@/components/PriceText";
import { TourWishlistButtonView } from "@/components/TourWishlistButtonView";
import { tourPath } from "@/lib/locales";
import { responsiveImageSource } from "@/lib/responsive-image";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale, Tour } from "@/types/api";

function relatedImage(tour: Tour) {
  return tour.featured_image || tour.image || tour.banner || tour.gallery?.[0] || tour.images?.[0];
}

function relatedPlace(tour: Tour) {
  return tour.destinations?.[0]?.title || tour.destinations?.[0]?.name || tour.city || tour.destination;
}

export function RelatedTours({ tours, locale }: { tours: Tour[]; locale: Locale }) {
  const displayTours = tours.filter((tour) => (tour.slug || tour.id) && (tour.title || tour.name));
  if (!displayTours.length) return null;
  const copy = uiCopy(locale);
  const ctaLabel = copy.viewTour || "View tour";

  return (
    <section className="tour-related" id="related-tours" aria-labelledby="tour-related-title">
      <div className="container-shell">
        <div className="tour-section-heading tour-section-heading-related">
          <h2 id="tour-related-title">Related Tours</h2>
          <p>Continue with more journeys selected from the same part of your travel story.</p>
        </div>
        <div className="tour-related-scroll">
          {displayTours.map((item) => {
            const slug = item.slug || String(item.id);
            const title = item.title || item.name || "";
            const image = relatedImage(item);
            const place = relatedPlace(item);
            const category = item.categories?.[0]?.title || item.categories?.[0]?.name || item.category?.name;
            const summary = (item.seo?.meta_description ?? "").trim();
            const price = item.price ?? item.start_from ?? item.adult_price;
            const href = tourPath(slug, locale);
            const photoStyle = image
              ? ({ "--tour-card-photo": `url(${JSON.stringify(responsiveImageSource(image, 640))})` } as CSSProperties)
              : undefined;
            return (
              <article
                className={`tour-related-card tour-related-card--frosted ${image ? "has-image" : ""}`.trim()}
                key={item.id || item.slug}
                style={photoStyle}
              >
                <TourWishlistButtonView
                  tour={{ id: item.id, title: item.title, wishlisted_exists: item.wishlisted_exists }}
                  locale={locale}
                  labels={{ addToWishlist: copy.addToWishlist, removeFromWishlist: copy.removeFromWishlist }}
                />
                {image ? (
                  <Link href={href} className="tour-related-media-link">
                    <div className="tour-related-media">
                      <Image src={image} alt={title} fill sizes="(max-width: 768px) 85vw, (max-width: 1200px) 45vw, 30vw" />
                    </div>
                  </Link>
                ) : null}
                <div className="tour-related-content">
                  <div className="tour-related-copy">
                    <div className="tour-related-header">
                      <h3>
                        <Link href={href} className="tour-related-title-link">{title}</Link>
                      </h3>
                    </div>
                    {summary ? <p className="tour-related-summary">{summary}</p> : null}
                    {place || category ? (
                      <div className="tour-card-meta">
                        {place ? <span>{place}</span> : null}
                        {category ? <span>{category}</span> : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="tour-related-footer">
                    <div className="tour-related-meta">
                      {price !== null && price !== undefined && price !== "" ? (
                        <div className="tour-related-price-box">
                          <span className="tour-related-price-label">From</span>
                          <strong className="tour-related-price-val"><PriceText amount={price} /></strong>
                        </div>
                      ) : null}
                      {item.duration ? <span className="tour-related-duration">{item.duration}</span> : null}
                    </div>
                    <Link className="tour-card-cta" href={href} aria-label={`${ctaLabel}: ${title}`}>
                      <span className="tour-card-cta-label">{ctaLabel}</span>
                      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 12L12 4M6 4h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
