import { TourCollapsible } from "@/components/tour/TourCollapsible";
import { TourHighlightsDestinations } from "@/components/tour/TourHighlightsDestinations";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Locale, Tour } from "@/types/api";

export function TourHighlights({ tour, locale }: { tour: Tour | null; locale: Locale }) {
  return (
    <section className="tour-highlights">
      <TourCollapsible title="Highlights" defaultOpen>
        {tour?.highlights ? (
          <div className="content-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tour.highlights) }} />
        ) : (
          <TourHighlightsDestinations tour={tour} locale={locale} />
        )}
      </TourCollapsible>
    </section>
  );
}
