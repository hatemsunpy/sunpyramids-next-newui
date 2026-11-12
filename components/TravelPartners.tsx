import Image from "next/image";
import { SwipeCarousel } from "@/components/SwipeCarousel";
import { companyPageCopy } from "@/lib/company-page-copy";
import type { Locale } from "@/types/api";

const partners = [
  "partner1.webp", "civitatis.webp", "partner.webp", "partner2.webp", "partner3.webp",
  "partner4.webp", "partner5.webp", "partner6.webp", "partner7.webp", "partner8.webp",
  "partner9.webp", "partner12.webp", "partner99.webp", "tourradar.webp", "viator.webp",
];

export function TravelPartners({ locale }: { locale?: Locale } = {}) {
  const copy = locale ? companyPageCopy(locale) : null;

  return (
    <SwipeCarousel
      className="home-partners"
      ariaLabel={copy?.partners ?? "Travel partners"}
      controls={copy ? { previousLabel: copy.previousPartners, nextLabel: copy.nextPartners } : undefined}
    >
      {partners.map((name) => (
        <Image
          key={name}
          src={`https://sunpyramidtours.com/storage/media/pages/assets/partner/${name}`}
          alt="Sun Pyramids Tours partner"
          width={110}
          height={72}
        />
      ))}
    </SwipeCarousel>
  );
}
