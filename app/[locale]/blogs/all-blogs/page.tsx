import "@/styles/interior.scss";
import type { Metadata } from "next";
import { AllBlogsPage } from "@/components/AllBlogsPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { getAllBlogCategories, getBlogFaqs, getBlogListing, getPage } from "@/lib/data";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ title?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolvePrefixedLocale(params);
  const page = await getPage("all-blogs", locale);
  return metadataFromPage(page, `/${locale}/blogs/all-blogs`, locale);
}

export default async function Page({ params, searchParams }: Props) {
  const locale = await resolvePrefixedLocale(params);
  const query = await searchParams;
  const initialTitle = Array.isArray(query.title) ? query.title[0] || "" : query.title || "";
  const [page, listing, categories, faqs] = await Promise.all([
    getPage("all-blogs", locale),
    getBlogListing(locale, initialTitle),
    getAllBlogCategories(locale),
    getBlogFaqs(locale),
  ]);
  return (
    <SiteShell locale={locale}>
      <JsonLd schema={page?.seo?.structure_schema} />
      <AllBlogsPage page={page} listing={listing} categories={categories} faqs={faqs} locale={locale} initialTitle={initialTitle} />
    </SiteShell>
  );
}
