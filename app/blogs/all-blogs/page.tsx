import "@/styles/interior.scss";
import type { Metadata } from "next";
import { AllBlogsPage } from "@/components/AllBlogsPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { getAllBlogCategories, getBlogFaqs, getBlogListing, getPage } from "@/lib/data";
import { metadataFromPage } from "@/lib/seo";

type Props = { searchParams: Promise<{ title?: string | string[] }> };

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("all-blogs", "en");
  return metadataFromPage(page, "/blogs/all-blogs", "en");
}

export default async function Page({ searchParams }: Props) {
  const query = await searchParams;
  const initialTitle = Array.isArray(query.title) ? query.title[0] || "" : query.title || "";
  const [page, listing, categories, faqs] = await Promise.all([
    getPage("all-blogs", "en"),
    getBlogListing("en", initialTitle),
    getAllBlogCategories("en"),
    getBlogFaqs("en"),
  ]);
  return (
    <SiteShell locale="en">
      <JsonLd schema={page?.seo?.structure_schema} />
      <AllBlogsPage page={page} listing={listing} categories={categories} faqs={faqs} locale="en" initialTitle={initialTitle} />
    </SiteShell>
  );
}
