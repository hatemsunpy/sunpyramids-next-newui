import { expect, it } from "vitest";
import { isTourDateAvailable } from "@/lib/tour-availability";
import type { Tour } from "@/types/api";

it("applies the Laravel tour calendar fields together while treating empty lists as unrestricted", () => {
  const tour = {
    calender_availability: {
      day_numbers: [12],
      day_names: [],
      month_names: ["march"],
      years: [2030],
    },
  } as Tour;

  expect(isTourDateAvailable(tour, "2030-03-12")).toBe(true);
  expect(isTourDateAvailable(tour, "2030-03-11")).toBe(false);
  expect(isTourDateAvailable(tour, "2030-04-12")).toBe(false);
  expect(isTourDateAvailable(tour, "2031-03-12")).toBe(false);
  expect(isTourDateAvailable({} as Tour, "2030-03-11")).toBe(true);

  tour.calender_availability!.day_names = ["monday"];
  expect(isTourDateAvailable(tour, "2030-03-12")).toBe(false);
  tour.calender_availability!.day_names = ["tuesday"];
  expect(isTourDateAvailable(tour, "2030-03-12")).toBe(true);
});
