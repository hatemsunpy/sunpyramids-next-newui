import { TrustIndexLoader } from "@/components/TrustIndexLoader";
import type { Locale } from "@/types/api";

const reviewLabels: Record<Locale, string> = {
  en: "Traveller reviews",
  fr: "Avis des voyageurs",
  de: "Reisebewertungen",
  it: "Recensioni dei viaggiatori",
  pt: "Avaliações de viajantes",
  es: "Opiniones de viajeros",
  zh: "旅客评价",
};

export function TravellerReviews({ containerId, locale = "en", className = "" }: {
  containerId: string;
  locale?: Locale;
  className?: string;
}) {
  return (
    <section className={`home-review-section container-shell ${className}`} aria-label={reviewLabels[locale]}>
      <div id={containerId} />
      <TrustIndexLoader containerId={containerId} script="https://cdn.trustindex.io/loader.js?1d15b034519c8049128609a4d4e" />
    </section>
  );
}
