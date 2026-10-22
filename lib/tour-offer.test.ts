import { describe, expect, it } from "vitest";
import { activeOfferPercent, isOfferDateActive } from "@/lib/tour-offer";

const now = Date.parse("2030-06-01T12:00:00Z");
const SECOND = 1000;
const DAY = 24 * 60 * 60 * SECOND;

describe("isOfferDateActive", () => {
  it("keeps absent or empty expiry active (undated promotional behavior)", () => {
    expect(isOfferDateActive(undefined, now)).toBe(true);
    expect(isOfferDateActive(null, now)).toBe(true);
    expect(isOfferDateActive("", now)).toBe(true);
  });

  it("treats a present invalid date as inactive", () => {
    expect(isOfferDateActive("soon", now)).toBe(false);
    expect(isOfferDateActive("2031-00-11T00:00:00Z", now)).toBe(false);
  });

  it.each([
    ["future deadline is active", "2031-01-01T00:00:00Z", true],
    ["exact boundary is inactive", new Date(now).toISOString(), false],
    ["past deadline is inactive", "2029-01-01T00:00:00Z", false],
    [
      "absolute ISO offset is compared as an instant",
      "2030-06-01T15:00:00+02:00",
      true,
    ],
  ])("%s", (_label, endDate, expected) => {
    expect(isOfferDateActive(endDate, now)).toBe(expected);
  });

  it("honors fractional-second offsets around the deadline", () => {
    const end = "2030-06-02T12:00:00Z";
    expect(isOfferDateActive(end, now + DAY - SECOND)).toBe(true);
    expect(isOfferDateActive(end, now + DAY)).toBe(false);
    expect(isOfferDateActive(end, now + DAY + SECOND)).toBe(false);
  });
});

describe("activeOfferPercent", () => {
  it("returns 0 for missing tour or missing offer", () => {
    expect(activeOfferPercent(null, now)).toBe(0);
    expect(activeOfferPercent(undefined, now)).toBe(0);
    expect(activeOfferPercent({}, now)).toBe(0);
  });

  it.each([
    ["numeric percent", 15, 15],
    ["decimal numeric string percent", "12.5", 12.5],
  ])("accepts %s", (_label, offer, expected) => {
    expect(activeOfferPercent({ offer }, now)).toBe(expected);
  });

  it.each([
    ["zero", 0],
    ["negative", -10],
    ["exactly 100", 100],
    ["above 100", 150],
    ["non-numeric string", "abc"],
    ["hexadecimal string", "0x10"],
    ["empty string", ""],
    ["not-a-number", Number.NaN],
  ])("rejects %s offer value", (_label, offer) => {
    expect(activeOfferPercent({ offer }, now)).toBe(0);
  });

  it("returns 0 once a dated offer expires", () => {
    const tour = { offer: 20, offer_end_date: "2029-01-01T00:00:00Z" };
    expect(activeOfferPercent(tour, now)).toBe(0);
  });

  it("returns the original API percent while a dated offer is active", () => {
    const tour = { offer: "25", offer_end_date: "2031-01-01T00:00:00Z" };
    expect(activeOfferPercent(tour, now)).toBe(25);
  });

  it("preserves undated promotional behavior regardless of now", () => {
    expect(activeOfferPercent({ offer: 10 }, now)).toBe(10);
    expect(activeOfferPercent({ offer: 10 }, now + DAY)).toBe(10);
  });
});
