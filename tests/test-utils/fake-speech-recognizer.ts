// Test-only fake speech recognizer. NOT part of any production import graph:
// it lives under tests/test-utils, outside the lib/ and components/ trees
// that application code imports from. Vitest's include list is what pulls
// test files (and only test files) from this directory tree.
//
// Simulates the browser SpeechRecognition lifecycle deterministically:
// start / interim result / final result / error / end / abort.

import type {
  RecognitionResult,
  RecognizerFactory,
  RecognizerHandlers,
  SpeechRecognizer,
} from "@/lib/voice/speech-recognizer";
import type { SpeechErrorCode, SpeechError } from "@/lib/voice/types";

export type FakeSession = {
  lang: string;
  handlers: RecognizerHandlers;
  recognizer: SpeechRecognizer;
};

export type FakeRecorder = {
  sessions: FakeSession[];
  lastSession: () => FakeSession | undefined;
  sessionCount: () => number;
  startAttempts: () => number;
  stopCalls: () => number;
  abortCalls: () => number;
  emitStart: (session?: FakeSession) => void;
  emitResult: (result: RecognitionResult, session?: FakeSession) => void;
  emitError: (code: SpeechErrorCode, rawCode?: string, session?: FakeSession) => void;
  emitEnd: (session?: FakeSession) => void;
};

export function createFakeRecorder(): FakeRecorder {
  const sessions: FakeSession[] = [];
  let startAttempts = 0;
  let stopCalls = 0;
  let abortCalls = 0;

  const last = () => sessions[sessions.length - 1];

  const factory: RecognizerFactory = (lang, handlers) => {
    let startAttemptsLocal = 0;
    const recognizer: SpeechRecognizer = {
      start() {
        startAttemptsLocal += 1;
        startAttempts += 1;
      },
      stop() {
        stopCalls += 1;
      },
      abort() {
        abortCalls += 1;
      },
    };
    void startAttemptsLocal;
    const session: FakeSession = { lang, handlers, recognizer };
    sessions.push(session);
    return recognizer;
  };

  return {
    sessions,
    lastSession: last,
    sessionCount: () => sessions.length,
    startAttempts: () => startAttempts,
    stopCalls: () => stopCalls,
    abortCalls: () => abortCalls,
    emitStart(session = last()) {
      session?.handlers.onStart();
    },
    emitResult(result, session = last()) {
      session?.handlers.onResult(result);
    },
    emitError(code, rawCode, session = last()) {
      const error: SpeechError = { code, rawCode };
      session?.handlers.onError(error);
    },
    emitEnd(session = last()) {
      session?.handlers.onEnd();
    },
    factory,
  };
}