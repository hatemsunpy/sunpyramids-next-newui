"use client";

import { useEffect, useRef } from "react";

const REVEAL_DELAY_STEP_MS = 70;
const REVEAL_DELAY_CAP_MS = 210;

// Tiny presentation-only enhancement: one-time scroll entrances for cards and
// sections inside the Multi Country pages. Arming happens in JS only, so every
// target stays fully visible without JavaScript or IntersectionObserver, and a
// live prefers-reduced-motion change reveals everything immediately.
export function McScrollReveal({ selector }: { selector: string }) {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = markerRef.current?.closest(".multi-country-page, .multi-country-subcategory-page");
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (typeof window.matchMedia !== "function") return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (targets.length === 0) return;

    let observer: IntersectionObserver | undefined;

    const revealAll = () => {
      observer?.disconnect();
      targets.forEach((el) => el.classList.add("mc-revealed"));
    };

    // Respect the current preference; never hide content for users who ask
    // for reduced motion.
    if (motionQuery.matches) return;

    root.classList.add("mc-motion-armed");
    targets.forEach((el, index) => {
      el.setAttribute("data-mc-reveal", "");
      el.style.setProperty("--mc-reveal-delay", `${Math.min(index, REVEAL_DELAY_CAP_MS / REVEAL_DELAY_STEP_MS) * REVEAL_DELAY_STEP_MS}ms`);
    });
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("mc-revealed");
          observer?.unobserve(entry.target);
        }
      },
      { threshold: 0, rootMargin: "0px 0px 48px 0px" },
    );
    targets.forEach((el) => observer?.observe(el));

    const onMotionChange = () => {
      if (motionQuery.matches) revealAll();
    };
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      motionQuery.removeEventListener("change", onMotionChange);
      observer?.disconnect();
      root.classList.remove("mc-motion-armed");
      targets.forEach((el) => {
        el.classList.remove("mc-revealed");
        el.removeAttribute("data-mc-reveal");
        el.style.removeProperty("--mc-reveal-delay");
      });
    };
  }, [selector]);

  return <div ref={markerRef} hidden aria-hidden="true" />;
}
