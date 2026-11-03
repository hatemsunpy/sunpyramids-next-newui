import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TourDestinationsModal } from "@/components/tour/TourDestinationsModal";
import { TourSatelliteMap } from "@/components/tour/TourSatelliteMap";
import type { Tour } from "@/types/api";
import type { TourDestination } from "./TourDestinationsModal";

const resizeObservers: Array<{ callback: (entries: Array<{ contentRect: { width: number; height: number } }>) => void }> = [];

class MockResizeObserver {
  callback: (entries: Array<{ contentRect: { width: number; height: number } }>) => void;

  constructor(callback: (entries: Array<{ contentRect: { width: number; height: number } }>) => void) {
    this.callback = callback;
    resizeObservers.push(this);
  }

  observe(): void {}

  unobserve(): void {}

  disconnect(): void {
    const index = resizeObservers.indexOf(this);
    if (index >= 0) resizeObservers.splice(index, 1);
  }
}

function resizeViewport(width: number, height: number) {
  resizeObservers.slice().forEach((observer) => act(() => {
    observer.callback([{ contentRect: { width, height } }]);
  }));
}

function flushViewTimers() {
  act(() => { vi.runAllTimers(); });
}

function expectSatelliteImage(container: HTMLElement): SVGImageElement {
  const image = container.querySelector("image");
  expect(image, "expected an <image> layer once the viewport was measured").not.toBeNull();
  return image as unknown as SVGImageElement;
}

function pins(container: HTMLElement) {
  return within(container).getAllByRole("button").filter((element) => element.classList.contains("tour-satellite-pin"));
}

function viewBoxOf(container: HTMLElement): number[] {
  const svg = container.querySelector("svg");
  expect(svg, "expected the map svg once the viewport was measured").not.toBeNull();
  return svg!.getAttribute("viewBox")!.split(" ").map(Number);
}

const destinations: TourDestination[] = [
  { id: 1, title: "Cairo", latitude: "29.98", longitude: "31.13" },
  { id: 2, title: "Luxor", latitude: "25.69", longitude: "32.64" },
  { id: 3, title: "Mystery Site", latitude: "   ", longitude: null },
];

const tourStub: Tour = { id: 7, title: "Synthetic multi-city tour", adult_price: 100 };

const setPointerCaptureStub = vi.fn();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  resizeObservers.length = 0;
  (Element.prototype as unknown as { setPointerCapture?: (pointerId: number) => void }).setPointerCapture = setPointerCaptureStub;
});

