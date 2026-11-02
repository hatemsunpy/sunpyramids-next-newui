import type { Tour } from "@/types/api";

// Facts describe the already-fetched page, not the whole paginated collection.
export function collectionDuration(tours: Tour[]) {
  const days = tours.map((tour) => Number(tour.duration_in_days))
    .filter((duration) => Number.isFinite(duration) && duration > 0);
  if (days.length === 0) return null;
  const shortest = Math.min(...days);
  const longest = Math.max(...days);
  return shortest === longest ? String(shortest) : `${shortest}–${longest}`;
}

export function collectionPlaces(tours: Tour[]) {
  const seen = new Set<string>();
  const places: { title: string; image: string }[] = [];
  for (const tour of tours) {
    for (const place of tour.destinations ?? []) {
      const title = (place.title || place.name || "").trim();
      const image = place.featured_image || place.banner;
      const key = (place.slug || title).toLowerCase();
      if (!title || !image || place.enabled === false || seen.has(key)) continue;
      if (places.some((existing) => existing.image === image)) continue;
      seen.add(key);
      places.push({ title, image });
      if (places.length === 4) return places;
    }
  }
  return places;
}
