"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

export function TourPageNavigation({
  hasOverview,
  hasHighlights,
  hasItinerary,
  hasInclusions,
  hasAddOns,
  hasPrices,
  hasRelated,
}: {
  hasOverview: boolean;
  hasHighlights: boolean;
  hasItinerary: boolean;
  hasInclusions: boolean;
  hasAddOns: boolean;
  hasPrices: boolean;
  hasRelated: boolean;
}) {
  const links = useMemo(() => [
    hasOverview ? { id: "overview", href: "#overview", label: "Overview" } : null,
    hasHighlights ? { id: "highlights", href: "#highlights", label: "Highlights" } : null,
    hasItinerary ? { id: "itinerary", href: "#itinerary", label: "Itinerary" } : null,
    hasInclusions ? { id: "included", href: "#included", label: "Included" } : null,
    hasAddOns ? { id: "add-ons", href: "#add-ons", label: "Add-ons" } : null,
    hasPrices ? { id: "prices", href: "#prices", label: "Prices" } : null,
    hasRelated ? { id: "related-tours", href: "#related-tours", label: "More tours" } : null,
  ].filter((link): link is { id: string; href: string; label: string } => Boolean(link)), [hasAddOns, hasHighlights, hasInclusions, hasItinerary, hasOverview, hasPrices, hasRelated]);

  const [activeId, setActiveId] = useState<string>(links[0]?.id || "");
  const navRef = useRef<HTMLElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; scrollLeft: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    // Touch keeps native scrolling and momentum; mouse dragging needs a handler.
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    suppressClick.current = false;
    const rail = event.currentTarget;
    if (rail.scrollWidth <= rail.clientWidth) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: rail.scrollLeft, moved: false };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (event.buttons !== 1) {
      finishDrag(event);
      return;
    }
    const distance = event.clientX - current.startX;
    if (!current.moved && Math.abs(distance) < 6) return;
    const rail = event.currentTarget;
    if (!current.moved) {
      current.moved = true;
      suppressClick.current = true;
      rail.setPointerCapture(event.pointerId);
      rail.classList.add("is-dragging");
    }
    event.preventDefault();
    rail.scrollLeft = current.scrollLeft - distance;
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    const rail = event.currentTarget;
    drag.current = null;
    rail.classList.remove("is-dragging");
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    // The click dispatched immediately after pointerup must not navigate.
    window.setTimeout(() => { suppressClick.current = false; }, 0);
  }

  useEffect(() => {
    const nav = navRef.current;
    const page = nav?.closest<HTMLElement>(".tour-page-redesign");
    if (!nav || !page) return;

    const updateNavHeight = () => {
      page.style.setProperty("--tour-nav-height", `${nav.getBoundingClientRect().height}px`);
    };
    updateNavHeight();
    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(nav);
    return () => {
      observer.disconnect();
      page.style.removeProperty("--tour-nav-height");
    };
  }, [links.length]);

  useEffect(() => {
    if (typeof window === "undefined" || !links.length) return;

    const sections = links.map((link) => document.getElementById(link.id)).filter((section): section is HTMLElement => Boolean(section));
    let frame = 0;

    const updateActive = () => {
      frame = 0;
      const navBottom = document.querySelector<HTMLElement>(".tour-page-nav")?.getBoundingClientRect().bottom ?? 0;
      let currentId = sections[0]?.id || "";

      for (const section of sections) {
        const scrollMargin = Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
        if (section.getBoundingClientRect().top <= Math.max(navBottom + 8, scrollMargin) + 1) {
          currentId = section.id;
        }
      }
      setActiveId(currentId);
    };

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateActive);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [links]);

  if (links.length < 2) return null;

  return (
    <nav ref={navRef} className="tour-page-nav" aria-label="Tour sections">
      <div className="tour-page-nav-inner">
        <div
          className="tour-page-nav-scroll"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onLostPointerCapture={finishDrag}
          onDragStart={(event) => event.preventDefault()}
          onClickCapture={(event) => {
            if (!suppressClick.current) return;
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {links.map((link) => {
            const isActive = activeId === link.id;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`tour-page-nav-link ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  const target = document.getElementById(link.id);
                  if (target) {
                    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
                    setActiveId(link.id);
                  }
                }}
              >
                {link.label}
                {isActive ? <span className="tour-page-nav-indicator" aria-hidden="true" /> : null}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
