import type { ReactNode } from "react";
import type { Locale, PublicSiteSettings } from "@/types/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { BottomBar } from "@/components/BottomBar";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { getPublicSiteSettings } from "@/lib/data";

export async function SiteShell({ children, locale = "en", settings: providedSettings }: { children: ReactNode; locale?: Locale; settings?: PublicSiteSettings }) {
  const settings = providedSettings ?? await getPublicSiteSettings(locale);
  return (
    <CurrencyProvider>
      <div className="site-shell-v2">
        <a className="skip-link" href="#site-content">Skip to main content</a>
        <Header locale={locale} siteTitle={settings.siteTitle} />
        <div id="site-content" tabIndex={-1}>{children}</div>
        <aside aria-label="Direct support"><WhatsAppButton /></aside>
        <Footer locale={locale} settings={settings} />
        <BottomBar locale={locale} />
      </div>
    </CurrencyProvider>
  );
}
