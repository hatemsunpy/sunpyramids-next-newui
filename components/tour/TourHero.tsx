import type { Tour } from "@/types/api";

export function TourHero({ tour, title, mobile = false }: { tour: Tour | null; title: string; mobile?: boolean }) {
  const destination = tour?.destinations?.find((item) => item.global)?.title
    || tour?.destinations?.find((item) => item.featured)?.title
    || tour?.destinations?.[0]?.title
    || tour?.destination
    || "Egypt";
  const category = tour?.categories?.[0]?.title || tour?.category?.name;
  const offer = Number(tour?.offer || 0);

  return (
    <header className={`tour-hero-copy ${mobile ? "tour-hero-copy-mobile tour-page-title-mobile" : "tour-hero-copy-desktop tour-page-title-desktop"}`}>
      <div className="tour-hero-context" role="group" aria-label="Tour context">
        <span>{destination}</span>
        {category ? <><span className="tour-hero-context-separator" aria-hidden="true" /> <span>{category}</span></> : null}
        {offer > 0 ? <span className="tour-hero-offer">Save {offer}%</span> : null}
      </div>
      <h1 className="tour-page-title">{title}</h1>
    </header>
  );
}
