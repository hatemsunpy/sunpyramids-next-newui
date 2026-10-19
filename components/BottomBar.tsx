import type { Locale } from "@/types/api";
import { pickHomeLabels, pickUiLabels } from "@/lib/home-client-labels";
import { BottomBarClient } from "@/components/BottomBarClient";

const BOTTOM_BAR_LABEL_KEYS = ["makeTripShort"] as const;

const BOTTOM_BAR_UI_LABEL_KEYS = ["offers", "trips", "home"] as const;

export function BottomBar({ locale = "en" }: { locale?: Locale }) {
  const labels = pickHomeLabels(locale, BOTTOM_BAR_LABEL_KEYS);
  const uiLabels = pickUiLabels(locale, BOTTOM_BAR_UI_LABEL_KEYS);
  return <BottomBarClient locale={locale} labels={labels} uiLabels={uiLabels} />;
}
