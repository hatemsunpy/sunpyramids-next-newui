"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { parseOfferEndDate } from "@/lib/offer-countdown";
import { isOfferDateActive } from "@/lib/tour-offer";

export function useOfferDateActive(endDate?: string) {
  const deadline = parseOfferEndDate(endDate);
  const subscribe = useCallback((onChange: () => void) => {
    if (deadline === null) return () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      onChange();
      const remaining = deadline - Date.now();
      if (remaining > 0) timer = setTimeout(check, Math.min(remaining, 2_147_483_647));
    };
    check();
    return () => clearTimeout(timer);
  }, [deadline]);
  const getSnapshot = useCallback(() => isOfferDateActive(endDate, Date.now()), [endDate]);
  // Dated discounts wait for the browser clock; SSR and hydration show the base price consistently.
  const getServerSnapshot = useCallback(() => !endDate, [endDate]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function OfferValidity({ endDate, children, fallback = null }: {
  endDate?: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useOfferDateActive(endDate) ? children : fallback;
}
