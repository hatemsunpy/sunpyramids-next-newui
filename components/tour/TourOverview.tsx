import { TourCollapsible } from "@/components/tour/TourCollapsible";
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
  const category = tour?.categories?.[0]?.title || tour?.category?.name || "—";
  const destinationCount = tourDestinationCount(tour);

  return (
    <>
      <section className="tour-info-grid">
        <div className="tour-info-card">
          <TourInfoIcon type="duration" />
          <span className="tour-info-label">Duration</span>
          <span className="tour-info-value">{tour?.duration || `${tour?.duration_in_days || 1} Days`}</span>
        </div>
        <div className="tour-info-card">
          <TourInfoIcon type="cities" />
          <span className="tour-info-label">Cities</span>
          <span className="tour-info-value">{destinationCount} Cities</span>
        </div>
        <div className="tour-info-card">
          <TourInfoIcon type="type" />
          <span className="tour-info-label">Type</span>
          <span className="tour-info-value">{tour?.type || "Private Tour"}</span>
        </div>
        <div className="tour-info-card">
          <TourInfoIcon type="category" />
          <span className="tour-info-label">Category</span>
          <span className="tour-info-value">{category}</span>
        </div>
      </section>

      <section className="tour-overview">
        <TourCollapsible title="Overview" defaultOpen>
          <div className="tour-overview-pickup">
            <div className="tour-overview-card">
              <span>Pick-up Time</span>
              <strong>{tour?.pickup_time || "—"}</strong>
            </div>
            <div className="tour-overview-card">
              <span>Tour availability</span>
              <strong>{tour?.run || "—"}</strong>
            </div>
          </div>
          {tour?.overview ? (
            <div className="content-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(tour.overview) }} />
          ) : null}
        </TourCollapsible>
      </section>
    </>
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
