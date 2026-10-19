import { APPROVED_BRAND_LOGO } from "./site-contact";

const imageHosts = new Set([
  "sunpyramidtours.com", "sunpyramidstours.com", "cdn.sunpyramidstours.com", "new-sunpyramids-demo.vercel.app",
  "pub-5ccb6ad334fb427684d7f3fa11a34197.r2.dev",
]);

export function remoteImageURL(source: string): URL | undefined {
  let url: URL;
  try { url = new URL(source); } catch { return; }
  if (url.protocol !== "https:" || !imageHosts.has(url.hostname) || url.port || url.username || url.password) return;
  if (!/\.(avif|jpe?g|png|webp)$/i.test(url.pathname)) return;
  return url;
}

// Approved local brand logo only: the generated variant keeps the exact
// 500:141 source aspect (logo CSS uses height:auto) and lossless-exact alpha
// pixels; wider requests keep the original file.
const logoVariantMaxWidth = 500;

export function responsiveImageSource(source: string, width: number): string {
  if (source === APPROVED_BRAND_LOGO && width <= logoVariantMaxWidth) {
    return "/images/logo-500.webp";
  }
  if (!remoteImageURL(source)) return source;
  return `/media/image?${new URLSearchParams({ url: source, w: String(width) })}`;
}
