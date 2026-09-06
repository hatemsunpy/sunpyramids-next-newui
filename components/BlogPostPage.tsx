import Image from "next/image";
import Link from "next/link";
import { BlogCard } from "@/components/BlogCard";
import { BlogTableOfContents, type BlogHeading } from "@/components/BlogTableOfContents";
import { DeferredBlogAdventureMedia } from "@/components/DeferredBlogAdventureMedia";
import { HomeNeedHelpForm } from "@/components/HomeNeedHelpForm";
import { TourCard } from "@/components/TourCard";
import { blogPostCopy } from "@/lib/blog-copy";
import { homeCopy } from "@/lib/home-copy";
import { withLocale } from "@/lib/locales";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { ApiPage, Locale } from "@/types/api";

function plainText(rawHtml: string) {
  return rawHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function headingId(title: string, index: number) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `article-${slug || index + 1}`;
}

function prepareArticle(rawArticleHtml: unknown) {
  const headings: BlogHeading[] = [];
  const seen = new Map<string, number>();
  const html = sanitizeHtml(rawArticleHtml).replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_match, rawLevel: string, rawAttributes: string, innerHtml: string) => {
      const level = Number(rawLevel) as 2 | 3;
      const title = plainText(innerHtml);
      if (!title) return _match;
      const baseId = headingId(title, headings.length);
      const duplicate = seen.get(baseId) || 0;
      seen.set(baseId, duplicate + 1);
      const id = duplicate ? `${baseId}-${duplicate + 1}` : baseId;
      headings.push({ id, level, title });
      const attributes = rawAttributes.replace(/\s+id\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
      return `<h${level}${attributes} id="${id}">${innerHtml}</h${level}>`;
    },
  );
  return { html, headings };
}

function formatDate(dateValue: string | null | undefined, locale: Locale) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function AdventureCard({ locale }: { locale: Locale }) {
  const copy = blogPostCopy(locale);
  return (
    <aside className="editorial-adventure-card">
      <div className="card-eyebrow">{copy.plan || "Egypt Adventures"}</div>
      <h3 className="card-title">Experience Egypt Beyond the Pages</h3>
      <p className="card-text">
        Private, tailored itineraries guided by licensed Egyptologists since 1970.
      </p>
      <div className="card-actions">
        <Link className="btn-primary" href={withLocale("/make-your-trip", locale)}>
          {copy.make || "Design Your Trip"}
        </Link>
        <Link className="btn-outline" href={withLocale("/trips", locale)}>
          {copy.explore || "Explore All Tours"}
        </Link>
      </div>
      <DeferredBlogAdventureMedia />
    </aside>
  );
}

function BlogPostHeader({
  blog,
  title,
  image,
  date,
  locale,
}: {
  blog: ApiPage;
  title: string;
  image: string;
  date: string;
  locale: Locale;
}) {
  const copy = blogPostCopy(locale);
  const primaryCategory = blog.categories?.[0]?.title || blog.categories?.[0]?.name;

  return (
    <header className="editorial-hero">
      <div className="editorial-hero-inner">
        <nav className="editorial-breadcrumb" aria-label="Breadcrumb">
          <Link href={withLocale("/", locale)}>{copy.home}</Link>
          <span className="separator" aria-hidden="true">›</span>
          <Link href={withLocale("/blogs/all-blogs", locale)}>{copy.blogs}</Link>
          {primaryCategory && (
            <>
              <span className="separator" aria-hidden="true">›</span>
              <span>{primaryCategory}</span>
            </>
          )}
          <span className="separator" aria-hidden="true">›</span>
          <span className="current" aria-current="page">{title}</span>
        </nav>

        <span className="editorial-eyebrow">
          {primaryCategory || "Travel Journal"}
        </span>

        <h1 className="editorial-title">{title}</h1>

        <div className="editorial-meta">
          {date && (
            <span className="meta-item">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <time dateTime={blog.published_at || blog.created_at || undefined}>{date}</time>
            </span>
          )}
        </div>

        {blog.short_description && (
          <p className="editorial-standfirst">{blog.short_description}</p>
        )}

        {image && (
          <div className="editorial-lead-media">
            <Image
              src={image}
              alt={title}
              fill
              priority
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
          </div>
        )}
      </div>
    </header>
  );
}

