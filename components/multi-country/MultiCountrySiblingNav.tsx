import Link from "next/link";
import ResponsiveImage from "@/components/ResponsiveImage";
import { ArrowUpRight, Check } from "lucide-react";
import type { EgyptToursMenuChild } from "@/lib/egypt-tours-menu";
import { withLocale } from "@/lib/locales";
import type { Locale } from "@/types/api";
import { multiCountryCopy } from "./copy";
import { subcategoryCopy } from "./subcategory-copy";
import { multiCountryChildPath } from "./routes";
import "@/styles/multi-country.scss";

export function MultiCountrySiblingNav({
  journeys,
  currentSlug,
  locale,
}: {
  journeys: EgyptToursMenuChild[];
  currentSlug: string;
  locale: Locale;
}) {
  if (journeys.length === 0) return null;
  const labels = multiCountryCopy(locale);
  const copy = subcategoryCopy(locale);
  return (
    <nav className="mc-sub-siblings mc-shell" aria-label={labels.otherCombinations}>
      <div className="mc-section-heading"><h2 className="mc-sub-siblings-title">{copy.alternatives}</h2><p>{copy.alternativesHint}</p></div>
      <ul className="mc-sub-siblings-list">
        {journeys.map((journey) => {
          const selected = journey.slug === currentSlug;
          return (
            <li key={journey.slug}>
              <Link
                href={withLocale(multiCountryChildPath(journey.slug), locale)}
                aria-current={selected ? "page" : undefined}
                className="mc-sub-sibling-link"
              >
                {journey.featured_image && <div className="mc-sibling-photo"><ResponsiveImage src={journey.featured_image} alt="" fill sizes="(max-width: 600px) 50vw, 20vw" /></div>}
                <span className="mc-sibling-name">{journey.label}</span>
                {selected
                  ? <Check size={15} aria-hidden="true" />
                  : <ArrowUpRight size={15} aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
