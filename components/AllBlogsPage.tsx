import Link from "next/link";
import { BlogExplorer } from "@/components/BlogExplorer";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import { HomeNeedHelpForm } from "@/components/HomeNeedHelpForm";
import { TravelPartners } from "@/components/TravelPartners";
import { homeCopy } from "@/lib/home-copy";
import type { BlogListing } from "@/lib/data";
import { withLocale } from "@/lib/locales";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { ApiPage, Locale } from "@/types/api";

export function AllBlogsPage({
  page,
  listing,
  categories,
  faqs,
  locale = "en",
  initialTitle = "",
}: {
  page: ApiPage | null;
  listing: BlogListing;
  categories: ApiPage[];
  faqs: ApiPage[];
  locale?: Locale;
  initialTitle?: string;
}) {
  const copy = homeCopy(locale);
  const banner = page?.banner || "/images/blogsHero.png";
  const title = locale === "en" ? "Egypt Travel Guides & Stories" : page?.title || "Blogs";
  const breadcrumbs = [
    { label: "Home", href: withLocale("/", locale) },
    { label: title },
  ];

  return (
    <main className="blogs-page">
      <DiscoveryHero
        title={title}
        breadcrumbs={breadcrumbs}
        eyebrow="Travel Stories & Local Insights"
        description={
          page?.short_description ||
          page?.description ||
          "In-depth historical context, packing tips, culture guides, and travel inspiration directly from Sun Pyramids Tours."
        }
        bgImage={banner}
      />


      <BlogExplorer initialListing={listing} categories={categories} locale={locale} initialTitle={initialTitle} />

      {faqs.length ? (
        <section className="home-faq-section blogs-faq-section">
          <div className="home-faq-title">
            <h2>{copy.faqTitle}</h2>
            <Link className="see-more-link" href={withLocale("/faqs", locale)}>{copy.seeMore}</Link>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details className="faq-item" key={String(faq.id || faq.question || faq.title)}>
                <summary>{String(faq.question || faq.title || "Question")}</summary>
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer || faq.description) }} />
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="home-help-section container-shell blogs-help-section">
        <div className="home-help-panel"><h2>{copy.needHelp}</h2><HomeNeedHelpForm locale={locale} /></div>
      </section>

      <TravelPartners />
    </main>
  );
}
