import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Locale, PublicSiteSettings } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { TrustIndexLoader } from "@/components/TrustIndexLoader";
import { uiCopy } from "@/lib/ui-copy";
import { APPROVED_BRAND_LOGO, officeMapUrl, siteContact } from "@/lib/site-contact";

const links = [
  ["home", "/"], ["oneDay", "/egypt-tours/one-day-tours"], ["multiDays", "/egypt-tours/multi-days-tours"],
  ["nileCruises", "/egypt-tours/nile-cruises"], ["shoreExcursions", "/egypt-tours/shore-excursions"],
  ["specialOffer", "/trips?main=special-offers"], ["rentCar", "/rent-car"], ["about", "/about-us"],
  ["contact", "/contact-us"], ["guide", "/egypt-travel-guide"], ["faqs", "/faqs"],
  ["events", "/events"], ["accessible", "/accessible-travel"],
] as const;

// User-requested static navigation labels (frontend-owned UI). These are not
// backend destination records: each link reuses the existing live tour-search
// route /trips?title=<English country name> via lib/trips-query.ts, so no
// destination IDs or slugs are invented. Search values stay English; labels
// are localized through lib/ui-copy.ts.
const destinations = [
  ["destJordan", "Jordan"], ["destMorocco", "Morocco"], ["destTunisia", "Tunisia"],
  ["destTurkey", "Turkey"], ["destGreece", "Greece"], ["destTanzania", "Tanzania"],
] as const;

// Static brand-icon paths (frontend UI config only, no backend records).
const footerSocialIcons: Record<string, string> = {
  facebook: "/icons/social/facebook.svg",
  instagram: "/icons/social/instagram.svg",
  pinterest: "/icons/social/pinterest.svg",
  youtube: "/icons/social/youtube.svg",
  tripadvisor: "/icons/social/tripadvisor.svg",
  tiktok: "/icons/social/tiktok.svg",
  "google-plus": "/icons/social/google-plus.svg",
};

// Allowed social types are exactly the keys of the icon map above.
const footerSocialTypes = new Set(Object.keys(footerSocialIcons));

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
        <Link className="btn-primary footer-plan-link" href={withLocale("/make-your-trip", locale)}>
          {copy.makeTrip}<span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="footer-grid">
        <section className="footer-connect" aria-label="Connect with Sun Pyramids Tours">
          <p className="footer-title">{copy.contact}</p>
          <div className="footer-primary-contact">
            <a href={siteContact.phones[0].href}>
              <Phone className="footer-contact-icon" aria-hidden="true" />
              <span dir="ltr">{siteContact.phones[0].display}</span>
            </a>
            <a href={`mailto:${emails[0]}`}>
              <Mail className="footer-contact-icon" aria-hidden="true" />
              <span dir="ltr">{emails[0]}</span>
            </a>
          </div>
          {socialLinks.length ? (
            <nav className="footer-social-links" aria-label="Social links">
              {socialLinks.map((item) => (
                <a key={`${item.type}-${item.url}`} href={item.url} target="_blank" rel="noreferrer">
                  <Image className="footer-social-icon" src={footerSocialIcons[item.type]} alt="" aria-hidden="true" width={18} height={18} />
                  <span>{socialLabel(item.type)}</span>
                </a>
              ))}
            </nav>
          ) : null}
          <Link href={withLocale("/sustainability", locale)}>
            <Image
              src="/images/certified_footer_white.webp"
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
        <section aria-labelledby="footer-destinations-title">
          <h2 className="footer-title" id="footer-destinations-title">{copy.destinations}</h2>
          <nav className="footer-links footer-destination-links" aria-label="Destinations">
            {destinations.map(([key, title]) => (
              <Link key={title} href={withLocale(`/trips?title=${encodeURIComponent(title)}`, locale)}>
                <span>{copy[key]}</span><span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        </section>
        <section aria-labelledby="footer-details-title">
          <p className="footer-title" id="footer-details-title">{copy.contactInfo}</p>
          <div className="footer-links footer-contact-links">
            {siteContact.phones.map((phone) => (
              <a key={phone.href} href={phone.href}>
                <Phone className="footer-contact-icon" aria-hidden="true" />
                <span dir="ltr">{phone.display}</span>
              </a>
            ))}
            <a href={siteContact.whatsapp.contactUrl} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${siteContact.whatsapp.display}`}>
              <MessageCircle className="footer-contact-icon" aria-hidden="true" />
              <span dir="ltr">{siteContact.whatsapp.display}</span>
            </a>
            {emails.map((email) => (
              <a key={email} href={`mailto:${email}`}>
                <Mail className="footer-contact-icon" aria-hidden="true" />
                <span dir="ltr">{email}</span>
              </a>
            ))}
            <a href={officeMapUrl} target="_blank" rel="noreferrer">
              <MapPin className="footer-contact-icon" aria-hidden="true" />
              <span>{siteContact.address}</span>
            </a>
            <div id="footer-cert" />
            <TrustIndexLoader containerId="footer-cert" script="https://cdn.trustindex.io/loader-cert.js?c80e286451c98153d1567b8885a" />
          </div>
        </section>
      </div>
      <div className="footer-bottom">
        <p className="footer-copyright-note">
          All rights reserved to
          <Image
            className="footer-signature"
            src="/images/sp-group-signature-white.webp"
            alt="Sun Pyramid Group"
            width={2440}
            height={477}
          />
          ©{new Date().getFullYear()}
        </p>
        <div className="footer-legal-links">
          <Link href={withLocale("/privacy-and-cookies", locale)}>Privacy and Cookies</Link>
          <Link href={withLocale("/terms-and-conditions", locale)}>Terms and Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
