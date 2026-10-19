import "@/styles/interior.scss";
import { GenericRoute } from "@/components/GenericRoute";
import { genericMetadata } from "@/lib/generic-metadata";
export const generateMetadata = () => genericMetadata("accessible-travel");
export default function Page() { return <GenericRoute route="accessible-travel" />; }
