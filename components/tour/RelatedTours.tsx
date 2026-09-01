import { TourCard } from "@/components/TourCard";
import type { Locale, Tour } from "@/types/api";

export function RelatedTours({ tours, locale }: { tours: Tour[]; locale: Locale }) {
  if (!tours.length) return null;

  return (
    <section className="tour-related">
      <div className="container-shell">
        <div className="tour-section-heading">
          <h2>Continue exploring</h2>
          <p>More itineraries selected from the same part of your journey.</p>
        </div>
      </div>
      <div className="tour-related-scroll container-shell">
        {tours.map((item) => (
          <TourCard key={item.id || item.slug} tour={item} locale={locale} />
        ))}
      </div>
    </section>
  );
}
