import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { HomeSearchShortcuts } from "@/components/HomeSearchShortcuts";
import { whatsappInquiryUrl } from "@/lib/site-contact";
import type { Locale, Tour } from "@/types/api";

export function MakeYourTripCTA({ tour, locale }: { tour: Tour | null; locale: Locale }) {
  const tourTitle = tour?.title || tour?.name;
  const featureImage = tour?.featured_image || tour?.gallery?.[0];
  const whatsappMessage = tourTitle
    ? `Hello, I would like to plan a custom trip based on "${tourTitle}".`
    : "Hello, I would like to plan a custom trip to Egypt.";
  const whatsappUrl = whatsappInquiryUrl(whatsappMessage);

  return (
    <section className="tour-make-trip section-pad" aria-label="Tailor-Made Concierge">
      <div className="container-shell make-trip-section">
        <div className="tour-make-trip-editorial">
          {featureImage ? (
            <Image
              className="tour-make-trip-media"
              src={featureImage}
              alt=""
              fill
              sizes="(max-width: 1180px) 100vw, 52vw"
            />
          ) : null}
          <span className="tour-make-trip-kicker">Tailor-Made Concierge</span>
        </div>
        <div className="tour-make-trip-form-box">
          <span className="tour-make-trip-form-title">Select your dates & destinations</span>
          <HomeSearchShortcuts
            locale={locale}
            destinations={(tour?.destinations ?? []).map(({ id, name, title: destinationTitle, slug }) => ({ id, name, title: destinationTitle, slug }))}
            modeOnly="make"
            makeButtonIcon={<ArrowRight size={18} strokeWidth={2} aria-hidden="true" />}
          />
          <div className="tour-make-trip-actions">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tour-make-trip-direct-btn"
            >
              <span>Chat with a trip planner</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
