"use client";

import { useLayoutEffect, useRef } from "react";

const THEME_KEY = "sunpyramids-theme";
const THEME_EVENT = "sunpyramids:theme-change";

type Theme = "light" | "dark";

function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

type ThemeLabels = { toggle: string; light: string; dark: string };

export function ThemeToggle({ className = "", labels, withLabel = false }: { className?: string; labels: ThemeLabels; withLabel?: boolean }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const syncButton = () => {
      buttonRef.current?.setAttribute("aria-pressed", String(currentTheme() === "dark"));
    };

    const syncSystemTheme = (event: MediaQueryListEvent) => {
      if (storedTheme()) return;
      applyTheme(event.matches ? "dark" : "light");
      syncButton();
    };

    applyTheme(currentTheme());
    syncButton();
    media.addEventListener("change", syncSystemTheme);
    window.addEventListener(THEME_EVENT, syncButton);

    return () => {
      media.removeEventListener("change", syncSystemTheme);
      window.removeEventListener(THEME_EVENT, syncButton);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = currentTheme() === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // The current page can still change theme when storage is unavailable.
    }
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <button
      aria-label={labels.toggle}
      aria-pressed="false"
      className={`theme-toggle ${withLabel ? "theme-toggle-with-label" : ""} ${className}`.trim()}
      onClick={toggleTheme}
      ref={buttonRef}
      type="button"
    >
      <span className="theme-toggle-icon theme-toggle-sun" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </svg>
      </span>
      <span className="theme-toggle-icon theme-toggle-moon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M20.2 15.2A8.6 8.6 0 0 1 8.8 3.8a8.6 8.6 0 1 0 11.4 11.4Z" />
        </svg>
      </span>
      {withLabel ? (
        <span className="theme-toggle-copy">
          <span className="theme-toggle-light-copy">{labels.light}</span>
          <span className="theme-toggle-dark-copy">{labels.dark}</span>
        </span>
      ) : null}
    </button>
  );
}
