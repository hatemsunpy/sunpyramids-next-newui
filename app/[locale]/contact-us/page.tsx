import "@/styles/interior.scss";
import type { Metadata } from "next";
import { GenericPage } from "@/components/GenericPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { getPage, getPublicSiteSettings } from "@/lib/data";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolvePrefixedLocale(params);
  const page = await getPage("contact-us", locale);
  return metadataFromPage(page, `/${locale}/contact-us`, locale);
}

export default async function Page({ params }: Props) {
  const locale = await resolvePrefixedLocale(params);
  const [page, settings] = await Promise.all([getPage("contact-us", locale), getPublicSiteSettings(locale)]);
  return (
    <SiteShell locale={locale} settings={settings}>
      <JsonLd schema={page?.seo?.structure_schema} />
      <GenericPage page={page} fallbackTitle="Contact Us" route="contact-us" locale={locale} settings={settings} />
    </SiteShell>
  );
}
