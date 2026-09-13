import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  browserRecognizerFactory,
  isSpeechRecognitionSupported,
} from "./browser-speech-recognizer";
import type { RecognizerHandlers } from "./speech-recognizer";

// Runtime capability detection tests. The browser adapter must branch ONLY on
// the presence of SpeechRecognition / webkitSpeechRecognition constructors —
// never on browser names or userAgent.

type RecordingCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function makeRecordingCtor() {
  const started: string[] = [];
  class FakeRecognition {
    lang = "";
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    onstart: (() => void) | null = null;
    onresult: ((event: unknown) => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    start() {
      started.push("start");
    }
    stop() {}
    abort() {}
  }
  return { Ctor: FakeRecognition as unknown as RecordingCtor, started };
}

function handlers(spy: { events: string[] }): RecognizerHandlers {
  return {
    onStart: () => spy.events.push("start"),
    onResult: (r) => spy.events.push(`result:${r.isFinal ? "final" : "interim"}:${r.transcript}`),
    onError: (e) => spy.events.push(`error:${e.code}`),
    onEnd: () => spy.events.push("end"),
  };
}

const originalWindow = globalThis.window;

afterEach(() => {
  // Restore a window-like global without any speech constructors.
  (globalThis as Record<string, unknown>).window = originalWindow;
  vi.unstubAllGlobals();
});

describe("isSpeechRecognitionSupported — runtime detection only", () => {
  it("unsupported when neither constructor exists", () => {
    vi.stubGlobal("window", {});
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it("supported via SpeechRecognition (unprefixed)", () => {
    const { Ctor } = makeRecordingCtor();
    vi.stubGlobal("window", { SpeechRecognition: Ctor });
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it("supported via webkitSpeechRecognition (prefixed)", () => {
    const { Ctor } = makeRecordingCtor();
    vi.stubGlobal("window", { webkitSpeechRecognition: Ctor });
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it("prefers unprefixed constructor when both exist", () => {
    const a = makeRecordingCtor();
    const b = makeRecordingCtor();
    vi.stubGlobal("window", { SpeechRecognition: a.Ctor, webkitSpeechRecognition: b.Ctor });
    expect(isSpeechRecognitionSupported()).toBe(true);
    // Factory instantiates the unprefixed one.
    const spy = { events: [] as string[] };
    browserRecognizerFactory("en-US", handlers(spy)).start();
    expect(a.started).toContain("start");
  });

  it("SSR-safe: no window → unsupported, no crash", () => {
    (globalThis as Record<string, unknown>).window = undefined;
    expect(isSpeechRecognitionSupported()).toBe(false);
    // The factory also degrades deterministically without throwing.
    const spy = { events: [] as string[] };
    browserRecognizerFactory("en-US", handlers(spy)).start();
    expect(spy.events).toEqual(["error:unsupported", "end"]);
  });
});

describe("browserRecognizerFactory — configuration and event mapping", () => {
  function patchedCtor(Ctor: RecordingCtor, created: unknown[]) {
    const Patched = class extends (Ctor as unknown as new () => unknown) {
      constructor() {
        super();
        created.push(this);
      }
    };
    vi.stubGlobal("window", { SpeechRecognition: Patched as unknown as RecordingCtor });
    return () => created[0] as {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      maxAlternatives: number;
      onstart: (() => void) | null;
      onresult: ((e: unknown) => void) | null;
      onerror: ((e: { error: string }) => void) | null;
      onend: (() => void) | null;
    };
  }

  it("configures lang/continuous/interimResults/maxAlternatives per MVP decision", () => {
    const { Ctor } = makeRecordingCtor();
    const created: unknown[] = [];
    const first = patchedCtor(Ctor, created);
    const spy = { events: [] as string[] };
    browserRecognizerFactory("fr-FR", handlers(spy)).start();
    const instance = first();
    expect(instance.lang).toBe("fr-FR");
    expect(instance.continuous).toBe(false);
    expect(instance.interimResults).toBe(true);
    expect(instance.maxAlternatives).toBe(1);
  });

  it("maps result events: interim and final batches concatenate without duplication", () => {
    const { Ctor } = makeRecordingCtor();
    vi.stubGlobal("window", { SpeechRecognition: Ctor });
    const spy = { events: [] as string[] };
    browserRecognizerFactory("en-US", handlers(spy)).start();

    // Capture the constructed instance through the ctor's onresult wiring.
    const created: unknown[] = [];
    const Patched = class extends (Ctor as unknown as new () => unknown) {
      constructor(...args: unknown[]) {
        super(...(args as []));
        created.push(this);
      }
    };
    vi.stubGlobal("window", { SpeechRecognition: Patched as unknown as RecordingCtor });
    const recognizer2 = browserRecognizerFactory("en-US", handlers(spy));
    recognizer2.start();
    const instance = created[0] as {
      onresult: ((e: unknown) => void) | null;
      onstart: (() => void) | null;
      onerror: ((e: { error: string }) => void) | null;
      onend: (() => void) | null;
    };

    instance.onstart?.();
    // Event 1: interim "find a"
    instance.onresult?.({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: "find a " } , length: 1 }] });
    // Event 2: interim grows "find a five day"
    instance.onresult?.({ resultIndex: 0, results: [
      { isFinal: false, 0: { transcript: "find a five day " }, length: 1 },
    ] });
    // Event 3: final "find a five day nile cruise"
    instance.onresult?.({ resultIndex: 0, results: [
      { isFinal: true, 0: { transcript: "find a five day nile cruise" }, length: 1 },
    ] });

    expect(spy.events).toContain("start");
    expect(spy.events).toContain("result:interim:find a");
    expect(spy.events).toContain("result:interim:find a five day");
    expect(spy.events).toContain("result:final:find a five day nile cruise");
  });

  it("concatenates multiple result batches in a single event from resultIndex", () => {
    const { Ctor } = makeRecordingCtor();
    const created: unknown[] = [];
    const Patched = class extends (Ctor as unknown as new () => unknown) {
      constructor() {
        super();
        created.push(this);
      }
    };
    vi.stubGlobal("window", { SpeechRecognition: Patched as unknown as RecordingCtor });
    const spy = { events: [] as string[] };
    browserRecognizerFactory("en-US", handlers(spy)).start();
    const instance = created[0] as { onresult: ((e: unknown) => void) | null };

    // Browsers may deliver several results in one event; resultIndex marks
    // where the new batch begins. Earlier batches must not be double-counted.
    instance.onresult?.({
      resultIndex: 0,
      results: [
        { isFinal: true, 0: { transcript: "find a trip " }, length: 1 },
        { isFinal: true, 0: { transcript: "to cairo" }, length: 1 },
      ],
    });

    expect(spy.events).toContain("result:final:find a trip to cairo");
  });

  it("normalizes known browser error codes and degrades unknown codes to 'unknown'", () => {
    const { Ctor } = makeRecordingCtor();
    const created: unknown[] = [];
    const Patched = class extends (Ctor as unknown as new () => unknown) {
      constructor() {
        super();
        created.push(this);
      }
    };
    vi.stubGlobal("window", { SpeechRecognition: Patched as unknown as RecordingCtor });
    const spy = { events: [] as string[] };
    browserRecognizerFactory("en-US", handlers(spy)).start();
    const instance = created[0] as { onerror: ((e: { error: string }) => void) | null };

    instance.onerror?.({ error: "not-allowed" });
    instance.onerror?.({ error: "no-speech" });
    instance.onerror?.({ error: "network" });
    instance.onerror?.({ error: "language-not-supported" });
    instance.onerror?.({ error: "brand-new-vendor-error" });

    expect(spy.events).toContain("error:permission");
    expect(spy.events).toContain("error:no-speech");
    expect(spy.events).toContain("error:network");
    expect(spy.events).toContain("error:language-unavailable");
    expect(spy.events).toContain("error:unknown");
  });
});