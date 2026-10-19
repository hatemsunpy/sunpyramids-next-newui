import "@/styles/interior.scss";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { TravelGuidePage } from "@/components/ClonedNuxtPages";
import { getBlogCategoryDetailReliable, getBlogCategoryReliable } from "@/lib/data";
import { formatApiError, type ApiResult } from "@/lib/api";
import { metadataFromPage } from "@/lib/seo";
import type { ApiPage, Locale } from "@/types/api";

type Props = { params: Promise<{ cate: string }> };

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
  const { cate } = await params;
  const category = await resolveCategory(cate, "en");
  return metadataFromPage(category, `/egypt-travel-guide/${cate}`, "en");
}

export default async function Page({ params }: Props) {
  const { cate } = await params;
  const category = await resolveCategoryDetail(cate, "en");
  const children = Array.isArray(category?.children) ? (category.children as ApiPage[]) : [];
  const blogs = Array.isArray(category?.blogs) ? (category.blogs as ApiPage[]) : [];
  return (
    <SiteShell locale="en">
      <TravelGuidePage
        page={category}
        categories={children}
        blogs={blogs}
        categoryBasePath={`/egypt-travel-guide/${cate}`}
      />
    </SiteShell>
  );
}
