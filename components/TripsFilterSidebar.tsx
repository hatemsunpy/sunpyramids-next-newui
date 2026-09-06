"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale, TripTaxonomy } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { uiCopy } from "@/lib/ui-copy";

type ActiveFilters = {
  main?: string;
  category?: string;
  destination?: string;
  title?: string;
  order?: string;
  page?: number;
};

export function TripsFilterSidebar({
  taxonomy,
  active = {},
  locale = "en",
  totalResults = 0,
}: {
  taxonomy: TripTaxonomy;
  active?: ActiveFilters;
  locale?: Locale;
  totalResults?: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const copy = uiCopy(locale);
  const tripsPath = withLocale("/trips", locale);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    types: true,
    destinations: true,
    categories: true,
  });
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Body scroll lock and Escape key listener for accessible mobile sheet
  useEffect(() => {
    if (!isDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const triggerElement = triggerRef.current;
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "select:not([disabled])",
      "input:not([disabled])",
      "[tabindex]:not([tabindex=\"-1\"])",
    ].join(",");
    const focusFirstControl = () => {
      const firstControl = drawerRef.current?.querySelector<HTMLElement>(focusableSelector);
      (firstControl || drawerRef.current)?.focus();
    };
    const frame = window.requestAnimationFrame(focusFirstControl);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsDrawerOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const controls = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (controls.length === 0) {
        e.preventDefault();
        drawerRef.current.focus();
        return;
      }
      const firstControl = controls[0];
      const lastControl = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === firstControl) {
        e.preventDefault();
        lastControl.focus();
      } else if (!e.shiftKey && document.activeElement === lastControl) {
        e.preventDefault();
        firstControl.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(frame);
      previouslyFocused?.focus?.();
      triggerElement?.focus();
    };
  }, [isDrawerOpen]);

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  // Helper to build URL query with preserved parameters
  const buildFilterHref = (key: keyof ActiveFilters, value?: string) => {
    const next = {
      main: active.main || "",
      category: active.category || "",
      destination: active.destination || "",
      title: active.title || "",
      order: active.order || "",
    };

    if (key === "main") {
      next.main = next.main === value ? "" : value || "";
      // A root category determines the available child categories; never carry
      // a child ID across a root-category change.
      next.category = "";
    } else if (key === "destination") {
      next.destination = next.destination === value ? "" : value || "";
    } else if (key === "category") {
      next.category = next.category === value ? "" : value || "";
    }

    const params = new URLSearchParams();
    if (next.title) params.set("title", next.title);
    if (next.order) params.set("order", next.order);
    if (next.main) params.set("main", next.main);
    if (next.destination) params.set("destination", next.destination);
    if (next.category) params.set("category", next.category);

    const qs = params.toString();
    return `${tripsPath}${qs ? `?${qs}` : ""}`;
  };

  const clearFilterHref = (keyToRemove: keyof ActiveFilters) => {
    const params = new URLSearchParams();
    if (keyToRemove !== "title" && active.title) params.set("title", active.title);
    if (keyToRemove !== "main" && active.main) params.set("main", active.main);
    if (keyToRemove !== "destination" && active.destination) params.set("destination", active.destination);
    if (keyToRemove !== "category" && active.category) params.set("category", active.category);
    if (active.order) params.set("order", active.order);
    const qs = params.toString();
    return `${tripsPath}${qs ? `?${qs}` : ""}`;
  };

  const handleSortChange = (newOrder: string) => {
    const params = new URLSearchParams();
    if (active.title) params.set("title", active.title);
    if (active.main) params.set("main", active.main);
    if (active.destination) params.set("destination", active.destination);
    if (active.category) params.set("category", active.category);
    if (newOrder) params.set("order", newOrder);
    const qs = params.toString();
    startTransition(() => {
      router.push(`${tripsPath}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  };

  const activeMainCategory = taxonomy.allCategories.find(
    (item) => item.slug === active.main,
  );
  const activeDestination = taxonomy.destinations.find(
    (item) => item.slug === active.destination,
  );
  const activeChildCategory = taxonomy.allCategories.find(
    (item) => String(item.id) === active.category,
  );

  const hasActiveFilters = Boolean(
    active.main || active.destination || active.category || active.title,
  );
  const activeFilterCount = [
    active.main,
    active.destination,
    active.category,
    active.title,
  ].filter(Boolean).length;

  // Filter sections markup shared between desktop sidebar and mobile sheet
  const renderFilterSections = (isMobile = false) => (
    <>
      {/* Tour Types / Main categories */}
      {taxonomy.rootCategories.length > 0 && (
        <div className="discovery-filter-group">
          <button
            type="button"
            className="group-header"
            aria-expanded={openGroups.types}
            onClick={() => toggleGroup("types")}
          >
            <span>{copy.tours || "Tour Types"}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {openGroups.types && (
            <div className="group-items">
              {taxonomy.rootCategories.map((item) => {
                const isSelected = active.main === item.slug;
                const count = item.slug ? taxonomy.counts[item.slug] : undefined;
                return (
                  <Link
                    key={item.id || item.slug}
                    href={buildFilterHref("main", item.slug || "")}
                    onClick={() => isMobile && setIsDrawerOpen(false)}
                    className={`filter-item-link${isSelected ? " is-active" : ""}`}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <span className="item-text">
                      <span className="item-checkbox" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{item.title || item.name}</span>
                    </span>
                    {count !== undefined && <span className="item-count">{count}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Egypt Destinations */}
      {taxonomy.destinations.length > 0 && (
        <div className="discovery-filter-group">
          <button
            type="button"
            className="group-header"
            aria-expanded={openGroups.destinations}
            onClick={() => toggleGroup("destinations")}
          >
            <span>Destinations</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {openGroups.destinations && (
            <div className="group-items">
              {taxonomy.destinations.map((item) => {
                const isSelected = active.destination === item.slug;
                return (
                  <Link
                    key={item.id || item.slug}
                    href={buildFilterHref("destination", item.slug || "")}
                    onClick={() => isMobile && setIsDrawerOpen(false)}
                    className={`filter-item-link${isSelected ? " is-active" : ""}`}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <span className="item-text">
                      <span className="item-checkbox" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{item.title || item.name}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Child Categories */}
      {taxonomy.childCategories.length > 0 && (
        <div className="discovery-filter-group">
          <button
            type="button"
            className="group-header"
            aria-expanded={openGroups.categories}
            onClick={() => toggleGroup("categories")}
          >
            <span>Experience Categories</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {openGroups.categories && (
            <div className="group-items">
              {taxonomy.childCategories.map((item) => {
                const isSelected = active.category === String(item.id);
                return (
                  <Link
                    key={item.id || item.slug}
                    href={buildFilterHref("category", String(item.id || ""))}
                    onClick={() => isMobile && setIsDrawerOpen(false)}
                    className={`filter-item-link${isSelected ? " is-active" : ""}`}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <span className="item-text">
                      <span className="item-checkbox" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{item.title || item.name}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="discovery-filter-shell">
      {/* Top Controls Bar with active count & Mobile Filter button */}
      <div className="discovery-controls-bar">
        <p className="results-headline">
          Showing <strong>{totalResults}</strong> {totalResults === 1 ? "tour" : "tours"}
          {active.title ? ` for "${active.title}"` : ""}
        </p>

        <div className="controls-actions">
          {/* Mobile Filter Trigger */}
          <button
            type="button"
            className="mobile-filter-trigger"
            ref={triggerRef}
            onClick={() => setIsDrawerOpen(true)}
            aria-expanded={isDrawerOpen}
            aria-controls="discovery-mobile-filter"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="badge">{activeFilterCount}</span>}
          </button>

          {/* Sort Control */}
          <div className="sort-control">
            <label htmlFor="trips-sort-select" className="sr-only">
              Sort tours
            </label>
            <select
              id="trips-sort-select"
              value={active.order || "asc"}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="asc">A to Z</option>
              <option value="desc">Z to A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Pills Strip */}
      {hasActiveFilters && (
        <div className="discovery-active-strip" aria-label="Active filters">
          <span className="active-label">Active:</span>

          {active.title && (
            <Link
              href={clearFilterHref("title")}
              className="active-tag"
              title={`Remove search filter "${active.title}"`}
            >
              <span>Search: &ldquo;{active.title}&rdquo;</span>
              <span className="remove-x" aria-hidden="true">&times;</span>
            </Link>
          )}

          {activeMainCategory && (
            <Link
              href={clearFilterHref("main")}
              className="active-tag"
              title={`Remove filter "${activeMainCategory.title || activeMainCategory.name}"`}
            >
              <span>{activeMainCategory.title || activeMainCategory.name}</span>
              <span className="remove-x" aria-hidden="true">&times;</span>
            </Link>
          )}

          {activeDestination && (
            <Link
              href={clearFilterHref("destination")}
              className="active-tag"
              title={`Remove filter "${activeDestination.title || activeDestination.name}"`}
            >
              <span>{activeDestination.title || activeDestination.name}</span>
              <span className="remove-x" aria-hidden="true">&times;</span>
            </Link>
          )}

          {activeChildCategory && (
            <Link
              href={clearFilterHref("category")}
              className="active-tag"
              title={`Remove filter "${activeChildCategory.title || activeChildCategory.name}"`}
            >
              <span>{activeChildCategory.title || activeChildCategory.name}</span>
              <span className="remove-x" aria-hidden="true">&times;</span>
            </Link>
          )}

          <Link href={tripsPath} className="clear-all-link">
            {copy.clearAll || "Clear all"}
          </Link>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="discovery-sidebar" aria-label="Filter tours">
        <div className="sidebar-header">
          <h2>Filters</h2>
          {hasActiveFilters && (
            <Link href={tripsPath} className="reset-btn">
              {copy.clearAll || "Reset"}
            </Link>
          )}
        </div>
        {renderFilterSections(false)}
      </aside>

      {/* Mobile Accessible Sheet / Drawer */}
      <div
        className={`discovery-mobile-backdrop${isDrawerOpen ? " is-open" : ""}`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />
      <div
        id="discovery-mobile-filter"
        className={`discovery-mobile-drawer${isDrawerOpen ? " is-open" : ""}`}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter tours"
        aria-hidden={!isDrawerOpen}
        inert={!isDrawerOpen ? true : undefined}
        tabIndex={-1}
      >
        <div className="drawer-header">
          <h3>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</h3>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close filters"
          >
            &times;
          </button>
        </div>
        <div className="drawer-body">{renderFilterSections(true)}</div>
        <div className="drawer-footer">
          {hasActiveFilters && (
            <Link
              href={tripsPath}
              className="drawer-clear-btn"
              onClick={() => setIsDrawerOpen(false)}
            >
              {copy.clearAll || "Reset"}
            </Link>
          )}
          <button
            type="button"
            className="drawer-apply-btn"
            onClick={() => setIsDrawerOpen(false)}
          >
            {copy.apply || "Apply Filters"}
          </button>
        </div>
      </div>
    </div>
  );
}
