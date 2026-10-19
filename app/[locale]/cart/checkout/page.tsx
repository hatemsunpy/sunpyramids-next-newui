import "@/styles/interior.scss";
import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { CartClonePage } from "@/components/ClonedNuxtPages";
import { resolvePrefixedLocale } from "@/lib/route-helpers";
import { commercePageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolvePrefixedLocale(params);
  return commercePageMetadata("checkout", locale);
}

export default async function Page({ params }: Props) {
  const locale = await resolvePrefixedLocale(params);
  return <SiteShell locale={locale}><CartClonePage checkout locale={locale} /></SiteShell>;
}
