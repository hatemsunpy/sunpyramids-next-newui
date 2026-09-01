import Link from "next/link";
import { withLocale } from "@/lib/locales";
import type { Locale } from "@/types/api";

export function TourBreadcrumb({ title, locale }: { title: string; locale: Locale }) {
  return (
    <nav className="tour-breadcrumb" aria-label="Breadcrumb">
      <Link className="tour-breadcrumb-back" href={withLocale("/trips", locale)} aria-label="Back to tours">←</Link>
      <span className="tour-breadcrumb-trail">
        <Link href={withLocale("/", locale)}>Home</Link><span aria-hidden="true">›</span>
        <Link href={withLocale("/trips", locale)}>Tours</Link><span aria-hidden="true">›</span>
      </span>
      <span className="tour-breadcrumb-current">{title}</span>
    </nav>
  );
}
