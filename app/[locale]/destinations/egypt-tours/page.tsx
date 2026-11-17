import { EgyptDestinationPage } from "@/components/EgyptDestinationPage";
import { egyptDestinationPath } from "@/lib/destination-links";
import { loadEgyptDestination } from "@/lib/egypt-destination";
import { withLocale } from "@/lib/locales";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = await resolvePrefixedLocale(params);
  return metadataFromPage(await loadEgyptDestination(locale), withLocale(egyptDestinationPath, locale), locale);
}

export default async function Page({ params }: Props) {
  return <EgyptDestinationPage locale={await resolvePrefixedLocale(params)} />;
}