function BlogPostArticle({
  html,
  headings,
  locale,
}: {
  html: string;
  headings: BlogHeading[];
  locale: Locale;
}) {
  const copy = blogPostCopy(locale);
  return (
    <section className="editorial-main-section">
      <div className="editorial-container">
        <div className="editorial-layout">
          <article className="editorial-prose" dangerouslySetInnerHTML={{ __html: html }} />

          <div className="editorial-sidebar">
            {headings.length > 0 && (
              <aside className="editorial-toc-card">
                <h2 className="toc-title">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <span>{copy.contents || "Table of Contents"}</span>
                </h2>
                <BlogTableOfContents headings={headings} />
              </aside>
            )}

            <AdventureCard locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}

function RelatedTours({ blog, locale }: { blog: ApiPage; locale: Locale }) {
  const tours = blog.related_tours || [];
  if (!tours.length) return null;
  return (
    <section className="editorial-related-section">
      <div className="editorial-container">
        <div className="section-header">
          <h2>{blogPostCopy(locale).relatedTours || "Recommended Tours"}</h2>
          <Link className="see-more" href={withLocale("/trips", locale)}>
            View all tours &rarr;
          </Link>
        </div>
        <div className="discovery-grid">
          {tours.slice(0, 3).map((tour) => (
            <TourCard key={tour.id || tour.slug} tour={tour} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogPostFaqs({ faqs, locale }: { faqs: ApiPage[]; locale: Locale }) {
  const copy = blogPostCopy(locale);
  if (!faqs.length) return null;

  return (
    <section className="editorial-related-section">
      <div className="editorial-container">
        <div className="editorial-faq-container">
          <div className="section-header">
            <h2>{copy.faqs || "Frequently Asked Questions"}</h2>
            <Link className="see-more" href={withLocale("/faqs", locale)}>
              {copy.seeMore || "Browse all FAQs"} &rarr;
            </Link>
          </div>
          <div className="editorial-faq-list">
            {faqs.map((faq) => (
              <details className="editorial-faq-item" key={String(faq.id || faq.question || faq.title)}>
                <summary>
                  <span>{String(faq.question || faq.title || "Question")}</span>
                  <span className="faq-icon" aria-hidden="true" />
                </summary>
                <div
                  className="faq-answer"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(faq.answer || faq.description) }}
                />
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RelatedBlogs({ blogs, locale }: { blogs: ApiPage[]; locale: Locale }) {
  if (!blogs.length) return null;
  return (
    <section className="editorial-related-section">
      <div className="editorial-container">
        <div className="section-header">
          <h2>{blogPostCopy(locale).relatedBlogs || "Related Articles"}</h2>
          <Link className="see-more" href={withLocale("/blogs/all-blogs", locale)}>
            Explore journal &rarr;
          </Link>
        </div>
        <div className="discovery-grid">
          {blogs.slice(0, 3).map((blog) => (
            <BlogCard key={blog.id || blog.slug} blog={blog} locale={locale} variant="listing" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlogPostPage({
  blog,
  faqs,
  relatedBlogs,
  locale = "en",
}: {
  blog: ApiPage;
  faqs: ApiPage[];
  relatedBlogs: ApiPage[];
  locale?: Locale;
}) {
  const title = blog.title || blog.name || "Egypt Travel Guide";
  const image = blog.featured_image || blog.image || blog.banner || "/images/blogsHero.png";
  const date = formatDate(blog.published_at || blog.created_at, locale);
  const { html, headings } = prepareArticle(blog.description || blog.content);

  return (
    <main className="blog-post-page">
      <BlogPostHeader blog={blog} title={title} image={image} date={date} locale={locale} />
      <BlogPostArticle html={html} headings={headings} locale={locale} />
      <RelatedTours blog={blog} locale={locale} />
      <BlogPostFaqs faqs={faqs} locale={locale} />
      <RelatedBlogs blogs={relatedBlogs} locale={locale} />
      <section className="home-help-section blog-post-help">
        <div className="home-help-panel">
          <h2>{homeCopy(locale).needHelp || "Need Help Planning?"}</h2>
          <HomeNeedHelpForm locale={locale} />
        </div>
      </section>
    </main>
  );
}
