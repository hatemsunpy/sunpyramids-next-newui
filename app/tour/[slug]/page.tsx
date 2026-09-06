import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { TourPage } from "@/components/TourPage";
import { getPublicSiteSettings, getRelatedTours, getTourReliable } from "@/lib/data";
import { decodePathSegment, tourPath } from "@/lib/locales";
import { resolveRequiredApiResult } from "@/lib/resolve-api-result";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodePathSegment((await params).slug);
  const tour = resolveRequiredApiResult(await getTourReliable(slug, "en"), `tour "${slug}"`);
  return metadataFromPage(tour, tourPath(slug, "en"), "en");
}

export default async function Page({ params }: Props) {
  const slug = decodePathSegment((await params).slug);
  const settingsPromise = getPublicSiteSettings("en");
  const tour = resolveRequiredApiResult(await getTourReliable(slug, "en"), `tour "${slug}"`);
  const [relatedTours, settings] = await Promise.all([
    getRelatedTours(tour, "en", 12),
    settingsPromise,
  ]);
  return (
    <SiteShell locale="en" settings={settings}>
      <JsonLd schema={tour?.seo?.structure_schema} />
      <TourPage tour={tour} relatedTours={relatedTours} locale="en" />
    </SiteShell>
  );
}
