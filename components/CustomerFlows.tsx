"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/types/api";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPostForm,
  apiPut,
  ApiClientError,
  clientApiUrl,
  getCookie,
  setCookie,
} from "@/lib/client-api";
import { withLocale } from "@/lib/locales";
import { parseLocalCalendarDate } from "@/lib/local-date";
import { generateRecaptchaToken } from "@/lib/recaptcha";
import { useCurrency } from "@/components/CurrencyProvider";
import { uiCopy } from "@/lib/ui-copy";
import { siteContact } from "@/lib/site-contact";
import { SearchSelectDropdown } from "@/components/SearchSelectDropdown";
import { FlowbiteDatepicker } from "@/components/FlowbiteDatepicker";

type ApiResponse<T = any> = {
  status?: boolean;
  message?: string;
  data?: T;
};

type LoadState = "idle" | "loading" | "success" | "error";

const allowedPaymentRedirectHosts = new Set([
  "paypal.com",
  "www.paypal.com",
  "sandbox.paypal.com",
  "www.sandbox.paypal.com",
  "fawaterk.com",
  "www.fawaterk.com",
  "checkout.fawaterk.com",
  "staging-checkout.fawaterk.com",
  "sunpyramidtours.com",
  "www.sunpyramidtours.com",
  "sunpyramidstours.com",
  "www.sunpyramidstours.com",
]);

// Confirmed by the original Nuxt checkout integration. This gateway value is
// deliberately kept out of customer-editable form controls.
const CARD_PAYMENT_METHOD_ID = 9;

function messageFromError(error: unknown, fallback = "Something went wrong. Please try again.") {
  return error instanceof Error ? error.message : fallback;
}

function statusClass(state: LoadState) {
  return state === "error" ? "form-message error" : "form-message";
}

