// Header, footer and filter navigation targets. Laravel resolves the destination
// filters against its own tour-to-destination relationships.
export const COUNTRY_DESTINATION_LINKS = [
  ["destJordan", "jordan"],
  ["destMorocco", "morocco"],
  ["destTunisia", "tunisia"],
  ["destTurkey", "turkey"],
  ["destGreece", "greece"],
  ["destTanzania", "tanzania"],
] as const;

export const DESTINATION_DIRECTORY_LINKS = [["destEgypt", "egypt"], ...COUNTRY_DESTINATION_LINKS] as const;
export const destinationsPath = "/destinations";
export const egyptDestinationPath = `${destinationsPath}/egypt-tours`;
export const jordanDestinationSlug = "jordan-tours";
export const jordanDestinationPath = `${destinationsPath}/${jordanDestinationSlug}`;

type DestinationSlug = (typeof DESTINATION_DIRECTORY_LINKS)[number][1];

export function countryDestinationHref(slug: DestinationSlug) {
  if (slug === "egypt") return egyptDestinationPath;
  return slug === "jordan" ? jordanDestinationPath : `/trips?destination=${encodeURIComponent(slug)}`;
}

// Editorial navigation photographs, used only when a dashboard image is unavailable.
// Wikimedia Commons originals (CC0), resized and converted to WebP:
// Jordan: https://commons.wikimedia.org/wiki/File:La_Khazneh.jpg
// Morocco: https://commons.wikimedia.org/wiki/File:Chefchaouen_The_Blue_Pearl_شفشاون_الجوهرة_الزرقاء,_Chefchaouen,_Morocco_(Unsplash).jpg
// Tunisia: https://commons.wikimedia.org/wiki/File:Amphitheatre_of_El_Jem,_Tunisia_in_January_2023.jpg
// Turkey: https://commons.wikimedia.org/wiki/File:New_Mosque_(Foreground)_and_Sultan_Ahmed_Mosque_(Background),_Istanbul,_Türkiye.jpg
// Greece: https://commons.wikimedia.org/wiki/File:The_Parthenon_of_Acropolis.jpg
// Tanzania: https://commons.wikimedia.org/wiki/File:Zebras_grazing_among_acacia_trees,_Serengeti_National_Park.jpg
export function countryDestinationPreviewPhoto(slug: DestinationSlug) {
  return slug === "egypt" ? "/images/Cairo_Egypt_Unsplash.webp" : `/images/destination-previews/${slug}.webp`;
}