afterEach(() => {
  cleanup();
  delete (Element.prototype as unknown as { setPointerCapture?: (pointerId: number) => void }).setPointerCapture;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("renders every mapped destination pin at once and flags destinations without valid coordinates", () => {
  const { container } = render(
    <TourSatelliteMap destinations={destinations} activeDestination={destinations[0]} onSelect={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();
  fireEvent.load(expectSatelliteImage(container));

  const image = expectSatelliteImage(container);
  expect(image.getAttribute("href")).toContain("services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export");
  expect(image.getAttribute("href")).toContain("bboxSR=3857");

  expect(pins(container)).toHaveLength(2);
  expect(within(container).getByRole("button", { name: "1. Cairo" })).toBeInTheDocument();
  expect(within(container).getByRole("button", { name: "2. Luxor" })).toBeInTheDocument();
  expect(within(container).getByRole("note")).toHaveTextContent("No map location for: Mystery Site");
});

it("keeps all pins mounted and re-centers selection when a list item is re-selected", () => {
  const { container, rerender } = render(
    <TourSatelliteMap destinations={destinations} activeDestination={destinations[0]} onSelect={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();

  const before = pins(container).map((pin) => pin.textContent);
  expect(before).toEqual(["1", "2"]);

  rerender(<TourSatelliteMap destinations={destinations} activeDestination={destinations[1]} onSelect={() => {}} />);

  const activePin = document.querySelector(".tour-satellite-pin.is-active")!;
  expect(activePin).not.toBeNull();
  expect(activePin.textContent).toBe("2");
  expect(pins(container).map((pin) => pin.textContent)).toEqual(["1", "2"]);
});

it("selects a destination from the modal list without removing any pin", () => {
  render(
    <TourDestinationsModal tour={tourStub} locale="en" destinations={destinations} open onClose={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();

  expect(pins(document.body)).toHaveLength(2);
  expect(document.querySelectorAll(".tour-satellite-pin.is-active")).toHaveLength(1);

  fireEvent.click(screen.getByRole("button", { name: "Luxor" }));

  expect(pins(document.body)).toHaveLength(2);
  expect(document.querySelector(".tour-satellite-pin.is-active")!.textContent).toBe("2");
  expect(document.querySelector(".tour-satellite-pin:not(.is-active)")!.textContent).toBe("1");
  expect(screen.getByRole("button", { name: "Luxor" }).className).toContain("is-active");
  expect(screen.getByRole("button", { name: "Cairo" }).className).not.toContain("is-active");
});

it("selects the matching destination when a pin is clicked", () => {
  const onSelect = vi.fn();
  render(
    <TourSatelliteMap destinations={destinations} activeDestination={destinations[0]} onSelect={onSelect} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();

  fireEvent.click(within(document.body).getByRole("button", { name: "2. Luxor" }));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith(destinations[1]);
});

it("shows a retryable imagery-unavailable status when the export fails", () => {
  const { container } = render(
    <TourSatelliteMap destinations={destinations} activeDestination={destinations[0]} onSelect={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();

  fireEvent.error(expectSatelliteImage(container));
  expect(within(container).getByRole("status")).toHaveTextContent("Satellite imagery is unavailable right now.");

  fireEvent.click(within(container).getByRole("button", { name: "Retry imagery" }));
  flushViewTimers();
  expect(container.querySelector("image")).not.toBeNull();
  expect(within(container).queryByRole("button", { name: "Retry imagery" })).toBeNull();
});

it("zooms and pans the live view around its center and fits the whole set again", () => {
  const { container } = render(
    <TourSatelliteMap destinations={destinations} activeDestination={destinations[0]} onSelect={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();
  const [fitMinX, , fitWidth, ] = viewBoxOf(container);

  fireEvent.click(within(container).getByRole("button", { name: "Zoom in" }));
  const [zoomedMinX, , zoomedWidth] = viewBoxOf(container);
  expect(zoomedWidth).toBeLessThan(fitWidth);
  expect(Math.abs((zoomedMinX + zoomedWidth / 2) - (fitMinX + fitWidth / 2))).toBeLessThan(fitWidth * 0.05);

  fireEvent.click(within(container).getByRole("button", { name: "Pan west" }));
  const [pannedMinX] = viewBoxOf(container);
  expect(pannedMinX).toBeLessThan(zoomedMinX);

  fireEvent.click(within(container).getByRole("button", { name: "Fit all destinations" }));
  const [resetMinX, , resetWidth] = viewBoxOf(container);
  expect(resetWidth).toBeCloseTo(fitWidth, 6);
  expect(resetMinX).toBeCloseTo(fitMinX, 6);
});

it("pans toward the pointer with native drag and re-requests imagery after it settles", () => {
  const { container } = render(
    <TourSatelliteMap destinations={destinations} activeDestination={destinations[0]} onSelect={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();
  const [initialMinX, initialMinY] = viewBoxOf(container);

  const viewport = container.querySelector(".tour-satellite-viewport")!;
  expect(viewport).not.toBeNull();
  fireEvent.pointerDown(viewport, { button: 0, pointerId: 1, clientX: 400, clientY: 250 });
  fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 500, clientY: 260 });
  fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 500, clientY: 260 });
  const [draggedMinX, draggedMinY] = viewBoxOf(container);
  expect(draggedMinX).toBeLessThan(initialMinX);
  expect(draggedMinY).toBeLessThan(initialMinY);

  const initialHref = container.querySelector("image")!.getAttribute("href")!;
  flushViewTimers();
  const lastImage = [...container.querySelectorAll("image")].at(-1)!;
  expect(lastImage.getAttribute("href")).not.toBe(initialHref);
});

it("places the northern destination above the southern one on screen", () => {
  const northSouth: TourDestination[] = [
    { id: 11, title: "Aswan", latitude: "24.09", longitude: "32.90" },
    { id: 12, title: "Cairo", latitude: "29.98", longitude: "31.13" },
  ];
  const { container } = render(
    <TourSatelliteMap destinations={northSouth} activeDestination={northSouth[1]} onSelect={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();

  const [aswanPin, cairoPin] = pins(container);
  expect(parseFloat(cairoPin.style.top)).toBeLessThan(parseFloat(aswanPin.style.top));
  expect(parseFloat(cairoPin.style.top)).toBeLessThan(250);
  expect(parseFloat(aswanPin.style.top)).toBeGreaterThan(250);
});

it("brings a selected destination that the user panned away back into view and keeps the other pins", () => {
  const destinationsPair: TourDestination[] = [
    { id: 21, title: "Cairo", latitude: "29.98", longitude: "31.13" },
    { id: 22, title: "Aswan", latitude: "24.09", longitude: "32.90" },
  ];
  const { container, rerender } = render(
    <TourSatelliteMap destinations={destinationsPair} activeDestination={destinationsPair[0]} onSelect={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();

  fireEvent.click(within(container).getByRole("button", { name: "Zoom in" }));
  fireEvent.click(within(container).getByRole("button", { name: "Zoom in" }));
  const viewport = container.querySelector(".tour-satellite-viewport")!;
  fireEvent.pointerDown(viewport, { button: 0, pointerId: 1, clientX: 400, clientY: 100 });
  fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 700, clientY: 360 });
  fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 700, clientY: 360 });
  flushViewTimers();

  const aswanBefore = pins(container).find((pin) => pin.getAttribute("aria-label") === "2. Aswan")!;
  expect(parseFloat(aswanBefore.style.top)).toBeGreaterThan(500 - 56);
  expect(parseFloat(aswanBefore.style.left)).toBeGreaterThan(800 - 56);

  rerender(<TourSatelliteMap destinations={destinationsPair} activeDestination={destinationsPair[1]} onSelect={() => {}} />);
  flushViewTimers();

  const aswanAfter = pins(container).find((pin) => pin.getAttribute("aria-label") === "2. Aswan")!;
  const cairoAfter = pins(container).find((pin) => pin.getAttribute("aria-label") === "1. Cairo")!;
  expect(parseFloat(aswanAfter.style.top)).toBeGreaterThanOrEqual(56);
  expect(parseFloat(aswanAfter.style.top)).toBeLessThanOrEqual(500 - 56);
  expect(parseFloat(aswanAfter.style.left)).toBeGreaterThanOrEqual(56);
  expect(parseFloat(aswanAfter.style.left)).toBeLessThanOrEqual(800 - 56);
  expect(cairoAfter).not.toBeNull();

  const stableViewBox = viewBoxOf(container);
  rerender(<TourSatelliteMap destinations={destinationsPair} activeDestination={destinationsPair[1]} onSelect={() => {}} />);
  flushViewTimers();
  expect(viewBoxOf(container)).toEqual(stableViewBox);
});

it("renders northern imagery upward and agrees markers with the loaded layer", () => {
  const { container } = render(
    <TourSatelliteMap destinations={destinations} activeDestination={destinations[0]} onSelect={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();
  const svg = container.querySelector("svg")!;
  const [minX, viewBoxTop, viewBoxWidth, viewBoxHeight] = svg.getAttribute("viewBox")!.split(" ").map(Number);
  const image = expectSatelliteImage(container);
  expect(Number(image.getAttribute("x"))).toBeCloseTo(minX, 1);
  expect(Number(image.getAttribute("y"))).toBeCloseTo(viewBoxTop, 1);
  expect(Number(image.getAttribute("width"))).toBeCloseTo(viewBoxWidth, 1);
  expect(Number(image.getAttribute("height"))).toBeCloseTo(viewBoxHeight, 1);

  fireEvent.click(within(container).getByRole("button", { name: "Pan north" }));
  const [, raisedTop] = viewBoxOf(container);
  expect(raisedTop).toBeLessThan(viewBoxTop);
});

it("does not mount or request imagery while the modal is closed and releases its observer on unmount", () => {
  const closed = render(
    <TourDestinationsModal tour={tourStub} locale="en" destinations={destinations} open={false} onClose={() => {}} />,
  );
  expect(closed.container.innerHTML).toBe("");
  closed.unmount();
  expect(resizeObservers).toHaveLength(0);

  const opened = render(
    <TourDestinationsModal tour={tourStub} locale="en" destinations={destinations} open onClose={() => {}} />,
  );
  resizeViewport(800, 500);
  flushViewTimers();
  expect(resizeObservers).toHaveLength(1);
  expect(opened.container.querySelector("image")).not.toBeNull();

  opened.unmount();
  expect(resizeObservers).toHaveLength(0);
});
