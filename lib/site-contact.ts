export const APPROVED_BRAND_LOGO = "/images/logo.webp";

// Owner-provided deployment config: office address and the map URL derived
// from the SAME constant, so label and map can never disagree. The API-owned
// settings.locationUrl points elsewhere and is deliberately not used here.
const officeAddress =
  "25 Sphinx Street (Sun Pyramid Group Tower), off Abu El-Houl El-Seyahi Street, Al Haram, Giza";

export const officeMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeAddress)}`;

export const siteContact = {
  phones: [
    { display: "+20 109 588 8830", href: "tel:+201095888830" },
    { display: "+20 109 588 8831", href: "tel:+201095888831" },
    { display: "+20 109 588 8835", href: "tel:+201095888835" },
  ],
  address: officeAddress,
  whatsapp: {
    display: "+20 109 588 8830",
    digits: "201095888830",
    contactUrl: "https://api.whatsapp.com/send?phone=201095888830",
  },
  // The API owns notification_emails. These are display-only resilience
  // fallbacks confirmed on the current live footer, never a CMS replacement.
  safeFallbackEmails: [
    "info@sunpyramidstours.com",
    "sales@sunpyramidstours.com",
  ],
  staticEmails: ["sustainability@sunpyramidstours.com"],
} as const;

export function whatsappInquiryUrl(message: string) {
  return `https://wa.me/${siteContact.whatsapp.digits}?text=${encodeURIComponent(message)}`;
}
