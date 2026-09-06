import Image from "next/image";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale, SocialLink } from "@/types/api";

const galleryItems = [
  { image: "/images/shorts.png", icon: "/images/shorts-gallary.png", label: "YouTube Shorts", type: "shorts" },
  { image: "/images/youtubetwo.png", icon: "/images/youtube-gallary.png", label: "YouTube", type: "youtube-video-1" },
  { image: "/images/youtubetwo.png", icon: "/images/fb-logo.webp", label: "Facebook", type: "youtube-video-2" },
  { image: "/images/youtubeone.png", icon: "/images/youtube-gallary.png", label: "YouTube", type: "youtube" },
  { image: "/images/tiktok.png", icon: "/images/tiktok-gallary.png", label: "TikTok", type: "tiktok" },
  { image: "/images/instagram.png", icon: "/images/insta-gallary.png", label: "Instagram", type: "insta-link" },
] as const;

type GalleryItem = (typeof galleryItems)[number];

function GalleryArtwork({ galleryItem }: { galleryItem: GalleryItem }) {
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
      <Image className="tour-social-icon" src={galleryItem.icon} alt="" width={72} height={72} />
    </>
  );
}

function SocialGalleryCard({ galleryItem, url }: { galleryItem: GalleryItem; url?: string }) {
  const artwork = <GalleryArtwork galleryItem={galleryItem} />;
  return (
    <li className="tour-social-card">
      {url ? (
        <a className="tour-social-card-media" href={url} target="_blank" rel="noreferrer" aria-label={`View ${galleryItem.label} journey`}>
          {artwork}
        </a>
      ) : (
        <div className="tour-social-card-media">{artwork}</div>
      )}
    </li>
  );
}

export function TourSocialGallery({
  socialLinks,
  locale = "en",
}: {
  socialLinks: SocialLink[];
  locale?: Locale;
}) {
  const copy = uiCopy(locale);
  const socialUrls = new Map(socialLinks.map((socialLink) => [socialLink.type, socialLink.url]));

  return (
    <section className="tour-social-gallery" aria-labelledby="tour-social-gallery-title">
      <div className="container-shell">
        <div className="tour-section-heading">
          <h2 id="tour-social-gallery-title">{copy.galleryTitle}</h2>
          <p>{copy.galleryDescription}</p>
        </div>
        <ul className="tour-social-scroll" aria-label={copy.galleryTitle}>
          {galleryItems.map((galleryItem) => (
            <SocialGalleryCard key={galleryItem.type} galleryItem={galleryItem} url={socialUrls.get(galleryItem.type)} />
          ))}
        </ul>
      </div>
    </section>
  );
}
