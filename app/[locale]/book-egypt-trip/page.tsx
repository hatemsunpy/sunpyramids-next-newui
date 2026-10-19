import "@/styles/interior.scss";
import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { MarketingLandingPage } from "@/components/ClonedNuxtPages";
import { JsonLd } from "@/components/JsonLd";
import { getPage, getTours, tourListData } from "@/lib/data";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolvePrefixedLocale(params);
  const page = await getPage("book-egypt-trip", locale);
  return metadataFromPage(page, `/${locale}/book-egypt-trip`, locale);
}

export default async function Page({ params }: Props) {
  const locale = await resolvePrefixedLocale(params);
  const [page, toursResponse] = await Promise.all([
    getPage("book-egypt-trip", locale),
    getTours("tours?order_by=display_order,asc&categories.id[]=54", locale, 4),
  ]);
  const tours = tourListData(toursResponse);
  return (
    <SiteShell locale={locale}>
      <JsonLd schema={page?.seo?.structure_schema} />
      <MarketingLandingPage page={page} tours={tours} locale={locale} />
    </SiteShell>
  );
}
