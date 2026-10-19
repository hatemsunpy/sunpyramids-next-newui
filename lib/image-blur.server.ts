import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import sharp from "sharp";
import { forgetRemoteImageSource, getRemoteImageSource } from "@/lib/remote-image.server";

// Cache only derived previews, keyed by the live API image URL, for five minutes.
const previews = new Map<string, { expires: number; value: Promise<string | undefined> }>();
const allowedHosts = new Set([
  "sunpyramidtours.com",
  "sunpyramidstours.com",
  "cdn.sunpyramidstours.com",
  "new-sunpyramids-demo.vercel.app",
  "pub-5ccb6ad334fb427684d7f3fa11a34197.r2.dev",
  "flagcdn.com",
]);

async function createPreview(src: string): Promise<string | undefined> {
  let remote: { url: URL; source: Awaited<ReturnType<typeof getRemoteImageSource>> } | undefined;
  try {
    let bytes: Buffer;
    if (src.startsWith("/") && !src.startsWith("//")) {
      const imageRoot = resolve(process.cwd(), "public");
      const pathname = decodeURIComponent(new URL(src, "https://local.invalid").pathname);
      if (!/\.(avif|gif|jpe?g|png|svg|webp)$/i.test(pathname)) return;
      const imagePath = resolve(imageRoot, `.${pathname}`);
      if (!imagePath.startsWith(`${imageRoot}${sep}`)) return;
      bytes = await readFile(imagePath);
    } else {
      const url = new URL(src);
      if (url.protocol !== "https:" || !allowedHosts.has(url.hostname) || url.username || url.password || url.port) return;
      if (!/\.(avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)) return;
      const source = await getRemoteImageSource(url, {
        cache: "force-cache",
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(3000),
      });
      remote = { url, source };
      bytes = source.bytes;
    }
    if (bytes.length > 12 * 1024 * 1024) return;
    const preview = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate().resize(8, 8, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 40 }).toBuffer();
    return `data:image/jpeg;base64,${preview.toString("base64")}`;
  } catch {
    if (remote) forgetRemoteImageSource(remote.url, remote.source);
    // A preview failure must never replace or prevent the original API image.
    return;
  }
}

export function getImageBlurDataURL(src: string): Promise<string | undefined> {
  const existing = previews.get(src);
  if (existing && existing.expires > Date.now()) return existing.value;
  if (previews.size >= 128) previews.delete(previews.keys().next().value!);
  const value = createPreview(src).then((preview) => {
    if (!preview && previews.get(src)?.value === value) previews.delete(src);
    return preview;
  });
  previews.set(src, { expires: Date.now() + 300_000, value });
  return value;
}

export async function getImageBlurPlaceholders(sources: string[]) {
  const result: Record<string, string> = {};
  const unique = [...new Set(sources.filter(Boolean))];
  for (let index = 0; index < unique.length; index += 4) {
    await Promise.all(unique.slice(index, index + 4).map(async (src) => {
      const preview = await getImageBlurDataURL(src);
      if (preview) result[src] = preview;
    }));
  }
  return result;
}
