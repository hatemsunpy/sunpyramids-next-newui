"use client";

import { useState, type ReactNode } from "react";
import { TourAddOns } from "@/components/tour/TourAddOns";
import { TourBookingCard } from "@/components/tour/TourBookingCard";
import { TourViewSignal } from "@/components/tour/TourViewSignal";
import type { Locale, Tour } from "@/types/api";

export function TourPageLayout({
  tour,
  locale,
  leftContent,
}: {
  tour: Tour | null;
  locale: Locale;
  leftContent: ReactNode;
}) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  return (
    <div className="tour-page-grid">
      <TourViewSignal tour={tour} />
      <div className="tour-left-panel">
        {leftContent}
        {tour?.options?.length ? <TourAddOns options={tour.options} selected={selectedOptions} onChange={setSelectedOptions} /> : null}
      </div>
      <TourBookingCard tour={tour} locale={locale} selectedOptions={selectedOptions} onSelectedOptionsChange={setSelectedOptions} />
    </div>
  );
}
