// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiscoveryHero } from "./DiscoveryHero";

const { getPreview } = vi.hoisted(() => ({ getPreview: vi.fn() }));
vi.mock("@/lib/image-blur.server", () => ({ getImageBlurDataURL: getPreview }));
vi.mock("./DiscoveryHeroDescription", () => ({ DiscoveryHeroDescription: () => null }));

beforeEach(() => getPreview.mockReset());

describe("discovery banner loading", () => {
  it("includes a preview in server HTML before JavaScript or the original image loads", async () => {
    getPreview.mockResolvedValue("data:image/jpeg;base64,cHJldmlldw==");
    const source = "https://sunpyramidstours.com/uploads/current-banner.webp";
    const html = renderToStaticMarkup(await DiscoveryHero({ title: "Culture Tours", bgImage: source }));
    expect(getPreview).toHaveBeenCalledWith(source);
    expect(html).toContain(source);
    expect(html).toContain("data:image/svg+xml");
    expect(html).toContain("feGaussianBlur");
  });

  it("preserves the original image when its preview is unavailable", async () => {
    getPreview.mockResolvedValue(undefined);
    const source = "https://sunpyramidstours.com/uploads/changed-banner.webp";
    const html = renderToStaticMarkup(await DiscoveryHero({ title: "Culture Tours", bgImage: source }));
    expect(html).toContain(source);
    expect(html).not.toContain("data:image/svg+xml");
  });
});
