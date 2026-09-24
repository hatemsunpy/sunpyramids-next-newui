"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";

export type PhoneCountry = {
  id?: number | string;
  name?: string;
  code?: string;
  phone_code?: string;
  length?: number | string;
};

export type PhoneCountryLoadState = "loading" | "ready" | "error";

export type PhoneCountryInputCopy = {
  placeholder: string;
  selectCallingCode: string;
  callingCode: string;
  searchCountryCode: string;
  noCountriesFound: string;
  loadingCountryCodes: string;
  countryCodesUnavailable: string;
  phoneWithoutCountryCode: string;
  enterPhoneDigits: string;
  enterValidPhone: string;
  countryCallingCodes: string;
};

type PhoneCountryInputProps = {
  countries: PhoneCountry[];
  copy: PhoneCountryInputCopy;
  id: string;
  loadState: PhoneCountryLoadState;
  name?: string;
  required?: boolean;
};

const visitorCountryEndpoint =
  process.env.NEXT_PUBLIC_VISITOR_COUNTRY_ENDPOINT || "https://api.country.is/";

function countryKey(country: PhoneCountry): string {
  return String(country.id ?? country.code ?? country.name ?? "");
}

function dialCode(country: PhoneCountry | null): string {
  const value = String(country?.phone_code ?? "").trim();
  if (!value) return "";
  return value.startsWith("+") ? value : `+${value.replace(/^00/, "")}`;
}

function flagStyle(country: PhoneCountry): React.CSSProperties | undefined {
  const code = String(country.code ?? "").trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return undefined;
  return { backgroundImage: `url("https://flagcdn.com/w40/${code}.png")` };
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replace(`{${key}}`, String(value)),
    template
  );
}

