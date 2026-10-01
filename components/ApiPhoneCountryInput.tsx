"use client";

import { useEffect, useState } from "react";
import { PhoneCountryInput, phoneCountryCopy, type PhoneCountry, type PhoneCountryLoadState } from "@/components/PhoneCountryInput";
import { apiGet } from "@/lib/client-api";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale } from "@/types/api";

// For forms that do not already load countries. Forms with a countries request
// pass its result directly to PhoneCountryInput instead of fetching twice.
export function ApiPhoneCountryInput({
  locale = "en", id, name = "phone", required = false, defaultValue = "",
}: {
  locale?: Locale;
  id: string;
  name?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const copy = uiCopy(locale);
  const [countries, setCountries] = useState<PhoneCountry[]>([]);
  const [loadState, setLoadState] = useState<PhoneCountryLoadState>("loading");

  useEffect(() => {
    let active = true;
    apiGet<{ data?: PhoneCountry[] }>("countries", locale, false)
      .then((response) => {
        if (!active) return;
        const loaded = Array.isArray(response.data)
          ? response.data.filter((country) => country.name && country.phone_code)
          : [];
        setCountries(loaded);
        setLoadState(loaded.length ? "ready" : "error");
      })
      .catch(() => { if (active) setLoadState("error"); });
    return () => { active = false; };
  }, [locale]);

  return (
    <PhoneCountryInput
      key={`${locale}:${loadState}:${defaultValue}`}
      id={id} name={name} required={required} defaultValue={defaultValue}
      countries={countries} loadState={loadState}
      copy={phoneCountryCopy(copy)}
    />
  );
}
