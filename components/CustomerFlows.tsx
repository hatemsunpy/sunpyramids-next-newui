"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
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

  const isPasswordMode = mode.includes("password") || mode === "sign-in" || mode === "sign-up";

  return (
    <div className="auth-form-wrap">
      <p className="eyebrow">Sun Pyramids Tours</p>
      <h1>{title}</h1>
      {mode === "sign-in" || mode === "sign-up" ? (
        <div className="social-row">
          <button type="button" onClick={() => socialRedirect("auth/google/redirect")}>Google</button>
          <button type="button" onClick={() => socialRedirect("auth/facebook/redirect")}>Facebook</button>
        </div>
      ) : null}
      <form className="auth-form" onSubmit={submit}>
        {mode === "sign-up" ? <input name="name" placeholder={copy.fullName} required /> : null}
        {mode === "confirm-code" || mode === "create-password" || mode === "reset-password" ? (
          <input name="email" type="email" placeholder={copy.email} defaultValue={params.get("email") || ""} required />
        ) : null}
        {mode === "sign-in" || mode === "sign-up" || mode === "forget-password" ? (
          <input name="email" type="email" placeholder={copy.email} defaultValue={mode === "sign-in" ? rememberEmail : ""} required />
        ) : null}
        {mode === "confirm-code" ? <input name="otp" placeholder="Confirmation code" inputMode="numeric" minLength={6} maxLength={6} required /> : null}
        {mode === "reset-password" ? <input name="token" placeholder="Reset token" defaultValue={params.get("token") || ""} required /> : null}
        {mode === "create-password" ? <input name="otp" placeholder="Confirmation code" defaultValue={params.get("otp") || ""} required /> : null}
        {isPasswordMode ? <input name="password" type="password" placeholder={copy.password} minLength={8} required /> : null}
        {mode === "sign-up" || mode === "create-password" || mode === "reset-password" ? (
          <input name="confirmPassword" type="password" placeholder={copy.confirmPassword} minLength={8} required />
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
      {message ? <p className={statusClass(state)}>{message}</p> : null}
      <div className="auth-links">
        <Link href={withLocale("/auth/sign-in", locale)}>{copy.signIn}</Link>
        <Link href={withLocale("/auth/sign-up", locale)}>{copy.createAccount}</Link>
        <Link href={withLocale("/auth/forget-password", locale)}>{copy.forgetPassword}</Link>
      </div>
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
    <div className="account-card">
      <div className="account-card-head">
        <p className="eyebrow">Account area</p>
        {isAuthenticated ? <button className="btn-outline" type="button" onClick={logout}>{copy.signOut}</button> : null}
      </div>
      {!isAuthenticated ? (
        <>
          <h2>Sign in required</h2>
          <p className="muted">Sign in to sync your bookings, favourites, profile settings, and checkout activity.</p>
          <Link className="btn-primary" href={withLocale("/auth/sign-in", locale)}>{copy.signIn}</Link>
        </>
      ) : view === "settings" || view === "profile" ? (
        <div className="account-profile-forms">
        <form className="profile-image-form" onSubmit={uploadProfileImage}>
          {user?.image ? <Image src={String(user.image)} alt={String(user.name || copy.myProfile)} width={96} height={96} /> : null}
          <input name="image" type="file" accept="image/*" required />
          <button className="btn-outline" type="submit" disabled={state === "loading"}>Update profile image</button>
        </form>
        <form className="form-grid account-form" onSubmit={updateProfile}>
          <input name="fullName" placeholder={copy.fullName} defaultValue={user?.name || ""} required />
          <input name="email" type="email" placeholder={copy.email} defaultValue={user?.email || ""} readOnly aria-readonly="true" />
          <input name="phone" placeholder={copy.phone} defaultValue={user?.phone || ""} />
          <input name="birthDate" type="date" defaultValue={user?.birthdate || ""} />
          <input name="nationality" placeholder={copy.nationality} defaultValue={user?.nationality || ""} />
          <input name="password" type="password" placeholder={copy.password} minLength={8} />
          <input name="confirmPassword" type="password" placeholder={copy.confirmPassword} minLength={8} />
          <button className="btn-primary" type="submit" disabled={state === "loading"}>{copy.saveChanges}</button>
          {message ? <p className={statusClass(state)}>{message}</p> : null}
        </form>
        </div>
      ) : (
        <>
          <h2>{view === "bookings" ? copy.myBookings : copy.myFavorites}</h2>
          {state === "loading" ? <p className="muted">Loading...</p> : null}
          {state === "error" ? <p className="form-message error">{message}</p> : null}
          {state !== "loading" && items.length === 0 ? <p className="muted">{view === "bookings" ? "There are no bookings." : "The wishlist is empty."}</p> : null}
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
        </>
      )}
    </div>
  );
}

function CartTourEditor({
  item,
  locale,
  disabled,
  onSubmit,
}: {
  item: any;
  locale: Locale;
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>, item: any) => void;
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

  return (
    <form className="cart-inline-form" onSubmit={(event) => onSubmit(event, item)}>
      <input name="startDate" type="date" defaultValue={String(item.start_date || "").slice(0, 10)} aria-label={copy.date} />
      <input name="adults" type="number" min={1} defaultValue={item.adults || 1} aria-label={copy.adults} />
      <input name="children" type="number" min={0} defaultValue={item.children || 0} aria-label={copy.children} />
      <input name="infants" type="number" min={0} defaultValue={item.infants || 0} aria-label={copy.infants} />
      {options.length ? (
        <fieldset className="cart-option-fieldset">
          <legend>{copy.addOns}</legend>
          <div className="tour-addon-list">
            {options.map((option) => {
              const adultPrice = Number(option?.adult_price || 0);
              const childPrice = Number(option?.child_price || 0);
              return (
                <label key={option.id} className="tour-addon">
                  <input name="options" type="checkbox" value={option.id} defaultChecked={selectedOptionIds.includes(Number(option.id))} />
                  <span className="tour-addon-name">{option.name}</span>
                  <span className="tour-addon-price">
                    {format(adultPrice)} {copy.adults}
                    {childPrice ? ` · ${format(childPrice)} ${copy.children}` : ""}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <button className="btn-outline" type="submit" disabled={disabled}>{copy.saveEdits}</button>
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

  if (checkout) {
    return (
      <div className="cart-empty checkout-form-card">
        <p className="eyebrow">{copy.billingDetails}</p>
        <h2>{copy.checkout}</h2>
        <form className="form-grid" onSubmit={checkoutSubmit}>
          <input name="fullName" placeholder={copy.fullName} required />
          <input name="email" type="email" placeholder={copy.email} required />
          <input name="phone" placeholder={copy.phone} required />
          <input name="country" placeholder={copy.country} required />
          <input name="state" placeholder={copy.state} required />
          <input name="pickupLocation" placeholder={copy.pickupLocation} />
          <select name="paymentMethod" defaultValue="card" required aria-label={copy.paymentMethod}>
            <option value="card">{copy.card}</option>
            <option value="paypal">{copy.paypal}</option>
          </select>
          <textarea name="note" placeholder={copy.note} rows={4} />
          <button className="btn-primary" type="submit" disabled={state === "loading" || !selected}>{state === "loading" ? copy.checkoutLoading : copy.checkoutNow}</button>
        </form>
        {!selected && state !== "loading" ? <p className="form-message error">Currency options are temporarily unavailable. Checkout is paused.</p> : null}
        {message ? <p className={statusClass(state)}>{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="cart-empty">
      <p className="eyebrow">{copy.cart}</p>
      <h2>{copy.cart}</h2>
      {state === "loading" ? <p className="muted">{copy.loadingCart}</p> : null}
      {state === "error" ? <p className="form-message error">{message}</p> : null}
      {state !== "loading" && cart.length === 0 ? <p className="muted">{copy.emptyCart}</p> : null}
      {cart.length ? (
        <div className="account-list">
          {cart.map((item, index) => {
            const itemTotal = cartItemTotal(item);
            return (
            <article key={item.id || index}>
              <strong>{item.tour?.title || item.title || item.name || `${copy.cart} ${index + 1}`}</strong>
              {itemTotal !== null ? <span>{copy.total}: {format(itemTotal)}</span> : null}
              {item.type === "tour" || item.tour ? (
                <CartTourEditor item={item} locale={locale} disabled={state === "loading"} onSubmit={editTourCartItem} />
              ) : null}
              <button className="btn-outline" type="button" onClick={() => removeCartItem(item)} disabled={state === "loading"}>{copy.delete}</button>
            </article>
            );
          })}
        </div>
      ) : null}
      {cart.length ? (
        <form className="cart-inline-form" onSubmit={applyCoupon}>
          <input
            name="couponCode"
            placeholder={copy.addCouponCode}
            value={couponCode}
            onChange={(event) => {
              if (coupon || checkoutData?.discountID) clearValidatedCoupon();
              setCouponCode(event.target.value);
            }}
          />
          <button className="btn-outline" type="submit" disabled={state === "loading"}>{copy.apply}</button>
          {coupon?.value ? <span>{copy.discount}: {coupon.value}%</span> : null}
        </form>
      ) : null}
      <div className="status-actions">
        <Link className="btn-primary" href={withLocale("/trips", locale)}>{copy.exploreTours}</Link>
        {cart.length ? <Link className="btn-outline" href={withLocale("/cart/checkout", locale)}>{copy.checkout}</Link> : null}
        {cart.length ? <button className="btn-outline" type="button" onClick={clearCart}>{copy.clearAll}</button> : null}
      </div>
      {message && state !== "error" ? <p className="form-message">{message}</p> : null}
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
                  <select
                    id="planner-pickup-loc"
                    name="pickupLocationId"
                    required
                    value={pickupLocationId}
                    onChange={(e) => loadRentalDestinations(e.currentTarget.value)}
                  >
                    <option value="">{copy.pickupLocation || "Choose Pickup City or Terminal"}</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="planner-field">
                <label htmlFor="planner-drop-loc">
                  <span>{copy.dropoffLocation || "Destination / Dropoff"}<span className="required-mark">*</span></span>
                </label>
                <div className="input-wrap">
                  <select
                    id="planner-drop-loc"
                    name="destinationId"
                    required
                    value={destinationId}
                    disabled={!pickupLocationId || destinations.length === 0}
                    onChange={(e) => loadRentalRoute(e.currentTarget.value)}
                  >
                    <option value="">
                      {!pickupLocationId
                        ? "Select pickup location first"
                        : destinations.length === 0
                        ? "Loading destinations..."
                        : copy.dropoffLocation || "Choose Destination City"}
                    </option>
                    {destinations.map((dest) => (
                      <option key={dest.id} value={dest.id}>
                        {dest.name}
                      </option>
                    ))}
                  </select>
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
                  <input
                    id="planner-pickup-date"
                    name="pickupDate"
                    type="date"
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
                    <input
                      id="planner-return-date"
                      name="returnDate"
                      type="date"
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
                    <input
                      id="planner-start-date"
                      name="startDate"
                      type="date"
                      required
                    />
                  </div>
                </div>

                <div className="planner-field">
                  <label htmlFor="planner-end-date">
                    <span>End / Departure Date<span className="required-mark">*</span></span>
                  </label>
                  <div className="input-wrap">
                    <input
                      id="planner-end-date"
                      name="endDate"
                      type="date"
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
                    <input
                      id="planner-month"
                      name="month"
                      placeholder="e.g. November 2026"
                      required
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
              <select id="planner-nationality" name="nationality" required defaultValue="">
                <option value="" disabled>{copy.nationality || "Select your country"}</option>
                {countries.map((country) => (
                  <option key={country.id || country.name} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
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
            <span>{isCar ? (copy.addToCart || "Book Private Transfer") : "Request Custom Itinerary &rarr;"}</span>
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
