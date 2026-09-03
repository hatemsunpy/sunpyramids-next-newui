"use client";

import { useRef, useState, type ReactNode } from "react";
import { TourCollapsible } from "@/components/tour/TourCollapsible";

export function TourItineraryDisclosure({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [closedAll, setClosedAll] = useState(false);

  function toggleAll() {
    const nextClosed = !closedAll;
    setClosedAll(nextClosed);
    containerRef.current?.querySelectorAll<HTMLDetailsElement>("details").forEach((day) => {
      day.open = !nextClosed;
    });
  }

  return (
    <TourCollapsible
      title="Full itinerary"
      defaultOpen
      actions={
        <button type="button" className="btn-outline btn-sm" onClick={toggleAll}>
          {closedAll ? "Expand All" : "Contract All"}
        </button>
      }
    >
      <div ref={containerRef} className="tour-days">{children}</div>
    </TourCollapsible>
  );
}
