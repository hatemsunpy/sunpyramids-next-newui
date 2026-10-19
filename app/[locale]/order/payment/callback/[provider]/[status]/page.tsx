import "@/styles/interior.scss";
import { notFound } from "next/navigation";
import { PaymentStatusPage } from "@/components/ClonedNuxtPages";
import type { PaymentCallbackKind } from "@/components/PaymentCallbackStatus";
import { resolvePrefixedLocale } from "@/lib/route-helpers";

const callbacks: Record<string, { provider: string; status: string; callback: PaymentCallbackKind }> = {
  "paypal/verify": { provider: "PayPal", status: "verify", callback: "paypal-verify" },
  "paypal/canceled": { provider: "PayPal", status: "canceled", callback: "paypal-canceled" },
  "fawaterk/success": { provider: "Fawaterk", status: "success", callback: "fawaterk-success" },
  "fawaterk/pending": { provider: "Fawaterk", status: "pending", callback: "fawaterk-pending" },
  "fawaterk/canceled": { provider: "Fawaterk", status: "canceled", callback: "fawaterk-canceled" },
};

type Props = { params: Promise<{ locale: string; provider: string; status: string }> };

export default async function Page({ params }: Props) {
  const resolved = await params;
  const locale = await resolvePrefixedLocale(Promise.resolve({ locale: resolved.locale }));
  const config = callbacks[`${resolved.provider}/${resolved.status}`];
  if (!config) notFound();
  return <PaymentStatusPage {...config} locale={locale} />;
}
