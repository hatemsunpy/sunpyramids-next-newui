"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchSelectDropdown } from "@/components/SearchSelectDropdown";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiPage, Locale } from "@/types/api";

interface CategorySubcategoryFilterProps {
  childrenCategories: ApiPage[];
  basePath: string;
  locale?: Locale;
  activeSub?: string;
  currentOrder?: string;
}

export function CategorySubcategoryFilter({
  childrenCategories,
  basePath,
  locale = "en",
  activeSub,
  currentOrder = "display_order,asc",
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

  return (
    <div className="category-sub-filter-bar flex flex-wrap items-center justify-between gap-4 my-6">
      {/* Subcategories pill buttons */}
      <div className="category-sub-pills flex flex-wrap items-center gap-2.5 overflow-x-auto py-1">
        <Link
          href={buildUrl(undefined, currentOrder)}
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

        {childrenCategories.map((child) => {
          const childSlug = child.slug || String(child.id);
          const isActive = activeSub === childSlug || activeSub === String(child.id);
          const targetUrl = isActive
            ? buildUrl(undefined, currentOrder)
            : buildUrl(childSlug, currentOrder);

          return (
            <Link
              key={child.id || child.slug}
              href={targetUrl}
              className={cn(
                "category-sub-pill inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                isActive
                  ? "is-active font-semibold shadow-xs"
                  : "hover:opacity-80"
              )}
            >
              <span>{child.title || child.name}</span>
              {isActive && <X className="h-3.5 w-3.5 opacity-70" />}
            </Link>
          );
        })}
      </div>

      {/* Sort by dropdown */}
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
