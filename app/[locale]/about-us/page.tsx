import "@/styles/interior.scss";
import type { Metadata } from "next";
import { GenericPage } from "@/components/GenericPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { getCompanyTeam, getFaqs, getPage } from "@/lib/data";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { metadataFromPage } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolvePrefixedLocale(params);
  const page = await getPage("about-us", locale);
  return metadataFromPage(page, `/${locale}/about-us`, locale);
}

export default async function Page({ params }: Props) {
  const locale = await resolvePrefixedLocale(params);
  const [page, faqs, team] = await Promise.all([getPage("about-us", locale), getFaqs(locale, 5), getCompanyTeam(locale)]);
  return (
    <SiteShell locale={locale}>
      <JsonLd schema={page?.seo?.structure_schema} />
      <GenericPage page={page} fallbackTitle="About Us" route="about-us" locale={locale} faqs={faqs} team={team} />
    </SiteShell>
  );
}
