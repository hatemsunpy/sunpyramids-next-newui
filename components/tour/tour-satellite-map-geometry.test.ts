import { describe, expect, it } from "vitest";
import {
  buildExportImageRequest,
  clampViewCenter,
  computeFitView,
  normalizeLongitude,
  parseCoordinate,
  projectToWebMercator,
  SAT_MIN_SPAN_METERS,
  SAT_ZOOM_MIN_METERS_PER_PIXEL,
  WEB_MERCATOR_MAX_LATITUDE,
  WEB_MERCATOR_SPHERE_RADIUS,
  WEB_MERCATOR_WORLD_HALF_EXTENT,
} from "@/components/tour/tour-satellite-map-geometry";

describe("parseCoordinate", () => {
  it.each([
    [null, null],
    [undefined, null],
    ["", null],
    ["   ", null],
    ["abc", null],
    ["12abc", null],
    ["NaN", null],
    ["Infinity", null],
    ["+Infinity", null],
    ["1e2x", null],
  ])("rejects %j instead of coercing to a number", (value) => {
    expect(parseCoordinate(value, "longitude")).toBeNull();
  });

  it("keeps numeric zero exactly as a valid coordinate", () => {
    expect(parseCoordinate("0", "latitude")).toBe(0);
    expect(parseCoordinate(0, "longitude")).toBe(0);
    expect(parseCoordinate(" 0.0 ", "latitude")).toBe(0);
  });

  it("trims and parses finite signed decimals", () => {
    expect(parseCoordinate(" -12.5 ", "longitude")).toBe(-12.5);
    expect(parseCoordinate("+25.75", "latitude")).toBe(25.75);
    expect(parseCoordinate(41.25, "longitude")).toBe(41.25);
  });

  it("enforces the projection domain before projecting", () => {
    expect(parseCoordinate(WEB_MERCATOR_MAX_LATITUDE, "latitude")).toBe(WEB_MERCATOR_MAX_LATITUDE);
    expect(parseCoordinate(85.052, "latitude")).toBeNull();
    expect(parseCoordinate(-86, "latitude")).toBeNull();
    expect(parseCoordinate(180, "longitude")).toBe(180);
    expect(parseCoordinate(-180.5, "longitude")).toBeNull();
  });
});

describe("normalizeLongitude", () => {
  it.each([
    [0, 0],
    [90, 90],
    [-90, -90],
    [180, -180],
    [-180, -180],
    [190, -170],
    [-190, 170],
  ])("wraps %j into [-180, 180]", (value, expected) => {
    expect(normalizeLongitude(value)).toBeCloseTo(expected, 6);
  });
});

describe("projectToWebMercator", () => {
  it("projects the equator prime meridian to the origin", () => {
    const origin = projectToWebMercator(0, 0)!;
    expect(origin.x).toBeCloseTo(0, 8);
    expect(origin.y).toBeCloseTo(0, 8);
  });

  it("matches published Web Mercator values", () => {
    const projected = projectToWebMercator(30, 30);
    expect(projected).not.toBeNull();
    expect(projected!.y).toBeCloseTo(3503549.8435, 3);
    expect(projected!.x).toBeCloseTo((WEB_MERCATOR_SPHERE_RADIUS * Math.PI * 30) / 180, 3);
  });

  it("rejects blank or out-of-domain coordinates instead of mapping them to zero", () => {
    expect(projectToWebMercator("  ", "31")).toBeNull();
    expect(projectToWebMercator(30, "")).toBeNull();
    expect(projectToWebMercator(undefined, "31")).toBeNull();
    expect(projectToWebMercator(86, "31")).toBeNull();
  });

  it("accepts zero coordinates as a real location", () => {
    const projected = projectToWebMercator("0", "0")!;
    expect(projected.x).toBeCloseTo(0, 8);
    expect(projected.y).toBeCloseTo(0, 8);
  });
});

