import { parseOfferEndDate } from "@/lib/offer-countdown";

/**
 * Expiry semantics for a promotional offer:
 * - absent/empty expiry keeps the existing undated promotional behavior
 *   (an undated offer is treated as still active — no evidence it expired);
 * - a present date that cannot be parsed is inactive;
 * - a present deadline at or before `nowMs` is inactive (matches
 *   computeOfferCountdown, which stops exactly at the boundary);
 * - a strictly future deadline is active.
 */
export function isOfferDateActive(
  endDate: string | null | undefined,
  nowMs: number,
): boolean {
  if (!endDate) return true;
  const endMs = parseOfferEndDate(endDate);
  if (endMs === null) return false;
  return endMs > nowMs;
}

export type OfferTour = {
  offer?: number | string;
  offer_end_date?: string;
};

function parseOfferPercent(value: number | string | undefined): number {
  const percent =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+(\.\d+)?$/.test(value)
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return 0;
  return percent;
}

/**
 * Returns the active offer discount percent (0 when no offer applies).
 * The percent must be a finite number or decimal string strictly between
 * 0 and 100. When an expiry date is present, the percent only applies
 * while `isOfferDateActive` is true; absent/empty expiry preserves the
 * existing undated promotional behavior.
 */
export function activeOfferPercent(
  tour: OfferTour | null | undefined,
  nowMs: number,
): number {
  if (!tour) return 0;
  const percent = parseOfferPercent(tour.offer);
  if (percent === 0) return 0;
  return isOfferDateActive(tour.offer_end_date, nowMs) ? percent : 0;
}
