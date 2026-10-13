import sharp from "sharp";
import { remoteImageURL } from "@/lib/responsive-image";

export const runtime = "nodejs";

const widths = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]);
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_CACHE_BYTES = 32 * 1024 * 1024;
const TTL_MS = 300_000;
type CachedImage = { bytes: Buffer; expires: number };
const images = new Map<string, CachedImage>();
const pending = new Map<string, Promise<CachedImage>>();
let cacheBytes = 0;

async function sourceBytes(url: URL) {
  const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Image source unavailable");
  if (Number(response.headers.get("content-length")) > MAX_SOURCE_BYTES) throw new Error("Image source too large");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Image source has no body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) return Buffer.concat(chunks);
      size += chunk.value.byteLength;
      if (size > MAX_SOURCE_BYTES) throw new Error("Image source too large");
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
  }
}

async function resizeImage(url: URL, width: number): Promise<CachedImage> {
  const original = await sourceBytes(url);
  const bytes = await sharp(original, { limitInputPixels: 40_000_000 })
    .rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  return { bytes, expires: Date.now() + TTL_MS };
}

function cacheImage(key: string, image: CachedImage) {
  for (const [cachedKey, cached] of images) {
    if (cached.expires <= Date.now() || cacheBytes + image.bytes.length > MAX_CACHE_BYTES || images.size >= 128) {
      images.delete(cachedKey);
      cacheBytes -= cached.bytes.length;
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
    // Resizing is optional: a failure falls back to this same live image,
    // never to copied production content, and the redirect is never cached.
    return new Response(null, { status: 302, headers: { Location: url.href, "Cache-Control": "no-store" } });
  }
}
