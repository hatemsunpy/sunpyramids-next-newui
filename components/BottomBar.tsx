"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/types/api";
import { withLocale } from "@/lib/locales";
import { uiCopy } from "@/lib/ui-copy";
import { homeCopy } from "@/lib/home-copy";
import { siteContact } from "@/lib/site-contact";

type ShortcutIcon = "offers" | "make" | "trips" | "home";

function BottomIcon({ icon }: { icon: ShortcutIcon }) {
  if (icon === "offers") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 2 2 2.2 3-.4.8 2.9 2.8 1.2-1 2.8 1.8 2.4-2.2 2 .4 3-2.9.8-1.2 2.8-2.8-1.1-2.4 1.9-2-2.2-3 .4-.8-2.9-2.8-1.2 1-2.8-1.8-2.4 2.2-2-.4-3 2.9-.8L12 2Z" /><path d="m9 15 6-6M9.5 9.5h.01M14.5 14.5h.01" /></svg>;
  if (icon === "make") return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
  if (icon === "trips") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 15 8-3 3-8 2 1-1 7 5 3-1 2-6-1-3 5-2-1 1-5-5 2-1-2Z" /></svg>;
  return <svg aria-hidden="true" className="bottom-home-icon" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></svg>;
}

export function BottomBar({ locale = "en" }: { locale?: Locale }) {
  const pathname = usePathname();
  const ui = uiCopy(locale);
  const home = homeCopy(locale);
  const shortcuts = [
    { icon: "offers" as const, href: "/trips?main=special-offers", label: locale === "en" ? "Offers" : ui.offers },
    { icon: "make" as const, href: "/make-your-trip", label: home.makeTripShort },
    { icon: "trips" as const, href: "/trips", label: locale === "en" ? "trips" : ui.trips },
    { icon: "home" as const, href: "/", label: ui.home },
  ];
  const homePath = withLocale("/", locale);

  return (
    <nav className="bottom-bar" aria-label="Mobile shortcuts">
      {shortcuts.slice(0, 2).map((shortcut) => (
        <Link key={shortcut.href} href={withLocale(shortcut.href, locale)}>
          <BottomIcon icon={shortcut.icon} />
          <span>{shortcut.label}</span>
        </Link>
      ))}
      <a className="bottom-whatsapp" href={siteContact.whatsapp.contactUrl} target="_blank" rel="noreferrer" aria-label="Open WhatsApp chat">
        <Image src="/images/whatsapp.webp" alt="" width={32} height={32} />
      </a>
      {shortcuts.slice(2).map((shortcut) => {
        const href = withLocale(shortcut.href, locale);
        const active = shortcut.icon === "home" ? pathname === homePath : pathname === href;
        return <Link className={active ? "is-active" : ""} key={shortcut.href} href={href} aria-current={active ? "page" : undefined}>
          <BottomIcon icon={shortcut.icon} />
          <span>{shortcut.label}</span>
        </Link>;
      })}
    </nav>
  );
}
