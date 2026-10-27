import Image from "@/components/ResponsiveImage";
import { SectionHeading } from "@/components/SectionHeading";
import { SwipeCarousel } from "@/components/SwipeCarousel";
import { homeCopy } from "@/lib/home-copy";
import { homeSectionLabels } from "@/lib/home-section-labels";
import type { Locale, SocialLink } from "@/types/api";

// Existing presentation posters; destination links remain dashboard-controlled.
const gallery = [
  ["/images/shorts.webp", "/images/shorts-gallary.webp", "YouTube Shorts", "shorts"],
  ["/images/youtubeone.webp", "/images/youtube-gallary.webp", "YouTube", "youtube-video-1"],
  ["/images/tiktok.webp", "/images/tiktok-gallary.webp", "TikTok", "tiktok"],
  ["/images/instagram.webp", "/images/insta-gallary.webp", "Instagram", "insta-link"],
  ["/images/youtubetwo.webp", "/images/fb-logo.webp", "Facebook", "youtube-video-2"],
];

export function TravelMomentsGallery({ socialLinks, locale = "en", className = "" }: {
  socialLinks: SocialLink[];
  locale?: Locale;
  className?: string;
}) {
  const copy = homeCopy(locale);
  const labels = homeSectionLabels(locale);
  const socialUrls = new Map(socialLinks.map((link) => [link.type, link.url]));

  return (
    <section className={`home-section container-shell home-gallery-section-v2 ${className}`}>
      <SectionHeading align="center" description={copy.galleryDescription} eyebrow={labels.gallery} title={copy.galleryTitle} />
      <SwipeCarousel className="home-social-gallery-v2" ariaLabel={copy.galleryTitle}>
        {gallery.map(([image, icon, label, type], index) => {
          const content = <><Image src={image} alt={`${label} travel moments`} fill sizes="(max-width: 768px) 72vw, 25vw" /><Image className="home-gallery-icon" src={icon} alt="" width={54} height={54} /><span>{label}</span></>;
          const url = socialUrls.get(type);
          return <article className={index === 1 ? "is-tall" : ""} key={label}>{url ? <a href={url} target="_blank" rel="noreferrer" aria-label={label}>{content}</a> : content}</article>;
        })}
      </SwipeCarousel>
    </section>
  );
}
