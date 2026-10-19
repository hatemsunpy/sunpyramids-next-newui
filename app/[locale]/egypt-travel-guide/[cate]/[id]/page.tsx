import "@/styles/interior.scss";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { TravelGuidePage } from "@/components/ClonedNuxtPages";
import {
  blogCategoryExists,
  getBlogCategoryReliable,
  getCategoryBlogsReliable,
} from "@/lib/data";
import { formatApiError } from "@/lib/api";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";
import type { ApiPage, Locale } from "@/types/api";

type Props = { params: Promise<{ locale: string; cate: string; id: string }> };

async function resolveTravelGuideDetail(
  cate: string,
  id: string,
  locale: Locale,
): Promise<{ category: ApiPage | null; blogs: ApiPage[] }> {
  const [parentResult, articleResult, blogsResult] = await Promise.all([
    blogCategoryExists(cate, locale),
    getBlogCategoryReliable(id, locale),
    getCategoryBlogsReliable(id, locale),
  ]);

  if (!parentResult.ok) {
    if (parentResult.reason === "not_found") notFound();
    throw new Error(`Failed to validate parent category "${cate}": ${formatApiError(parentResult)}`);
  }
  const parent = parentResult.value;
  if (!parent) notFound();

  if (!articleResult.ok) {
    if (articleResult.reason === "not_found") notFound();
    throw new Error(`Failed to fetch article "${id}": ${formatApiError(articleResult)}`);
  }
  const article = articleResult.value;
  if (!article) notFound();

  const articleParentId =
    typeof article.parent_id === "number"
      ? article.parent_id
      : article.parent_id != null
        ? Number(article.parent_id)
        : null;
  if (articleParentId != null && parent.id != null && articleParentId !== Number(parent.id)) {
    notFound();
  }

  if (!blogsResult.ok) {
    if (blogsResult.reason === "not_found") notFound();
    throw new Error(`Failed to fetch blogs for "${id}": ${formatApiError(blogsResult)}`);
  }

  return { category: article, blogs: blogsResult.value ?? [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const { category } = await resolveTravelGuideDetail(resolved.cate, resolved.id, locale);
  return metadataFromPage(
    category,
    `/${locale}/egypt-travel-guide/${resolved.cate}/${resolved.id}`,
    locale,
  );
}

export default async function Page({ params }: Props) {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const { category, blogs } = await resolveTravelGuideDetail(resolved.cate, resolved.id, locale);
  return (
    <SiteShell locale={locale}>
      <TravelGuidePage page={category} categories={[]} blogs={blogs} locale={locale} />
    </SiteShell>
  );
}