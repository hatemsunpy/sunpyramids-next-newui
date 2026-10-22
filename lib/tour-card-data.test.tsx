import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TourCard } from "@/components/TourCard";
import { toTourCardData } from "@/lib/tour-card-data";
import type { Tour } from "@/types/api";

function renderMarkup(tour: Tour): string {
  return renderToStaticMarkup(<TourCard tour={tour} locale="en" />);
}

// Synthetic fixtures only. Not production records.
function fullOfferFixture(): Tour {
  return {
    id: 9001,
    slug: "synthetic-card-alpha",
    title: "Synthetic Card Fixture Alpha",
    name: "Synthetic Alpha Name",
    short_description: "Synthetic short summary alpha.",
    description: "Synthetic long description alpha.",
    featured_image: "/synthetic/alpha-featured.webp",
    image: "/synthetic/alpha-image.webp",
    banner: "/synthetic/alpha-banner.webp",
    gallery: ["/synthetic/alpha-gallery-1.webp", "/synthetic/alpha-gallery-2.webp"],
    images: ["/synthetic/alpha-image-1.webp"],
    city: "Synthetic City",
    destination: "Synthetic Destination",
    price: 200,
    start_from: 180,
    adult_price: 190,
    offer: 20,
    offer_end_date: "2030-12-01T00:00:00.000Z",
    duration: "5 Days",
    wishlisted_exists: true,
    category: { id: 7, slug: "synthetic-category", title: "Synthetic Category", name: "Synthetic Category" } as Tour["category"],
    categories: [{ id: 53, slug: "special-offers", title: "Special Offers", name: "Special Offers" }],
    destinations: [
      {
        id: 901,
        title: "Synthetic Place",
        name: "Synthetic Place Name",
        slug: "synthetic-place",
        banner: "/synthetic/place-banner.webp",
        gallery: ["/synthetic/place-gallery.webp"],
        pivot: { tour_id: 9001, destination_id: 901, order: 1 },
        latitude: "27.0",
        longitude: "31.0",
      },
    ],
    // Large unused API fields that TourCard never reads.
    content: "Synthetic unused content body.",
    overview: "Synthetic unused overview.",
    highlights: "Synthetic unused highlights.",
    included: "Synthetic unused included.",
    excluded: "Synthetic unused excluded.",
    child_price: 50,
    infant_price: 10,
    options: [{ id: 1, name: "Synthetic option", adult_price: 10, child_price: 5 }],
    days: [{ id: 1, tour_id: 9001, title: "Synthetic day", description: "Synthetic day body" }],
    seasons: [{ id: 2, title: "Synthetic season" }],
    seo: { meta_title: "Synthetic SEO title" },
    metas: [{ meta_key: "synthetic", meta_value: "synthetic" }],
    social_links: [{ type: "synthetic", url: "https://example.invalid/synthetic" }],
  } as Tour;
}

function fallbackFixture(): Tour {
  return {
    id: 9002,
    slug: "synthetic-card-beta",
    title: "Synthetic Card Fixture Beta",
    price: 120,
  } as Tour;
}

function stringOfferWishlistFixture(): Tour {
  return {
    id: 9003,
    title: "Synthetic Card Fixture Gamma",
    name: "Synthetic Gamma Name",
    description: "Synthetic gamma description.",
    images: ["/synthetic/gamma-image.webp"],
    price: "150",
    offer: "15",
    duration: "3 Days",
    wishlisted_exists: true,
    categories: [{ id: 61, slug: "special-offers", title: "Special Offers" }],
    destinations: [{ id: 903, name: "Synthetic Gamma Place" }],
    content: "Synthetic unused gamma content.",
    overview: "Synthetic unused gamma overview.",
  } as Tour;
}

describe("toTourCardData TourCard markup parity", () => {
  it("renders identical TourCard markup for full vs projected tour with offer, prices, wishlist, and nested taxonomy", () => {
    const full = fullOfferFixture();
    const before = JSON.stringify(full);
    const projected = toTourCardData(full);

    expect(JSON.stringify(full)).toBe(before);
    expect(projected.gallery).toEqual(["/synthetic/alpha-gallery-1.webp", "/synthetic/alpha-gallery-2.webp"]);
    expect(projected.gallery).not.toBe(full.gallery);
    expect(projected.images).toEqual(["/synthetic/alpha-image-1.webp"]);
    expect(projected.images).not.toBe(full.images);
    expect(projected.title).toBe("Synthetic Card Fixture Alpha");
    expect(projected.offer).toBe(20);
    expect(projected.offer_end_date).toBe(full.offer_end_date);
    expect(projected.price).toBe(200);
    expect(projected.wishlisted_exists).toBe(true);
    expect(projected.categories?.[0]?.id).toBe(53);
    expect(projected.destinations?.[0]?.title).toBe("Synthetic Place");

    expect(projected).not.toHaveProperty("content");
    expect(projected).not.toHaveProperty("overview");
    expect(projected).not.toHaveProperty("options");
    expect(projected).not.toHaveProperty("days");
    expect(projected).not.toHaveProperty("seasons");
    expect(projected).not.toHaveProperty("seo");
    const projectedDestination = projected.destinations?.[0] as Record<string, unknown> | undefined;
    expect(projectedDestination).not.toHaveProperty("banner");
    expect(projectedDestination).not.toHaveProperty("gallery");
    expect(projectedDestination).not.toHaveProperty("pivot");

    expect(renderMarkup(projected)).toBe(renderMarkup(full));
    // Dated promotions wait for the browser clock, preserving SSR/hydration parity.
    expect(renderMarkup(projected)).toContain("$200.00");
    expect(renderMarkup(projected)).not.toContain("$160.00");
  });

  it("renders identical TourCard markup for fallback-only tour (image, description, place, category, duration fallbacks)", () => {
    const full = fallbackFixture();
    const before = JSON.stringify(full);
    const projected = toTourCardData(full);

    expect(JSON.stringify(full)).toBe(before);
    expect(projected.title).toBe("Synthetic Card Fixture Beta");
    expect(projected.price).toBe(120);

    const fullHtml = renderMarkup(full);
    expect(renderMarkup(projected)).toBe(fullHtml);
    expect(fullHtml).toContain("Egypt");
    expect(fullHtml).toContain("Flexible");
  });

  it("renders identical TourCard markup for string offer/price with wishlist and name-only destination", () => {
    const full = stringOfferWishlistFixture();
    const before = JSON.stringify(full);
    const projected = toTourCardData(full);

    expect(JSON.stringify(full)).toBe(before);
    expect(projected.offer).toBe("15");
    expect(projected.destinations?.[0]?.name).toBe("Synthetic Gamma Place");
    expect(projected).not.toHaveProperty("content");

    // 15% off $150 renders $127.50.
    expect(renderMarkup(projected)).toBe(renderMarkup(full));
    expect(renderMarkup(projected)).toContain("$127.50");
  });
});
