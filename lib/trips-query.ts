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
  const rawDays = first(searchParams.days).trim();
  const days = /^\d+$/.test(rawDays) ? Number(rawDays) : 0;

  if (category && /^\d+$/.test(category)) {
    query.append("categories.id[]", category);
  } else if (main) {
    const root = taxonomy.allCategories.find((item) => item.slug === main && item.id);
    if (root?.id) {
      // Explicit main must match the Laravel facet count scope: the selected
      // root plus every descendant at any depth. Traverse allCategories by
      // parent_id (childCategories holds only direct children of roots).
      const seen = new Set<string>([String(root.id)]);
      const ids = [String(root.id)];
      const queue: Array<string | number> = [root.id];
      while (queue.length) {
        const current = queue.shift()!;
        for (const item of taxonomy.allCategories) {
          if (!item?.id) continue;
          if ((item as { parent_id?: unknown }).parent_id === current) {
            const id = String(item.id);
            if (!seen.has(id)) {
              seen.add(id);
              ids.push(id);
              queue.push(item.id);
            }
          }
        }
      }
      ids.forEach((id) => query.append("categories.id[]", id));
    }
  } else if (days === 1 && !category) {
    // Verified legacy behavior (Nuxt Trips page): an unqualified days=1
    // (no explicit main or category) resolves to the Day Tour root category,
    // and the duration filter was not sent for one-day tours. When a main or
    // category constraint is explicitly supplied, days stays a pure duration
    // constraint (see duration_in_days below).
    const root = taxonomy.allCategories.find((item) => item.slug === "day-tour" && item.id);
    if (root?.id) {
      const childIds = taxonomy.childCategories
        .filter((item) => item.parent_id === root.id && item.id)
        .map((item) => String(item.id));
      (childIds.length ? childIds : [String(root.id)]).forEach((id) => query.append("categories.id[]", id));
    }
  }

  if (destination) query.append("destinations.slug[]", destination);
  if (title) query.set("title", `*${title}*`);
  if (days > 1 || (days === 1 && (category || main))) query.append("duration_in_days", String(days));

  return { endpoint: `tours?${query.toString()}`, page, main, category, destination, title, days: days > 0 ? days : undefined };
}
