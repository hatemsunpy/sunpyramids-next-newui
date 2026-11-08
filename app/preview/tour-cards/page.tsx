import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ShoppingCart } from "lucide-react";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { TourCard } from "@/components/TourCard";
import { getHomeTours } from "@/lib/data";
import { tourPath } from "@/lib/locales";
import { APPROVED_BRAND_LOGO } from "@/lib/site-contact";
import type { Tour } from "@/types/api";
import "./card-designs.scss";

export const metadata: Metadata = {
  title: "Tour card designs",
  robots: { index: false, follow: false },
};

const PREVIEW_TOURS_ENDPOINT =
  "tours/home?featured=1&page=1&order_by=display_order,asc&page_limit=8";

const PREVIEW_CARD_SIZES = "(max-width: 1100px) 92vw, 344px";

type PreviewVariant = "s01" | "s02" | "s03";

function titleOf(tour: Tour) {
  return tour.title || tour.name || "";
}

function slugOf(tour: Tour) {
  return tour.slug || String(tour.id || "");
}

function hasImage(tour: Tour) {
  return Boolean(
    tour.featured_image || tour.image || tour.banner || tour.gallery?.[0] || tour.images?.[0],
  );
}

function TourCardDesign({
  variant,
  label,
  caption,
  tour,
}: {
  variant: PreviewVariant;
  label: string;
  caption: string;
  tour: Tour;
}) {
  const ctaLabel = `View tour - ${titleOf(tour)}`;
  return (
    <section className="tour-card-preview-item">
      <p className="tour-card-preview-label">
        <span className="tour-card-preview-label-text">{label}</span>
        <span className="tour-card-preview-caption">{caption}</span>
      </p>
      <div className={`tour-card-frame tour-card-frame-${variant}`}>
        <TourCard
          tour={tour}
          locale="en"
          className={`preview-card-${variant}`}
          imageSizes={PREVIEW_CARD_SIZES}
        />
        <Link
          href={tourPath(slugOf(tour), "en")}
          className={`preview-cta preview-cta-${variant}`}
          aria-label={ctaLabel}
        >
          <span className="preview-cta-label">View tour</span>
          {variant === "s01" ? (
            <ShoppingCart size={22} strokeWidth={1.7} aria-hidden="true" />
          ) : (
            <ArrowUpRight size={variant === "s02" ? 16 : 22} strokeWidth={2.4} aria-hidden="true" />
          )}
        </Link>
      </div>
    </section>
  );
}

export default async function TourCardDesignsPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const tours = await getHomeTours(PREVIEW_TOURS_ENDPOINT, "en");
  const tour = tours.find(hasImage) ?? tours[0];

  return (
    <CurrencyProvider>
      <div className="tour-card-preview-root">
        <header className="tour-card-preview-topbar">
          <div className="tour-card-preview-brand">
            <Image
              src={APPROVED_BRAND_LOGO}
              alt="Sun Pyramids Tours"
              width={230}
              height={65}
              className="tour-card-preview-logo"
            />
            <h1 className="tour-card-preview-title">Tour card designs</h1>
          </div>
          <Link href="/" className="tour-card-preview-back">
            Back to site
          </Link>
        </header>
        <main className="tour-card-preview-main">
          {tour ? (
            <div className="tour-card-preview-grid">
              <TourCardDesign variant="s01" label="Design 01" caption="Soft cut-out" tour={tour} />
              <TourCardDesign variant="s02" label="Design 02" caption="Blue gradient" tour={tour} />
              <TourCardDesign variant="s03" label="Design 03" caption="Full-photo" tour={tour} />
            </div>
          ) : (
            <p className="tour-card-preview-empty">Tour data unavailable for preview.</p>
          )}
        </main>
      </div>
    </CurrencyProvider>
  );
}
