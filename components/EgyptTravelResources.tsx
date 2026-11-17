import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "@/components/ResponsiveImage";
import { egyptTravelResourcesCopy } from "@/components/egypt-travel-resources-copy";
import { journeyExcerpt } from "@/components/multi-country/excerpt";
import { getEgyptTravelResourcesData } from "@/lib/data";
import { withLocale } from "@/lib/locales";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { uiCopy } from "@/lib/ui-copy";
import type { ApiPage, Locale } from "@/types/api";
import directory from "@/styles/destinations-directory.module.scss";
import styles from "@/styles/egypt-travel-resources.module.scss";

function EgyptJournal({ blogs, locale }: { blogs: ApiPage[]; locale: Locale }) {
  const copy = egyptTravelResourcesCopy[locale];
  const articles = new Map<string, { title: string; href: string; image?: string; excerpt: string }>();

  for (const blog of blogs) {
    const slug = blog.slug?.trim();
    const title = blog.title?.trim() || blog.name?.trim();
    if (!slug || !title || articles.has(slug)) continue;
    articles.set(slug, {
      title,
      href: withLocale(`/blog/${encodeURIComponent(slug)}`, locale),
      image: blog.featured_image?.trim() || blog.image?.trim() || blog.banner?.trim(),
      excerpt: journeyExcerpt(blog.short_description || blog.description || blog.content || ""),
    });
  }

  const featured = [...articles.values()].filter((article) => article.image).slice(0, 4);
  const journal = [...articles.values()].filter((article) => !featured.includes(article)).slice(0, 4);

  return (
    <section id="egypt-travel-guide" className={styles.guide} aria-labelledby="egypt-travel-guide-heading">
      <div className={`${directory.wrap} ${styles.layout}`}>
        <div className={styles.intro}>
          <h2 className={directory.sectionTitle} id="egypt-travel-guide-heading">{copy.guideTitle}</h2>
          <p>{copy.guideIntro}</p>
          <Link className={styles.textLink} href={withLocale("/egypt-travel-guide", locale)}>
            {copy.guideLink}<ArrowRight size={15} aria-hidden="true" />
          </Link>
          {journal.length > 0 && (
            <div className={styles.journal}>
              <h3>{copy.journalTitle}</h3>
              <ul>
                {journal.map((article) => (
                  <li key={article.href}>
                    <Link href={article.href} prefetch={false}>
                      {article.title}<ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link className={styles.textLink} href={withLocale("/blogs/all-blogs", locale)}>
            {copy.journalLink}<ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {featured.length > 0 && (
          <div className={styles.articles}>
            {featured.map((article) => (
              <article key={article.href}>
                <Link className={styles.article} href={article.href} prefetch={false}>
                  <div className={styles.photo}>
                    {article.image && <Image src={article.image} alt="" fill sizes="(max-width: 530px) 94vw, (max-width: 760px) 46vw, 32vw" />}
                  </div>
                  <div className={styles.articleBody}>
                    <h3>{article.title}</h3>
                    {article.excerpt && <p>{article.excerpt}</p>}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function faqPriority(faq: ApiPage) {
  const tag = faq.tag;
  if (typeof tag !== "string") return 3;
  if (tag === "destinations.egypt" || tag === "pages.egypt" || (tag.startsWith("blogs.") && tag.includes("egypt"))) return 0;
  if (tag === "pages.general") return 1;
  if (tag === "pages.blog") return 2;
  return 3;
}

function EgyptFaqs({ faqs, locale }: { faqs: ApiPage[]; locale: Locale }) {
  const copy = egyptTravelResourcesCopy[locale];
  const entries = new Map<string, string>();

  for (const faq of [...faqs].sort((first, second) => faqPriority(first) - faqPriority(second))) {
    const question = journeyExcerpt(String(faq.question || faq.title || "")).replace(/^[▪•]\s*/, "");
    const answer = sanitizeHtml(faq.answer || faq.description).trim();
    if (question && answer && !entries.has(question)) entries.set(question, answer);
    if (entries.size === 10) break;
  }

  return (
    <section id="egypt-faqs" className={styles.faq} aria-labelledby="egypt-faqs-heading">
      <div className={`${directory.wrap} ${styles.layout}`}>
        <div className={styles.intro}>
          <p className={directory.sectionLabel}>{uiCopy(locale).destEgypt}</p>
          <h2 className={directory.sectionTitle} id="egypt-faqs-heading">{copy.faqTitle}</h2>
          <p>{copy.faqIntro}</p>
          <Link className={styles.quote} href={withLocale("/make-your-trip", locale)}>
            {copy.quote}<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div>
          {[...entries].map(([question, answer]) => (
            <details className={styles.question} key={question}>
              <summary>
                <span>{question}</span>
                <span className={styles.chevron}><ChevronDown size={16} aria-hidden="true" /></span>
              </summary>
              <div className={styles.answer} dangerouslySetInnerHTML={{ __html: answer }} />
            </details>
          ))}
          <Link className={styles.allFaqs} href={withLocale("/faqs", locale)}>{copy.faqLink}</Link>
        </div>
      </div>
    </section>
  );
}

export async function EgyptTravelResources({ locale }: { locale: Locale }) {
  const { blogs, faqs } = await getEgyptTravelResourcesData(locale);

  return (
    <>
      <EgyptJournal blogs={blogs} locale={locale} />
      <EgyptFaqs faqs={faqs} locale={locale} />
    </>
  );
}
