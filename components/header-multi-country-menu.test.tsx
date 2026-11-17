import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { Header } from "@/components/Header";

let pathname = "/fr/egypt-tours/new-api-combination";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

beforeEach(() => {
  pathname = "/fr/egypt-tours/new-api-combination";
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: [] })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("recognizes new API children on direct locale routes and targets the child preview", () => {
  const { container } = render(<Header locale="fr"
    categories={[{ slug: "middle-east-tours", title: "API root" }]}
    multiCountryChildren={[{ slug: "new-api-combination", title: "API child", label: "API child" }]}
  />);
  fireEvent.click(container.querySelector('.dropdown > button')!);
  const current = container.querySelector('.dropdown-child-link[aria-current="page"]');
  expect(current).toHaveAttribute("href", "/fr/egypt-tours/new-api-combination");
  expect(container.querySelector('.dropdown-link-item--active')).toHaveAttribute("href", "/fr/egypt-tours/middle-east-tours");
  expect(container.querySelector('.dropdown-preview-card')).toHaveAttribute("href", "/fr/egypt-tours/new-api-combination");
  fireEvent.click(container.querySelector('.menu-toggle') ?? container.querySelector('button[aria-controls="mobile-navigation"]')!);
  const mobileChild = container.querySelector('#mobile-navigation a[href="/fr/egypt-tours/new-api-combination"]');
  expect(mobileChild).toHaveAttribute("aria-current", "page");
});

it("keeps the API parent navigable without children and hides it when the API parent is absent", () => {
  pathname = "/";
  const first = render(<Header categories={[{ slug: "middle-east-tours", title: "API root" }]} />);
  expect(first.container.querySelector('.dropdown-link-item[href="/egypt-tours/middle-east-tours"]')).not.toBeNull();
  first.unmount();
  const second = render(<Header />);
  expect(second.container.querySelector('.dropdown-link-item[href="/egypt-tours/middle-east-tours"]')).toBeNull();
});

it("shows Destinations after Egypt Tours and reuses the localized country routes", () => {
  pathname = "/fr/destinations/jordan-tours";
  const { container, getByRole } = render(<Header locale="fr" />);
  const destinations = getByRole("button", { name: "Destinations" });
  expect(destinations.parentElement?.previousElementSibling?.querySelector("button")).toHaveTextContent("Tours en Égypte");

  fireEvent.keyDown(destinations, { key: "ArrowDown" });
  const desktopItems = container.querySelectorAll('.destination-dropdown-panel [role="menuitem"]');
  expect(desktopItems).toHaveLength(7);
  expect(container.querySelector('.destination-dropdown-panel [href="/fr/destinations"]')).toBeNull();
  expect(getByRole("menuitem", { name: "Égypte" })).toHaveFocus();
  expect(getByRole("menuitem", { name: "Égypte" })).toHaveAttribute("href", "/fr/destinations/egypt-tours");
  expect(getByRole("menuitem", { name: "Jordanie" })).toHaveAttribute("href", "/fr/destinations/jordan-tours");
  expect(getByRole("menuitem", { name: "Jordanie" })).toHaveAttribute("aria-current", "page");
  expect(getByRole("menuitem", { name: "Turquie" })).toHaveAttribute("href", "/fr/trips?destination=turkey");

  fireEvent.click(getByRole("button", { name: "Open menu" }));
  const mobileGroups = container.querySelectorAll(".mobile-links > details");
  expect(mobileGroups[0]?.querySelector("summary")).toHaveTextContent("Tours en Égypte");
  expect(mobileGroups[1]?.querySelector("summary")).toHaveTextContent("Destinations");
  expect(mobileGroups[1]?.querySelectorAll("a")).toHaveLength(7);
  expect(mobileGroups[1]?.querySelector('a[href="/fr/destinations"]')).toBeNull();
  expect(mobileGroups[1]?.querySelector('a[href="/fr/destinations/egypt-tours"]')).toHaveTextContent("Égypte");
  expect(mobileGroups[1]?.querySelector('a[aria-current="page"]')).toHaveAttribute("href", "/fr/destinations/jordan-tours");
});

it("opens Destinations on mouse hover and follows the hovered country's preview", () => {
  pathname = "/";
  const { container, getByRole } = render(<Header />);
  const destinations = getByRole("button", { name: "Destinations" });

  fireEvent.pointerOver(destinations, { pointerType: "mouse" });
  expect(destinations).toHaveAttribute("aria-expanded", "true");
  expect(container.querySelector(".destination-dropdown-panel .dropdown-preview-title")).toHaveTextContent("Egypt");
  expect(container.querySelector(".destination-dropdown-panel .dropdown-preview-card")).toHaveAttribute("href", "/destinations/egypt-tours");

  fireEvent.pointerOver(getByRole("menuitem", { name: "Greece" }), { pointerType: "mouse" });
  expect(container.querySelector(".destination-dropdown-panel .dropdown-preview-title")).toHaveTextContent("Greece");
  expect(container.querySelector(".destination-dropdown-panel .dropdown-preview-card")).toHaveAttribute("href", "/trips?destination=greece");
  expect(container.querySelector(".destination-dropdown-panel .dropdown-preview-img")?.getAttribute("src")).toContain("greece.webp");
});
