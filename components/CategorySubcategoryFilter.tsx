"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProgressRouter as useRouter } from "@/components/useProgressRouter";
import { SearchSelectDropdown } from "@/components/SearchSelectDropdown";
import { ArrowUpRight, Check, Route, X } from "lucide-react";
import Image from "@/components/ResponsiveImage";
import { journeyExcerpt } from "@/components/multi-country/excerpt";
import { multiCountryCopy } from "@/components/multi-country/copy";
import { cn } from "@/lib/utils";
import { withLocale } from "@/lib/locales";
import type { ApiPage, Locale } from "@/types/api";

interface CategorySubcategoryFilterProps {
  childrenCategories: ApiPage[];
  basePath: string;
  locale?: Locale;
  activeSub?: string;
  currentOrder?: string;
  variant?: "pills" | "journeys";
}

const JOURNEY_CANONICAL_BASE = "/egypt-tours";
const LAST_JOURNEY_SLUG = "egypt-jordan-turkey-tours";

function journeysOrdered(children: ApiPage[]): ApiPage[] {
  const target = children.find((child) => child.slug === LAST_JOURNEY_SLUG);
  if (!target) return children;
  return [
    ...children.filter((child) => child.slug !== LAST_JOURNEY_SLUG),
    target,
  ];
}

export function CategorySubcategoryFilter({
  childrenCategories,
  basePath,
  locale = "en",
  activeSub,
  currentOrder = "display_order,asc",
  variant = "pills",
}: CategorySubcategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!childrenCategories || childrenCategories.length === 0) {
    return null;
  }

  const buildUrl = (sub?: string, order?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // reset page on filter change
    if (sub && sub !== "all") {
      params.set("sub", sub);
    } else {
      params.delete("sub");
    }
    if (order && order !== "display_order,asc") {
      params.set("order", order);
    } else {
      params.delete("order");
    }
    const str = params.toString();
    return str ? `${basePath}?${str}` : basePath;
  };

  const handleOrderChange = (newOrder: string) => {
    router.push(buildUrl(activeSub, newOrder));
  };

  const sortOptions = [
    { value: "display_order,asc", label: "Featured" },
    { value: "price,asc", label: "Lowest Price" },
    { value: "price,desc", label: "Highest Price" },
    { value: "slug,asc", label: "A to Z" },
    { value: "slug,desc", label: "Z to A" },
  ];

  const isAllActive = !activeSub || activeSub === "all";
  const isJourneys = variant === "journeys";
  const orderedChildren = isJourneys ? journeysOrdered(childrenCategories) : childrenCategories;
  const labels = multiCountryCopy(locale);

  return (
    <div className={cn("category-sub-filter-bar flex flex-wrap items-center justify-between gap-4 my-6", isJourneys && "mc-journey-selector")}>
      {isJourneys && (
        <div className="mc-chooser-heading" id="country-combinations">
          <h2>{labels.choose}</h2>
          <p>{labels.chooseHint}</p>
        </div>
      )}
      {/* Subcategories pill buttons */}
      <div className="category-sub-pills flex flex-wrap items-center gap-2.5 overflow-x-auto py-1">
        {!isJourneys && (
          <Link
            href={buildUrl(undefined, currentOrder)}
            aria-current={isAllActive ? "true" : undefined}
            className={cn(
              "category-sub-pill inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all",
              isAllActive
                ? "is-active font-semibold shadow-xs"
                : "hover:opacity-80"
            )}
          >
            <span>All</span>
            {isAllActive && <X className="h-3.5 w-3.5 opacity-70" />}
          </Link>
        )}

        {orderedChildren.map((child) => {
          const childSlug = child.slug || String(child.id);
          const isActive = activeSub === childSlug || activeSub === String(child.id);
          const targetUrl = isJourneys
            ? withLocale(`${JOURNEY_CANONICAL_BASE}/${encodeURIComponent(childSlug)}`, locale)
            : isActive
              ? buildUrl(undefined, currentOrder)
              : buildUrl(childSlug, currentOrder);
          const description = child.short_description || child.description?.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || child.description || child.content;
          const image = child.featured_image || child.image || child.banner;

          return (
            <Link
              key={child.id || child.slug}
              href={targetUrl}
              aria-label={isJourneys ? (child.title || child.name) : undefined}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "category-sub-pill inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                isJourneys && "mc-journey-card",
                isActive
                  ? "is-active font-semibold shadow-xs"
                  : "hover:opacity-80"
              )}
            >
              {isJourneys ? (
                <>
                  {image && <div className="mc-journey-photo"><Image src={image} alt="" fill sizes="(max-width: 760px) 100vw, 50vw" /></div>}
                  <div className="mc-card-top"><Route size={24} aria-hidden="true" />{isActive && <Check size={21} aria-hidden="true" />}</div>
                  <h3>{child.title || child.name}</h3>
                  {description && <p className="mc-card-description">{journeyExcerpt(description)}</p>}
                  <div className="mc-card-action"><span>{labels.explore}</span><ArrowUpRight size={20} aria-hidden="true" /></div>
                </>
              ) : (
                <><span>{child.title || child.name}</span>{isActive && <X className="h-3.5 w-3.5 opacity-70" />}</>
              )}
            </Link>
          );
        })}
      </div>

      {/* Sort by dropdown */}
      {isJourneys && <h2 className="mc-results-title" id="mc-tour-results">{labels.results}</h2>}
      <div className="category-sub-sort shrink-0 min-w-[150px]">
        <SearchSelectDropdown
          name="order"
          value={currentOrder}
          placeholder="Sort by"
          variant="pill"
          iconType="sort"
          menuTitle="Sort Experiences"
          options={sortOptions}
          onChange={handleOrderChange}
        />
      </div>
    </div>
  );
}
