import { ArrowRight, ArrowUpRight, Banknote, CloudRain, Flower2, Globe2, Languages, Leaf, MapPin, Route, Sun } from "lucide-react";
import Link from "next/link";
import Image from "@/components/ResponsiveImage";
import { destinationDirectoryCopy } from "@/components/destination-directory-copy";
import { jordanTravelCopy } from "@/components/jordan-travel-copy";
import { journeyExcerpt } from "@/components/multi-country/excerpt";
import { multiCountryChildPath } from "@/components/multi-country/routes";
import { countryDestinationPreviewPhoto } from "@/lib/destination-links";
import { withLocale } from "@/lib/locales";
import { uiCopy } from "@/lib/ui-copy";
import type { ApiPage, Locale } from "@/types/api";

const visitJordan = {
  guide: "https://international.visitjordan.com/where-to-go/",
  information: "https://international.visitjordan.com/page/16/justthefacts.aspx",
  seasons: "https://international.visitjordan.com/blog/external/7625/best-time-to-go-to-petra-jordan/",
  entry: "https://moi.gov.jo/EN/Pages/E_Applications_for_Visa_and_Residence_Permits",
};

const seasons = [
  { icon: Flower2, from: 2, to: 4 },
  { icon: Sun, from: 5, to: 7 },
  { icon: Leaf, from: 8, to: 10 },
  { icon: CloudRain, from: 11, to: 1 },
] as const;

export function JordanTravelFacts({ locale }: { locale: Locale }) {
  const copy = jordanTravelCopy[locale];
  const currency = new Intl.DisplayNames(locale, { type: "currency" }).of("JOD");
  const language = new Intl.DisplayNames(locale, { type: "language" }).of("ar");
  const facts = [
    { label: copy.facts[0], value: copy.amman, icon: MapPin },
    { label: copy.facts[1], value: `${currency} (JOD)`, icon: Banknote },
    { label: copy.facts[2], value: language, icon: Languages },
  ];

  return (
    <div className="jordan-facts">
      <dl className="jordan-shell" aria-label={copy.essentials}>
        {facts.map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <Icon size={21} aria-hidden="true" />
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function JordanTravelGuide({ locale, places, reviewsUrl }: {
  locale: Locale;
  places: ApiPage[] | null;
  reviewsUrl?: string;
}) {
  const labels = jordanTravelCopy[locale];
  const copy = uiCopy(locale);
  const shared = destinationDirectoryCopy[locale];
  const months = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
  const month = (value: number) => months.format(new Date(Date.UTC(2024, value, 1)));
  const availablePlaces = places?.filter((place) => place.enabled !== false && Boolean(place.title || place.name)) ?? [];

  return (
    <div className="jordan-shell jordan-travel-guide">
      <section id="jordan-seasons" className="jordan-detail-section" tabIndex={-1} aria-labelledby="jordan-seasons-title">
        <div className="jordan-detail-heading">
          <h2 id="jordan-seasons-title">{labels.seasons}</h2>
          <a className="jordan-text-link" href={visitJordan.seasons}>{labels.guide}<ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
        <ul className="jordan-season-grid" role="list">
          {seasons.map(({ icon: Icon, from, to }, index) => {
            const [title, description] = labels.seasonDetails[index];
            return (
              <li key={from}>
                <Icon size={25} aria-hidden="true" />
                <span>{month(from)} – {month(to)}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="jordan-places" className="jordan-detail-section" tabIndex={-1} aria-labelledby="jordan-places-title">
        <div className="jordan-detail-heading">
          <h2 id="jordan-places-title">{labels.places}</h2>
          <a className="jordan-text-link" href={visitJordan.guide}>{labels.guide}<ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
        {availablePlaces.length > 0 && (
          <ul className="jordan-place-grid" role="list">
            {availablePlaces.map((place) => {
              const title = place.title || place.name;
              const editorialPhoto = place.slug?.toLowerCase().startsWith("petra") ? countryDestinationPreviewPhoto("jordan") : undefined;
              const photo = place.featured_image || place.banner || place.gallery?.[0] || editorialPhoto;
              const paragraphs = (place.short_description || place.description || "")
                .split(/<\/p\s*>/i)
                .map(journeyExcerpt)
                .filter((paragraph) => paragraph && paragraph !== title);
              return (
                <li key={place.id ?? place.slug ?? title} className="jordan-place">
                  {photo && <div className="jordan-place-photo"><Image src={photo} alt="" fill sizes="(max-width: 600px) 94vw, 32vw" /></div>}
                  <div className="jordan-place-copy">
                    <h3>{title}</h3>
                    {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="jordan-detail-section jordan-essentials" tabIndex={-1} id="jordan-essentials" aria-labelledby="jordan-essentials-title">
        <h2 id="jordan-essentials-title">{labels.essentials}</h2>
        <ul role="list">
          <li><a href={visitJordan.information}><Globe2 size={21} aria-hidden="true" />{labels.information}<ArrowUpRight size={16} aria-hidden="true" /></a></li>
          <li><a href={visitJordan.entry}><MapPin size={21} aria-hidden="true" />{labels.entry}<ArrowUpRight size={16} aria-hidden="true" /></a></li>
        </ul>
      </section>

      <section className="jordan-detail-section" aria-labelledby="jordan-trust-title">
        <div className="jordan-detail-heading"><h2 id="jordan-trust-title">{copy.whyChooseUs}</h2></div>
        <div className="jordan-trust-grid">
          <article>
            <h3>{shared.experienceTitle}</h3>
            <p>{shared.whyIntro}</p>
            <Link href={withLocale("/about-us", locale)} className="jordan-text-link">{copy.about}<ArrowRight size={16} aria-hidden="true" /></Link>
          </article>
          <article>
            <h3>{shared.combineLabel}</h3>
            <p>{shared.combined}</p>
            <Link href={withLocale(multiCountryChildPath("egypt-and-jordan-tour-packages"), locale)} className="jordan-text-link">
              {shared.combineAction}<ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
          {reviewsUrl && (
            <article>
              <h3>{shared.reviewsTitle}</h3>
              <p>{shared.reviewsDescription}</p>
              <a href={reviewsUrl} className="jordan-text-link" target="_blank" rel="noopener noreferrer">
                {shared.reviewsAction}<ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </article>
          )}
        </div>
      </section>

      <section className="jordan-detail-section jordan-questions" aria-labelledby="jordan-questions-title">
        <div>
          <h2 id="jordan-questions-title">{labels.questions}</h2>
          <p>{shared.helpDescription}</p>
        </div>
        <a href="#jordan-plan" className="jordan-primary">{labels.quote}<Route size={18} aria-hidden="true" /></a>
      </section>
    </div>
  );
}
