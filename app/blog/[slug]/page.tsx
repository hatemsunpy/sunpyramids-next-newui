import "@/styles/interior.scss";
import type { Metadata } from "next";
import { BlogPostPage } from "@/components/BlogPostPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { getBlogPostFaqs, getBlogReliable, getRelatedBlogs } from "@/lib/data";
import { resolveRequiredApiResult } from "@/lib/resolve-api-result";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = resolveRequiredApiResult(await getBlogReliable(slug, "en"), `blog "${slug}"`);
  return metadataFromPage(blog, `/blog/${slug}`, "en");
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [blogResult, faqs, relatedBlogs] = await Promise.all([
    getBlogReliable(slug, "en"),
    getBlogPostFaqs(slug, "en"),
    getRelatedBlogs(slug, "en"),
  ]);
  const blog = resolveRequiredApiResult(blogResult, `blog "${slug}"`);
  return (
    <SiteShell locale="en">
      <JsonLd schema={blog?.seo?.structure_schema} />
      <BlogPostPage blog={blog} faqs={faqs} relatedBlogs={relatedBlogs} />
    </SiteShell>
  );
}
