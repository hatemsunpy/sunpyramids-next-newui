import Image from "next/image";

export function TourSocialGallery({ socials }: { socials?: { image?: string; icon?: string; url?: string; type?: string }[] }) {
  const items = socials?.filter((item) => item.image && item.url) ?? [];
  if (!items.length) return null;

  return (
    <section className="tour-social-gallery">
      <div className="container-shell">
        <div className="tour-section-heading">
          <h2>Journeys in motion</h2>
          <p>See Egypt through recent moments shared across our travel community.</p>
        </div>
        <div className="tour-social-scroll">
          {items.map((item, index) => (
            <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="tour-social-card">
              <Image src={item.image!} alt="" fill sizes="20vw" loading="lazy" />
              {item.icon ? <Image src={item.icon} alt="" width={72} height={72} className="tour-social-icon" /> : <span className="tour-social-type">{item.type || "View"}</span>}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
