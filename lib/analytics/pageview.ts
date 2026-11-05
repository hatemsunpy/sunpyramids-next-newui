// Route page-view signal for tracking v2 (contract "sunpyramids_v2").
//
// The v2 Google tag runs with send_page_view=false, so the app sends every
// page view itself: the initial load AND each SPA navigation, once per
// adjacent navigation. The first signal of a document is the initial load; a
// signal in the SAME location afterwards (rerender, currency update) is
// recorded without emitting; A -> B -> A still yields three events.
// page_referrer is the previous sanitized location after navigation and the
// sanitized document.referrer only on the initial load; page_title is a
// static brand value, never a personal name.

import { pushTrackingEvent, trackingSessionEnabled, TRACKING_PAGE_TITLE } from "./datalayer";
import { sanitizePageLocation } from "./url-privacy";

export type RouteSignal = {
  origin: string;
  pathname: string;
  search: string;
  referrer: string;
};

// Module state survives route changes while the root layout keeps
// RouteAnalytics mounted; a full page load resets it.
let lastLocation: string | null = null;

export function resetAppPageViewTracking(): void {
  lastLocation = null;
}

export function emitRoutePageView(route: RouteSignal): boolean {
  if (!trackingSessionEnabled()) return false;
  const pageLocation = sanitizePageLocation(`${route.origin}${route.pathname}${route.search}`);
  if (!pageLocation) return false;

  const isInitial = lastLocation === null;
  if (!isInitial && pageLocation === lastLocation) return false;

  const referrerSource = isInitial ? route.referrer : lastLocation ?? "";
  const pageReferrer = sanitizePageLocation(referrerSource);

  const payload: Record<string, unknown> = {
    event: "app_page_view",
    page_location: pageLocation,
    page_referrer: pageReferrer,
    page_title: TRACKING_PAGE_TITLE,
  };
  if (!pushTrackingEvent(payload)) return false;
  lastLocation = pageLocation;
  return true;
}
