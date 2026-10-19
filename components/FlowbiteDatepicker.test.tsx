import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FlowbiteDatepicker } from "@/components/FlowbiteDatepicker";

afterEach(cleanup);

it("prevents selecting unavailable tour dates while allowing an available date", () => {
  const onChange = vi.fn();
  const { container } = render(
    <FlowbiteDatepicker
      value="2030-03-01"
      onChange={onChange}
      isDateAvailable={(day) => day === "2030-03-12"}
    />,
  );

  fireEvent.click(container.querySelector(".flowbite-datepicker-native-input")!);
  const currentMonthDays = Array.from(container.querySelectorAll<HTMLButtonElement>(
    ".flowbite-datepicker-grid .flowbite-datepicker-cell:not(.is-other-month)",
  ));
  const unavailable = currentMonthDays.find((day) => day.textContent === "11")!;
  const available = currentMonthDays.find((day) => day.textContent === "12")!;

  expect(unavailable).toBeDisabled();
  expect(available).toBeEnabled();
  fireEvent.click(unavailable);
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(available);
  expect(onChange).toHaveBeenCalledWith("2030-03-12");
});

it("does not evaluate the 42-day grid availability while closed, then renders fresh dates on open", () => {
  const isDateAvailable = vi.fn((day: string) => day === "2030-03-12");
  const { container } = render(
    <FlowbiteDatepicker
      value="2030-03-01"
      isDateAvailable={isDateAvailable}
    />,
  );

  // Closed: no day grid is rendered and no synthetic grid date was evaluated.
  // The existing Today-button rule may still evaluate today's date once.
  expect(container.querySelector(".flowbite-datepicker-grid")).toBeNull();
  for (const [arg] of isDateAvailable.mock.calls) {
    expect(arg).not.toMatch(/^2030-03-/);
  }
  expect(isDateAvailable).not.toHaveBeenCalledWith("2030-03-12");
  expect(isDateAvailable).not.toHaveBeenCalledWith("2030-03-11");

  fireEvent.click(container.querySelector(".flowbite-datepicker-native-input")!);

  // Open: the grid evaluates availability and renders current states.
  expect(isDateAvailable).toHaveBeenCalledWith("2030-03-12");
  const currentMonthDays = Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      ".flowbite-datepicker-grid .flowbite-datepicker-cell:not(.is-other-month)",
    ),
  );
  const unavailable = currentMonthDays.find((day) => day.textContent === "11")!;
  const available = currentMonthDays.find((day) => day.textContent === "12")!;
  expect(unavailable).toBeDisabled();
  expect(available).toBeEnabled();

  // The decade window still renders its 12 years while open.
  fireEvent.click(container.querySelector(".flowbite-datepicker-title-btn")!);
  fireEvent.click(container.querySelector(".flowbite-datepicker-title-btn")!);
  expect(
    container.querySelectorAll(".flowbite-datepicker-year-cell"),
  ).toHaveLength(12);
});

it("reopens with current availability and keeps the same selected date after availability changes while closed", () => {
  const { container, rerender } = render(
    <FlowbiteDatepicker
      value="2030-03-01"
      isDateAvailable={(day) => day === "2030-03-12"}
    />,
  );
  const input = () =>
    container.querySelector(".flowbite-datepicker-native-input")!;
  const currentMonthDay = (label: string) =>
    Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        ".flowbite-datepicker-grid .flowbite-datepicker-cell:not(.is-other-month)",
      ),
    ).find((day) => day.textContent === label)!;
  const selectedLabel = () =>
    container.querySelector(
      ".flowbite-datepicker-grid .flowbite-datepicker-cell.is-selected",
    )?.textContent;

  fireEvent.click(input());
  expect(currentMonthDay("12")).toBeEnabled();
  expect(selectedLabel()).toBe("1");

  // Close while the old availability is still active.
  fireEvent.click(input());

  rerender(
    <FlowbiteDatepicker
      value="2030-03-01"
      isDateAvailable={(day) => day === "2030-03-13"}
    />,
  );
  fireEvent.click(input());

  expect(currentMonthDay("12")).toBeDisabled();
  expect(currentMonthDay("13")).toBeEnabled();
  expect(selectedLabel()).toBe("1");
});

it("reopens with the updated selected date after value changes while closed", () => {
  const isDateAvailable = (day: string) =>
    day === "2030-03-01" ||
    day === "2030-03-12" ||
    day === "2030-03-15";
  const { container, rerender } = render(
    <FlowbiteDatepicker
      value="2030-03-01"
      isDateAvailable={isDateAvailable}
    />,
  );
  const input = () =>
    container.querySelector(".flowbite-datepicker-native-input")!;
  const currentMonthDay = (label: string) =>
    Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        ".flowbite-datepicker-grid .flowbite-datepicker-cell:not(.is-other-month)",
      ),
    ).find((day) => day.textContent === label)!;
  const selectedLabel = () =>
    container.querySelector(
      ".flowbite-datepicker-grid .flowbite-datepicker-cell.is-selected",
    )?.textContent;

  fireEvent.click(input());
  expect(selectedLabel()).toBe("1");
  expect(currentMonthDay("12")).toBeEnabled();

  // Close, change the controlled value, then reopen.
  fireEvent.click(input());

  rerender(
    <FlowbiteDatepicker
      value="2030-03-15"
      isDateAvailable={isDateAvailable}
    />,
  );
  fireEvent.click(input());

  expect(selectedLabel()).toBe("15");
  expect(currentMonthDay("12")).toBeEnabled();
  expect(currentMonthDay("15")).toBeEnabled();
});
