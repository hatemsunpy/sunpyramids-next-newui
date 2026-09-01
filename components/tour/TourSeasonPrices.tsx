import { PriceText } from "@/components/PriceText";
import type { Tour } from "@/types/api";

export function TourSeasonPrices({ seasons }: { seasons: NonNullable<Tour["seasons"]> }) {
  return (
    <section className="tour-seasons">
      <div className="container-shell">
        <div className="tour-section-heading">
          <h2>Tour Prices</h2>
          <p>Choose the travel window and group size that suits your plans.</p>
        </div>
        <div className="tour-season-grid">
          {seasons.map((season, index) => {
            const solo = season.pricing_groups?.find((g) => g.from === 1 && g.to === 1);
            const groups = season.pricing_groups?.filter((g) => !(g.from === 1 && g.to === 1)) ?? [];
            const availability = season.calender_availability || {};
            const months = availability.month_names ?? [];
            const years = availability.years_numbers ?? [];
            const days = availability.day_numbers ?? [];
            const monthLabel = months.map((month) => month.slice(0, 3).replace(/^./, (letter) => letter.toUpperCase())).join(" & ");
            const dayLabel = days.length ? `${Math.min(...days)} - ${Math.max(...days)}` : "";
            const yearLabel = years.join(" & ");
            const seasonLabel = monthLabel
              ? `${dayLabel ? `(${dayLabel}) ` : ""}${monthLabel}${yearLabel ? ` ${yearLabel}` : ""}`
              : season.title || `Season ${index + 1}`;
            return (
              <div key={index} className="tour-season-card">
                <p className="tour-season-date">{seasonLabel}</p>
                {solo ? (
                  <div className="tour-season-row">
                    <span>Solo</span>
                    <strong>
                      <PriceText amount={solo.price} />
                    </strong>
                  </div>
                ) : null}
                {groups.map((g) => (
                  <div key={`${g.from}-${g.to}`} className="tour-season-row">
                    <span>
                      {g.from}-{g.to} PAX
                    </span>
                    <strong>
                      <PriceText amount={g.price} />
                    </strong>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
