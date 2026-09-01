"use client";

import { useState } from "react";
import { toggleWishlist } from "@/components/CustomerFlows";
import type { Locale, Tour } from "@/types/api";

export function useTourActions(tour: Tour | null, locale: Locale) {
  const [actionMessage, setActionMessage] = useState("");

  async function shareTour() {
    const shareData = { title: tour?.title || "Sun Pyramids Tour", url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        setActionMessage("Tour link copied");
      }
    } catch {
      setActionMessage("Sharing was cancelled");
    }
  }

  async function favoriteTour() {
    if (!tour?.id) return;
    try {
      await toggleWishlist(tour.id, locale);
      setActionMessage("Favorites updated");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Please sign in to use favorites");
    }
  }

  return { actionMessage, favoriteTour, shareTour };
}
