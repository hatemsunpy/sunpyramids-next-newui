import { MakeYourTripCTA } from "@/components/tour/MakeYourTripCTA";
import { RelatedTours } from "@/components/tour/RelatedTours";
import { TourBreadcrumb } from "@/components/tour/TourBreadcrumb";
import { TourGallery } from "@/components/tour/TourGallery";
import { TourHighlights } from "@/components/tour/TourHighlights";
import { TourHero } from "@/components/tour/TourHero";
import { TourInclusions } from "@/components/tour/TourInclusions";
import { TourItinerary } from "@/components/tour/TourItinerary";
import { TourOverview } from "@/components/tour/TourOverview";
import { TourPageLayout } from "@/components/tour/TourPageLayout";
import { TourSeasonPrices } from "@/components/tour/TourSeasonPrices";
import { TourSocialGallery } from "@/components/tour/TourSocialGallery";
import type { Locale, Tour } from "@/types/api";

export function TourPage({
  tour,
  relatedTours = [],
  locale = "en",
}: {
  tour: Tour | null;
  relatedTours?: Tour[];
  locale?: Locale;
}) {
  const title = tour?.title || tour?.name || "Egypt Tour";

  return (
    <main className="tour-page">
      <TourBreadcrumb title={title} locale={locale} />
      <section className="tour-page-shell">
        <TourHero tour={tour} title={title} />
        <TourPageLayout
          tour={tour}
          locale={locale}
          leftContent={
            <>
              <TourGallery tour={tour} locale={locale} />
              <TourHero tour={tour} title={title} mobile />
              <TourOverview tour={tour} />
              <TourHighlights tour={tour} locale={locale} />
              {tour?.days?.length ? <TourItinerary days={tour.days} locale={locale} /> : null}
              {tour?.included || tour?.excluded ? (
                <div className="tour-inclusions-grid">
                  {tour?.included ? <TourInclusions title="What's Included?" items={tour.included} icon="check" /> : null}
                  {tour?.excluded ? <TourInclusions title="What's Excluded?" items={tour.excluded} icon="cross" /> : null}
                </div>
              ) : null}
            </>
          }
        />
      </section>

      {tour?.is_inquiry ? null : tour?.seasons?.length ? <TourSeasonPrices seasons={tour.seasons} /> : null}

      <TourSocialGallery socials={tour?.social_links} />
      <RelatedTours tours={relatedTours} locale={locale} />
      <MakeYourTripCTA tour={tour} locale={locale} />
    </main>
  );
}
