type ImageSource = { bytes: Buffer; expires: number };
type ImageReadOptions = { cache: "force-cache" | "no-store"; next?: NextFetchRequestConfig; signal: AbortSignal };
type ImageSourceStore = {
  entries: Map<string, ImageSource>;
  pending: Map<string, Promise<ImageSource>>;
  byteCount: number;
};

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_CACHE_BYTES = 32 * 1024 * 1024;
const TTL_MS = 300_000;
// Next route handlers and RSC bundles must share the same fresh source bytes.
const imageGlobals = globalThis as typeof globalThis & { sunpyramidsImageSources?: ImageSourceStore };
const sources = imageGlobals.sunpyramidsImageSources ??= { entries: new Map(), pending: new Map(), byteCount: 0 };

async function readImageBytes(response: Response) {
  if (Number(response.headers.get("content-length")) > MAX_BYTES) throw new Error("Image source too large");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Image source has no body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) return Buffer.concat(chunks);
      size += chunk.value.byteLength;
      if (size > MAX_BYTES) throw new Error("Image source too large");
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
  }
}

function sourceExpiry(response: Response, options: ImageReadOptions) {
  const now = Date.now();
  if (options.cache === "no-store") return now + TTL_MS;
  // A Next Data Cache response may already be old. Missing, expired or
  // implausible origin dates cannot populate the shared fresh-byte cache.
  const originDate = Date.parse(response.headers.get("date") || "");
  if (!Number.isFinite(originDate) || originDate > now + 5000) return now;
  return Math.min(now + TTL_MS, originDate + TTL_MS);
}

function rememberSource(key: string, source: ImageSource) {
  if (source.expires <= Date.now()) return;
  const existing = sources.entries.get(key);
  if (existing) {
    sources.entries.delete(key);
    sources.byteCount -= existing.bytes.length;
  }
  for (const [cachedKey, cached] of sources.entries) {
    if (cached.expires <= Date.now() || sources.byteCount + source.bytes.length > MAX_CACHE_BYTES || sources.entries.size >= 128) {
      sources.entries.delete(cachedKey);
      sources.byteCount -= cached.bytes.length;
    }
  }
  sources.entries.set(key, source);
  sources.byteCount += source.bytes.length;
}

async function fetchImageSource(url: URL, options: ImageReadOptions): Promise<ImageSource> {
  const response = await fetch(url, { ...options, redirect: "error" });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Image source unavailable");
  const expires = sourceExpiry(response, options);
  const bytes = await readImageBytes(response);
  const source = { bytes, expires };
  rememberSource(url.href, source);
  return source;
}

/** Callers validate the URL against their existing approved image hosts. */
export async function getRemoteImageSource(url: URL, options: ImageReadOptions): Promise<ImageSource> {
  const cached = sources.entries.get(url.href);
  if (cached && cached.expires > Date.now()) return cached;
  // Cache policy is part of the in-flight key: a stale force-cache response
  // must never satisfy a fresh no-store request.
  const key = `${url.href}:${options.cache}`;
  const pending = sources.pending.get(key);
  if (pending) return pending;
  if (sources.pending.size >= 16) throw new Error("Image source service overloaded");
  const request = fetchImageSource(url, options);
  sources.pending.set(key, request);
  try { return await request; } finally { sources.pending.delete(key); }
}

export function forgetRemoteImageSource(url: URL, source: ImageSource) {
  if (sources.entries.get(url.href) !== source) return;
  sources.entries.delete(url.href);
  sources.byteCount -= source.bytes.length;
}
