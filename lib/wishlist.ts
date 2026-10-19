import { apiPut, getCookie } from "@/lib/client-api";
import type { Locale } from "@/types/api";

type ApiResponse = { status?: boolean; message?: string; data?: unknown };

export async function toggleWishlist(tourId: number | string, locale: Locale = "en") {
  if (!getCookie("sunpyramids-token")) {
    throw new Error("Please login to like the tour");
  }
  return apiPut<ApiResponse>(`wishlist/${tourId}/toggle`, locale, true);
}
