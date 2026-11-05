"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { useTourActions } from "@/components/tour/TourActions";
import { TourSatelliteMap } from "@/components/tour/TourSatelliteMap";
import type { Locale, Tour } from "@/types/api";

export type TourDestination = NonNullable<Tour["destinations"]>[number];

export function DeferredTourMapImage({ sizes }: { sizes: string }) {
  return (
    <div className="tour-deferred-map-image tour-map-unavailable" data-sizes={sizes}>
      <span>Map preview is not available for this destination.</span>
    </div>
  );
}

function DestinationList({ destinations, activeDestination, onSelect, registerRow }: { destinations: TourDestination[]; activeDestination: TourDestination; onSelect: (destination: TourDestination) => void; registerRow: (destination: TourDestination, node: HTMLButtonElement | null) => void }) {
  return (
    <div className="tour-destinations-list" aria-label="Tour destinations">
      {destinations.map((destination) => (
        <button key={destination.id || destination.slug} ref={(node) => registerRow(destination, node)} type="button" className={destination === activeDestination ? "is-active" : ""} onClick={() => onSelect(destination)} aria-pressed={destination === activeDestination}>
          <span className="tour-destination-marker" aria-hidden="true" />
          <span>{destination.title || destination.name}</span>
        </button>
      ))}
    </div>
  );
}

export function TourDestinationsModal({ tour, locale, destinations, open, onClose }: { tour: Tour; locale: Locale; destinations: TourDestination[]; open: boolean; onClose: () => void }) {
  const { format } = useCurrency();
  const price = tour.adult_price ?? tour.start_from ?? tour.price;
  const [activeDestination, setActiveDestination] = useState(destinations[0]);
  const { actionMessage, shareTour } = useTourActions(tour, locale);
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const listRowsRef = useRef(new Map<TourDestination, HTMLButtonElement>());

  const registerRow = useCallback((destination: TourDestination, node: HTMLButtonElement | null) => {
    if (node) listRowsRef.current.set(destination, node);
    else listRowsRef.current.delete(destination);
  }, []);

  const handleMapSelect = useCallback((destination: TourDestination) => {
    setActiveDestination(destination);
    const row = listRowsRef.current.get(destination);
    if (!row) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    row.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

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
          <TourSatelliteMap destinations={destinations} activeDestination={activeDestination} onSelect={handleMapSelect} />
          <div className="tour-destinations-summary">
            <h3>{tour.title || tour.name}</h3>
            <div className="tour-destinations-price-row">
              {price !== null && price !== undefined && price !== "" ? <div><span>Price</span><strong>{format(price)}</strong></div> : <span />}
              <button className="btn-outline" type="button" onClick={shareTour}>Share</button>
            </div>
            <button className="btn-primary tour-destinations-book" type="button" onClick={openBookingPanel}>Book now</button>
            <h4>Destinations</h4>
            <DestinationList destinations={destinations} activeDestination={activeDestination} onSelect={setActiveDestination} registerRow={registerRow} />
            {actionMessage ? <p className="tour-booking-status" role="status">{actionMessage}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
