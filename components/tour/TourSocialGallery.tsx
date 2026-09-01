import Image from "next/image";

const defaultSocials = [
  { type: "shorts", image: "/images/shorts.png", icon: "/images/shorts-gallary.png", url: "https://www.youtube.com/channel/UCCsn_rbLMuer0kJd9iK6RDA" },
  { type: "youtube", image: "/images/youtubetwo.png", icon: "/images/youtube-gallary.png", url: "https://www.youtube.com/channel/UCCsn_rbLMuer0kJd9iK6RDA" },
  { type: "facebook", image: "/images/youtubetwo.png", icon: "/images/fb-logo.webp", url: "https://www.facebook.com/SunPyramidsTours/" },
  { type: "youtube", image: "/images/youtubeone.png", icon: "/images/youtube-gallary.png", url: "https://www.youtube.com/channel/UCCsn_rbLMuer0kJd9iK6RDA" },
  { type: "tiktok", image: "/images/tiktok.png", icon: "/images/tiktok-gallary.png", url: "https://www.tiktok.com/@sunpyramidstours" },
  { type: "instagram", image: "/images/instagram.png", icon: "/images/insta-gallary.png", url: "https://www.instagram.com/sunpyramidstours/" },
];

export function TourSocialGallery({ socials }: { socials?: { image?: string; icon?: string; url?: string; type?: string }[] }) {
  const items = socials?.length
    ? socials.map((s) => ({ ...s, image: s.image || getDefaultSocial(s.type).image, icon: s.icon || getDefaultSocial(s.type).icon }))
    : defaultSocials;

  return (
    <section className="tour-social-gallery">
      <div className="container-shell">
        <div className="tour-section-heading">
          <h2>Journeys in motion</h2>
          <p>See Egypt through recent moments shared across our travel community.</p>
        </div>
        <div className="tour-social-scroll">
          {items.map((item, index) => (
            <a key={index} href={item.url || "#"} target="_blank" rel="noreferrer" className="tour-social-card">
              <Image src={item.image || "/images/shorts.png"} alt="" fill sizes="20vw" loading="lazy" />
              <Image src={item.icon || "/images/shorts-gallary.png"} alt="Social gallery icon" width={72} height={72} className="tour-social-icon" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function getDefaultSocial(type?: string) {
  const found = defaultSocials.find((s) => s.type === type) || defaultSocials[0];
  return { image: found.image, icon: found.icon };
}
