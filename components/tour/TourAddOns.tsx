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
    <section className="tour-addons" id="add-ons">
      <TourCollapsible title="Optional experiences" defaultOpen>
        <div className="tour-addon-list">
          {options.map((option) => (
            <label key={option.id} className="tour-addon">
              <input
                type="checkbox"
                value={option.id}
                name="tour_options"
                checked={selected.includes(Number(option.id))}
                onChange={(event) => {
                  const id = Number(option.id);
                  onChange(updatedSelectedOptions(selected, id, event.target.checked));
                }}
              />
              <span className="tour-addon-copy">
                <span className="tour-addon-name">{option.name}</span>
                {option.description ? <span className="tour-addon-description">{option.description}</span> : null}
              </span>
              {option.adult_price !== null && option.adult_price !== undefined && option.adult_price !== "" ? (
                <span className="tour-addon-price">{format(option.adult_price)}</span>
              ) : null}
            </label>
          ))}
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
