export const APPROVED_BRAND_LOGO = "/images/logo.webp";

export const siteContact = {
  phones: [
    { display: "+20 109 588 8830", href: "tel:+201095888830" },
    { display: "+20 109 588 8831", href: "tel:+201095888831" },
    { display: "+20 109 588 8835", href: "tel:+201095888835" },
  ],
  address:
    "Pyramids View Tower - Mansourieh Intersection with Faisal - Above Tseppas Pastry - Fourth Floor",
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
