"use client";

import { useEffect, useMemo, useState } from "react";

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
    <nav className="tour-page-nav" aria-label="Tour sections">
      <div className="tour-page-nav-inner">
        <div className="tour-page-nav-scroll">
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
