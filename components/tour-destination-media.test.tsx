import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TourHighlights } from "@/components/tour/TourHighlights";
import { TourHighlightsDestinations } from "@/components/tour/TourHighlightsDestinations";
import type { Tour } from "@/types/api";

afterEach(cleanup);

const banner = "https://sunpyramidstours.com/images/destination/banner.jpg";
const phoneBanner = "https://sunpyramidstours.com/images/destination/phone-banner.jpg";
const featuredImage = "https://sunpyramidstours.com/images/destination/featured.jpg";
const galleryImage = "https://sunpyramidstours.com/images/gallery/first.jpg";

function highlightsTour(fields: Record<string, unknown>): Tour {
  return {
    destinations: [
      { id: 7, slug: "giza-highlights", title: "Giza Highlights", enabled: true, featured: true, ...fields },
    ],
  };
}

function renderStories(tour: Tour) {
  const { container } = render(<TourHighlightsDestinations tour={tour} locale="en" />);
  return container.querySelectorAll(".tour-destination-story-item");
}

describe("tour highlight destination media", () => {
  it("shows the highlights text together with the destinations and map entry", () => {
    const tour = { ...highlightsTour({ featured_image: featuredImage }), highlights: "<p>See the desert at sunset.</p>" };
    render(<TourHighlights tour={tour} locale="en" />);

    expect(screen.getByText("See the desert at sunset.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Giza Highlights" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Explore all destinations/ })).toBeVisible();
  });

  it("uses only the destination featured_image when banner alternatives also exist", () => {
    const items = renderStories(highlightsTour({ banner, phone_banner: phoneBanner, featured_image: featuredImage, gallery: [galleryImage] }));
    const itemsArray = Array.from(items);
    expect(itemsArray).toHaveLength(1);
    const mediaImages = itemsArray[0].querySelectorAll(".tour-destination-story-media img");
    expect(mediaImages).toHaveLength(1);
    expect(mediaImages[0]).toHaveAttribute("data-image-source", featuredImage);
    expect(Array.from(itemsArray[0].querySelectorAll("img")).map((image) => image.getAttribute("data-image-source"))).not.toContain(banner);
    expect(Array.from(itemsArray[0].querySelectorAll("img")).map((image) => image.getAttribute("data-image-source"))).not.toContain(phoneBanner);
    expect(Array.from(itemsArray[0].querySelectorAll("img")).map((image) => image.getAttribute("data-image-source"))).not.toContain(galleryImage);
  });

  it("keeps a readable image-free story tile when no featured_image exists", () => {
    const items = renderStories(highlightsTour({ banner, phone_banner: phoneBanner, featured_image: null }));
    const itemsArray = Array.from(items);
    expect(itemsArray[0].querySelectorAll("img")).toHaveLength(0);
    expect(itemsArray[0].className).not.toContain("has-image");
    expect(itemsArray[0].querySelector(".tour-destination-story-media")).toBeNull();
    expect(itemsArray[0].textContent).toContain("Giza Highlights");
  });
});
