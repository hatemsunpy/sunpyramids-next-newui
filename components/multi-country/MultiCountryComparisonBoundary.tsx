import type { ReactNode } from "react";
import type { Locale } from "@/types/api";
import { MultiCountryCompareProvider } from "./MultiCountryCompareClient";

export function MultiCountryComparisonBoundary({ collectionSlug, locale, currentTitles, children }: {
  collectionSlug?: string;
  locale: Locale;
  currentTitles: Record<string, string>;
  children: ReactNode;
}) {
  if (!collectionSlug) return children;
  return <MultiCountryCompareProvider key={`${locale}:${collectionSlug}`} collectionSlug={collectionSlug} locale={locale} currentTitles={currentTitles}>{children}</MultiCountryCompareProvider>;
}
