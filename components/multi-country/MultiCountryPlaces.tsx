import { MapPin } from "lucide-react";
import ResponsiveImage from "@/components/ResponsiveImage";
import type { Locale, Tour } from "@/types/api";
import { collectionPlaces } from "./collection-facts";
import { subcategoryCopy } from "./subcategory-copy";

export function MultiCountryPlaces({ tours, locale }: { tours: Tour[]; locale: Locale }) {
  const places = collectionPlaces(tours);
  if (places.length === 0) return null;
  const copy = subcategoryCopy(locale);
  return (
    <section className={`mc-places mc-shell${places.length === 1 ? " mc-places-single" : ""}`} id="mc-places" aria-labelledby="mc-places-title">
      <div className="mc-section-heading">
        <p className="mc-dossier-kicker"><MapPin size={17} aria-hidden="true" />{copy.places}</p>
        <h2 id="mc-places-title">{copy.placesTitle}</h2>
        <p>{copy.placesHint}</p>
      </div>
      <ul className="mc-place-grid">
        {places.map((place, index) => <li key={place.image} className="mc-place">
          <div className="mc-place-photo"><ResponsiveImage src={place.image} alt={place.title} fill sizes="(max-width: 600px) 50vw, 25vw" /></div>
          <div className="mc-place-label"><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h3>{place.title}</h3></div>
        </li>)}
      </ul>
    </section>
  );
}
