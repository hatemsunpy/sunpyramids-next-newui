import type { Locale, Tour } from "@/types/api";
import { pickHomeLabels, pickUiLabels } from "@/lib/home-client-labels";
import { HomePopularToursClient } from "@/components/HomePopularToursClient";

const HOME_POPULAR_TOURS_LABEL_KEYS = [
  "popularTitle",
  "recommended",
  "oneDayFilter",
  "multiDaysFilter",
  "nileCruisesFilter",
  "shoreExcursionsFilter",
] as const;

const HOME_POPULAR_TOURS_UI_LABEL_KEYS = ["specialOffer", "addToWishlist", "removeFromWishlist"] as const;

export function HomePopularTours({
  initialTours,
  locale = "en",
}: {
  initialTours: Tour[];
  locale?: Locale;
}) {
  const labels = pickHomeLabels(locale, HOME_POPULAR_TOURS_LABEL_KEYS);
  const uiLabels = pickUiLabels(locale, HOME_POPULAR_TOURS_UI_LABEL_KEYS);
  return <HomePopularToursClient initialTours={initialTours} locale={locale} labels={labels} uiLabels={uiLabels} />;
}
