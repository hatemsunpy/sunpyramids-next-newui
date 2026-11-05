"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TourDestination } from "@/components/tour/TourDestinationsModal";
import { layoutMapPins, mapScreenPoint } from "./tour-map-pin-layout";
import {
  buildExportImageRequest,
  clampMetersPerPixel,
  clampViewCenter,
  computeFitView,
  projectToWebMercator,
  SAT_MAX_EXPORT_PIXEL_SIZE,
  type MapView,
} from "./tour-satellite-map-geometry";

const SAT_COMMIT_INTERVAL_MS = 250;
const SAT_ZOOM_STEP = 1.5;
const SAT_PAN_STEP_RATIO = 0.35;

type PlacedDestination = { destination: TourDestination; index: number; x: number; y: number };

type MapImageLayer = {
  id: number;
  href: string;
  minX: number;
  minY: number;
  extentX: number;
  extentY: number;
  status: "loading" | "ready";
};

function destinationLabel(destination: TourDestination) {
  return destination.title || destination.name || `Destination ${destination.id ?? ""}`.trim();
}

export function TourSatelliteMap({ destinations, activeDestination, onSelect }: {
  destinations: TourDestination[];
  activeDestination: TourDestination;
  onSelect: (destination: TourDestination) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const sizeRef = useRef<{ width: number; height: number } | null>(null);
  const commitDueAtRef = useRef(0);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layerIdRef = useRef(0);
  const dragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const fitRequestedRef = useRef(false);
  const [view, setView] = useState<MapView | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [layers, setLayers] = useState<MapImageLayer[]>([]);
  const [imageryError, setImageryError] = useState(false);

  const { placed, missing } = useMemo(() => {
    const placedEntries: PlacedDestination[] = [];
    const missingEntries: TourDestination[] = [];
    destinations.forEach((destination, index) => {
      const projected = projectToWebMercator(destination.latitude, destination.longitude);
      if (projected) placedEntries.push({ destination, index, x: projected.x, y: projected.y });
      else missingEntries.push(destination);
    });
    return { placed: placedEntries, missing: missingEntries };
  }, [destinations]);

  const extents = useMemo(() => (view && size ? { x: size.width * view.metersPerPixel, y: size.height * view.metersPerPixel } : null), [view, size]);

  const clampedView = useMemo(() => (view && extents ? clampViewCenter(view, extents.x, extents.y) : null), [view, extents]);

  const bbox = useMemo(() => (clampedView && extents ? {
    minX: clampedView.centerX - extents.x / 2,
    minY: clampedView.centerY - extents.y / 2,
    extentX: extents.x,
    extentY: extents.y,
  } : null), [clampedView, extents]);

  const pinPositions = useMemo(() => bbox && size
    ? layoutMapPins(placed.map(point => mapScreenPoint(point, bbox, size.width, size.height)), size.width, size.height)
    : [], [bbox, size, placed]);

  const commitCurrentView = useCallback(() => {
    const current = viewRef.current;
    const box = sizeRef.current;
    if (!current || !box) return;
    setImageryError(false);
    setLayers((previous) => {
      const request = buildExportImageRequest(current, box.width, box.height, typeof window === "undefined" ? 1 : window.devicePixelRatio, SAT_MAX_EXPORT_PIXEL_SIZE);
      if (!request) return previous;
      const newest = previous[previous.length - 1];
      if (newest && newest.href === request.href) return previous;
      layerIdRef.current += 1;
      const layer: MapImageLayer = { id: layerIdRef.current, href: request.href, minX: request.minX, minY: request.minY, extentX: request.extentX, extentY: request.extentY, status: "loading" };
      const next = [...previous, layer];
      const ready = next.filter((entry) => entry.status === "ready");
      const newestReady = ready.length ? ready[ready.length - 1] : null;
      const loading = next.filter((entry) => entry.status === "loading");
      const staleLoading = loading.length > 2 ? loading.slice(0, loading.length - 2) : [];
      return next.filter((entry) => entry.status !== "loading" || !staleLoading.includes(entry))
        .filter((entry) => entry.status !== "ready" || entry === newestReady);
    });
  }, []);

  const scheduleCommit = useCallback((minDelay = SAT_COMMIT_INTERVAL_MS) => {
    const now = Date.now();
    const wait = Math.max(minDelay, commitDueAtRef.current - now);
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      commitDueAtRef.current = Date.now() + SAT_COMMIT_INTERVAL_MS;
      commitCurrentView();
    }, wait);
  }, [commitCurrentView]);

  const fitToContainer = useCallback((box: { width: number; height: number }) => {
    const fitted = computeFitView(placed.map(({ x, y }) => ({ x, y })), box.width, box.height);
    if (fitted) {
      viewRef.current = fitted;
      setView(fitted);
      scheduleCommit(0);
    } else {
      viewRef.current = null;
      setView(null);
    }
  }, [placed, scheduleCommit]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const applySize = (width: number, height: number) => {
      if (!(width > 0 && height > 0)) return;
      const previous = sizeRef.current;
      const measured = previous && Math.abs(previous.width - width) < 1 && Math.abs(previous.height - height) < 1;
      if (measured) return;
      const box = { width, height };
      sizeRef.current = box;
      setSize(box);
      if (viewRef.current === null || fitRequestedRef.current) {
        fitRequestedRef.current = false;
        fitToContainer(box);
      } else {
        scheduleCommit(0);
      }
    };
    const measureEntries = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) applySize(entry.contentRect.width, entry.contentRect.height);
    };
    const measureElement = () => {
      const rect = element.getBoundingClientRect();
      applySize(rect.width, rect.height);
    };
    if (typeof ResizeObserver === "undefined") {
      measureElement();
      window.addEventListener("resize", measureElement);
      return () => window.removeEventListener("resize", measureElement);
    }
    const observer = new ResizeObserver(measureEntries);
    observer.observe(element);
    return () => observer.disconnect();
  }, [scheduleCommit, fitToContainer]);

  useEffect(() => () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
  }, []);

  const updateView = useCallback((updater: (current: MapView) => MapView) => {
    const current = viewRef.current;
    if (!current) return;
    const box = sizeRef.current;
    const viewportWidth = box?.width ?? 800;
    const viewportHeight = box?.height ?? 600;
    const next = updater(current);
    const metersPerPixel = clampMetersPerPixel(next.metersPerPixel, viewportWidth);
    const clamped = clampViewCenter({ ...next, metersPerPixel }, viewportWidth * metersPerPixel, viewportHeight * metersPerPixel);
    viewRef.current = clamped;
    setView(clamped);
    scheduleCommit();
  }, [scheduleCommit]);

  const panByPixels = useCallback((offsetX: number, offsetY: number) => {
    updateView(current => ({ ...current, centerX: current.centerX + offsetX * current.metersPerPixel, centerY: current.centerY - offsetY * current.metersPerPixel }));
  }, [updateView]);

  const panByFraction = useCallback((fractionX: number, fractionY: number) => {
    const box = sizeRef.current;
    panByPixels((box?.width ?? 300) * SAT_PAN_STEP_RATIO * fractionX, (box?.height ?? 300) * SAT_PAN_STEP_RATIO * fractionY);
  }, [panByPixels]);

  const zoomByFactor = useCallback((factor: number) => {
    updateView(current => ({ ...current, metersPerPixel: current.metersPerPixel / factor }));
  }, [updateView]);

  const handleFit = useCallback(() => {
    fitRequestedRef.current = true;
    const box = sizeRef.current;
    if (box) fitToContainer(box);
  }, [fitToContainer]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const box = sizeRef.current;
    const panStepX = (box?.width ?? 300) * SAT_PAN_STEP_RATIO;
    const panStepY = (box?.height ?? 300) * SAT_PAN_STEP_RATIO;
    const mappings: Record<string, () => void> = {
      ArrowLeft: () => panByPixels(-panStepX, 0),
      ArrowRight: () => panByPixels(panStepX, 0),
      ArrowUp: () => panByPixels(0, -panStepY),
      ArrowDown: () => panByPixels(0, panStepY),
      "+": () => zoomByFactor(SAT_ZOOM_STEP),
      "=": () => zoomByFactor(SAT_ZOOM_STEP),
      "-": () => zoomByFactor(1 / SAT_ZOOM_STEP),
    };
    const handler = mappings[event.key];
    if (!handler) return;
    event.preventDefault();
    event.stopPropagation();
    handler();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      return;
    }
    dragRef.current = { lastX: event.clientX, lastY: event.clientY };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    panByPixels(drag.lastX - event.clientX, drag.lastY - event.clientY);
    dragRef.current = { lastX: event.clientX, lastY: event.clientY };
  };

  const endPointerDrag = () => {
    dragRef.current = null;
  };

  const hasReadyLayer = layers.some((layer) => layer.status === "ready");
  const awaitingFirstImage = Boolean(bbox) && layers.length > 0 && !hasReadyLayer;

  const previousActiveRef = useRef<TourDestination | null>(null);

  useEffect(() => {
    const previous = previousActiveRef.current;
    previousActiveRef.current = activeDestination;
    if (!previous || previous === activeDestination) return;
    const timer = setTimeout(() => {
      const box = sizeRef.current;
      const current = viewRef.current;
      const activeEntry = placed.find((entry) => entry.destination === activeDestination);
      if (!box || !current || !activeEntry) return;
      const extent = {
        minX: current.centerX - (box.width * current.metersPerPixel) / 2,
        minY: current.centerY - (box.height * current.metersPerPixel) / 2,
        extentX: box.width * current.metersPerPixel,
        extentY: box.height * current.metersPerPixel,
      };
      const screen = mapScreenPoint(activeEntry, extent, box.width, box.height);
      const margin = 56;
      if (screen.x >= margin && screen.x <= box.width - margin && screen.y >= margin && screen.y <= box.height - margin) return;
      updateView(currentView => ({ ...currentView, centerX: activeEntry.x, centerY: activeEntry.y }));
    }, 0);
    return () => clearTimeout(timer);
  }, [activeDestination, placed, updateView]);

  const handleLayerLoad = (event: React.SyntheticEvent<SVGImageElement>) => {
    const href = event.currentTarget.getAttribute("href") ?? "";
    setLayers(previous => previous.map((layer) => (layer.href === href ? { ...layer, status: "ready" } : layer)));
  };

  const handleLayerError = (event: React.SyntheticEvent<SVGImageElement>) => {
    const href = event.currentTarget.getAttribute("href") ?? "";
    setLayers(previous => previous.filter((layer) => layer.href !== href));
    setImageryError(true);
  };

  const retryImagery = () => {
    setLayers(previous => previous.filter((layer) => layer.status === "ready"));
    setImageryError(false);
    scheduleCommit(0);
  };

  return (
    <div className="tour-destinations-map tour-satellite-map">
      <div
        ref={viewportRef}
        className="tour-satellite-viewport"
        role="group"
        aria-label="Satellite map of tour destinations"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
      >
        {bbox && clampedView ? (
          <svg className="tour-satellite-image" viewBox={`${bbox.minX.toFixed(2)} ${(-(bbox.minY + bbox.extentY)).toFixed(2)} ${bbox.extentX.toFixed(2)} ${bbox.extentY.toFixed(2)}`} preserveAspectRatio="none" aria-hidden="true">
            {layers.map((layer) => (
              <image
                key={layer.id}
                href={layer.href}
                x={layer.minX}
                y={-(layer.minY + layer.extentY)}
                width={layer.extentX}
                height={layer.extentY}
                preserveAspectRatio="none"
                onLoad={handleLayerLoad}
                onError={handleLayerError}
              />
            ))}
          </svg>
        ) : null}
        {size ? <svg className="tour-satellite-leaders" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none" aria-hidden="true">
          {pinPositions.map((pin, index) => pin.x !== pin.anchorX || pin.y !== pin.anchorY
            ? <line key={placed[index].index} x1={pin.anchorX} y1={pin.anchorY} x2={pin.x} y2={pin.y} />
            : null)}
        </svg> : null}
        {bbox && clampedView ? placed.map((entry, positionIndex) => {
          const isActive = entry.destination === activeDestination;
          const pin = pinPositions[positionIndex];
          return (
            <button
              key={entry.destination.id ?? `${entry.index}-${entry.destination.slug}`}
              type="button"
              className={`tour-satellite-pin ${isActive ? "is-active" : ""}`}
              style={{ left: `${pin.x}px`, top: `${pin.y}px`, zIndex: isActive ? 3 : 2 }}
              aria-pressed={isActive}
              aria-label={`${entry.index + 1}. ${destinationLabel(entry.destination)}`}
              title={`${entry.index + 1}. ${destinationLabel(entry.destination)}`}
              onClick={() => onSelect(entry.destination)}
            >
              <span aria-hidden="true">{entry.index + 1}</span>
            </button>
          );
        }) : null}
        {awaitingFirstImage && !imageryError ? <div className="tour-satellite-status is-loading" role="status"><span>Loading satellite imagery…</span></div> : null}
        {size && !hasReadyLayer && imageryError ? (
          <div className="tour-satellite-status is-error" role="status">
            <span>Satellite imagery is unavailable right now.</span>
            <button type="button" onClick={retryImagery}>Retry imagery</button>
          </div>
        ) : null}
        {missing.length ? (
          <p className="tour-satellite-missing" role="note">
            No map location for: {missing.map((destination, index) => <span key={destination.id ?? index}>{destinationLabel(destination)}{index < missing.length - 1 ? ", " : ""}</span>)}
          </p>
        ) : null}
      </div>
      <div className="tour-satellite-controls" aria-label="Map view controls">
        <button type="button" className="tour-satellite-control" onClick={() => zoomByFactor(SAT_ZOOM_STEP)} aria-label="Zoom in">+</button>
        <button type="button" className="tour-satellite-control" onClick={() => zoomByFactor(1 / SAT_ZOOM_STEP)} aria-label="Zoom out">−</button>
        <button type="button" className="tour-satellite-control" onClick={handleFit} aria-label="Fit all destinations">⤢</button>
      </div>
      <div className="tour-satellite-pan-controls" aria-label="Map pan controls">
        <button type="button" className="tour-satellite-control" onClick={() => panByFraction(0, -1)} aria-label="Pan north">↑</button>
        <button type="button" className="tour-satellite-control" onClick={() => panByFraction(0, 1)} aria-label="Pan south">↓</button>
        <button type="button" className="tour-satellite-control" onClick={() => panByFraction(-1, 0)} aria-label="Pan west">←</button>
        <button type="button" className="tour-satellite-control" onClick={() => panByFraction(1, 0)} aria-label="Pan east">→</button>
      </div>
      <a className="tour-satellite-attribution" href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" target="_blank" rel="noreferrer noopener">
        Imagery © Esri, Vantor, Earthstar Geographics, and the GIS User Community
      </a>
    </div>
  );
}
