import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "@/types/api";
import { DiscoveryHeroDescription } from "@/components/DiscoveryHeroDescription";
import { getImageBlurDataURL } from "@/lib/image-blur.server";
import { blurredImageBackground } from "@/lib/image-blur";
import { responsiveImageSource } from "@/lib/responsive-image";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export async function DiscoveryHero({
  title,
  breadcrumbs = [],
  eyebrow = "Sun Pyramids Tours",
  description,
  totalCount,
  metaBadges = [],
  bgImage,
  children,
  locale = "en",
}: {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  eyebrow?: string;
  description?: string | null;
  totalCount?: number | null;
  metaBadges?: string[];
  bgImage?: string | null;
  children?: ReactNode;
  locale?: Locale | string;
}) {
  const bannerImage = bgImage || "/images/mainBanner.webp";
  const preview = await getImageBlurDataURL(bannerImage);
  const blurLayer = preview ? `, ${blurredImageBackground(preview)}` : "";
  const mobileImage = responsiveImageSource(bannerImage, 828);
  const desktopImage = responsiveImageSource(bannerImage, 1920);

  return (
    <>
    <link rel="preload" as="image" href={mobileImage} media="(max-width: 768px)" fetchPriority="high" />
    <link rel="preload" as="image" href={desktopImage} media="(min-width: 769px)" fetchPriority="high" />
    <header
      className="discovery-hero"
      data-image-blur-preview={preview ? "" : undefined}
      data-image-source={bannerImage}
      style={{
        backgroundImage: `var(--discovery-image, url(${JSON.stringify(bannerImage)})${blurLayer})`,
        "--discovery-image-desktop": `url(${JSON.stringify(desktopImage)})${blurLayer}`,
        "--discovery-image-mobile": `url(${JSON.stringify(mobileImage)})${blurLayer}`,
      } as CSSProperties}
    >
      <div className="discovery-hero-inner">
        {breadcrumbs.length > 0 && (
          <nav className="discovery-breadcrumbs" aria-label="Breadcrumbs">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <span key={item.label} className="breadcrumb-segment">
                  {item.href && !isLast ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    <span className="current" aria-current={isLast ? "page" : undefined}>
                      {item.label}
                    </span>
                  )}
                  {!isLast && <span className="sep" aria-hidden="true">/</span>}
                </span>
              );
            })}
          </nav>
        )}

        {eyebrow && <span className="discovery-eyebrow">{eyebrow}</span>}

        <h1>{title}</h1>

        {description && (
          <DiscoveryHeroDescription description={description} locale={locale} />
        )}

        {(totalCount !== undefined && totalCount !== null || metaBadges.length > 0) && (
          <div className="discovery-hero-meta">
            {totalCount !== undefined && totalCount !== null && (
              <span className="meta-pill">
                <strong>{totalCount}</strong> {totalCount === 1 ? "Experience Available" : "Experiences Available"}
              </span>
            )}
            {metaBadges.map((badge) => (
              <span key={badge} className="meta-pill">
                {badge}
              </span>
            ))}
          </div>
        )}

        {children}
      </div>
    </header>
    </>
  );
}
