import Image from "next/image";
import { siteContact } from "@/lib/site-contact";

export function WhatsAppButton() {
  return (
    <a
      className="whatsapp-float"
      href={siteContact.whatsapp.contactUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Contact Sun Pyramids on WhatsApp"
    >
      <Image src="/images/whatsapp.webp" alt="" width={40} height={40} />
    </a>
  );
}
