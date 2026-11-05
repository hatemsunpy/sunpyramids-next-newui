"use client";

// Root-layout route signal for tracking v2. Renders nothing and does nothing
// unless NEXT_PUBLIC_TRACKING_V2 is enabled. Mounted inside a Suspense
// boundary because useSearchParams requires it during static rendering.

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { emitRoutePageView } from "@/lib/analytics/pageview";

export function RouteAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    emitRoutePageView({
      origin: window.location.origin,
      pathname,
      // Raw self URL: the sanitizer allowlists attribution and drops
      // personal identifiers plus the fragment.
      search: window.location.search,
      referrer: document.referrer,
    });
    // searchParams is a dependency so every applied navigation re-signals;
    // the pageview suppressor drops adjacent duplicates (initial + SPA views).
  }, [pathname, searchParams]);

  return null;
}