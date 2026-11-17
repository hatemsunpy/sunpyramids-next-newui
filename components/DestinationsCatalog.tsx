"use client";

import { useState, type ReactNode } from "react";
import type { DestinationRegion } from "@/components/destination-directory-copy";
import type { Locale } from "@/types/api";
import styles from "@/styles/destinations-directory.module.scss";

export type DestinationCatalogItem = {
  slug: string;
  region: DestinationRegion;
  featured: boolean;
  card: ReactNode;
};

type CatalogLabels = {
  browse: string;
  title: string;
  all: string;
  showing: string;
  regions: Record<DestinationRegion, string>;
};

const regionOrder: readonly DestinationRegion[] = ["middleEast", "africa", "europe"];

export function DestinationsCatalog({ items, labels, locale }: {
  items: DestinationCatalogItem[];
  labels: CatalogLabels;
  locale: Locale;
}) {
  const [region, setRegion] = useState<DestinationRegion | "all">("all");
  const numbers = new Intl.NumberFormat(locale);
  const visible = region === "all" ? items : items.filter((item) => item.region === region);
  const filters = [
    { key: "all" as const, label: labels.all, count: items.length },
    ...regionOrder.map((key) => ({
      key, label: labels.regions[key], count: items.filter((item) => item.region === key).length,
    })).filter(({ count }) => count > 0),
  ];

  return (
    <section className={`${styles.wrap} ${styles.catalog}`} id="all-destinations" aria-labelledby="all-destinations-heading" tabIndex={-1}>
      <header className={styles.catalogHeading}>
        <div>
          <p id="destination-region-label" className={styles.sectionLabel}>{labels.browse}</p>
          <h2 id="all-destinations-heading">{labels.title}</h2>
        </div>
        <p className={styles.resultCount} role="status" aria-atomic="true">
          {labels.showing.replace("{visible}", numbers.format(visible.length)).replace("{total}", numbers.format(items.length))}
        </p>
      </header>
      <div className={styles.regionFilters} role="group" aria-labelledby="destination-region-label">
        {filters.map(({ key, label, count }) => (
          <button type="button" key={key} aria-pressed={region === key} aria-controls="destination-results" onClick={() => setRegion(key)}>
            {label} <span>{numbers.format(count)}</span>
          </button>
        ))}
      </div>
      <ul className={styles.grid} id="destination-results" role="list">
        {visible.map(({ slug, featured, card }) => (
          <li key={slug} className={featured && region === "all" ? styles.featured : undefined}>{card}</li>
        ))}
      </ul>
    </section>
  );
}
