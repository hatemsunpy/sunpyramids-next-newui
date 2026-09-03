"use client";

import Image from "next/image";
import { useState } from "react";
import { TourDestinationsModal } from "@/components/tour/TourDestinationsModal";
import type { Locale, Tour } from "@/types/api";

export function TourHighlightsDestinations({ tour, locale }: { tour: Tour | null; locale: Locale }) {
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const featuredDestinations = tour?.destinations?.filter((d) => !d.global && d.enabled && d.featured) ?? [];
  const attractionDestinations = tour?.destinations?.filter((destination) => !destination.global && !destination.featured && destination.enabled) ?? [];
  const displayDestinations = (featuredDestinations.length ? featuredDestinations : attractionDestinations).slice(0, 4);
  const modalDestinations = attractionDestinations.length ? attractionDestinations : featuredDestinations;

  return (
    <>
      <div className="tour-destination-story">
        {displayDestinations.map((destination, index) => {
          const image = destination.banner || destination.phone_banner || destination.featured_image || destination.gallery?.[0];
          const isLead = index === 0 && displayDestinations.length > 1;
          return (
            <article
              className={`tour-destination-story-item ${image ? "has-image" : ""} ${isLead ? "is-lead-story" : ""}`}
              key={destination.id || destination.slug || index}
            >
              {image ? (
                <div className="tour-destination-story-media">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes={isLead ? "(max-width: 768px) 100vw, 48vw" : "(max-width: 768px) 100vw, 24vw"}
                  />
                </div>
              ) : null}
              <div className="tour-destination-story-copy">
                <span className="tour-destination-step" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="tour-destination-info">
                  {isLead ? <span className="tour-destination-badge">Key Destination</span> : null}
                  <h3>{destination.title || destination.name}</h3>
                </div>
              </div>
            </article>
          );
        })}
        {modalDestinations.length ? (
          <button
            type="button"
            className="tour-map-button"
            onClick={() => setDestinationsOpen(true)}
          >
            <span>Explore all destinations ({modalDestinations.length})</span>
            <span className="tour-map-button-arrow" aria-hidden="true">→</span>
          </button>
        ) : null}
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
      {tour && modalDestinations.length ? (
        <TourDestinationsModal tour={tour} locale={locale} destinations={modalDestinations} open={destinationsOpen} onClose={() => setDestinationsOpen(false)} />
      ) : null}
    </>
  );
}
