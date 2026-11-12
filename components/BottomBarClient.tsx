"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/types/api";
import { withLocale } from "@/lib/locales";

type ShortcutIcon = "offers" | "make" | "trips" | "home";

const DOCK_TRANSITION_KEY = "spt-dock-transition";
const DOCK_TRANSITION_MS = 360;

type DockHandoff = {
  from: string | null;
  to: string;
};

function readDockTransition(): DockHandoff | null {
  try {
    const value = window.sessionStorage.getItem(DOCK_TRANSITION_KEY);
    if (value) window.sessionStorage.removeItem(DOCK_TRANSITION_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as { from?: unknown; to?: unknown };
    if (typeof parsed.to !== "string") return null;
    return { from: typeof parsed.from === "string" ? parsed.from : null, to: parsed.to };
  } catch {
    return null;
  }
}

function BottomIcon({ icon }: { icon: ShortcutIcon }) {
  if (icon === "offers") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 2 2 2.2 3-.4.8 2.9 2.8 1.2-1 2.8 1.8 2.4-2.2 2 .4 3-2.9.8-1.2 2.8-2.8-1.1-2.4 1.9-2-2.2-3 .4-.8-2.9-2.8-1.2 1-2.8-1.8-2.4 2.2-2-.4-3 2.9-.8L12 2Z" /><path d="m9 15 6-6M9.5 9.5h.01M14.5 14.5h.01" /></svg>;
  if (icon === "make") return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
  if (icon === "trips") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>;
  return <svg aria-hidden="true" className="bottom-home-icon" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></svg>;
}

export type BottomBarLabels = {
  makeTripShort: string;
};

export type BottomBarUiLabels = {
  offers: string;
  trips: string;
  home: string;
};

export function BottomBarClient({ locale = "en", labels, uiLabels }: { locale?: Locale; labels: BottomBarLabels; uiLabels: BottomBarUiLabels }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<DockHandoff | null>(null);
  // Cache the read across the StrictMode setup/cleanup/setup cycle without
  // touching sessionStorage during render.
  const transitionCache = useRef<{ pathname: string; value: DockHandoff | null } | null>(null);
  const shortcuts = useMemo(
    () => [
      { icon: "home" as const, href: "/", label: uiLabels.home },
      { icon: "trips" as const, href: "/trips", label: locale === "en" ? "Trips" : uiLabels.trips },
      { icon: "make" as const, href: "/make-your-trip", label: labels.makeTripShort },
      { icon: "offers" as const, href: "/trips?main=special-offers", label: locale === "en" ? "Offers" : uiLabels.offers },
    ],
    [labels.makeTripShort, locale, uiLabels.home, uiLabels.offers, uiLabels.trips],
  );
  const currentActiveHref = shortcuts
    .map((shortcut) => withLocale(shortcut.href, locale))
    .find((href) => href === pathname) ?? null;

  useEffect(() => {
    if (transitionCache.current?.pathname !== pathname) {
      transitionCache.current = { pathname, value: readDockTransition() };
    }
    const stored = transitionCache.current.value;
    const shouldAnimate =
      stored !== null &&
      stored.from !== stored.to &&
      currentActiveHref !== null &&
      stored.to === currentActiveHref;

    const frame = requestAnimationFrame(() => {
      setPendingHref(null);
      setHandoff(shouldAnimate ? stored : null);
    });
    const timer = shouldAnimate ? window.setTimeout(() => setHandoff(null), DOCK_TRANSITION_MS) : 0;

    return () => {
      cancelAnimationFrame(frame);
      if (timer) window.clearTimeout(timer);
    };
  }, [pathname, currentActiveHref]);

  const handleShortcutClick = (href: string, active: boolean) => {
    setPendingHref(href);
    if (active) return;
    try {
      window.sessionStorage.setItem(
        DOCK_TRANSITION_KEY,
        JSON.stringify({ from: currentActiveHref, to: href }),
      );
    } catch {
      // Storage can be unavailable (private mode); the dock still responds optimistically.
    }
  };

  return (
    <nav className="bottom-bar bottom-bar--floating" aria-label="Mobile shortcuts">
      {shortcuts.map((shortcut) => {
        const href = withLocale(shortcut.href, locale);
        const active = pathname === href;
        const isActive = pendingHref ? pendingHref === href : active;
        const isEntering = isActive && handoff?.to === href;
        const isLeaving = !isActive && handoff?.from === href;
        const className = [
          isActive ? "is-active" : "",
          isEntering ? "is-dock-entering" : "",
          isLeaving ? "is-dock-leaving" : "",
        ].filter(Boolean).join(" ");
        return <Link className={className} key={shortcut.href} href={href} aria-label={shortcut.label} aria-current={active ? "page" : undefined} onClick={() => handleShortcutClick(href, active)}>
          <span className="bottom-dock-icon" aria-hidden="true"><BottomIcon icon={shortcut.icon} /></span>
          <span className="bottom-dock-label" aria-hidden="true">{shortcut.label}</span>
        </Link>;
      })}
    </nav>
  );
}
