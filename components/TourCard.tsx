import type { Locale, Tour } from "@/types/api";
import { uiCopy } from "@/lib/ui-copy";
import { TourCardView, type TourCardVariant } from "@/components/TourCardView";

export function TourCard({
  tour,
  locale = "en",
  className = "",
  isSpecialOffer = false,
  imageSizes,
  summary,
  variant = "frosted",
}: {
  tour: Tour;
  locale?: Locale;
  className?: string;
  isSpecialOffer?: boolean;
  imageSizes?: string;
  summary?: string;
  variant?: TourCardVariant;
}) {
  const copy = uiCopy(locale);
  return (
    <TourCardView
      tour={tour}
      locale={locale}
      className={className}
      isSpecialOffer={isSpecialOffer}
      imageSizes={imageSizes}
      summary={summary}
      variant={variant}
      labels={{
        specialOffer: copy.specialOffer,
        addToWishlist: copy.addToWishlist,
        removeFromWishlist: copy.removeFromWishlist,
        viewTour: copy.viewTour,
      }}
    />
  );
}
