import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { TourPage } from "@/components/TourPage";
import { getPublicSiteSettings, getRelatedTours, getTourReliable } from "@/lib/data";
import { decodePathSegment, tourPath } from "@/lib/locales";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { resolveRequiredApiResult } from "@/lib/resolve-api-result";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const slug = decodePathSegment(resolved.slug);
  const tour = resolveRequiredApiResult(await getTourReliable(slug, locale), `tour "${slug}"`);
  return metadataFromPage(tour, tourPath(slug, locale), locale);
}

export default async function Page({ params }: Props) {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const slug = decodePathSegment(resolved.slug);
  const settingsPromise = getPublicSiteSettings(locale);
  const tour = resolveRequiredApiResult(await getTourReliable(slug, locale), `tour "${slug}"`);
  const [relatedTours, settings] = await Promise.all([
    getRelatedTours(tour, locale, 12),
    settingsPromise,
  ]);
  return (
    <SiteShell locale={locale} settings={settings}>
      <JsonLd schema={tour?.seo?.structure_schema} />
      <TourPage tour={tour} relatedTours={relatedTours} locale={locale} />
    </SiteShell>
  );
}
