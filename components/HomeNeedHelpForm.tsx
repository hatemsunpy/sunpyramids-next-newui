"use client";

import { FormEvent, useEffect, useState } from "react";
import { useProgressRouter as useRouter } from "@/components/useProgressRouter";
import { apiGet, apiPost } from "@/lib/client-api";
import { generateRecaptchaToken } from "@/lib/recaptcha";
import { withLocale } from "@/lib/locales";
import type { Locale } from "@/types/api";
import { homeCopy } from "@/lib/home-copy";
import { PhoneCountryInput, phoneCountryCopy, type PhoneCountry, type PhoneCountryLoadState } from "@/components/PhoneCountryInput";
import { SearchSelectDropdown } from "@/components/SearchSelectDropdown";
import { uiCopy } from "@/lib/ui-copy";

export function HomeNeedHelpForm({ locale = "en" }: { locale?: Locale }) {
  const copy = homeCopy(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [countryResponse, setCountryResponse] = useState<{
    locale: Locale; countries: PhoneCountry[]; loadState: PhoneCountryLoadState;
  }>({ locale, countries: [], loadState: "loading" });
  const countries = countryResponse.locale === locale ? countryResponse.countries : [];
  const countryLoadState = countryResponse.locale === locale ? countryResponse.loadState : "loading";

  useEffect(() => {
    let active = true;
    apiGet<{ data?: PhoneCountry[] }>("countries", locale, false)
      .then((response) => {
        if (!active) return;
        const loaded = Array.isArray(response.data) ? response.data : [];
        setCountryResponse({ locale, countries: loaded,
          loadState: loaded.some((country) => country.name && country.phone_code) ? "ready" : "error" });
      })
      .catch(() => { if (active) setCountryResponse({ locale, countries: [], loadState: "error" }); });
    return () => { active = false; };
  }, [locale]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (countryLoadState !== "ready" || !event.currentTarget.reportValidity()) return;
    setPending(true);
    setFailed(false);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const token = await generateRecaptchaToken("submit");
    try {
      await apiPost("contact-requests", {
        name,
        phone: String(form.get("phone") || ""),
        country: String(form.get("country") || ""),
        subject: "Need help to Finding my Trip",
        message: "Need help to Finding my Trip",
        email: `${Date.now()}.home@sunpyramidstours.com`,
        type: "home_contact",
        ...(token ? { recaptcha_token: token } : {}),
      }, locale);
      router.push(`${withLocale("/thankful", locale)}?name=${encodeURIComponent(name)}`);
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <form className="home-help-form" onSubmit={submit}>
      <label><span className="home-help-label">{copy.fullName}</span><input name="name" placeholder={copy.fullName} required autoComplete="name" /></label>
      <div className="home-help-nationality">
        <label htmlFor="home-help-country"><span className="home-help-label">{copy.nationality}</span></label>
        <SearchSelectDropdown id="home-help-country" name="country" placeholder={copy.nationality}
          options={countries.filter((country) => country.name).map((country) => ({ value: String(country.name), label: String(country.name) }))}
          required disabled={countryLoadState !== "ready"} variant="boxed" menuTitle={copy.nationality} searchable />
      </div>
      <div className="home-help-phone">
        <label htmlFor="home-help-phone"><span className="home-help-label">{copy.phone}<span className="phone-required" aria-hidden="true">*</span></span></label>
        <PhoneCountryInput id="home-help-phone" countries={countries} loadState={countryLoadState} copy={phoneCountryCopy(uiCopy(locale))} required />
      </div>
      <button className="btn-primary" disabled={pending || countryLoadState !== "ready"} aria-busy={pending} type="submit">{pending ? uiCopy(locale).sending : copy.contactNow}</button>
      {failed ? <p role="alert">Something went wrong. Please try again.</p> : null}
    </form>
  );
}
