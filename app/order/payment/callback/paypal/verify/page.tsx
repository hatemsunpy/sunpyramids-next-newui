import "@/styles/interior.scss";
import { PaymentStatusPage } from "@/components/ClonedNuxtPages";

export default function Page() {
  return <PaymentStatusPage provider="PayPal" status="verify" callback="paypal-verify" />;
}
