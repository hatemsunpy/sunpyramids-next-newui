import type { ReactNode } from "react";
import type { Locale, PublicSiteSettings, TripTaxonomy } from "@/types/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BottomBar } from "@/components/BottomBar";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { getPublicSiteSettings, getTripTaxonomy } from "@/lib/data";
import { buildEgyptToursMenu } from "@/lib/egypt-tours-menu";

export async function SiteShell({
  children,
  locale = "en",
  settings: providedSettings,
  taxonomy: providedTaxonomy,
}: {
  children: ReactNode;
  locale?: Locale;
  settings?: PublicSiteSettings;
  taxonomy?: TripTaxonomy;
}) {
  const [settings, taxonomy] = await Promise.all([
    providedSettings ? Promise.resolve(providedSettings) : getPublicSiteSettings(locale),
    providedTaxonomy ? Promise.resolve(providedTaxonomy) : getTripTaxonomy(locale),
  ]);
  const headerCategories = taxonomy.allCategories.map(({ slug, title, featured_image }) => ({ slug, title, featured_image }));
  // Reuse route taxonomy when available; other routes read the same
  // five-minute cached API taxonomy so dashboard data stays authoritative.
  const egyptToursMenu = buildEgyptToursMenu(taxonomy);
  return (
    <CurrencyProvider>
      <div className="site-shell-v2">
        <a className="skip-link" href="#site-content">Skip to main content</a>
        <Header
          locale={locale}
          siteTitle={settings.siteTitle}
          categories={headerCategories}
          oneDayChildren={egyptToursMenu.oneDay}
          multiDaysChildren={egyptToursMenu.multiDays}
          nileCruisesChildren={egyptToursMenu.nileCruises}
        />
        <div id="site-content" tabIndex={-1}>{children}</div>
        <aside aria-label="Direct support"><WhatsAppButton /></aside>
        <Footer locale={locale} settings={settings} />
        <BottomBar locale={locale} />
      </div>
    </CurrencyProvider>
  );
}
