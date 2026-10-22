import type { Tour } from "@/types/api";

/**
 * Pure server -> client projection for TourCard.
 *
 * Keeps only the raw API fields read by `components/TourCard.tsx`
 * (image fallback chain, place/category fallbacks, raw price/offer/expiry,
 * duration, wishlist flag). No truncation, no price/offer precomputation,
 * no fetch/query change. The Laravel API remains the source of truth;
 * this only narrows what the server serializes to the client island.
 */
export function toTourCardData(tour: Tour): Tour {
  return {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    name: tour.name,
    short_description: tour.short_description,
    description: tour.description,
    featured_image: tour.featured_image,
    image: tour.image,
    banner: tour.banner,
    gallery: Array.isArray(tour.gallery) ? [...tour.gallery] : tour.gallery,
    images: Array.isArray(tour.images) ? [...tour.images] : tour.images,
    city: tour.city,
    destination: tour.destination,
    price: tour.price,
    start_from: tour.start_from,
    adult_price: tour.adult_price,
    offer: tour.offer,
    offer_end_date: tour.offer_end_date,
    duration: tour.duration,
    wishlisted_exists: tour.wishlisted_exists,
    category: tour.category ? { ...tour.category } : tour.category,
    categories: Array.isArray(tour.categories)
      ? tour.categories.map((entry) => entry == null ? entry : ({
          id: entry.id,
          slug: entry.slug,
          title: entry.title,
          name: entry.name,
        }))
      : tour.categories,
    destinations: Array.isArray(tour.destinations)
      ? tour.destinations.map((entry) => ({
          id: entry.id,
          title: entry.title,
          name: entry.name,
        }))
      : tour.destinations,
  };
}
