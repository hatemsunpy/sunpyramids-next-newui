import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TourPageNavigation } from "./TourPageNavigation";

afterEach(() => {
  cleanup();
  document.querySelectorAll("section[data-test-section]").forEach(section => section.remove());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it.each([false, true])("reveals the active tab in both directions (reduced motion: %s)", reducedMotion => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: reducedMotion }));
  const ids = ["overview", "highlights", "itinerary", "included"];
  const sectionTops: Record<string, number> = { overview: 300, highlights: 600, itinerary: 900, included: 1200 };
  ids.forEach(id => {
    const section = document.createElement("section");
    section.id = id;
    section.dataset.testSection = "";
    document.body.appendChild(section);
    vi.spyOn(section, "getBoundingClientRect").mockImplementation(() => ({ top: sectionTops[id] }) as DOMRect);
  });
  const ui = render(<TourPageNavigation hasOverview hasHighlights hasItinerary hasInclusions hasAddOns={false} hasPrices={false} hasRelated={false} />);
  const rail = ui.container.querySelector<HTMLDivElement>(".tour-page-nav-scroll")!;
  // jsdom has no layout or scrolling; supply the browser geometry boundary.
  Object.defineProperties(rail, { clientWidth: { value: 300 }, scrollWidth: { value: 400 } });
  vi.spyOn(rail, "getBoundingClientRect").mockReturnValue({ left: 0, right: 300 } as DOMRect);
  let scrollBehavior: ScrollBehavior | undefined;
  rail.scrollBy = ((options: ScrollToOptions) => {
    scrollBehavior = options.behavior;
    rail.scrollLeft = Math.max(0, Math.min(100, rail.scrollLeft + (options.left || 0)));
  }) as typeof rail.scrollBy;
  screen.getAllByRole("link").forEach((link, index) => {
    vi.spyOn(link, "getBoundingClientRect").mockImplementation(() => ({
      left: index * 100 - rail.scrollLeft, right: (index + 1) * 100 - rail.scrollLeft,
    }) as DOMRect);
  });
  act(() => vi.advanceTimersByTime(20));
  expect(rail.scrollLeft).toBe(0);

  ids.forEach((id, index) => { sectionTops[id] = (index - 3) * 300; });
  act(() => { fireEvent.scroll(window); vi.advanceTimersByTime(20); });
  const included = screen.getByRole("link", { name: "Included" });
  expect(included).toHaveAttribute("aria-current", "location");
  expect(rail.scrollLeft).toBeGreaterThan(0);
  expect(included.getBoundingClientRect().right).toBeLessThanOrEqual(300);
  expect(scrollBehavior).toBe(reducedMotion ? "auto" : "smooth");

  ids.forEach((id, index) => { sectionTops[id] = index * 300; });
  act(() => { fireEvent.scroll(window); vi.advanceTimersByTime(20); });
  const overview = screen.getByRole("link", { name: "Overview" });
  expect(overview).toHaveAttribute("aria-current", "location");
  expect(overview.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
});
