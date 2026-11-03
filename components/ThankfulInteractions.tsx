"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProgressRouter as useRouter } from "@/components/useProgressRouter";
import {
  SENSITIVE_HANDOFF_KEYS,
  boundedHandoffText,
  clearSensitiveHandoff,
  readSensitiveHandoff,
  saveSensitiveHandoff,
} from "@/lib/analytics/sensitive-session";
import { stripQueryParamsOnSelf } from "@/lib/analytics/url-privacy";

// The greeting name comes from the tab-scoped handoff written by the form
// that produced the lead - never from a URL the app writes. Legacy inbound
// links with ?name= keep working: the fresh value OVERRIDES any stale stored
// name, an EMPTY ?name= shows the generic fallback instead of reviving stale
// data, and the identifier is stripped from the address bar either way.
export function ThankfulGreeting({ template, fallback }: { template: string; fallback: string }) {
  const [name, setName] = useState<string | null>(null);
  const params = useSearchParams();

  useEffect(() => {
    if (params.has("name")) {
      const bounded = boundedHandoffText(params.get("name") ?? "");
      if (bounded) {
        saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.thankfulName, { text: bounded });
      } else {
        clearSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.thankfulName);
      }
      stripQueryParamsOnSelf(["name"]);
      queueMicrotask(() => setName(bounded || null));
      return;
    }
    const stored = readSensitiveHandoff<{ text?: string }>(SENSITIVE_HANDOFF_KEYS.thankfulName);
    const storedName = typeof stored?.text === "string" && stored.text.trim() ? boundedHandoffText(stored.text) : null;
    queueMicrotask(() => setName(storedName));
  }, [params]);

  return <h1>{name ? template.replace("{name}", name) : fallback}</h1>;
}

export function ThankfulBackButton({ label, homeHref }: { label: string; homeHref: string }) {
  const router = useRouter();

  return (
    <button
      className="thankful-action"
      type="button"
      onClick={() => window.history.length > 1 ? router.back() : router.push(homeHref)}
    >
      {label}
    </button>
  );
}