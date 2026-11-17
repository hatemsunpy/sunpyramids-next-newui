"use client";

import { ArrowUpRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { whatsappInquiryUrl } from "@/lib/site-contact";

type QuoteLabels = {
  adults: string;
  children: string;
  arrival: string;
  departure: string;
  message: string;
  action: string;
  draft: string;
};

export function JordanQuoteForm({ labels }: { labels: QuoteLabels }) {
  const [arrival, setArrival] = useState("");

  function openInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details = (["adults", "children", "arrival", "departure"] as const).flatMap((field) => {
      const value = form.get(field);
      return value ? [`${labels[field]}: ${value}`] : [];
    });
    const message = [labels.message, ...details].join("\n");
    window.open(whatsappInquiryUrl(message), "_blank", "noopener,noreferrer");
  }

  return (
    <form className="jordan-quote-form" onSubmit={openInquiry} aria-describedby="jordan-quote-draft">
      <div className="jordan-quote-party">
        <label>{labels.adults}<input type="number" name="adults" inputMode="numeric" min={1} /></label>
        <label>{labels.children}<input type="number" name="children" inputMode="numeric" min={0} /></label>
      </div>
      <label>{labels.arrival}<input type="date" name="arrival" value={arrival} onChange={(event) => setArrival(event.currentTarget.value)} /></label>
      <label>{labels.departure}<input type="date" name="departure" min={arrival || undefined} /></label>
      <button type="submit" className="jordan-primary">{labels.action}<ArrowUpRight size={17} aria-hidden="true" /></button>
      <p id="jordan-quote-draft">{labels.draft}</p>
    </form>
  );
}
