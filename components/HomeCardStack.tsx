"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";

// Frontend-owned guest photos provided for this editorial gallery.
const photos = [
  "01_white_desert_group_1080x1350.jpg",
  "02_giza_atv_1080x1350.jpg",
  "03_abu_simbel_1080x1350.jpg",
  "04_giza_horse_1080x1350.jpg",
  "05_white_desert_couple_1080x1350.jpg",
  "06_giza_rearing_horse_1080x1350.jpg",
  "07_citadel_group_1080x1350.jpg",
  "08_giza_family_1080x1350.jpg",
  "09_gem_indoor_group_1080x1350.jpg",
  "10_sun_pyramids_van_1080x1350.jpg",
  "11_giza_proposal_1080x1350.jpg",
  "01_old_cairo_family_1080x1350.jpg",
  "02_gem_group_1080x1350.jpg",
  "03_cairo_cafe_family_1080x1350.jpg",
  "04_egyptian_temple_1080x1350.jpg",
  "05_giza_camel_1080x1350.jpg",
  "06_islamic_courtyard_1080x1350.jpg",
] as const;

const visibleOffsets = [-2, -1, 0, 1, 2] as const;

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={direction === "previous" ? "m14 5-7 7 7 7" : "m10 5 7 7-7 7"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeCardStack({
  previousLabel,
  nextLabel,
  cardLabel,
}: {
  previousLabel: string;
  nextLabel: string;
  cardLabel: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const count = photos.length;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const order = Array.from(new Set([0, 1, count - 1, 2, count - 2, 3, count - 3, ...photos.map((_, index) => index)]));
    const preloads: HTMLImageElement[] = [];
    let cursor = 0;
    let inFlight = 0;
    let cancelled = false;

    function loadNext() {
      while (!cancelled && inFlight < 3 && cursor < order.length) {
        const index = order[cursor++];
        const image = new window.Image();
        image.decoding = "async";
        image.fetchPriority = cursor <= 5 ? "auto" : "low";
        image.onload = image.onerror = () => {
          inFlight--;
          loadNext();
        };
        preloads.push(image);
        inFlight++;
        image.src = `/images/guest-photos/${photos[index]}`;
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadNext();
    }, { rootMargin: "1000px 0px" });

    observer.observe(stage);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [count]);

  const move = (step: number) => setActiveIndex((index) => (index + step + count) % count);

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const distance = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
  }

  return (
    <div className="home-card-stack">
      <div
        ref={stageRef}
        className="home-card-stack__stage"
        role="region"
        aria-roledescription="carousel"
        aria-label={cardLabel}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button === 0) startX.current = event.clientX;
        }}
        onPointerUp={endSwipe}
        onPointerCancel={() => { startX.current = null; }}
        onDragStart={(event) => event.preventDefault()}
      >
        {visibleOffsets.map((offset) => {
          const index = (activeIndex + offset + count) % count;
          const photo = photos[index];
          const position = offset === 0 ? "active" : offset === -1 ? "previous" : offset === 1 ? "next" : offset === -2 ? "far-previous" : "far-next";

          return (
            <div className={`home-card-stack__card is-${position}`} key={photo} aria-hidden={offset !== 0}>
              <Image
                src={`/images/guest-photos/${photo}`}
                alt={offset === 0 ? `${cardLabel} ${index + 1}` : ""}
                fill
                sizes="(max-width: 640px) 75vw, (max-width: 1200px) 30vw, 420px"
              />
            </div>
          );
        })}
      </div>
      <div className="home-card-stack__controls">
        <button type="button" onClick={() => move(-1)} aria-label={previousLabel}><ArrowIcon direction="previous" /></button>
        <div className="home-card-stack__progress" aria-hidden="true">
          {photos.map((photo, index) => <span className={index === activeIndex ? "is-active" : ""} key={photo} />)}
        </div>
        <button type="button" onClick={() => move(1)} aria-label={nextLabel}><ArrowIcon direction="next" /></button>
      </div>
      <span className="sr-only" aria-live="polite">{cardLabel} {activeIndex + 1} / {count}</span>
    </div>
  );
}
