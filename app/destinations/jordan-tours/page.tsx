import { JordanDestinationPage } from "@/components/JordanDestinationPage";
import { jordanDestinationPath } from "@/lib/destination-links";
import { loadJordanDestination } from "@/lib/jordan-destination";
import { metadataFromPage } from "@/lib/seo";
import type { JordanSearchParams } from "@/lib/jordan-catalog-query";

type Props = { searchParams: JordanSearchParams };

export async function generateMetadata() {
  return metadataFromPage(await loadJordanDestination("en"), jordanDestinationPath, "en");
}

export default function Page({ searchParams }: Props) {
  return <JordanDestinationPage locale="en" searchParams={searchParams} />;
}
