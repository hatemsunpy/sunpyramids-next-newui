import "@/styles/interior.scss";
import { notFound } from "next/navigation";
import { AuthPage } from "@/components/ClonedNuxtPages";
import { resolvePrefixedLocale } from "@/lib/route-helpers";

const modes = new Set([
  "confirm-code",
  "create-password",
  "forget-password",
  "reset-password",
  "sign-in",
  "sign-up",
]);

type Props = { params: Promise<{ locale: string; mode: string }> };

export default async function Page({ params }: Props) {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  if (!modes.has(resolved.mode)) notFound();
  return <AuthPage mode={resolved.mode} locale={locale} />;
}
