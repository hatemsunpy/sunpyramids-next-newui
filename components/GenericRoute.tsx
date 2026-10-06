import { GenericPage } from "@/components/GenericPage";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/SiteShell";
import { genericPages } from "@/lib/generic-page-config";
import { getBlogs, getCategories, getFaqs, getPage, getTours, tourListData } from "@/lib/data";
import type { ApiList, Locale, Tour } from "@/types/api";

export async function GenericRoute({ route, locale = "en" }: { route: string; locale?: Locale }) {
  const config = genericPages[route];
  const [page, faqs, categories, toursResponse, blogs] = await Promise.all([
    getPage(config.apiSlug, locale),
    ["faqs", "about-us", "accessible-travel", "sustainability"].includes(route) ? getFaqs(locale, 200) : Promise.resolve([]),
    route === "events" ? getCategories("categories?parent_id=55&order_by=display_order,asc", locale, 100) : Promise.resolve([]),
    route === "accessible-travel"
      ? getTours("tours?categories.slug=disabled&order_by=display_order,asc", locale, 4)
      : route === "sustainability"
        ? getTours("tours?categories.slug=sustainability&order_by=display_order,asc", locale, 4)
        : Promise.resolve([]),
    route === "accessible-travel" ? getBlogs(locale, 4) : Promise.resolve([]),
  ]);
  const tours = tourListData(toursResponse as ApiList<Tour> | null);

  return (
    <SiteShell locale={locale}>
      <JsonLd schema={page?.seo?.structure_schema} />
      <GenericPage
        page={page}
        fallbackTitle={config.title}
        route={route}
        locale={locale}
        faqs={faqs}
        categories={categories}
        tours={tours}
        blogs={blogs}
      />
    </SiteShell>
  );
}
