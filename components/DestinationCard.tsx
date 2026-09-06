import Image from "next/image";
import Link from "next/link";
import type { ApiPage, Locale } from "@/types/api";
import { withLocale } from "@/lib/locales";

export function DestinationCard({
  destination,
  basePath,
  locale = "en",
  className = "",
  headingLevel = 2,
}: {
  destination: ApiPage;
  basePath: string;
  locale?: Locale;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  const slug = destination.slug || String(destination.id || "");
  const title = destination.title || destination.name || "Egypt Destination";
  const image = destination.featured_image || destination.image || destination.banner || "/images/mainBanner.png";
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <article className={`destination-card ${className}`.trim()}>
      <Link href={withLocale(`${basePath}/${slug}`, locale)}>
        <Image src={image} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" />
        <Heading>{title}</Heading>
      </Link>
    </article>
  );
}
