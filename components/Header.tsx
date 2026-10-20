import type { Locale } from "@/types/api";
import type { EgyptToursMenuChild } from "@/lib/egypt-tours-menu";
import { pickHomeLabels, pickUiLabels, pickVoiceLabels } from "@/lib/home-client-labels";
import { HeaderClient, type HeaderTourCategory } from "@/components/HeaderClient";

const HEADER_LABEL_KEYS = ["promoTitle", "promoButton"] as const;

const HEADER_UI_LABEL_KEYS = [
  "home",
  "egyptTours",
  "oneDay",
  "multiDays",
  "nileCruises",
  "shoreExcursions",
  "rentCar",
  "about",
  "contact",
  "blogs",
  "events",
  "search",
  "cart",
  "signIn",
  "specialOffer",
  "makeTrip",
] as const;

export function Header({
  locale = "en",
  siteTitle,
  categories = [],
  oneDayChildren = [],
  multiDaysChildren = [],
  nileCruisesChildren = [],
}: {
  locale?: Locale;
  siteTitle?: string | null;
  categories?: HeaderTourCategory[];
  oneDayChildren?: EgyptToursMenuChild[];
  multiDaysChildren?: EgyptToursMenuChild[];
  nileCruisesChildren?: EgyptToursMenuChild[];
}) {
  const labels = pickHomeLabels(locale, HEADER_LABEL_KEYS);
  const uiLabels = pickUiLabels(locale, HEADER_UI_LABEL_KEYS);
  const voiceLabels = pickVoiceLabels(locale);
  return (
    <HeaderClient
      locale={locale}
      siteTitle={siteTitle}
      categories={categories}
      oneDayChildren={oneDayChildren}
      multiDaysChildren={multiDaysChildren}
      nileCruisesChildren={nileCruisesChildren}
      labels={labels}
      uiLabels={uiLabels}
      voiceLabels={voiceLabels}
    />
  );
}
