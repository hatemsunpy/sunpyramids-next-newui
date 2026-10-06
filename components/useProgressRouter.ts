"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { startNavigationProgress } from "@/lib/navigation-progress";

// Keep Next's public router contract; signal only the start of push/replace.
// The persistent bar observes the committed pathname and query to finish.
export function useProgressRouter() {
  const router = useRouter();
  return useMemo(() => ({
    ...router,
    push: (...args: Parameters<typeof router.push>) => {
      startNavigationProgress(args[0]);
      return router.push(...args);
    },
    replace: (...args: Parameters<typeof router.replace>) => {
      startNavigationProgress(args[0]);
      return router.replace(...args);
    },
  }), [router]);
}
