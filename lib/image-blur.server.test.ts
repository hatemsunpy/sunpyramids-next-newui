// @vitest-environment node
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getImageBlurDataURL } from "./image-blur.server";

afterEach(() => vi.unstubAllGlobals());

describe("API image blur previews", () => {
  it("creates a tiny preview and deduplicates concurrent requests", async () => {
    const image = await sharp({ create: { width: 80, height: 40, channels: 3, background: "#f7951d" } }).png().toBuffer();
    const fetchImage = vi.fn().mockResolvedValue(new Response(new Uint8Array(image), {
      headers: { "content-type": "image/png" },
    }));
    vi.stubGlobal("fetch", fetchImage);
    const src = "https://sunpyramidtours.com/test-blur-success.png";
    const [first, second] = await Promise.all([getImageBlurDataURL(src), getImageBlurDataURL(src)]);
    expect(first).toMatch(/^data:image\/jpeg;base64,/);
    expect(second).toBe(first);
    expect(fetchImage).toHaveBeenCalledTimes(1);
    const metadata = await sharp(Buffer.from(first!.split(",")[1], "base64")).metadata();
    expect(metadata.width).toBe(8);
    expect(metadata.height).toBe(4);
  });

  it("retries failed previews instead of caching an unavailable image", async () => {
    const fetchImage = vi.fn().mockRejectedValue(new Error("Image unavailable"));
    vi.stubGlobal("fetch", fetchImage);
    const src = "https://sunpyramidtours.com/test-blur-retry.png";
    expect(await getImageBlurDataURL(src)).toBeUndefined();
    expect(await getImageBlurDataURL(src)).toBeUndefined();
    expect(fetchImage).toHaveBeenCalledTimes(2);
  });

  it("does not fetch images from an unapproved host", async () => {
    const fetchImage = vi.fn();
    vi.stubGlobal("fetch", fetchImage);
    expect(await getImageBlurDataURL("https://unapproved.example/image.png")).toBeUndefined();
    expect(fetchImage).not.toHaveBeenCalled();
  });
});
