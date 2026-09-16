import { homeCopy } from "@/lib/home-copy";
import type { Locale } from "@/types/api";

const trustItems = [
  ["whyTravelHappyTitle", "whyTravelHappyStat", "whyTravelHappyDescription"],
  ["whyTravelExperienceTitle", "whyTravelExperienceStat", "whyTravelExperienceDescription"],
  ["whyTravelDestinationsTitle", "whyTravelDestinationsStat", "whyTravelDestinationsDescription"],
  ["whyTravelTripadvisorTitle", "whyTravelTripadvisorStat", "whyTravelTripadvisorDescription"],
] as const;

export function WhyTravelWithSunPyramids({ locale = "en" }: { locale?: Locale }) {
  const copy = homeCopy(locale);
  const headingId = "why-travel-with-sun-pyramids";

  return (
    <section className="home-why-travel" aria-labelledby={headingId}>
      <div className="container-shell home-why-travel__layout">
        <h2 id={headingId} className="home-why-travel__heading">
          <span>
            {copy.whyTravelHeadingBefore}
            <em>{copy.whyTravelHeadingEmphasis}</em>
            {copy.whyTravelHeadingAfter}
          </span>
          {" "}
          <span>{copy.whyTravelHeadingBrand}</span>
        </h2>

        <div className="home-why-travel__items">
          {trustItems.map(([titleKey, statKey, descriptionKey]) => (
            <article className="home-why-travel__item" key={titleKey}>
              <h3>{copy[titleKey]}</h3>
              <span className="home-why-travel__underline" aria-hidden="true" />
              <strong>{copy[statKey]}</strong>
              <p>{copy[descriptionKey]}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
