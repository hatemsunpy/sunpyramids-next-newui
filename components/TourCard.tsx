import Image from "next/image";
import Link from "next/link";
import type { Locale, Tour } from "@/types/api";
import { tourPath } from "@/lib/locales";
import { uiCopy } from "@/lib/ui-copy";
import { PriceText } from "@/components/PriceText";
import { TourWishlistButton } from "@/components/TourWishlistButton";

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

function DiscountBadgeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.3533 7.24643L13.34 6.23309C13.1667 6.05976 13.0267 5.71976 13.0267 5.47976V4.03976C13.0267 3.45309 12.5467 2.97309 11.96 2.97309H10.5267C10.2867 2.97309 9.94667 2.83309 9.77334 2.65976L8.76 1.64643C8.34667 1.23309 7.66667 1.23309 7.25334 1.64643L6.22667 2.65976C6.06 2.83309 5.72 2.97309 5.47334 2.97309H4.04C3.45334 2.97309 2.97334 3.45309 2.97334 4.03976V5.47309C2.97334 5.71309 2.83334 6.05309 2.66 6.22643L1.64667 7.23976C1.23334 7.65309 1.23334 8.33309 1.64667 8.74643L2.66 9.75976C2.83334 9.93309 2.97334 10.2731 2.97334 10.5131V11.9464C2.97334 12.5331 3.45334 13.0131 4.04 13.0131H5.47334C5.71334 13.0131 6.05334 13.1531 6.22667 13.3264L7.24 14.3398C7.65334 14.7531 8.33334 14.7531 8.74667 14.3398L9.76 13.3264C9.93334 13.1531 10.2733 13.0131 10.5133 13.0131H11.9467C12.5333 13.0131 13.0133 12.5331 13.0133 11.9464V10.5131C13.0133 10.2731 13.1533 9.93309 13.3267 9.75976L14.34 8.74643C14.7733 8.33976 14.7733 7.65976 14.3533 7.24643ZM5.33334 5.99976C5.33334 5.63309 5.63334 5.33309 6 5.33309C6.36667 5.33309 6.66667 5.63309 6.66667 5.99976C6.66667 6.36643 6.37334 6.66643 6 6.66643C5.63334 6.66643 5.33334 6.36643 5.33334 5.99976ZM6.35334 10.3531C6.25334 10.4531 6.12667 10.4998 6 10.4998C5.87334 10.4998 5.74667 10.4531 5.64667 10.3531C5.45334 10.1598 5.45334 9.83976 5.64667 9.64643L9.64667 5.64643C9.84 5.45309 10.16 5.45309 10.3533 5.64643C10.5467 5.83976 10.5467 6.15976 10.3533 6.35309L6.35334 10.3531ZM10 10.6664C9.62667 10.6664 9.32667 10.3664 9.32667 9.99976C9.32667 9.63309 9.62667 9.33309 9.99334 9.33309C10.36 9.33309 10.66 9.63309 10.66 9.99976C10.66 10.3664 10.3667 10.6664 10 10.6664Z"
        fill="currentColor"
      />
    </svg>
  );
}

function checkSpecialOffer(tour: Tour, forceSpecialOffer?: boolean): boolean {
  if (forceSpecialOffer) return true;
  if (tour.offer && Number(tour.offer) > 0) return true;
  const categories = [...(tour.categories || [])];
  if (tour.category) categories.push(tour.category);
  return categories.some((cat) => {
    const slug = (cat.slug || "").toLowerCase();
    const title = (cat.title || cat.name || "").toLowerCase();
    return (
      cat.id === 53 ||
      slug === "special-offers" ||
      slug === "special_offers" ||
      slug.includes("special-offer") ||
      title.includes("special offer")
    );
  });
}

function DurationClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path
        d="M8 4.25V8.25L10.75 10.25"
        stroke="#ffffff"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TourCard({
  tour,
  locale = "en",
  className = "",
  isSpecialOffer = false,
}: {
  tour: Tour;
  locale?: Locale;
  className?: string;
  isSpecialOffer?: boolean;
}) {
  const copy = uiCopy(locale);
  const slug = tour.slug || String(tour.id || "");
  const title = tour.title || tour.name || "Egypt Tour";
  const description = tour.short_description || tour.description || title;
  const price = priceOf(tour);
  const isOffer = checkSpecialOffer(tour, isSpecialOffer);

  const rawOffer = tour.offer;
  const offerPercent =
    typeof rawOffer === "number"
      ? rawOffer
      : typeof rawOffer === "string" && /^\d+(\.\d+)?$/.test(rawOffer)
        ? Number(rawOffer)
        : null;
  const hasDiscount = Boolean(
    offerPercent &&
    offerPercent > 0 &&
    offerPercent < 100 &&
    price !== null &&
    price !== undefined &&
    Number(price) > 0,
  );
  const discountedPrice = hasDiscount
    ? (Number(price) * (100 - (offerPercent as number))) / 100
    : price;

  return (
    <article className={`tour-card ${className}`.trim()}>
      <TourWishlistButton tour={tour} locale={locale} />
      {isOffer ? (
        <div className="tour-card-offer-badge">
          <DiscountBadgeIcon className="tour-card-offer-icon" />
          <span>{copy.specialOffer || "Special Offer"}</span>
        </div>
      ) : null}
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
              <div className="tour-card-price-wrap">
                <strong>
                  {discountedPrice !== null && discountedPrice !== undefined ? (
                    <PriceText amount={discountedPrice} />
                  ) : (
                    "Request Price"
                  )}
                </strong>
                {hasDiscount ? (
                  <span className="tour-card-price-original">
                    <PriceText amount={price} />
                  </span>
                ) : null}
              </div>
            </div>
            <p className="tour-card-duration">
              <span className="tour-card-duration-icon" aria-hidden="true">
                <DurationClockIcon />
              </span>
              <span>{tour.duration || "Flexible"}</span>
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
