"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/types/api";
import { stripLocale, withLocale } from "@/lib/locales";
import { LanguageCurrencyModal, LanguageCurrencyTrigger } from "@/components/LanguageCurrencyModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VoiceSearchButton } from "@/components/voice/VoiceSearchButton";
import { uiCopy } from "@/lib/ui-copy";
import { homeCopy } from "@/lib/home-copy";
import { APPROVED_BRAND_LOGO } from "@/lib/site-contact";

const tourLinks = [
  ["oneDay", "/egypt-tours/one-day-tours"],
  ["multiDays", "/egypt-tours/multi-days-tours"],
  ["nileCruises", "/egypt-tours/nile-cruises"],
  ["shoreExcursions", "/egypt-tours/shore-excursions"],
] as const;

const primaryNavLinks = [
  ["home", "/"],
  ["egyptTours", null],
  ["rentCar", "/rent-car"],
  ["about", "/about-us"],
  ["contact", "/contact-us"],
  ["blogs", "/blogs/all-blogs"],
  ["events", "/events"],
] as const;

const themeLabels: Record<Locale, { toggle: string; light: string; dark: string }> = {
  en: { toggle: "Toggle color theme", light: "Light mode", dark: "Dark mode" },
  fr: { toggle: "Basculer le thème de couleur", light: "Mode clair", dark: "Mode sombre" },
  de: { toggle: "Farbmodus wechseln", light: "Heller Modus", dark: "Dunkler Modus" },
  it: { toggle: "Cambia tema colore", light: "Modalità chiara", dark: "Modalità scura" },
  pt: { toggle: "Alternar tema de cor", light: "Modo claro", dark: "Modo escuro" },
  es: { toggle: "Cambiar tema de color", light: "Modo claro", dark: "Modo oscuro" },
  zh: { toggle: "切换颜色主题", light: "浅色模式", dark: "深色模式" },
};

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M4 10h11M11 6l4 4-4 4" /></svg>;
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 4.5 4.5" /></svg>;
}

function CartIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l1.8 10h10.8l2-7H6" /><circle cx="9" cy="19" r="1.25" /><circle cx="17" cy="19" r="1.25" /></svg>;
}

function MenuIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

function CloseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function isActivePath(pathname: string, href: string) {
  const currentPath = stripLocale(pathname).replace(/\/$/, "") || "/";
  const targetPath = href.replace(/\/$/, "") || "/";
  if (targetPath === "/blogs/all-blogs" && currentPath.startsWith("/blog/")) return true;
  if (targetPath === "/events" && currentPath.startsWith("/event/")) return true;
  return targetPath === "/" ? currentPath === "/" : currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function NavDropdown({ locale, pathname }: { locale: Locale; pathname: string }) {
  const copy = uiCopy(locale);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = tourLinks.some(([, href]) => isActivePath(pathname, href)) || stripLocale(pathname).startsWith("/tour/");

  const clearCloseTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCloseTimeout();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 180);
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  const handleFocusOut = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(event.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div
      className={`dropdown ${open ? "dropdown-open" : ""} ${active ? "nav-item-active" : ""}`}
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={handleFocusOut}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          clearCloseTimeout();
          setOpen(false);
          containerRef.current?.querySelector("button")?.focus();
        }
      }}
    >
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          clearCloseTimeout();
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            clearCloseTimeout();
            setOpen(false);
            event.currentTarget.focus();
          }
        }}
      >
        {copy.egyptTours}
        <svg className="dropdown-chevron" aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="m4 6 4 4 4-4" /></svg>
      </button>
      <div className="dropdown-panel" role="menu">
        {tourLinks.map(([key, href]) => (
          <Link
            key={href}
            href={withLocale(href, locale)}
            role="menuitem"
            aria-current={isActivePath(pathname, href) ? "page" : undefined}
            onClick={() => {
              clearCloseTimeout();
              setOpen(false);
            }}
          >
            {copy[key]}<ArrowIcon />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Header({ locale = "en", siteTitle }: { locale?: Locale; siteTitle?: string | null }) {
  const copy = uiCopy(locale);
  const currentThemeLabels = themeLabels[locale];
  const home = homeCopy(locale);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isTop, setIsTop] = useState(true);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  // Instance-local ownership for Header Voice: each search form owns
  // its refs, so a voice session can only ever touch its own input + form.
  const desktopFormRef = useRef<HTMLFormElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileFormRef = useRef<HTMLFormElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const isHome = pathname === "/" || pathname === `/${locale}`;
  const firstStyle = isHome && isTop;

  const handleScroll = useCallback(() => {
    const mobile = window.innerWidth < 512;
    setIsTop(window.scrollY < (mobile ? window.innerHeight - 440 : window.innerHeight));
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    const frame = window.requestAnimationFrame(handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    const getFocusable = () => Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), summary, input, [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => element.getClientRects().length > 0);
    const shell = document.querySelector(".site-shell-v2");
    const background = Array.from(shell?.children ?? []).filter((element) => element.tagName !== "HEADER") as HTMLElement[];
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => { element.inert = true; });
    document.body.style.overflow = "hidden";
    getFocusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      const focusable = getFocusable();
      if (event.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openLangModal = useCallback(() => setLangOpen(true), []);
  const closeLangModal = useCallback(() => setLangOpen(false), []);

  const renderPrimaryNavigation = (mobile = false) => primaryNavLinks.map(([key, href]) => {
    if (href === null) {
      if (!mobile) return <NavDropdown key={key} locale={locale} pathname={pathname} />;
      const toursActive = tourLinks.some(([, tourHref]) => isActivePath(pathname, tourHref)) || stripLocale(pathname).startsWith("/tour/");
      return (
        <details className={`mobile-tour-group ${toursActive ? "nav-item-active" : ""}`} key={key}>
          <summary aria-current={toursActive ? "page" : undefined}>
            <span>{copy.egyptTours}</span>
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" /></svg>
          </summary>
          <div>
            {tourLinks.map(([tourKey, tourHref]) => (
              <Link key={tourHref} href={withLocale(tourHref, locale)} aria-current={isActivePath(pathname, tourHref) ? "page" : undefined} onClick={closeMenu}>
                {copy[tourKey]}<ArrowIcon />
              </Link>
            ))}
          </div>
        </details>
      );
    }

    const active = isActivePath(pathname, href);
    return (
      <Link key={href} href={withLocale(href, locale)} aria-current={active ? "page" : undefined} onClick={mobile ? closeMenu : undefined}>
        <span>{copy[key]}</span>{mobile ? <ArrowIcon /> : null}
      </Link>
    );
  });

  return (
    <header className={`site-header ${isHome ? "site-header-home" : ""} ${firstStyle ? "site-header-at-top" : ""} ${menuOpen || langOpen ? "site-header-modal-open" : ""}`}>
      <div className="header-frame">
        <div className="header-main">
          <Link href={withLocale("/", locale)} aria-label="Sun Pyramids home" className="header-logo">
            <Image src={APPROVED_BRAND_LOGO} alt={siteTitle || "Sun Pyramids Tours"} width={190} height={54} priority />
          </Link>
          <form className="header-search" action={withLocale("/trips", locale)} ref={desktopFormRef}>
            <SearchIcon /><input name="title" ref={desktopInputRef} placeholder={copy.search} aria-label={copy.search} />
            <VoiceSearchButton key={locale} locale={locale} inputRef={desktopInputRef} formRef={desktopFormRef} />
          </form>
          <div className="header-actions">
            <LanguageCurrencyTrigger locale={locale} onClick={openLangModal} />
            <ThemeToggle className="header-theme-toggle" labels={currentThemeLabels} />
            <Link className="circle-action cart-action" href={withLocale("/cart", locale)} aria-label="Cart"><CartIcon /></Link>
            <Link className="signin-action" href={withLocale("/auth/sign-in", locale)}>{copy.signIn}</Link>
            <button aria-controls="mobile-navigation" aria-expanded={menuOpen} aria-label="Open menu" className="circle-action menu-action" onClick={() => setMenuOpen(true)} ref={menuButtonRef} type="button"><MenuIcon /></button>
          </div>
        </div>
        <div className="header-nav-row">
          <nav className="desktop-nav" aria-label="Primary navigation">{renderPrimaryNavigation()}</nav>
          <div className="header-conversion-actions">
            <Link className="special-offer-link" href={withLocale("/trips?main=special-offers", locale)}>{copy.specialOffer}</Link>
            <Link className="make-trip-action" href={withLocale("/make-your-trip", locale)}>{copy.makeTrip}<ArrowIcon /></Link>
          </div>
        </div>
      </div>

      {firstStyle ? (
        <div className="promo-strip original-strip">
          <p>{home.promoTitle}</p>
          <Link className="btn-primary" href={withLocale("/egypt-tours/multi-days-tours", locale)}>{home.promoButton}</Link>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="mobile-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
          <div aria-label="Site navigation" aria-modal="true" className="mobile-drawer" id="mobile-navigation" ref={drawerRef} role="dialog">
            <div className="mobile-drawer-head">
              <Link href={withLocale("/", locale)} aria-label="Sun Pyramids home" onClick={closeMenu}><Image src={APPROVED_BRAND_LOGO} alt={siteTitle || "Sun Pyramids Tours"} width={180} height={51} /></Link>
              <button className="circle-action" type="button" onClick={closeMenu} aria-label="Close menu"><CloseIcon /></button>
            </div>
            <form className="mobile-drawer-search" action={withLocale("/trips", locale)} ref={mobileFormRef}><SearchIcon /><input name="title" ref={mobileInputRef} placeholder={copy.search} aria-label={copy.search} /><VoiceSearchButton key={locale} locale={locale} inputRef={mobileInputRef} formRef={mobileFormRef} onNavigate={closeMenu} /></form>
            <nav className="mobile-links" aria-label="Primary navigation">{renderPrimaryNavigation(true)}</nav>
            <div className="mobile-drawer-utilities">
              <ThemeToggle labels={currentThemeLabels} withLabel />
              <LanguageCurrencyTrigger locale={locale} onClick={() => { closeMenu(); openLangModal(); }} />
              <Link href={withLocale("/cart", locale)} onClick={closeMenu}><CartIcon /><span>{copy.cart}</span></Link>
              <Link href={withLocale("/auth/sign-in", locale)} onClick={closeMenu}><span>{copy.signIn}</span><ArrowIcon /></Link>
            </div>
            <div className="mobile-drawer-actions">
              <Link href={withLocale("/trips?main=special-offers", locale)} onClick={closeMenu}>{copy.specialOffer}</Link>
              <Link className="mobile-drawer-cta" href={withLocale("/make-your-trip", locale)} onClick={closeMenu}>{copy.makeTrip}<ArrowIcon /></Link>
            </div>
          </div>
        </div>
      ) : null}

      {langOpen ? <LanguageCurrencyModal locale={locale} pathname={pathname} onClose={closeLangModal} /> : null}
    </header>
  );
}
