import { pageSitemapRecords } from "@/lib/sitemap/builders";
import { xmlResponse } from "@/lib/sitemap/response";
import { getSitemapCatalog } from "@/lib/sitemap/service";
import { sitemapUrlsetXml } from "@/lib/sitemap/xml";

// Route segment config must be a statically analyzable literal in Next.js.
export const revalidate = 86400;
export const dynamic = "force-dynamic";
export async function GET() {
  return xmlResponse(sitemapUrlsetXml(pageSitemapRecords(await getSitemapCatalog())));
}
