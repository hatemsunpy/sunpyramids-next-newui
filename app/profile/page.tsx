import "@/styles/interior.scss";
import { SiteShell } from "@/components/SiteShell";
import { AccountPage } from "@/components/ClonedNuxtPages";

export default function Page() {
  return <SiteShell locale="en"><AccountPage /></SiteShell>;
}
