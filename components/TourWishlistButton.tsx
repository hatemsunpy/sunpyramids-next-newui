"use client";

import { useTourActions } from "@/components/tour/TourActions";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale, Tour } from "@/types/api";

export function TourWishlistButton({ tour, locale }: { tour: Tour; locale: Locale }) {
  const copy = uiCopy(locale);
  const { actionMessage, favoriteTour, isFavorite, isFavoritePending } = useTourActions(tour, locale);
  const label = isFavorite ? copy.removeFromWishlist : copy.addToWishlist;

  return (
    <div className="tour-card-wishlist-wrap">
      <button
        type="button"
        className="tour-card-wishlist"
        aria-label={label}
        aria-pressed={isFavorite}
        disabled={isFavoritePending}
        onClick={() => { void favoriteTour(); }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
        </svg>
      </button>
      {actionMessage ? (
        <span className="tour-card-wishlist-feedback" role="status">
          {actionMessage}
        </span>
      ) : null}
    </div>
  );
}
