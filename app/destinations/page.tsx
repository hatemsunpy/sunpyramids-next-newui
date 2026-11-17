import { DestinationsDirectory } from "@/components/DestinationsDirectory";
import { destinationsPath } from "@/lib/destination-links";
import { loadDestinationsPage } from "@/lib/destinations-directory";
import { metadataFromPage } from "@/lib/seo";

export async function generateMetadata() {
  return metadataFromPage(await loadDestinationsPage("en"), destinationsPath, "en");
}

export default function Page() {
  return <DestinationsDirectory locale="en" />;
}