describe("computeFitView", () => {
  it("gives a single point a finite, padded minimum extent", () => {
    const view = computeFitView([{ x: 3475000, y: 3500000 }], 800, 500);
    expect(view).not.toBeNull();
    expect(Number.isFinite(view!.centerX) && Number.isFinite(view!.centerY) && Number.isFinite(view!.metersPerPixel)).toBe(true);
    expect(view!.metersPerPixel).toBeGreaterThanOrEqual(SAT_ZOOM_MIN_METERS_PER_PIXEL);
    const extentX = 800 * view!.metersPerPixel;
    const extentY = 500 * view!.metersPerPixel;
    expect(Math.abs(view!.centerX - 3475000)).toBeLessThanOrEqual(extentX / 2);
    expect(Math.abs(view!.centerY - 3500000)).toBeLessThanOrEqual(extentY / 2);
    expect(extentX).toBeGreaterThanOrEqual(SAT_MIN_SPAN_METERS * 0.99);
  });

  it("fits two points centered between them with both fully inside the extent", () => {
    const south = projectToWebMercator(25, 32)!;
    const north = projectToWebMercator(31, 30)!;
    const view = computeFitView([south, north], 600, 400);
    expect(view).not.toBeNull();
    const extentX = 600 * view!.metersPerPixel;
    const extentY = 400 * view!.metersPerPixel;
    expect(Math.abs(view!.centerX - (south.x + north.x) / 2)).toBeLessThan(1e-6);
    expect(Math.abs(view!.centerY - (south.y + north.y) / 2)).toBeLessThan(1e-6);
    expect(south.x).toBeGreaterThanOrEqual(view!.centerX - extentX / 2);
    expect(north.x).toBeLessThanOrEqual(view!.centerX + extentX / 2);
    expect(south.y).toBeGreaterThanOrEqual(view!.centerY - extentY / 2);
    expect(north.y).toBeLessThanOrEqual(view!.centerY + extentY / 2);
  });

  it("aspect-corrects the extent to the viewport without distorting coordinates", () => {
    const points = [projectToWebMercator(29, 30)!, projectToWebMercator(32, 32)!];
    const view = computeFitView(points, 900, 300);
    const extentX = 900 * view!.metersPerPixel;
    const extentY = 300 * view!.metersPerPixel;
    expect(extentX / extentY).toBeCloseTo(3, 6);
  });

  it("stays inside the known domain for near-world spans and clamps the center", () => {
    const west = projectToWebMercator(0, 0)!;
    const east = projectToWebMercator(0, 180)!;
    const view = computeFitView([west, east], 1000, 500);
    expect(view).not.toBeNull();
    const extentX = 1000 * view!.metersPerPixel;
    const extentY = 500 * view!.metersPerPixel;
    expect(Math.abs(view!.centerX)).toBeLessThanOrEqual(WEB_MERCATOR_WORLD_HALF_EXTENT);
    expect(Math.abs(view!.centerY)).toBeLessThanOrEqual(WEB_MERCATOR_WORLD_HALF_EXTENT);
    expect(view!.centerX - extentX / 2).toBeGreaterThanOrEqual(-WEB_MERCATOR_WORLD_HALF_EXTENT - 1e-6);
    expect(view!.centerX + extentX / 2).toBeLessThanOrEqual(WEB_MERCATOR_WORLD_HALF_EXTENT + 1e-6);
    expect(view!.centerY - extentY / 2).toBeGreaterThanOrEqual(-WEB_MERCATOR_WORLD_HALF_EXTENT - 1e-6);
    expect(view!.centerY + extentY / 2).toBeLessThanOrEqual(WEB_MERCATOR_WORLD_HALF_EXTENT + 1e-6);
  });

  it("returns null without data or an unmeasured container", () => {
    expect(computeFitView([], 800, 500)).toBeNull();
    expect(computeFitView([{ x: 0, y: 0 }], 0, 500)).toBeNull();
    expect(computeFitView([{ x: 0, y: 0 }], 800, 0)).toBeNull();
  });
});

describe("clampViewCenter", () => {
  it("clamps the center so the extent never leaves the domain", () => {
    const beyond = clampViewCenter({ centerX: WEB_MERCATOR_WORLD_HALF_EXTENT * 3, centerY: 0, metersPerPixel: 100 }, 6000000, 4000000);
    expect(beyond.centerX).toBeCloseTo(WEB_MERCATOR_WORLD_HALF_EXTENT - 3000000, 1);
    expect(beyond.centerY).toBe(0);
  });
});

