import "@/styles/interior.scss";
import type { Metadata } from "next";
import { getPageReliable } from "@/lib/data";
import { resolveRequiredApiResult } from "@/lib/resolve-api-result";
import { metadataFromPage } from "@/lib/seo";

export { default } from "@/app/book-egypt-trip/page";

export async function generateMetadata(): Promise<Metadata> {
  const page = resolveRequiredApiResult(
    await getPageReliable("plan-your-egypt-journey", "en"),
    "plan-your-egypt-journey page",
  );
  return metadataFromPage(page, "/egypt-tours/plan-your-egypt-journy", "en", {
    alternateLocales: ["en"],
  });
}
