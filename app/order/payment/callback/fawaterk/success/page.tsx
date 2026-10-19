import "@/styles/interior.scss";
import { PaymentStatusPage } from "@/components/ClonedNuxtPages";

export default function Page() {
  return <PaymentStatusPage provider="Fawaterk" status="success" callback="fawaterk-success" />;
}
