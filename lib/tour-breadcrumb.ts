import type { Tour, TripTaxonomy } from "@/types/api";

type Category = {
  id?: number;
  parent_id?: number | string | null;
  title?: string;
  name?: string;
  slug?: string;
};

export type TourBreadcrumbCategory = { label: string; slug: string };

function categoryId(value: Category["parent_id"]): number | null {
  if (value == null || value === "") return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Resolve the deepest assigned category through the already-fetched API taxonomy. */
export function tourBreadcrumbCategories(
  tour: Tour | null,
  taxonomy: Pick<TripTaxonomy, "allCategories">,
): TourBreadcrumbCategory[] {
  const allCategories = taxonomy.allCategories as Category[];
  const byId = new Map<number, Category>();
  const bySlug = new Map<string, Category>();
  for (const category of allCategories) {
    if (category.id != null) byId.set(category.id, category);
    if (category.slug) bySlug.set(category.slug, category);
  }

  const assigned: Category[] = [
    ...(tour?.category ? [tour.category] : []),
    ...(tour?.categories ?? []),
  ];
  let best: TourBreadcrumbCategory[] = [];

  for (const assignedCategory of assigned) {
    const taxonomyCategory =
      (assignedCategory.id != null ? byId.get(assignedCategory.id) : undefined)
      ?? (assignedCategory.slug ? bySlug.get(assignedCategory.slug) : undefined);
    let current: Category | undefined = {
      ...taxonomyCategory,
      ...assignedCategory,
      parent_id: assignedCategory.parent_id ?? taxonomyCategory?.parent_id,
    };
    const seen = new Set<number>();
    const lineage: TourBreadcrumbCategory[] = [];

    while (current) {
      const id = categoryId(current.id);
      if (id != null) {
        if (seen.has(id)) break;
        seen.add(id);
      }
      const label = current.title?.trim() || current.name?.trim();
      const slug = current.slug?.trim();
      if (!label || !slug) break;
      lineage.unshift({ label, slug });

      const parentId = categoryId(current.parent_id);
      current = parentId != null && !seen.has(parentId) ? byId.get(parentId) : undefined;
    }

    if (lineage.length > best.length) best = lineage;
  }

  return best;
}
