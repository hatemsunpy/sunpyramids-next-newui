"use client";

import { useEffect } from "react";
import {
  ensureTrackingContract,
  isTrackingV2,
} from "@/lib/analytics/datalayer";
import { emitRoutePageView } from "@/lib/analytics/pageview";
import { isUnessentialOptOut, isDocumentSensitive } from "@/lib/analytics/url-privacy";

// Public IDs are unchanged. GTM is the normal Google-library loader because the
// published container already contains Google tag 163 for the same measurement
// ID (see docs/performance/gtm-review-2026-10-14.md); the direct gtag/js URL is
// only a bounded fallback, not a second normal loader.
export const GA_MEASUREMENT_ID = "G-NKZ6W32C4J";
export const GTM_CONTAINER_ID = "GTM-KDF33T7";
export const GTM_SRC = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
export const DIRECT_GA_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
// Fallback delay bound only; normal tracking never waits on it.
export const GA_FALLBACK_TIMEOUT_MS = 2500;
const failedGaScripts = new WeakSet<HTMLScriptElement>();

function isThirdPartyDisabled() {
  return isUnessentialOptOut();
}

// GTM loads the same library with extra query params (gtag/js?id=G-...), so
// any gtag/js script carrying the exact measurement ID is the expected library.
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
  try {
    const gtag = ensureGtagStub();
    if (isGtagInitQueued()) return;
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID);
    window.__sunpyramidsGtagQueued = true;
  } catch {
    // Analytics init must never break the page; a remount re-runs the calls.
  }
}

function pushGtmStartOnce(): boolean {
  try {
    if (pushGtmStartSent()) return true;
    if (isTrackingV2()) {
      // Shared initializer: the v2 contract and explicit sanitized initial page
      // fields precede gtm.start, so the container can branch on a single
      // sender and no consumer sees missing or raw page defaults. A false
      // return means the queue cannot be established - do not continue as if
      // initialized; the sent marker stays unset so a remount retries.
      if (!ensureTrackingContract()) return false;
    }
    const queue = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(queue)) {
      queue.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      window.__sunpyramidsGtmStartPushed = true;
      return true;
    }
  } catch {
    // A hostile or throwing queue must not break the page render.
  }
  return false;
}

// Bounded resilient fallback. Adds the direct gtag library only when the
// expected Google library is absent, and never duplicates an equivalent loader
// URL. Returns true when the fallback script was added.
export function ensureDirectGaFallback(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  // Same fail-closed document decision as the effect below: a document that
  // arrived with sensitive parameters never gets the fallback library either.
  if (isDocumentSensitive()) return false;
  if (isThirdPartyDisabled()) return false;
  // Tracking v2 keeps a single GA4 sender: no parallel direct stream and no
  // replay of queued events when the container recovers late.
  if (isTrackingV2()) return false;
  if (hasGaLibrary()) return false;
  if (window.__sunpyramidsGaFallbackAttempted) return false;
  window.__sunpyramidsGaFallbackAttempted = true;
  appendScript(DIRECT_GA_SRC);
  return hasExactScript(DIRECT_GA_SRC);
}

export function ThirdPartyScripts() {
  useEffect(() => {
    // Sensitive documents (?name/?email/?otp/?token arrivals) never load any
    // third-party library or analytics queue. The decision was captured by
    // url-privacy at module load - before any parameter-consuming effect (e.g.
    // ThankfulGreeting's ?name strip) could scrub the URL - and is shared by
    // this loader, the fallback and the v2 producers, fail-closed.
    if (isDocumentSensitive()) return;
    if (isThirdPartyDisabled()) return;

    // Tracking v2 sends every page view from the app (send_page_view=false);
    // the initial load view is emitted here before the container is appended.
    if (isTrackingV2()) {
      emitRoutePageView({
        origin: window.location.origin,
        pathname: window.location.pathname,
        search: window.location.search,
        referrer: document.referrer,
      });
    } else {
      queueGtagInitOnce();
    }
    if (!pushGtmStartOnce()) return;

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
