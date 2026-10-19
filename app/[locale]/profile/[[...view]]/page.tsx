import "@/styles/interior.scss";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { AccountPage } from "@/components/ClonedNuxtPages";
import { resolvePrefixedLocale } from "@/lib/route-helpers";

const views = new Set(["bookings", "favourites", "settings"]);
type Props = { params: Promise<{ locale: string; view?: string[] }> };

export default async function Page({ params }: Props) {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  if (resolved.view && (resolved.view.length !== 1 || !views.has(resolved.view[0]))) notFound();
  return <SiteShell locale={locale}><AccountPage view={resolved.view?.[0] || "profile"} locale={locale} /></SiteShell>;
}
