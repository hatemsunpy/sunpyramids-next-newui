import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SearchSelectDropdown, type SelectOption } from "@/components/SearchSelectDropdown";

const baseOptions: SelectOption[] = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "EG", label: "Egypt" },
];

afterEach(() => {
  cleanup();
});

function renderSelect(options: SelectOption[], onChange?: (value: string) => void) {
  return render(
    <form data-testid="form">
      <SearchSelectDropdown
        name="nationality"
        options={options}
        onChange={onChange}
        placeholder="Nationality"
        required
      />
    </form>
  );
}

describe("SearchSelectDropdown", () => {
  it("reflects live option changes before the first open and syncs the native select", () => {
    const onChange = vi.fn();
    const ui = renderSelect(baseOptions.filter((opt) => opt.value !== "AL"), onChange);

    // Options changed while the menu was still closed (e.g. API response arrived).
    ui.rerender(
      <form data-testid="form">
        <SearchSelectDropdown
          name="nationality"
          options={baseOptions}
          onChange={onChange}
          placeholder="Nationality"
          required
        />
      </form>
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Nationality" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(screen.getByRole("menuitem", { name: /Albania/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Egypt/ })).toBeInTheDocument();

    // Options changed again while the menu stays open appear immediately.
    ui.rerender(
      <form data-testid="form">
        <SearchSelectDropdown
          name="nationality"
          options={[...baseOptions, { value: "CL", label: "Chile" }]}
          onChange={onChange}
          placeholder="Nationality"
          required
        />
      </form>
    );
    expect(screen.getByRole("menuitem", { name: /Chile/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: /Albania/ }));
    expect(onChange).toHaveBeenCalledWith("AL");

    const nativeSelect = ui.container.querySelector<HTMLSelectElement>("select[name='nationality']")!;
    expect(nativeSelect.value).toBe("AL");
    expect(new FormData(ui.container.querySelector<HTMLFormElement>("[data-testid='form']")!).get("nationality")).toBe("AL");
  });

  it("supports keyboard open, focus, and selection", async () => {
    const onChange = vi.fn();
    renderSelect(baseOptions, onChange);

    const trigger = screen.getByRole("button", { name: "Nationality" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter" });

    // Radix moves focus out of the trigger into the opened menu.
    await waitFor(() => expect(document.activeElement).not.toBe(trigger));
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowDown" });

    const firstItem = screen.getByRole("menuitem", { name: /Afghanistan/ });
    expect(firstItem).toHaveFocus();

    fireEvent.keyDown(document.activeElement as Element, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("AF");
  });

  it("stays closed and excludes the value from FormData when disabled", () => {
    render(
      <form data-testid="form">
        <SearchSelectDropdown
          name="nationality"
          options={baseOptions}
          placeholder="Nationality"
          disabled
          required
        />
      </form>
    );

    const trigger = screen.getByRole("button", { name: "Nationality" });
    expect(trigger).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();

    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();

    const form = screen.getByTestId("form") as HTMLFormElement;
    const nativeSelect = form.querySelector<HTMLSelectElement>("select[name='nationality']")!;
    expect(nativeSelect.value).toBe("");
    // Disabled controls are excluded entirely from FormData.
    expect(new FormData(form).has("nationality")).toBe(false);
  });
});
