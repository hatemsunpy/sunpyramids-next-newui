import { describe, expect, it } from "vitest";
import { pickUiLabels } from "@/lib/home-client-labels";

describe("pickUiLabels fallback", () => {
  it("preserves English and property-name fallback without spreading the Proxy", () => {
    // paypal exists only in the en dictionary (lib/ui-copy.ts), so a non-en
    // locale must fall back to the English value.
    expect(pickUiLabels("fr", ["paypal"] as const).paypal).toBe("PayPal");
    // Unknown keys fall back to the property name itself.
    expect(pickUiLabels("en", ["definitelyMissingKey"] as const).definitelyMissingKey).toBe(
      "definitelyMissingKey",
    );
  });
});
