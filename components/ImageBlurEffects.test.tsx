/* eslint-disable @next/next/no-img-element -- Verify native CMS images as well as React image loading. */
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageBlurEffects } from "./ImageBlurEffects";

const { requestPreviews } = vi.hoisted(() => ({ requestPreviews: vi.fn() }));
vi.mock("@/app/actions/image-blur", () => ({ getImageBlurBatch: requestPreviews }));
const preview = "data:image/jpeg;base64,cHJldmlldw==";

beforeEach(() => {
  vi.useFakeTimers();
  requestPreviews.mockReset().mockImplementation(async (sources: string[]) => Object.fromEntries(sources.map((src) => [src, preview])));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    unobserve() {}
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("site-wide image blur", () => {
  it("shows the preview without changing the original source or load handler", async () => {
    const onLoad = vi.fn();
    const { container } = render(<><ImageBlurEffects /><img src="/images/blur-load-test.webp" alt="Test photo" onLoad={onLoad} /></>);
    await act(() => vi.advanceTimersByTimeAsync(40));
    const image = container.querySelector("img")!;
    expect(image).toHaveClass("site-image-loading");
    expect(image.getAttribute("src")).toBe("/images/blur-load-test.webp");
    act(() => image.dispatchEvent(new Event("load")));
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(image).not.toHaveClass("site-image-loading");
    expect(image.style.getPropertyValue("--site-image-blur")).toBe("");
  });

  it("covers every image when more than one request batch is needed", async () => {
    const { container } = render(<><ImageBlurEffects />{Array.from({ length: 20 }, (_, index) => <img key={index} src={`/images/batch-test-${index}.webp`} alt="Test" />)}</>);
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(requestPreviews).toHaveBeenCalledTimes(2);
    expect(container.querySelectorAll("img.site-image-loading")).toHaveLength(20);
  });

  it("processes images added after the page first renders", async () => {
    const { container, rerender } = render(<ImageBlurEffects />);
    rerender(<><ImageBlurEffects /><img src="/images/dynamic-test.webp" alt="New photo" /></>);
    await act(async () => { await Promise.resolve(); await vi.advanceTimersByTimeAsync(100); });
    expect(container.querySelector("img")).toHaveClass("site-image-loading");
  });

  it("requests a new preview when a reused image changes its source", async () => {
    const { container, rerender } = render(<><ImageBlurEffects /><img src="/images/source-before.webp" alt="Photo" /></>);
    await act(() => vi.advanceTimersByTimeAsync(40));
    rerender(<><ImageBlurEffects /><img src="/images/source-after.webp" alt="Photo" /></>);
    await act(async () => { await Promise.resolve(); await vi.advanceTimersByTimeAsync(100); });
    expect(requestPreviews).toHaveBeenLastCalledWith(["/images/source-after.webp"]);
    expect(container.querySelector("img")).toHaveClass("site-image-loading");
  });
});
