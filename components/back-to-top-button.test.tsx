import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BackToTopButton } from "@/components/BackToTopButton";

function setScrollMetrics({ scrollY, scrollHeight, innerHeight }: { scrollY: number; scrollHeight: number; innerHeight: number }) {
  Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true, writable: true });
  Object.defineProperty(window, "innerHeight", { value: innerHeight, configurable: true, writable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", { value: scrollHeight, configurable: true });
}

beforeEach(() => {
  setScrollMetrics({ scrollY: 0, scrollHeight: 2000, innerHeight: 1000 });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  window.scrollTo = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("stays hidden near the top and fills the progress ring as the user scrolls", () => {
  render(<BackToTopButton label="Back to top" />);

  const button = screen.getByRole("button", { hidden: true });
  const ring = button.querySelector(".back-to-top-ring-progress");
  const circumference = 2 * Math.PI * 20;

  expect(button).toHaveAttribute("aria-label", "Back to top");
  expect(button).not.toHaveClass("is-visible");
  expect(button).toHaveAttribute("aria-hidden", "true");
  expect(button).toHaveAttribute("tabindex", "-1");
  expect(Number(ring?.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference, 2);

  act(() => {
    setScrollMetrics({ scrollY: 500, scrollHeight: 2000, innerHeight: 1000 });
    window.dispatchEvent(new Event("scroll"));
  });

  expect(button).toHaveClass("is-visible");
  expect(button).toHaveAttribute("aria-hidden", "false");
  expect(button).toHaveAttribute("tabindex", "0");
  expect(Number(ring?.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference * 0.5, 2);

  act(() => {
    setScrollMetrics({ scrollY: 1000, scrollHeight: 2000, innerHeight: 1000 });
    window.dispatchEvent(new Event("scroll"));
  });

  expect(Number(ring?.getAttribute("stroke-dashoffset"))).toBeCloseTo(0, 2);
});

it("scrolls smoothly to top on click, or immediately when reduced motion is enabled", () => {
  setScrollMetrics({ scrollY: 500, scrollHeight: 2000, innerHeight: 1000 });
  render(<BackToTopButton label="Volver arriba" />);

  const button = screen.getByRole("button", { name: "Volver arriba" });
  fireEvent.click(button);
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  fireEvent.click(button);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "auto" });
});
