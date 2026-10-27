// Presentation-only classifier for the user-approved Multi Country journey
// routes. These are route identifiers used to scope visual presentation —
// never a source of category records, titles, images, or IDs.
const MULTI_COUNTRY_PARENT_SLUG = "middle-east-tours";

const MULTI_COUNTRY_SUBCATEGORY_SLUGS = new Set([
  "egypt-and-jordan-tour-packages",
  "egypt-and-turkey-tour-packages",
  "egypt-and-morocco-tour-packages",
  "egypt-and-tunisia-tour-packages",
  "egypt-jordan-turkey-tours",
]);

export function isMultiCountryParent(slug: string[]): boolean {
  return slug.length === 1 && slug[0] === MULTI_COUNTRY_PARENT_SLUG;
}

export function isMultiCountrySubcategory(slug: string[]): boolean {
  return slug.length === 1 && MULTI_COUNTRY_SUBCATEGORY_SLUGS.has(slug[0]);
}

export const multiCountryParentPath = `/egypt-tours/${MULTI_COUNTRY_PARENT_SLUG}`;

/**
 * Order-switch URL for the subcategory toolbar: reuses the existing `order`
 * query contract, preserves every other current param, and resets pagination.
 */
export function subcategoryOrderHref(basePath: string, currentSearch: string, order?: string) {
  const params = new URLSearchParams(currentSearch);
  params.delete("page");
  if (order && order !== "display_order,asc") {
    params.set("order", order);
  } else {
    params.delete("order");
  }
  const str = params.toString();
  return str ? `${basePath}?${str}` : basePath;
}
