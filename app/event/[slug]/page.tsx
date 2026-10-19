import "@/styles/interior.scss";
import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { EventDetailPage } from "@/components/ClonedNuxtPages";
import { JsonLd } from "@/components/JsonLd";
import { getCategoryReliable, getTours, tourListData } from "@/lib/data";
import { resolveRequiredApiResult } from "@/lib/resolve-api-result";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = resolveRequiredApiResult(await getCategoryReliable(slug, "en"), `event "${slug}"`);
  return metadataFromPage(event, `/event/${slug}`, "en");
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const event = resolveRequiredApiResult(await getCategoryReliable(slug, "en"), `event "${slug}"`);
  const toursResponse = event?.id ? await getTours(`tours?exists=wishlisted&categories.id=${event.id}&order_by=display_order,asc&page=1`, "en", 10) : null;
  const tours = tourListData(toursResponse);
  return (
    <SiteShell locale="en">
      <JsonLd schema={event?.seo?.structure_schema} />
      <EventDetailPage event={event} relatedTours={tours} />
    </SiteShell>
  );
}
