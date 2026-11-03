// Tab-scoped, short-lived handoff for personal values that must not travel in
// URLs (thank-you greeting name, password-reset email/OTP context).
//
// sessionStorage never reaches localStorage/cookies; values expire on a short
// TTL; invalid/expired entries are removed instead of returned. When
// sessionStorage is blocked, an in-memory fallback keeps within-document (SPA)
// handoffs working - a full page load resets it, and secrets are never
// re-introduced into URLs to compensate.

const HANDOFF_TTL_MS = 10 * 60 * 1000; // 10 minutes

const STORAGE_PREFIX = "sunpyramids-handoff:";

export const SENSITIVE_HANDOFF_KEYS = {
  thankfulName: "thankful-name",
  authReset: "auth-reset",
} as const;

export type HandoffEnvelope = { value: Record<string, unknown>; expiresAt: number };

const memoryHandoffs = new Map<string, HandoffEnvelope>();

export function handoffStorageKey(key: string): string {
  return STORAGE_PREFIX + key;
}

function sessionStorageAvailable(): boolean {
  try {
    const probe = `${STORAGE_PREFIX}__probe`;
    window.sessionStorage.setItem(probe, "1");
    window.sessionStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

// Schema-checked envelope parse: value must be a plain object (consumers
// validate their own fields), expiresAt a finite future timestamp. Invalid or
// expired entries are removed instead of returned.
function parseEnvelope(raw: string | null, storageKey: string): HandoffEnvelope | null {
  if (!raw) return null;
  let parsed: Partial<HandoffEnvelope> | null;
  try {
    parsed = JSON.parse(raw) as Partial<HandoffEnvelope> | null;
  } catch {
    return null;
  }
  const valid = parsed !== null && typeof parsed === "object"
    && typeof parsed.value === "object" && parsed.value !== null && !Array.isArray(parsed.value)
    && typeof parsed.expiresAt === "number" && Number.isFinite(parsed.expiresAt);
  if (!valid || (parsed as HandoffEnvelope).expiresAt <= Date.now()) {
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      // Blocked storage: the entry never comes back on read anyway.
    }
    return null;
  }
  return parsed as HandoffEnvelope;
}

export function saveSensitiveHandoff(key: string, value: Record<string, unknown>): boolean {
  if (typeof window === "undefined") return false;
  const envelope: HandoffEnvelope = { value, expiresAt: Date.now() + HANDOFF_TTL_MS };
  try {
    if (sessionStorageAvailable()) {
      memoryHandoffs.delete(key);
      window.sessionStorage.setItem(handoffStorageKey(key), JSON.stringify(envelope));
      return true;
    }
  } catch {
    // Fall through to the in-memory fallback.
  }
  memoryHandoffs.set(key, envelope);
  return true;
}

export function readSensitiveHandoff<T = unknown>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const storageKey = handoffStorageKey(key);
  try {
    const envelope = parseEnvelope(window.sessionStorage.getItem(storageKey), storageKey);
    if (envelope) return envelope.value as T;
  } catch {
    // Blocked storage: fall back to in-memory below.
  }
  const envelope = memoryHandoffs.get(key) ?? null;
  if (!envelope) return null;
  if (envelope.expiresAt <= Date.now()) {
    memoryHandoffs.delete(key);
    return null;
  }
  if (typeof envelope.value !== "object" || envelope.value === null) return null;
  return envelope.value as T;
}

export function clearSensitiveHandoff(key: string): void {
  if (typeof window === "undefined") return;
  memoryHandoffs.delete(key);
  try {
    window.sessionStorage.removeItem(handoffStorageKey(key));
  } catch {
    // Blocked storage: nothing to remove.
  }
}

// Bounds any personal text (name) stored in the handoff, mirroring the
// thank-you greeting's own bounding rules.
export function boundedHandoffText(value: string): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 100);
}