import Image from "next/image";
import Link from "next/link";
import type { ApiPage, Locale } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { parseLocalCalendarDate, getEventCountdownDays, formatCalendarDate } from "@/lib/local-date";
import { homeCopy, formatEventCountdown } from "@/lib/home-copy";

type Props = {
  event: ApiPage;
  locale?: Locale;
};

export function HomeUpcomingEventCard({ event, locale = "en" }: Props) {
  const title =
    typeof event.title === "string"
      ? event.title
      : typeof event.name === "string"
        ? event.name
        : "";
  const slug = typeof event.slug === "string" ? event.slug : "";
  const dateStr = typeof event.date === "string" ? event.date : undefined;

  // Strict check: do NOT fabricate content; if no valid slug or title, do not render
  if (!slug || !title || title.trim().length === 0) {
    return null;
  }

  const copy = homeCopy(locale);
  const detailHref = withLocale(`/event/${encodeURIComponent(slug)}`, locale);

  const rawImage =
    event.featured_image ||
    event.image ||
    event.banner ||
    "/images/mainBanner.png";
  const image = rawImage.startsWith("http") ? encodeURI(rawImage) : rawImage;

  // Calendar date parsing
  const parsedDate = parseLocalCalendarDate(dateStr);
  const isoDate = parsedDate ? formatCalendarDate(parsedDate.date) : dateStr || "";
  const monthShort = parsedDate
    ? parsedDate.date.toLocaleDateString(locale === "zh" ? "zh-CN" : locale, { month: "short" })
    : "";

  // Countdown calculation based on Africa/Cairo timezone calendar arithmetic
  const countdownDays = getEventCountdownDays(dateStr);
  const countdownLabel = formatEventCountdown(countdownDays, copy);

  const location =
    (typeof event.destination === "object" && event.destination !== null && "name" in event.destination
      ? String(event.destination.name)
      : null) ||
    (typeof event.location === "string" ? event.location : null);

  return (
    <article className="upcoming-event-card-wrapper">
      <Link href={detailHref} className="upcoming-event-card" draggable={false}>
        <div className="upcoming-event-media">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            draggable={false}
          />
          <div className="upcoming-event-gradient" aria-hidden="true" />
        </div>

        {parsedDate && (
          <div className="upcoming-event-date-badge">
            <time dateTime={isoDate}>
              <span className="date-day">{parsedDate.day}</span>
              <span className="date-month">{monthShort}</span>
            </time>
          </div>
        )}

        <div className="upcoming-event-content">
          {location && (
            <span className="upcoming-event-location">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{location}</span>
            </span>
          )}

          <h3 className="upcoming-event-title">{title}</h3>

          {countdownLabel && (
            <div className="upcoming-event-countdown">
              <span className="countdown-pill">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{countdownLabel}</span>
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