function isAllowedPaymentRedirect(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedPaymentRedirectHosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function couponIdFrom(value: any) {
  return value?.id || value?.coupon_id || value?.coupon?.id || null;
}

function cartRemoveIdentifier(item: any) {
  if (item?.type === "tour") return item?.tour?.id || null;
  if (item?.type === "rental") return item?.id || null;
  if (item?.tour?.id) return item.tour.id;
  return item?.id || null;
}

function matchingSeason(tour: any, dateString?: string) {
  if (!Array.isArray(tour?.seasons)) return null;
  const parsed = parseLocalCalendarDate(dateString);
  if (!parsed) return null;

  return tour.seasons.find((season: any) => {
    const availability = season?.calender_availability;
    if (!availability) return false;
    return (
      availability.day_numbers?.includes(parsed.day) &&
      availability.day_names?.includes(parsed.weekday) &&
      availability.month_names?.includes(parsed.monthName) &&
      availability.years_numbers?.includes(parsed.year)
    );
  }) ?? null;
}

export function optionCost(option: any, adults: number, children: number): number {
  const baseAdultPrice = Number(option?.adult_price ?? 0);
  const baseChildPrice = Number(option?.child_price ?? 0);
  const groups = Array.isArray(option?.pricing_groups) ? option.pricing_groups : [];
  if (groups.length) {
    const totalPeople = adults + children;
    const group = groups.find((g: any) => totalPeople >= Number(g?.from) && totalPeople <= Number(g?.to));
    if (group) {
      return Number(group.price ?? baseAdultPrice) * adults + Number(group.child_price ?? baseChildPrice) * children;
    }
  }
  return baseAdultPrice * adults + baseChildPrice * children;
}

function cartItemTotal(item: any): number | null {
  const tour = item?.tour;
  if (tour) {
    const adults = Number(item?.adults) || 1;
    const children = Number(item?.children) || 0;
    const infants = Number(item?.infants) || 0;
    const season = matchingSeason(tour, item?.start_date);
    const source = season ?? tour;
    const groups = Array.isArray(source.pricing_groups) ? source.pricing_groups : [];
    const group = groups.find((g: any) => adults >= Number(g?.from) && adults <= Number(g?.to));
    const adultRate = group ? Number(group.price) : Number(source.adult_price ?? tour.adult_price ?? tour.start_from ?? tour.price ?? 0);
    const childRate = group ? Number(group.child_price) : Number(source.child_price ?? tour.child_price ?? 0);
    const infantRate = Number(source.infant_price ?? tour.infant_price ?? 0);
    let total = adultRate * adults + childRate * children + infantRate * infants;
    if (Array.isArray(item.options)) {
      total += item.options.reduce((sum: number, option: any) => sum + optionCost(option, adults, children), 0);
    }
    const offer = Number(tour.offer) || 0;
    if (offer) total -= total * (offer / 100);
    return Number.isFinite(total) ? total : null;
  }
  const fallback = Number(item?.total ?? item?.price ?? item?.car_route_price);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : null;
}

export function AuthFlow({ mode, locale = "en" }: { mode: string; locale?: Locale }) {
  const copy = uiCopy(locale);
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");
  const [rememberEmail, setRememberEmail] = useState("");
  const title = {
    "sign-in": copy.welcome,
    "sign-up": copy.createAccount,
    "forget-password": copy.forgetPassword,
    "reset-password": copy.createPassword,
    "create-password": copy.createPassword,
    "confirm-code": copy.confirmCode,
  }[mode] || "Account";

  useEffect(() => {
    queueMicrotask(() => setRememberEmail(getCookie("sunpyramids-email") || ""));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      if (mode === "sign-in") {
        const email = String(form.get("email") || "");
        const password = String(form.get("password") || "");
        const remember = form.get("signSave") === "on";
        const res = await apiPost<ApiResponse<{ accessToken?: string; [key: string]: unknown }>>("auth/login", { email, password }, locale);
        if (res.data?.accessToken) {
          setCookie("sunpyramids-token", res.data.accessToken);
          // Reload hydration comes from profile/me. Avoid duplicating the full
          // user/profile payload in a JavaScript-readable cookie.
          setCookie("sunpyramids-user", null);
          setCookie("sunpyramids-email", remember ? email : null);
        }
        setMessage(res.message || "Signed in successfully.");
        setState("success");
        router.push(withLocale("/", locale));
        return;
      }

      if (mode === "sign-up") {
        const body = {
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
          password_confirmation: String(form.get("confirmPassword") || ""),
        };
        const res = await apiPost<ApiResponse>("auth/register", body, locale);
        setMessage(res.message || "Account created successfully.");
        setState("success");
        router.push(withLocale("/auth/sign-in", locale));
        return;
      }

      if (mode === "forget-password") {
        const email = String(form.get("email") || "");
        const res = await apiPost<ApiResponse>("auth/password/forget", { email }, locale);
        setMessage(res.message || "Confirmation code sent.");
        setState("success");
        router.push(`${withLocale("/auth/confirm-code", locale)}?email=${encodeURIComponent(email)}`);
        return;
      }

      if (mode === "confirm-code") {
        const email = String(form.get("email") || params.get("email") || "");
        const otp = String(form.get("otp") || "");
        await apiPost<ApiResponse>("auth/password/otp/verify", { email, otp }, locale);
        setMessage("Code confirmed.");
        setState("success");
        router.push(`${withLocale("/auth/create-password", locale)}?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
        return;
      }

      if (mode === "create-password") {
        const body = {
          email: String(form.get("email") || params.get("email") || ""),
          otp: String(form.get("otp") || params.get("otp") || ""),
          password: String(form.get("password") || ""),
          password_confirmation: String(form.get("confirmPassword") || ""),
        };
        const res = await apiPost<ApiResponse>("auth/password/reset", body, locale);
        setMessage(res.message || "Password updated.");
        setState("success");
        router.push(withLocale("/auth/sign-in", locale));
        return;
      }

      if (mode === "reset-password") {
        const body = {
          email: String(form.get("email") || params.get("email") || ""),
          otp: String(form.get("token") || params.get("token") || params.get("otp") || ""),
          password: String(form.get("password") || ""),
          password_confirmation: String(form.get("confirmPassword") || ""),
        };
        const res = await apiPost<ApiResponse>("auth/password/reset", body, locale);
        setMessage(res.message || "Password updated.");
        setState("success");
        router.push(withLocale("/auth/sign-in", locale));
      }
    } catch (error) {
      setState("error");
      setMessage(messageFromError(error, copy.messageError));
    }
  }

  function socialRedirect(endpoint: string) {
    window.location.href = clientApiUrl(endpoint);
  }

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(withLocale("/", locale));
    }
  }

  const isPasswordMode = mode.includes("password") || mode === "sign-in" || mode === "sign-up";

  return (
    <div className={`auth-form-wrap auth-mode-${mode}`}>
      <nav className="auth-nav-row" aria-label="Page navigation">
        <button type="button" className="auth-nav-back" onClick={handleBack} aria-label={copy.back || "Back"}>
          <span aria-hidden="true">←</span>
          <span>{copy.back || "Back"}</span>
        </button>
        <Link href={withLocale("/", locale)} className="auth-nav-home" aria-label={copy.home || "Home"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>{copy.home || "Home"}</span>
        </Link>
      </nav>
      <div className="auth-heading">
        <p className="eyebrow">Sun Pyramids Tours</p>
        <h1>{title}</h1>
      </div>
      {mode === "sign-in" || mode === "sign-up" ? (
        <div className="social-row">
          <button type="button" onClick={() => socialRedirect("auth/google/redirect")}>
            <Image src="/images/google.png" alt="" width={20} height={20} aria-hidden="true" />
            Google
          </button>
          <button type="button" onClick={() => socialRedirect("auth/facebook/redirect")}>
            <Image src="/images/facebook-logo.webp" alt="" width={20} height={20} aria-hidden="true" />
            Facebook
          </button>
          <div className="auth-divider" aria-hidden="true" />
        </div>
      ) : null}
      <form className="auth-form" onSubmit={submit} aria-describedby={message ? "auth-form-message" : undefined}>
        {mode === "sign-up" ? (
          <div className="auth-field">
            <label htmlFor="auth-name">{copy.fullName}</label>
            <input id="auth-name" name="name" placeholder={copy.fullName} autoComplete="name" required />
          </div>
        ) : null}
        {mode === "confirm-code" || mode === "create-password" || mode === "reset-password" ? (
          <div className="auth-field">
            <label htmlFor="auth-email">{copy.email}</label>
            <input id="auth-email" name="email" type="email" placeholder={copy.email} defaultValue={params.get("email") || ""} autoComplete="email" required />
          </div>
        ) : null}
        {mode === "sign-in" || mode === "sign-up" || mode === "forget-password" ? (
          <div className="auth-field">
            <label htmlFor="auth-email">{copy.email}</label>
            <input id="auth-email" name="email" type="email" placeholder={copy.email} defaultValue={mode === "sign-in" ? rememberEmail : ""} autoComplete="email" required />
          </div>
        ) : null}
        {mode === "confirm-code" ? (
          <div className="auth-field auth-code-field">
            <label htmlFor="auth-otp">Confirmation code</label>
            <input id="auth-otp" name="otp" placeholder="Confirmation code" inputMode="numeric" minLength={6} maxLength={6} autoComplete="one-time-code" required />
          </div>
        ) : null}
        {mode === "reset-password" ? (
          <div className="auth-field auth-code-field">
            <label htmlFor="auth-token">Reset token</label>
            <input id="auth-token" name="token" placeholder="Reset token" defaultValue={params.get("token") || ""} required />
          </div>
        ) : null}
        {mode === "create-password" ? (
          <div className="auth-field auth-code-field">
            <label htmlFor="auth-otp">Confirmation code</label>
            <input id="auth-otp" name="otp" placeholder="Confirmation code" defaultValue={params.get("otp") || ""} required />
          </div>
        ) : null}
        {isPasswordMode ? (
          <div className="auth-field">
            <label htmlFor="auth-password">{copy.password}</label>
            <input id="auth-password" name="password" type="password" placeholder={copy.password} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required />
          </div>
        ) : null}
        {mode === "sign-up" || mode === "create-password" || mode === "reset-password" ? (
          <div className="auth-field">
            <label htmlFor="auth-confirm-password">{copy.confirmPassword}</label>
            <input id="auth-confirm-password" name="confirmPassword" type="password" placeholder={copy.confirmPassword} autoComplete="new-password" minLength={8} required />
          </div>
        ) : null}
        {mode === "sign-in" ? (
          <label className="inline-check">
            <input name="signSave" type="checkbox" defaultChecked={!!rememberEmail} /> {copy.saveLogin}
          </label>
        ) : null}
        {mode === "sign-up" ? (
          <label className="inline-check">
            <input name="agreeTerms" type="checkbox" required /> {copy.agreeTerms}
          </label>
        ) : null}
        <button className="btn-primary" type="submit" disabled={state === "loading"}>
          {state === "loading" ? "Please wait..." : title}
        </button>
      </form>
      {message ? <p id="auth-form-message" className={statusClass(state)} role={state === "error" ? "alert" : "status"}>{message}</p> : null}
      <nav className="auth-links" aria-label="Account access">
        <Link href={withLocale("/auth/sign-in", locale)} className={mode === "sign-in" ? "is-active" : undefined} aria-current={mode === "sign-in" ? "page" : undefined}>{copy.signIn}</Link>
        <Link href={withLocale("/auth/sign-up", locale)} className={mode === "sign-up" ? "is-active" : undefined} aria-current={mode === "sign-up" ? "page" : undefined}>{copy.createAccount}</Link>
        <Link href={withLocale("/auth/forget-password", locale)} className={mode === "forget-password" ? "is-active" : undefined} aria-current={mode === "forget-password" ? "page" : undefined}>{copy.forgetPassword}</Link>
      </nav>
    </div>
  );
}

export function AccountFlow({ view = "profile", locale = "en" }: { view?: string; locale?: Locale }) {
  const copy = uiCopy(locale);
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const hasToken = !!getCookie("sunpyramids-token");
    queueMicrotask(() => {
      setIsAuthenticated(hasToken);
    });

    async function load() {
      if (!hasToken) {
        setState("idle");
        return;
      }
      try {
        const me = await apiGet<ApiResponse<Record<string, unknown>>>("profile/me", locale, true);
        const liveUser = me.data ?? null;
        setUser(liveUser);
        if (view === "bookings") {
          const res = await apiGet<ApiResponse<{ data?: any[] }>>("bookings?page_limit=200&includes=currency,tours", locale);
          setItems(Array.isArray(res.data?.data) ? res.data.data : []);
        } else if (view === "favourites") {
          const res = await apiGet<ApiResponse<{ data?: any[] }>>("wishlist?page=1&page_limit=200", locale);
          setItems(Array.isArray(res.data?.data) ? res.data.data : []);
        }
        setState("success");
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          setCookie("sunpyramids-token", null);
          setCookie("sunpyramids-user", null);
          setIsAuthenticated(false);
        }
        setState("error");
        setMessage(messageFromError(error));
      }
    }

    load();
  }, [locale, view]);

  async function logout() {
    try {
      await apiPost<ApiResponse>("profile/logout", {}, locale, true);
    } catch {
      // Local logout must still complete when a stale token cannot be revoked.
    } finally {
      setCookie("sunpyramids-token", null);
      setCookie("sunpyramids-user", null);
      setIsAuthenticated(false);
      router.push(withLocale("/", locale));
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {
      name: String(form.get("fullName") || user?.name || ""),
      phone: String(form.get("phone") || "") || null,
      nationality: String(form.get("nationality") || "") || null,
      birthdate: String(form.get("birthDate") || "") || null,
      password: null,
      password_confirmation: null,
    };
    const password = String(form.get("password") || "");
    if (password) {
      body.password = password;
      body.password_confirmation = String(form.get("confirmPassword") || "");
    }

    try {
      const res = await apiPatch<ApiResponse>("profile", body, locale);
      const me = await apiGet<ApiResponse<Record<string, unknown>>>("profile/me", locale, true);
      if (me.data) {
        setUser(me.data);
      }
      setState("success");
      setMessage(res.message || "Profile updated successfully.");
    } catch (error) {
      setState("error");
      setMessage(messageFromError(error));
    }
  }

  async function uploadProfileImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const image = form.get("image");
    if (!(image instanceof File) || !image.size) return;
    if (image.size > 2 * 1024 * 1024) {
      setState("error");
      setMessage("Profile image must be 2 MB or smaller.");
      return;
    }
    setState("loading");
    setMessage("");
    try {
      const body = new FormData();
      body.set("image", image);
      const res = await apiPostForm<ApiResponse>("profile/change/image", body, locale, true);
      const me = await apiGet<ApiResponse<Record<string, unknown>>>("profile/me", locale, true);
      if (me.data) {
        setUser(me.data);
      }
      setState("success");
      setMessage(res.message || "Profile image updated successfully.");
      event.currentTarget.reset();
    } catch (error) {
      setState("error");
      setMessage(messageFromError(error, copy.messageError));
    }
  }

  return (
    <div className="account-card" aria-busy={state === "loading"}>
      <div className="account-card-head">
        <div>
          <p className="eyebrow">Account area</p>
          {isAuthenticated && user?.name ? <h2>{String(user.name)}</h2> : null}
        </div>
        {isAuthenticated ? <button className="btn-outline" type="button" onClick={logout}>{copy.signOut}</button> : null}
      </div>
      {!isAuthenticated ? (
        <div className="account-empty-state">
          <h2>Sign in required</h2>
          <p className="muted">Sign in to sync your bookings, favourites, profile settings, and checkout activity.</p>
          <Link className="btn-primary" href={withLocale("/auth/sign-in", locale)}>{copy.signIn}</Link>
        </div>
      ) : view === "settings" || view === "profile" ? (
        <div className="account-profile-forms">
          <form className="profile-image-form" onSubmit={uploadProfileImage} aria-label="Profile image">
            <div className="profile-avatar">
              {user?.image ? <Image src={String(user.image)} alt={String(user.name || copy.myProfile)} width={96} height={96} /> : <span aria-hidden="true">{String(user?.name || copy.myProfile).charAt(0)}</span>}
            </div>
            <div className="profile-image-control">
              <label htmlFor="profile-image">Profile image</label>
              <input id="profile-image" name="image" type="file" accept="image/*" required />
            </div>
            <button className="btn-outline" type="submit" disabled={state === "loading"}>Update profile image</button>
          </form>
          <form className="form-grid account-form" onSubmit={updateProfile} aria-describedby={message ? "profile-form-message" : undefined}>
            <div className="account-field">
              <label htmlFor="profile-name">{copy.fullName}</label>
              <input id="profile-name" name="fullName" placeholder={copy.fullName} defaultValue={user?.name || ""} autoComplete="name" required />
            </div>
            <div className="account-field">
              <label htmlFor="profile-email">{copy.email}</label>
              <input id="profile-email" name="email" type="email" placeholder={copy.email} defaultValue={user?.email || ""} autoComplete="email" readOnly aria-readonly="true" />
            </div>
            <div className="account-field">
              <label htmlFor="profile-phone">{copy.phone}</label>
              <input id="profile-phone" name="phone" placeholder={copy.phone} defaultValue={user?.phone || ""} autoComplete="tel" />
            </div>
            <div className="account-field">
              <label>{copy.birthDate}</label>
              <FlowbiteDatepicker
                id="profile-birthdate"
                name="birthDate"
                defaultValue={user?.birthdate || ""}
                placeholder={copy.birthDate}
                maxDate={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="account-field">
              <label htmlFor="profile-nationality">{copy.nationality}</label>
              <input id="profile-nationality" name="nationality" placeholder={copy.nationality} defaultValue={user?.nationality || ""} autoComplete="country-name" />
            </div>
            <div className="account-field">
              <label htmlFor="profile-password">{copy.password}</label>
              <input id="profile-password" name="password" type="password" placeholder={copy.password} autoComplete="new-password" minLength={8} />
            </div>
            <div className="account-field">
              <label htmlFor="profile-confirm-password">{copy.confirmPassword}</label>
              <input id="profile-confirm-password" name="confirmPassword" type="password" placeholder={copy.confirmPassword} autoComplete="new-password" minLength={8} />
            </div>
            <div className="account-form-actions">
              <button className="btn-primary" type="submit" disabled={state === "loading"}>{copy.saveChanges}</button>
              {message ? <p id="profile-form-message" className={statusClass(state)} role={state === "error" ? "alert" : "status"}>{message}</p> : null}
            </div>
          </form>
        </div>
      ) : (
        <section className="account-collection">
          <h2>{view === "bookings" ? copy.myBookings : copy.myFavorites}</h2>
          {state === "loading" ? <p className="muted" role="status">Loading...</p> : null}
          {state === "error" ? <p className="form-message error" role="alert">{message}</p> : null}
          {state !== "loading" && items.length === 0 ? <p className="account-empty-copy muted">{view === "bookings" ? "There are no bookings." : "The wishlist is empty."}</p> : null}
          {items.length ? (
            <div className="account-list">
              {items.map((item, index) => (
                <article key={item.id || item.slug || index}>
                  <strong>{item.title || item.name || item.code || `Item ${index + 1}`}</strong>
                  {item.email ? <span>{item.email}</span> : null}
                </article>
              ))}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

function CartTourEditor({
  item,
  locale,
  disabled,
  onSubmit,
  onCancel,
}: {
  item: any;
  locale: Locale;
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: any) => void;
  onCancel?: () => void;
}) {
  const copy = uiCopy(locale);
  const { format } = useCurrency();
  const slug = String(item?.tour?.slug || "");
  const selectedOptionIds = Array.isArray(item?.options)
    ? item.options.map((option: any) => Number(option?.id)).filter(Boolean)
    : [];
  const [options, setOptions] = useState<any[]>(() => {
    if (Array.isArray(item?.tour?.options) && item.tour.options.length) return item.tour.options;
    return Array.isArray(item?.options) ? item.options : [];
  });

  useEffect(() => {
    if (!slug) return;
    let active = true;
    apiGet<ApiResponse<any>>(`tours/${encodeURIComponent(slug)}?includes=options`, locale, false)
      .then((response) => {
        if (active && Array.isArray(response.data?.options)) setOptions(response.data.options);
      })
      .catch(() => {
        // Preserve the meaningful option objects already returned with the cart.
      });
    return () => {
      active = false;
    };
  }, [locale, slug]);

  const itemId = item.id || item.tour?.id || "editor";

  return (
    <form className="cart-editor-panel" onSubmit={(event) => onSubmit(event, item)}>
      <p className="cart-editor-title">
        <span>✏️</span> Edit Tour Details & Add-ons
      </p>
      <div className="editor-grid">
        <div className="editor-field">
          <label>{copy.date}</label>
          <FlowbiteDatepicker
            id={`startDate-${itemId}`}
            name="startDate"
            defaultValue={String(item.start_date || "").slice(0, 10)}
            placeholder={copy.date}
            minDate={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div className="editor-field">
          <label htmlFor={`adults-${itemId}`}>{copy.adults} (12+)</label>
          <input
            id={`adults-${itemId}`}
            name="adults"
            type="number"
            min={1}
            defaultValue={item.adults || 1}
            aria-label={copy.adults}
          />
        </div>
        <div className="editor-field">
          <label htmlFor={`children-${itemId}`}>{copy.children} (3 - 11)</label>
          <input
            id={`children-${itemId}`}
            name="children"
            type="number"
            min={0}
            defaultValue={item.children || 0}
            aria-label={copy.children}
          />
        </div>
        <div className="editor-field">
          <label htmlFor={`infants-${itemId}`}>{copy.infants} (0 - 2)</label>
          <input
            id={`infants-${itemId}`}
            name="infants"
            type="number"
            min={0}
            defaultValue={item.infants || 0}
            aria-label={copy.infants}
          />
        </div>
      </div>
      {options.length ? (
        <fieldset className="cart-option-fieldset">
          <legend>{copy.addOns}</legend>
          <div className="tour-addon-list">
            {options.map((option) => {
              const adultPrice = Number(option?.adult_price || 0);
              const childPrice = Number(option?.child_price || 0);
              return (
                <label key={option.id} className="tour-addon">
                  <input
                    name="options"
                    type="checkbox"
                    value={option.id}
                    defaultChecked={selectedOptionIds.includes(Number(option.id))}
                  />
                  <div className="tour-addon-content">
                    <span className="tour-addon-name">{option.name}</span>
                    <span className="tour-addon-price">
                      {format(adultPrice)} {copy.adults}
                      {childPrice ? ` · ${format(childPrice)} ${copy.children}` : ""}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <div className="editor-actions">
        <button className="btn-save-edits" type="submit" disabled={disabled}>
          {copy.saveEdits}
        </button>
        {onCancel && (
          <button className="btn-cancel-edit" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function CartFlow({ checkout = false, locale = "en" }: { checkout?: boolean; locale?: Locale }) {
  const router = useRouter();
  const copy = uiCopy(locale);
  const { selected, format } = useCurrency();
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [hasToken, setHasToken] = useState(false);
  const [coupon, setCoupon] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"card" | "paypal">("card");

  async function loadCart(tokenExists = hasToken) {
    setState("loading");
    try {
      const res = await apiGet<ApiResponse<any[]>>("cart/list", locale, tokenExists);
      setCart(Array.isArray(res.data) ? res.data : []);
      setState("success");
    } catch (error) {
      setState("error");
      setMessage(messageFromError(error, copy.messageError));
    }
  }

  useEffect(() => {
    const tokenExists = !!getCookie("sunpyramids-token");
    queueMicrotask(() => setHasToken(tokenExists));
    const raw = getCookie("sunpyramids-checkout-data");
    if (raw) {
      try {
        queueMicrotask(() => setCheckoutData(JSON.parse(raw)));
      } catch {
        queueMicrotask(() => setCheckoutData(null));
      }
    }
    queueMicrotask(() => loadCart(tokenExists));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout, locale]);

  async function clearCart() {
    setState("loading");
    try {
      const res = await apiDelete<ApiResponse>("cart/clear", locale);
      setCart([]);
      setState("success");
      setMessage(res.message || copy.clearAll);
    } catch (error) {
      setState("error");
      setMessage(messageFromError(error, copy.messageError));
    }
  }

  async function removeCartItem(item: any) {
    const removeId = cartRemoveIdentifier(item);
    if (!removeId) {
      setState("error");
      setMessage(copy.messageError);
      return;
    }
    setState("loading");
    try {
      const res = await apiDelete<ApiResponse>(`cart/remove/${removeId}`, locale, true);
      await loadCart(hasToken);
      setMessage(res.message || copy.delete);
    } catch (error) {
      setState("error");
      setMessage(messageFromError(error, copy.messageError));
    }
  }

  async function editTourCartItem(event: FormEvent<HTMLFormElement>, item: any) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tourId = item?.tour?.id;
    if (!tourId) return;
    setState("loading");
    try {
      const options = form.getAll("options")
        .map((value) => Number(value))
        .filter(Boolean);
      const res = await apiPost<ApiResponse>("cart/tours/append", {
        tour_id: tourId,
        start_date: String(form.get("startDate") || item.start_date || ""),
        adults: Number(form.get("adults") || item.adults || 1),
        children: Number(form.get("children") || item.children || 0),
        infants: Number(form.get("infants") || item.infants || 0),
        options,
      }, locale, hasToken);
      await loadCart(hasToken);
      setEditingItemId(null);
      setMessage(res.message || copy.saveEdits);
    } catch (error) {
      setState("error");
      setMessage(messageFromError(error, copy.messageError));
    }
  }

  function clearValidatedCoupon() {
    setCoupon(null);
    const nextCheckoutData = { ...(checkoutData || {}) };
    delete nextCheckoutData.discountID;
    setCheckoutData(nextCheckoutData);
    setCookie("sunpyramids-checkout-data", JSON.stringify(nextCheckoutData));
  }

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!getCookie("sunpyramids-token")) {
      setState("error");
      setMessage(copy.signIn);
      return;
    }
    const code = couponCode.trim();
    if (!code) return;
    setState("loading");
    try {
      const res = await apiGet<ApiResponse>(`coupons/${encodeURIComponent(code)}/validate`, locale, true);
      const couponId = couponIdFrom(res.data);
      if (!couponId) {
        clearValidatedCoupon();
        throw new Error(copy.messageError);
      }
      setCoupon(res.data);
      const nextCheckoutData = { ...(checkoutData || {}), discountID: couponId };
      setCheckoutData(nextCheckoutData);
      setCookie("sunpyramids-checkout-data", JSON.stringify(nextCheckoutData));
      setState("success");
      setMessage(res.message || copy.discount);
    } catch (error) {
      clearValidatedCoupon();
      setState("error");
      setMessage(messageFromError(error, copy.messageError));
    }
  }

  async function checkoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setState("error");
      setMessage("Currency options are temporarily unavailable. Please try again before checkout.");
      return;
    }
    setState("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") || "");
    const [firstName, ...lastParts] = fullName.split(" ");
    const paymentMethod = String(form.get("paymentMethod") || "card");
    const body: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastParts.join(" ") || "none",
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      country: String(form.get("country") || ""),
      state: String(form.get("state") || ""),
      pickup_location: String(form.get("pickupLocation") || ""),
      notes: String(form.get("note") || ""),
      payment_method: paymentMethod,
      currency_id: selected.id,
      coupon_id: couponIdFrom(coupon) || checkoutData?.discountID || undefined,
    };
    if (paymentMethod === "card") {
      body.payment_method_id = CARD_PAYMENT_METHOD_ID;
    }
    let bookingCreated = false;

    try {
      const res = await apiPost<ApiResponse<{ payment?: { redirect?: { location?: string } }; booking?: { id?: number } }>>("bookings", body, locale, true);
      const bookingId = res.data?.booking?.id;
      bookingCreated = !!bookingId;
      const redirect = res.data?.payment?.redirect?.location;
      if (redirect && isAllowedPaymentRedirect(redirect)) {
        window.location.href = redirect;
        return;
      }
      if (redirect) throw new Error("Payment redirect URL was not approved.");
      setState("success");
      setMessage(res.message || copy.checkout);
    } catch (error) {
      if (bookingCreated) {
        setState("error");
        setMessage(copy.messageError);
        return;
      }
      setState("error");
      setMessage(messageFromError(error, copy.messageError));
    }
  }

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (cartItemTotal(item) ?? 0), 0);
  }, [cart]);

  const discountPercent = Number(coupon?.value || 0);
  const discountAmount = discountPercent > 0 ? subtotal * (discountPercent / 100) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const orderSummaryAside = (
    <aside className="commerce-aside">
      <div className="order-summary-card">
        <div className="summary-header">
          <h2>{copy.summary}</h2>
          <span className="summary-item-badge">
            {cart.length} {cart.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        {cart.length > 0 ? (
          <div className="summary-items-list">
            {cart.map((item, idx) => {
              const itemTotal = cartItemTotal(item);
              const title = item.tour?.title || item.title || item.name || `${copy.cart} ${idx + 1}`;
              const travelersText = `${item.adults || 1} ${copy.adults}${item.children ? `, ${item.children} ${copy.children}` : ""}`;
              return (
                <div key={item.id || idx} className="summary-item-row">
                  <div className="item-info">
                    <span className="item-name">{title}</span>
                    <span className="item-sub">
                      {item.start_date ? String(item.start_date).slice(0, 10) + " · " : ""}
                      {travelersText}
                    </span>
                  </div>
                  <div className="item-price">
                    {itemTotal !== null ? format(itemTotal) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="summary-calculations">
          <div className="calc-row">
            <span>{copy.subtotal}</span>
            <strong>{format(subtotal)}</strong>
          </div>

          {discountAmount > 0 ? (
            <div className="calc-row discount-row">
              <span>{copy.discount} ({discountPercent}%)</span>
              <strong>-{format(discountAmount)}</strong>
            </div>
          ) : null}

          <div className="calc-divider" />

          <div className="total-row">
            <div className="total-label">
              <strong>{copy.total}</strong>
            </div>
            <span className="total-amount">{format(grandTotal)}</span>
          </div>
        </div>

        {cart.length > 0 ? (
          <div className="summary-coupon-area">
            <form className="coupon-input-group" onSubmit={applyCoupon}>
              <input
                name="couponCode"
                placeholder={copy.addCouponCode}
                value={couponCode}
                onChange={(event) => {
                  if (coupon || checkoutData?.discountID) clearValidatedCoupon();
                  setCouponCode(event.target.value);
                }}
                aria-label={copy.addCouponCode}
              />
              <button
                className="btn-apply-coupon"
                type="submit"
                disabled={state === "loading" || !couponCode.trim()}
              >
                {copy.apply}
              </button>
            </form>
            {coupon?.value ? (
              <div className="applied-coupon-pill">
                <span>✓ {copy.discount} {coupon.value}%</span>
              </div>
            ) : null}
            {state === "error" && message && !checkout ? (
              <p className="coupon-error-text" role="alert">{message}</p>
            ) : null}
          </div>
        ) : null}

        {!checkout && cart.length > 0 ? (
          <div className="summary-actions-area">
            <Link className="btn-proceed-checkout" href={withLocale("/cart/checkout", locale)}>
              {copy.checkout} →
            </Link>
          </div>
        ) : null}

        <div className="summary-concierge-help">
          <span className="concierge-title">{copy.contactInfo}</span>
          <div className="concierge-links">
            <a
              href={siteContact.whatsapp.contactUrl}
              target="_blank"
              rel="noreferrer"
              className="whatsapp-link"
              aria-label={`WhatsApp ${siteContact.whatsapp.display}`}
            >
              <span>💬 WhatsApp</span>
            </a>
            <span>·</span>
            {siteContact.phones[0] ? (
              <a href={siteContact.phones[0].href} aria-label={`Call ${siteContact.phones[0].display}`}>
                <span>📞 {siteContact.phones[0].display}</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );

  if (checkout) {
    return (
      <div className="commerce-layout">
        <div className="commerce-main">
          <form className="checkout-form-container" onSubmit={checkoutSubmit}>
            {/* Step 1: Lead Traveler */}
            <section className="checkout-section-card">
              <div className="section-header">
                <span className="step-number">1</span>
                <h2>{copy.billingDetails}</h2>
              </div>
              <div className="form-grid-two-col">
                <div className="form-group">
                  <label htmlFor="checkout-fullName">{copy.fullName} <span className="req">*</span></label>
                  <input id="checkout-fullName" name="fullName" placeholder={copy.fullName} required />
                </div>
                <div className="form-group">
                  <label htmlFor="checkout-email">{copy.email} <span className="req">*</span></label>
                  <input id="checkout-email" name="email" type="email" placeholder={copy.email} required />
                </div>
                <div className="form-group">
                  <label htmlFor="checkout-phone">{copy.phone} <span className="req">*</span></label>
                  <input id="checkout-phone" name="phone" type="tel" placeholder={copy.phone} required />
                </div>
                <div className="form-group">
                  <label htmlFor="checkout-country">{copy.country} <span className="req">*</span></label>
                  <input id="checkout-country" name="country" placeholder={copy.country} required />
                </div>
                <div className="form-group">
                  <label htmlFor="checkout-state">{copy.state} <span className="req">*</span></label>
                  <input id="checkout-state" name="state" placeholder={copy.state} required />
                </div>
                <div className="form-group">
                  <label htmlFor="checkout-pickupLocation">{copy.pickupLocation}</label>
                  <input id="checkout-pickupLocation" name="pickupLocation" placeholder={copy.pickupLocation} />
                </div>
              </div>
            </section>

            {/* Step 2: Payment Method */}
            <section className="checkout-section-card">
              <div className="section-header">
                <span className="step-number">2</span>
                <h2>{copy.paymentMethod}</h2>
              </div>
              <div className="payment-methods-stack" role="radiogroup" aria-label={copy.paymentMethod}>
                <label className={`payment-method-card ${selectedPayment === "card" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={selectedPayment === "card"}
                    onChange={() => setSelectedPayment("card")}
                    required
                  />
                  <div className="payment-method-details">
                    <div className="payment-method-top">
                      <span className="method-name">{copy.card}</span>
                    </div>
                  </div>
                </label>

                <label className={`payment-method-card ${selectedPayment === "paypal" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={selectedPayment === "paypal"}
                    onChange={() => setSelectedPayment("paypal")}
                    required
                  />
                  <div className="payment-method-details">
                    <div className="payment-method-top">
                      <span className="method-name">{copy.paypal}</span>
                    </div>
                  </div>
                </label>
              </div>
            </section>

            {/* Step 3: Special Requests & Notes */}
            <section className="checkout-section-card">
              <div className="section-header">
                <span className="step-number">3</span>
                <h2>{copy.note}</h2>
              </div>
              <div className="form-group full-width">
                <label htmlFor="checkout-note">{copy.note}</label>
                <textarea
                  id="checkout-note"
                  name="note"
                  placeholder={copy.note}
                  rows={4}
                />
              </div>
            </section>

            {/* Submit Action Bar */}
            <div className="checkout-submit-bar">
              <button
                className="btn-checkout-submit"
                type="submit"
                disabled={state === "loading" || !selected}
              >
                {state === "loading" ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>{copy.checkoutLoading}</span>
                  </>
                ) : (
                  <span>{copy.checkoutNow} →</span>
                )}
              </button>

              {!selected && state !== "loading" ? (
                <div className="checkout-error-banner" role="alert">
                  Currency options are temporarily unavailable. Checkout is paused.
                </div>
              ) : null}

              {message && state === "error" ? (
                <div className="checkout-error-banner" role="alert">
                  {message}
                </div>
              ) : null}
            </div>
          </form>
        </div>

        {orderSummaryAside}
      </div>
    );
  }

  return (
    <div className="commerce-layout">
      <div className="commerce-main">
        {state === "loading" && cart.length === 0 ? (
          <div className="cart-empty-card">
            <p className="muted">{copy.loadingCart}</p>
          </div>
        ) : null}

        {state !== "loading" && cart.length === 0 ? (
          <div className="cart-empty-card">
            <div className="cart-empty-icon" aria-hidden="true">🛒</div>
            <h2>{copy.cart}</h2>
            <p className="muted">{copy.emptyCart}</p>
            <Link className="btn-explore-tours" href={withLocale("/trips", locale)}>
              {copy.exploreTours} →
            </Link>
          </div>
        ) : null}

        {cart.length > 0 ? (
          <>
            <div className="cart-header-bar">
              <div className="cart-count-badge">
                <span>{copy.cart}</span>
                <span className="count-pill">{cart.length}</span>
              </div>
              <button
                className="btn-clear-cart"
                type="button"
                onClick={clearCart}
                disabled={state === "loading"}
              >
                <span>🗑️</span> {copy.clearAll}
              </button>
            </div>

            <div className="cart-items-stack" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {cart.map((item, index) => {
                const itemTotal = cartItemTotal(item);
                const isTour = item.type === "tour" || !!item.tour;
                const itemId = item.id || item.tour?.id || index;
                const isEditing = editingItemId === itemId;
                const title = item.tour?.title || item.title || item.name || `${copy.cart} ${index + 1}`;
                const imageSrc = item.tour?.image || item.image || "/images/Cairo_Egypt_Unsplash.png";
                const adults = Number(item.adults) || 1;
                const children = Number(item.children) || 0;
                const infants = Number(item.infants) || 0;

                return (
                  <article key={itemId} className="cart-item-card">
                    <div className="cart-item-main">
                      <div className="cart-item-thumb">
                        <Image
                          src={imageSrc}
                          alt={title}
                          width={140}
                          height={100}
                          style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                      </div>

                      <div className="cart-item-info">
                        <span className="cart-item-badge">
                          {isTour ? copy.tours : copy.rentCar}
                        </span>
                        <h2 className="cart-item-title">
                          {item.tour?.slug ? (
                            <Link href={withLocale(`/tours/${item.tour.slug}`, locale)}>
                              {title}
                            </Link>
                          ) : (
                            <span>{title}</span>
                          )}
                        </h2>

                        <div className="cart-item-meta">
                          {item.start_date ? (
                            <span className="meta-chip">
                              📅 {String(item.start_date).slice(0, 10)}
                            </span>
                          ) : null}
                          <span className="meta-chip">
                            👥 {adults} {copy.adults}
                            {children ? `, ${children} ${copy.children}` : ""}
                            {infants ? `, ${infants} ${copy.infants}` : ""}
                          </span>
                        </div>

                        {Array.isArray(item.options) && item.options.length > 0 ? (
                          <div className="cart-item-options-list">
                            {item.options.map((opt: any) => (
                              <span key={opt.id} className="option-tag">
                                + {opt.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="cart-item-pricing">
                        <span className="price-amount">
                          {itemTotal !== null ? format(itemTotal) : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="cart-item-actions-bar">
                      {isTour ? (
                        <button
                          className="btn-toggle-editor"
                          type="button"
                          onClick={() => setEditingItemId(isEditing ? null : itemId)}
                          aria-expanded={isEditing}
                        >
                          <span>{isEditing ? copy.back : copy.addOns}</span>
                          <span className={`chevron-icon ${isEditing ? "is-open" : ""}`} aria-hidden="true">▾</span>
                        </button>
                      ) : <span />}

                      <button
                        className="btn-remove-item"
                        type="button"
                        onClick={() => removeCartItem(item)}
                        disabled={state === "loading"}
                        aria-label={`${copy.delete} ${title}`}
                      >
                        <span>✕</span> {copy.delete}
                      </button>
                    </div>

                    {isTour && isEditing ? (
                      <CartTourEditor
                        item={item}
                        locale={locale}
                        disabled={state === "loading"}
                        onSubmit={editTourCartItem}
                        onCancel={() => setEditingItemId(null)}
                      />
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        ) : null}

        {message && state !== "error" ? (
          <p className="form-message" style={{ marginTop: "1rem" }}>{message}</p>
        ) : null}
      </div>

      {orderSummaryAside}
    </div>
  );
}

export async function toggleWishlist(tourId: number | string, locale: Locale = "en") {
  if (!getCookie("sunpyramids-token")) {
    throw new Error("Please login to like the tour");
  }
  return apiPut<ApiResponse>(`wishlist/${tourId}/toggle`, locale, true);
}

export function PlannerRequestFlow({ route, locale = "en" }: { route: "make-your-trip" | "rent-car"; locale?: Locale }) {
  const router = useRouter();
  const { selected } = useCurrency();
  const copy = uiCopy(locale);
  const isCar = route === "rent-car";

  // Interactive Form State (defaults matching baseline)
  const [tripType, setTripType] = useState<"exact_time" | "approx_time" | "not_sure">("exact_time");
  const [carType, setCarType] = useState<"oneWay" | "roundTrip">("oneWay");
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);

  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [routeMessage, setRouteMessage] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const [countryRes, locationRes] = await Promise.all([
          apiGet<ApiResponse<any[]>>("countries", locale, false),
          isCar ? apiGet<ApiResponse<{ data?: any[] }>>("locations?page_limit=200&order_by=id,asc", locale, false) : Promise.resolve(null),
        ]);
        setCountries(Array.isArray(countryRes.data) ? countryRes.data : []);
        if (locationRes) setLocations(Array.isArray(locationRes.data?.data) ? locationRes.data.data : []);
      } catch {
        setCountries([]);
        setLocations([]);
      }
    }
    loadOptions();
  }, [isCar, locale]);

  async function loadRentalDestinations(pickupId: string) {
    setPickupLocationId(pickupId);
    setRouteMessage("");
    if (!pickupId) {
      setDestinations([]);
      setDestinationId("");
      return;
    }
    try {
      const res = await apiPost<ApiResponse<any[]>>("car/rental/available/destinations", {
        pickup_location_id: Number(pickupId),
      }, locale);
      setDestinations(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDestinations([]);
    }
  }

  async function loadRentalRoute(destId: string) {
    setDestinationId(destId);
    setRouteMessage("");
    if (!pickupLocationId || !destId) return;
    try {
      const res = await apiPost<ApiResponse>("car/rental/search/for/route", {
        pickup_location_id: Number(pickupLocationId),
        destination_id: Number(destId),
      }, locale);
      setRouteMessage(res.message || "Rental route is available.");
    } catch (error) {
      setRouteMessage(messageFromError(error));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      if (isCar) {
        if (!selected) {
          throw new Error("Currency options are temporarily unavailable. Please try again before booking a rental.");
        }
        const returnDate = String(form.get("returnDate") || "");
        const returnTime = String(form.get("returnTime") || "");
        if (form.get("type") === "roundTrip" && (!returnDate || !returnTime)) {
          throw new Error("Return date and time are required for round trips.");
        }
        const pickupId = String(form.get("pickupLocationId") || "");
        const dropId = String(form.get("destinationId") || "");
        await apiPost<ApiResponse>("car/rental/search/for/route", {
          pickup_location_id: Number(pickupId),
          destination_id: Number(dropId),
        }, locale);
        const body: Record<string, unknown> = {
          pickup_location_id: pickupId,
          destination_id: dropId,
          pickup_date: String(form.get("pickupDate") || ""),
          pickup_time: String(form.get("pickupTime") || ""),
          oneway: form.get("type") !== "roundTrip",
          adults: Number(form.get("adults") || 1),
          children: Number(form.get("children") || 0),
          name: String(form.get("fullName") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          currency_id: selected.id,
          nationality: String(form.get("nationality") || ""),
          stops: [],
        };
        if (returnDate) {
          body.return_date = returnDate;
          body.return_time = returnTime;
        }
        const res = await apiPost<ApiResponse>("cart/rentals/append", body, locale, !!getCookie("sunpyramids-token"));
        setState("success");
        setMessage(res.message || "Rental added to cart.");
        router.push(withLocale("/cart", locale));
        return;
      }

      const token = await generateRecaptchaToken("submit");
      const submittedTripType = String(form.get("type") || "exact_time");
      const fullName = String(form.get("fullName") || "").trim();
      const [firstName = "", ...lastNameParts] = fullName.split(/\s+/).filter(Boolean);
      const body: Record<string, unknown> = {
        destination: "egypt",
        type: submittedTripType,
        name: fullName,
        first_name: firstName || fullName,
        last_name: lastNameParts.join(" ") || "none",
        phone_number: String(form.get("phone") || ""),
        email: String(form.get("email") || ""),
        adults: Number(form.get("adults") || 1),
        children: Number(form.get("children") || 0),
        infants: Number(form.get("infants") || 0),
        nationality: String(form.get("nationality") || ""),
        min_person_budget: Number(form.get("minBudget") || 1000),
        max_person_budget: Number(form.get("maxBudget") || 3000),
        flight_offer: form.get("flightOffer") === "on",
        additional_notes: String(form.get("note") || ""),
      };
      if (token) body.recaptcha_token = token;
      if (submittedTripType === "exact_time") {
        const startDate = String(form.get("startDate") || "");
        const endDate = String(form.get("endDate") || "");
        if (!startDate || !endDate) {
          throw new Error("Start and end dates are required for exact time trips.");
        }
        body.start_date = startDate;
        body.end_date = endDate;
      } else if (submittedTripType === "approx_time") {
        const month = String(form.get("month") || "");
        const days = Number(form.get("days") || 0);
        if (!month) {
          throw new Error("Month is required for approximate time trips.");
        }
        if (!days || days < 1) {
          throw new Error("Days must be a valid number of days.");
        }
        body.month = month;
        body.days = days;
      } else {
        const days = Number(form.get("days") || 0);
        if (!days || days < 1) {
          throw new Error("Days must be a valid number of days.");
        }
        body.days = days;
      }
      await apiPost<ApiResponse>("custom/trips", body, locale, !!getCookie("sunpyramids-token"));
      setState("success");
      router.push(`${withLocale("/thankful", locale)}?name=${encodeURIComponent(String(form.get("fullName") || ""))}`);
    } catch (error) {
      setState("error");
      setMessage(messageFromError(error));
    }
  }

  return (
    <form className="planner-form-card" onSubmit={submit} aria-busy={state === "loading"}>
      <div className="planner-card-header">
        <h2>{isCar ? "Private Chauffeur & Vehicle Reservation" : "Design Your Tailored Egypt Itinerary"}</h2>
        <p>
          {isCar
            ? "Reserve licensed, air-conditioned Egypt vehicles with professional English-speaking drivers."
            : "Direct private planning with our Cairo operations specialists. Every detail customized to your pace."}
        </p>
      </div>

      {/* Step 1: Scheduling / Route Setup */}
      <fieldset className="planner-step-group">
        <legend>
          <span className="step-badge" aria-hidden="true">1</span>
          <span>{isCar ? "Transfer Route & Schedule" : "Trip Type & Scheduling"}</span>
        </legend>

        {isCar ? (
          <>
            <div className="planner-segmented-control" role="radiogroup" aria-label={copy.tripType || "Transfer Type"}>
              <label className={`segmented-radio-label ${carType === "oneWay" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="type"
                  value="oneWay"
                  checked={carType === "oneWay"}
                  onChange={() => setCarType("oneWay")}
                />
                <span className="option-title">{copy.oneWay || "One Way"}</span>
                <span className="option-caption">Single transfer</span>
              </label>

              <label className={`segmented-radio-label ${carType === "roundTrip" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="type"
                  value="roundTrip"
                  checked={carType === "roundTrip"}
                  onChange={() => setCarType("roundTrip")}
                />
                <span className="option-title">{copy.roundTrip || "Round Trip"}</span>
                <span className="option-caption">Return service</span>
              </label>
            </div>

            <div className="planner-input-grid">
              <div className="planner-field">
                <label htmlFor="planner-pickup-loc">
                  <span>{copy.pickupLocation || "Pickup Location"}<span className="required-mark">*</span></span>
                </label>
                <div className="input-wrap">
                  <SearchSelectDropdown
                    id="planner-pickup-loc"
                    name="pickupLocationId"
                    required
                    value={pickupLocationId}
                    placeholder={copy.pickupLocation || "Choose Pickup City or Terminal"}
                    variant="boxed"
                    iconType="location"
                    menuTitle={copy.pickupLocation || "Pickup Location"}
                    options={locations.map((loc) => ({
                      value: String(loc.id),
                      label: String(loc.name),
                    }))}
                    onChange={(val) => loadRentalDestinations(val)}
                  />
                </div>
              </div>

              <div className="planner-field">
                <label htmlFor="planner-drop-loc">
                  <span>{copy.dropoffLocation || "Destination / Dropoff"}<span className="required-mark">*</span></span>
                </label>
                <div className="input-wrap">
                  <SearchSelectDropdown
                    id="planner-drop-loc"
                    name="destinationId"
                    required
                    value={destinationId}
                    disabled={!pickupLocationId || destinations.length === 0}
                    placeholder={
                      !pickupLocationId
                        ? "Select pickup location first"
                        : destinations.length === 0
                        ? "Loading destinations..."
                        : copy.dropoffLocation || "Choose Destination City"
                    }
                    variant="boxed"
                    iconType="location"
                    menuTitle={copy.dropoffLocation || "Dropoff Location"}
                    options={destinations.map((dest) => ({
                      value: String(dest.id),
                      label: String(dest.name),
                    }))}
                    onChange={(val) => loadRentalRoute(val)}
                  />
                </div>
                {routeMessage && (
                  <p className={`route-feedback ${routeMessage.includes("available") ? "is-available" : "is-unavailable"}`}>
                    {routeMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="planner-input-grid" style={{ marginTop: "1.25rem" }}>
              <div className="planner-field">
                <label htmlFor="planner-pickup-date">
                  <span>{copy.pickupDate || "Pickup Date"}<span className="required-mark">*</span></span>
                </label>
                <div className="input-wrap">
                  <FlowbiteDatepicker
                    id="planner-pickup-date"
                    name="pickupDate"
                    placeholder={copy.pickupDate || "Pickup Date"}
                    minDate={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="planner-field">
                <label htmlFor="planner-pickup-time">
                  <span>Pickup Time<span className="required-mark">*</span></span>
                </label>
                <div className="input-wrap">
                  <input
                    id="planner-pickup-time"
                    name="pickupTime"
                    type="time"
                    required
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {}
                    }}
                  />
                </div>
              </div>
            </div>

            {carType === "roundTrip" && (
              <div className="planner-input-grid" style={{ marginTop: "1.25rem" }}>
                <div className="planner-field">
                  <label htmlFor="planner-return-date">
                    <span>{copy.returnDate || "Return Date"}<span className="required-mark">*</span></span>
                  </label>
                  <div className="input-wrap">
                    <FlowbiteDatepicker
                      id="planner-return-date"
                      name="returnDate"
                      placeholder={copy.returnDate || "Return Date"}
                      minDate={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>

                <div className="planner-field">
                  <label htmlFor="planner-return-time">
                    <span>Return Time<span className="required-mark">*</span></span>
                  </label>
                  <div className="input-wrap">
                    <input
                      id="planner-return-time"
                      name="returnTime"
                      type="time"
                      required
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker?.();
                        } catch {}
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="planner-segmented-control" role="radiogroup" aria-label="Trip timing preference">
              <label className={`segmented-radio-label ${tripType === "exact_time" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="type"
                  value="exact_time"
                  checked={tripType === "exact_time"}
                  onChange={() => setTripType("exact_time")}
                />
                <span className="option-title">Exact time</span>
                <span className="option-caption">Confirmed dates</span>
              </label>

              <label className={`segmented-radio-label ${tripType === "approx_time" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="type"
                  value="approx_time"
                  checked={tripType === "approx_time"}
                  onChange={() => setTripType("approx_time")}
                />
                <span className="option-title">Approximate time</span>
                <span className="option-caption">Approximate window</span>
              </label>

              <label className={`segmented-radio-label ${tripType === "not_sure" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="type"
                  value="not_sure"
                  checked={tripType === "not_sure"}
                  onChange={() => setTripType("not_sure")}
                />
                <span className="option-title">Not sure</span>
                <span className="option-caption">Still exploring</span>
              </label>
            </div>

            {tripType === "exact_time" && (
              <div className="planner-input-grid">
                <div className="planner-field">
                  <label htmlFor="planner-start-date">
                    <span>Start / Arrival Date<span className="required-mark">*</span></span>
                  </label>
                  <div className="input-wrap">
                    <FlowbiteDatepicker
                      id="planner-start-date"
                      name="startDate"
                      placeholder="Start / Arrival Date"
                      minDate={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>

                <div className="planner-field">
                  <label htmlFor="planner-end-date">
                    <span>End / Departure Date<span className="required-mark">*</span></span>
                  </label>
                  <div className="input-wrap">
                    <FlowbiteDatepicker
                      id="planner-end-date"
                      name="endDate"
                      placeholder="End / Departure Date"
                      minDate={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {tripType === "approx_time" && (
              <div className="planner-input-grid">
                <div className="planner-field">
                  <label htmlFor="planner-month">
                    <span>Target Month / Year<span className="required-mark">*</span></span>
                  </label>
                  <div className="input-wrap">
                    <FlowbiteDatepicker
                      id="planner-month"
                      name="month"
                      placeholder="Select month and year"
                      minDate={new Date().toISOString().split("T")[0]}
                      required
                      selectionMode="month"
                    />
                  </div>
                </div>

                <div className="planner-field">
                  <label htmlFor="planner-days">
                    <span>Estimated Duration (Days)<span className="required-mark">*</span></span>
                  </label>
                  <div className="input-wrap">
                    <input
                      id="planner-days"
                      name="days"
                      type="number"
                      min={1}
                      placeholder="e.g. 10"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {tripType === "not_sure" && (
              <div className="planner-input-grid planner-input-grid--single">
                <div className="planner-field">
                  <label htmlFor="planner-days-open">
                    <span>Desired Trip Length (Days)<span className="required-mark">*</span></span>
                  </label>
                  <div className="input-wrap">
                    <input
                      id="planner-days-open"
                      name="days"
                      type="number"
                      min={1}
                      placeholder="e.g. 7, 10, or 14"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </fieldset>

      {/* Step 2: Party & Budget Details */}
      <fieldset className="planner-step-group">
        <legend>
          <span className="step-badge" aria-hidden="true">2</span>
          <span>{isCar ? "Passengers & Vehicle Capacity" : "Travelers & Budget Preferences"}</span>
        </legend>

        <div className="planner-travelers-card">
          <div className="traveler-counter-item">
            <div className="counter-info">
              <strong>Adults</strong>
              <span>Age 12+</span>
            </div>
            <div className="counter-actions">
              <button
                type="button"
                aria-label="Decrease adults"
                disabled={adults <= 1}
                onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
              >
                &minus;
              </button>
              <span className="count-display" aria-live="polite">{adults}</span>
              <button
                type="button"
                aria-label="Increase adults"
                onClick={() => setAdults((prev) => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className="traveler-counter-item">
            <div className="counter-info">
              <strong>Children</strong>
              <span>Age 2&ndash;11</span>
            </div>
            <div className="counter-actions">
              <button
                type="button"
                aria-label="Decrease children"
                disabled={children <= 0}
                onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
              >
                &minus;
              </button>
              <span className="count-display" aria-live="polite">{children}</span>
              <button
                type="button"
                aria-label="Increase children"
                onClick={() => setChildren((prev) => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          {!isCar && (
            <div className="traveler-counter-item">
              <div className="counter-info">
                <strong>Infants</strong>
                <span>Under 2</span>
              </div>
              <div className="counter-actions">
                <button
                  type="button"
                  aria-label="Decrease infants"
                  disabled={infants <= 0}
                  onClick={() => setInfants((prev) => Math.max(0, prev - 1))}
                >
                  &minus;
                </button>
                <span className="count-display" aria-live="polite">{infants}</span>
                <button
                  type="button"
                  aria-label="Increase infants"
                  onClick={() => setInfants((prev) => prev + 1)}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden inputs to preserve FormData parity */}
        <input type="hidden" name="adults" value={adults} />
        <input type="hidden" name="children" value={children} />
        {!isCar && <input type="hidden" name="infants" value={infants} />}

        {!isCar && (
          <div className="planner-input-grid" style={{ marginTop: "1.25rem" }}>
            <div className="planner-field">
              <label htmlFor="planner-min-budget">
                <span>Estimated Budget Min (USD / person)</span>
              </label>
              <div className="input-wrap">
                <input
                  id="planner-min-budget"
                  name="minBudget"
                  type="number"
                  min={0}
                  defaultValue={1000}
                />
              </div>
            </div>

            <div className="planner-field">
              <label htmlFor="planner-max-budget">
                <span>Estimated Budget Max (USD / person)</span>
              </label>
              <div className="input-wrap">
                <input
                  id="planner-max-budget"
                  name="maxBudget"
                  type="number"
                  min={0}
                  defaultValue={3000}
                />
              </div>
            </div>
          </div>
        )}

        {!isCar && (
          <label className="planner-checkbox-label" style={{ marginTop: "1rem" }}>
            <input name="flightOffer" type="checkbox" />
            <span>I would like Sun Pyramids to assist with domestic & international flight options</span>
          </label>
        )}
      </fieldset>

      {/* Step 3: Contact & Special Requests */}
      <fieldset className="planner-step-group">
        <legend>
          <span className="step-badge" aria-hidden="true">3</span>
          <span>Lead Guest & Contact Details</span>
        </legend>

        <div className="planner-input-grid">
          <div className="planner-field">
            <label htmlFor="planner-fullname">
              <span>{copy.fullName || "Full Name"}<span className="required-mark">*</span></span>
            </label>
            <div className="input-wrap">
              <input
                id="planner-fullname"
                name="fullName"
                placeholder="Jane Doe"
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="planner-field">
            <label htmlFor="planner-email">
              <span>{copy.email || "Email Address"}<span className="required-mark">*</span></span>
            </label>
            <div className="input-wrap">
              <input
                id="planner-email"
                name="email"
                type="email"
                placeholder="jane@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>
        </div>

        <div className="planner-input-grid" style={{ marginTop: "1.25rem" }}>
          <div className="planner-field">
            <label htmlFor="planner-phone">
              <span>{copy.phone || "Phone Number"}<span className="required-mark">*</span></span>
              <span className="field-hint">With country code</span>
            </label>
            <div className="input-wrap">
              <input
                id="planner-phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <div className="planner-field">
            <label htmlFor="planner-nationality">
              <span>{copy.nationality || "Nationality"}<span className="required-mark">*</span></span>
            </label>
            <div className="input-wrap">
              <SearchSelectDropdown
                id="planner-nationality"
                name="nationality"
                required
                defaultValue=""
                placeholder={copy.nationality || "Select your country"}
                variant="boxed"
                iconType="country"
                searchable
                menuTitle={copy.nationality || "Select Country / Nationality"}
                options={countries.map((country) => ({
                  value: String(country.name),
                  label: String(country.name),
                }))}
              />
            </div>
          </div>
        </div>

        {!isCar && (
          <div className="planner-field" style={{ marginTop: "1.25rem" }}>
            <label htmlFor="planner-note">
              <span>Special Wishes, Preferred Sites or Dietary Requirements</span>
            </label>
            <div className="input-wrap">
              <textarea
                id="planner-note"
                name="note"
                placeholder="Tell us about places you want to visit (e.g. Abu Simbel, Nile Cruise, White Desert), pace of travel, or any specific interests..."
                rows={4}
              />
            </div>
          </div>
        )}
      </fieldset>

      {/* Submit Bar */}
      <div className="planner-submit-bar">
        <button
          className="btn-submit-planner"
          type="submit"
          disabled={state === "loading"}
        >
          {state === "loading" ? (
            <span>Securing Request...</span>
          ) : (
            <>
              <span>{isCar ? (copy.addToCart || "Book Private Transfer") : "Request Custom Itinerary"}</span>
              <ArrowRight aria-hidden="true" size={19} strokeWidth={2.25} />
            </>
          )}
        </button>

        {message && (
          <div
            className={`status-alert ${state === "error" ? "is-error" : "is-success"}`}
            role="alert"
            aria-live="polite"
          >
            {message}
          </div>
        )}
      </div>
    </form>
  );
}
