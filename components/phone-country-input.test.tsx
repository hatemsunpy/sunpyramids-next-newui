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

    fireEvent.change(phone, { target: { value: "010 123-4567" } });
    expect(phone).toHaveValue("0101234567");
    expect(phone.checkValidity()).toBe(true);
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("phone")).toBe(
      "+200101234567"
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

    expect(ui.container.querySelector<HTMLInputElement>("#phone")).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Refresh the page to try again");
    expect(screen.getByRole("button", { name: copy.selectCallingCode })).toBeDisabled();
  });
});
