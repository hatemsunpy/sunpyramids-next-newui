"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgressRouter as useRouter } from "@/components/useProgressRouter";
import type { Locale } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { VoiceSearchButton } from "@/components/voice/VoiceSearchButton";
import type { VoiceLabels } from "@/lib/voice-client-labels";

type ShortcutIcon = "offers" | "make" | "trips" | "home" | "search";

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
  if (icon === "search") return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
  return <svg aria-hidden="true" className="bottom-home-icon" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></svg>;
}

export type BottomBarLabels = {
  makeTripShort: string;
};

export type BottomBarUiLabels = {
  offers: string;
  trips: string;
  home: string;
  search?: string;
};

type DockLinkItem = {
  type: "link";
  icon: ShortcutIcon;
  href: string;
  label: string;
};

type DockActionItem = {
  type: "action";
  icon: "search";
  id: "search";
  label: string;
};

type DockItem = DockLinkItem | DockActionItem;

export function BottomBarClient({
  locale = "en",
  labels,
  uiLabels,
  voiceLabels = {},
}: {
  locale?: Locale;
  labels: BottomBarLabels;
  uiLabels: BottomBarUiLabels;
  voiceLabels?: VoiceLabels;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<DockHandoff | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const popupRef = useRef<HTMLDivElement | null>(null);
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Cache the read across the StrictMode setup/cleanup/setup cycle without
  // touching sessionStorage during render.
  const transitionCache = useRef<{ pathname: string; value: DockHandoff | null } | null>(null);

  const searchLabel = uiLabels.search || "Search";

  const items: DockItem[] = useMemo(
    () => [
      { type: "link", icon: "home", href: "/", label: uiLabels.home },
      { type: "link", icon: "trips", href: "/trips", label: locale === "en" ? "Trips" : uiLabels.trips },
      { type: "action", icon: "search", id: "search", label: searchLabel },
      { type: "link", icon: "make", href: "/make-your-trip", label: labels.makeTripShort },
      { type: "link", icon: "offers", href: "/trips?main=special-offers", label: locale === "en" ? "Offers" : uiLabels.offers },
    ],
    [labels.makeTripShort, locale, searchLabel, uiLabels.home, uiLabels.offers, uiLabels.trips],
  );

  const linkHrefs = useMemo(
    () =>
      items
        .filter((item): item is DockLinkItem => item.type === "link")
        .map((item) => withLocale(item.href, locale)),
    [items, locale],
  );

  const currentActiveHref = linkHrefs.find((href) => href === pathname) ?? null;

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

  // Focus input on popup open
  useEffect(() => {
    if (isSearchOpen) {
      const frame = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isSearchOpen]);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsSearchOpen(false);
  }

  // Dismiss popup on tap outside or Escape key
  useEffect(() => {
    if (!isSearchOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        searchBtnRef.current &&
        !searchBtnRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        searchBtnRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  const handleShortcutClick = (href: string, active: boolean) => {
    setIsSearchOpen(false);
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

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const val = (inputRef.current?.value ?? searchQuery).trim();
    if (val) {
      router.push(withLocale(`/trips?title=${encodeURIComponent(val)}`, locale));
    } else {
      router.push(withLocale("/trips", locale));
    }
    setIsSearchOpen(false);
  };

  return (
    <nav className="bottom-bar bottom-bar--floating" aria-label="Mobile shortcuts">
      {isSearchOpen ? (
        <div
          id="bottom-search-popup"
          ref={popupRef}
          className="bottom-search-popup"
          role="dialog"
          aria-label={searchLabel}
        >
          <form
            ref={formRef}
            className="bottom-search-form"
            action={withLocale("/trips", locale)}
            onSubmit={handleFormSubmit}
          >
            <button type="submit" className="bottom-search-submit" aria-label={searchLabel}>
              <BottomIcon icon="search" />
            </button>
            <input
              ref={inputRef}
              type="search"
              name="title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchLabel}
              aria-label={searchLabel}
              className="bottom-search-input"
              autoComplete="off"
            />
            {searchQuery ? (
              <button
                type="button"
                className="bottom-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  if (inputRef.current) inputRef.current.value = "";
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
            <VoiceSearchButton
              key={locale}
              locale={locale}
              voiceLabels={voiceLabels}
              inputRef={inputRef}
              formRef={formRef}
              onNavigate={handleCloseSearch}
            />
            <button
              type="button"
              className="bottom-search-close"
              onClick={handleCloseSearch}
              aria-label="Close"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </form>
        </div>
      ) : null}

      {items.map((item) => {
        if (item.type === "action") {
          const isActive = isSearchOpen;
          const className = [
            "bottom-dock-btn",
            isActive ? "is-active" : "",
          ].filter(Boolean).join(" ");

          return (
            <button
              key={item.id}
              ref={searchBtnRef}
              type="button"
              className={className}
              aria-label={item.label}
              aria-expanded={isSearchOpen}
              aria-controls="bottom-search-popup"
              onClick={toggleSearch}
            >
              <span className="bottom-dock-icon" aria-hidden="true"><BottomIcon icon={item.icon} /></span>
              <span className="bottom-dock-label" aria-hidden="true">{item.label}</span>
            </button>
          );
        }

        const href = withLocale(item.href, locale);
        const active = pathname === href;
        const isActive = !isSearchOpen && (pendingHref ? pendingHref === href : active);
        const isEntering = isActive && handoff?.to === href;
        const isLeaving = !isActive && handoff?.from === href;
        const className = [
          isActive ? "is-active" : "",
          isEntering ? "is-dock-entering" : "",
          isLeaving ? "is-dock-leaving" : "",
        ].filter(Boolean).join(" ");

        return (
          <Link
            key={item.href}
            className={className}
            href={href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            onClick={() => handleShortcutClick(href, active)}
          >
            <span className="bottom-dock-icon" aria-hidden="true"><BottomIcon icon={item.icon} /></span>
            <span className="bottom-dock-label" aria-hidden="true">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
