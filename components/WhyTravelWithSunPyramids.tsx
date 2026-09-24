import { homeCopy } from "@/lib/home-copy";
import type { Locale } from "@/types/api";
import { SwipeCarousel } from "@/components/SwipeCarousel";
import { SectionEyebrow } from "@/components/SectionHeading";
import { homeSectionLabels } from "@/lib/home-section-labels";

const trustItems = [
  ["whyTravelHappyTitle", "whyTravelHappyStat", "whyTravelHappyDescription"],
  ["whyTravelExperienceTitle", "whyTravelExperienceStat", "whyTravelExperienceDescription"],
  ["whyTravelDestinationsTitle", "whyTravelDestinationsStat", "whyTravelDestinationsDescription"],
  ["whyTravelTripadvisorTitle", "whyTravelTripadvisorStat", "whyTravelTripadvisorDescription"],
] as const;

export function WhyTravelWithSunPyramids({ locale = "en" }: { locale?: Locale }) {
  const copy = homeCopy(locale);
  const labels = homeSectionLabels(locale);
  const headingId = "why-travel-with-sun-pyramids";

  return (
    <section className="home-why-travel" aria-labelledby={headingId}>
      <div className="container-shell home-why-travel__layout">
        <div className="home-why-travel__intro">
          <SectionEyebrow>{labels.why}</SectionEyebrow>
          <h2 id={headingId} className="home-why-travel__heading">
            <span>
              {copy.whyTravelHeadingBefore}
              <em>{copy.whyTravelHeadingEmphasis}</em>
              {copy.whyTravelHeadingAfter}
            </span>
            {" "}
            <span>{copy.whyTravelHeadingBrand}</span>
          </h2>
        </div>

        <SwipeCarousel className="home-why-travel__items" ariaLabel={copy.whyTravelHeadingBrand}>
          {trustItems.map(([titleKey, statKey, descriptionKey]) => (
            <article className="home-why-travel__item" key={titleKey}>
              <h3>{copy[titleKey]}</h3>
              <span className="home-why-travel__underline" aria-hidden="true" />
              <strong>{copy[statKey]}</strong>
              <p>{copy[descriptionKey]}</p>
            </article>
          ))}
        </SwipeCarousel>
      </div>
    </section>
  );
}
