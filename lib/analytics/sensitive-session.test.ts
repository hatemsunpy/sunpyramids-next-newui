import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SENSITIVE_HANDOFF_KEYS,
  boundedHandoffText,
  clearSensitiveHandoff,
  handoffStorageKey,
  readSensitiveHandoff,
  saveSensitiveHandoff,
} from "@/lib/analytics/sensitive-session";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2030-01-01T09:00:00Z"));
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("sensitive handoff", () => {
  it("stores values tab-scoped under a namespaced key", () => {
    expect(saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset, { email: "a@b.com", otp: "123456" })).toBe(true);
    const raw = window.sessionStorage.getItem(handoffStorageKey("auth-reset"));
    expect(raw).toContain('"email":"a@b.com"');
    // Nothing is written outside sessionStorage.
    expect(window.localStorage.getItem(handoffStorageKey("auth-reset"))).toBeNull();
    expect(readSensitiveHandoff<{ email?: string; otp?: string }>(SENSITIVE_HANDOFF_KEYS.authReset)).toEqual({
      email: "a@b.com",
      otp: "123456",
    });
  });

  it("expires after the short TTL window", () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.thankfulName, { text: "Hatem" });
    vi.setSystemTime(new Date("2030-01-01T09:09:00Z"));
    expect(readSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.thankfulName)).toEqual({ text: "Hatem" });
    vi.setSystemTime(new Date("2030-01-01T09:12:00Z"));
    expect(readSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.thankfulName)).toBeNull();
    // Expired envelopes are removed, not left behind.
    expect(window.sessionStorage.getItem(handoffStorageKey("thankful-name"))).toBeNull();
  });

  it("clears explicitly", () => {
    saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset, { email: "a@b.com" });
    clearSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset);
    expect(readSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset)).toBeNull();
  });

  it("falls back to in-memory tab lifetime when storage is blocked", () => {
    const fail = () => {
      throw new Error("blocked storage");
    };
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(fail);
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(fail);
    expect(saveSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset, { email: "a@b.com" })).toBe(true);
    // Within the same document (SPA route change), the handoff still works.
    expect(readSensitiveHandoff<{ email?: string }>(SENSITIVE_HANDOFF_KEYS.authReset)).toEqual({ email: "a@b.com" });
    // Nothing was persisted anywhere: storage probes failed outright.
    expect(setItem).toHaveBeenCalled();
    expect(getItem).toHaveBeenCalled();
    // Removal failures must not break cleanup either.
    const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(fail);
    expect(() => clearSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset)).not.toThrow();
    expect(readSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset)).toBeNull();
  });

  it("treats malformed envelopes as absent", () => {
    window.sessionStorage.setItem(handoffStorageKey("auth-reset"), "{not json");
    expect(readSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset)).toBeNull();
    window.sessionStorage.setItem(handoffStorageKey("auth-reset"), JSON.stringify({ expiresAt: 1 }));
    expect(readSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset)).toBeNull();
    // A non-object value violates the handoff schema and is rejected.
    window.sessionStorage.setItem(handoffStorageKey("auth-reset"), JSON.stringify({ value: "raw", expiresAt: Date.now() + 60_000 }));
    expect(readSensitiveHandoff(SENSITIVE_HANDOFF_KEYS.authReset)).toBeNull();
  });

  it("bounds stored personal text", () => {
    expect(boundedHandoffText("  Hatem   Sun   pyramids  ")).toBe("Hatem Sun pyramids");
    expect(boundedHandoffText("x".repeat(150)).length).toBe(100);
    expect(boundedHandoffText(undefined as never)).toBe("");
  });
});