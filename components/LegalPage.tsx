import type { ApiPage, Locale } from "@/types/api";
import { ChevronDown } from "lucide-react";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import { HomeNeedHelpForm } from "@/components/HomeNeedHelpForm";
import { homeCopy } from "@/lib/home-copy";
import { prepareLegalDocument } from "@/lib/legal-document";

const contentsLabels: Record<Locale, string> = {
  en: "On this page", fr: "Sur cette page", de: "Auf dieser Seite",
  it: "In questa pagina", pt: "Nesta página", es: "En esta página", zh: "本页内容",
};

export function LegalPage({ page, title, image, locale }: {
  page: ApiPage | null; title: string; image: string; locale: Locale;
}) {
  const { html, headings } = prepareLegalDocument(page?.content || page?.description);
  const contentsLabel = contentsLabels[locale];
  return (
    <main className="legal-page">
      <DiscoveryHero title={title} bgImage={image} eyebrow="" locale={locale} />
      <section className="legal-content-section" aria-label={title}>
        <div className="editorial-container legal-content-layout">
          <article className="editorial-prose legal-document" dangerouslySetInnerHTML={{ __html: html }} />
          {headings.length > 0 && (
            <aside className="legal-contents">
              <details open>
                <summary>
                  <span>{contentsLabel}</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <nav aria-label={contentsLabel}>
                  <ol>
                    {headings.map((heading) => (
                      <li key={heading.id} className={heading.level === 3 ? "legal-contents-child" : undefined}>
                        <a href={`#${heading.id}`}><span dangerouslySetInnerHTML={{ __html: heading.labelHtml }} /></a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </details>
            </aside>
          )}
        </div>
      </section>
      <section className="legal-help-section" aria-labelledby="legal-help-title">
        <div className="editorial-container">
          <div className="home-help-panel-v2">
            <h2 id="legal-help-title">{homeCopy(locale).needHelp}</h2>
            <HomeNeedHelpForm locale={locale} />
          </div>
        </div>
      </section>
    </main>
  );
}
