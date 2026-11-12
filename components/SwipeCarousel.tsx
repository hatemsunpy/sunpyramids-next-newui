"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

type CarouselControlLabels = {
  previousLabel: string;
  nextLabel: string;
};

type SwipeCarouselProps = ComponentPropsWithoutRef<"div"> & {
  ariaLabel: string;
  controls?: CarouselControlLabels;
};

type DragState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  startScrollLeft: number;
  startTime: number;
  dragging: boolean;
};

type MutableRef<T> = {
  current: T;
};

type DragRefs = {
  state: MutableRef<DragState>;
  suppressClick: MutableRef<boolean>;
};

const initialDragState: DragState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  startScrollLeft: 0,
  startTime: 0,
  dragging: false,
};

function cardOffsets(track: HTMLDivElement) {
  const trackRect = track.getBoundingClientRect();
  return Array.from(track.children, (card) =>
    (card as HTMLElement).getBoundingClientRect().left - trackRect.left + track.scrollLeft
  );
}

function scrollToPosition(track: HTMLDivElement, left: number) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  track.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
}

function snapToNearestCard(track: HTMLDivElement) {
  const offsets = cardOffsets(track);
  const nearest = offsets.reduce((closest, offset) =>
    Math.abs(offset - track.scrollLeft) < Math.abs(closest - track.scrollLeft) ? offset : closest
  , offsets[0] ?? 0);
  scrollToPosition(track, nearest);
}

function moveByCard(track: HTMLDivElement, direction: -1 | 1) {
  const offsets = cardOffsets(track);
  const currentIndex = offsets.reduce((closestIndex, offset, index) =>
    Math.abs(offset - track.scrollLeft) < Math.abs(offsets[closestIndex] - track.scrollLeft)
      ? index
      : closestIndex
  , 0);
  const nextIndex = Math.max(0, Math.min(offsets.length - 1, currentIndex + direction));
  scrollToPosition(track, offsets[nextIndex] ?? 0);
}

function beginCarouselDrag(event: ReactPointerEvent<HTMLDivElement>, refs: DragRefs) {
  // On mobile touch screens, let the browser's native hardware-accelerated touch momentum and CSS scroll snap handle swiping with 120fps physics
  if (event.pointerType === "touch" || event.pointerType === "pen") return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;

  refs.state.current = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startScrollLeft: event.currentTarget.scrollLeft,
    startTime: Date.now(),
    dragging: false,
  };
  refs.suppressClick.current = false;
}

function moveCarouselPointer(event: ReactPointerEvent<HTMLDivElement>, refs: DragRefs) {
  const state = refs.state.current;
  if (state.pointerId !== event.pointerId) return;

  const distanceX = event.clientX - state.startX;
  const distanceY = event.clientY - state.startY;
  if (!state.dragging && Math.abs(distanceX) < 6) return;
  if (!state.dragging && Math.abs(distanceY) > Math.abs(distanceX)) {
    refs.state.current.pointerId = null;
    return;
  }

  if (!state.dragging) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
  }
  state.dragging = true;
  refs.suppressClick.current = true;
  event.currentTarget.classList.add("is-dragging");
  event.currentTarget.scrollLeft = state.startScrollLeft - distanceX;
  event.preventDefault();
}

function finishCarouselDrag(event: ReactPointerEvent<HTMLDivElement>, refs: DragRefs) {
  const state = refs.state.current;
  if (state.pointerId !== event.pointerId) return;

  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
  }
  event.currentTarget.classList.remove("is-dragging");
  if (state.dragging) {
    const elapsed = Math.max(1, Date.now() - state.startTime);
    const distanceX = event.clientX - state.startX;
    const velocityX = distanceX / elapsed;
    if (Math.abs(velocityX) > 0.25 || Math.abs(distanceX) > 60) {
      moveByCard(event.currentTarget, distanceX < 0 || velocityX < -0.25 ? 1 : -1);
    } else {
      snapToNearestCard(event.currentTarget);
    }
  }
  refs.state.current = { ...initialDragState };
  window.setTimeout(() => { refs.suppressClick.current = false; }, 80);
}

function blockClickAfterDrag(event: ReactMouseEvent<HTMLDivElement>, suppressClick: MutableRef<boolean>) {
  if (!suppressClick.current) return;
  event.preventDefault();
  event.stopPropagation();
}

function moveCarouselWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  moveByCard(event.currentTarget, event.key === "ArrowRight" ? 1 : -1);
}

function useSwipeCarouselInteractions() {
  const refs: DragRefs = {
    state: useRef<DragState>({ ...initialDragState }),
    suppressClick: useRef(false),
  };

  return {
    onClickCapture: (event: ReactMouseEvent<HTMLDivElement>) => blockClickAfterDrag(event, refs.suppressClick),
    onDragStart: (event: ReactDragEvent<HTMLDivElement>) => event.preventDefault(),
    onKeyDown: moveCarouselWithKeyboard,
    onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => finishCarouselDrag(event, refs),
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => beginCarouselDrag(event, refs),
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => moveCarouselPointer(event, refs),
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => finishCarouselDrag(event, refs),
  };
}

function useCarouselEdges(enabled: boolean) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    const scrollable = maxScroll > 1;
    const atStart = !scrollable || track.scrollLeft <= 1;
    const atEnd = !scrollable || track.scrollLeft >= maxScroll - 1;

    setCanPrev(scrollable && !atStart);
    setCanNext(scrollable && !atEnd);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateEdges);
    };

    updateEdges();
    track.addEventListener("scroll", schedule, { passive: true });
    track.addEventListener("load", schedule, true);
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(track);

    return () => {
      window.cancelAnimationFrame(frame);
      track.removeEventListener("scroll", schedule);
      track.removeEventListener("load", schedule, true);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [enabled, updateEdges]);

  return { trackRef, canPrev, canNext };
}

function ChevronIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <path
        d={direction === "previous" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function SwipeCarousel({ ariaLabel, children, className = "", controls, ...props }: SwipeCarouselProps) {
  const interactions = useSwipeCarouselInteractions();
  const { trackRef, canPrev, canNext } = useCarouselEdges(Boolean(controls));

  const track = (
    <div
      {...props}
      {...interactions}
      aria-label={controls ? undefined : ariaLabel}
      aria-roledescription={controls ? undefined : "carousel"}
      className={`swipe-carousel ${className}`.trim()}
      ref={controls ? trackRef : undefined}
      role={controls ? "group" : "region"}
      tabIndex={0}
    >
      {children}
    </div>
  );

  if (!controls) return track;

  return (
    <div
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      className="swipe-carousel-frame"
      role="region"
    >
      <div className="swipe-carousel-controls">
        <button
          aria-label={controls.previousLabel}
          className="swipe-carousel-control"
          disabled={!canPrev}
          onClick={() => {
            const track = trackRef.current;
            if (track) moveByCard(track, -1);
          }}
          type="button"
        >
          <ChevronIcon direction="previous" />
        </button>
        <button
          aria-label={controls.nextLabel}
          className="swipe-carousel-control"
          disabled={!canNext}
          onClick={() => {
            const track = trackRef.current;
            if (track) moveByCard(track, 1);
          }}
          type="button"
        >
          <ChevronIcon direction="next" />
        </button>
      </div>
      {track}
    </div>
  );
}
