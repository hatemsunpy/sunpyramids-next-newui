import Image from "next/image";
import { SwipeCarousel } from "@/components/SwipeCarousel";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale, Tour } from "@/types/api";

type SocialGalleryItem = NonNullable<Tour["social_links"]>[number];

const galleryPresentation: Record<string, { image: string; icon: string; label: string }> = {
  shorts: { image: "/images/shorts.png", icon: "/images/shorts-gallary.png", label: "YouTube Shorts" },
  "youtube-video-1": { image: "/images/youtubeone.png", icon: "/images/youtube-gallary.png", label: "YouTube" },
  "youtube-video-2": { image: "/images/youtubetwo.png", icon: "/images/youtube-gallary.png", label: "YouTube" },
  youtube: { image: "/images/youtubeone.png", icon: "/images/youtube-gallary.png", label: "YouTube" },
  facebook: { image: "/images/youtubetwo.png", icon: "/images/fb-logo.webp", label: "Facebook" },
  tiktok: { image: "/images/tiktok.png", icon: "/images/tiktok-gallary.png", label: "TikTok" },
  "insta-link": { image: "/images/instagram.png", icon: "/images/insta-gallary.png", label: "Instagram" },
  instagram: { image: "/images/instagram.png", icon: "/images/insta-gallary.png", label: "Instagram" },
};

function resolveGalleryItem(socialLink: SocialGalleryItem) {
  const presentation = socialLink.type ? galleryPresentation[socialLink.type] : undefined;
  const image = socialLink.image || presentation?.image;
  if (!image) return null;

  return {
    image,
    icon: socialLink.icon || presentation?.icon,
    label: presentation?.label || socialLink.type || "Social media",
    type: socialLink.type || "social-media",
    url: socialLink.url,
  };
}

type ResolvedGalleryItem = NonNullable<ReturnType<typeof resolveGalleryItem>>;

function GalleryArtwork({ galleryItem }: { galleryItem: ResolvedGalleryItem }) {
  return (
    <>
      <Image
        className="tour-social-image"
        src={galleryItem.image}
        alt={`${galleryItem.label} travel moments from Sun Pyramids Tours`}
        fill
        sizes="(max-width: 767px) 78vw, (max-width: 1180px) 38vw, 21vw"
        loading="lazy"
      />
      {galleryItem.icon ? (
        <Image className="tour-social-icon" src={galleryItem.icon} alt="" width={72} height={72} />
      ) : null}
    </>
  );
}

function SocialGalleryCard({ galleryItem }: { galleryItem: ResolvedGalleryItem }) {
  const artwork = <GalleryArtwork galleryItem={galleryItem} />;
  return (
    <article className="tour-social-card" role="group" aria-roledescription="slide" aria-label={galleryItem.label}>
      {galleryItem.url ? (
        <a className="tour-social-card-media" href={galleryItem.url} target="_blank" rel="noreferrer" aria-label={`View ${galleryItem.label} journey`}>
          {artwork}
        </a>
      ) : (
        <div className="tour-social-card-media">{artwork}</div>
      )}
    </article>
  );
}

export function TourSocialGallery({
  socialLinks = [],
  locale = "en",
}: {
  socialLinks?: Tour["social_links"];
  locale?: Locale;
}) {
  const copy = uiCopy(locale);
  const galleryItems = socialLinks.flatMap((socialLink) => {
    const galleryItem = resolveGalleryItem(socialLink);
    return galleryItem ? [galleryItem] : [];
  });

  if (!galleryItems.length) return null;

  return (
    <section className="tour-social-gallery" aria-labelledby="tour-social-gallery-title">
      <div className="container-shell">
        <div className="tour-section-heading">
          <h2 id="tour-social-gallery-title">{copy.galleryTitle}</h2>
          <p>{copy.galleryDescription}</p>
        </div>
        <SwipeCarousel className="tour-social-scroll" ariaLabel={copy.galleryTitle}>
          {galleryItems.map((galleryItem, index) => (
            <SocialGalleryCard key={`${galleryItem.type}-${index}`} galleryItem={galleryItem} />
          ))}
        </SwipeCarousel>
      </div>
    </section>
  );
}
