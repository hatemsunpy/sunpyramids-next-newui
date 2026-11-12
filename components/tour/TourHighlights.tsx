import { TourHighlightsDestinations } from "@/components/tour/TourHighlightsDestinations";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Locale, Tour } from "@/types/api";

export function TourHighlights({ tour, locale }: { tour: Tour | null; locale: Locale }) {
  return (
    <section className="tour-highlights" id="highlights" aria-labelledby="tour-highlights-title">
      <div className="tour-editorial-heading">
        <h2 id="tour-highlights-title">Tour Highlights</h2>
      </div>
      {tour?.highlights ? (
        <div className="content-prose tour-highlight-story" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tour.highlights) }} />
      ) : null}
      <TourHighlightsDestinations tour={tour} locale={locale} />
    </section>
  );
}
