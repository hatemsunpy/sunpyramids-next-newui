import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { siteContact } from "@/lib/site-contact";
import { accessibleTravelCopy } from "@/lib/accessible-travel-copy";
import { uiCopy } from "@/lib/ui-copy";

export function WhatsAppButton({ locale = "en" }: { locale?: Locale }) {
  const copy = accessibleTravelCopy(locale);
  const accessibleLabel = uiCopy(locale).accessible;
  return (
    <>
      <div className="accessible-travel-widget">
        <Link className="accessible-travel-float" href={withLocale("/accessible-travel", locale)} aria-label={accessibleLabel} aria-describedby="accessible-travel-announcement">
          <Image src="/icons/chair.svg" alt="" width={32} height={32} />
        </Link>
        <div className="accessible-travel-popup">
          <p id="accessible-travel-announcement">{copy.message}</p>
          <Link className="btn btn-primary" href={withLocale("/accessible-travel", locale)}>{copy.readMore}</Link>
        </div>
      </div>
      <a
        className="whatsapp-float"
        href={siteContact.whatsapp.contactUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Contact Sun Pyramids on WhatsApp"
      >
        <Image src="/images/whatsapp.webp" alt="" width={32} height={32} />
      </a>
    </>
  );
}
