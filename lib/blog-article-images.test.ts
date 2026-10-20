import { describe, expect, it } from "vitest";
import { prepareBlogArticleImages } from "./blog-article-images.server";

const ORIGIN = "https://sunpyramidtours.com";
const CDN = "https://cdn.sunpyramidstours.com";

function originalSrc(name: string, suffix = "") {
  return `${ORIGIN}/storage/media/blogs/test-article/${name}${suffix}`;
}

function cdnSrc(name: string, suffix = "") {
  return `${CDN}/blogs/test-article/${name}${suffix}`;
}

describe("prepareBlogArticleImages", () => {
  it("returns html untouched when it contains no images", () => {
    expect(prepareBlogArticleImages("<p>plain river</p>")).toBe("<p>plain river</p>");
  });

  it("rewrites approved srcs everywhere but defers only the third image onward", () => {
    const html = [
      `<img src="${originalSrc("hero-1.webp")}" width="1000" height="500">`,
      `<img src="${originalSrc("hero-2.jpg")}" width="1000" height="500">`,
      `<img src="${originalSrc("step-3.png")}" width="1000" height="500">`,
      `<img src="${originalSrc("step-4.jpeg")}" width="1000" height="500">`,
      `<img src="${originalSrc("closing-5.avif")}" width="1000" height="500"/>`,
    ].join("");
    const out = prepareBlogArticleImages(html);
    expect(out).toBe(
      `<img src="${cdnSrc("hero-1.webp")}" width="1000" height="500">` +
        `<img src="${cdnSrc("hero-2.jpg")}" width="1000" height="500">` +
        `<img src="${cdnSrc("step-3.png")}" width="1000" height="500" loading="lazy">` +
        `<img src="${cdnSrc("step-4.jpeg")}" width="1000" height="500" loading="lazy">` +
        `<img src="${cdnSrc("closing-5.avif")}" width="1000" height="500" loading="lazy"/>`,
    );
  });

  it("keeps first-two uploads and already-mapped CDN images eager, and leaves already-mapped urls unchanged", () => {
    const html = [
      `<img src="${cdnSrc("lead-6.webp")}" width="1000" height="500">`,
      `<img src="${cdnSrc("second-7.webp")}" width="1000" height="500">`,
      `<img src="${cdnSrc("third-8.webp")}" width="1000" height="500">`,
    ].join("");
    expect(prepareBlogArticleImages(html)).toBe(html);
  });

  it("maps encoded path details and preserves query, hash, and attribute spelling verbatim", () => {
    const html = `<p><img src="${originalSrc("big%20file/done-9.avif", "?v=1&amp;size=full#crop")}" width="1000" height="500"></p>`;
    expect(prepareBlogArticleImages(html)).toBe(
      `<p><img src="${cdnSrc("big%20file/done-9.avif", "?v=1&amp;size=full#crop")}" width="1000" height="500"></p>`,
    );
  });

  it("keeps single-quoted src quoting style while escaping mapped urls back into attributes", () => {
    const html = `<img src='${originalSrc("quote-10.webp", "?v=1&amp;size=full")}' width="1000" height="500">`;
    expect(prepareBlogArticleImages(html)).toBe(
      `<img src='${cdnSrc("quote-10.webp", "?v=1&amp;size=full")}' width="1000" height="500">`,
    );
  });

  it("rewrites unquoted srcs into safely quoted attributes", () => {
    const html = `<img src=https://sunpyramidtours.com/storage/media/blogs/unquoted/river-11.webp?v=1&size=full width="1000" height="500">`;
    expect(prepareBlogArticleImages(html)).toBe(
      `<img src="${CDN}/blogs/unquoted/river-11.webp?v=1&amp;size=full" width="1000" height="500">`,
    );
  });

  it("excludes credentials, ports, http, other paths, mismatched case and bad extensions", () => {
    const excludedSrcs = [
      `https://user:pass@sunpyramidtours.com/storage/media/blogs/creds/pic-12.webp`,
      `https://user@sunpyramidtours.com/storage/media/blogs/user/pic-13.webp`,
      `https://sunpyramidtours.com:8443/storage/media/blogs/port/pic-14.webp`,
      `http://sunpyramidtours.com/storage/media/blogs/plain/pic-15.webp`,
      `${ORIGIN.replace("https:", "http:")}/storage/media/blogs/alt/pic-16.webp`,
      `https://sunpyramidtours.com/storage/media/tours/other/pic-17.webp`,
      `https://sunpyramidtours.com/STORAGE/media/blogs/casing/pic-18.webp`,
      `https://sunpyramidtours.com/storage/media/blogs/document/pic-19.txt`,
      `https://cdn.example.org/storage/media/blogs/elsewhere/pic-20.webp`,
      `data:image/png;base64,AAAA`,
      `/storage/media/blogs/dummy/pic-21.webp`,
    ];
    const html = [
      `<img src="${originalSrc("lead-22.webp")}" width="1000" height="500">`,
      ...excludedSrcs.map((src) => `<img src="${src}" width="1000" height="500">`),
    ].join("");
    const out = prepareBlogArticleImages(html);
    for (const excluded of excludedSrcs) {
      expect(out).toContain(`src="${excluded}"`);
    }
    expect(out).toContain(`src="${cdnSrc("lead-22.webp")}"`);
    expect(out).not.toContain("loading=");
  });

  it("skips tiny tracking pixels entirely", () => {
    const html = [
      `<img src="${originalSrc("lead-23.webp")}" width="1000" height="500">`,
      `<img src="${originalSrc("pixel-beacon.webp")}" width="16" height="16">`,
    ].join("");
    expect(prepareBlogArticleImages(html)).toBe(
      `<img src="${cdnSrc("lead-23.webp")}" width="1000" height="500">` +
        `<img src="${originalSrc("pixel-beacon.webp")}" width="16" height="16">`,
    );
  });

  it("keeps images without both positive integer dimensions above 32 eager", () => {
    const html = [
      `<img src="${originalSrc("lead-24.webp")}" width="1000" height="500">`,
      `<img src="${originalSrc("river-width-25.webp")}" width="1000">`,
      `<img src="${originalSrc("river-zero-26.webp")}" width="1000" height="0">`,
      `<img src="${originalSrc("river-auto-27.webp")}" width="1000" height="auto">`,
      `<img src="${originalSrc("river-blank-28.webp")}" width="1000" height="">`,
    ].join("");
    const out = prepareBlogArticleImages(html);
    expect(out).toContain(`src="${cdnSrc("river-width-25.webp")}"`);
    expect(out).toContain(`src="${cdnSrc("river-zero-26.webp")}"`);
    expect(out).toContain(`src="${cdnSrc("river-auto-27.webp")}"`);
    expect(out).toContain(`src="${cdnSrc("river-blank-28.webp")}"`);
    expect(out).not.toContain("loading=");
  });

  it("keeps srcset-bearing src intact for url rewriting while preserving later lazy eligibility", () => {
    const html = [
      `<img src="${originalSrc("lead-29.webp")}" width="1000" height="500">`,
      `<img src="https://example.com/storage/media/blogs/dummy/pic.webp" width="1000" height="500">`,
      `<img src="${originalSrc("river-set-30.webp")}" srcset="/preview/cd.webp 1x, /retina/hi.webp 2x" width="1000" height="500" alt="bridge" style="width:100%">`,
    ].join("");
    const out = prepareBlogArticleImages(html);
    expect(out).toBe(
      `<img src="${cdnSrc("lead-29.webp")}" width="1000" height="500">` +
        `<img src="https://example.com/storage/media/blogs/dummy/pic.webp" width="1000" height="500">` +
        `<img src="${originalSrc("river-set-30.webp")}" srcset="/preview/cd.webp 1x, /retina/hi.webp 2x" width="1000" height="500" alt="bridge" style="width:100%" loading="lazy">`,
    );
  });

  it("respects explicit loading and high fetchpriority choices regardless of case", () => {
    const html = [
      `<img src="${originalSrc("lead-31.webp")}" width="1000" height="500">`,
      `<img src="${originalSrc("river-priority-32.webp")}" loading="eager" width="1000" height="500">`,
      `<img src="${originalSrc("river-high-33.webp")}" fetchpriority="HIGH" width="1000" height="500">`,
      `<img src="${originalSrc("river-late-34.webp")}" loading="lazy" width="1000" height="500">`,
    ].join("");
    const out = prepareBlogArticleImages(html);
    expect(out).toBe(
      `<img src="${cdnSrc("lead-31.webp")}" width="1000" height="500">` +
        `<img src="${cdnSrc("river-priority-32.webp")}" loading="eager" width="1000" height="500">` +
        `<img src="${cdnSrc("river-high-33.webp")}" fetchpriority="HIGH" width="1000" height="500">` +
        `<img src="${cdnSrc("river-late-34.webp")}" loading="lazy" width="1000" height="500">`,
    );
  });

  it("preserves unrelated html bytes including quoted brackets and fake image markup", () => {
    const html =
      `<section title="old bridge > inside" data-x='<img src="https://sunpyramidtours.com/storage/media/blogs/fake-br/fake.webp" width="900" height="900">'>` +
      `<p>old text</p>` +
      `<img src="${originalSrc("hero-35.webp")}" width="1000" height="500">` +
      `<blockquote fake-img="<img src='not a url' width='900' height='900'>">old quote</blockquote>` +
      `<img src="${originalSrc("brown-36.webp")}" width="1000" height="500">` +
      `</section>`;
    const out = prepareBlogArticleImages(html);
    expect(out).toBe(
      `<section title="old bridge > inside" data-x='<img src="https://sunpyramidtours.com/storage/media/blogs/fake-br/fake.webp" width="900" height="900">'>` +
        `<p>old text</p>` +
        `<img src="${cdnSrc("hero-35.webp")}" width="1000" height="500">` +
        `<blockquote fake-img="<img src='not a url' width='900' height='900'>">old quote</blockquote>` +
        `<img src="${cdnSrc("brown-36.webp")}" width="1000" height="500">` +
        `</section>`,
    );
  });

  it("handles uppercase tags, PRESERVING attribute-name spelling and self-closing slash positions", () => {
    const html = `<IMG SRC="${originalSrc("caps-37.webp")}" WIDTH="640" HEIGHT="480"/><IMG SRC="${originalSrc("caps-38.png")}" WIDTH="640" HEIGHT="480"/><IMG SRC="${originalSrc("caps-39.png")}" WIDTH="640" HEIGHT="480"/>`;
    const out = prepareBlogArticleImages(html);
    expect(out).toBe(
      `<IMG SRC="${cdnSrc("caps-37.webp")}" WIDTH="640" HEIGHT="480"/>` +
        `<IMG SRC="${cdnSrc("caps-38.png")}" WIDTH="640" HEIGHT="480"/>` +
        `<IMG SRC="${cdnSrc("caps-39.png")}" WIDTH="640" HEIGHT="480" loading="lazy"/>`,
    );
  });

  it("does not touch or count images inside inert template contents", () => {
    const html =
      `<div>` +
      `<img src="${originalSrc("lead-40.webp")}" width="800" height="600">` +
      `<img src="${originalSrc("deferred-41.webp")}" width="800" height="600">` +
      `</div>` +
      `<template><img src="${originalSrc("tplHidden-42.webp")}" width="800" height="600"></template>`;
    const out = prepareBlogArticleImages(html);
    expect(out).toBe(
      `<div>` +
        `<img src="${cdnSrc("lead-40.webp")}" width="800" height="600">` +
        `<img src="${cdnSrc("deferred-41.webp")}" width="800" height="600">` +
        `</div>` +
        `<template><img src="${originalSrc("tplHidden-42.webp")}" width="800" height="600"></template>`,
    );
  });

  it("does not touch svg image elements and does not count them toward the eager rule", () => {
    const html =
      `<svg xmlns="http://www.w3.org/2000/svg">` +
      `<image width="600" height="600" href="${originalSrc("icon-43.png")}"/>` +
      `<image width="600" height="600" href="${originalSrc("icon-44.png")}"/>` +
      `</svg>` +
      `<img src="${originalSrc("lead-45.webp")}" width="700" height="700">` +
      `<img src="${originalSrc("deferred-46.webp")}" width="700" height="700">`;
    const out = prepareBlogArticleImages(html);
    expect(out).toBe(
      `<svg xmlns="http://www.w3.org/2000/svg">` +
        `<image width="600" height="600" href="${originalSrc("icon-43.png")}"/>` +
        `<image width="600" height="600" href="${originalSrc("icon-44.png")}"/>` +
        `</svg>` +
        `<img src="${cdnSrc("lead-45.webp")}" width="700" height="700">` +
        `<img src="${cdnSrc("deferred-46.webp")}" width="700" height="700">`,
    );
    expect(out).not.toContain("loading=");
  });
});
