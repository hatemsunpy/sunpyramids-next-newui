"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { LanguageCurrencyModal, LanguageCurrencyTrigger } from "@/components/LanguageCurrencyModal";
import { uiCopy } from "@/lib/ui-copy";
import { homeCopy } from "@/lib/home-copy";
import { APPROVED_BRAND_LOGO } from "@/lib/site-contact";

const tourLinks = [
  ["oneDay", "/egypt-tours/one-day-tours"], ["multiDays", "/egypt-tours/multi-days-tours"],
  ["nileCruises", "/egypt-tours/nile-cruises"], ["shoreExcursions", "/egypt-tours/shore-excursions"],
] as const;

const mainNavLinks = [
  ["home", "/"], ["about", "/about-us"], ["contact", "/contact-us"],
  ["blogs", "/blogs/all-blogs"], ["events", "/events"],
] as const;

const secondaryNavLinks = [
  ["home", "/"], ["rentCar", "/rent-car"], ["about", "/about-us"], ["contact", "/contact-us"],
  ["blogs", "/blogs/all-blogs"], ["events", "/events"],
] as const;

function NavDropdown({ locale }: { locale: Locale }) {
  const copy = uiCopy(locale);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when focus leaves the dropdown (button or panel) entirely.
  const handleBlur = () => {
    if (!containerRef.current) return;
    requestAnimationFrame(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setOpen(false);
      }
    });
  };

  return (
    <div
      className={`dropdown ${open ? "dropdown-open" : ""}`}
      ref={containerRef}
      onBlur={handleBlur}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        {copy.egyptTours} <span aria-hidden="true">⌄</span>
      </button>
      <div className="dropdown-panel">
        {tourLinks.map(([key, href]) => (
          <Link key={href} href={withLocale(href, locale)}>
            {copy[key]}
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Header({ locale = "en", siteTitle }: { locale?: Locale; siteTitle?: string | null }) {
  const copy = uiCopy(locale);
  const home = homeCopy(locale);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isTop, setIsTop] = useState(true);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/" || pathname === `/${locale}`;
  const firstStyle = isHome && isTop;

  const handleScroll = useCallback(() => {
    const mobile = window.innerWidth < 512;
    const top = window.scrollY < (mobile ? window.innerHeight - 440 : window.innerHeight);
    setIsTop(top);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    const id = window.requestAnimationFrame(handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(id);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    );
    document.body.style.overflow = "hidden";
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
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
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [menuOpen]);

  const openLangModal = useCallback(() => setLangOpen(true), []);
  const closeLangModal = useCallback(() => setLangOpen(false), []);

  return (
    <header className={`site-header ${isHome ? "site-header-home" : ""} ${firstStyle ? "site-header-at-top" : ""}`}>
      <div className="header-main">
        <Link href={withLocale("/", locale)} aria-label="Sun Pyramids home" className="header-logo">
          <Image src={APPROVED_BRAND_LOGO} alt={siteTitle || "Sun Pyramids Tours"} width={190} height={54} priority />
        </Link>

        {firstStyle ? (
          <nav className="header-inline-nav" aria-label="Main navigation">
            {mainNavLinks.slice(0, 1).map(([key, href]) => (
              <Link key={href} href={withLocale(href, locale)}>
                {copy[key]}
              </Link>
            ))}
            <NavDropdown locale={locale} />
            {mainNavLinks.slice(1).map(([key, href]) => (
              <Link key={href} href={withLocale(href, locale)}>
                {copy[key]}
              </Link>
            ))}
          </nav>
        ) : (
          <form className="header-search" action={withLocale("/trips", locale)}>
            <span aria-hidden="true">⌕</span>
            <input name="title" placeholder={copy.search} aria-label={copy.search} />
          </form>
        )}

        <div className="header-actions">
          <LanguageCurrencyTrigger locale={locale} onClick={openLangModal} />
          <Link className="circle-action" href={withLocale("/cart", locale)} aria-label="Cart">
            <span aria-hidden="true">▱</span>
          </Link>
          <Link className="signin-action" href={withLocale("/auth/sign-in", locale)}>
            {copy.signIn}
          </Link>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label="Open menu"
            className="circle-action menu-action"
            onClick={() => setMenuOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </div>

      {firstStyle ? (
        <div className="promo-strip original-strip">
          <p>{home.promoTitle}</p>
          <Link className="btn-primary" href={withLocale("/egypt-tours/multi-days-tours", locale)}>
            {home.promoButton}
          </Link>
        </div>
      ) : null}

      {!firstStyle ? (
        <div className="header-nav-row">
          <nav className="desktop-nav" aria-label="Main navigation">
            {secondaryNavLinks.slice(0, 1).map(([key, href]) => (
              <Link key={href} href={withLocale(href, locale)}>
                {copy[key]}
              </Link>
            ))}
            <NavDropdown locale={locale} />
            {secondaryNavLinks.slice(1).map(([key, href]) => (
              <Link key={href} href={withLocale(href, locale)}>
                {copy[key]}
              </Link>
            ))}
            <Link className="special-offer-link" href={withLocale("/trips?main=special-offers", locale)}>
              <span aria-hidden="true">✥</span>
              {copy.specialOffer}
            </Link>
          </nav>

          <Link className="make-trip-action" href={withLocale("/make-your-trip", locale)}>
            {copy.makeTrip}
          </Link>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="mobile-drawer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}>
          <div
            aria-label="Site navigation"
            aria-modal="true"
            className="mobile-drawer"
            id="mobile-navigation"
            ref={drawerRef}
            role="dialog"
          >
            <div className="mobile-drawer-head">
              <Image src={APPROVED_BRAND_LOGO} alt={siteTitle || "Sun Pyramids Tours"} width={180} height={51} />
              <button className="circle-action" type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                ×
              </button>
            </div>
            <nav className="mobile-links" aria-label="Mobile navigation">
              {[...mainNavLinks, ["rentCar", "/rent-car"] as const].map(([key, href]) => (
                <Link key={`${key}-${href}`} href={withLocale(href, locale)} onClick={() => setMenuOpen(false)}>
                  {copy[key]}<span aria-hidden="true">↗</span>
                </Link>
              ))}
              <details className="mobile-tour-group">
                <summary>{copy.egyptTours}<span aria-hidden="true">+</span></summary>
                <div>
                  {tourLinks.map(([key, href]) => (
                    <Link key={href} href={withLocale(href, locale)} onClick={() => setMenuOpen(false)}>{copy[key]}</Link>
                  ))}
                </div>
              </details>
              <Link className="mobile-drawer-cta" href={withLocale("/make-your-trip", locale)} onClick={() => setMenuOpen(false)}>{copy.makeTrip}</Link>
              <Link href={withLocale("/trips?main=special-offers", locale)} onClick={() => setMenuOpen(false)}>{copy.specialOffer}<span aria-hidden="true">↗</span></Link>
            </nav>
            <div className="mobile-drawer-lang">
              <LanguageCurrencyTrigger
                locale={locale}
                onClick={() => {
                  setMenuOpen(false);
                  openLangModal();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {langOpen ? <LanguageCurrencyModal locale={locale} pathname={pathname} onClose={closeLangModal} /> : null}
    </header>
  );
}
