"use client";

export function TourBookingTrigger({ inquiry = false }: { inquiry?: boolean }) {
  return (
    <button
      type="button"
      className="tour-hero-booking-trigger"
      onClick={() => window.dispatchEvent(new CustomEvent("tour:open-booking"))}
    >
      {inquiry ? "Check availability" : "Plan this tour"}
      <span aria-hidden="true">→</span>
    </button>
  );
}
