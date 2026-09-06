import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { TripsPage } from "@/components/TripsPage";
import { JsonLd } from "@/components/JsonLd";
import { getPage, getTours, getTripTaxonomy, tourListData, tourMeta } from "@/lib/data";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";
import { tripsRequest, type TripsSearchParams } from "@/lib/trips-query";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<TripsSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const page = await getPage("tours-search-results", locale);
  return metadataFromPage(page, `/${locale}/trips`, locale);
}
export default async function Page({ params, searchParams }: Props) {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const [page, taxonomy] = await Promise.all([
    getPage("tours-search-results", locale),
    getTripTaxonomy(locale),
  ]);
  const request = tripsRequest(await searchParams, taxonomy);
  const toursResponse = await getTours(request.endpoint, locale, 24, request.page);
  const tours = tourListData(toursResponse);
  const meta = tourMeta(toursResponse);
  return (
    <SiteShell locale={locale}>
      <JsonLd schema={page?.seo?.structure_schema} />
      <TripsPage page={page} tours={tours} taxonomy={taxonomy} locale={locale} active={request} meta={meta} />
    </SiteShell>
  );
}
