import "@/styles/interior.scss";
import { PaymentStatusPage } from "@/components/ClonedNuxtPages";

export default function Page() {
  return <PaymentStatusPage provider="PayPal" status="canceled" callback="paypal-canceled" />;
}
