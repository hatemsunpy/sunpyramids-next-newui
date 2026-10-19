import "@/styles/interior.scss";
import type { Metadata } from "next";
import { BlogPostPage } from "@/components/BlogPostPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { getBlogPostFaqs, getBlogReliable, getRelatedBlogs } from "@/lib/data";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { resolveRequiredApiResult } from "@/lib/resolve-api-result";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const blog = resolveRequiredApiResult(await getBlogReliable(resolved.slug, locale), `blog "${resolved.slug}"`);
  return metadataFromPage(blog, `/${locale}/blog/${resolved.slug}`, locale);
}

export default async function Page({ params }: Props) {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const [blogResult, faqs, relatedBlogs] = await Promise.all([
    getBlogReliable(resolved.slug, locale),
    getBlogPostFaqs(resolved.slug, locale),
    getRelatedBlogs(resolved.slug, locale),
  ]);
  const blog = resolveRequiredApiResult(blogResult, `blog "${resolved.slug}"`);
  return (
    <SiteShell locale={locale}>
      <JsonLd schema={blog?.seo?.structure_schema} />
      <BlogPostPage blog={blog} faqs={faqs} relatedBlogs={relatedBlogs} locale={locale} />
    </SiteShell>
  );
}
