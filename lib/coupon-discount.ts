type CouponLike = {
  value?: unknown;
  discount_type?: unknown;
};

export type CouponDiscountType = "fixed" | "percentage" | null;

export function couponTypeFrom(coupon: CouponLike | null | undefined): CouponDiscountType {
  if (coupon?.discount_type === "fixed") return "fixed";
  if (coupon?.discount_type === "percentage") return "percentage";
  return null;
}

export function couponValueFrom(coupon: CouponLike | null | undefined): number {
  const value = Number(coupon?.value);
  return Number.isFinite(value) ? value : 0;
}

export function couponIdFrom(value: unknown): number | string | null {
  const source = value as {
    id?: number | string;
    coupon_id?: number | string;
    coupon?: { id?: number | string };
  } | null;
  return source?.id || source?.coupon_id || source?.coupon?.id || null;
}

export function couponDiscount(coupon: CouponLike | null | undefined, amount: number): number {
  const value = couponValueFrom(coupon);
  const base = Number(amount);
  if (!Number.isFinite(base) || base <= 0 || value <= 0) return 0;
  if (coupon?.discount_type === "fixed") return value;
  if (coupon?.discount_type === "percentage") return base * (value / 100);
  if (coupon?.discount_type === undefined || coupon?.discount_type === null) {
    return base * (value / 100);
  }
  return 0;
}