export function PhoneCountryInput({
  countries,
  copy,
  id,
  loadState,
  name = "phone",
  required = false,
}: PhoneCountryInputProps) {
  const availableCountries = React.useMemo(
    () => countries.filter((country) => country.name && country.phone_code),
    [countries]
  );
  const [selectedKey, setSelectedKey] = React.useState("");
  const [nationalNumber, setNationalNumber] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const hasUserSelectedRef = React.useRef(false);
  const geoLookupStartedRef = React.useRef(false);

  const selectedCountry =
    availableCountries.find((country) => countryKey(country) === selectedKey) ??
    availableCountries[0] ??
    null;
  const selectedDialCode = dialCode(selectedCountry);
  const expectedLength = Number(selectedCountry?.length);
  const hasExpectedLength = Number.isInteger(expectedLength) && expectedLength > 0;
  const hasLengthError =
    nationalNumber.length > 0 && hasExpectedLength && nationalNumber.length !== expectedLength;
  const submittedPhone = nationalNumber ? `${selectedDialCode}${nationalNumber}` : "";
  const feedbackId = `${id}-feedback`;
  const statusId = `${id}-country-status`;
  const isReady = loadState === "ready" && availableCountries.length > 0;

  const filteredCountries = React.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return availableCountries;
    return availableCountries.filter((country) =>
      [country.name, country.code, country.phone_code]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(normalized))
    );
  }, [availableCountries, query]);

  const focusTrigger = React.useCallback(() => {
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const selectCountry = React.useCallback(
    (country: PhoneCountry) => {
      hasUserSelectedRef.current = true;
      setSelectedKey(countryKey(country));
      setQuery("");
      setOpen(false);
      focusTrigger();
    },
    [focusTrigger]
  );

  React.useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  React.useEffect(() => {
    if (
      availableCountries.length === 0 ||
      hasUserSelectedRef.current ||
      geoLookupStartedRef.current
    ) {
      return;
    }
    geoLookupStartedRef.current = true;

    const selectVisitorCountry = (code: string) => {
      if (hasUserSelectedRef.current) return false;
      const normalizedCode = code.trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(normalizedCode)) return false;
      const visitorCountry = availableCountries.find(
        (country) => String(country.code ?? "").trim().toUpperCase() === normalizedCode
      );
      if (!visitorCountry) return false;
      setSelectedKey(countryKey(visitorCountry));
      return true;
    };

    try {
      const cachedCode = window.sessionStorage.getItem("sunpyramids-visitor-country");
      if (cachedCode && selectVisitorCountry(cachedCode)) return;
      if (cachedCode) window.sessionStorage.removeItem("sunpyramids-visitor-country");
    } catch {
      // Continue without session caching when storage is unavailable.
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3000);

    async function detectVisitorCountry() {
      try {
        const response = await fetch(visitorCountryEndpoint, {
          cache: "no-store",
          credentials: "omit",
          referrerPolicy: "no-referrer",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { country?: unknown };
        const code = typeof payload.country === "string" ? payload.country : "";
        if (selectVisitorCountry(code)) {
          try {
            window.sessionStorage.setItem(
              "sunpyramids-visitor-country",
              code.trim().toUpperCase()
            );
          } catch {
            // Country detection still works when session caching is unavailable.
          }
        }
      } catch {
        // Automatic detection is optional; the manual country selector remains available.
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void detectVisitorCountry();
    return () => {
      geoLookupStartedRef.current = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [availableCountries]);

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery("");
      focusTrigger();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      if (filteredCountries[0]) selectCountry(filteredCountries[0]);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      const options = Array.from(
        document.querySelectorAll<HTMLElement>(".phone-country-popover [role='menuitem']")
      );
      const nextOption = event.key === "ArrowDown" ? options[0] : options.at(-1);
      nextOption?.focus();
      return;
    }

    event.stopPropagation();
  }

  const validationMessage = hasExpectedLength
    ? interpolate(copy.enterPhoneDigits, { count: expectedLength, code: selectedDialCode })
    : copy.enterValidPhone;

  return (
    <div className="phone-country-field">
      <div className="phone-country-input">
        <input type="hidden" name={name} value={submittedPhone} />

        <DropdownMenu
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) setQuery("");
          }}
        >
          <DropdownMenuTrigger asChild>
            <button
              ref={triggerRef}
              type="button"
              className="phone-country-trigger"
              aria-label={
                selectedCountry
                  ? `${copy.callingCode}: ${selectedCountry.name} ${selectedDialCode}`
                  : copy.selectCallingCode
              }
              aria-describedby={loadState !== "ready" ? statusId : undefined}
              disabled={!isReady}
            >
              <span
                className={`phone-country-flag ${selectedCountry && flagStyle(selectedCountry) ? "has-image" : ""}`}
                style={selectedCountry ? flagStyle(selectedCountry) : undefined}
                aria-hidden="true"
              >
                {selectedCountry?.code || "--"}
              </span>
              <span className="phone-country-code">{selectedDialCode || "--"}</span>
              <ChevronDown className="phone-country-chevron" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="phone-country-popover"
            aria-label={copy.countryCallingCodes}
          >
            <div className="phone-country-search" onClick={(event) => event.stopPropagation()}>
              <Search aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={copy.searchCountryCode}
                aria-label={copy.searchCountryCode}
              />
            </div>

            <div className="phone-country-options">
              {filteredCountries.length ? (
                filteredCountries.map((country) => {
                  const key = countryKey(country);
                  const code = dialCode(country);
                  const isSelected = selectedCountry ? key === countryKey(selectedCountry) : false;
                  return (
                    <DropdownMenuItem
                      key={key}
                      active={isSelected}
                      onSelect={() => selectCountry(country)}
                      className="phone-country-option"
                    >
                      <span
                        className={`phone-country-flag ${flagStyle(country) ? "has-image" : ""}`}
                        style={flagStyle(country)}
                        aria-hidden="true"
                      >
                        {country.code || "--"}
                      </span>
                      <span className="phone-country-name">{country.name}</span>
                      <span className="phone-country-option-code">{code}</span>
                      {isSelected ? <Check className="phone-country-check" aria-hidden="true" /> : null}
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <p className="phone-country-empty">{copy.noCountriesFound}</p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          id={id}
          className="phone-country-number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={copy.placeholder}
          value={nationalNumber}
          onChange={(event) => setNationalNumber(event.target.value.replace(/\D/g, ""))}
          required={required}
          disabled={!isReady}
          pattern={hasExpectedLength ? `[0-9]{${expectedLength}}` : "[0-9]+"}
          title={validationMessage}
          aria-label={copy.phoneWithoutCountryCode}
          aria-invalid={hasLengthError || undefined}
          aria-describedby={hasLengthError ? feedbackId : loadState !== "ready" ? statusId : undefined}
        />
      </div>

      {hasLengthError ? (
        <p id={feedbackId} className="phone-country-feedback" role="alert">
          {validationMessage}
        </p>
      ) : null}

      {loadState !== "ready" ? (
        <p
          id={statusId}
          className={`phone-country-status ${loadState === "error" ? "is-error" : ""}`}
          role={loadState === "error" ? "alert" : "status"}
        >
          {loadState === "error" ? copy.countryCodesUnavailable : copy.loadingCountryCodes}
        </p>
      ) : null}
    </div>
  );
}
