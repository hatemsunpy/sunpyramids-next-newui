"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneCountryInput, type PhoneCountry, type PhoneCountryLoadState } from "@/components/PhoneCountryInput";
import { SearchSelectDropdown } from "@/components/SearchSelectDropdown";
import { apiGet, apiPost } from "@/lib/client-api";
import { generateRecaptchaToken } from "@/lib/recaptcha";
import { withLocale } from "@/lib/locales";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale } from "@/types/api";

export function ContactForm({
  locale = "en",
  tourId,
  tourTitle,
  submitLabel,
}: {
  locale?: Locale;
  tourId?: number;
  tourTitle?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const copy = uiCopy(locale);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const isTourInquiry = tourId != null;
  const [countries, setCountries] = useState<PhoneCountry[]>([]);
  const [countryLoadState, setCountryLoadState] = useState<PhoneCountryLoadState>("loading");

  useEffect(() => {
    if (!isTourInquiry) return;
    let active = true;
    apiGet<{ data?: PhoneCountry[] }>("countries", locale, false)
      .then((response) => {
        if (!active) return;
        const loaded = Array.isArray(response.data) ? response.data : [];
        setCountries(loaded);
        setCountryLoadState(loaded.length ? "ready" : "error");
      })
      .catch(() => {
        if (!active) return;
        setCountries([]);
        setCountryLoadState("error");
      });
    return () => { active = false; };
  }, [isTourInquiry, locale]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (isTourInquiry && countryLoadState !== "ready") {
      setStatus("error");
      return;
    }
    setStatus("loading");
    const form = new FormData(formElement);
    const token = await generateRecaptchaToken("submit");
    const name = String(form.get("name") || "");
    const payload: Record<string, string> = {
      name,
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      country: String(form.get("country") || ""),
      subject: isTourInquiry ? `Tour inquiry: ${tourTitle || `Tour #${tourId}`}` : "contact-us",
      message: String(form.get("message") || ""),
      type: "form_contact",
    };
    if (token) payload.recaptcha_token = token;

    try {
      await apiPost("contact-requests", payload, locale);
      setStatus("success");
      formElement.reset();
      router.push(`${withLocale("/thankful", locale)}?name=${encodeURIComponent(name)}`);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className={isTourInquiry ? "tour-inquiry-form" : "form-card form-grid"} onSubmit={submit} aria-busy={status === "loading"}>
      {isTourInquiry ? (
        <>
          <div className="tour-inquiry-field">
            <label htmlFor="tour-inquiry-name">{copy.fullName} <span aria-hidden="true">*</span></label>
            <input id="tour-inquiry-name" name="name" placeholder={copy.fullName} autoComplete="name" required />
          </div>
          <div className="tour-inquiry-field">
            <label htmlFor="tour-inquiry-country">{copy.nationality} <span aria-hidden="true">*</span></label>
            <SearchSelectDropdown
              id="tour-inquiry-country"
              name="country"
              defaultValue=""
              placeholder={copy.nationality}
              options={countries.filter((country) => country.name).map((country) => ({
                value: String(country.name),
                label: String(country.name),
              }))}
              required
              disabled={countryLoadState !== "ready"}
              variant="boxed"
              iconType="country"
              menuTitle={copy.nationality}
              searchable
            />
          </div>
          <div className="tour-inquiry-field">
            <label htmlFor="tour-inquiry-phone">{copy.phone} <span aria-hidden="true">*</span></label>
            <PhoneCountryInput
              id="tour-inquiry-phone"
              name="phone"
              countries={countries}
              loadState={countryLoadState}
              copy={{
                placeholder: copy.phonePlaceholder,
                selectCallingCode: copy.selectCallingCode,
                callingCode: copy.callingCode,
                searchCountryCode: copy.searchCountryCode,
                noCountriesFound: copy.noCountriesFound,
                loadingCountryCodes: copy.loadingCountryCodes,
                countryCodesUnavailable: copy.countryCodesUnavailable,
                phoneWithoutCountryCode: copy.phoneWithoutCountryCode,
                enterPhoneDigits: copy.enterPhoneDigits,
                enterValidPhone: copy.enterValidPhone,
                countryCallingCodes: copy.countryCallingCodes,
              }}
              required
            />
          </div>
          <div className="tour-inquiry-field">
            <label htmlFor="tour-inquiry-email">{copy.email} <span aria-hidden="true">*</span></label>
            <input id="tour-inquiry-email" name="email" type="email" placeholder={copy.email} autoComplete="email" required />
          </div>
          <div className="tour-inquiry-field">
            <label htmlFor="tour-inquiry-message">{copy.writeUs} <span aria-hidden="true">*</span></label>
            <textarea id="tour-inquiry-message" name="message" placeholder={copy.writeUs} rows={5} required />
          </div>
        </>
      ) : (
        <>
          <div className="form-field">
            <input name="name" placeholder={copy.fullName} autoComplete="name" required />
          </div>
          <div className="form-field">
            <input name="email" type="email" placeholder={copy.email} autoComplete="email" required />
          </div>
          <div className="form-field">
            <input name="phone" type="tel" placeholder={copy.phone} autoComplete="tel" required />
          </div>
          <div className="form-field">
            <input name="country" placeholder={copy.country} autoComplete="country-name" required />
          </div>
          <div className="form-field">
            <textarea name="message" placeholder={copy.writeUs} rows={5} required />
          </div>
        </>
      )}
      <button className="btn-primary" type="submit" disabled={status === "loading" || (isTourInquiry && countryLoadState !== "ready")}>
        {status === "loading" ? copy.sending : submitLabel || (isTourInquiry ? copy.submit : copy.sendMessage)}
      </button>
      <div aria-live="polite">
        {status === "success" ? <p style={{ color: "var(--primary)" }}>{copy.messageSuccess}</p> : null}
        {status === "error" ? <p style={{ color: "#dc2626" }}>{copy.messageError}</p> : null}
      </div>
    </form>
  );
}
