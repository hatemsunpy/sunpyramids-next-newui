import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Tour } from "@/types/api";

function normalizedDestinationSlug(title: string) {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tourDestinationCount(tour: Tour | null) {
  const destinations = tour?.destinations ?? [];
  const featuredDestinations = destinations.filter((destination) => !destination.global && destination.enabled && destination.featured);
  const globalDestinations = destinations.filter((destination) => destination.global && destination.enabled);
  const namedRegions = featuredDestinations.filter((destination) => {
    const titleSlug = normalizedDestinationSlug(String(destination.title || destination.name || ""));
    return titleSlug && titleSlug === String(destination.slug || "").toLowerCase();
  });
  return globalDestinations.length + namedRegions.length || featuredDestinations.length;
}

export function TourOverview({ tour }: { tour: Tour | null }) {
  const category = tour?.categories?.[0]?.title || tour?.category?.name;
  const destinationCount = tourDestinationCount(tour);
  const duration = tour?.duration || (tour?.duration_in_days ? `${tour.duration_in_days} ${Number(tour.duration_in_days) === 1 ? "Day" : "Days"}` : "");
  const facts = [
    duration ? { type: "duration" as const, label: "Duration", value: duration } : null,
    destinationCount ? { type: "cities" as const, label: "Places", value: `${destinationCount} ${destinationCount === 1 ? "Place" : "Places"}` } : null,
    tour?.type ? { type: "type" as const, label: "Tour style", value: tour.type } : null,
    category ? { type: "category" as const, label: "Category", value: category } : null,
  ].filter((fact): fact is { type: "duration" | "cities" | "type" | "category"; label: string; value: string } => Boolean(fact));
  const hasLogistics = Boolean(tour?.pickup_time || tour?.run);

  return (
    <section className="tour-overview" id="overview" aria-labelledby="tour-overview-title">
      <div className="tour-editorial-heading">
        <h2 id="tour-overview-title">Your journey, clearly mapped</h2>
        <p>The essential shape of the experience before the day-by-day detail.</p>
      </div>

      {facts.length ? <div className="tour-info-grid" role="group" tabIndex={0} aria-label="Tour quick facts">
        {facts.map((fact) => <div className="tour-info-card" key={`${fact.label}-${fact.value}`}>
          <TourInfoIcon type={fact.type} />
          <span className="tour-info-label">{fact.label}</span>
          <span className="tour-info-value">{fact.value}</span>
        </div>)}
      </div> : null}

      {tour?.overview || hasLogistics ? <div className={`tour-overview-body ${hasLogistics ? "has-logistics" : ""}`}>
        {hasLogistics ? <aside className="tour-overview-pickup" aria-label="Tour logistics">
          {tour?.pickup_time ? <div className="tour-overview-card">
            <span>Pick-up time</span>
            <strong>{tour.pickup_time}</strong>
          </div> : null}
          {tour?.run ? <div className="tour-overview-card">
            <span>Tour availability</span>
            <strong>{tour.run}</strong>
          </div> : null}
        </aside> : null}
        {tour?.overview ? (
          <div className="content-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tour.overview) }} />
        ) : null}
      </div> : null}
      </section>
  );
}

function TourInfoIcon({ type }: { type: "duration" | "cities" | "type" | "category" }) {
  const paths = {
    duration: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    cities: <><path d="M5 21v-8l7-4 7 4v8" /><path d="M9 21v-4h6v4M12 3v6" /></>,
    type: <><path d="M4 20V9l8-5 8 5v11" /><path d="M8 20v-6h8v6" /></>,
    category: <><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z" /></>,
  } as const;
  return <svg className="tour-info-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}
