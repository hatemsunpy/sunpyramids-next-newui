import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeRecorder } from "@/tests/test-utils/fake-speech-recognizer";
import { commandSpeechRecognizer, HEADER_COMMAND_CAPTURE } from "./command-speech-recognizer";
import type { RecognitionResult } from "./speech-recognizer";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function capture() {
  const recorder = createFakeRecorder();
  const handlers = { onStart: vi.fn(), onResult: vi.fn(), onError: vi.fn(), onEnd: vi.fn() };
  const recognition = commandSpeechRecognizer(recorder.factory, "en-US", handlers, HEADER_COMMAND_CAPTURE);
  recognition.start(); recorder.emitStart();
  const finals = () => handlers.onResult.mock.calls.map(([speech]) => speech as RecognitionResult).filter((speech) => speech.isFinal);
  const final = (transcript: string) => recorder.emitResult({ transcript, isFinal: true });
  return { recorder, handlers, recognition, finals, final };
}

describe("Header command capture at the native recognition boundary", () => {
  it("an interim decoding gap cannot stop the command before its first useful ASR final", () => {
    const c = capture();
    c.recorder.emitResult({ transcript: "5 day Nile cruise", isFinal: false });
    vi.advanceTimersByTime(1100);
    expect(c.recorder.stopCalls()).toBe(0); expect(c.finals()).toEqual([]);
    c.recorder.emitResult({ transcript: "", isFinal: true, segments: [{ index: 0, transcript: "", isFinal: true }] });
    vi.advanceTimersByTime(1100);
    expect(c.recorder.stopCalls()).toBe(0);
    c.final("5 day Nile cruise to Aswan");
    vi.advanceTimersByTime(800); c.recorder.emitEnd();
    expect(c.finals()).toEqual([{ transcript: "5 day Nile cruise to Aswan", isFinal: true }]);
  });

  it("keeps two ASR finals provisional and emits one assembled command after quiet and engine end", () => {
    const c = capture(); c.final("5 day Nile cruise");
    expect(c.finals()).toEqual([]);
    vi.advanceTimersByTime(200); c.final("to Aswan");
    vi.advanceTimersByTime(799);
    expect(c.finals()).toEqual([]); expect(c.recorder.stopCalls()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(c.recorder.stopCalls()).toBe(1); expect(c.finals()).toEqual([]);
    c.recorder.emitEnd();
    expect(c.finals()).toEqual([{ transcript: "5 day Nile cruise to Aswan", isFinal: true }]);
    expect(c.handlers.onEnd).toHaveBeenCalledOnce();
  });

  it("retains an ended first segment while a bounded continuation adds the destination", () => {
    const c = capture(); const first = c.recorder.lastSession();
    c.final("5 day Nile cruise"); c.recorder.emitEnd();
    expect(c.recorder.sessionCount()).toBe(2); expect(c.finals()).toEqual([]);
    // An old engine cannot corrupt the continuation.
    c.recorder.emitResult({ transcript: "late Cairo", isFinal: true }, first);
    vi.advanceTimersByTime(200); c.final("to Aswan"); c.recorder.emitEnd();
    vi.advanceTimersByTime(800);
    expect(c.finals()).toEqual([{ transcript: "5 day Nile cruise to Aswan", isFinal: true }]);
  });

  it("Stop accepts the engine's final flush, finishes promptly on end, and ignores duplicates", () => {
    const c = capture(); c.final("5 day Nile cruise"); c.recognition.stop();
    expect(c.recorder.stopCalls()).toBe(1); expect(c.finals()).toEqual([]);
    vi.advanceTimersByTime(500);
    c.final("to Aswan"); c.recorder.emitEnd();
    expect(c.finals()).toEqual([{ transcript: "5 day Nile cruise to Aswan", isFinal: true }]);
    c.recorder.emitEnd(); c.final("duplicate"); vi.advanceTimersByTime(30_000);
    expect(c.finals()).toHaveLength(1); expect(c.recorder.sessionCount()).toBe(1);
  });

  it("cancel clears an active continuation and ignores its late result/end/timers", () => {
    const c = capture(); c.final("5 days Cairo"); c.recorder.emitEnd();
    c.recognition.abort(); c.final("to Aswan"); c.recorder.emitEnd();
    vi.advanceTimersByTime(30_000);
    expect(c.finals()).toEqual([]); expect(c.recorder.sessionCount()).toBe(2);
    expect(c.handlers.onError).toHaveBeenCalledExactlyOnceWith({ code: "aborted", intentional: true });
  });

  it.each([false, true])("new speech (final=%s) resets the quiet deadline", (isFinal) => {
    const c = capture(); c.final("5 day Nile cruise");
    vi.advanceTimersByTime(500);
    c.recorder.emitResult({ transcript: "to Aswan", isFinal });
    vi.advanceTimersByTime(350);
    expect(c.recorder.stopCalls()).toBe(0); expect(c.finals()).toEqual([]);
    vi.advanceTimersByTime(450);
    expect(c.recorder.stopCalls()).toBe(1);
    if (!isFinal) c.final("to Aswan");
    c.recorder.emitEnd();
    expect(c.finals()[0].transcript).toBe("5 day Nile cruise to Aswan");
  });

  it("no-speech during continuation finalizes useful captured text once", () => {
    const c = capture(); c.final("5 days Cairo"); c.recorder.emitEnd();
    c.recorder.emitError("no-speech"); c.recorder.emitEnd();
    vi.advanceTimersByTime(30_000);
    expect(c.finals()).toEqual([{ transcript: "5 days Cairo", isFinal: true }]);
    expect(c.handlers.onError).not.toHaveBeenCalled();
  });

  it("no-speech without captured finals retains the error and never promotes interim text", () => {
    const c = capture(); c.recorder.emitResult({ transcript: "5 days", isFinal: false });
    c.recorder.emitError("no-speech"); vi.advanceTimersByTime(30_000);
    expect(c.finals()).toEqual([]);
    expect(c.handlers.onError).toHaveBeenCalledWith(expect.objectContaining({ code: "no-speech" }));
  });

  it.each(["permission", "audio-capture", "network", "language-unavailable", "unknown"] as const)(
    "%s during continuation remains an error, not a successful partial command", (code) => {
      const c = capture(); c.final("5 days Cairo"); c.recorder.emitEnd();
      c.recorder.emitError(code); c.recorder.emitEnd(); vi.advanceTimersByTime(30_000);
      expect(c.finals()).toEqual([]);
      expect(c.handlers.onError).toHaveBeenCalledWith(expect.objectContaining({ code }));
    },
  );

  it("allows at most one restart; repeated end callbacks do not extend the quiet deadline", () => {
    const c = capture(); c.final("5 days Cairo");
    c.recorder.emitEnd(); c.recorder.emitEnd();
    for (let count = 0; count < 10; count += 1) c.recorder.emitEnd();
    expect(c.recorder.startAttempts()).toBe(2);
    vi.advanceTimersByTime(800);
    expect(c.finals()).toEqual([{ transcript: "5 days Cairo", isFinal: true }]);
    expect(c.recorder.startAttempts()).toBe(2);
  });

  it("repeated indexed snapshots and mixed interim tails include each final segment once", () => {
    const c = capture();
    const first = { index: 0, transcript: "5 day Nile cruise", isFinal: true };
    c.recorder.emitResult({ transcript: first.transcript, isFinal: true, segments: [first] });
    c.recorder.emitResult({ transcript: "to As", isFinal: true, segments: [first, { index: 1, transcript: "to As", isFinal: false }] });
    const completed = { transcript: "to Aswan", isFinal: true, segments: [first, { index: 1, transcript: "to Aswan", isFinal: true }] };
    c.recorder.emitResult(completed); c.recorder.emitResult(completed);
    c.recognition.stop(); c.recorder.emitEnd();
    expect(c.finals()).toEqual([{ transcript: "5 day Nile cruise to Aswan", isFinal: true }]);
  });

  it("a growing final at the same native index replaces its earlier text", () => {
    const c = capture();
    for (const transcript of ["5 day Nile cruise", "5 day Nile cruise to Aswan", "5 day Nile cruise to Aswan"]) {
      c.recorder.emitResult({ transcript, isFinal: true, segments: [{ index: 0, transcript, isFinal: true }] });
    }
    c.recognition.stop(); c.recorder.emitEnd();
    expect(c.finals()[0].transcript).toBe("5 day Nile cruise to Aswan");
  });

  it("overlap replayed after a restart does not repeat the first segment", () => {
    const c = capture(); c.final("5 day Nile cruise"); c.recorder.emitEnd();
    c.final("5 day Nile cruise to Aswan"); c.recognition.stop(); c.recorder.emitEnd();
    expect(c.finals()[0].transcript).toBe("5 day Nile cruise to Aswan");
  });

  it("continuous speech cannot keep command capture open beyond 30 seconds", () => {
    const c = capture();
    for (let count = 0; count < 40; count += 1) {
      c.recorder.emitResult({ transcript: "5 days Cairo", isFinal: false });
      vi.advanceTimersByTime(750);
    }
    expect(c.recorder.stopCalls()).toBe(1);
    c.final("5 days Cairo"); c.recorder.emitEnd();
    expect(c.finals()).toEqual([{ transcript: "5 days Cairo", isFinal: true }]);
    expect(c.recorder.startAttempts()).toBe(1);
  });

  it("missing engine end has a bounded drain and does not strand an active microphone", () => {
    const c = capture(); c.final("5 days Cairo"); c.recognition.stop();
    vi.advanceTimersByTime(999); expect(c.finals()).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(c.finals()).toEqual([{ transcript: "5 days Cairo", isFinal: true }]);
    expect(c.recorder.abortCalls()).toBe(1);
  });
});
