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
  const gallery = (tour?.gallery?.length ? tour.gallery : [tour?.featured_image]).filter((image): image is string => Boolean(image));
  const previewLimit = 3;
  const otherIndexes = gallery
    .map((_, index) => index)
    .filter((index) => index !== active);
  const previewIndexes = otherIndexes.slice(0, previewLimit);
  const remainingCount = Math.max(0, gallery.length - 1 - previewLimit);

  function showPhoto(index: number) {
    if (!gallery.length) return;
    setActive((index + gallery.length) % gallery.length);
  }

  function navigateGalleryWithKeyboard(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") showPhoto(active - 1);
    else if (event.key === "ArrowRight") showPhoto(active + 1);
  }

  if (!gallery.length) {
    return (
      <section className="tour-gallery tour-gallery-empty" aria-label="Tour photography">
        <p>Photography is not available for this tour.</p>
      </section>
    );
  }

  return (
    <section
      className={`tour-gallery ${previewIndexes.length ? "has-previews" : ""}`}
      aria-label="Tour gallery"
      tabIndex={0}
      onKeyDown={navigateGalleryWithKeyboard}
    >
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
          alt={`${tour?.title || tour?.name || "Tour"} photo ${active + 1}`}
          fill
          preload={active === 0}
          fetchPriority={active === 0 ? "high" : "auto"}
          loading={active === 0 ? "eager" : "lazy"}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 75vw"
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
      {previewIndexes.length ? (
        <div className={`tour-gallery-previews tour-gallery-previews-${previewIndexes.length}`}>
          {previewIndexes.map((index, i) => {
            const src = gallery[index];
            const isLastWithMore = i === previewLimit - 1 && remainingCount > 0;
            return (
              <button
                key={`preview-${src}-${index}`}
                type="button"
                className={`tour-gallery-preview react-bits-glare ${isLastWithMore ? "has-more-badge" : ""}`}
                onClick={() => showPhoto(index)}
                aria-label={`View photo ${index + 1}`}
              >
                {thumbnailsReady ? <Image src={src} alt="" fill sizes="(max-width: 767px) 0px, (max-width: 1024px) 32vw, 24vw" loading="lazy" /> : null}
                {isLastWithMore ? (
                  <span className="tour-gallery-more-overlay" aria-hidden="true">
                    +{remainingCount + 1} photos
                  </span>
                ) : null}
                <span className="react-bits-glare-effect" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : null}
      <span className="tour-gallery-count" aria-live="polite">
        <strong>{String(active + 1).padStart(2, "0")}</strong> / {String(gallery.length).padStart(2, "0")}
      </span>
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
