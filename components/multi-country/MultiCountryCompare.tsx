import Link from "next/link";
import type { Locale, Tour } from "@/types/api";
import { tourPath } from "@/lib/locales";
import { getCompareCopy } from "./compare-copy";

import { MAX_COMPARE_TOURS } from "./comparison-selection";
const MISSING = "\u2014";

type CompareField = "duration" | "type" | "run";

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function tourTitle(tour: Tour): string {
  for (const candidate of [tour.title, tour.name, tour.slug]) {
    if (hasText(candidate)) return candidate.trim();
  }
  return "";
}

function compareCell(tour: Tour, field: CompareField): string {
  const value = tour[field];
  if (hasText(value)) return value.trim();
  return MISSING;
}

export function MultiCountryCompare({ tours, locale }: { tours: Tour[]; locale: Locale }) {
  const eligible = tours
    .filter((tour): tour is Tour & { slug: string } => hasText(tour.slug))
    .slice(0, MAX_COMPARE_TOURS);
  if (eligible.length < 2) return null;

  const copy = getCompareCopy(locale);
  const fields: { label: string; field: CompareField }[] = [
    { label: copy.duration, field: "duration" },
    { label: copy.travelStyle, field: "type" },
    { label: copy.departure, field: "run" },
  ];
  const rows = fields.filter((row) =>
    eligible.some((tour) => hasText(tour[row.field])),
  );
  if (rows.length === 0) return null;

  return (
        <div className="mc-compare-table-wrap" role="region" aria-label={copy.region} tabIndex={0}>
          <table className="mc-compare-table">
            <caption className="sr-only">{copy.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{copy.corner}</th>
                {eligible.map((tour, index) => (
                  <th scope="col" key={`${tour.slug}-${index}`}>{tourTitle(tour)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.field}>
                  <th scope="row">{row.label}</th>
                  {eligible.map((tour, index) => (
                    <td key={`${tour.slug}-${index}`}>{compareCell(tour, row.field)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row">{copy.itineraries}</th>
                {eligible.map((tour, index) => (
                  <td key={`${tour.slug}-${index}`}>
                    <Link href={tourPath(tour.slug, locale)}>{copy.viewItinerary}</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
  );
}
