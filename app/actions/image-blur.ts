"use server";

import { getImageBlurPlaceholders } from "@/lib/image-blur.server";

// Public image presentation only; no Laravel records or customer data are changed.
export async function getImageBlurBatch(sources: unknown): Promise<Record<string, string>> {
  if (!Array.isArray(sources) || sources.length > 16) return {};
  const valid = sources.filter((src): src is string => typeof src === "string" && src.length <= 2048);
  return getImageBlurPlaceholders(valid);
}
