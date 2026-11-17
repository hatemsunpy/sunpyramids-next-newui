import { ArrowRight, ArrowUpRight, BadgeCheck, Languages, MessageCircle, PenLine, WandSparkles } from "lucide-react";
import Link from "next/link";
import { destinationDirectoryCopy } from "@/components/destination-directory-copy";
import { multiCountryParentPath } from "@/components/multi-country/routes";
import Image from "@/components/ResponsiveImage";
import { countryDestinationPreviewPhoto, destinationsPath } from "@/lib/destination-links";
import { languageOptions, withLocale } from "@/lib/locales";
import { siteContact } from "@/lib/site-contact";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale } from "@/types/api";
import styles from "@/styles/destinations-directory.module.scss";

export function DestinationsTravelPlanning({ locale, reviewsUrl }: { locale: Locale; reviewsUrl?: string }) {
  const copy = uiCopy(locale);
  const details = destinationDirectoryCopy[locale];
  const tailorTripHref = withLocale("/make-your-trip", locale);

  return (
    <>
      <section className={styles.planning} aria-labelledby="destination-planning-heading">
        <div className={styles.wrap}>
          <h2 id="destination-planning-heading" className={styles.sectionTitle}>{details.planning}</h2>
          <div className={styles.planningGrid}>
            <article className={`${styles.planningCard} ${styles.planningPhotoCard}`}>
              <div className={styles.planningPhotos} aria-hidden="true">
                <div><Image src="/images/giza.webp" alt="" fill sizes="(max-width: 700px) 50vw, 25vw" /></div>
                <div><Image src={countryDestinationPreviewPhoto("jordan")} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" /></div>
              </div>
              <div className={styles.planningText}>
                <span className={styles.planningLabel}>{details.combineLabel}</span>
                <h3>{details.combineTitle}</h3>
                <p>{details.combined}</p>
                <Link href={withLocale(multiCountryParentPath, locale)} className={styles.planningAction}>
                  {details.combineAction} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>
            <article className={`${styles.planningCard} ${styles.planningCustomCard}`}>
              <div className={styles.planningText}>
                <span className={styles.planningLabel}>{details.tailoredLabel}</span>
                <h3>{details.tailoredTitle}</h3>
                <p>{details.custom}</p>
                <Link href={tailorTripHref} className={`${styles.planningAction} ${styles.planningPrimary}`}>
                  <WandSparkles size={16} aria-hidden="true" /> {copy.makeTrip}
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.whySection} aria-labelledby="destination-why-heading">
        <div className={`${styles.wrap} ${styles.whyGrid}`}>
          <div className={styles.whyLead}>
            <h2 id="destination-why-heading" className={styles.sectionTitle}>{copy.whyChooseUs}</h2>
            <p>{details.whyIntro}</p>
            <figure className={styles.whyPhoto}>
              <Image src="/images/nile-cruise-preview.webp" alt="" fill sizes="(max-width: 700px) 100vw, 38vw" />
              <figcaption>{details.since}</figcaption>
            </figure>
          </div>
          <ul className={styles.reasons} role="list">
            <li>
              <span className={styles.reasonIcon}><BadgeCheck size={20} aria-hidden="true" /></span>
              <div><h3>{details.experienceTitle}</h3><p>{details.experienceDescription}</p></div>
            </li>
            <li>
              <span className={styles.reasonIcon}><PenLine size={20} aria-hidden="true" /></span>
              <div>
                <h3>{details.tailoredLabel}</h3>
                <p>{details.tailoredReason}</p>
                <Link href={tailorTripHref} className={styles.reasonAction}>{copy.planYourTrip} <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
            </li>
            <li>
              <span className={styles.reasonIcon}><Languages size={20} aria-hidden="true" /></span>
              <div>
                <h3 id="destination-languages-heading">{details.languagesTitle}</h3>
                <p>{details.languagesDescription}</p>
                <nav className={styles.languageLinks} aria-labelledby="destination-languages-heading">
                  {languageOptions.map(({ code, language }) => (
                    <Link key={code} href={`${withLocale(destinationsPath, code)}#destination-why-heading`} lang={code} hrefLang={code} aria-current={code === locale ? "page" : undefined} prefetch={false}>
                      {language}
                    </Link>
                  ))}
                </nav>
              </div>
            </li>
            {reviewsUrl && (
              <li>
                <span className={styles.reasonIcon}><Image src="/icons/social/tripadvisor.svg" width={20} height={20} alt="" /></span>
                <div>
                  <h3>{details.reviewsTitle}</h3>
                  <p>{details.reviewsDescription}</p>
                  <a href={reviewsUrl} className={styles.reasonAction} target="_blank" rel="noopener noreferrer">
                    {details.reviewsAction} <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </div>
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className={`${styles.wrap} ${styles.helpSection}`} aria-labelledby="destination-help-heading">
        <div className={styles.helpCard}>
          <div>
            <h2 id="destination-help-heading" className={styles.sectionTitle}>{details.help}</h2>
            <p>{details.helpDescription}</p>
          </div>
          <a className={styles.helpAction} href={siteContact.whatsapp.contactUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={20} aria-hidden="true" /> {details.whatsapp} <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>
    </>
  );
}
