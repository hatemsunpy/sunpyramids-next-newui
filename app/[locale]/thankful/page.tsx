import { SiteShell } from "@/components/SiteShell";
import { ThankfulPage } from "@/components/ThankfulPage";
import { resolvePrefixedLocale } from "@/lib/route-helpers";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const locale = await resolvePrefixedLocale(params);
  return <SiteShell locale={locale}><ThankfulPage locale={locale} /></SiteShell>;
}
