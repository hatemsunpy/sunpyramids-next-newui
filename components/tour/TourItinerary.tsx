import { TourItineraryDisclosure } from "@/components/tour/TourItineraryDisclosure";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Locale, Tour } from "@/types/api";

export function TourItinerary({ days, locale }: { days: NonNullable<Tour["days"]>; locale: Locale }) {
  return (
    <section className="tour-itinerary">
      <TourItineraryDisclosure>
        {days.map((day, index) => {
          const translation = day.translations?.find((t) => t.locale === locale) || day.translations?.find((t) => t.locale === "en") || day.translations?.[0];
          const dayTitle = translation?.title?.split(":").slice(1).join(":").trim() || day.title || "";
          const description = translation?.description || day.description || "";
          return (
            <details key={day.id || index} className="tour-day" open>
              <summary>
                <span>
                  <strong>Day {index + 1}:</strong> {dayTitle}
                </span>
              </summary>
              <div className="tour-day-body content-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} />
            </details>
          );
        })}
      </TourItineraryDisclosure>
    </section>
  );
}
