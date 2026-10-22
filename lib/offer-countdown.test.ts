import { describe, expect, it } from "vitest";
import { computeOfferCountdown, parseOfferEndDate } from "@/lib/offer-countdown";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("parseOfferEndDate", () => {
  it("returns null for missing, empty, and malformed strings", () => {
    expect(parseOfferEndDate(undefined)).toBeNull();
    expect(parseOfferEndDate(null)).toBeNull();
    expect(parseOfferEndDate("")).toBeNull();
    expect(parseOfferEndDate("soon")).toBeNull();
    expect(parseOfferEndDate("2031-00-11T00:00:00Z")).toBeNull();
  });

  it("parses an explicit ISO offset to an absolute instant without altering it", () => {
    expect(parseOfferEndDate("2031-03-12T15:00:00+02:00")).toBe(
      new Date("2031-03-12T13:00:00Z").getTime(),
    );
    expect(parseOfferEndDate("2031-03-12T16:00:00-05:00")).toBe(
      new Date("2031-03-12T21:00:00Z").getTime(),
    );
  });
});

describe("computeOfferCountdown", () => {
  const now = Date.parse("2030-03-12T12:00:00Z");

  it("breaks a multi-day remainder into days, hours, minutes, and seconds", () => {
    const end = now + 2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND;
    expect(computeOfferCountdown(end, now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });
  });

  it("keeps the hours column below 24 instead of inflating days", () => {
    expect(computeOfferCountdown(now + DAY, now)).toEqual({
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it("truncates partial seconds", () => {
    expect(computeOfferCountdown(now + 90 * SECOND + 999, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 30,
    });
  });

  it("returns null at or past the expiry without borrowing absolute values", () => {
    expect(computeOfferCountdown(now, now)).toBeNull();
    expect(computeOfferCountdown(now - SECOND, now)).toBeNull();
    expect(computeOfferCountdown(now - DAY, now)).toBeNull();
    expect(computeOfferCountdown(Number.NaN, now)).toBeNull();
  });
});
