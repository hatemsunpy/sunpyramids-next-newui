import { describe, expect, it } from "vitest";
import { remoteImageURL, responsiveImageSource } from "./responsive-image";

describe("responsive image helpers", () => {
  it("recognizes valid remote image URLs from allowed hosts", () => {
    const valid = "https://sunpyramidtours.com/uploads/pyramids.webp";
    const url = remoteImageURL(valid);
    expect(url).toBeDefined();
    expect(url?.hostname).toBe("sunpyramidtours.com");
  });

  it("rejects non-image extensions or disallowed hosts", () => {
    expect(remoteImageURL("https://evil.com/pic.webp")).toBeUndefined();
    expect(remoteImageURL("https://sunpyramidtours.com/script.js")).toBeUndefined();
    expect(remoteImageURL("/local/image.webp")).toBeUndefined();
    expect(remoteImageURL("http://sunpyramidtours.com/pic.webp")).toBeUndefined();
  });

  it("generates /media/image resize proxy URL for allowed sources", () => {
    const source = "https://sunpyramidtours.com/tours/cairo.jpg";
    const result = responsiveImageSource(source, 640);
    expect(result).toBe(`/media/image?url=${encodeURIComponent(source)}&w=640`);
  });

  it("returns unoptimized source unchanged when URL is local or invalid", () => {
    expect(responsiveImageSource("/images/banner.webp", 800)).toBe("/images/banner.webp");
    expect(responsiveImageSource("https://external.example.com/photo.png", 800)).toBe(
      "https://external.example.com/photo.png"
    );
  });

  it.each([256, 384, 500])("serves the approved logo from the exact-aspect variant at width %i", (width) => {
    expect(responsiveImageSource("/images/logo.webp", width)).toBe("/images/logo-500.webp");
  });

  it.each([501, 640, 1920])("keeps the original logo beyond the variant width at width %i", (width) => {
    expect(responsiveImageSource("/images/logo.webp", width)).toBe("/images/logo.webp");
  });

  it("keeps local URLs that are not the exact logo path untouched", () => {
    expect(responsiveImageSource("/images/logo.webp?q=1", 190)).toBe("/images/logo.webp?q=1");
    expect(responsiveImageSource("/images/logos.webp", 190)).toBe("/images/logos.webp");
    expect(responsiveImageSource("/images/banner.webp", 190)).toBe("/images/banner.webp");
  });
});
