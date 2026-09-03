import { TourHighlightsDestinations } from "@/components/tour/TourHighlightsDestinations";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Locale, Tour } from "@/types/api";

export function TourHighlights({ tour, locale }: { tour: Tour | null; locale: Locale }) {
  return (
    <section className="tour-highlights" id="highlights" aria-labelledby="tour-highlights-title">
      <div className="tour-editorial-heading tour-editorial-heading-split">
        <h2 id="tour-highlights-title">The moments that define this tour</h2>
        <p>A focused view of the places, experiences, and details that shape the journey.</p>
      </div>
      {tour?.highlights ? (
        <div className="content-prose tour-highlight-story" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tour.highlights) }} />
      ) : (
        <TourHighlightsDestinations tour={tour} locale={locale} />
      )}
    </section>
  );
}
