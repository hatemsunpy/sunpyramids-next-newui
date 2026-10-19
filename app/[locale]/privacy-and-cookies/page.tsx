import "@/styles/interior.scss";
import { LocalizedGenericRoute } from "@/components/LocalizedGenericRoute";
import { localizedGenericMetadata } from "@/lib/localized-generic-metadata";
type Props = { params: Promise<{ locale: string }> };
export const generateMetadata = ({ params }: Props) => localizedGenericMetadata("privacy-and-cookies", params);
export default function Page({ params }: Props) { return <LocalizedGenericRoute route="privacy-and-cookies" params={params} />; }
