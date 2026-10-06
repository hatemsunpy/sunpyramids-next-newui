export const NAVIGATION_PROGRESS_START = "sunpyramids:navigation-start";

// UI only: do not intercept requests, replace router methods, or change caching.
export function isPageNavigation(href: string, currentHref: string): boolean {
  try {
    const current = new URL(currentHref);
    const destination = new URL(href, current);
    return destination.origin === current.origin &&
      destination.pathname + destination.search !== current.pathname + current.search;
  } catch {
    return false;
  }
}

export function startNavigationProgress(href: string) {
  if (typeof window !== "undefined" && isPageNavigation(href, window.location.href)) {
    window.dispatchEvent(new Event(NAVIGATION_PROGRESS_START));
  }
}
