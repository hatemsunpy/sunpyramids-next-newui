import { EgyptDestinationPage } from "@/components/EgyptDestinationPage";
import { egyptDestinationPath } from "@/lib/destination-links";
import { loadEgyptDestination } from "@/lib/egypt-destination";
import { metadataFromPage } from "@/lib/seo";

export async function generateMetadata() {
  return metadataFromPage(await loadEgyptDestination("en"), egyptDestinationPath, "en");
}

export default function Page() {
  return <EgyptDestinationPage locale="en" />;
}
