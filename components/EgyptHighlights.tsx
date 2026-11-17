import { ArrowUpRight, CarFront, Compass, CreditCard, Headphones, MapPinned } from "lucide-react";
import Link from "next/link";
import { destinationDirectoryCopy } from "@/components/destination-directory-copy";
import { egyptHighlightsCopy } from "@/components/egypt-highlights-copy";
import { multiCountryParentPath } from "@/components/multi-country/routes";
import Image from "@/components/ResponsiveImage";
import { withLocale } from "@/lib/locales";
import { uiCopy } from "@/lib/ui-copy";
import directory from "@/styles/destinations-directory.module.scss";
import styles from "@/styles/egypt-highlights.module.scss";
import type { ApiPage, Locale } from "@/types/api";

const dayToursPath = "/egypt-tours/one-day-tours";
const photoSizes = "(max-width: 560px) 94vw, (max-width: 940px) 46vw, 33vw";
const benefitIcons = [MapPinned, CarFront, Headphones, Compass] as const;

export function EgyptMustSee({ locale, destinations }: { locale: Locale; destinations: ApiPage[] }) {
  const copy = egyptHighlightsCopy[locale];
  const hurghada = destinations.find((destination) => destination.slug === "hurghada" && destination.enabled !== false);
  const redSeaPhoto = hurghada?.featured_image || hurghada?.banner || hurghada?.image || hurghada?.gallery?.[0];
  const places = [
    ["/egypt-tours/multi-days-tours/pyramids-tours", "/images/giza.webp"],
    [`${dayToursPath}/cairo`, "/images/guest-photos/01_old_cairo_family_1080x1350.webp"],
    ["/tour/giza-pyramids-the-grand-egyptian-museum", "/images/guest-photos/09_gem_indoor_group_1080x1350.webp"],
    ["/egypt-tours/nile-cruises", "/images/nile-cruise-preview.webp"],
    [`${dayToursPath}/aswan`, "/images/guest-photos/03_abu_simbel_1080x1350.webp"],
    [`${dayToursPath}/hurghada`, redSeaPhoto],
  ] as const;

  return (
    <section id="egypt-must-see" aria-labelledby="egypt-must-see-heading" className={`${styles.section} ${styles.mustSee}`}>
      <div className={directory.wrap}>
        <header className={`${styles.heading} ${styles.headingWithLink}`}>
          <h2 id="egypt-must-see-heading" className={directory.sectionTitle}>{copy.mustSee}</h2>
          <Link href={withLocale("/egypt-travel-guide", locale)} className={styles.guideLink} prefetch={false}>
            {copy.guide}<ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </header>
        <ul className={styles.places} role="list">
          {places.map(([href, photo], index) => {
            const [title, description] = copy.places[index];
            return (
              <li key={href}>
                <Link href={withLocale(href, locale)} className={styles.placeCard} prefetch={false}>
                  {photo && <Image src={photo} alt="" fill sizes={photoSizes} className={styles.photo} />}
                  <h3>{title}</h3>
                  <p>{description}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function EgyptWhyTravel({ locale }: { locale: Locale }) {
  const copy = egyptHighlightsCopy[locale];
  const directoryCopy = destinationDirectoryCopy[locale];
  const ui = uiCopy(locale);

  return (
    <section id="egypt-why-travel" aria-labelledby="egypt-why-travel-heading" className={`${directory.wrap} ${styles.section}`}>
      <header className={styles.heading}>
        <h2 id="egypt-why-travel-heading" className={directory.sectionTitle}>{copy.whyTravel}</h2>
        <p>{directoryCopy.whyIntro}</p>
      </header>
      <div className={styles.mosaic}>
        <article className={styles.planning}>
          <Image src="/images/guest-photos/05_giza_camel_1080x1350.webp" alt="" fill sizes={photoSizes} className={styles.photo} />
          <div className={styles.captionPanel}>
            <h3>{directoryCopy.tailoredTitle}</h3>
            <p>{directoryCopy.custom}</p>
            <Link href={withLocale("/make-your-trip", locale)} className={styles.planAction} prefetch={false}>
              {ui.planYourTrip}<ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </article>
        <article className={styles.experience}>
          <Image src="/images/Cairo_Egypt_Unsplash.webp" alt="" fill sizes="(max-width: 940px) 94vw, 66vw" className={styles.photo} />
          <span className={styles.since}>{directoryCopy.since}</span>
          <strong className={styles.experienceCount} aria-hidden="true">50+</strong>
          <h3>{directoryCopy.experienceTitle}</h3>
          <p>{directoryCopy.experienceDescription}</p>
        </article>
        <article className={styles.booking}>
          <CreditCard size={24} aria-hidden="true" />
          <h3>{copy.booking[0]}</h3>
          <p>{copy.booking[1]}</p>
          <Link href={withLocale("/trips?destination=egypt", locale)} className={styles.tileAction} prefetch={false}>
            {ui.exploreTours}<ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </article>
        <article className={styles.multiCountry}>
          <Image src="/images/destination-previews/jordan.webp" alt="" fill sizes={photoSizes} className={styles.photo} />
          <div className={styles.captionPanel}>
            <h3>{directoryCopy.combineLabel}</h3>
            <p>{directoryCopy.combined}</p>
            <Link href={withLocale(multiCountryParentPath, locale)} className={styles.tileAction} prefetch={false}>
              {directoryCopy.combineAction}<ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </article>
      </div>
      <ul className={styles.benefits} role="list">
        {copy.benefits.map(([title, description], index) => {
          const Icon = benefitIcons[index];
          return (
            <li key={title}>
              <Icon size={19} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
