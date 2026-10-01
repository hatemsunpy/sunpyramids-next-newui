"use client";

import { useId, useRef, useState, type ReactNode } from "react";

export function TourItineraryDisclosure({ children }: { children: ReactNode }) {
  const daysRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const [expanded, setExpanded] = useState(true);

  function toggleDayDetails() {
    const nextExpanded = !expanded;
    daysRef.current?.querySelectorAll<HTMLDetailsElement>("details").forEach((day) => {
      day.open = nextExpanded;
    });
    setExpanded(nextExpanded);
  }

  return (
    <div className="tour-collapsible">
      <div className="tour-collapsible-head">
        <h2>Tour Itinerary</h2>
        <div className="tour-collapsible-actions">
          <button
            type="button"
            onClick={toggleDayDetails}
            aria-expanded={expanded}
            aria-controls={contentId}
            aria-label={`${expanded ? "Collapse" : "Expand"} all day details`}
            className={`tour-collapsible-toggle ${expanded ? "is-open" : ""}`}
          >
            ▼
          </button>
        </div>
      </div>
      <div id={contentId} className="tour-collapsible-body">
        <div ref={daysRef} className="tour-days">{children}</div>
      </div>
    </div>
  );
}
