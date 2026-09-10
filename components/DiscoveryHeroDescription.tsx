"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Locale } from "@/types/api";

const toggleLabels: Record<string, { more: string; less: string }> = {
  en: { more: "Read more", less: "Read less" },
  ar: { more: "اقرأ المزيد", less: "اقرأ أقل" },
  fr: { more: "En savoir plus", less: "Réduire" },
  de: { more: "Mehr lesen", less: "Weniger anzeigen" },
  it: { more: "Leggi di più", less: "Leggi di meno" },
  es: { more: "Leer más", less: "Leer menos" },
  pt: { more: "Ler mais", less: "Ler menos" },
  zh: { more: "阅读更多", less: "收起" },
};

export function DiscoveryHeroDescription({
  description,
  locale = "en",
}: {
  description: string;
  locale?: Locale | string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollHeight > el.clientHeight + 4);
  }, [description]);

  const labels = toggleLabels[locale] || toggleLabels.en;

  return (
    <div className={`discovery-hero-desc-container ${expanded ? "is-expanded" : ""}`}>
      <div
        ref={contentRef}
        className={`discovery-hero-desc ${!expanded ? "is-clamped" : ""}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
      />
      {isOverflowing && (
        <button
          type="button"
          className="discovery-hero-desc-toggle"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? labels.less : labels.more}
        </button>
      )}
    </div>
  );
}
