import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { ReactNode } from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function DiscoveryHero({
  title,
  breadcrumbs = [],
  eyebrow = "Sun Pyramids Tours",
  description,
  totalCount,
  metaBadges = [],
  bgImage,
  children,
}: {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  eyebrow?: string;
  description?: string | null;
  totalCount?: number | null;
  metaBadges?: string[];
  bgImage?: string | null;
  children?: ReactNode;
}) {
  const bannerImage = bgImage || "/images/mainBanner.png";

  return (
    <header
      className="discovery-hero"
      style={{ backgroundImage: `url(${JSON.stringify(bannerImage)})` }}
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
          <div
            className="discovery-hero-desc"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
          />
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
  );
}
