import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useSpeechRecognition } from "./use-speech-recognition";
import { createFakeRecorder } from "@/tests/test-utils/fake-speech-recognizer";

// Hook behavior tests using the fake recognizer — no microphone, no
// permission dialogs, no network, no real browser speech globals.

// Flush the requestAnimationFrame used for post-mount capability detection.
async function flushDetection() {
  await act(async () => {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  });
}

let recorder: ReturnType<typeof createFakeRecorder>;

function renderVoiceHook(locale: "en" | "fr" | "de" = "en") {
  return renderHook(
    ({ loc }) => useSpeechRecognition(loc, recorder.factory, () => true),
    { initialProps: { loc: locale as "en" | "fr" | "de" } },
  );
}

beforeEach(() => {
  recorder = createFakeRecorder();
});

afterEach(() => {
  cleanup();
});

describe("useSpeechRecognition — lifecycle", () => {
  it("idle initially; supported=true after mount (detection injected)", async () => {
    const { result } = renderVoiceHook();
    expect(result.current.status).toBe("idle");
    expect(result.current.finalTranscript).toBe("");
    expect(result.current.error).toBeNull();
    await flushDetection();
    expect(result.current.supported).toBe(true);
  });

  it("start → starting → listening on start event; end → idle", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    expect(result.current.status).toBe("starting");
    expect(recorder.startAttempts()).toBe(1);

    act(() => recorder.emitStart());
    expect(result.current.status).toBe("listening");

    act(() => recorder.emitEnd());
    expect(result.current.status).toBe("idle");
  });

  it("interim → final transition updates transcripts; processing status on final", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => recorder.emitStart());

    act(() => recorder.emitResult({ transcript: "find a five day", isFinal: false }));
    expect(result.current.interimTranscript).toBe("find a five day");
    expect(result.current.finalTranscript).toBe("");

    act(() => recorder.emitResult({ transcript: "find a five day nile cruise", isFinal: true }));
    expect(result.current.interimTranscript).toBe("");
    expect(result.current.finalTranscript).toBe("find a five day nile cruise");
    expect(result.current.status).toBe("processing");
  });

  it("new session clears stale transcripts", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => recorder.emitStart());
    act(() => recorder.emitResult({ transcript: "first query", isFinal: true }));
    expect(result.current.finalTranscript).toBe("first query");

    act(() => recorder.emitEnd());
    act(() => result.current.start());
    expect(result.current.finalTranscript).toBe("");
    expect(result.current.status).toBe("starting");
  });

  it("stop() delegates to the active recognizer's stop", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(recorder.stopCalls()).toBe(1);
  });

  it("cancel() aborts and records an intentional abort (not a scary error)", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => recorder.emitStart());

    act(() => result.current.cancel());
    expect(recorder.abortCalls()).toBe(1);

    act(() => recorder.emitError("aborted"));
    expect(result.current.status).toBe("idle");
    expect(result.current.error?.intentional).toBe(true);
  });

  it("unmount aborts the active recognizer and ignores later callbacks", () => {
    const { result, unmount } = renderVoiceHook();
    act(() => result.current.start());
    act(() => recorder.emitStart());
    unmount();
    expect(recorder.abortCalls()).toBe(1);

    // Late browser callbacks after unmount must not throw or update state.
    expect(() => {
      act(() => recorder.emitResult({ transcript: "late", isFinal: true }));
      act(() => recorder.emitError("network"));
    }).not.toThrow();
  });
});

describe("useSpeechRecognition — concurrency and stale sessions", () => {
  it("double start() does not create a duplicate session", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => result.current.start());
    expect(recorder.sessionCount()).toBe(1);
    expect(recorder.startAttempts()).toBe(1);
  });

  it("old session callbacks after a new session are ignored (stale session id)", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    const firstSession = recorder.lastSession();
    act(() => recorder.emitEnd());

    act(() => result.current.start());
    const secondSession = recorder.lastSession();
    act(() => recorder.emitStart());
    act(() => recorder.emitResult({ transcript: "second session", isFinal: true }, secondSession));

    // Stale callbacks from session 1 must not corrupt session 2 state.
    act(() => recorder.emitResult({ transcript: "STALE", isFinal: true }, firstSession));
    act(() => recorder.emitError("network", undefined, firstSession));

    expect(result.current.finalTranscript).toBe("second session");
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe("processing");
  });

  it("start() while unsupported → deterministic 'unsupported' error state", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition("en", recorder.factory, () => false),
    );
    await flushDetection();
    expect(result.current.supported).toBe(false);
    act(() => result.current.start());
    expect(result.current.status).toBe("error");
    expect(result.current.error?.code).toBe("unsupported");
    expect(recorder.sessionCount()).toBe(0);
  });
});

describe("useSpeechRecognition — errors", () => {
  it("permission denial → error state with normalized code", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => recorder.emitStart());
    act(() => recorder.emitError("permission", "not-allowed"));
    expect(result.current.status).toBe("error");
    expect(result.current.error?.code).toBe("permission");
    expect(result.current.error?.rawCode).toBe("not-allowed");
  });

  it("no-speech → error state", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => recorder.emitError("no-speech"));
    expect(result.current.error?.code).toBe("no-speech");
  });

  it("network failure → error state", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => recorder.emitError("network"));
    expect(result.current.error?.code).toBe("network");
  });

  it("unsupported language → language-unavailable normalized code", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => recorder.emitError("language-unavailable", "language-not-supported"));
    expect(result.current.error?.code).toBe("language-unavailable");
  });

  it("unknown vendor error code degrades to 'unknown' without crashing", () => {
    const { result } = renderVoiceHook();
    act(() => result.current.start());
    act(() => recorder.emitError("unknown", "brand-new-error"));
    expect(result.current.error?.code).toBe("unknown");
  });
});

describe("useSpeechRecognition — locale handling", () => {
  it("recognizer receives the mapped BCP-47 language for the locale", () => {
    const { result } = renderHook(
      ({ loc }) => useSpeechRecognition(loc, recorder.factory, () => true),
      { initialProps: { loc: "fr" as const } },
    );
    act(() => result.current.start());
    expect(recorder.lastSession()?.lang).toBe("fr-FR");
  });

  it("locale change mid-session aborts the active session (no live lang mutation)", () => {
    const { result, rerender } = renderHook(
      ({ loc }) => useSpeechRecognition(loc, recorder.factory, () => true),
      { initialProps: { loc: "en" as const } },
    );
    act(() => result.current.start());
    expect(recorder.abortCalls()).toBe(0);

    rerender({ loc: "fr" });
    expect(recorder.abortCalls()).toBe(1);
    expect(result.current.status).toBe("idle");
  });
});