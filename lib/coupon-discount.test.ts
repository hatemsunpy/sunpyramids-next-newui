import { describe, expect, it } from "vitest";
import { couponDiscount, couponIdFrom, couponTypeFrom, couponValueFrom } from "@/lib/coupon-discount";

describe("couponTypeFrom", () => {
  it("recognizes the verified backend discount_type values ('fixed' / 'percentage')", () => {
    expect(couponTypeFrom({ discount_type: "fixed" })).toBe("fixed");
    expect(couponTypeFrom({ discount_type: "percentage" })).toBe("percentage");
  });

  it("returns null for missing or unknown discount types instead of guessing", () => {
    expect(couponTypeFrom({})).toBeNull();
    expect(couponTypeFrom({ discount_type: "mystery" })).toBeNull();
    expect(couponTypeFrom(null)).toBeNull();
  });
});

describe("couponValueFrom", () => {
  it("reads numeric and string values sent by the API model", () => {
    expect(couponValueFrom({ value: 7 })).toBe(7);
    expect(couponValueFrom({ value: "7.5" })).toBe(7.5);
  });

  it("treats missing values as zero", () => {
    expect(couponValueFrom({})).toBe(0);
    expect(couponValueFrom(null)).toBe(0);
  });
});

describe("couponIdFrom", () => {
  it("keeps the same coupon id extraction contract as the original CartFlow helper", () => {
    expect(couponIdFrom({ id: 55 })).toBe(55);
    expect(couponIdFrom({ coupon_id: 55 })).toBe(55);
    expect(couponIdFrom({ coupon: { id: 55 } })).toBe(55);
    expect(couponIdFrom({ data: 1 })).toBeNull();
    expect(couponIdFrom(null)).toBeNull();
  });
});

describe("couponDiscount", () => {
  const amount = 200;

  it("mirrors the backend percentage formula (amount - value/100*amount)", () => {
    expect(couponDiscount({ value: 7, discount_type: "percentage" }, amount)).toBeCloseTo(14);
    expect(couponDiscount({ value: 50, discount_type: "percentage" }, amount)).toBe(100);
  });

  it("mirrors the backend fixed formula (amount - value)", () => {
    expect(couponDiscount({ value: 25, discount_type: "fixed" }, amount)).toBe(25);
  });

  it("keeps legacy percentage behavior when the field is missing (original Nuxt/Next parity)", () => {
    expect(couponDiscount({ value: 7 }, amount)).toBeCloseTo(14);
  });

  it("never estimates a discount for an unknown explicit discount_type", () => {
    expect(couponDiscount({ value: 7, discount_type: "mystery" }, amount)).toBe(0);
  });

  it("handles zero/invalid inputs without producing NaN", () => {
    expect(couponDiscount({ value: 7, discount_type: "percentage" }, 0)).toBe(0);
    expect(couponDiscount(null, 100)).toBe(0);
    expect(couponDiscount({ value: 0, discount_type: "percentage" }, 100)).toBe(0);
  });
});
