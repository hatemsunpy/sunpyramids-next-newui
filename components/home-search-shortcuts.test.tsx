import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HomeSearchShortcuts } from "@/components/HomeSearchShortcuts";
import type { ApiPage } from "@/types/api";

// Offline D2 verification: typed Find Trip must generate /trips URLs using
// the corrected `destination` parameter (never the legacy typo `distination`).
// Uses fireEvent from the approved @testing-library/react dependency only.

const destinations: ApiPage[] = [
  { id: 11, title: "Cairo Tours", slug: "cairo" },
  { id: 12, title: "Luxor Tours", slug: "luxor" },
  { id: 13, title: "Aswan Tours", slug: "aswan" },
];

const pushes: string[] = [];
const routerPush = vi.fn((url: string) => pushes.push(url));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

beforeEach(() => {
  pushes.length = 0;
  routerPush.mockClear();
});

afterEach(() => {
  cleanup();
});

function renderFindTrip() {
  render(<HomeSearchShortcuts locale="en" destinations={destinations} />);
  fireEvent.click(screen.getByRole("tab", { name: /find trip/i }));
}

function selectByName(label: RegExp, value: string) {
  const select = screen.getByRole("combobox", { name: label }) as HTMLSelectElement;
  fireEvent.change(select, { target: { value } });
}

describe("D2 — Find Trip submit generates corrected destination param", () => {
  it("typed destination=aswan + duration 5 → /trips?days=5&destination=aswan (never distination)", () => {
    renderFindTrip();
    selectByName(/where\?/i, "aswan");
    selectByName(/how long\?/i, "5");
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(pushes).toHaveLength(1);
    expect(pushes[0]).toContain("/trips?");
    expect(pushes[0]).toContain("days=5");
    expect(pushes[0]).toContain("destination=aswan");
    expect(pushes[0]).not.toContain("distination");
    expect(pushes[0]).not.toContain("main=");
  });

  it("typed destination + duration 1 → corrected param for all durations", () => {
    renderFindTrip();
    selectByName(/where\?/i, "luxor");
    selectByName(/how long\?/i, "1");
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(pushes[0]).toContain("days=1");
    expect(pushes[0]).toContain("destination=luxor");
    expect(pushes[0]).not.toContain("distination");
  });

  it("locale routing preserved: pushes withLocale /trips path (en root → /trips)", () => {
    renderFindTrip();
    selectByName(/where\?/i, "cairo");
    selectByName(/how long\?/i, "7");
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(pushes[0]).toMatch(/^\/trips\?/);
  });

  it("controlled selects preserve empty defaults, required validation, options and FormData", () => {
    renderFindTrip();
    const place = screen.getByRole("combobox", { name: /where\?/i }) as HTMLSelectElement;
    const duration = screen.getByRole("combobox", { name: /how long\?/i }) as HTMLSelectElement;
    const form = place.form!;
    expect(place.value).toBe(""); expect(duration.value).toBe("");
    expect(place.required).toBe(true); expect(duration.required).toBe(true);
    expect([...place.options].map((option) => option.value)).toEqual(["", "cairo", "luxor", "aswan"]);
    expect([...duration.options].map((option) => option.value)).toEqual(["", ...Array.from({ length: 45 }, (_, index) => String(index + 1))]);
    fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
    expect(pushes).toHaveLength(0);
    selectByName(/where\?/i, "aswan");
    fireEvent.click(screen.getByRole("button", { name: "Search", exact: true }));
    expect(pushes).toHaveLength(0);
    selectByName(/how long\?/i, "45");
    expect(Object.fromEntries(new FormData(form))).toEqual({ place: "aswan", duration: "45" });
    fireEvent.click(screen.getByRole("tab", { name: /make your trip/i }));
    fireEvent.click(screen.getByRole("tab", { name: /find trip/i }));
    expect(screen.getByRole("combobox", { name: /where\?/i })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: /how long\?/i })).toHaveValue("");
  });

  it("French traditional Find Trip retains locale-aware routing with no Voice constraint", () => {
    const ui = render(<HomeSearchShortcuts locale="fr" destinations={destinations} modeOnly="find" />);
    const place = ui.container.querySelector<HTMLSelectElement>('select[name="place"]')!;
    fireEvent.change(place, { target: { value: "aswan" } });
    fireEvent.change(ui.container.querySelector('select[name="duration"]')!, { target: { value: "5" } });
    fireEvent.click(ui.container.querySelector<HTMLButtonElement>('button[type="submit"]')!);
    expect(pushes).toEqual(["/fr/trips?days=5&destination=aswan"]);
  });

  it("traditional destination options retain the existing ID fallback when no slug exists", () => {
    const ui = render(<HomeSearchShortcuts destinations={[{ id: 108, title: "Fixture destination without a slug" }]} modeOnly="find" />);
    fireEvent.change(ui.container.querySelector('select[name="place"]')!, { target: { value: "108" } });
    fireEvent.change(ui.container.querySelector('select[name="duration"]')!, { target: { value: "5" } });
    expect(Object.fromEntries(new FormData(ui.container.querySelector('form')!))).toEqual({ place: "108", duration: "5" });
    fireEvent.click(ui.container.querySelector<HTMLButtonElement>('button[type="submit"]')!);
    expect(pushes).toEqual(["/trips?days=5&destination=108"]);
  });
});

describe("Make Your Trip approximate month picker", () => {
  it("uses the shared datepicker UI and preserves the YYYY-MM query contract", () => {
    const ui = render(<HomeSearchShortcuts locale="en" destinations={destinations} />);
    fireEvent.click(screen.getByRole("radio", { name: /approximate time/i }));

    const monthInput = screen.getByPlaceholderText(/expected month/i);
    expect(monthInput).toHaveAttribute("type", "text");

    fireEvent.click(monthInput);
    const currentYear = new Date().getFullYear();
    const selectedYear = currentYear + 1;
    fireEvent.click(screen.getByRole("button", { name: String(currentYear) }));
    fireEvent.click(screen.getByRole("button", { name: String(selectedYear) }));
    fireEvent.click(screen.getByRole("button", { name: `October ${selectedYear}` }));

    expect(ui.container.querySelector<HTMLInputElement>('input[name="month"]')).toHaveValue(`${selectedYear}-10`);
    fireEvent.click(screen.getByRole("button", { name: /make trip/i }));
    expect(pushes).toEqual([`/make-your-trip?type=approximateTime&month=${selectedYear}-10`]);
  });

  it("selecting This month resets both month and year after browsing another year", () => {
    const ui = render(<HomeSearchShortcuts locale="en" destinations={destinations} />);
    fireEvent.click(screen.getByRole("radio", { name: /approximate time/i }));
    fireEvent.click(screen.getByPlaceholderText(/expected month/i));

    const today = new Date();
    fireEvent.click(screen.getByRole("button", { name: String(today.getFullYear()) }));
    fireEvent.click(screen.getByRole("button", { name: String(today.getFullYear() + 1) }));
    fireEvent.click(screen.getByRole("button", { name: /this month/i }));

    const expectedMonth = String(today.getMonth() + 1).padStart(2, "0");
    expect(ui.container.querySelector<HTMLInputElement>('input[name="month"]')).toHaveValue(`${today.getFullYear()}-${expectedMonth}`);
  });
});
