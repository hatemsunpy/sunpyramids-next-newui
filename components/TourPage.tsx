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
import { TourPageNavigation } from "@/components/tour/TourPageNavigation";
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
  const title = tour?.title || tour?.name || "";
  const hasOverview = Boolean(
    tour?.overview
      || tour?.duration
      || tour?.duration_in_days
      || tour?.pickup_time
      || tour?.run
      || tour?.type
      || tour?.categories?.length
      || tour?.category?.name
      || tour?.destinations?.length,
  );
  const hasHighlights = Boolean(tour?.highlights || tour?.destinations?.some((destination) => destination.enabled));
  const hasInclusions = Boolean(tour?.included || tour?.excluded);

  return (
    <main className="tour-page tour-page-redesign">
      <TourBreadcrumb title={title} locale={locale} />
      <section className="tour-page-shell">
        <div className="tour-hero-stage">
          <TourGallery tour={tour} locale={locale} />
          <TourHero tour={tour} title={title} />
        </div>
        <TourPageNavigation
          hasOverview={hasOverview}
          hasHighlights={hasHighlights}
          hasItinerary={Boolean(tour?.days?.length)}
          hasInclusions={hasInclusions}
          hasAddOns={Boolean(tour?.options?.length)}
          hasPrices={Boolean(!tour?.is_inquiry && tour?.seasons?.length)}
          hasRelated={Boolean(relatedTours.length)}
        />
        <TourPageLayout
          tour={tour}
          locale={locale}
          leftContent={
            <>
              {hasOverview ? <TourOverview tour={tour} /> : null}
              {hasHighlights ? <TourHighlights tour={tour} locale={locale} /> : null}
              {tour?.days?.length ? <TourItinerary days={tour.days} locale={locale} /> : null}
              {hasInclusions ? (
                <section className="tour-inclusions-section" id="included" aria-labelledby="tour-inclusions-title">
                  <div className="tour-editorial-heading">
                    <h2 id="tour-inclusions-title">What your journey covers</h2>
                    <p>Clear, practical details for planning with confidence.</p>
                  </div>
                  <div className="tour-inclusions-grid">
                    {tour?.included ? <TourInclusions title="What's Included?" items={tour.included} icon="check" /> : null}
                    {tour?.excluded ? <TourInclusions title="What's Excluded?" items={tour.excluded} icon="cross" /> : null}
                  </div>
                </section>
              ) : null}
            </>
          }
        />
      </section>

      {tour?.is_inquiry ? null : tour?.seasons?.length ? <TourSeasonPrices seasons={tour.seasons} /> : null}

      <TourSocialGallery socialLinks={tour?.social_links} locale={locale} />
      <RelatedTours tours={relatedTours} locale={locale} />
      <MakeYourTripCTA tour={tour} locale={locale} />
    </main>
  );
}
