"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client-api";
import { generateRecaptchaToken } from "@/lib/recaptcha";
import { withLocale } from "@/lib/locales";
import type { Locale } from "@/types/api";
import { homeCopy } from "@/lib/home-copy";
import { ApiPhoneCountryInput } from "@/components/ApiPhoneCountryInput";

export function HomeNeedHelpForm({ locale = "en" }: { locale?: Locale }) {
  const copy = homeCopy(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
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
      <label><span className="home-help-label">{copy.fullName}</span><input name="name" required autoComplete="name" /></label>
      <label><span className="home-help-label">{copy.nationality}</span><input name="country" required autoComplete="country-name" /></label>
      <div className="home-help-phone">
        <label htmlFor="home-help-phone"><span className="home-help-label">{copy.phone}<span className="phone-required" aria-hidden="true">*</span></span></label>
        <ApiPhoneCountryInput id="home-help-phone" locale={locale} required />
      </div>
      <button className="btn-primary" disabled={pending} aria-busy={pending} type="submit">{copy.contactNow}</button>
      {failed ? <p role="alert">Something went wrong. Please try again.</p> : null}
    </form>
  );
}
