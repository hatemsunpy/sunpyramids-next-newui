import { PriceText } from "@/components/PriceText";
import { TourBookingTrigger } from "@/components/tour/TourBookingTrigger";
import type { Tour } from "@/types/api";

export function TourHero({ tour, title }: { tour: Tour | null; title: string }) {
  const destination = tour?.destinations?.find((item) => item.global)?.title
    || tour?.destinations?.find((item) => item.featured)?.title
    || tour?.destinations?.[0]?.title
    || tour?.destination;
  const category = tour?.categories?.[0]?.title || tour?.category?.name;
  const offer = Number(tour?.offer || 0);
  const price = tour?.adult_price ?? tour?.start_from ?? tour?.price;

  return (
    <header className="tour-hero-copy">
      {destination || category || offer > 0 ? <div className="tour-hero-context" role="group" aria-label="Tour context">
        {destination ? <span>{destination}</span> : null}
        {category ? <><span className="tour-hero-context-separator" aria-hidden="true" /> <span>{category}</span></> : null}
        {offer > 0 ? <span className="tour-hero-offer">Save {offer}%</span> : null}
      </div> : null}
      {title ? <h1 className="tour-page-title">{title}</h1> : null}
      <div className="tour-hero-conversion">
        {tour?.is_inquiry ? (
          <span className="tour-hero-inquiry">Tailored availability</span>
        ) : price !== null && price !== undefined && price !== "" ? (
          <div className="tour-hero-price">
            <span>From</span>
            <strong><PriceText amount={price} /></strong>
          </div>
        ) : null}
        <TourBookingTrigger inquiry={Boolean(tour?.is_inquiry)} />
      </div>
    </header>
  );
}
