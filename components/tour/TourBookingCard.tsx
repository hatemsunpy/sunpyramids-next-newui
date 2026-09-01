"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";
import { optionCost } from "@/components/CustomerFlows";
import { useCurrency } from "@/components/CurrencyProvider";
import { TourBookingAddOns } from "@/components/tour/TourAddOns";
import { useTourActions } from "@/components/tour/TourActions";
import { apiPost } from "@/lib/client-api";
import { parseLocalCalendarDate } from "@/lib/local-date";
import { withLocale } from "@/lib/locales";
import { whatsappInquiryUrl } from "@/lib/site-contact";
import type { Locale, Tour } from "@/types/api";

export function matchingSeason(tour: Tour | null | undefined, dateString?: string) {
  if (!Array.isArray(tour?.seasons)) return null;
  const parsed = parseLocalCalendarDate(dateString);
  if (!parsed) return null;

  return tour!.seasons!.find((season) => {
    const availability = season?.calender_availability;
    if (!availability) return false;
    return (
      availability.day_numbers?.includes(parsed.day) &&
      availability.day_names?.includes(parsed.weekday) &&
      availability.month_names?.includes(parsed.monthName) &&
      availability.years_numbers?.includes(parsed.year)
    );
  }) ?? null;
}

export function TourBookingCard({ tour, locale, selectedOptions, onSelectedOptionsChange }: { tour: Tour | null; locale: Locale; selectedOptions: number[]; onSelectedOptionsChange: (ids: number[]) => void }) {
  const router = useRouter();
  const { format } = useCurrency();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { actionMessage, favoriteTour, shareTour } = useTourActions(tour, locale);

  useEffect(() => {
    const openBookingPanel = () => {
      setMobileOpen(true);
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".tour-field input")?.focus());
    };
    window.addEventListener("tour:open-booking", openBookingPanel);
    return () => window.removeEventListener("tour:open-booking", openBookingPanel);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  // Inquiry tours bypass all booking/pricing logic and render a contact form instead.
  if (tour?.is_inquiry) {
    return (
      <aside className="tour-right-panel">
        <div className="tour-booking-card tour-inquiry-card">
          <h3 className="tour-inquiry-title">Contact Us For Checking Availability</h3>
          <ContactForm locale={locale} tourId={tour?.id} tourTitle={tour?.title} />
        </div>
      </aside>
    );
  }

  const season = matchingSeason(tour, date);
  const source = (season ?? tour) as Tour | null | undefined;
  const groups = Array.isArray(source?.pricing_groups) ? source.pricing_groups : [];
  const group = groups.find((g) => adults >= Number(g?.from) && adults <= Number(g?.to));
  const adultRate = group ? Number(group.price) : Number(source?.adult_price ?? tour?.adult_price ?? tour?.start_from ?? tour?.price ?? 0);
  const childRate = group ? Number(group.child_price) : Number(source?.child_price ?? tour?.child_price ?? 0);
  const infantRate = Number(source?.infant_price ?? tour?.infant_price ?? 0);
  const price = adultRate;
  const offer = Number(tour?.offer || 0);
  const baseTotal = price * adults + childRate * children + infantRate * infants;
  const passengerTotal = offer ? baseTotal - baseTotal * (offer / 100) : baseTotal;
  const optionsTotal = (tour?.options ?? [])
    .filter((option) => option?.id != null && selectedOptions.includes(Number(option.id)))
    .reduce((sum, option) => sum + optionCost(option, adults, children), 0);
  const total = passengerTotal + optionsTotal;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tour?.id) return;
    setStatus("loading");
    try {
      await apiPost(
        "cart/tours/append",
        {
          tour_id: tour.id,
          start_date: date,
          adults,
          children,
          infants,
          options: selectedOptions,
        },
        locale,
        true,
      );
      setStatus("success");
      router.push(withLocale("/cart", locale));
    } catch {
      setStatus("error");
    }
  }

  return (
    <aside className="tour-right-panel">
      <div className={`tour-booking-dialog ${mobileOpen ? "is-open" : ""}`} role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen || undefined} aria-label={mobileOpen ? "Book this tour" : undefined}>
        <button className="tour-booking-backdrop" type="button" onClick={() => setMobileOpen(false)} aria-label="Close booking panel" />
        <div className="tour-booking-card">
          <button className="tour-booking-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close booking panel">×</button>
          <div className="tour-booking-price">
            <div>
              <span className="tour-booking-label">Price</span>
              <strong className="tour-price-current">{format(passengerTotal)}</strong>
              {offer ? <span className="tour-price-original">{format(baseTotal)}</span> : null}
            </div>
            <button type="button" className="btn-outline btn-sm" onClick={shareTour}>
              Share
            </button>
          </div>
          <p className="tour-booking-assurance">Book directly with a local Egypt specialist.</p>

          <form className="tour-booking-form" onSubmit={submit}>
            <label className="tour-field">
              <span>Date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>

            <div className="tour-passengers">
              <span className="tour-booking-label">Passengers</span>
              <Counter label="Adults (12+)" value={adults} onChange={setAdults} min={1} />
              <Counter label="Children (3 - 11)" value={children} onChange={setChildren} />
              <Counter label="Infants (0 - 2)" value={infants} onChange={setInfants} />
            </div>

            {tour?.options?.length ? (
              <TourBookingAddOns options={tour.options} selected={selectedOptions} optionsTotal={optionsTotal} onChange={onSelectedOptionsChange} />
            ) : null}

            <div className="tour-booking-total">
              <span>Total</span>
              <strong>{format(total)}</strong>
            </div>

            <button type="submit" className="btn-primary" disabled={status === "loading"}>
              {status === "loading" ? "Booking..." : "Book now"}
            </button>
            {status === "error" ? <p className="tour-booking-error" role="alert">Something went wrong. Please try again.</p> : null}
          </form>

          <div className="tour-booking-actions">
            <button type="button" className="btn-outline" onClick={favoriteTour}>
              Favorites
            </button>
            <a className="btn-outline" href={whatsappInquiryUrl(`I want to inquire about a tour (${tour?.title})`)} target="_blank" rel="noreferrer">
              Ask a question
            </a>
          </div>
          {actionMessage ? <p className="tour-booking-status" role="status">{actionMessage}</p> : null}
        </div>
      </div>

      <div className="tour-mobile-booking-bar">
        <div><span>Price</span><strong>{format(total)}</strong></div>
        <button type="button" className="btn-primary" onClick={() => setMobileOpen(true)}>Book now</button>
      </div>
    </aside>
  );
}

function Counter({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (value: number) => void; min?: number }) {
  return (
    <div className="tour-counter">
      <span>{label}</span>
      <div className="tour-counter-controls">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Decrease ${label}`}>
          −
        </button>
        <span>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}
