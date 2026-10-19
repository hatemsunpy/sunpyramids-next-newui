import "@/styles/interior.scss";
import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { TravelGuidePage } from "@/components/ClonedNuxtPages";
import { JsonLd } from "@/components/JsonLd";
import { getBlogCategories, getPage } from "@/lib/data";
import { metadataFromPage } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("blog", "en");
  return metadataFromPage(page, "/egypt-travel-guide", "en");
}

export default async function Page() {
  const [page, categories] = await Promise.all([getPage("blog", "en"), getBlogCategories("en")]);
  return (
    <SiteShell locale="en">
      <JsonLd schema={page?.seo?.structure_schema} />
      <TravelGuidePage page={page} categories={categories} />
    </SiteShell>
  );
}
