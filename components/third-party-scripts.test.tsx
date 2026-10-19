import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import {
  DIRECT_GA_SRC,
  GA_FALLBACK_TIMEOUT_MS,
  GA_MEASUREMENT_ID,
  GTM_SRC,
  ThirdPartyScripts,
  ensureDirectGaFallback,
  hasGaLibrary,
} from "@/components/ThirdPartyScripts";

declare global {
  interface Window {
    __sunpyramidsGtagQueued?: boolean;
    __sunpyramidsGtmStartPushed?: boolean;
  }
}

function resetThirdPartyDom() {
  document.head
    .querySelectorAll('script[src*="googletagmanager.com"]')
    .forEach((node) => node.remove());
  delete window.__sunpyramidsGtagQueued;
  delete window.__sunpyramidsGtmStartPushed;
  delete window.__sunpyramidsGaFallbackAttempted;
  delete (window as unknown as Record<string, unknown>).dataLayer;
  delete (window as unknown as Record<string, unknown>).gtag;
  window.history.replaceState({}, "", "/");
}

function gtmScript(): HTMLScriptElement | null {
  return document.querySelector(`script[src="${GTM_SRC}"]`);
}

function directGaScripts(): NodeListOf<Element> {
  return document.querySelectorAll(`script[src="${DIRECT_GA_SRC}"]`);
}

beforeEach(() => {
  resetThirdPartyDom();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  resetThirdPartyDom();
});

describe("ThirdPartyScripts GTM-first loading", () => {
  it("keeps StrictMode initialization singular and recovers from GTM failure", () => {
    render(<StrictMode><ThirdPartyScripts /></StrictMode>);
    expect(window.dataLayer).toHaveLength(3);
    expect(document.querySelectorAll(`script[src="${GTM_SRC}"]`)).toHaveLength(1);
    act(() => { gtmScript()!.dispatchEvent(new Event("error")); });
    expect(directGaScripts()).toHaveLength(1);
    expect(window.dataLayer).toHaveLength(3);
  });

  it("matches the exact provider and measurement ID regardless of query order", () => {
    const wrong = document.createElement("script");
    wrong.src = `https://example.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    const prefix = document.createElement("script");
    prefix.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}-OTHER`;
    document.head.append(wrong, prefix);
    expect(hasGaLibrary()).toBe(false);
    const valid = document.createElement("script");
    valid.src = `https://www.googletagmanager.com/gtag/js?cx=c&id=${GA_MEASUREMENT_ID}`;
    document.head.append(valid);
    expect(hasGaLibrary()).toBe(true);
    wrong.remove(); prefix.remove(); valid.remove();
  });

  it("recovers once when the GTM-produced library fails after insertion", () => {
    render(<ThirdPartyScripts />);
    const produced = document.createElement("script");
    produced.src = `${DIRECT_GA_SRC}&cx=c`;
    document.head.append(produced);
    act(() => { vi.advanceTimersByTime(GA_FALLBACK_TIMEOUT_MS + 1); });
    expect(directGaScripts()).toHaveLength(0);
    act(() => { produced.dispatchEvent(new Event("error")); });
    expect(directGaScripts()).toHaveLength(1);
    act(() => {
      produced.dispatchEvent(new Event("error"));
      directGaScripts()[0].dispatchEvent(new Event("error"));
    });
    expect(directGaScripts()).toHaveLength(1);
  });

  it("cleans up timers and listeners when the component unmounts", () => {
    const view = render(<ThirdPartyScripts />);
    const loader = gtmScript()!;
    view.unmount();
    act(() => {
      loader.dispatchEvent(new Event("error"));
      vi.advanceTimersByTime(GA_FALLBACK_TIMEOUT_MS + 1);
    });
    expect(directGaScripts()).toHaveLength(0);
  });
  it("queues the original gtag js/config commands and loads GTM without the direct library", () => {
    render(<ThirdPartyScripts />);

    expect(typeof window.gtag).toBe("function");
    expect(Array.isArray(window.dataLayer)).toBe(true);
    // gtag("js", date) + gtag("config", id) + gtm.start object
    expect(window.dataLayer).toHaveLength(3);
    expect(window.dataLayer[1]).toEqual(["config", GA_MEASUREMENT_ID]);
    expect(window.dataLayer[2]).toMatchObject({ event: "gtm.js" });

    expect(gtmScript()).not.toBeNull();
    // Dedup: the direct library is not a normal loader anymore.
    expect(directGaScripts()).toHaveLength(0);
  });

  it("does not duplicate init, gtm.start, or scripts on remount (StrictMode/remount safety)", () => {
    const first = render(<ThirdPartyScripts />);
    first.unmount();
    render(<ThirdPartyScripts />);

    expect(window.dataLayer).toHaveLength(3);
    expect(document.querySelectorAll(`script[src="${GTM_SRC}"]`)).toHaveLength(1);
    expect(directGaScripts()).toHaveLength(0);
  });

  it("keeps ?no-third-party=1 behavior exact (no scripts, no queue)", () => {
    window.history.replaceState({}, "", "/?no-third-party=1");
    render(<ThirdPartyScripts />);

    expect(gtmScript()).toBeNull();
    expect(directGaScripts()).toHaveLength(0);
    expect((window as unknown as Record<string, unknown>).dataLayer).toBeUndefined();
  });

  it("falls back to the direct library when the GTM script errors", () => {
    render(<ThirdPartyScripts />);
    expect(directGaScripts()).toHaveLength(0);

    const node = gtmScript();
    expect(node).not.toBeNull();
    act(() => {
      node!.dispatchEvent(new Event("error"));
    });

    expect(directGaScripts()).toHaveLength(1);
  });

  it("falls back after the bounded timeout when GTM never produces the Google library", () => {
    render(<ThirdPartyScripts />);
    expect(directGaScripts()).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(GA_FALLBACK_TIMEOUT_MS + 50);
    });

    expect(directGaScripts()).toHaveLength(1);
  });

  it("does not fall back when GTM already produced the cx=c Google library", () => {
    const produced = document.createElement("script");
    produced.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}&cx=c&gtm=4e6a91`;
    produced.async = true;
    document.head.appendChild(produced);

    render(<ThirdPartyScripts />);

    act(() => {
      vi.advanceTimersByTime(GA_FALLBACK_TIMEOUT_MS + 500);
    });

    expect(directGaScripts()).toHaveLength(0);
    produced.remove();
  });

  it("never duplicates an equivalent loader URL", () => {
    const existing = document.createElement("script");
    existing.src = DIRECT_GA_SRC;
    existing.async = true;
    document.head.appendChild(existing);

    expect(hasGaLibrary()).toBe(true);
    expect(ensureDirectGaFallback()).toBe(false);
    expect(directGaScripts()).toHaveLength(1);
  });

  it("detects both the direct and GTM-produced library URLs by measurement ID", () => {
    expect(hasGaLibrary()).toBe(false);

    const cx = document.createElement("script");
    cx.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}&cx=c&gtm=4e6a91`;
    document.head.appendChild(cx);
    expect(hasGaLibrary()).toBe(true);
    cx.remove();

    const direct = document.createElement("script");
    direct.src = DIRECT_GA_SRC;
    document.head.appendChild(direct);
    expect(hasGaLibrary()).toBe(true);
  });
});
