export const WEB_MERCATOR_SPHERE_RADIUS = 6378137;

export const WEB_MERCATOR_MAX_LATITUDE = 85.0511287798066;

export const WEB_MERCATOR_WORLD_HALF_EXTENT = WEB_MERCATOR_SPHERE_RADIUS * Math.PI;

export const SAT_MIN_SPAN_METERS = 0.08 * ((Math.PI / 180) * WEB_MERCATOR_SPHERE_RADIUS);

export const SAT_ZOOM_MIN_METERS_PER_PIXEL = 0.12;

export const SAT_ZOOM_MAX_METERS_PER_PIXEL_FACTOR = 1.5;

export const SAT_MAX_EXPORT_PIXEL_SIZE = 1600;

export const SAT_FIT_PADDING_RATIO = 0.3;

export const MAPSERVER_EXPORT_ENDPOINT = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export";

const NUMERIC_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

export type CoordinateAxis = "latitude" | "longitude";

export type WebMercatorPoint = { x: number; y: number };

export type MapView = { centerX: number; centerY: number; metersPerPixel: number };

export type MapBbox = { minX: number; minY: number; maxX: number; maxY: number };

export type ExportImageRequest = {
  href: string;
  minX: number;
  minY: number;
  extentX: number;
  extentY: number;
  pixelWidth: number;
  pixelHeight: number;
};

export function parseCoordinate(value: string | number | null | undefined, axis: CoordinateAxis): number | null {
  if (value === null || value === undefined) return null;
  let numeric: number;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    numeric = value;
  } else {
    const text = value.trim();
    if (!text || !NUMERIC_PATTERN.test(text)) return null;
    numeric = Number(text);
  }
  if (!Number.isFinite(numeric)) return null;
  const limit = axis === "latitude" ? WEB_MERCATOR_MAX_LATITUDE : 180;
  if (Math.abs(numeric) > limit) return null;
  return numeric;
}

export function normalizeLongitude(longitude: number): number {
  if (longitude === -180) return -180;
  return ((longitude + 540) % 360) - 180;
}

export function projectToWebMercator(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): WebMercatorPoint | null {
  const parsedLatitude = parseCoordinate(latitude, "latitude");
  const parsedLongitude = parseCoordinate(longitude, "longitude");
  if (parsedLatitude === null || parsedLongitude === null) return null;
  const normalizedLongitude = normalizeLongitude(parsedLongitude);
  return {
    x: WEB_MERCATOR_SPHERE_RADIUS * normalizedLongitude * (Math.PI / 180),
    y: WEB_MERCATOR_SPHERE_RADIUS * Math.log(Math.tan(Math.PI / 4 + (parsedLatitude * (Math.PI / 180)) / 2)),
  };
}

export function clampViewCenter(view: MapView, extentX: number, extentY: number): MapView {
  const limitX = Math.max(0, WEB_MERCATOR_WORLD_HALF_EXTENT - extentX / 2);
  const limitY = Math.max(0, WEB_MERCATOR_WORLD_HALF_EXTENT - extentY / 2);
  const centerX = Math.min(limitX, Math.max(-limitX, view.centerX));
  const centerY = Math.min(limitY, Math.max(-limitY, view.centerY));
  const mppLimit = Math.max(
    SAT_ZOOM_MIN_METERS_PER_PIXEL,
    WEB_MERCATOR_WORLD_HALF_EXTENT * 2 / Math.max(1, extentX / view.metersPerPixel),
  );
  return { centerX, centerY, metersPerPixel: Math.min(view.metersPerPixel, mppLimit) };
}

