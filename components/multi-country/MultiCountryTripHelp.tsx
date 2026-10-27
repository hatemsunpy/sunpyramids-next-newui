import { Activity } from "react";
import { SectionEyebrow } from "@/components/SectionHeading";
import { HomeNeedHelpForm } from "@/components/HomeNeedHelpForm";
import { homeCopy } from "@/lib/home-copy";
import { homeSectionLabels } from "@/lib/home-section-labels";
import type { Locale } from "@/types/api";
import "@/styles/multi-country.scss";

export function MultiCountryTripHelp({ locale }: { locale: Locale }) {
  const copy = homeCopy(locale);
  const labels = homeSectionLabels(locale);
  return (
    <section className="home-help-section-v2 container-shell mc-help-section mc-shell home-page--redesign">
      <div className="home-help-panel-v2">
        <SectionEyebrow>{labels.help}</SectionEyebrow>
        <h2>{copy.needHelp}</h2>
        <Activity mode="visible">
          <HomeNeedHelpForm locale={locale} />
        </Activity>
      </div>
    </section>
  );
}
