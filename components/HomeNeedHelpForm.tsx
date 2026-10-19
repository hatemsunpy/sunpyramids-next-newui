import type { Locale } from "@/types/api";
import { pickHomeLabels, pickUiLabels } from "@/lib/home-client-labels";
import { HomeNeedHelpFormClient } from "@/components/HomeNeedHelpFormClient";

const HOME_NEED_HELP_FORM_LABEL_KEYS = ["fullName", "nationality", "phone", "contactNow"] as const;

const HOME_NEED_HELP_FORM_UI_LABEL_KEYS = [
  "sending",
  "phonePlaceholder",
  "selectCallingCode",
  "callingCode",
  "searchCountryCode",
  "noCountriesFound",
  "loadingCountryCodes",
  "countryCodesUnavailable",
  "phoneWithoutCountryCode",
  "enterPhoneDigits",
  "enterValidPhone",
  "countryCallingCodes",
] as const;

export function HomeNeedHelpForm({ locale = "en" }: { locale?: Locale }) {
  const labels = pickHomeLabels(locale, HOME_NEED_HELP_FORM_LABEL_KEYS);
  const uiLabels = pickUiLabels(locale, HOME_NEED_HELP_FORM_UI_LABEL_KEYS);
  return <HomeNeedHelpFormClient locale={locale} labels={labels} uiLabels={uiLabels} />;
}
