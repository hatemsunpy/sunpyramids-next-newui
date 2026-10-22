export type OfferCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function parseOfferEndDate(value?: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function computeOfferCountdown(
  endMs: number,
  nowMs: number,
): OfferCountdownParts | null {
  if (!Number.isFinite(endMs) || endMs <= nowMs) return null;
  const secondsTotal = Math.floor((endMs - nowMs) / 1000);
  return {
    days: Math.floor(secondsTotal / 86400),
    hours: Math.floor(secondsTotal / 3600) % 24,
    minutes: Math.floor(secondsTotal / 60) % 60,
    seconds: secondsTotal % 60,
  };
}
