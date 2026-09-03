export function TourPageNavigation({
  hasOverview,
  hasHighlights,
  hasItinerary,
  hasInclusions,
  hasAddOns,
  hasPrices,
  hasRelated,
}: {
  hasOverview: boolean;
  hasHighlights: boolean;
  hasItinerary: boolean;
  hasInclusions: boolean;
  hasAddOns: boolean;
  hasPrices: boolean;
  hasRelated: boolean;
}) {
  const links = [
    hasOverview ? { href: "#overview", label: "Overview" } : null,
    hasHighlights ? { href: "#highlights", label: "Highlights" } : null,
    hasItinerary ? { href: "#itinerary", label: "Itinerary" } : null,
    hasInclusions ? { href: "#included", label: "Included" } : null,
    hasAddOns ? { href: "#add-ons", label: "Add-ons" } : null,
    hasPrices ? { href: "#prices", label: "Prices" } : null,
    hasRelated ? { href: "#related-tours", label: "More tours" } : null,
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  if (links.length < 2) return null;

  return (
    <nav className="tour-page-nav" aria-label="Tour sections">
      <div className="tour-page-nav-scroll">
        {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
      </div>
    </nav>
  );
}
