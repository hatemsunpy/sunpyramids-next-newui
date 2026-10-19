import "@/styles/interior.scss";
import { Suspense } from "react";
import { SocialLoginCallback } from "@/components/SocialLoginCallback";

export default function Page() {
  return <Suspense fallback={null}><SocialLoginCallback /></Suspense>;
}
