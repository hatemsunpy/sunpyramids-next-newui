import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MultiCountrySubcategoryIntro } from "./MultiCountrySubcategoryIntro";
import { MultiCountryPlaces } from "./MultiCountryPlaces";
import type { Tour } from "@/types/api";

afterEach(cleanup);

it("reflects dashboard changes without inventing collection-wide duration facts", () => {
  const { container, rerender } = render(<MultiCountrySubcategoryIntro
    page={{ title: "Current collection", banner: "/images/old.webp", phone_banner: "/images/mobile.webp" }}
    locale="fr" total={28} tours={[{ duration_in_days: 7 }, { duration_in_days: "14" }]}
  />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Current collection");
  expect(container.querySelector(".mc-dossier-facts")).toHaveTextContent("7–14");
  expect(container.querySelector(".mc-dossier-facts")).toHaveTextContent("Durées sur cette page");
  expect(screen.getByRole("link", { name: "Créer votre voyage" })).toHaveAttribute("href", "/fr/make-your-trip");
  expect(container.querySelector("picture source")).toHaveAttribute("srcSet", "/images/mobile.webp");

  rerender(<MultiCountrySubcategoryIntro page={{ title: "Updated collection" }} locale="fr" total={0} tours={[{ duration_in_days: 0 }]} />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Updated collection");
  expect(container.querySelector(".mc-dossier-facts")).toBeNull();
  expect(container.querySelector(".mc-dossier-photo")).toBeNull();
  expect(screen.queryByRole("link", { name: "Lieux à découvrir" })).toBeNull();
});

it("shows only API destinations with unique photos and drops removed places", () => {
  const tours: Tour[] = [{ destinations: [
    { slug: "one", title: "Current API place", featured_image: "/one.webp" },
    { slug: "one", title: "Duplicate place", featured_image: "/two.webp" },
    { slug: "other", title: "Duplicate photo", featured_image: "/one.webp" },
    { slug: "disabled", title: "Disabled place", enabled: false, featured_image: "/three.webp" },
    { slug: "no-photo", title: "No photo" },
  ] }];
  const { rerender, container } = render(<MultiCountryPlaces tours={tours} locale="en" />);
  expect(screen.getByRole("heading", { name: "Current API place" })).toBeDefined();
  expect(screen.getAllByRole("img")).toHaveLength(1);
  expect(screen.queryByText("Duplicate photo")).toBeNull();
  expect(screen.queryByText("Disabled place")).toBeNull();
  rerender(<MultiCountryPlaces tours={[]} locale="en" />);
  expect(container).toBeEmptyDOMElement();
});