describe("buildExportImageRequest", () => {
  it("builds a keyless export URL for the projected extent and matching pixel size", () => {
    const view = computeFitView([projectToWebMercator(29.98, 31.13)!], 800, 500)!;
    const request = buildExportImageRequest(view, 800, 500, 1);
    expect(request).not.toBeNull();
    const url = new URL(request!.href);
    expect(url.origin + url.pathname).toBe("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export");
    expect(url.searchParams.get("bboxSR")).toBe("3857");
    expect(url.searchParams.get("imageSR")).toBe("3857");
    expect(url.searchParams.get("format")).toBe("jpg");
    expect(url.searchParams.get("f")).toBe("image");
    const bbox = url.searchParams.get("bbox")!.split(",").map(Number);
    const size = url.searchParams.get("size")!.split(",").map(Number);
    expect(bbox).toHaveLength(4);
    expect(size).toEqual([800, 500]);
    expect(size.every((value) => value > 0 && value <= 1600)).toBe(true);
    expect([...url.searchParams.keys()].some((key) => /key|token|signature/i.test(key))).toBe(false);
  });

  it("preserves the container aspect ratio inside the clamped pixel budget", () => {
    const view = { centerX: 0, centerY: 0, metersPerPixel: 20 };
    const request = buildExportImageRequest(view, 1000, 500, 2)!;
    const url = new URL(request.href);
    const size = url.searchParams.get("size")!.split(",").map(Number);
    expect(size.every((value) => value <= 1600)).toBe(true);
    expect(size[0] / size[1]).toBeCloseTo(2, 2);
    const bbox = url.searchParams.get("bbox")!.split(",").map(Number);
    expect((bbox[2] - bbox[0]) / (bbox[3] - bbox[1])).toBeCloseTo(2, 6);
  });

  it("keeps tall and narrow viewports exact instead of distorting or leaving blank bands", () => {
    const view = { centerX: 0, centerY: 0, metersPerPixel: 20 };
    const tall = buildExportImageRequest(view, 640, 1100, 2)!;
    const tallUrl = new URL(tall.href);
    const tallSize = tallUrl.searchParams.get("size")!.split(",").map(Number);
    expect(tallSize).toEqual([931, 1600]);
    expect(tallSize[0] / tallSize[1]).toBeCloseTo(640 / 1100, 3);
    const tallBbox = tallUrl.searchParams.get("bbox")!.split(",").map(Number);
    expect((tallBbox[2] - tallBbox[0]) / (tallBbox[3] - tallBbox[1])).toBeCloseTo(tallSize[0] / tallSize[1], 6);
    expect(tall.extentX).toBeCloseTo(640 * 20, -1);
    expect(tall.extentY).toBeCloseTo(1100 * 20, -1);

    const portrait = buildExportImageRequest({ centerX: 0, centerY: 0, metersPerPixel: 20 }, 300, 800, 1)!;
    const portraitSize = new URL(portrait.href).searchParams.get("size")!.split(",").map(Number);
    expect(portraitSize).toEqual([300, 800]);
    expect(portraitSize[0] / portraitSize[1]).toBeCloseTo(300 / 800, 6);
  });

  it("keeps the bbox inside the domain even at world scale", () => {
    const world = buildExportImageRequest({ centerX: 0, centerY: 0, metersPerPixel: 40000 }, 1200, 400, 1);
    const bbox = new URL(world!.href).searchParams.get("bbox")!.split(",").map(Number);
    expect(bbox[0]).toBeGreaterThanOrEqual(-WEB_MERCATOR_WORLD_HALF_EXTENT);
    expect(bbox[2]).toBeLessThanOrEqual(WEB_MERCATOR_WORLD_HALF_EXTENT);
    expect(bbox[1]).toBeGreaterThanOrEqual(-WEB_MERCATOR_WORLD_HALF_EXTENT);
    expect(bbox[3]).toBeLessThanOrEqual(WEB_MERCATOR_WORLD_HALF_EXTENT);
  });

  it("refuses to request imagery without a measured viewport", () => {
    expect(buildExportImageRequest({ centerX: 0, centerY: 0, metersPerPixel: 20 }, 0, 500)).toBeNull();
    expect(buildExportImageRequest({ centerX: 0, centerY: 0, metersPerPixel: 20 }, 800, -1)).toBeNull();
  });
});