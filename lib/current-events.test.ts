import { expect, it } from "vitest";
import { currentEvents } from "@/lib/current-events";

it("excludes past events and sorts today/future events before undated records", () => {
  const events = [
    { slug: "future", date: "2030-01-03T00:00:00.000000Z" },
    { slug: "past", date: "2030-01-01" },
    { slug: "today", date: "2030-01-02" },
    { slug: "undated" },
    { slug: "invalid", date: "unknown" },
  ];
  const result = currentEvents(events, new Date("2030-01-02T12:00:00Z"));
  expect(result).toEqual([events[2], events[0], events[3], events[4]]);
  expect(result[0]).toBe(events[2]);
  expect(events).toHaveLength(5);
});

it("sorts multiple future dates chronologically, preserves ties, and leaves the input order intact", () => {
  const later = { slug: "later", date: "2030-01-05" };
  const earlier = { slug: "earlier", date: "2030-01-03" };
  const sameDay = { slug: "same-day", date: "2030-01-03T00:00:00.000000Z" };
  const events = [later, earlier, sameDay];
  expect(currentEvents(events, new Date("2030-01-02T12:00:00Z"))).toEqual([earlier, sameDay, later]);
  expect(events).toEqual([later, earlier, sameDay]);
});

it("changes visibility at Cairo midnight rather than UTC midnight", () => {
  const events = [{ date: "2030-01-01" }, { date: "2030-01-02" }];
  expect(currentEvents(events, new Date("2030-01-01T21:59:59Z"))).toEqual(events);
  expect(currentEvents(events, new Date("2030-01-01T22:00:00Z"))).toEqual([events[1]]);
});
