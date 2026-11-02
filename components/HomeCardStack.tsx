"use client";

import Image from "@/components/ResponsiveImage";
import { useEffect, useRef, useState, type PointerEvent } from "react";

const visibleOffsets = [-2, -1, 0, 1, 2] as const;

function ArrowIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d={direction === "previous" ? "m14 5-7 7 7 7" : "m10 5 7 7-7 7"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeCardStack({
  photos = [],
  previousLabel,
  nextLabel,
  cardLabel,
}: {
  photos?: string[];
  previousLabel: string;
  nextLabel: string;
  cardLabel: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const count = photos.length;
  const currentIndex = count ? activeIndex % count : 0;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !count) return;

    const order = Array.from(new Set([0, 1, count - 1, 2, count - 2, 3, count - 3, ...photos.map((_, index) => index)]))
      .filter((index) => index >= 0 && index < count);
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
        image.src = photos[index];
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadNext();
    }, { rootMargin: "400px 0px" });

    observer.observe(stage);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [count, photos]);

  const move = (step: number) => {
    if (count > 1) setActiveIndex((index) => (index + step + count) % count);
  };

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const distance = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
  }

  if (!count) return null;

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
        {visibleOffsets.filter((offset) => offset >= -Math.floor((count - 1) / 2) && offset <= Math.floor(count / 2)).map((offset) => {
          const index = (currentIndex + offset + count) % count;
          const photo = photos[index];
          const position = offset === 0 ? "active" : offset === -1 ? "previous" : offset === 1 ? "next" : offset === -2 ? "far-previous" : "far-next";

          return (
            <div className={`home-card-stack__card is-${position}`} key={`${index}:${photo}`} aria-hidden={offset !== 0}>
              <Image
                src={photo}
                alt={offset === 0 ? `${cardLabel} ${index + 1}` : ""}
                fill
                sizes="(max-width: 640px) 75vw, (max-width: 1200px) 30vw, 420px"
              />
            </div>
          );
        })}
      </div>
      {count > 1 ? (
        <div className="home-card-stack__controls">
          <button type="button" onClick={() => move(-1)} aria-label={previousLabel}><ArrowIcon direction="previous" /></button>
          <div className="home-card-stack__progress" aria-hidden="true">
            {photos.map((photo, index) => <span className={index === currentIndex ? "is-active" : ""} key={`${index}:${photo}`} />)}
          </div>
          <button type="button" onClick={() => move(1)} aria-label={nextLabel}><ArrowIcon direction="next" /></button>
        </div>
      ) : null}
      <span className="sr-only" aria-live="polite">{cardLabel} {currentIndex + 1} / {count}</span>
    </div>
  );
}
