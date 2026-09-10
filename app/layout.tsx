import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { HtmlLangSynchronizer } from "@/components/HtmlLangSynchronizer";
import { ThirdPartyScripts } from "@/components/ThirdPartyScripts";
import { DatePickerEnhancer } from "@/components/DatePickerEnhancer";
import { isLocale } from "@/lib/locales";
import "./globals.scss";
import "@/styles/batch-one.scss";

const themeScript = `(() => {
  let saved;
  try {
    saved = localStorage.getItem("sunpyramids-theme");
  } catch {}
  const theme = saved === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();`;

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
    <html lang={lang} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <HtmlLangSynchronizer />
        <DatePickerEnhancer />
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
