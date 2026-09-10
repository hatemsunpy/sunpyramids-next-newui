"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ApiPage, Locale } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { parseLocalCalendarDate } from "@/lib/local-date";
import { homeCopy } from "@/lib/home-copy";

type HomeUpcomingEventsProps = {
  events?: ApiPage[];
  locale?: Locale;
};

function formatEventDate(dateString?: string, locale: Locale = "en") {
  if (!dateString) return null;
  const parsed = parseLocalCalendarDate(dateString);
  if (!parsed) return null;

  try {
    const monthShort = parsed.date.toLocaleDateString(locale, { month: "short" });
    const fullDate = parsed.date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return {
      day: parsed.day,
      month: monthShort,
      year: parsed.year,
      fullDate,
    };
  } catch {
    return {
      day: parsed.day,
      month: parsed.monthName.slice(0, 3).toUpperCase(),
      year: parsed.year,
      fullDate: `${parsed.day} ${parsed.monthName} ${parsed.year}`,
    };
  }
}

function EventCard({ event, locale }: { event: ApiPage; locale: Locale }) {
  const copy = homeCopy(locale);
  const slug = event.slug || String(event.id || "");
  const href = withLocale(`/event/${encodeURIComponent(slug)}`, locale);
  const title = event.title || event.name || "Egypt Event";
  const image =
    event.featured_image ||
    event.banner ||
    event.image ||
    "/images/mainBanner.png";
  const location = typeof event.location === "string" ? event.location : "";
  const dateInfo = typeof event.date === "string" ? formatEventDate(event.date, locale) : null;

  return (
    <article className="event-card-v2">
      <Link href={href} className="event-card-v2__link" aria-label={title}>
        <div className="event-card-v2__media">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 380px"
            loading="lazy"
          />
          <div className="event-card-v2__gradient" />
          {dateInfo ? (
            <div className="event-card-v2__date-badge" aria-label={dateInfo.fullDate}>
              <span className="event-card-v2__date-day">{dateInfo.day}</span>
              <span className="event-card-v2__date-month">{dateInfo.month}</span>
              <span className="event-card-v2__date-year">{dateInfo.year}</span>
            </div>
          ) : null}
        </div>

        <div className="event-card-v2__body">
          {location ? (
            <p className="event-card-v2__location">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{location}</span>
            </p>
          ) : null}

          <h3 className="event-card-v2__title">{title}</h3>

          <div className="event-card-v2__footer">
            <span className="event-card-v2__cta">
              {copy.exploreEvent || "Explore Event"}
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function HomeUpcomingEvents({ events = [], locale = "en" }: HomeUpcomingEventsProps) {
  const copy = homeCopy(locale);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const hasEvents = events && events.length > 0;
  const isCarousel = events.length > 3;

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollPrev(scrollLeft > 4);
    setCanScrollNext(scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();
    const handleScroll = () => updateScrollState();
    track.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateScrollState, events.length]);

  const scroll = (direction: "prev" | "next") => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector(".event-card-v2") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 20 : 380;
    const delta = direction === "next" ? cardWidth : -cardWidth;
    track.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (!hasEvents) return null;

  return (
    <section className="home-section container-shell home-events-section" aria-label={copy.upcomingEventsTitle}>
      <div className="home-events-header">
        <div className="section-heading-v2">
          <div>
            <h2>{copy.upcomingEventsTitle}</h2>
            {copy.upcomingEventsDescription ? <p>{copy.upcomingEventsDescription}</p> : null}
          </div>
        </div>

        <div className="home-events-actions">
          <Link className="section-heading-link" href={withLocale("/events", locale)}>
            {copy.seeMore}
            <span aria-hidden="true">↗</span>
          </Link>

          {isCarousel ? (
            <div className="home-events-nav" aria-label="Events carousel navigation">
              <button
                type="button"
                className="home-events-nav-btn home-events-nav-btn--prev"
                onClick={() => scroll("prev")}
                disabled={!canScrollPrev}
                aria-label="Previous events"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="home-events-nav-btn home-events-nav-btn--next"
                onClick={() => scroll("next")}
                disabled={!canScrollNext}
                aria-label="Next events"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        ref={trackRef}
        className={`home-events-track ${isCarousel ? "home-events-track--carousel" : "home-events-track--grid"}`}
        role={isCarousel ? "region" : undefined}
        aria-label={isCarousel ? copy.upcomingEventsTitle : undefined}
        tabIndex={isCarousel ? 0 : undefined}
      >
        {events.map((event) => (
          <EventCard key={event.id || event.slug} event={event} locale={locale} />
        ))}
      </div>
    </section>
  );
}
