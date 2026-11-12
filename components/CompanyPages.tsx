import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MapPin, Mail, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { ContactForm } from "@/components/ContactForm";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import Image from "@/components/ResponsiveImage";
import { TravelMomentsGallery } from "@/components/TravelMomentsGallery";
import { TravelPartners } from "@/components/TravelPartners";
import { companyPageCopy } from "@/lib/company-page-copy";
import { homeCopy } from "@/lib/home-copy";
import { withLocale } from "@/lib/locales";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { officeMapEmbedUrl, officeMapUrl, siteContact } from "@/lib/site-contact";
import { uiCopy } from "@/lib/ui-copy";
import styles from "@/styles/company-pages.module.scss";
import type { ApiPage, Locale, PublicSiteSettings, SocialLink, TeamMember } from "@/types/api";

type PageProps = {
  page: ApiPage | null;
  title: string;
  image: string;
  locale: Locale;
  settings?: PublicSiteSettings;
};

function CompanyPageHero({
  title,
  image,
  locale,
  className,
}: Pick<PageProps, "title" | "image" | "locale"> & { className?: string }) {
  return (
    <DiscoveryHero
      title={title}
      breadcrumbs={[
        { label: uiCopy(locale).home, href: withLocale("/", locale) },
        { label: title },
      ]}
      breadcrumbLabel={companyPageCopy(locale).breadcrumb}
      eyebrow=""
      bgImage={image}
      className={className}
      locale={locale}
    />
  );
}

function normalizeCompanyProse(html: string) {
  return html
    .replace(/\r\n?/g, "\n")
    .replace(/\n(?:[ \t]*\n){2,}/g, "\n\n")
    .replace(/\n[ \t]*\n+(?=[,;])/g, "\n");
}

function CompanyProse({ html }: { html: string }) {
  return <div className={styles.prose} dangerouslySetInnerHTML={{ __html: normalizeCompanyProse(html) }} />;
}

