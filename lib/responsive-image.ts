const imageHosts = new Set([
  "sunpyramidtours.com", "sunpyramidstours.com", "new-sunpyramids-demo.vercel.app",
  "pub-5ccb6ad334fb427684d7f3fa11a34197.r2.dev",
]);

export function remoteImageURL(source: string): URL | undefined {
  let url: URL;
  try { url = new URL(source); } catch { return; }
  if (url.protocol !== "https:" || !imageHosts.has(url.hostname) || url.port || url.username || url.password) return;
  if (!/\.(avif|jpe?g|png|webp)$/i.test(url.pathname)) return;
  return url;
}

export function responsiveImageSource(source: string, width: number): string {
  if (!remoteImageURL(source)) return source;
  return `/media/image?${new URLSearchParams({ url: source, w: String(width) })}`;
}
