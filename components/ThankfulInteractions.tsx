"use client";

import { useSearchParams } from "next/navigation";
import { useProgressRouter as useRouter } from "@/components/useProgressRouter";

export function ThankfulGreeting({ template, fallback }: { template: string; fallback: string }) {
  const name = useSearchParams().get("name")?.trim().replace(/\s+/g, " ").slice(0, 100);

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
