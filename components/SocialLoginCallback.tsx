"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/types/api";
import { setCookie } from "@/lib/client-api";
import { withLocale } from "@/lib/locales";
import { APPROVED_BRAND_LOGO } from "@/lib/site-contact";

export function SocialLoginCallback({ locale = "en" }: { locale?: Locale }) {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    const rawUser = params.get("user");
    if (!token || !rawUser) {
      queueMicrotask(() => setError("The social login response was incomplete."));
      return;
    }
    try {
      const user = JSON.parse(rawUser) as Record<string, unknown>;
      if (!user || typeof user !== "object") throw new Error("Invalid user payload");
      setCookie("sunpyramids-token", token);
      setCookie("sunpyramids-user", null);
      router.replace(withLocale("/", locale));
    } catch {
      queueMicrotask(() => setError("The social login response could not be verified."));
    }
  }, [locale, params, router]);

  return (
    <main className="social-auth-status">
      <section className="social-auth-panel" aria-busy={!error}>
        <Image src={APPROVED_BRAND_LOGO} alt="Sun Pyramids Tours" width={180} height={51} priority />
        <span className={error ? "social-auth-mark is-error" : "social-auth-mark"} aria-hidden="true" />
        <h1>{error ? "Social login failed" : "Completing social login"}</h1>
        <p className={error ? "form-message error" : "muted"} role={error ? "alert" : "status"}>{error || "Please wait while your session is created."}</p>
        {error ? <Link className="btn-primary" href={withLocale("/auth/sign-in", locale)}>Return to sign in</Link> : null}
      </section>
    </main>
  );
}
