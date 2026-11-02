import { afterEach, expect, it, } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MultiCountryCompare } from "./MultiCountryCompare";
import type { Tour } from "@/types/api";

afterEach(cleanup);

const tours: Tour[] = [
  { slug: "first-itinerary", title: "API first itinerary", duration: "7 days", type: "Private", run: "Daily" },
  { slug: "second-itinerary", title: "API second itinerary", duration: "12 days" },
];

it("omits unavailable comparisons rather than inventing facts", () => {
  const { container, rerender } = render(<MultiCountryCompare tours={[tours[0]]} locale="en" />);
  expect(container).toBeEmptyDOMElement();
  rerender(<MultiCountryCompare tours={[{ slug: "empty-one" }, { slug: "empty-two" }]} locale="en" />);
  expect(container).toBeEmptyDOMElement();
});

it("uses only populated API fields and keeps each tour's cells aligned with its header", () => {
  const { container } = render(<MultiCountryCompare tours={tours.map(({ run, ...tour }) => { void run; return tour; })} locale="en" />);
  expect(screen.queryByText("Departure schedule")).toBeNull();
  expect(screen.getByText("—")).toBeInTheDocument();
  const rows = container.querySelectorAll("tr");
  expect(Array.from(rows).every(row => row.children.length === 3)).toBe(true);
  expect(screen.getByText("Private")).toBeInTheDocument();
});

it("reflects API updates and treats supplied markup as text", () => {
  const { rerender, container } = render(<MultiCountryCompare tours={tours} locale="en" />);
  rerender(<MultiCountryCompare tours={[{ ...tours[0], title: "<img src=x onerror=alert(1)>", duration: "9 days" }, tours[1]]} locale="en" />);
  expect(screen.queryByText("7 days")).toBeNull();
  expect(screen.getByText("9 days")).toBeInTheDocument();
  expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
  expect(container.querySelector("img")).toBeNull();
});

it("uses localized encoded tour URLs and limits comparison to three selected itineraries", () => {
  render(<MultiCountryCompare tours={[...tours, { slug: "a & b", duration: "3 days" }, { slug: "fourth", duration: "4 days" }, { slug: "fifth", duration: "5 days" }]} locale="fr" />);
  const links = screen.getAllByText("Voir l’itinéraire");
  expect(links).toHaveLength(3);
  expect(links[0]).toHaveAttribute("href", "/fr/tour/first-itinerary");
  expect(links[2]).toHaveAttribute("href", "/fr/tour/a%20%26%20b");
  expect(screen.queryByText("fifth")).toBeNull();
});
