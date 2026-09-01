import { HomeSearchShortcuts } from "@/components/HomeSearchShortcuts";
import type { Locale, Tour } from "@/types/api";

export function MakeYourTripCTA({ tour, locale }: { tour: Tour | null; locale: Locale }) {
  return (
    <section className="tour-make-trip section-pad original-destination-band">
      <div className="container-shell make-trip-section">
        <div>
          <h2>Make Your Trip</h2>
          <p className="tour-make-trip-copy">Tell us when you want to travel. Our local team will help shape the details.</p>
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
