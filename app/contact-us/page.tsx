import "@/styles/interior.scss";
import type { Metadata } from "next";
import { GenericPage } from "@/components/GenericPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { getPage, getPublicSiteSettings } from "@/lib/data";
import { metadataFromPage } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact-us", "en");
  return metadataFromPage(page, "/contact-us", "en");
}

export default async function Page() {
  const [page, settings] = await Promise.all([getPage("contact-us", "en"), getPublicSiteSettings("en")]);
  return (
    <SiteShell locale="en" settings={settings}>
      <JsonLd schema={page?.seo?.structure_schema} />
      <GenericPage page={page} fallbackTitle="Contact Us" route="contact-us" settings={settings} />
    </SiteShell>
  );
}
