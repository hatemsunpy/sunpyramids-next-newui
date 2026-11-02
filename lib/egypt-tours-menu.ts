import type { ApiPage, TripTaxonomy } from "@/types/api";
import { orderTripleCountryJourneyLast } from "@/components/multi-country/routes";

export type EgyptToursMenuChild = {
  slug: string;
  label: string;
  title?: string;
  featured_image?: string;
};

export type EgyptToursMenu = {
  oneDay: EgyptToursMenuChild[];
  multiDays: EgyptToursMenuChild[];
  nileCruises: EgyptToursMenuChild[];
  multiCountry: EgyptToursMenuChild[];
};

type MenuSource = Pick<TripTaxonomy, "allCategories" | "childCategories" | "destinations"> & {
  counts?: Record<string, number>;
};

const MULTI_DAYS_ROOT_SLUG = "multi-days-tours";
const NILE_CRUISES_ROOT_SLUG = "nile-cruises";
const MULTI_COUNTRY_ROOT_SLUG = "middle-east-tours";

function toChild(page: ApiPage): EgyptToursMenuChild | null {
  const slug = typeof page.slug === "string" ? page.slug.trim() : "";
  if (!slug) return null;
  const title = typeof page.title === "string" ? page.title.trim() : "";
  const name = typeof page.name === "string" ? page.name.trim() : "";
  const label = title || name || slug;
  const featuredImage = typeof page.featured_image === "string" ? page.featured_image.trim() : "";
  return {
    slug,
    label,
    ...(title ? { title } : {}),
    ...(featuredImage ? { featured_image: featuredImage } : {}),
  };
}

/**
 * Normalize the already-fetched trip taxonomy into header menu children.
 *
 * - One Day Tours children reuse `taxonomy.destinations` — the same
 *   `destinations?parent.slug=egypt` dataset rendered by the One Day index
 *   page — preserving backend order and locale translations.
 * - Multi Days Tours children reuse `taxonomy.childCategories` filtered by
 *   the live `multi-days-tours` category id — the same source consumed by
 *   `CategoryChildrenIndex`/`TripsFilterSidebar` — preserving backend order.
 * - Nile Cruises children reuse `taxonomy.childCategories` filtered by
 *   the live `nile-cruises` category id — excluding categories without active tours (e.g. dahabiyat).
 *
 * - Multi Country children are scoped to the live `middle-east-tours`
 *   category id using `taxonomy.allCategories` (a zero-tour parent can be
 *   omitted from `childCategories`), preserving backend order with the
 *   canonical triple-country combination last. The section is empty unless
 *   the API parent record exists.
 *
 * Pure presentation mapping: no fetching or copied production records/IDs.
 */
export function buildEgyptToursMenu(taxonomy: MenuSource | null | undefined): EgyptToursMenu {
  if (!taxonomy) return { oneDay: [], multiDays: [], nileCruises: [], multiCountry: [] };

  const oneDay: EgyptToursMenuChild[] = [];
  for (const destination of taxonomy.destinations ?? []) {
    const child = toChild(destination);
    if (child) oneDay.push(child);
  }

  const root = (taxonomy.allCategories ?? []).find(
    (category) => category.slug === MULTI_DAYS_ROOT_SLUG,
  );
  const multiDays: EgyptToursMenuChild[] = [];
  if (root?.id != null) {
    for (const category of taxonomy.childCategories ?? []) {
      if ((category.parent_id as number | undefined) !== root.id) continue;
      const child = toChild(category);
      if (child) multiDays.push(child);
    }
  }

  const nileRoot = (taxonomy.allCategories ?? []).find(
    (category) => category.slug === NILE_CRUISES_ROOT_SLUG,
  );
  const nileCruises: EgyptToursMenuChild[] = [];
  if (nileRoot?.id != null) {
    for (const category of taxonomy.childCategories ?? []) {
      if ((category.parent_id as number | undefined) !== nileRoot.id) continue;
      // Exclude categories without active tours or subcategories (e.g. dahabiyat)
      const hasSubcategories = (taxonomy.allCategories ?? []).some(
        (cat) => (cat.parent_id as number | undefined) === category.id,
      );
      const hasTours = Boolean(category.slug && (taxonomy.counts?.[category.slug] ?? 0) > 0);
      if (!hasSubcategories && !hasTours && category.slug === "dahabiyat") continue;
      const child = toChild(category);
      if (child) nileCruises.push(child);
    }
  }

  const multiCountryRoot = (taxonomy.allCategories ?? []).find(
    (category) => category.slug === MULTI_COUNTRY_ROOT_SLUG,
  );
  const multiCountry: EgyptToursMenuChild[] = [];
  if (multiCountryRoot?.id != null) {
    for (const category of taxonomy.allCategories ?? []) {
      if ((category.parent_id as number | undefined) !== multiCountryRoot.id) continue;
      const child = toChild(category);
      if (child) multiCountry.push(child);
    }
  }

  return {
    oneDay,
    multiDays,
    nileCruises,
    multiCountry: orderTripleCountryJourneyLast(multiCountry),
  };
}
