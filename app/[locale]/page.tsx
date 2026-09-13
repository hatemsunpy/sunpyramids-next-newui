import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { HomePage } from "@/components/HomePage";
import { JsonLd } from "@/components/JsonLd";
import { getCategories, getHome, getHomeBlogs, getHomeDestinations, getHomeFaqs, getHomeTours, getPublicSiteSettings, getTripTaxonomy } from "@/lib/data";
import { getYesterdayCalendarDate } from "@/lib/local-date";
import { isLocale } from "@/lib/locales";
import { metadataFromPage } from "@/lib/seo";
import type { Locale } from "@/types/api";

type Props = { params: Promise<{ locale: string }> };

async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return locale;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const page = await getHome(locale);
  return metadataFromPage(page, `/${locale}`, locale);
}

export default async function Page({ params }: Props) {
  const locale = await resolveLocale(params);
  const yesterday = getYesterdayCalendarDate();
  const [page, tours, popularTours, specialOffers, highlights, blogs, faqs, settings, events, taxonomy] = await Promise.all([
    getHome(locale),
    getHomeTours("tours?exists=wishlisted&categories.id=7&order_by=display_order,asc&page=1&page_limit=4", locale),
    getHomeTours("tours/home?featured=1&page=1&order_by=display_order,asc&page_limit=8", locale),
    getHomeTours("tours/home?page=1&page_limit=4&order_by=display_order,asc&categories.id=53", locale),
    getHomeDestinations(locale),
    getHomeBlogs(locale),
    getHomeFaqs(locale),
    getPublicSiteSettings(locale),
    getCategories(`categories?parent_id=55&enabled=1&date=gt::${yesterday}&order_by=date,asc`, locale, 6),
    getTripTaxonomy(locale),
  ]);

  return (
    <SiteShell locale={locale} settings={settings}>
      <JsonLd schema={page?.seo?.structure_schema} />
      <HomePage page={page} tours={tours} popularTours={popularTours} specialOffers={specialOffers} highlights={highlights} blogs={blogs} faqs={faqs} events={events} rootCategories={taxonomy.rootCategories.map(({ slug, title, name }) => ({ slug, title, name }))} socialLinks={settings.socialLinks} locale={locale} />
    </SiteShell>
  );
}
