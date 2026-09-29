"use client";

import { ArrowRight } from "lucide-react";

export function TourBookingTrigger({ inquiry = false }: { inquiry?: boolean }) {
  return (
    <button
      type="button"
      className="tour-hero-booking-trigger"
      onClick={() => window.dispatchEvent(new CustomEvent("tour:open-booking"))}
    >
      {inquiry ? "Check availability" : "Plan this tour"}
      <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
