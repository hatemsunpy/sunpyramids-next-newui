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
