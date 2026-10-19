// @vitest-environment node
import sharp from "sharp";
import { afterEach, expect, it, vi } from "vitest";
import { getImageBlurDataURL } from "@/lib/image-blur.server";
import { GET } from "@/app/media/image/route";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

async function png(color: string) {
  return sharp({ create: { width: 128, height: 80, channels: 3, background: color } }).png().toBuffer();
}

function response(bytes: Buffer, date: Date) {
  return new Response(new Uint8Array(bytes), { headers: { "content-type": "image/png", date: date.toUTCString() } });
}

function imageRequest(source: string, width: number) {
  return new Request(`https://local.invalid/media/image?${new URLSearchParams({ url: source, w: String(width) })}`);
}

it.each([
  ["https://sunpyramidtours.com/shared-freshness-test.png"],
  ["https://cdn.sunpyramidstours.com/Home%20Page/shared-freshness-test.png?update=1750000000"],
])("shares preview bytes with responsive widths without extending their original freshness horizon for %s", async (source) => {
  const red = await png("#ff0000");
  const blue = await png("#0000ff");
  vi.useFakeTimers({ toFake: ["Date"] });
  const now = new Date("2026-10-13T15:10:00Z");
  vi.setSystemTime(now);
  const fetchImage = vi.fn().mockResolvedValue(response(red, new Date(now.getTime() - 60_000)));
  vi.stubGlobal("fetch", fetchImage);
  expect(await getImageBlurDataURL(source)).toMatch(/^data:image\/jpeg;base64,/);
  const first = await GET(imageRequest(source, 64));
  expect(first.status).toBe(200);
  expect(first.headers.get("cache-control")).toContain("max-age=240");
  // The preview fetch must preserve the exact source URL, including query.
  expect(String(fetchImage.mock.calls[0][0])).toBe(source);
  expect(fetchImage).toHaveBeenCalledTimes(1);
  vi.setSystemTime(new Date(now.getTime() + 239_000));
  const otherWidth = await GET(imageRequest(source, 32));
  expect(otherWidth.status).toBe(200);
  expect(otherWidth.headers.get("cache-control")).toContain("max-age=1");
  expect(fetchImage).toHaveBeenCalledTimes(1);
  vi.setSystemTime(new Date(now.getTime() + 241_000));
  fetchImage.mockResolvedValue(response(blue, new Date()));
  const refreshed = await GET(imageRequest(source, 64));
  const pixel = await sharp(Buffer.from(await refreshed.arrayBuffer())).raw().toBuffer();
  expect(pixel[2]).toBeGreaterThan(200);
  expect(pixel[0]).toBeLessThan(80);
  expect(fetchImage).toHaveBeenCalledTimes(2);
});

it("does not let a stale preview cache response satisfy a fresh image request", async () => {
  const red = await png("#ff0000");
  const blue = await png("#0000ff");
  vi.useFakeTimers({ toFake: ["Date"] });
  const now = new Date("2026-10-13T15:20:00Z");
  vi.setSystemTime(now);
  const fetchImage = vi.fn()
    .mockResolvedValueOnce(response(red, new Date(now.getTime() - 301_000)))
    .mockResolvedValueOnce(response(blue, now));
  vi.stubGlobal("fetch", fetchImage);
  const source = "https://sunpyramidtours.com/stale-preview-sharing-test.png";
  expect(await getImageBlurDataURL(source)).toMatch(/^data:image\/jpeg;base64,/);
  const fresh = await GET(imageRequest(source, 64));
  const pixel = await sharp(Buffer.from(await fresh.arrayBuffer())).raw().toBuffer();
  expect(fresh.status).toBe(200);
  expect(pixel[2]).toBeGreaterThan(200);
  expect(pixel[0]).toBeLessThan(80);
  expect(fetchImage).toHaveBeenCalledTimes(2);
});
