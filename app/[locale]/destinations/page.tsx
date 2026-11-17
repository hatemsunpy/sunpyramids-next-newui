import { DestinationsDirectory } from "@/components/DestinationsDirectory";
import { destinationsPath } from "@/lib/destination-links";
import { loadDestinationsPage } from "@/lib/destinations-directory";
import { withLocale } from "@/lib/locales";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = await resolvePrefixedLocale(params);
  return metadataFromPage(await loadDestinationsPage(locale), withLocale(destinationsPath, locale), locale);
}

export default async function Page({ params }: Props) {
  return <DestinationsDirectory locale={await resolvePrefixedLocale(params)} />;
}
