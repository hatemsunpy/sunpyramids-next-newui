"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SCROLL_THRESHOLD = 320;
const RING_RADIUS = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function readScrollState() {
  const scrollY = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, scrollY / scrollable)) : 0;
  return { visible: scrollY > SCROLL_THRESHOLD, progress };
}

export function BackToTopButton({ label = "Back to top" }: { label?: string }) {
  const [scrollState, setScrollState] = useState({ visible: false, progress: 0 });

  useEffect(() => {
    let scheduled = false;
    let frame = 0;

    const updateScrollState = () => {
      scheduled = false;
      frame = 0;
      setScrollState(readScrollState());
    };

    const scheduleUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      frame = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (scheduled && frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToTop = () => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - scrollState.progress);

  return (
    <button
      type="button"
      className={`back-to-top-float${scrollState.visible ? " is-visible" : ""}`}
      onClick={scrollToTop}
      aria-label={label}
      title={label}
      aria-hidden={!scrollState.visible}
      tabIndex={scrollState.visible ? 0 : -1}
    >
      <svg
        className="back-to-top-ring"
        viewBox="0 0 44 44"
        width="44"
        height="44"
        aria-hidden="true"
      >
        <circle className="back-to-top-ring-track" cx="22" cy="22" r={RING_RADIUS} />
        <circle
          className="back-to-top-ring-progress"
          cx="22"
          cy="22"
          r={RING_RADIUS}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <ArrowUp className="back-to-top-icon" size={18} strokeWidth={2.25} aria-hidden="true" />
    </button>
  );
}
