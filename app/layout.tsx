import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { HtmlLangSynchronizer } from "@/components/HtmlLangSynchronizer";
import { ThirdPartyScripts } from "@/components/ThirdPartyScripts";
import { isLocale } from "@/lib/locales";
import "./globals.scss";
import "@/styles/batch-one.scss";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://sunpyramidstours.com"),
  title: {
    default: "Sun Pyramids Tours",
    template: "%s | Sun Pyramids Tours",
  },
  description: "Sun Pyramids Tours offers Egypt tours, Nile cruises, day tours, and vacation packages.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const routeLocale = (await headers()).get("x-sunpyramids-route-locale") || "en";
  const lang = isLocale(routeLocale) ? routeLocale : "en";
  return (
    <html lang={lang}>
      <body>
        <HtmlLangSynchronizer />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KDF33T7"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        <ThirdPartyScripts />
      </body>
    </html>
  );
}
