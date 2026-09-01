"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useTourActions } from "@/components/tour/TourActions";
import type { Locale, Tour } from "@/types/api";

export function TourGallery({ tour, locale }: { tour: Tour | null; locale: Locale }) {
  const [active, setActive] = useState(0);
  const [thumbnailsReady, setThumbnailsReady] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const { actionMessage, favoriteTour, shareTour } = useTourActions(tour, locale);
  const gallery = tour?.gallery?.length ? tour.gallery : [tour?.featured_image || "/images/mainBanner.png"];
  const thumbnailWindowSize = 5;
  const thumbnailStart = Math.min(
    Math.max(active - Math.floor(thumbnailWindowSize / 2), 0),
    Math.max(gallery.length - thumbnailWindowSize, 0),
  );
  const visibleThumbnails = gallery.slice(thumbnailStart, thumbnailStart + thumbnailWindowSize);

  function showPhoto(index: number) {
    setActive((index + gallery.length) % gallery.length);
  }

  return (
    <section className="tour-gallery">
      <div
        className="tour-gallery-main"
        onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStartX.current == null) return;
          const distance = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          if (Math.abs(distance) > 45) showPhoto(active + (distance < 0 ? 1 : -1));
          touchStartX.current = null;
        }}
      >
        <Image
          key={`${gallery[active]}-${active}`}
          src={gallery[active]}
          alt={`${tour?.title || "Tour"} photo ${active + 1}`}
          fill
          preload={active === 0}
          fetchPriority={active === 0 ? "high" : "auto"}
          loading={active === 0 ? "eager" : "lazy"}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 62vw, 967px"
          className="tour-gallery-slide is-active"
          onLoad={() => setThumbnailsReady(true)}
        />
        {gallery.length > 1 ? (
          <>
            <button className="tour-gallery-arrow tour-gallery-prev" type="button" onClick={() => showPhoto(active - 1)} aria-label="Previous photo"><ChevronIcon direction="previous" /></button>
            <button className="tour-gallery-arrow tour-gallery-next" type="button" onClick={() => showPhoto(active + 1)} aria-label="Next photo"><ChevronIcon direction="next" /></button>
          </>
        ) : null}
        <div className="tour-gallery-actions">
          <button type="button" onClick={favoriteTour} aria-label="Add tour to favorites"><HeartIcon /></button>
          <button type="button" onClick={shareTour} aria-label="Share tour"><ShareIcon /></button>
        </div>
        <a className="tour-gallery-expand" href={gallery[active]} target="_blank" rel="noreferrer" aria-label="Open current photo"><ExpandIcon /></a>
      </div>
      <div className="tour-gallery-thumbs">
        {visibleThumbnails.map((src, offset) => {
          const index = thumbnailStart + offset;
          return (
            <button
              key={`thumb-${src}-${index}`}
              type="button"
              className={`tour-gallery-thumb ${index === active ? "is-active" : ""}`}
              onClick={() => setActive(index)}
              aria-label={`View photo ${index + 1}`}
            >
              {thumbnailsReady || index === active ? (
                <Image src={src} alt="" width={80} height={80} loading="lazy" />
              ) : null}
            </button>
          );
        })}
      </div>
      <span className="tour-gallery-count" aria-live="polite">{active + 1} / {gallery.length}</span>
      {actionMessage ? <p className="tour-gallery-message" role="status">{actionMessage}</p> : null}
    </section>
  );
}

function ChevronIcon({ direction }: { direction: "previous" | "next" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction === "previous" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} /></svg>;
}

function HeartIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>;
}

function ShareIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></svg>;
}

function ExpandIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>;
}