// The prose styles use `white-space: pre-line`, so blank CMS paragraphs and the
// CRLF between tags both render as empty lines. Contact intro only: drop blank
// spacer paragraphs and collapse inter-block source whitespace, keeping every
// real paragraph and all other markup intact.
function compactContactIntro(html: string) {
  return html
    .replace(
      /<p\b[^>]*>(?:\s|&nbsp;?|&#160;|<br\s*\/?>|<\/?(?:span|b|i|em|strong)\b[^>]*>)*<\/p>/gi,
      "",
    )
    .replace(
      /(<\/(?:p|div|li|h[1-6]|blockquote|ul|ol)>)\s+(?=<(?:p|div|li|h[1-6]|blockquote|ul|ol)\b)/gi,
      "$1",
    )
    .trim();
}

function pageMeta(page: ApiPage | null, key: string) {
  const item = page?.metas?.find((entry) => entry.meta_key === key);
  return sanitizeHtml(item?.meta_value || item?.value || item?.description).trim();
}

function pageImage(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function publicSocialLinks(links: SocialLink[] = []) {
  return links.filter(({ url }) => {
    try {
      const { protocol } = new URL(url);
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  });
}

function TripHelp({ locale }: { locale: Locale }) {
  return (
    <section className={styles.help}>
      <h2>{companyPageCopy(locale).tripHelp}</h2>
      <Link className={styles.primaryAction} href={withLocale("/make-your-trip", locale)}>
        {uiCopy(locale).planYourTrip} <ArrowUpRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}

export function CompanyAboutPage({
  page, title, image, locale, settings, team, faqSection,
}: PageProps & { team: TeamMember[]; faqSection?: ReactNode }) {
  const copy = companyPageCopy(locale);
  const story = pageMeta(page, "about-sun-pyramids") || sanitizeHtml(page?.content).trim();
  const services = pageMeta(page, "services");
  const certification = pageMeta(page, "travel_partner_certification");
  const leadership = pageMeta(page, "ceo-message");
  const mission = pageMeta(page, "mission");
  const vision = pageMeta(page, "vision");
  const storyImage = pageImage(page?.feature_1) || pageImage(page?.gallery?.[1]) || image;
  const serviceImage = pageImage(page?.feature_2);

  return (
    <main className={styles.page}>
      <CompanyPageHero
        title={title}
        image={pageImage(page?.gallery?.[0]) || image}
        locale={locale}
      />
      <div className={styles.content}>
        {story && (
          <section className={styles.split}>
            <div>
              <h2>{copy.story}</h2>
              <CompanyProse html={story} />
            </div>
            <div className={styles.photo}>
              <Image src={storyImage} alt="" fill sizes="(max-width: 760px) 100vw, 50vw" />
            </div>
          </section>
        )}

        <section className={styles.world}>
          <div>
            <h2>{copy.guests}</h2>
            <p>{copy.guestsDescription}</p>
          </div>
          <div className={styles.worldMap}>
            <Image src="/images/map.webp" alt="" fill sizes="(max-width: 760px) 100vw, 55vw" />
          </div>
        </section>

        {services && (
          <section className={serviceImage ? `${styles.split} ${styles.services}` : undefined}>
            <div>
              <h2>{copy.services}</h2>
              <CompanyProse html={services} />
            </div>
            {serviceImage && (
              <div className={styles.photo}>
                <Image src={serviceImage} alt="" fill sizes="(max-width: 760px) 100vw, 50vw" />
              </div>
            )}
          </section>
        )}

        <section>
          <h2>{copy.benefits}</h2>
          <ul className={styles.benefits}>
            {copy.benefitItems.map((item) => (
              <li key={item}><BadgeCheck size={21} aria-hidden="true" /> {item}</li>
            ))}
          </ul>
        </section>

        {certification && (
          <section className={styles.certification}>
            <div>
              <h2>{copy.certification}</h2>
              <CompanyProse html={certification} />
            </div>
            <Image src="/images/certified-logo.webp" alt="Travelife Certified" width={430} height={167} sizes="(max-width: 760px) 60vw, 230px" />
          </section>
        )}

        {(mission || vision) && (
          <div className={styles.goals}>
            {mission && <section><h2>{copy.mission}</h2><CompanyProse html={mission} /></section>}
            {vision && <section><h2>{copy.vision}</h2><CompanyProse html={vision} /></section>}
          </div>
        )}

        <section className={styles.partners}>
          <h2>{copy.partners}</h2>
          <TravelPartners locale={locale} />
        </section>

        {team.length > 0 && (
          <section>
            <h2>{uiCopy(locale).team}</h2>
            <ul className={styles.team}>
              {team.map((member) => {
                const portrait = pageImage(member.image);

                return (
                  <li key={`${member.name}-${member.position}`}>
                    {portrait && (
                      <div className={styles.teamPhoto}>
                        <Image src={portrait} alt="" fill sizes="(max-width: 760px) 50vw, 25vw" />
                      </div>
                    )}
                    <h3>{member.name}</h3>
                    <p>{member.position}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {leadership && (
          <section className={styles.letter}>
            <div>
              <Image src="/images/team/Mahmoud_badia.webp" alt="" width={88} height={88} />
              <p><strong>Mahmoud Badia</strong><br />{copy.executiveManager}</p>
            </div>
            <div>
              <h2>{copy.leadership}</h2>
              <CompanyProse html={leadership} />
            </div>
          </section>
        )}

        {faqSection}
        <TripHelp locale={locale} />
        <TravelMomentsGallery socialLinks={publicSocialLinks(settings?.socialLinks)} locale={locale} className={styles.gallery} />
      </div>
    </main>
  );
}

const socialNames: Record<string, string> = {
  youtube: "YouTube", "google-plus": "Google", facebook: "Facebook", instagram: "Instagram",
};

export function CompanyContactPage({ page, title, image, locale, settings }: PageProps) {
  const copy = companyPageCopy(locale);
  const labels = uiCopy(locale);
  const dynamicEmails = settings?.notificationEmails?.length ? settings.notificationEmails : siteContact.safeFallbackEmails;
  const emails = [...new Set([...dynamicEmails, ...siteContact.staticEmails])];
  const socials = [...new Map(publicSocialLinks(settings?.socialLinks)
    .filter(({ type }) => Object.hasOwn(socialNames, type))
    .map(({ type, url }) => [type, url])).entries()];
  const intro = compactContactIntro(sanitizeHtml(page?.content || page?.description));
  const hasPanoramicBanner = /contact(?:%20|\s|-|_)?us|contactForm/i.test(image);

  return (
    <main className={styles.page}>
      <CompanyPageHero
        title={title}
        image={image}
        locale={locale}
        className={hasPanoramicBanner ? `discovery-hero--panoramic ${styles.contactHero}` : undefined}
      />
      <div className={styles.content}>
        <div className={styles.contactLayout}>
          <section>
            <h2>{labels.contactInfo}</h2>
            {intro && <CompanyProse html={intro} />}
            <a className={styles.contactJump} href="#contact-message">{labels.sendMessage}</a>
            <div className={styles.contactChannels}>
              <div>
                <Phone aria-hidden="true" size={21} />
                <h3>{labels.phone}</h3>
                <ul>{siteContact.phones.map(({ href, display }) => <li key={href}><a href={href}>{display}</a></li>)}</ul>
              </div>
              <div>
                <MessageCircle aria-hidden="true" size={21} />
                <h3>WhatsApp</h3>
                <a href={siteContact.whatsapp.contactUrl} target="_blank" rel="noreferrer">{siteContact.whatsapp.display}</a>
              </div>
              <div>
                <Mail aria-hidden="true" size={21} />
                <h3>{labels.email}</h3>
                <ul>{emails.map((email) => <li key={email}><a href={`mailto:${email}`}>{email}</a></li>)}</ul>
              </div>
            </div>
          </section>
          <section className={styles.contactForm} id="contact-message" aria-labelledby="contact-message-title" tabIndex={-1}>
            <h2 id="contact-message-title">{labels.sendMessage}</h2>
            <ContactForm locale={locale} showLabels />
          </section>
        </div>

        <section className={styles.office}>
          <div>
            <MapPin size={24} aria-hidden="true" />
            <h2>{copy.office}</h2>
            <address>{siteContact.address}</address>
            <a className={styles.textAction} href={officeMapUrl} target="_blank" rel="noreferrer">
              {copy.directions} <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <iframe title={copy.office} src={officeMapEmbedUrl} loading="lazy" allowFullScreen />
        </section>

        {socials.length > 0 && (
          <section className={styles.socials}>
            <h2>{copy.follow}</h2>
            <ul>
              {socials.map(([type, url]) => (
                <li key={type}>
                  <a className={styles.textAction} href={url} target="_blank" rel="noreferrer">
                    {socialNames[type]} <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.faqLink}>
          <h2>{homeCopy(locale).faqTitle}</h2>
          <Link className={styles.textAction} href={withLocale("/faqs", locale)}>
            {copy.faqAction} <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </section>
        <TripHelp locale={locale} />
      </div>
    </main>
  );
}
