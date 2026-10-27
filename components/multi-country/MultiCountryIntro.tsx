import Link from "next/link";
import { ArrowDown, ArrowUpRight, Route } from "lucide-react";
import { DiscoveryHero } from "@/components/DiscoveryHero";
import { DiscoveryHeroDescription } from "@/components/DiscoveryHeroDescription";
import { withLocale } from "@/lib/locales";
import type { ApiPage, Locale } from "@/types/api";
import { multiCountryCopy } from "./copy";
import "@/styles/multi-country.scss";

export function MultiCountryIntro({ page, categoryCount, locale }: {
  page: ApiPage;
  categoryCount: number;
  locale: Locale;
}) {
  const labels = multiCountryCopy(locale);
  return (
    <DiscoveryHero
      title={page.title || page.name || "Multi Country"}
      breadcrumbs={[
        { label: "Home", href: withLocale("/", locale) },
        { label: page.title || page.name || "Multi Country" },
      ]}
      eyebrow=""
      bgImage={page.banner || "/images/mainBanner.webp"}
      mobileBgImage={typeof page.phone_banner === "string" ? page.phone_banner : undefined}
      locale={locale}
    >
      <p className="mc-hero-subtitle">{labels.subtitle}</p>
      <div className="mc-hero-actions">
        <a className="mc-primary" href={categoryCount > 0 ? "#country-combinations" : "#multi-country-tours"}>{labels.browse}<ArrowDown size={18} aria-hidden="true" /></a>
        <Link className="mc-text-link" href={withLocale("/make-your-trip", locale)}>{labels.plan}<ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
      {categoryCount > 0 && <p className="mc-hero-count"><Route size={18} aria-hidden="true" /><strong>{categoryCount}</strong> {labels.count}</p>}
    </DiscoveryHero>
  );
}

export function MultiCountryOverview({ page, locale, fullFirst = false }: { page: ApiPage; locale: Locale; fullFirst?: boolean }) {
  const description = fullFirst
    ? (page.description || page.content || page.short_description)
    : (page.short_description || page.description || page.content);
  if (!description) return null;
  return (
    <section className="mc-overview mc-shell" aria-labelledby="mc-overview-title">
      <div className="mc-overview-label"><Route size={27} aria-hidden="true" /><h2 id="mc-overview-title">{multiCountryCopy(locale).about}</h2></div>
      <div className="mc-overview-content">
        <DiscoveryHeroDescription description={description} locale={locale} />
      </div>
    </section>
  );
}
