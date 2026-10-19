// @vitest-environment node
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/media/image/route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function imageResponse(bytes: Buffer, contentType = "image/png") {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { "content-type": contentType },
  });
}

async function solidPng(width: number, height: number, background: string) {
  return sharp({ create: { width, height, channels: 3, background } }).png().toBuffer();
}

async function meanChannels(webp: Buffer) {
  const { data, info } = await sharp(webp).raw().toBuffer({ resolveWithObject: true });
  const pixels = info.width * info.height;
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < pixels; i += 1) {
    r += data[i * info.channels];
    g += data[i * info.channels + 1];
    b += data[i * info.channels + 2];
  }
  return { r: r / pixels, g: g / pixels, b: b / pixels };
}

// Tiny generated 2-frame 1x1 GIF (no production assets): frames differ only
// in palette index; used to mint an animated WebP fixture via sharp below.
function twoFrameGif(): Buffer {
  return Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
    0x00, 0x00, 0x00, 0xff, 0xff, 0xff,
    0x21, 0xf9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0x02, 0x02, 0x44, 0x01, 0x00,
    0x21, 0xf9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0x02, 0x02, 0x4c, 0x01, 0x00, 0x3b,
  ]);
}

function requestFor(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return new Request(`https://local.invalid/media/image?${query}`);
}

