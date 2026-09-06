import Image from "next/image";
import Link from "next/link";
import type { Locale, PublicSiteSettings } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { TrustIndexLoader } from "@/components/TrustIndexLoader";
import { uiCopy } from "@/lib/ui-copy";
import { APPROVED_BRAND_LOGO, siteContact } from "@/lib/site-contact";

const links = [
  ["home", "/"], ["oneDay", "/egypt-tours/one-day-tours"], ["multiDays", "/egypt-tours/multi-days-tours"],
  ["nileCruises", "/egypt-tours/nile-cruises"], ["shoreExcursions", "/egypt-tours/shore-excursions"],
  ["specialOffer", "/trips?main=special-offers"], ["rentCar", "/rent-car"], ["about", "/about-us"],
  ["contact", "/contact-us"], ["guide", "/egypt-travel-guide"], ["faqs", "/faqs"],
  ["events", "/events"], ["accessible", "/accessible-travel"],
] as const;

const footerSocialTypes = new Set(["youtube", "google-plus", "facebook", "instagram", "pinterest", "tripadvisor", "tiktok"]);

function socialLabel(type: string) {
  return type.split("-").map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");
}

export function Footer({ locale = "en", settings }: { locale?: Locale; settings: PublicSiteSettings }) {
  const copy = uiCopy(locale);
  const dynamicEmails = settings.notificationEmails.length ? settings.notificationEmails : siteContact.safeFallbackEmails;
  const emails = [...new Set([...dynamicEmails, ...siteContact.staticEmails])];
  const logo = APPROVED_BRAND_LOGO;
  const title = settings.siteTitle || "Sun Pyramids Tours";
  const socialLinks = settings.socialLinks.filter((social) => social.url && footerSocialTypes.has(social.type));
  return (
    <footer className="footer">
      <div className="footer-lead">
        <div className="footer-brand">
          <Image src={logo} alt={title} width={230} height={65} />
          <div>
            <h2>Need Our Help?</h2>
            <p>We would be happy to help you.</p>
          </div>
        </div>
        <Link className="footer-plan-link" href={withLocale("/make-your-trip", locale)}>
          {copy.makeTrip}<span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="footer-grid">
        <section className="footer-connect" aria-label="Connect with Sun Pyramids Tours">
          <p className="footer-title">{copy.contactInfo}</p>
          <div className="footer-primary-contact">
            <a href={siteContact.phones[0].href}>{siteContact.phones[0].display}</a>
            <a href={`mailto:${emails[0]}`}>{emails[0]}</a>
          </div>
          {socialLinks.length ? (
            <nav className="footer-social-links" aria-label="Social links">
              {socialLinks.map((item) => (
                <a key={`${item.type}-${item.url}`} href={item.url} target="_blank" rel="noreferrer">{socialLabel(item.type)}<span aria-hidden="true">↗</span></a>
              ))}
            </nav>
          ) : null}
          <Link href={withLocale("/sustainability", locale)}>
            <Image
              src="/images/certified_footer_white.png"
              alt="Certified sustainable travel"
              width={292}
              height={120}
              className="footer-certification"
            />
          </Link>
        </section>
        <section aria-labelledby="footer-links-title">
          <p className="footer-title" id="footer-links-title">{copy.links}</p>
          <nav className="footer-links footer-route-links" aria-label="Footer navigation">
            {links.map(([key, href]) => (
              <Link key={href} href={withLocale(href, locale)}>
                <span>{copy[key]}</span><span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        </section>
        <section aria-labelledby="footer-details-title">
          <p className="footer-title" id="footer-details-title">{copy.contactInfo}</p>
          <div className="footer-links">
            {siteContact.phones.map((phone) => <a key={phone.href} href={phone.href}>{phone.display}</a>)}
            <a href={siteContact.whatsapp.contactUrl} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${siteContact.whatsapp.display}`}>
              {siteContact.whatsapp.display}
            </a>
            {emails.map((email) => <a key={email} href={`mailto:${email}`}>{email}</a>)}
            {settings.locationUrl ? (
              <a href={settings.locationUrl} target="_blank" rel="noreferrer">{siteContact.address}</a>
            ) : <p>{siteContact.address}</p>}
            <div id="footer-cert" />
            <TrustIndexLoader containerId="footer-cert" script="https://cdn.trustindex.io/loader-cert.js?c80e286451c98153d1567b8885a" />
          </div>
        </section>
      </div>
      <div className="footer-bottom">
        <p>All rights reserved to {title}, Egypt ©{new Date().getFullYear()}</p>
        <div className="footer-legal-links">
          <Link href={withLocale("/privacy-and-cookies", locale)}>Privacy and Cookies</Link>
          <Link href={withLocale("/terms-and-conditions", locale)}>Terms and Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
