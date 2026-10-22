import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { OfferCountdown } from "@/components/OfferCountdown";

// Fake-clock test calendar: "now" is 2030-03-12T12:00:00Z, and every fake
// deadline below is expressed with an absolute UTC offset so the assertions
// hold in any runtime timezone.
const NOW = "2030-03-12T12:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function showTimer() {
  act(() => {
    vi.advanceTimersByTime(1);
  });
}

function countdownValues() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(".offer-countdown-value"),
  ).map((node) => node.textContent);
}

function countdownLabels() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(".offer-countdown-label"),
  ).map((node) => node.textContent);
}

describe("OfferCountdown", () => {
  it("renders a days/hours/minutes/seconds breakdown for a deadline more than 24h away", () => {
    render(<OfferCountdown endDate="2030-03-15T15:04:06.000Z" />);
    showTimer();
    expect(countdownValues()).toEqual(["03", "03", "04", "06"]);
    expect(countdownLabels()).toEqual(["Days", "Hours", "Minutes", "Seconds"]);
  });

  it("ticks down once per second through the interval timer", () => {
    render(<OfferCountdown endDate="2030-03-12T12:01:00.000Z" />);
    showTimer();
    expect(countdownValues()).toEqual(["00", "00", "01", "00"]);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(countdownValues()).toEqual(["00", "00", "00", "59"]);
  });

  it.each([
    ["2030-03-12T15:00:00+02:00", "01"],
    ["2030-03-12T16:00:00-05:00", "09"],
  ])("honors the ISO timezone offset in %s", (endDate, hours) => {
    render(<OfferCountdown endDate={endDate} />);
    showTimer();
    expect(countdownValues()).toEqual(["00", hours, "00", "00"]);
  });

  it.each([
    ["missing string", ""],
    ["unparseable string", "offered-forever"],
    ["already expired deadline", "2030-03-12T11:59:59.999Z"],
  ])("renders nothing for a %s", (_description, endDate) => {
    const { container } = render(<OfferCountdown endDate={endDate} />);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("disappears when the deadline is reached while mounted", () => {
    const { container } = render(
      <OfferCountdown endDate="2030-03-12T12:00:05.000Z" />,
    );
    showTimer();
    expect(countdownValues()).toEqual(["00", "00", "00", "05"]);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("restarts the countdown when endDate changes while mounted", () => {
    const { rerender, container } = render(
      <OfferCountdown endDate="2030-03-30T15:00:00.000Z" />,
    );
    showTimer();
    expect(countdownValues()).toEqual(["18", "03", "00", "00"]);
    rerender(<OfferCountdown endDate="2030-03-12T12:00:10.000Z" />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("stops its timers once unmounted", () => {
    const nowSpy = vi.spyOn(Date, "now");
    const { unmount } = render(
      <OfferCountdown endDate="2030-03-20T12:00:00.000Z" />,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    nowSpy.mockClear();
    unmount();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(nowSpy).not.toHaveBeenCalled();
    nowSpy.mockRestore();
  });

  it.each(["", "invalid-date", "2030-03-01T00:00:00Z"])(
    "removes the previous countdown immediately when the new deadline is %s",
    (endDate) => {
      const { container, rerender } = render(
        <OfferCountdown endDate="2030-03-20T12:00:00Z" />,
      );
      showTimer();
      expect(countdownValues()).toHaveLength(4);
      rerender(<OfferCountdown endDate={endDate} />);
      expect(container).toBeEmptyDOMElement();
      act(() => vi.advanceTimersByTime(2000));
      expect(container).toBeEmptyDOMElement();
    },
  );

  it("uses the card locale for countdown labels", () => {
    render(<OfferCountdown endDate="2030-03-13T12:00:30.000Z" locale="fr" />);
    showTimer();
    expect(countdownLabels()).toEqual(["Jours", "Heures", "Minutes", "Secondes"]);
    expect(countdownValues()).toEqual(["01", "00", "00", "30"]);
  });
});
