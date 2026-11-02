"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Check, GitCompareArrows, Plus, X } from "lucide-react";
import { apiGet, ApiClientError } from "@/lib/client-api";
import type { Locale, Tour } from "@/types/api";
import { MultiCountryCompare } from "./MultiCountryCompare";
import { createComparisonSelection } from "./comparison-selection";
import { getCompareCopy } from "./compare-copy";
import "@/styles/multi-country-comparison.scss";

type CompareContextValue = {
  slugs: string[];
  locale: Locale;
  collectionSlug: string;
  titleFor: (slug: string) => string;
  toggle: (slug: string, title: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  announcement: string;
};
const CompareContext = createContext<CompareContextValue | null>(null);

function useComparison() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("Comparison controls require their collection provider");
  return context;
}

export function MultiCountryCompareProvider({ collectionSlug, locale, currentTitles, children }: {
  collectionSlug: string;
  locale: Locale;
  currentTitles: Record<string, string>;
  children: ReactNode;
}) {
  const [store] = useState(() => createComparisonSelection(`${locale}:${collectionSlug}`));
  const slugs = useSyncExternalStore(store.subscribe, store.read, store.serverSnapshot);
  const [rememberedTitles, setRememberedTitles] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState("");
  const copy = getCompareCopy(locale);
  function toggle(slug: string, title: string) {
    setRememberedTitles((titles) => ({ ...titles, [slug]: title }));
    setAnnouncement(store.toggle(slug) ? "" : copy.limit);
  }
  const context = { slugs, locale, collectionSlug, toggle, announcement,
    titleFor: (slug: string) => currentTitles[slug] || rememberedTitles[slug] || slug,
    remove: (slug: string) => { store.remove(slug); setAnnouncement(""); },
    clear: () => { store.clear(); setAnnouncement(""); },
  };
  return <CompareContext.Provider value={context}>{children}<ComparisonTray /></CompareContext.Provider>;
}

export function CompareSelectButton({ slug, title }: { slug: string; title: string }) {
  const { slugs, toggle, locale } = useComparison();
  const copy = getCompareCopy(locale);
  const selected = slugs.includes(slug);
  return <button type="button" className="mc-compare-select" aria-pressed={selected}
    aria-label={`${selected ? copy.remove : copy.add}: ${title}`}
    onClick={() => toggle(slug, title)}>
    {selected ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
    {selected ? copy.selected : copy.add}
  </button>;
}

type CompareEntry = { slug: string; tour?: Tour; unavailable?: boolean; failed?: boolean };

function ComparisonTray() {
  const { slugs, locale, collectionSlug, titleFor, remove, clear, announcement } = useComparison();
  const copy = getCompareCopy(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const requestVersion = useRef(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<CompareEntry[]>([]);
  const visibleEntries = entries.filter((entry) => slugs.includes(entry.slug));
  const readyTours = visibleEntries.flatMap((entry) => entry.tour ? [entry.tour] : []);

  useEffect(() => () => { requestVersion.current += 1; }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  async function refresh() {
    const version = ++requestVersion.current;
    const requested = [...slugs];
    setLoading(true);
    setEntries([]);
    const refreshed = await Promise.all(requested.map(async (slug): Promise<CompareEntry> => {
      try {
        const response = await apiGet<{ data?: Tour }>(`tours/${encodeURIComponent(slug)}?includes=categories`, locale, false);
        const tour = response.data;
        if (!tour?.slug || tour.slug !== slug || tour.enabled === false ||
          !tour.categories?.some((category) => category.slug === collectionSlug)) return { slug, unavailable: true };
        return { slug, tour };
      } catch (error) {
        return error instanceof ApiClientError && error.status === 404 ? { slug, unavailable: true } : { slug, failed: true };
      }
    }));
    if (version !== requestVersion.current) return;
    setEntries(refreshed);
    setLoading(false);
  }

  function openComparison() {
    dialogRef.current?.showModal();
    setOpen(true);
    void refresh();
  }
  function closeComparison() { dialogRef.current?.close(); }
  function onClosed() { requestVersion.current += 1; setOpen(false); setLoading(false); }
  function removeFromDialog(slug: string) {
    remove(slug);
    dialogRef.current?.querySelector<HTMLButtonElement>("[data-compare-close]")?.focus();
  }

  return <>
    {slugs.length > 0 && <aside className="mc-compare-tray" aria-label={copy.region}>
      <div className="mc-compare-tray-lead"><GitCompareArrows size={20} aria-hidden="true" /><strong>{copy.chosen.replace("{count}", String(slugs.length))}</strong></div>
      <ul className="mc-compare-chips">{slugs.map((slug) => <li key={slug}><span>{titleFor(slug)}</span><button type="button" onClick={() => remove(slug)} aria-label={`${copy.remove}: ${titleFor(slug)}`}><X size={15} aria-hidden="true" /></button></li>)}</ul>
      <div className="mc-compare-tray-actions"><button type="button" className="mc-compare-clear" onClick={clear}>{copy.clear}</button><button type="button" className="mc-compare-open" disabled={slugs.length < 2} onClick={openComparison}>{copy.compareNow} ({slugs.length})</button></div>
      <p className="mc-compare-status" role="status">{announcement || (slugs.length < 2 ? copy.pickTwo : copy.limitHint)}</p>
    </aside>}
    <dialog ref={dialogRef} className="mc-compare-dialog" aria-labelledby="mc-compare-dialog-title" aria-describedby="mc-compare-dialog-hint" onClose={onClosed} onClick={(event) => { if (event.target === event.currentTarget) closeComparison(); }}>
      <div className="mc-compare-dialog-inner">
        <div className="mc-compare-dialog-heading"><div><h2 id="mc-compare-dialog-title"><GitCompareArrows size={23} aria-hidden="true" />{copy.compare}</h2><p id="mc-compare-dialog-hint">{copy.hint}</p></div><button type="button" data-compare-close aria-label={copy.close} onClick={closeComparison}><X size={22} aria-hidden="true" /></button></div>
        <ul className="mc-compare-dialog-selection">{slugs.map((slug) => <li key={slug}><span>{visibleEntries.find((entry) => entry.slug === slug)?.tour?.title || titleFor(slug)}</span><button type="button" onClick={() => removeFromDialog(slug)} aria-label={`${copy.remove}: ${titleFor(slug)}`}><X size={16} aria-hidden="true" /></button></li>)}</ul>
        {loading ? <p role="status" className="mc-compare-feedback">{copy.loading}</p> : <>
          {visibleEntries.filter((entry) => !entry.tour).map((entry) => <p className="mc-compare-feedback" role="status" key={entry.slug}>{titleFor(entry.slug)} — {entry.unavailable ? copy.unavailable : copy.failed}</p>)}
          {visibleEntries.some((entry) => entry.failed) && <button type="button" className="mc-compare-retry" onClick={() => { void refresh(); }}>{copy.retry}</button>}
          {readyTours.length >= 2 ? <><p className="mc-compare-scroll-hint">{copy.scroll}</p><MultiCountryCompare tours={readyTours} locale={locale} /></> : <p className="mc-compare-feedback">{copy.pickTwo}</p>}
        </>}
      </div>
    </dialog>
  </>;
}
