import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import {
  PhoneCountryInput,
  type PhoneCountry,
  type PhoneCountryInputCopy,
} from "@/components/PhoneCountryInput";

const countries: PhoneCountry[] = [
  { id: 1, name: "Afghanistan", code: "AF", phone_code: "+93", length: 9 },
  { id: 2, name: "Albania", code: "AL", phone_code: "+355", length: 9 },
  { id: 65, name: "Egypt", code: "EG", phone_code: "+20", length: 10 },
];

const copy: PhoneCountryInputCopy = {
  placeholder: "Type your phone",
  selectCallingCode: "Select country calling code",
  callingCode: "Country calling code",
  searchCountryCode: "Search country or calling code",
  noCountriesFound: "No countries found",
  loadingCountryCodes: "Loading country calling codes...",
  countryCodesUnavailable:
    "Country calling codes are temporarily unavailable. Refresh the page to try again.",
  phoneWithoutCountryCode: "Phone number without country code",
  enterPhoneDigits: "Enter {count} digits after {code}",
  enterValidPhone: "Enter a valid phone number",
  countryCallingCodes: "Country calling codes",
};

beforeEach(() => {
  window.sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Country lookup unavailable")));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

describe("PhoneCountryInput", () => {
  it("filters live countries and submits the selected dial code with a valid local number", async () => {
    const ui = render(
      <form data-testid="form">
        <PhoneCountryInput id="phone" countries={countries} copy={copy} loadState="ready" required />
      </form>
    );

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Country calling code: Afghanistan +93" }),
      { button: 0, ctrlKey: false }
    );
    const search = await screen.findByRole("searchbox", { name: copy.searchCountryCode });
    fireEvent.change(search, { target: { value: "Egypt" } });

    expect(screen.getByRole("menuitem", { name: /Egypt.*\+20/ })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Albania/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: /Egypt.*\+20/ }));

    const phone = ui.container.querySelector<HTMLInputElement>("#phone")!;
    fireEvent.change(phone, { target: { value: "010 123-45678" } });

    expect(phone).toHaveValue("01012345678");
    expect(phone.checkValidity()).toBe(false);
    expect(screen.getByText("Enter 10 digits after +20")).toBeInTheDocument();

    fireEvent.change(phone, { target: { value: "101 234-5678" } });
    expect(phone).toHaveValue("1012345678");
    expect(phone.checkValidity()).toBe(true);
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("phone")).toBe(
      "+201012345678"
    );
  });

  it("supports arrow, enter, and escape keyboard operation", async () => {
    render(
      <StrictMode>
        <PhoneCountryInput id="phone" countries={countries} copy={copy} loadState="ready" />
      </StrictMode>
    );
    const trigger = screen.getByRole("button", {
      name: "Country calling code: Afghanistan +93",
    });

    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    let search = await screen.findByRole("searchbox", { name: copy.searchCountryCode });
    fireEvent.change(search, { target: { value: "Egypt" } });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(screen.getByRole("menuitem", { name: /Egypt.*\+20/ })).toHaveFocus();
    fireEvent.keyDown(document.activeElement as Element, { key: "Enter" });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Country calling code: Egypt +20" })
      ).toHaveFocus()
    );

    const egyptTrigger = screen.getByRole("button", { name: "Country calling code: Egypt +20" });
    fireEvent.pointerDown(egyptTrigger, { button: 0, ctrlKey: false });
    search = await screen.findByRole("searchbox", { name: copy.searchCountryCode });
    fireEvent.keyDown(search, { key: "Escape" });
    await waitFor(() => expect(egyptTrigger).toHaveFocus());
  });

  it("selects the visitor country returned by host-independent IP detection", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ country: "EG" }),
    } as Response);
    render(
      <StrictMode>
        <PhoneCountryInput id="phone" countries={countries} copy={copy} loadState="ready" />
      </StrictMode>
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Country calling code: Egypt +20" })
      ).toBeInTheDocument()
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://api.country.is/",
      expect.objectContaining({ credentials: "omit", referrerPolicy: "no-referrer" })
    );
  });

  it("keeps the selector usable when automatic country detection fails", async () => {
    render(<PhoneCountryInput id="phone" countries={countries} copy={copy} loadState="ready" />);

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(
      screen.getByRole("button", { name: "Country calling code: Afghanistan +93" })
    ).toBeEnabled();
  });

  it("blocks input and explains when country codes cannot load", () => {
    const ui = render(
      <PhoneCountryInput id="phone" countries={[]} copy={copy} loadState="error" required />
    );

    const phone = ui.container.querySelector<HTMLInputElement>("#phone")!;
    expect(phone).toHaveAttribute("aria-disabled", "true");
    expect(phone.checkValidity()).toBe(false);
    expect(screen.getByRole("alert")).toHaveTextContent("Refresh the page to try again");
    expect(screen.getByRole("button", { name: copy.selectCallingCode })).toBeDisabled();
  });

  it("preserves an existing backend profile phone until it is edited", () => {
    const ui = render(
      <form>
        <PhoneCountryInput id="phone" countries={countries} copy={copy} loadState="ready" defaultValue="+20 1012345678" />
      </form>
    );
    const form = ui.container.querySelector("form")!;
    const phone = ui.container.querySelector<HTMLInputElement>("#phone")!;
    expect(phone).toHaveValue("1012345678");
    expect(new FormData(form).get("phone")).toBe("+20 1012345678");
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.change(phone, { target: { value: "1098765432" } });
    expect(new FormData(form).get("phone")).toBe("+201098765432");
  });

  it("preserves legacy profile numbers without inventing a country code", () => {
    const ui = render(
      <form>
        <PhoneCountryInput id="phone" countries={countries} copy={copy} loadState="ready" defaultValue="01012345678" />
      </form>
    );
    const form = ui.container.querySelector("form")!;
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get("phone")).toBe("01012345678");
    expect(screen.getByRole("button", { name: copy.selectCallingCode })).toBeEnabled();
    fireEvent.change(ui.container.querySelector("#phone")!, { target: { value: "1012345678" } });
    expect(form.checkValidity()).toBe(false);
    expect(new FormData(form).get("phone")).toBe("1012345678");
  });

  it("clears both the visible number and submitted phone on form reset", () => {
    const ui = render(
      <form>
        <PhoneCountryInput id="phone" countries={countries} copy={copy} loadState="ready" />
      </form>
    );
    const form = ui.container.querySelector("form")!;
    fireEvent.change(ui.container.querySelector("#phone")!, { target: { value: "123456789" } });
    fireEvent.reset(form);
    expect(ui.container.querySelector("#phone")).toHaveValue("");
    expect(new FormData(form).get("phone")).toBe("");
  });

  it("does not change the dial code after typing if delayed geo detection arrives", async () => {
    let finishLookup!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise((resolve) => { finishLookup = resolve; }));
    const ui = render(
      <form><PhoneCountryInput id="phone" countries={countries} copy={copy} loadState="ready" /></form>
    );
    fireEvent.change(ui.container.querySelector("#phone")!, { target: { value: "123456789" } });
    finishLookup({ ok: true, json: async () => ({ country: "EG" }) } as Response);
    await waitFor(() => expect(screen.getByRole("button", { name: "Country calling code: Afghanistan +93" })).toBeInTheDocument());
    expect(new FormData(ui.container.querySelector("form")!).get("phone")).toBe("+93123456789");
  });
});
