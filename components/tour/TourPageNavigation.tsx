"use client";

import { useEffect, useState } from "react";

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
  const links = [
    hasOverview ? { id: "overview", href: "#overview", label: "Overview" } : null,
    hasHighlights ? { id: "highlights", href: "#highlights", label: "Highlights" } : null,
    hasItinerary ? { id: "itinerary", href: "#itinerary", label: "Itinerary" } : null,
    hasInclusions ? { id: "included", href: "#included", label: "Included" } : null,
    hasAddOns ? { id: "add-ons", href: "#add-ons", label: "Add-ons" } : null,
    hasPrices ? { id: "prices", href: "#prices", label: "Prices" } : null,
    hasRelated ? { id: "related-tours", href: "#related-tours", label: "More tours" } : null,
  ].filter((link): link is { id: string; href: string; label: string } => Boolean(link));

  const [activeId, setActiveId] = useState<string>(links[0]?.id || "");

  useEffect(() => {
    if (typeof window === "undefined" || !links.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by distance to top
          const topEntry = visibleEntries.sort(
            (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top)
          )[0];
          if (topEntry?.target.id) {
            setActiveId(topEntry.target.id);
          }
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: [0, 0.2, 0.5],
      }
    );

    links.forEach((link) => {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [links]);

  if (links.length < 2) return null;

  return (
    <nav className="tour-page-nav" aria-label="Tour sections">
      <div className="tour-page-nav-inner">
        <div className="tour-page-nav-scroll" role="tablist">
          {links.map((link) => {
            const isActive = activeId === link.id;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`tour-page-nav-link ${isActive ? "is-active" : ""}`}
                role="tab"
                aria-selected={isActive}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(link.id);
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
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

