"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useProgressRouter as useRouter } from "@/components/useProgressRouter";
import { SearchSelectDropdown } from "@/components/SearchSelectDropdown";
import { withLocale } from "@/lib/locales";
import type { Locale } from "@/types/api";
import { multiCountryCopy, multiCountrySortCopy } from "./copy";
import { multiCountryParentPath, subcategoryOrderHref } from "./routes";

// Compact localized heading/count/sort toolbar for journey subcategory
// listings. Counts come only from the API meta that the page already fetched;
// sorting reuses the existing `order` query contract, keeps every other
// current param, and resets pagination.
export function MultiCountrySubcategoryToolbar({
  basePath,
  locale = "en",
  currentOrder = "display_order,asc",
  from,
  to,
  total,
}: {
  basePath: string;
  locale?: Locale;
  currentOrder?: string;
  from: number;
  to: number;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const labels = multiCountryCopy(locale);
  const sortLabels = multiCountrySortCopy(locale);

  const handleOrderChange = (order: string) => {
    router.push(subcategoryOrderHref(basePath, searchParams.toString(), order));
  };

  const sortOptions = [
    { value: "display_order,asc", label: sortLabels.featured },
    { value: "price,asc", label: sortLabels.priceAsc },
    { value: "price,desc", label: sortLabels.priceDesc },
    { value: "slug,asc", label: sortLabels.az },
    { value: "slug,desc", label: sortLabels.za },
  ];

  const countLine = labels.countLine
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{total}", String(total));

  return (
    <div className="mc-sub-toolbar">
      <div className="mc-sub-toolbar-lead">
        <h2 className="mc-sub-results-title" id="mc-results">{labels.results}</h2>
        {total > 0 && <p className="mc-sub-count">{countLine}</p>}
      </div>
      <div className="mc-sub-toolbar-side">
        <Link className="mc-sub-return" href={withLocale(multiCountryParentPath, locale)}>
          <ArrowLeft size={15} aria-hidden="true" />
          <span>{labels.all}</span>
        </Link>
        {total > 0 && (
          <div className="mc-sub-sort">
            <SearchSelectDropdown
              name="order"
              value={currentOrder}
              placeholder={sortLabels.sortBy}
              variant="pill"
              iconType="sort"
              menuTitle={sortLabels.menu}
              options={sortOptions}
              onChange={handleOrderChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
