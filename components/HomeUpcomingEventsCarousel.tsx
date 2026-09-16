"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  totalItems: number;
  prevAriaLabel: string;
  nextAriaLabel: string;
  header: ReactNode;
  viewAllLink: ReactNode;
};

export function HomeUpcomingEventsCarousel({
  children,
  totalItems,
  prevAriaLabel,
  nextAriaLabel,
  header,
  viewAllLink,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(totalItems > 1);

  // Drag / swipe state
  const dragState = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startTime: 0,
    dragging: false,
  });
  const suppressClick = useRef(false);

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

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";

    const card = el.querySelector<HTMLElement>(".upcoming-event-card-wrapper");
    const cardWidth = card?.offsetWidth || 340;
    const gap = 20;
    const scrollAmount = cardWidth + gap;

    el.scrollBy({
      left: direction === "next" ? scrollAmount : -scrollAmount,
      behavior,
    });
  };

  // Pointer / touch drag handling
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // On mobile touch screens, let the browser's native hardware-accelerated touch momentum and CSS scroll snap handle swiping with 120fps physics
    if (e.pointerType === "touch" || e.pointerType === "pen") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: el.scrollLeft,
      startTime: Date.now(),
      dragging: false,
    };
    suppressClick.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (state.pointerId !== e.pointerId) return;
    const el = scrollRef.current;
    if (!el) return;

    const distanceX = e.clientX - state.startX;
    const distanceY = e.clientY - state.startY;

    if (!state.dragging && Math.abs(distanceX) < 6) return;
    if (!state.dragging && Math.abs(distanceY) > Math.abs(distanceX)) {
      state.pointerId = null;
      return;
    }

    if (!state.dragging) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // ignore if capture fails
      }
      state.dragging = true;
      suppressClick.current = true;
      el.classList.add("is-dragging");
    }

    el.scrollLeft = state.startScrollLeft - distanceX;
    e.preventDefault();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (state.pointerId !== e.pointerId) return;
    const el = scrollRef.current;
    if (el) {
      if (el.hasPointerCapture(e.pointerId)) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      el.classList.remove("is-dragging");

      if (state.dragging) {
        const elapsed = Math.max(1, Date.now() - state.startTime);
        const distanceX = e.clientX - state.startX;
        const velocityX = distanceX / elapsed;

        const card = el.querySelector<HTMLElement>(".upcoming-event-card-wrapper");
        const cardWidth = card?.offsetWidth || 340;
        const gap = 20;
        const step = cardWidth + gap;

        if (Math.abs(velocityX) > 0.3 || Math.abs(distanceX) > step * 0.25) {
          const direction = distanceX < 0 || velocityX < -0.3 ? 1 : -1;
          el.scrollBy({
            left: direction * step,
            behavior: "smooth",
          });
        }
      }
    }
    state.pointerId = null;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 80);
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="upcoming-events-carousel">
      <div className="upcoming-events-header">
        {header}
        <div className="upcoming-events-header-actions">
          {viewAllLink}
          {totalItems > 1 && (
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
        </div>
      </div>

      <div
        ref={scrollRef}
        className="upcoming-events-track"
        tabIndex={0}
        role="region"
        aria-label="Upcoming events list"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        {children}
      </div>
    </div>
  );
}
