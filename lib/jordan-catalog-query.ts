export const jordanTripTypes = ["all", "day", "multi-day"] as const;
export const jordanTourOrders = ["recommended", "shortest", "longest"] as const;

export type JordanTripType = (typeof jordanTripTypes)[number];
export type JordanTourOrder = (typeof jordanTourOrders)[number];
export type JordanSearchParams = Promise<{ page?: string | string[]; trip?: string | string[]; order?: string | string[] }>;

export function jordanCatalogParams(trip: JordanTripType, order: JordanTourOrder) {
  const params = new URLSearchParams();
  if (trip !== "all") params.set("trip", trip);
  if (order !== "recommended") params.set("order", order);
  return params;
}

export function jordanCatalogHref(basePath: string, trip: JordanTripType, order: JordanTourOrder) {
  const query = jordanCatalogParams(trip, order).toString();
  return `${basePath}${query ? `?${query}` : ""}#jordan-tours`;
}
