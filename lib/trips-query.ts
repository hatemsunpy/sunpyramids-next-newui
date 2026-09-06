import type { TripTaxonomy } from "@/types/api";

export type TripsSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export function tripsRequest(searchParams: TripsSearchParams, taxonomy: TripTaxonomy) {
  const query = new URLSearchParams({ exists: "wishlisted", order_by: "display_order,asc" });
  const main = first(searchParams.main);
  const category = first(searchParams.category);
  const destination = first(searchParams.destination);
  const title = first(searchParams.title).trim();
  const page = Math.max(1, Number(first(searchParams.page)) || 1);

  if (category && /^\d+$/.test(category)) {
    query.append("categories.id[]", category);
  } else if (main) {
    const root = taxonomy.allCategories.find((item) => item.slug === main && item.id);
    if (root?.id) {
      const childIds = taxonomy.childCategories
        .filter((item) => item.parent_id === root.id && item.id)
        .map((item) => String(item.id));
      (childIds.length ? childIds : [String(root.id)]).forEach((id) => query.append("categories.id[]", id));
    }
  }

  if (destination) query.append("destinations.slug[]", destination);
  if (title) query.set("title", `*${title}*`);

  return { endpoint: `tours?${query.toString()}`, page, main, category, destination, title };
}
