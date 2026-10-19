import "@/styles/interior.scss";
import { Suspense } from "react";
import { SocialLoginCallback } from "@/components/SocialLoginCallback";
import { resolvePrefixedLocale } from "@/lib/route-helpers";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const locale = await resolvePrefixedLocale(params);
  return <Suspense fallback={null}><SocialLoginCallback locale={locale} /></Suspense>;
}
