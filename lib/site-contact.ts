export const APPROVED_BRAND_LOGO = "/images/logo.webp";

// Owner-provided deployment config: the approved office address and the exact
// Google Maps listing (CID) are a paired deployment pair, so the displayed
// address and every map link can never disagree. The Dashboard short link
// still carries a legacy address slug; it is deliberately not used here.
const officeAddress =
  "25 Sphinx Street (Sun Pyramid Group Tower), off Abu El-Houl El-Seyahi Street, Al Haram, Giza";
const officeGooglePlaceCid = "907361815771537360";

export const officeMapUrl = `https://www.google.com/maps?cid=${officeGooglePlaceCid}`;

export const officeMapEmbedUrl = `https://maps.google.com/maps?cid=${officeGooglePlaceCid}&z=17&output=embed`;

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
