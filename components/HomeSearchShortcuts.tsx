import type { ReactNode } from "react";
import type { ApiPage, Locale } from "@/types/api";
import { pickHomeLabels, pickVoiceLabels } from "@/lib/home-client-labels";
import { HomeSearchShortcutsClient, type SearchMode } from "@/components/HomeSearchShortcutsClient";

const emptyRootCategories: ApiPage[] = [];

const HOME_SEARCH_SHORTCUTS_LABEL_KEYS = [
  "makeYourTrip",
  "findTripShort",
  "rentCarShort",
  "whenTravelling",
  "exactTime",
  "approximateTime",
  "notSureYet",
  "from",
  "selectStartDate",
  "to",
  "selectEndDate",
  "selectMonth",
  "selectExpectedMonth",
  "manyDays",
  "makeTripShort",
  "where",
  "choosePlace",
  "howLong",
  "chooseDuration",
  "search",
  "tripType",
  "oneWay",
  "roundTrip",
  "carHolder",
  "choosePickup",
  "dropoff",
  "chooseDropoff",
  "pickupDate",
  "choosePickupDate",
  "returnDate",
  "chooseReturnDate",
  "sendRequest",
] as const;

export function HomeSearchShortcuts({ locale = "en", destinations, rootCategories = emptyRootCategories, modeOnly, makeButtonIcon }: { locale?: Locale; destinations: ApiPage[]; rootCategories?: ApiPage[]; modeOnly?: SearchMode; makeButtonIcon?: ReactNode }) {
  const labels = pickHomeLabels(locale, HOME_SEARCH_SHORTCUTS_LABEL_KEYS);
  const voiceLabels = pickVoiceLabels(locale);
  return (
    <HomeSearchShortcutsClient
      locale={locale}
      destinations={destinations}
      rootCategories={rootCategories}
      modeOnly={modeOnly}
      makeButtonIcon={makeButtonIcon}
      labels={labels}
      voiceLabels={voiceLabels}
    />
  );
}
