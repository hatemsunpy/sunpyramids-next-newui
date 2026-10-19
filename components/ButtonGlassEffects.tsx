"use client";

import { useEffect } from "react";

const GLASS_TARGETS = [
  'button:not([class*="backdrop"]):not([class*="overlay"])',
  'a[role="button"]',
  'a[class*="btn-"]',
  'a[class*="-btn"]',
  'a[class*="-button"]',
  'a[class*="-cta"]',
].join(",");

export function ButtonGlassEffects() {
  useEffect(() => {
    const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | null = null;
    let pending: { target: Element; clientX: number; clientY: number } | null = null;

    const applyPointer = () => {
      frame = null;
      const current = pending;
      pending = null;
      if (!current) return;
      if (!hoverPointer.matches || reducedMotion.matches) return;
      // Element.closest works for HTML and SVG targets alike (e.g. a nested
      // <svg>/<path> inside a button); narrow to HTMLElement only for style access.
      const target = current.target.closest(GLASS_TARGETS);
      if (!(target instanceof HTMLElement) || target.matches(':disabled, [aria-disabled="true"]')) return;

      const bounds = target.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      target.style.setProperty("--button-glass-x", `${((current.clientX - bounds.left) / bounds.width) * 100}%`);
      target.style.setProperty("--button-glass-y", `${((current.clientY - bounds.top) / bounds.height) * 100}%`);
    };

    const followPointer = (event: PointerEvent) => {
      if (!hoverPointer.matches || reducedMotion.matches || !(event.target instanceof Element)) return;
      // Coalesce rapid pointermove events to one style write per frame.
      // Same targets, same CSS vars, same visual result with less layout work.
      pending = { target: event.target, clientX: event.clientX, clientY: event.clientY };
      if (frame === null) frame = window.requestAnimationFrame(applyPointer);
    };

    document.body.addEventListener("pointermove", followPointer);
    return () => {
      document.body.removeEventListener("pointermove", followPointer);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
