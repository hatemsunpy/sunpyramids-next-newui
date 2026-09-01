"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { useTourActions } from "@/components/tour/TourActions";
import type { Locale, Tour } from "@/types/api";

export type TourDestination = NonNullable<Tour["destinations"]>[number];

function destinationMapUrl(destinations: TourDestination[], activeDestination: TourDestination) {
  const coordinates = destinations
    .map((destination) => ({ latitude: Number(destination.latitude), longitude: Number(destination.longitude) }))
    .filter(({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude));
  const activeLatitude = Number(activeDestination.latitude);
  const activeLongitude = Number(activeDestination.longitude);
  if (!coordinates.length || !Number.isFinite(activeLatitude) || !Number.isFinite(activeLongitude)) return "";
  const latitudes = coordinates.map(({ latitude }) => latitude);
  const longitudes = coordinates.map(({ longitude }) => longitude);
  const latitudePadding = Math.max(0.8, (Math.max(...latitudes) - Math.min(...latitudes)) * 0.18);
  const longitudePadding = Math.max(0.8, (Math.max(...longitudes) - Math.min(...longitudes)) * 0.18);
  const bounds = [Math.min(...longitudes) - longitudePadding, Math.min(...latitudes) - latitudePadding, Math.max(...longitudes) + longitudePadding, Math.max(...latitudes) + latitudePadding];
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bounds.join("%2C")}&layer=mapnik&marker=${activeLatitude}%2C${activeLongitude}`;
}

export function DeferredTourMapImage({ sizes }: { sizes: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="tour-deferred-map-image">
      {visible ? <Image src="/images/map.png" alt="Tour destinations map" fill sizes={sizes} /> : null}
    </div>
  );
}

function DestinationMap({ destinations, activeDestination }: { destinations: TourDestination[]; activeDestination: TourDestination }) {
  const mapUrl = destinationMapUrl(destinations, activeDestination);
  return (
    <div className="tour-destinations-map">
      {mapUrl ? (
        <iframe key={mapUrl} src={mapUrl} title={`Map showing ${activeDestination.title || "tour destination"}`} loading="lazy" />
      ) : (
        <DeferredTourMapImage sizes="(max-width: 800px) 100vw, 50vw" />
      )}
    </div>
  );
}

function DestinationList({ destinations, activeDestination, onSelect }: { destinations: TourDestination[]; activeDestination: TourDestination; onSelect: (destination: TourDestination) => void }) {
  return (
    <div className="tour-destinations-list" aria-label="Tour destinations">
      {destinations.map((destination) => (
        <button key={destination.id || destination.slug} type="button" className={destination === activeDestination ? "is-active" : ""} onClick={() => onSelect(destination)}>
          <span className="tour-destination-marker" aria-hidden="true" />
          <span>{destination.title || destination.name}</span>
        </button>
      ))}
    </div>
  );
}

export function TourDestinationsModal({ tour, locale, destinations, open, onClose }: { tour: Tour; locale: Locale; destinations: TourDestination[]; open: boolean; onClose: () => void }) {
  const { format } = useCurrency();
  const [activeDestination, setActiveDestination] = useState(destinations[0]);
  const { actionMessage, shareTour } = useTourActions(tour, locale);
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>('button, a[href], iframe, [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open || !activeDestination) return null;

  function openBookingPanel() {
    onClose();
    window.dispatchEvent(new CustomEvent("tour:open-booking"));
  }

  return (
    <div className="tour-destinations-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={modalRef} className="tour-destinations-modal" role="dialog" aria-modal="true" aria-labelledby="tour-destinations-title">
        <header className="tour-destinations-head">
          <h2 id="tour-destinations-title">View Destinations</h2>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close destinations">×</button>
        </header>
        <div className="tour-destinations-layout">
          <DestinationMap destinations={destinations} activeDestination={activeDestination} />
          <div className="tour-destinations-summary">
            <h3>{tour.title || tour.name}</h3>
            <div className="tour-destinations-price-row">
              <div><span>Price</span><strong>{format(tour.adult_price || tour.start_from || tour.price || 0)}</strong></div>
              <button className="btn-outline" type="button" onClick={shareTour}>Share</button>
            </div>
            <button className="btn-primary tour-destinations-book" type="button" onClick={openBookingPanel}>Book now</button>
            <h4>Destinations</h4>
            <DestinationList destinations={destinations} activeDestination={activeDestination} onSelect={setActiveDestination} />
            {actionMessage ? <p className="tour-booking-status" role="status">{actionMessage}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
