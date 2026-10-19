import "@/styles/interior.scss";
import { GenericRoute } from "@/components/GenericRoute";
import { genericMetadata } from "@/lib/generic-metadata";
export const generateMetadata = () => genericMetadata("rent-car");
export default function Page() { return <GenericRoute route="rent-car" />; }
