"use client";

import { startTransition, useEffect } from "react";
import { getImageBlurBatch } from "@/app/actions/image-blur";
import { blurredImageBackground } from "@/lib/image-blur";

const cache = new Map<string, { image: string; expires: number }>();
const candidates = "img, [style*='background'], .home-help-panel, .page-hero, .landing-hero, .blogs-page-hero, .blog-post-hero, .need-help-band .container-shell, .tour-make-trip, .account-hero";

type PendingImage = {
  element: HTMLElement;
  source: string;
  isLoaded: () => boolean;
  apply: (image: string) => void;
  cleanup: () => void;
};

export function ImageBlurEffects() {
  useEffect(() => {
    let disposed = false;
    let busy = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tracked = new Map<HTMLElement, PendingImage>();
    const queued = new Set<PendingImage>();

    function schedule() {
      if (disposed || busy || timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        for (const item of queued) if (item.isLoaded()) queued.delete(item);
        const batch = [...queued].slice(0, 16);
        batch.forEach((item) => queued.delete(item));
        if (!batch.length) return;
        busy = true;
        startTransition(async () => {
          try {
            const previews = await getImageBlurBatch([...new Set(batch.map((item) => item.source))]);
            if (disposed) return;
            for (const item of batch) {
              const preview = previews[item.source];
              if (!preview) continue;
              if (cache.size >= 512) cache.delete(cache.keys().next().value!);
              cache.set(item.source, { image: preview, expires: Date.now() + 300_000 });
              if (tracked.get(item.element) === item && !item.isLoaded()) item.apply(preview);
            }
          } catch {
            // The original image continues loading when a preview is unavailable.
          } finally {
            busy = false;
            schedule();
          }
        });
      }, 30);
    }

    const visibility = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        visibility.unobserve(entry.target);
        const item = tracked.get(entry.target as HTMLElement);
        if (!item || item.isLoaded()) continue;
        const cached = cache.get(item.source);
        if (cached && cached.expires > Date.now()) item.apply(cached.image);
        else queued.add(item);
      }
      schedule();
    }, { rootMargin: "300px" });

    function track(element: HTMLElement) {
      const isImage = element instanceof HTMLImageElement;
      const originalBackground = element.style.backgroundImage;
      const background = isImage ? "" : originalBackground || getComputedStyle(element).backgroundImage;
      const previous = tracked.get(element);
      // Server-rendered banners already include a preview before hydration.
      if (!isImage && element.hasAttribute("data-image-blur-preview")) {
        if (previous) { previous.cleanup(); queued.delete(previous); tracked.delete(element); }
        return;
      }
      const backgroundURL = background.match(/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);
      const source = isImage
        ? element.src || element.currentSrc
        : backgroundURL?.[1] || backgroundURL?.[2] || backgroundURL?.[3]?.trim();
      if (!source || source.startsWith("data:") || source.startsWith("blob:")) return;
      if (previous && background.includes("data:image/svg+xml")) return;
      let url: URL;
      try { url = new URL(source, window.location.origin); } catch { return; }
      if (!/\.(avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)) return;
      const requestSource = url.origin === window.location.origin ? `${url.pathname}${url.search}` : url.href;
      if (previous?.source === requestSource) return;
      if (previous) { previous.cleanup(); queued.delete(previous); tracked.delete(element); }
      const image = isImage ? element : new window.Image();
      if (isImage && image.complete && image.naturalWidth > 0) return;
      let finished = false;
      let appliedBackground = "";
      const restore = () => {
        finished = true;
        visibility.unobserve(element);
        element.classList.remove("site-image-loading");
        element.style.removeProperty("--site-image-blur");
        element.style.removeProperty("--site-image-blur-size");
        if (!isImage && element.style.backgroundImage === appliedBackground) {
          if (originalBackground) element.style.backgroundImage = originalBackground;
          else element.style.removeProperty("background-image");
        }
      };
      const item: PendingImage = {
        element,
        source: requestSource,
        isLoaded: () => finished || (image.complete && image.naturalWidth > 0),
        apply: (preview) => {
          if (isImage) {
            element.style.setProperty("--site-image-blur", blurredImageBackground(preview));
            element.style.setProperty("--site-image-blur-size", getComputedStyle(element).objectFit === "contain" ? "contain" : "cover");
            element.classList.add("site-image-loading");
          } else {
            element.style.backgroundImage = `${background}, ${blurredImageBackground(preview)}`;
            appliedBackground = element.style.backgroundImage;
          }
        },
        cleanup: () => {
          image.removeEventListener("load", restore);
          image.removeEventListener("error", restore);
          restore();
        },
      };
      image.addEventListener("load", restore);
      image.addEventListener("error", restore);
      tracked.set(element, item);
      if (!isImage) image.src = source;
      visibility.observe(element);
    }

    function scan(root: ParentNode) {
      if (root instanceof HTMLElement && root.matches(candidates)) track(root);
      root.querySelectorAll<HTMLElement>(candidates).forEach(track);
    }

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" && record.target instanceof HTMLElement) {
          if (record.attributeName !== "style" || !(record.target instanceof HTMLImageElement)) track(record.target);
        }
        record.addedNodes.forEach((node) => { if (node instanceof HTMLElement) scan(node); });
      }
      for (const [element, item] of tracked) {
        if (!element.isConnected) { item.cleanup(); queued.delete(item); tracked.delete(element); }
      }
    });
    scan(document);
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset", "style"] });
    return () => {
      disposed = true;
      clearTimeout(timer);
      mutations.disconnect();
      visibility.disconnect();
      tracked.forEach((item) => item.cleanup());
      queued.clear();
    };
  }, []);
  return null;
}
