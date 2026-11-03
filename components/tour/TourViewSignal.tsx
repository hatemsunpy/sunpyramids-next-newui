"use client";

import { useEffect, useRef } from "react";
import { emitViewItem } from "@/lib/analytics/datalayer";
import type { Tour } from "@/types/api";

// view_item fires once per TOUR, compared by id: selecting add-ons/travelers or
// a currency rerender with the same tour id stays silent, while a swap to a
// different tour on the same mounted layout (A -> B -> A included) signals
// again. Per contract view_item carries no monetary fields - page price depends
// on the visitor's own selection; cart events own the agreed money.
export function TourViewSignal({ tour }: { tour?: Tour | null }) {
  const emittedTourIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tour) return;
    const id = tour.id;
    const title = typeof tour?.title === "string" ? tour.title.trim() : "";
    if (id == null || !title) return;
    const tourKey = String(id);
    if (emittedTourIdRef.current === tourKey) return;
    emittedTourIdRef.current = tourKey;
    emitViewItem(
      {
        itemId: id,
        itemName: title,
        itemCategory: tour.category?.name || tour.category?.title,
      },
      null,
    );
  }, [tour]);

  return null;
}