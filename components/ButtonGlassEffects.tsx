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

    const followPointer = (event: PointerEvent) => {
      if (!hoverPointer.matches || reducedMotion.matches || !(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>(GLASS_TARGETS);
      if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;

      const bounds = target.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      target.style.setProperty("--button-glass-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
      target.style.setProperty("--button-glass-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
    };

    document.body.addEventListener("pointermove", followPointer);
    return () => document.body.removeEventListener("pointermove", followPointer);
  }, []);

  return null;
}
