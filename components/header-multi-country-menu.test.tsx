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