export function computeFitView(points: WebMercatorPoint[], width: number, height: number): MapView | null {
  if (!points.length || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const spanX = Math.max(0, maxX - minX);
  const spanY = Math.max(0, maxY - minY);
  let extentX = Math.max(SAT_MIN_SPAN_METERS, spanX * (1 + 2 * SAT_FIT_PADDING_RATIO));
  let extentY = Math.max(SAT_MIN_SPAN_METERS, spanY * (1 + 2 * SAT_FIT_PADDING_RATIO));
  const aspect = width / height;
  if (extentX / extentY < aspect) extentX = extentY * aspect;
  else extentY = extentX / aspect;
  const maxExtent = WEB_MERCATOR_WORLD_HALF_EXTENT * 2;
  if (extentX > maxExtent) {
    extentX = maxExtent;
    extentY = extentX / aspect;
  }
  if (extentY > maxExtent) {
    extentY = maxExtent;
    extentX = extentY * aspect;
  }
  const metersPerPixel = Math.max(SAT_ZOOM_MIN_METERS_PER_PIXEL, extentX / width);
  return clampViewCenter(
    { centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2, metersPerPixel },
    extentX,
    extentY,
  );
}

export function buildExportImageRequest(
  view: MapView,
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio = 1,
  maxPixelSize = SAT_MAX_EXPORT_PIXEL_SIZE,
): ExportImageRequest | null {
  if (!Number.isFinite(cssWidth) || !Number.isFinite(cssHeight) || cssWidth <= 0 || cssHeight <= 0) return null;
  const scale = Math.min(Math.max(Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1, 1), 2);
  const aspect = cssWidth / cssHeight;
  let pixelWidth: number;
  let pixelHeight: number;
  if (aspect >= 1) {
    pixelWidth = Math.min(maxPixelSize, Math.max(1, Math.round(cssWidth * scale)));
    pixelHeight = Math.round(pixelWidth / aspect);
    if (pixelHeight > maxPixelSize) {
      pixelHeight = maxPixelSize;
      pixelWidth = Math.round(pixelHeight * aspect);
    }
  } else {
    pixelHeight = Math.min(maxPixelSize, Math.max(1, Math.round(cssHeight * scale)));
    pixelWidth = Math.round(pixelHeight * aspect);
  }
  pixelWidth = Math.max(1, Math.min(maxPixelSize, pixelWidth));
  pixelHeight = Math.max(1, Math.min(maxPixelSize, pixelHeight));
  const clamped = clampViewCenter(view, cssWidth * view.metersPerPixel, cssHeight * view.metersPerPixel);
  const metersPerImagePixel = clamped.metersPerPixel * (cssWidth / pixelWidth);
  const extentX = pixelWidth * metersPerImagePixel;
  const extentY = pixelHeight * metersPerImagePixel;
  const minX = Math.max(-WEB_MERCATOR_WORLD_HALF_EXTENT, clamped.centerX - extentX / 2);
  const maxX = Math.min(WEB_MERCATOR_WORLD_HALF_EXTENT, clamped.centerX + extentX / 2);
  const minY = Math.max(-WEB_MERCATOR_WORLD_HALF_EXTENT, clamped.centerY - extentY / 2);
  const maxY = Math.min(WEB_MERCATOR_WORLD_HALF_EXTENT, clamped.centerY + extentY / 2);
  const croppedExtentX = maxX - minX;
  const croppedExtentY = maxY - minY;
  if (croppedExtentX <= 0 || croppedExtentY <= 0) return null;
  const croppedPixelWidth = Math.max(1, Math.round(pixelWidth * (croppedExtentX / extentX)));
  const croppedPixelHeight = Math.max(1, Math.round(pixelHeight * (croppedExtentY / extentY)));
  const bbox = [minX, minY, maxX, maxY].map((value) => value.toFixed(2)).join(",");
  const href = `${MAPSERVER_EXPORT_ENDPOINT}?bbox=${bbox}&bboxSR=3857&imageSR=3857&size=${croppedPixelWidth},${croppedPixelHeight}&format=jpg&f=image`;
  return { href, minX, minY, extentX: croppedExtentX, extentY: croppedExtentY, pixelWidth: croppedPixelWidth, pixelHeight: croppedPixelHeight };
}

export function clampMetersPerPixel(metersPerPixel: number, viewportWidth: number): number {
  const safeWidth = Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 1;
  return Math.min(
    Math.max(metersPerPixel, SAT_ZOOM_MIN_METERS_PER_PIXEL),
    (WEB_MERCATOR_WORLD_HALF_EXTENT * 2) / safeWidth,
  );
}