import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NavigationLoadingBar } from "@/components/NavigationLoadingBar";
import { useProgressRouter } from "@/components/useProgressRouter";

const route = vi.hoisted(() => ({ pathname: "/sustainability", query: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.query),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  route.pathname = "/sustainability";
  route.query = "";
  window.history.replaceState(null, "", "/sustainability");
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

function settle() { act(() => vi.advanceTimersByTime(300)); }

it("keeps the bar pending through a slow link navigation and hides it after the route commits", () => {
  const ui = render(<><NavigationLoadingBar /><a href="/accessible-travel">Accessible Travel</a></>);
  settle();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  // Prevent jsdom's unsupported full-document navigation at the browser boundary.
  screen.getByRole("link").addEventListener("click", (event) => event.preventDefault());
  fireEvent.click(screen.getByRole("link"));
  act(() => vi.advanceTimersByTime(15_000));
  expect(screen.getByRole("progressbar")).toHaveAttribute("data-state", "loading");
  route.pathname = "/accessible-travel";
  ui.rerender(<><NavigationLoadingBar /><a href="/accessible-travel">Accessible Travel</a></>);
  settle();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});

it.each([
  ["https://example.com/trips", {}],
  ["#sustainability-help-title", {}],
  ["/sustainability", {}],
  ["/trips", { target: "_blank" }],
  ["/trips", { download: "trips.pdf" }],
  ["mailto:info@sunpyramidstours.com", {}],
])("does not show loading for a non-page navigation to %s (%j)", (href, attributes) => {
  render(<><NavigationLoadingBar /><a href={href} {...attributes}>Destination</a></>);
  settle();
  screen.getByRole("link").addEventListener("click", (event) => event.preventDefault());
  fireEvent.click(screen.getByRole("link"));
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});

function SearchNavigation() {
  const router = useProgressRouter();
  return <button onClick={() => router.replace("/sustainability?sort=price", { scroll: false })}>Sort</button>;
}

it("shows loading for programmatic query changes and cancels the previous completion timer", () => {
  const ui = render(<><NavigationLoadingBar /><SearchNavigation /></>);
  // Initial completion is still fading when another navigation begins.
  fireEvent.click(screen.getByRole("button", { name: "Sort" }));
  settle();
  expect(screen.getByRole("progressbar")).toHaveAttribute("data-state", "loading");
  route.query = "sort=price";
  ui.rerender(<><NavigationLoadingBar /><SearchNavigation /></>);
  settle();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});
