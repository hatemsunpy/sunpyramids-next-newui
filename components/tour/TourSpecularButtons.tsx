"use client";

import { useEffect, useRef } from "react";

const SPECULAR_TARGETS = [
  "button:not(.tour-booking-backdrop)",
  "a.btn-primary",
  "a.btn-outline",
  "a.tour-gallery-expand",
  "a.tour-make-trip-direct-btn",
].join(",");

function specularTarget(scope: HTMLElement, eventTarget: EventTarget | null) {
  if (!(eventTarget instanceof Element)) return null;
  const target = eventTarget.closest<HTMLElement>(SPECULAR_TARGETS);
  return target && scope.contains(target) && !target.matches(":disabled") ? target : null;
}

function positionSpecularLight(target: HTMLElement, pointerEvent: PointerEvent) {
  const bounds = target.getBoundingClientRect();
  const horizontalPosition = ((pointerEvent.clientX - bounds.left) / bounds.width) * 100;
  const verticalPosition = ((pointerEvent.clientY - bounds.top) / bounds.height) * 100;
  target.style.setProperty("--tour-specular-x", `${horizontalPosition}%`);
  target.style.setProperty("--tour-specular-y", `${verticalPosition}%`);
}

export function TourSpecularButtons() {
  const scopeMarkerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const scope = scopeMarkerRef.current?.closest<HTMLElement>(".tour-page-redesign");
    if (!scope || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const followPointer = (pointerEvent: PointerEvent) => {
      const target = specularTarget(scope, pointerEvent.target);
      if (target) positionSpecularLight(target, pointerEvent);
    };

    scope.addEventListener("pointermove", followPointer);
    return () => scope.removeEventListener("pointermove", followPointer);
  }, []);

  return <span ref={scopeMarkerRef} hidden />;
}
