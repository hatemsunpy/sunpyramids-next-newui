import Link from "next/link";
import type { ApiPage, Locale } from "@/types/api";
import { homeCopy } from "@/lib/home-copy";
import { withLocale } from "@/lib/locales";
import { HomeUpcomingEventCard } from "@/components/HomeUpcomingEventCard";
import { HomeUpcomingEventsCarousel } from "@/components/HomeUpcomingEventsCarousel";
import { SectionEyebrow } from "@/components/SectionHeading";

type Props = {
  events: ApiPage[];
  locale?: Locale;
};

export function HomeUpcomingEvents({ events, locale = "en" }: Props) {
  // Filter out any invalid items without fabricated content
  const validEvents = events.filter((event): event is ApiPage & { slug: string; title: string } => {
    const title =
      typeof event.title === "string"
        ? event.title
        : typeof event.name === "string"
          ? event.name
          : "";
    const slug = typeof event.slug === "string" ? event.slug : "";
    return Boolean(slug && title && title.trim().length > 0);
  });

  // If no valid events, hide the entire section
  if (validEvents.length === 0) {
    return null;
  }

  const copy = homeCopy(locale);
  const allEventsHref = withLocale("/events", locale);

  return (
    <section className="home-upcoming-events-section" aria-labelledby="upcoming-events-title">
      <div className="container-shell">
        <HomeUpcomingEventsCarousel
          totalItems={validEvents.length}
          prevAriaLabel={copy.previousEvents}
          nextAriaLabel={copy.nextEvents}
          header={
            <div className="upcoming-events-header-text">
              {copy.upcomingEventsEyebrow && (
                <SectionEyebrow>
                  {copy.upcomingEventsEyebrow}
                </SectionEyebrow>
              )}
              <h2 id="upcoming-events-title" className="upcoming-events-title">
                {copy.upcomingEventsTitle}
              </h2>
              {copy.upcomingEventsDescription && (
                <p className="upcoming-events-description">
                  {copy.upcomingEventsDescription}
                </p>
              )}
            </div>
          }
          viewAllLink={
            <Link href={allEventsHref} className="upcoming-events-view-all-link">
              <span>{copy.viewAllEvents}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          }
        >
          {validEvents.map((event) => (
            <HomeUpcomingEventCard
              key={event.id || event.slug}
              event={event}
              locale={locale}
            />
          ))}
        </HomeUpcomingEventsCarousel>
      </div>
    </section>
  );
}
