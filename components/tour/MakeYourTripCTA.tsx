import { HomeSearchShortcuts } from "@/components/HomeSearchShortcuts";
import { whatsappInquiryUrl } from "@/lib/site-contact";
import type { Locale, Tour } from "@/types/api";

export function MakeYourTripCTA({ tour, locale }: { tour: Tour | null; locale: Locale }) {
  const tourTitle = tour?.title || tour?.name || "Egypt Tour";
  const whatsappUrl = whatsappInquiryUrl(`Hello, I would like to plan a custom trip based on "${tourTitle}".`);

  return (
    <section className="tour-make-trip section-pad" aria-labelledby="tour-make-trip-title">
      <div className="container-shell make-trip-section">
        <div className="tour-make-trip-editorial">
          <span className="tour-make-trip-kicker">Tailor-Made Concierge</span>
          <h2 id="tour-make-trip-title">Craft your bespoke journey across Egypt</h2>
          <p className="tour-make-trip-copy">
            Every itinerary can be fully tailored to your preferred dates, private party size, and curiosity.
            Our local Cairo specialists handle every transfer, entrance, and private guide detail so you travel with complete peace of mind.
          </p>
          <div className="tour-make-trip-features" aria-label="Bespoke service promises">
            <div className="tour-make-trip-feature">
              <span className="tour-make-trip-feature-icon" aria-hidden="true">✓</span>
              <span>100% Private & Flexible</span>
            </div>
            <div className="tour-make-trip-feature">
              <span className="tour-make-trip-feature-icon" aria-hidden="true">✓</span>
              <span>Licensed Egyptologist Guides</span>
            </div>
            <div className="tour-make-trip-feature">
              <span className="tour-make-trip-feature-icon" aria-hidden="true">✓</span>
              <span>24/7 Dedicated Cairo Support</span>
            </div>
          </div>
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
        <div className="tour-make-trip-form-box">
          <span className="tour-make-trip-form-title">Select your dates & destinations</span>
          <HomeSearchShortcuts
            locale={locale}
            destinations={(tour?.destinations ?? []).map(({ id, name, title: destinationTitle, slug }) => ({ id, name, title: destinationTitle, slug }))}
            modeOnly="make"
          />
        </div>
      </div>
    </section>
  );
}

