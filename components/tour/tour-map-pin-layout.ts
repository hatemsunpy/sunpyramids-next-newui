import type { WebMercatorPoint } from "./tour-satellite-map-geometry";

type ScreenExtent = { minX: number; minY: number; extentX: number; extentY: number };
export type MapPinPosition = { x: number; y: number; anchorX: number; anchorY: number };

// Map northings increase upward; DOM/SVG screen coordinates increase downward.
export function mapScreenPoint(point: WebMercatorPoint, extent: ScreenExtent, width: number, height: number) {
  return {
    x: (point.x - extent.minX) / extent.extentX * width,
    y: (extent.minY + extent.extentY - point.y) / extent.extentY * height,
  };
}

export function layoutMapPins(points: WebMercatorPoint[], width: number, height: number): MapPinPosition[] {
  const pins = points.map(({ x, y }) => ({ x, y, anchorX: x, anchorY: y }));
  const visited = new Set<number>();
  const centered = (center: number, radius: number, length: number) =>
    Math.min(Math.max(center, radius + 28), Math.max(radius + 28, length - radius - 28));

  points.forEach((point, index) => {
    if (visited.has(index)) return;
    visited.add(index);
    // Off-screen pins stay at their true positions while the user pans/zooms.
    if (point.x < 0 || point.x > width || point.y < 0 || point.y > height) return;
    const group = [index];
    for (let cursor = 0; cursor < group.length; cursor++) {
      points.forEach((candidate, candidateIndex) => {
        if (visited.has(candidateIndex)) return;
        if (candidate.x < 0 || candidate.x > width || candidate.y < 0 || candidate.y > height) return;
        const neighbor = points[group[cursor]];
        if (Math.hypot(candidate.x - neighbor.x, candidate.y - neighbor.y) >= 46) return;
        visited.add(candidateIndex);
        group.push(candidateIndex);
      });
    }
    if (group.length === 1) return;
    const radius = Math.max(24, Math.min(Math.max(38, group.length * 9), Math.min(width, height) / 2 - 28));
    const centerX = centered(group.reduce((sum, pinIndex) => sum + points[pinIndex].x, 0) / group.length, radius, width);
    const centerY = centered(group.reduce((sum, pinIndex) => sum + points[pinIndex].y, 0) / group.length, radius, height);
    group.forEach((pinIndex, order) => {
      const angle = -Math.PI / 2 + order * 2 * Math.PI / group.length;
      pins[pinIndex].x = centerX + Math.cos(angle) * radius;
      pins[pinIndex].y = centerY + Math.sin(angle) * radius;
    });
  });
  return pins;
}
