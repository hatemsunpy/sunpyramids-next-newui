"use client";

import { uiCopy } from "@/lib/ui-copy";
import { TourWishlistButtonView } from "@/components/TourWishlistButtonView";
import type { Locale, Tour } from "@/types/api";

export function TourWishlistButton({ tour, locale }: { tour: Pick<Tour, "id" | "title" | "wishlisted_exists">; locale: Locale }) {
  const copy = uiCopy(locale);
  return (
    <TourWishlistButtonView
      tour={tour}
      locale={locale}
      labels={{ addToWishlist: copy.addToWishlist, removeFromWishlist: copy.removeFromWishlist }}
    />
  );
}
