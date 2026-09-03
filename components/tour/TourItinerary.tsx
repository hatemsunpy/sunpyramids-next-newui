import { TourItineraryDisclosure } from "@/components/tour/TourItineraryDisclosure";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Locale, Tour } from "@/types/api";

export function TourItinerary({ days, locale }: { days: NonNullable<Tour["days"]>; locale: Locale }) {
  return (
    <section className="tour-itinerary" id="itinerary" aria-labelledby="tour-itinerary-title">
      <div className="tour-editorial-heading tour-editorial-heading-split">
        <h2 id="tour-itinerary-title">Day by day, without the guesswork</h2>
        <p>Open each day for the full plan, or scan the route at a glance.</p>
      </div>
      <TourItineraryDisclosure>
        {days.map((day, index) => {
          const translation = day.translations?.find((t) => t.locale === locale) || day.translations?.find((t) => t.locale === "en") || day.translations?.[0];
          const dayTitle = translation?.title?.split(":").slice(1).join(":").trim() || day.title || "";
          const description = translation?.description || day.description || "";
          return (
            <details key={day.id || index} className="tour-day" open>
              <summary>
                <span className="tour-day-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="tour-day-summary-copy">
                  <strong>Day {index + 1}</strong>
                  {dayTitle ? <span>{dayTitle}</span> : null}
                </span>
                <span className="tour-day-chevron" aria-hidden="true">↓</span>
              </summary>
              <div className="tour-day-body content-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} />
            </details>
          );
        })}
      </TourItineraryDisclosure>
    </section>
  );
}
