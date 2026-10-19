import "@/styles/interior.scss";
import { GenericRoute } from "@/components/GenericRoute";
import { genericMetadata } from "@/lib/generic-metadata";
export const generateMetadata = () => genericMetadata("make-your-trip");
export default function Page() { return <GenericRoute route="make-your-trip" />; }
