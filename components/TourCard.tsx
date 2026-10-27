import type { Locale, Tour } from "@/types/api";
import { uiCopy } from "@/lib/ui-copy";
import { TourCardView } from "@/components/TourCardView";

export function TourCard({
  tour,
  locale = "en",
  className = "",
  isSpecialOffer = false,
  imageSizes,
}: {
  tour: Tour;
  locale?: Locale;
  className?: string;
  isSpecialOffer?: boolean;
  imageSizes?: string;
}) {
  const copy = uiCopy(locale);
  return (
    <TourCardView
      tour={tour}
      locale={locale}
      className={className}
      isSpecialOffer={isSpecialOffer}
      imageSizes={imageSizes}
      labels={{
        specialOffer: copy.specialOffer,
        addToWishlist: copy.addToWishlist,
        removeFromWishlist: copy.removeFromWishlist,
      }}
    />
  );
}