describe("media image service", () => {
  it("rejects forbidden hosts, protocols, credentials, extensions, and widths", async () => {
    const valid = "https://sunpyramidtours.com/valid-reject.png";
    const cases: Record<string, string>[] = [
      { url: "https://evil.example/photo.webp", w: "640" },
      { url: "https://evil.cdn.sunpyramidstours.com/photo.webp", w: "640" },
      { url: "http://sunpyramidtours.com/photo.webp", w: "640" },
      { url: "https://user:pass@sunpyramidtours.com/photo.webp", w: "640" },
      { url: "https://sunpyramidtours.com:8080/photo.webp", w: "640" },
      { url: "https://sunpyramidtours.com/script.js", w: "640" },
      { url: "https://sunpyramidtours.com/photo.gif", w: "640" },
      { url: "https://sunpyramidtours.com/photo.svg", w: "640" },
      { url: valid, w: "999" },
      { url: valid, w: "0" },
      { url: "", w: "640" },
    ];
    for (const params of cases) {
      const response = await GET(requestFor(params));
      expect(response.status).toBe(400);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
  });

  it("serves actually resized output dimensions via the transform service", async () => {
    const original = await solidPng(800, 500, "#163a96");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse(original)));
    const source = `https://sunpyramidtours.com/resize-${Date.now()}.png`;
    const response = await GET(requestFor({ url: source, w: "256" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    const output = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(output).metadata();
    expect(metadata.format).toBe("webp");
    // A passthrough would still be 800x500; the service must downscale.
    expect(metadata.width).toBe(256);
    expect(metadata.height).toBe(160);
  });

  it("serves resized bytes and shares concurrent requests for the same source", async () => {
    const bytes = await solidPng(128, 80, "#163a96");
    const fetchImage = vi.fn().mockResolvedValue(imageResponse(bytes));
    vi.stubGlobal("fetch", fetchImage);
    const source = `https://sunpyramidtours.com/concurrent-${Date.now()}.png`;
    const [first, second] = await Promise.all([
      GET(requestFor({ url: source, w: "64" })),
      GET(requestFor({ url: source, w: "64" })),
    ]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers.get("Content-Type")).toBe("image/webp");
    expect(first.headers.get("Cache-Control")).toContain("public");
    expect((await first.arrayBuffer()).byteLength).toBeGreaterThan(0);
    // Same URL+width requested concurrently shares one upstream fetch.
    expect(fetchImage).toHaveBeenCalledTimes(1);
    const third = await GET(requestFor({ url: source, w: "64" }));
    expect(third.status).toBe(200);
    expect(fetchImage).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["https://sunpyramidtours.com/ttl-refresh.png"],
    ["https://cdn.sunpyramidstours.com/Home%20Page/ttl-refresh.png?update=1750000000"],
  ])("refreshes the cached entry after the five-minute TTL with fresh pixels for %s", async (source) => {
    const red = await solidPng(800, 500, "#ff0000");
    const blue = await solidPng(800, 500, "#0000ff");
    const fetchImage = vi.fn().mockResolvedValue(imageResponse(red));
    vi.stubGlobal("fetch", fetchImage);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      const first = await GET(requestFor({ url: source, w: "256" }));
      expect(first.status).toBe(200);
      const firstMean = await meanChannels(Buffer.from(await first.arrayBuffer()));
      expect(firstMean.r).toBeGreaterThan(200);
      // Within TTL the cached bytes are reused without refetching.
      vi.setSystemTime(new Date("2026-01-01T00:04:00.000Z"));
      const cached = await GET(requestFor({ url: source, w: "256" }));
      expect(cached.status).toBe(200);
      expect(fetchImage).toHaveBeenCalledTimes(1);
      // Past the 300s TTL the same URL is fetched again and pixels change.
      vi.setSystemTime(new Date("2026-01-01T00:05:01.000Z"));
      fetchImage.mockResolvedValue(imageResponse(blue));
      const refreshed = await GET(requestFor({ url: source, w: "256" }));
      expect(refreshed.status).toBe(200);
      expect(fetchImage).toHaveBeenCalledTimes(2);
      const refreshedMean = await meanChannels(Buffer.from(await refreshed.arrayBuffer()));
      expect(refreshedMean.b).toBeGreaterThan(200);
      expect(refreshedMean.r).toBeLessThan(80);
      // Upstream receives the exact source URL: encoded path and query preserved.
      expect(String(fetchImage.mock.calls[fetchImage.mock.calls.length - 1][0])).toBe(source);
    } finally {
      vi.useRealTimers();
    }
  });

  it("bounds concurrent upstream work and sheds overload to the same original", async () => {
    const bytes = await solidPng(128, 80, "#163a96");
    // Overlap counter: incremented when an upstream fetch starts, decremented
    // when its promise settles. No deferred promises, no timing assumptions.
    let inFlight = 0;
    let peak = 0;
    const fetchImage = vi.fn().mockImplementation(() => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      return Promise.resolve(imageResponse(bytes)).then((response) => {
        inFlight -= 1;
        return response;
      });
    });
    vi.stubGlobal("fetch", fetchImage);
    const sources = Array.from(
      { length: 12 },
      (_, index) => `https://sunpyramidtours.com/bound-${Date.now()}-${index}.png`,
    );
    const promises = sources.map((url) => GET(requestFor({ url, w: "64" })));
    // Registration is synchronous: the first 8 unique keys create pending
    // entries (4 slot owners + 4 queued waiters holding no buffers) while the
    // last 4 exceed the pending cap and shed load. Fetch overlap below proves
    // waiters perform no fetch until a slot is handed to them.
    const results = await Promise.all(promises);
    const ok = results.filter((response) => response.status === 200);
    const shed = results.filter((response) => response.status === 302);
    expect(ok).toHaveLength(8);
    // At most 4 upstream fetches ever overlapped while 8 unique images were
    // in flight; without the bound the peak would be 8.
    expect(peak).toBe(4);
    // Overload sheds to the same live original URL, never cached, never copied.
    expect(shed).toHaveLength(4);
    for (const [index, response] of shed.entries()) {
      expect(response.headers.get("Location")).toBe(sources[8 + index]);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
    // Every served image fetched its source exactly once (same-key sharing
    // is covered separately; here each 200 fetched once, each 302 never did).
    expect(fetchImage).toHaveBeenCalledTimes(8);
  });

  it("preserves animated input by falling back to the same original", async () => {
    const gif = twoFrameGif();
    expect((await sharp(gif, { animated: true }).metadata()).pages).toBe(2);
    const animatedWebp = await sharp(gif, { animated: true }).webp().toBuffer();
    // Self-validating fixture: the mocked upstream payload is truly animated.
    expect((await sharp(animatedWebp).metadata()).pages).toBe(2);
    const fetchImage = vi.fn().mockResolvedValue(imageResponse(animatedWebp, "image/webp"));
    vi.stubGlobal("fetch", fetchImage);
    const source = `https://sunpyramidtours.com/animated-${Date.now()}.webp`;
    const first = await GET(requestFor({ url: source, w: "64" }));
    expect(first.status).toBe(302);
    expect(first.headers.get("Location")).toBe(source);
    expect(first.headers.get("Cache-Control")).toBe("no-store");
    // The animated fallback is never cached: the live source is retried.
    const second = await GET(requestFor({ url: source, w: "64" }));
    expect(second.status).toBe(302);
    expect(fetchImage).toHaveBeenCalledTimes(2);
  });

  it("falls back to the same live original without caching the failure", async () => {
    const fetchImage = vi.fn().mockRejectedValue(new Error("upstream down"));
    vi.stubGlobal("fetch", fetchImage);
    const source = `https://sunpyramidtours.com/fallback-${Date.now()}.png`;
    const first = await GET(requestFor({ url: source, w: "64" }));
    expect(first.status).toBe(302);
    expect(first.headers.get("Location")).toBe(source);
    expect(first.headers.get("Cache-Control")).toBe("no-store");
    const second = await GET(requestFor({ url: source, w: "64" }));
    expect(second.status).toBe(302);
    // Failures are never cached, so the source is retried (still live-owned).
    expect(fetchImage).toHaveBeenCalledTimes(2);
  });

  it("falls back when the upstream payload is not an image", async () => {
    const bytes = await solidPng(128, 80, "#163a96");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse(bytes, "text/html")));
    const source = `https://sunpyramidtours.com/not-image-${Date.now()}.png`;
    const response = await GET(requestFor({ url: source, w: "64" }));
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(source);
  });
});
