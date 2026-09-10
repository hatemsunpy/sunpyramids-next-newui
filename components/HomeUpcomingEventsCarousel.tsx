"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  totalItems: number;
  prevAriaLabel: string;
  nextAriaLabel: string;
};

export function HomeUpcomingEventsCarousel({
  children,
  totalItems,
  prevAriaLabel,
  nextAriaLabel,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(totalItems > 3);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 10);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";

    // Scroll by roughly one full card width + gap
    const cardWidth = el.querySelector<HTMLElement>(".upcoming-event-card-wrapper")?.offsetWidth || 340;
    const scrollAmount = cardWidth + 24;

    el.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior,
    });
  };

  return (
    <div className="upcoming-events-carousel">
      {totalItems > 3 && (
        <div className="upcoming-events-controls" aria-label="Event carousel controls">
          <button
            type="button"
            className="upcoming-events-arrow"
            onClick={() => handleScroll("prev")}
            disabled={!canScrollPrev}
            aria-label={prevAriaLabel}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="upcoming-events-arrow"
            onClick={() => handleScroll("next")}
            disabled={!canScrollNext}
            aria-label={nextAriaLabel}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="upcoming-events-track"
        tabIndex={0}
        role="region"
        aria-label="Upcoming events list"
      >
        {children}
      </div>
    </div>
  );
}
