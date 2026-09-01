"use client";

import Image from "next/image";
import { useState } from "react";
import { DeferredTourMapImage, TourDestinationsModal } from "@/components/tour/TourDestinationsModal";
import type { Locale, Tour } from "@/types/api";

export function TourHighlightsDestinations({ tour, locale }: { tour: Tour | null; locale: Locale }) {
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const featuredDestinations = tour?.destinations?.filter((d) => !d.global && d.enabled && d.featured) ?? [];
  const attractionDestinations = tour?.destinations?.filter((destination) => !destination.global && !destination.featured && destination.enabled) ?? [];

  return (
    <>
      <div className="tour-highlights-map">
        <DeferredTourMapImage sizes="100vw" />
        <button type="button" className="tour-map-button" onClick={() => setDestinationsOpen(true)}>
          <Image src="/images/eye-white.png" alt="" width={20} height={20} />
          View Destinations
        </button>
      </div>
      <div className="tour-attractions">
        {featuredDestinations.map((parent) => {
          const children = tour?.destinations?.filter((d) => d.parent_id === parent.id && !d.global) ?? [];
          if (!children.length) return null;
          return (
            <details key={parent.id} className="tour-attraction" open>
              <summary>{parent.title} Attractions</summary>
              <ul>
                {children.map((child) => (
                  <li key={child.id}>{child.title}</li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
      {tour && attractionDestinations.length ? (
        <TourDestinationsModal tour={tour} locale={locale} destinations={attractionDestinations} open={destinationsOpen} onClose={() => setDestinationsOpen(false)} />
      ) : null}
    </>
  );
}
