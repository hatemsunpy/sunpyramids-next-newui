"use client";

import { useEffect } from "react";

// Public IDs are unchanged. GTM is the normal Google-library loader because the
// published container already contains Google tag 163 for the same measurement
// ID (see docs/performance/gtm-review-2026-10-14.md). The direct gtag/js URL
// below is only a bounded fallback, not a second normal loader.
export const GA_MEASUREMENT_ID = "G-NKZ6W32C4J";
export const GTM_CONTAINER_ID = "GTM-KDF33T7";
export const GTM_SRC = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
export const DIRECT_GA_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
// Bounded fallback window. It does not delay normal tracking: GTM still loads
// immediately. It only bounds how long we wait for GTM's Google tag to produce
// its gtag library before adding the direct fallback script once.
export const GA_FALLBACK_TIMEOUT_MS = 2500;
const failedGaScripts = new WeakSet<HTMLScriptElement>();

function isThirdPartyDisabled() {
  return new URLSearchParams(window.location.search).get("no-third-party") === "1";
}

// GTM loads the same library with extra query params
// (gtag/js?id=G-...&cx=c&gtm=...). Any script whose src contains the exact
// measurement-ID loader counts as the expected Google library.
function isGaLibrary(node: HTMLScriptElement) {
  try {
    const url = new URL(node.src);
    return url.protocol === "https:" && url.hostname === "www.googletagmanager.com"
      && url.pathname === "/gtag/js" && url.searchParams.get("id") === GA_MEASUREMENT_ID;
  } catch {
    return false;
  }
}

export function hasGaLibrary(root: ParentNode = document) {
  return [...root.querySelectorAll<HTMLScriptElement>("script[src]")]
    .some((node) => isGaLibrary(node) && !failedGaScripts.has(node));
}

function hasExactScript(src: string) {
  return [...document.querySelectorAll<HTMLScriptElement>(`script[src="${src}"]`)]
    .some((node) => !failedGaScripts.has(node));
}

function appendScript(src: string) {
  if (hasExactScript(src)) return;
  const node = document.createElement("script");
  node.src = src;
  node.async = true;
  document.head.appendChild(node);
}

function ensureGtagStub() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  return window.gtag;
}

function isGtagInitQueued() {
  return window.__sunpyramidsGtagQueued === true;
}

function pushGtmStartSent() {
  return window.__sunpyramidsGtmStartPushed === true;
}

// Queues the original gtag js/config commands exactly once per page load so
// StrictMode double-effects and client remounts cannot emit duplicate
// initialization events. The commands themselves are unchanged and still run
// inside the same mount effect below.
function queueGtagInitOnce() {
  const gtag = ensureGtagStub();
  if (isGtagInitQueued()) return;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
  window.__sunpyramidsGtagQueued = true;
}

function pushGtmStartOnce() {
  if (pushGtmStartSent()) return;
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  window.__sunpyramidsGtmStartPushed = true;
}

// Bounded resilient fallback. Adds the direct gtag library only when the
// expected Google library is absent, and never duplicates an equivalent loader
// URL. Returns true when the fallback script was added.
export function ensureDirectGaFallback(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (isThirdPartyDisabled()) return false;
  if (hasGaLibrary()) return false;
  if (window.__sunpyramidsGaFallbackAttempted) return false;
  window.__sunpyramidsGaFallbackAttempted = true;
  appendScript(DIRECT_GA_SRC);
  return hasExactScript(DIRECT_GA_SRC);
}

export function ThirdPartyScripts() {
  useEffect(() => {
    if (isThirdPartyDisabled()) return;

    queueGtagInitOnce();
    pushGtmStartOnce();

    let fallbackTimer: number | undefined;

    const existingGtm = document.querySelector<HTMLScriptElement>(`script[src="${GTM_SRC}"]`);
    const node = existingGtm || document.createElement("script");
    const onGtmError = () => {
      window.clearTimeout(fallbackTimer);
      ensureDirectGaFallback();
    };
    const onLibraryError = (event: Event) => {
      const script = event.target;
      if (!(script instanceof HTMLScriptElement) || !isGaLibrary(script)) return;
      failedGaScripts.add(script);
      ensureDirectGaFallback();
    };
    // A failed library node can remain in the DOM. Its presence must not
    // suppress recovery, and a failed fallback must not create a retry loop.
    document.addEventListener("error", onLibraryError, true);
    node.addEventListener("error", onGtmError);
    if (!existingGtm) {
      node.src = GTM_SRC;
      node.async = true;
      document.head.appendChild(node);
    }
    if (!hasGaLibrary()) {
      fallbackTimer = window.setTimeout(ensureDirectGaFallback, GA_FALLBACK_TIMEOUT_MS);
    }

    return () => {
      window.clearTimeout(fallbackTimer);
      node.removeEventListener("error", onGtmError);
      document.removeEventListener("error", onLibraryError, true);
    };
  }, []);

  return null;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    __sunpyramidsGtagQueued?: boolean;
    __sunpyramidsGtmStartPushed?: boolean;
    __sunpyramidsGaFallbackAttempted?: boolean;
  }
}
