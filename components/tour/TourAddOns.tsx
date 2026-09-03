"use client";

import { useState } from "react";
import { useCurrency } from "@/components/CurrencyProvider";
import { TourCollapsible } from "@/components/tour/TourCollapsible";
import type { Tour } from "@/types/api";

export function updatedSelectedOptions(selected: number[], optionId: number, checked: boolean) {
  return checked ? [...selected, optionId] : selected.filter((selectedId) => selectedId !== optionId);
}

export function TourAddOns({ options, selected, onChange }: { options: NonNullable<Tour["options"]>; selected: number[]; onChange: (ids: number[]) => void }) {
  const { format } = useCurrency();
  return (
    <section className="tour-addons" id="add-ons" aria-labelledby="tour-addons-title">
      <div className="tour-editorial-heading">
        <h2 id="tour-addons-title">Enhance your experience</h2>
        <p>Tailor your journey with curated private upgrades and special local activities.</p>
      </div>
      <TourCollapsible title="Optional experiences" defaultOpen>
        <div className="tour-addon-list" role="group" aria-label="Optional tour experiences">
          {options.map((option) => {
            const isChecked = selected.includes(Number(option.id));
            return (
              <label key={option.id} className={`tour-addon ${isChecked ? "is-selected" : ""}`}>
                <input
                  type="checkbox"
                  value={option.id}
                  name="tour_options"
                  checked={isChecked}
                  onChange={(event) => {
                    const id = Number(option.id);
                    onChange(updatedSelectedOptions(selected, id, event.target.checked));
                  }}
                />
                <span className="tour-addon-custom-checkbox" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="tour-addon-copy">
                  <span className="tour-addon-header">
                    <span className="tour-addon-name">{option.name}</span>
                    <span className="tour-addon-badge">Optional Upgrade</span>
                  </span>
                  {option.description ? <span className="tour-addon-description">{option.description}</span> : null}
                </span>
                {option.adult_price !== null && option.adult_price !== undefined && option.adult_price !== "" ? (
                  <span className="tour-addon-price">
                    <span className="tour-addon-price-prefix">+</span>
                    {format(option.adult_price)}
                    <span className="tour-addon-price-unit">/ person</span>
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </TourCollapsible>
    </section>
  );
}

export function TourBookingAddOns({ options, selected, optionsTotal, onChange }: { options: NonNullable<Tour["options"]>; selected: number[]; optionsTotal: number; onChange: (ids: number[]) => void }) {
  const { format } = useCurrency();
  const [expanded, setExpanded] = useState(true);
  return (
    <section className="tour-booking-amount" aria-labelledby="tour-booking-amount-title">
      <h4 id="tour-booking-amount-title">Amount</h4>
      <div className="tour-booking-addons-head">
        <div>
          <strong>Add-ons</strong>
          <button type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>{expanded ? "Hide details" : "See details"}</button>
        </div>
        <strong>{format(optionsTotal)}</strong>
      </div>
      {expanded ? (
        <div className="tour-booking-addon-list">
          {options.map((option) => {
            const optionId = Number(option.id);
            return (
              <label key={option.id || option.name}>
                <input type="checkbox" checked={selected.includes(optionId)} onChange={(event) => onChange(updatedSelectedOptions(selected, optionId, event.target.checked))} />
                <span>{option.name}</span>
                {option.adult_price !== null && option.adult_price !== undefined && option.adult_price !== "" ? <strong>{format(option.adult_price)}</strong> : null}
              </label>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
