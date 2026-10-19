import sharp from "sharp";
import { remoteImageURL } from "@/lib/responsive-image";
import { forgetRemoteImageSource, getRemoteImageSource } from "@/lib/remote-image.server";

export const runtime = "nodejs";

const widths = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]);
const MAX_CACHE_BYTES = 32 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 128;
// Bounds the ENTIRE upstream lifetime: download, buffering, metadata decode,
// and transform share one slot each. A waiter holds no buffers and performs
// no fetch until it owns a slot.
const MAX_CONCURRENT_REQUESTS = 4;
// Bounds unique in-flight work (active slots + queued waiters). Beyond this,
// new unique keys fall back to the same live original URL without caching,
// so an overload spike can never buffer unbounded 12MB payloads.
const MAX_PENDING_REQUESTS = 8;
type CachedImage = { bytes: Buffer; expires: number };
const images = new Map<string, CachedImage>();
const pending = new Map<string, Promise<CachedImage>>();
let cacheBytes = 0;
let activeRequests = 0;
const requestWaiters: Array<() => void> = [];

async function acquireRequestSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return;
  }
  await new Promise<void>((resolve) => requestWaiters.push(resolve));
  // Resumed via direct handoff from releaseRequestSlot: the slot ownership
  // transferred to this waiter, so the count already includes it.
}

function releaseRequestSlot(): void {
  const next = requestWaiters.shift();
  if (next) {
    // Hand the slot to the oldest waiter with no decrement/increment gap,
    // so a newcomer racing in cannot steal the released slot.
    next();
    return;
  }
  activeRequests = Math.max(0, activeRequests - 1);
}

// Internal control-flow signal for the documented fallback below: serve the
// same live original URL (never cached), used for animated input, overload,
// and any upstream/transform failure. GET converts every rejection to that
// redirect, so no caller matches on message strings.
class PreserveOriginal extends Error {}

async function transformImage(original: Buffer, width: number): Promise<Buffer> {
  // A single metadata probe decides the path. Unreadable input throws here
  // and reaches the original-image fallback directly: it is never decoded
  // a second time by a resize attempt.
  const metadata = await sharp(original, { limitInputPixels: 40_000_000 }).metadata();
  // Animated input (multi-page WebP/AVIF/PNG) must keep playing: fall back to
  // the same live original instead of silently flattening to one static frame.
  // GIF/SVG never reach here; request validation already rejects them so the
  // browser keeps serving the original animated file.
  if ((metadata.pages ?? 1) > 1) throw new PreserveOriginal("Animated input preserved as-is");
  return sharp(original, { limitInputPixels: 40_000_000 })
    .rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
}

async function resizeImage(url: URL, width: number): Promise<CachedImage> {
  await acquireRequestSlot();
  try {
    const source = await getRemoteImageSource(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    try {
      const bytes = await transformImage(source.bytes, width);
      return { bytes, expires: source.expires };
    } catch (error) {
      forgetRemoteImageSource(url, source);
      throw error;
    }
  } finally {
    releaseRequestSlot();
  }
}

function cacheImage(key: string, image: CachedImage) {
  const existing = images.get(key);
  if (existing) {
    images.delete(key);
    cacheBytes = Math.max(0, cacheBytes - existing.bytes.length);
  }
  for (const [cachedKey, cached] of images) {
    if (cached.expires <= Date.now() || cacheBytes + image.bytes.length > MAX_CACHE_BYTES || images.size >= MAX_CACHE_ENTRIES) {
      images.delete(cachedKey);
      cacheBytes = Math.max(0, cacheBytes - cached.bytes.length);
    }
  }
  if (image.bytes.length > MAX_CACHE_BYTES) return;
  images.set(key, image);
  cacheBytes += image.bytes.length;
}

async function optimizedImage(url: URL, width: number) {
  const key = `${url.href}:${width}`;
  const cached = images.get(key);
  if (cached && cached.expires > Date.now()) return cached;
  const current = pending.get(key);
  if (current) return current;
  if (pending.size >= MAX_PENDING_REQUESTS) throw new PreserveOriginal("Image service overloaded");
  const request = resizeImage(url, width).then(image => { cacheImage(key, image); return image; });
  pending.set(key, request);
  try { return await request; } finally { pending.delete(key); }
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const url = remoteImageURL(query.get("url") || "");
  const width = Number(query.get("w"));
  if (!url || !widths.has(width)) return new Response("Invalid image request", { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const image = await optimizedImage(url, width);
    const seconds = Math.max(0, Math.floor((image.expires - Date.now()) / 1000));
    return new Response(new Uint8Array(image.bytes), { headers: {
      "Content-Type": "image/webp", "Cache-Control": `public, max-age=${seconds}, s-maxage=${seconds}, must-revalidate`,
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    // Resizing is optional: every failure mode (unreachable upstream, bad
    // payload, unreadable metadata, animated input, overload) falls back to
    // this same live image URL, never to copied production content, and the
    // redirect is never cached. Failures and overloads are never cached, so
    // the next request retries the live source.
    return new Response(null, { status: 302, headers: { Location: url.href, "Cache-Control": "no-store" } });
  }
}
