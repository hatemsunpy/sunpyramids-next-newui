// @vitest-environment node
import { describe, expect, it } from "vitest";
import { removeItinerarySeparators } from "@/lib/event-itinerary-html";

const itinerary = (content: string) => `<table data-sheets-root="1"><tbody><tr><td>${content}</td></tr></tbody></table>`;

describe("removeItinerarySeparators", () => {
  it.each(["____________", "------------", "............", "&#95;".repeat(12)])(
    "removes decorative separator %s and its surrounding line breaks",
    (separator) => {
      const content = `Arrival details.<br><br>${separator}<br><br><a href="/tour/cairo_trip">See the tour</a>`;
      expect(removeItinerarySeparators(itinerary(content))).toBe(
        itinerary('Arrival details.<br><a href="/tour/cairo_trip">See the tour</a>'),
      );
    },
  );

  it("preserves actual prose, prices, links and attributes byte for byte", () => {
    const html = itinerary('<p id="day_1">Day 1 – Arrival: $210. Wait...</p><a href="/tour/a________b">A private tour</a>');
    expect(removeItinerarySeparators(html)).toBe(html);
  });

  it("keeps separators outside the imported itinerary table", () => {
    const html = `<p>____________</p><table><tr><td>____________</td></tr></table>`;
    expect(removeItinerarySeparators(html)).toBe(html);
  });

  it("merges adjoining separator removals without deleting nearby content", () => {
    expect(removeItinerarySeparators(itinerary('Start<br>________<br>--------<br>End'))).toBe(
      itinerary("Start<br>End"),
    );
  });
});
