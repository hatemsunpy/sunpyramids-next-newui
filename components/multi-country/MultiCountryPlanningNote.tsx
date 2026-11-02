import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
import { withLocale } from "@/lib/locales";
import type { Locale } from "@/types/api";
import { subcategoryCopy } from "./subcategory-copy";

export function MultiCountryPlanningNote({ locale }: { locale: Locale }) {
  const copy = subcategoryCopy(locale);
  return (
    <aside className="mc-planning-note" aria-labelledby="mc-planning-title">
      <Compass size={48} strokeWidth={1.2} aria-hidden="true" />
      <h2 id="mc-planning-title">{copy.personal}</h2>
      <p>{copy.personalHint}</p>
      <Link href={withLocale("/make-your-trip", locale)}>{copy.talk}<ArrowUpRight size={18} aria-hidden="true" /></Link>
    </aside>
  );
}
