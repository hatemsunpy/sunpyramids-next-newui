import Image from "@/components/ResponsiveImage";
import Link from "next/link";
import { withLocale } from "@/lib/locales";
import type { ApiPage, Locale } from "@/types/api";

// Editorial grouped block for the newest articles on the all-blogs listing.
// Presentational only: it renders exactly the API records passed to it
// (first five of the listing, already newest-first) and invents no data.
export function BlogHighlights({
  articles,
  locale = "en",
  heading,
}: {
  articles: ApiPage[];
  locale?: Locale;
  heading: string;
}) {
  if (!articles.length) return null;
  const [lead, ...compact] = articles;

  return (
    <section className="blog-highlights" aria-labelledby="blog-highlights-title">
      <div className="blog-highlights-inner">
        <h2 className="blog-highlights-title" id="blog-highlights-title">{heading}</h2>
        <div className="blog-highlights-panel">
          <article className="blog-highlights-card blog-highlights-lead">
            <Link href={withLocale(`/blog/${lead.slug || String(lead.id || "")}`, locale)}>
              <div className="blog-highlights-media">
                <Image src={articleImage(lead)} alt={articleTitle(lead)} fill sizes="(max-width: 768px) 92vw, 40vw" />
              </div>
              <div className="blog-highlights-body">
                {articleCategory(lead) ? <p className="blog-highlights-category">{articleCategory(lead)}</p> : null}
                <h3 className="blog-highlights-lead-title">{articleTitle(lead)}</h3>
                {formatArticleDate(lead.created_at, locale) ? (
                  <time className="blog-highlights-date" dateTime={lead.created_at || undefined}>
                    {formatArticleDate(lead.created_at, locale)}
                  </time>
                ) : null}
              </div>
            </Link>
          </article>
          {compact.length ? (
            <div className="blog-highlights-grid">
              {compact.map((blog) => (
                <article className="blog-highlights-card" key={blog.id || blog.slug}>
                  <Link href={withLocale(`/blog/${blog.slug || String(blog.id || "")}`, locale)}>
                    <div className="blog-highlights-media">
                      <Image src={articleImage(blog)} alt={articleTitle(blog)} fill sizes="(max-width: 768px) 46vw, 20vw" />
                    </div>
                    <div className="blog-highlights-body">
                      {articleCategory(blog) ? <p className="blog-highlights-category">{articleCategory(blog)}</p> : null}
                      <h3 className="blog-highlights-compact-title">{articleTitle(blog)}</h3>
                      {formatArticleDate(blog.created_at, locale) ? (
                        <time className="blog-highlights-date" dateTime={blog.created_at || undefined}>
                          {formatArticleDate(blog.created_at, locale)}
                        </time>
                      ) : null}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function articleImage(blog: ApiPage) {
  return blog.featured_image || blog.image || blog.banner || "/images/blogsHero.webp";
}

function articleTitle(blog: ApiPage) {
  return blog.title || blog.name || "";
}

function articleCategory(blog: ApiPage) {
  const category = blog.categories?.[0];
  return category ? category.title || category.name || "" : "";
}

// Same localized date format as the editorial blog post header.
export function formatArticleDate(value: string | null | undefined, locale: Locale) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}