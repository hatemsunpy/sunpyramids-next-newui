"use client";

import { useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { apiGet } from "@/lib/client-api";
import { TourCard } from "@/components/TourCard";
import type { ApiList, Locale, Tour } from "@/types/api";
import { homeCopy } from "@/lib/home-copy";
import { SwipeCarousel } from "@/components/SwipeCarousel";

type Filter = {
  key: string;
  labelKey: string;
  endpoint: string | null;
};

const FILTERS: Filter[] = [
  {
    key: "recommended",
    labelKey: "recommended",
    endpoint: "tours/home?page=1&order_by=display_order,asc&page_limit=8",
  },
  {
    key: "one-day-tours",
    labelKey: "oneDayFilter",
    endpoint:
      "tours/home?page=1&page_limit=8&order_by=display_order,asc&categories.slug%5B%5D=night-tours&categories.slug%5B%5D=one-day-tours&categories.slug%5B%5D=half-day-tour&categories.slug%5B%5D=layover",
  },
  {
    key: "multi-days-tours",
    labelKey: "multiDaysFilter",
    endpoint:
      "tours/home?page_limit=8&page=1&order_by=display_order,asc&categories.id%5B%5D=all&categories.id%5B%5D=48&categories.id%5B%5D=39&categories.id%5B%5D=38&categories.id%5B%5D=12&categories.id%5B%5D=11&categories.id%5B%5D=10&categories.id%5B%5D=9&categories.id%5B%5D=8&categories.id%5B%5D=7&categories.id%5B%5D=6&categories.id%5B%5D=5&categories.id%5B%5D=4&categories.id%5B%5D=3",
  },
  {
    key: "nile-cruises",
    labelKey: "nileCruisesFilter",
    endpoint:
      "tours/home?page_limit=8&page=1&order_by=display_order,asc&categories.id%5B%5D=null&categories.id%5B%5D=26&categories.id%5B%5D=27&categories.id%5B%5D=28",
  },
  {
    key: "shore-excursions",
    labelKey: "shoreExcursionsFilter",
    endpoint:
      "tours/home?page_limit=8&page=1&order_by=display_order,asc&categories.id%5B%5D=all&categories.id%5B%5D=46&categories.id%5B%5D=45&categories.id%5B%5D=44&categories.id%5B%5D=43&categories.id%5B%5D=42&categories.id%5B%5D=23",
  },
];

function listData<T>(response: ApiList<T> | null | undefined): T[] {
  if (Array.isArray(response?.data)) return response.data as T[];
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

export function HomePopularTours({
  initialTours,
  locale = "en",
}: {
  initialTours: Tour[];
  locale?: Locale;
}) {
  const copy = homeCopy(locale);
  const [active, setActive] = useState("recommended");
  const [tours, setTours] = useState<Tour[]>(initialTours);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const cache = useRef<Record<string, Tour[]>>({ recommended: initialTours });

  async function select(next: Filter) {
    if (next.key === active) return;
    setActive(next.key);
    const cached = cache.current[next.key];
    if (cached) {
      setTours(cached);
      return;
    }
    if (!next.endpoint) return;
    setLoading(true);
    setFailed(false);
    try {
      const response = await apiGet<ApiList<Tour>>(next.endpoint, locale, false);
      const items = listData(response);
      cache.current[next.key] = items;
      setTours(items);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <LayoutGroup id="home-popular-tours-tabs">
        <div className="home-filter-pills" role="tablist" aria-label={copy.popularTitle}>
          {FILTERS.map((filter) => {
            const isActive = active === filter.key;
            return (
              <motion.button
                aria-selected={isActive}
                className={`home-filter-tab ${isActive ? "is-active" : ""}`}
                key={filter.key}
                onClick={() => select(filter)}
                role="tab"
                type="button"
                whileTap={{ scale: 0.96 }}
              >
                {isActive && (
                  <motion.span
                    layoutId="popular-tours-active-highlight"
                    className="home-filter-pill-highlight"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 32,
                    }}
                  />
                )}
                <span className="home-filter-pill-label">{copy[filter.labelKey]}</span>
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="home-tour-grid-wrap"
        >
          <SwipeCarousel
            aria-busy={loading}
            ariaLabel={copy.popularTitle}
            aria-live="polite"
            className="grid-cards home-tour-grid"
          >
            {loading
              ? Array.from({ length: 4 }).map((_, index) => <div className="tour-card tour-card-skeleton" key={index} />)
              : failed
                ? <div className="home-filter-empty" role="alert">Tours are temporarily unavailable. Please try again.</div>
              : tours.length
                ? tours.map((tour) => <TourCard key={tour.id || tour.slug} locale={locale} tour={tour} />)
                : <div className="home-filter-empty">No tours are available for this category right now.</div>}
          </SwipeCarousel>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
