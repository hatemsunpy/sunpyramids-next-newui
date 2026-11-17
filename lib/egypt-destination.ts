import { cache } from "react";
import { getDestinationReliable } from "@/lib/data";
import { resolveRequiredApiResult } from "@/lib/resolve-api-result";
import type { ApiPage, Locale } from "@/types/api";

export const loadEgyptDestination = cache(async (locale: Locale) =>
  resolveRequiredApiResult<ApiPage>(await getDestinationReliable("egypt", locale), "Egypt destination"),
);
