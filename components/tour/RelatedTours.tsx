import Image from "next/image";
import Link from "next/link";
import { PriceText } from "@/components/PriceText";
import { tourPath } from "@/lib/locales";
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

  return (
    <section className="tour-related" id="related-tours" aria-labelledby="tour-related-title">
      <div className="container-shell">
        <div className="tour-section-heading tour-section-heading-related">
          <h2 id="tour-related-title">Where will Egypt take you next?</h2>
          <p>Continue with more journeys selected from the same part of your travel story.</p>
        </div>
        <div className="tour-related-scroll">
          {displayTours.map((item) => {
            const slug = item.slug || String(item.id);
            const title = item.title || item.name || "";
            const image = relatedImage(item);
            const place = relatedPlace(item);
            const price = item.price ?? item.start_from ?? item.adult_price;
            return (
              <article className={`tour-related-card ${image ? "has-image" : ""}`} key={item.id || item.slug}>
                <Link href={tourPath(slug, locale)} className="tour-related-link">
                  {image ? (
                    <div className="tour-related-media">
                      <Image src={image} alt={title} fill sizes="(max-width: 768px) 85vw, (max-width: 1200px) 45vw, 30vw" />
                      {place ? <span className="tour-related-badge">{place}</span> : null}
                    </div>
                  ) : null}
                  <div className="tour-related-copy">
                    <div className="tour-related-header">
                      {place && !image ? <span className="tour-related-place">{place}</span> : null}
                      <h3>{title}</h3>
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
                      <span className="tour-related-arrow" aria-hidden="true">→</span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
