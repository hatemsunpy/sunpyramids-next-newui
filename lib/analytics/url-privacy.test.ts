import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hasSensitiveQuery,
  isDocumentSensitive,
  isUnessentialOptOut,
  resetDocumentSensitiveDecision,
  sanitizePageLocation,
  stripQueryParamsOnSelf,
} from "@/lib/analytics/url-privacy";

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  resetDocumentSensitiveDecision();
});

describe("sanitizePageLocation", () => {
  it("keeps attribution parameters and drops everything else", () => {
    const out = sanitizePageLocation("https://sunpyramidstours.com/cart?utm_source=mail&utm_campaign=spring&gclid=abc&foo=1&bar=2");
    expect(out).toBe("https://sunpyramidstours.com/cart?utm_source=mail&utm_campaign=spring&gclid=abc");
  });

  it("drops personal identifiers and fragments", () => {
    const out = sanitizePageLocation("https://sunpyramidstours.com/auth/create-password?email=a%40b.com&otp=123456#greeting");
    expect(out).toBe("https://sunpyramidstours.com/auth/create-password");
  });

  it("keeps attribution keys case-insensitively", () => {
    const out = sanitizePageLocation("https://example.com/x?GCLID=keep&UtM_Source=keep&utm_name=keep");
    expect(out).toBe("https://example.com/x?GCLID=keep&UtM_Source=keep&utm_name=keep");
  });

  it("never echoes unknown query names", () => {
    const out = sanitizePageLocation("https://example.com/x?arbitrary_user_input=<script>");
    expect(out).toBe("https://example.com/x");
  });

  it("resolves relative refs against the base origin", () => {
    expect(sanitizePageLocation("/cart?utm_source=x", "https://example.com")).toBe("https://example.com/cart?utm_source=x");
  });

  it("degrades safely on broken input instead of echoing it back", () => {
    expect(sanitizePageLocation("")).toBe("");
    expect(sanitizePageLocation(undefined as never)).toBe("");
    expect(sanitizePageLocation("https://")).toBe("");
  });

  it("rejects non-http(s) protocols outright", () => {
    expect(sanitizePageLocation("javascript:alert(1)")).toBe("");
    expect(sanitizePageLocation("ftp://example.com/cart?utm_source=x")).toBe("");
    expect(sanitizePageLocation("data:text/html,<h1>x</h1>")).toBe("");
  });

  it("strips URL credentials", () => {
    expect(sanitizePageLocation("https://user:pass@sunpyramidstours.com/cart?utm_source=x"))
      .toBe("https://sunpyramidstours.com/cart?utm_source=x");
  });

  it("discards oversized query keys and values", () => {
    const longValue = "x".repeat(300);
    expect(sanitizePageLocation(`https://example.com/cart?utm_source=${longValue}`)).toBe("https://example.com/cart");
    const longKey = "utm_".concat("k".repeat(64));
    expect(sanitizePageLocation(`https://example.com/cart?${longKey}=ok`)).toBe("https://example.com/cart");
    // At the boundary the value survives.
    expect(sanitizePageLocation(`https://example.com/cart?utm_source=${"x".repeat(256)}`))
      .toBe(`https://example.com/cart?utm_source=${"x".repeat(256)}`);
  });
});

describe("control-flag and sensitive-parameter helpers", () => {
  it("reads the no-third-party opt-out exactly", () => {
    window.history.replaceState({}, "", "/?no-third-party=1");
    expect(isUnessentialOptOut()).toBe(true);
    window.history.replaceState({}, "", "/?no-third-party=2");
    expect(isUnessentialOptOut()).toBe(false);
    window.history.replaceState({}, "", "/?source=no-third-party=1");
    expect(isUnessentialOptOut()).toBe(false);
  });

  it("detects sensitive parameter names without reading values", () => {
    expect(hasSensitiveQuery("?email=a%40b.com")).toBe(true);
    expect(hasSensitiveQuery("?otp=123456&utm_source=x")).toBe(true);
    expect(hasSensitiveQuery("?newsletter=1")).toBe(false);
    expect(hasSensitiveQuery("")).toBe(false);
  });

  it("fails closed on documents that arrived with sensitive parameters", () => {
    // The decision belongs to the ARRIVING document: re-capture after
    // re-positioning the URL, like a fresh page load would.
    window.history.replaceState({}, "", "/auth/reset-password?token=t123");
    resetDocumentSensitiveDecision();
    expect(isDocumentSensitive()).toBe(true);
    window.history.replaceState({}, "", "/thankful?name=Hatem");
    resetDocumentSensitiveDecision();
    expect(isDocumentSensitive()).toBe(true);
    // A clean document is not sensitive.
    window.history.replaceState({}, "", "/thankful?utm_source=mail");
    resetDocumentSensitiveDecision();
    expect(isDocumentSensitive()).toBe(false);
  });

  it("keeps the fail-closed decision after the app scrubs the identifiers from the URL", () => {
    window.history.replaceState({}, "", "/thankful?name=Hatem&utm_source=mail");
    resetDocumentSensitiveDecision();
    // The consuming effect strips the identifier from the address bar; the
    // per-document decision must NOT flip back to tracking-enabled afterwards.
    stripQueryParamsOnSelf(["name"]);
    expect(window.location.search).toBe("?utm_source=mail");
    expect(isDocumentSensitive()).toBe(true);
  });

  it("also treats a sensitive referrer as unsafe", () => {
    const original = document.referrer;
    Object.defineProperty(document, "referrer", {
      value: "https://mail.example.com/read?email=a%40b.com",
      configurable: true,
    });
    try {
      window.history.replaceState({}, "", "/cart");
      // Re-capture simulates the module-load read on the arriving document.
      resetDocumentSensitiveDecision();
      expect(isDocumentSensitive()).toBe(true);
      // A sanitizable referrer is safe: only sensitive PARAMS decide.
      Object.defineProperty(document, "referrer", {
        value: "https://mail.example.com/read?utm_source=mail",
        configurable: true,
      });
      resetDocumentSensitiveDecision();
      expect(isDocumentSensitive()).toBe(false);
    } finally {
      Object.defineProperty(document, "referrer", { value: original, configurable: true });
      resetDocumentSensitiveDecision();
    }
  });
});

describe("stripQueryParamsOnSelf", () => {
  it("removes only the listed identifiers and keeps the rest", () => {
    window.history.replaceState({}, "", "/auth/confirm-code?email=a%40b.com&otp=123456&utm_source=mail&tab=info");
    stripQueryParamsOnSelf(["email", "otp"]);
    expect(window.location.pathname).toBe("/auth/confirm-code");
    expect(window.location.search).toBe("?utm_source=mail&tab=info");
  });

  it("removes the query entirely when nothing remains", () => {
    window.history.replaceState({}, "", "/thankful?name=Hatem");
    stripQueryParamsOnSelf(["name"]);
    expect(window.location.search).toBe("");
  });

  it("leaves the URL untouched when nothing matches", () => {
    window.history.replaceState({}, "", "/thankful?utm_source=x");
    stripQueryParamsOnSelf(["name"]);
    expect(window.location.search).toBe("?utm_source=x");
  });
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});