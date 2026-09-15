import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { HomePage } from "@/components/HomePage";
import { JsonLd } from "@/components/JsonLd";
import { getCategories, getHome, getHomeBlogs, getHomeDestinations, getHomeFaqs, getHomeTours, getPublicSiteSettings, getTripTaxonomy } from "@/lib/data";
import { getYesterdayCalendarDate } from "@/lib/local-date";
import { metadataFromPage } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHome("en");
  return metadataFromPage(page, "/", "en");
}

export default async function Page() {
  const yesterday = getYesterdayCalendarDate();
  const [page, tours, popularTours, specialOffers, highlights, blogs, faqs, settings, events, taxonomy] = await Promise.all([
    getHome("en"),
    getHomeTours("tours?exists=wishlisted&categories.id=7&order_by=display_order,asc&page=1&page_limit=4", "en"),
    getHomeTours("tours/home?featured=1&page=1&order_by=display_order,asc&page_limit=8", "en"),
    getHomeTours("tours/home?page=1&page_limit=4&order_by=display_order,asc&categories.id=53", "en"),
    getHomeDestinations("en"),
    getHomeBlogs("en"),
    getHomeFaqs("en"),
    getPublicSiteSettings("en"),
    getCategories(`categories?parent_id=55&enabled=1&date=gt::${yesterday}&order_by=date,asc`, "en", 6),
    getTripTaxonomy("en"),
  ]);

  return (
    <SiteShell locale="en" settings={settings} taxonomy={taxonomy}>
      <JsonLd schema={page?.seo?.structure_schema} />
      <HomePage page={page} tours={tours} popularTours={popularTours} specialOffers={specialOffers} highlights={highlights} blogs={blogs} faqs={faqs} events={events} rootCategories={taxonomy.rootCategories.map(({ slug, title, name }) => ({ slug, title, name }))} socialLinks={settings.socialLinks} locale="en" />
    </SiteShell>
  );
}
