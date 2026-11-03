import { describe, expect, it } from "vitest";
import { layoutMapPins, mapScreenPoint } from "@/components/tour/tour-map-pin-layout";
import { buildExportImageRequest, projectToWebMercator } from "@/components/tour/tour-satellite-map-geometry";

const extent = { minX: 0, minY: 0, extentX: 1000, extentY: 500 };

describe("mapScreenPoint", () => {
  it("projects northings upward: a northern point renders above a southern one", () => {
    const northern = mapScreenPoint({ x: 400, y: 400 }, extent, 1000, 500);
    const southern = mapScreenPoint({ x: 400, y: 100 }, extent, 1000, 500);
    expect(northern.y).toBe(100);
    expect(southern.y).toBe(400);
    expect(northern.y).toBeLessThan(southern.y);
  });

  it("keeps eastings left-to-right and maps the extent corners to the viewport corners", () => {
    const topLeft = mapScreenPoint({ x: 0, y: 500 }, extent, 1000, 500);
    const bottomRight = mapScreenPoint({ x: 1000, y: 0 }, extent, 1000, 500);
    expect(topLeft).toEqual({ x: 0, y: 0 });
    expect(bottomRight).toEqual({ x: 1000, y: 500 });
  });

  it("agrees with the exported image placement drawn from its own extent metadata", () => {
    const point = projectToWebMercator(29.98, 31.13)!;
    const view = { centerX: point.x, centerY: point.y, metersPerPixel: 20 };
    const request = buildExportImageRequest(view, 800, 500, 1)!;
    expect(request.extentX / request.extentY).toBeCloseTo(request.pixelWidth / request.pixelHeight, 6);
    const layerExtent = { minX: request.minX, minY: request.minY, extentX: request.extentX, extentY: request.extentY };
    const drawnAt = mapScreenPoint(point, layerExtent, 800, 500);
    expect(drawnAt.x).toBeCloseTo(400, 6);
    expect(drawnAt.y).toBeCloseTo(250, 6);
    const bbox = new URL(request.href).searchParams.get("bbox")!.split(",").map(Number);
    expect(Math.abs(request.minX - bbox[0])).toBeLessThan(0.05);
    expect(Math.abs(request.minY - bbox[1])).toBeLessThan(0.05);
    expect(Math.abs(request.extentX - (bbox[2] - bbox[0]))).toBeLessThan(0.05);
    expect(Math.abs(request.extentY - (bbox[3] - bbox[1]))).toBeLessThan(0.05);
  });
});

describe("layoutMapPins", () => {
  const coincident = Array.from({ length: 8 }, () => ({ x: 400, y: 250 }));

  it("fans coincident pins into unique, separated, on-viewport positions while anchors stay true", () => {
    const laid = layoutMapPins(coincident, 800, 500);
    expect(laid).toHaveLength(8);
    laid.forEach((pin) => {
      expect(pin.anchorX).toBe(400);
      expect(pin.anchorY).toBe(250);
      expect(pin.x).toBeGreaterThanOrEqual(0);
      expect(pin.x).toBeLessThanOrEqual(800);
      expect(pin.y).toBeGreaterThanOrEqual(0);
      expect(pin.y).toBeLessThanOrEqual(500);
    });
    const unique = new Set(laid.map((pin) => `${Math.round(pin.x)},${Math.round(pin.y)}`));
    expect(unique.size).toBe(8);
    for (let first = 0; first < laid.length; first++) {
      for (let second = first + 1; second < laid.length; second++) {
        expect(Math.hypot(laid[first].x - laid[second].x, laid[first].y - laid[second].y)).toBeGreaterThanOrEqual(44);
      }
    }
  });

  it("leaves a lone pin exactly on its anchor and an off-screen pin untouched", () => {
    const lone = layoutMapPins([{ x: 200, y: 150 }], 800, 500);
    expect(lone).toEqual([{ x: 200, y: 150, anchorX: 200, anchorY: 150 }]);
    const outside = layoutMapPins([{ x: 2000, y: 150 }, { x: 2010, y: 160 }], 800, 500);
    expect(outside).toEqual([
      { x: 2000, y: 150, anchorX: 2000, anchorY: 150 },
      { x: 2010, y: 160, anchorX: 2010, anchorY: 160 },
    ]);
  });

  it("keeps near-but-distinct pins readable without moving far anchors", () => {
    const near = [
      { x: 300, y: 300 },
      { x: 312, y: 304 },
      { x: 640, y: 220 },
    ];
    const laid = layoutMapPins(near, 800, 500);
    expect(laid[2]).toEqual({ x: 640, y: 220, anchorX: 640, anchorY: 220 });
    expect(Math.hypot(laid[0].x - laid[1].x, laid[0].y - laid[1].y)).toBeGreaterThanOrEqual(44);
    expect(laid[0].anchorX).toBe(300);
    expect(laid[1].anchorY).toBe(304);
  });

  it("clamps a fan inside very small viewports", () => {
    const laid = layoutMapPins(Array.from({ length: 5 }, () => ({ x: 50, y: 40 })), 100, 80);
    laid.forEach((pin) => {
      expect(pin.x).toBeGreaterThanOrEqual(0);
      expect(pin.x).toBeLessThanOrEqual(100);
      expect(pin.y).toBeGreaterThanOrEqual(0);
      expect(pin.y).toBeLessThanOrEqual(80);
    });
  });
});