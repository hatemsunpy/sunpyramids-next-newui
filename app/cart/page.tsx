import "@/styles/interior.scss";
import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { CartClonePage } from "@/components/ClonedNuxtPages";
import { commercePageMetadata } from "@/lib/seo";

export const metadata: Metadata = commercePageMetadata("cart", "en");

export default function Page() {
  return <SiteShell locale="en"><CartClonePage /></SiteShell>;
}
