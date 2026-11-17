import { JordanDestinationPage } from "@/components/JordanDestinationPage";
import { jordanDestinationPath } from "@/lib/destination-links";
import { loadJordanDestination } from "@/lib/jordan-destination";
import { withLocale } from "@/lib/locales";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";
import type { JordanSearchParams } from "@/lib/jordan-catalog-query";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: JordanSearchParams;
};

export async function generateMetadata({ params }: Props) {
  const locale = await resolvePrefixedLocale(params);
  return metadataFromPage(await loadJordanDestination(locale), withLocale(jordanDestinationPath, locale), locale);
}

export default async function Page({ params, searchParams }: Props) {
  return <JordanDestinationPage locale={await resolvePrefixedLocale(params)} searchParams={searchParams} />;
}
