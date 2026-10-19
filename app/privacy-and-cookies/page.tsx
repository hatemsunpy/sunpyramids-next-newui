import "@/styles/interior.scss";
import { GenericRoute } from "@/components/GenericRoute";
import { genericMetadata } from "@/lib/generic-metadata";
export const generateMetadata = () => genericMetadata("privacy-and-cookies");
export default function Page() { return <GenericRoute route="privacy-and-cookies" />; }
