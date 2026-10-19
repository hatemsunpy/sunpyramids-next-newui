import "@/styles/interior.scss";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { TravelGuidePage } from "@/components/ClonedNuxtPages";
import { getBlogCategoryDetailReliable, getBlogCategoryReliable } from "@/lib/data";
import { formatApiError, type ApiResult } from "@/lib/api";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";
import type { ApiPage, Locale } from "@/types/api";

type Props = { params: Promise<{ locale: string; cate: string }> };

function categoryFromResult(
  categoryResult: ApiResult<ApiPage | null>,
  cate: string,
): ApiPage {
  if (!categoryResult.ok) {
    if (categoryResult.reason === "not_found") notFound();
    throw new Error(`Failed to fetch category "${cate}": ${formatApiError(categoryResult)}`);
  }
  if (!categoryResult.value) notFound();
  return categoryResult.value;
}

async function resolveCategory(cate: string, locale: Locale): Promise<ApiPage> {
  return categoryFromResult(await getBlogCategoryReliable(cate, locale), cate);
}

async function resolveCategoryDetail(cate: string, locale: Locale): Promise<ApiPage> {
  return categoryFromResult(await getBlogCategoryDetailReliable(cate, locale), cate);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const category = await resolveCategory(resolved.cate, locale);
  return metadataFromPage(category, `/${locale}/egypt-travel-guide/${resolved.cate}`, locale);
}

export default async function Page({ params }: Props) {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const category = await resolveCategoryDetail(resolved.cate, locale);
  const children = Array.isArray(category?.children) ? (category.children as ApiPage[]) : [];
  const blogs = Array.isArray(category?.blogs) ? (category.blogs as ApiPage[]) : [];
  return (
    <SiteShell locale={locale}>
      <TravelGuidePage
        page={category}
        categories={children}
        blogs={blogs}
        categoryBasePath={`/egypt-travel-guide/${resolved.cate}`}
        locale={locale}
      />
    </SiteShell>
  );
}
