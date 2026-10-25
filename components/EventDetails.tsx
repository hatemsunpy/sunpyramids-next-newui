import type { ReactNode } from "react";
import { parseLocalCalendarDate } from "@/lib/local-date";
import { siteContact } from "@/lib/site-contact";
import type { ApiPage } from "@/types/api";

// Legacy Nuxt brand website (Event/RightPanal/Details.vue). Static approved
// brand content — the API event payload has no website field.
const BRAND_WEBSITE = "https://sunpyramidstours.com";

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Calendar formatting without timezone shift: the API date is an ISO UTC
// timestamp, but "dd/mm/yyyy" must show the date parts carried by the string
// itself (same calendar read as legacy getUTCDate), never the local clock.
function formatEventDate(value: string): string | null {
  const parsed = parseLocalCalendarDate(value);
  if (!parsed || parsed.date.getFullYear() !== parsed.year || parsed.date.getMonth() !== parsed.monthIndex || parsed.date.getDate() !== parsed.day) return null;
  const day = String(parsed.day).padStart(2, "0");
  const month = String(parsed.monthIndex + 1).padStart(2, "0");
  return `${day}/${month}/${parsed.year}`;
}

function DetailIcon({ children, className }: { children: ReactNode; className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type DetailRow = {
  key: string;
  label: string;
  value: ReactNode;
  icon: ReactNode;
};

export function EventDetails({ event }: { event: ApiPage | null }) {
  if (!event) return null;

  const dateRaw = nonEmptyString(event.date);
  const formattedDate = dateRaw ? formatEventDate(dateRaw) : null;
  const status = nonEmptyString(event.status);
  const location = nonEmptyString(event.location);

  if (!formattedDate && !status && !location) return null;

  const phone = siteContact.phones[0];
  const email = siteContact.safeFallbackEmails[0];

  const rows: DetailRow[] = [];
  if (formattedDate) {
    rows.push({
      key: "date",
      label: "Start Date",
      value: <time dateTime={dateRaw ?? undefined}>{formattedDate}</time>,
      icon: (
        <path d="M8 2v4m8-4v4M3.5 8.5h17M4 4h16a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      ),
    });
  }
  if (status) {
    rows.push({
      key: "status",
      label: "Status",
      value: status,
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.5 2.5 2.5 4.5-5" />
        </>
      ),
    });
  }
  if (location) {
    rows.push({
      key: "location",
      label: "Location",
      value: location,
      icon: (
        <>
          <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      ),
    });
  }
  rows.push({
    key: "website",
    label: "Website",
    value: (
      <a href={BRAND_WEBSITE} rel="noreferrer">
        {BRAND_WEBSITE}
      </a>
    ),
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
      </>
    ),
  });
  rows.push({
    key: "phone",
    label: "Phone",
    value: (
      <a href={phone.href}>
        {phone.display}
      </a>
    ),
    icon: (
      <path d="M5 3h4l1.5 4.5-2.2 1.6a12.5 12.5 0 0 0 6.6 6.6l1.6-2.2L21 15v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />
    ),
  });
  rows.push({
    key: "email",
    label: "Email",
    value: (
      <a href={`mailto:${email}`}>
        {email}
      </a>
    ),
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  });

  return (
    <section className="event-details-card">
      <h3 className="event-details-head">Event Details</h3>
      <dl className="event-details-list">
        {rows.map((row) => (
          <div className="event-details-row" key={row.key}>
            <dt>
              <DetailIcon className="event-details-icon">{row.icon}</DetailIcon>
              <span>{row.label}</span>
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Hero facts for the event detail header: same API fields and the same
// calendar formatting rules as the details card, string-validated and
// row-omitted when the API payload has nothing usable to show.
export function EventHeroFacts({ event }: { event: ApiPage | null }) {
  const dateRaw = nonEmptyString(event?.date);
  const formattedDate = dateRaw ? formatEventDate(dateRaw) : null;
  const location = nonEmptyString(event?.location);
  if (!formattedDate && !location) return null;

  return (
    <dl className="event-hero-facts">
      {formattedDate && (
        <div className="event-hero-fact" key="date">
          <dt>
            <DetailIcon className="event-hero-fact-icon"><path d="M8 2v4m8-4v4M3.5 8.5h17M4 4h16a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" /></DetailIcon>
            <span>Date</span>
          </dt>
          <dd>
            <time dateTime={dateRaw ?? undefined}>{formattedDate}</time>
          </dd>
        </div>
      )}
      {location && (
        <div className="event-hero-fact" key="location">
          <dt>
            <DetailIcon className="event-hero-fact-icon"><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></DetailIcon>
            <span>Location</span>
          </dt>
          <dd>{location}</dd>
        </div>
      )}
    </dl>
  );
}
