import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TourItineraryDisclosure } from "@/components/tour/TourItineraryDisclosure";

afterEach(cleanup);

it("keeps every day heading visible when collapsing details and can expand them again", () => {
  const { container } = render(
    <TourItineraryDisclosure>
      <details open><summary>Day 1: Cairo</summary><p>Arrival in Cairo.</p></details>
      <details open><summary>Day 2: Giza</summary><p>Visit the pyramids.</p></details>
    </TourItineraryDisclosure>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Collapse all day details" }));
  expect(screen.getByText("Day 1: Cairo")).toBeVisible();
  expect(screen.getByText("Day 2: Giza")).toBeVisible();
  expect(screen.getByText("Arrival in Cairo.")).not.toBeVisible();
  expect(screen.getByText("Visit the pyramids.")).not.toBeVisible();
  expect(container.querySelectorAll("details")).toHaveLength(2);

  fireEvent.click(screen.getByRole("button", { name: "Expand all day details" }));
  expect(screen.getByText("Arrival in Cairo.")).toBeVisible();
  expect(screen.getByText("Visit the pyramids.")).toBeVisible();
});
