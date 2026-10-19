import { homeCopy } from "@/lib/home-copy";
import { uiCopy } from "@/lib/ui-copy";
import type { Locale } from "@/types/api";

// Server-side home-copy label picker for the five server wrappers
// (Header, BottomBar, HomeSearchShortcuts, HomePopularTours, HomeNeedHelpForm).
//
// Each key is resolved individually THROUGH the existing homeCopy Proxy, so the
// selected-locale -> English -> property-name fallback chain is preserved
// exactly. Never spread the Proxy (that would lose the English/property-name
// fallbacks) and never pass the Proxy itself across the RSC boundary — this
// returns a plain serializable object. Imported only by server wrappers, never
// by *Client files, so lib/home-copy.ts stays out of the client bundle.
export function pickHomeLabels<K extends string>(locale: Locale, keys: readonly K[]): Record<K, string> {
  const copy = homeCopy(locale);
  const labels = {} as Record<K, string>;
  for (const key of keys) {
    labels[key] = copy[key];
  }
  return labels;
}

// Server-side UI-label picker: per-key uiCopy Proxy reads preserve fallbacks,
// returning a plain serializable object for server-to-client props.
export function pickUiLabels<K extends string>(locale: Locale, keys: readonly K[]): Record<K, string> {
  const copy = uiCopy(locale);
  const labels = {} as Record<K, string>;
  for (const key of keys) {
    labels[key] = copy[key];
  }
  return labels;
}
