"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isPageNavigation, NAVIGATION_PROGRESS_START } from "@/lib/navigation-progress";

export function NavigationLoadingBar() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const [phase, setPhase] = useState<"idle" | "loading" | "complete">("loading");
  const [progress, setProgress] = useState(12);
  const committedHref = useRef("");
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tick.current) clearInterval(tick.current);
    if (hide.current) clearTimeout(hide.current);
    if (watchdog.current) clearTimeout(watchdog.current);
    tick.current = hide.current = watchdog.current = null;
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setPhase("loading");
    setProgress(12);
    // This is an indeterminate navigation hint, not a download percentage.
    tick.current = setInterval(() => setProgress((value) => value + (90 - value) * 0.08), 240);
    // A canceled navigation must not leave a permanent stripe on the screen.
    watchdog.current = setTimeout(() => {
      clearTimers();
      setPhase("idle");
    }, 120_000);
  }, [clearTimers]);

  const complete = useCallback(() => {
    clearTimers();
    setProgress(100);
    setPhase("complete");
    hide.current = setTimeout(() => setPhase("idle"), 300);
  }, [clearTimers]);

  useEffect(() => {
    committedHref.current = window.location.href;
    complete();
  }, [pathname, query, complete]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        event.defaultPrevented || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self") ||
        link.getAttribute("aria-disabled") === "true" || link.relList.contains("external")) return;
      if (isPageNavigation(link.href, window.location.href)) start();
    };
    const onPopState = () => {
      if (isPageNavigation(window.location.href, committedHref.current)) start();
    };
    const onSubmit = (event: SubmitEvent) => {
      if (event.defaultPrevented || !(event.target instanceof HTMLFormElement)) return;
      const form = event.target;
      if (form.method.toLowerCase() === "get" && (!form.target || form.target === "_self") &&
        new URL(form.action).origin === window.location.origin) start();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    window.addEventListener(NAVIGATION_PROGRESS_START, start);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", complete);
    return () => {
      clearTimers();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener(NAVIGATION_PROGRESS_START, start);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", complete);
    };
  }, [start, complete, clearTimers]);

  return (
    <div className="navigation-loading-bar" data-state={phase} role="progressbar"
      aria-label="Loading page" aria-hidden={phase === "idle"}>
      <span style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}
