// Browser SpeechRecognition adapter. Runtime capability detection ONLY —
// no browser-name branching, no userAgent sniffing. All browser globals are
// touched lazily inside functions so importing this module during SSR never
// crashes.

import type { RecognizerFactory, RecognitionResult, RecognizerHandlers } from "./speech-recognizer";
import { normalizeSpeechErrorCode, type SpeechError } from "./types";

// Minimal structural shape of the browser API we consume — avoids depending
// on optional TS lib definitions that vary across environments.
type BrowserSpeechRecognitionResultItem = { transcript: string };
type BrowserSpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: BrowserSpeechRecognitionResultItem;
};
type BrowserSpeechRecognitionEvent = {
  resultIndex: number;
  results: { length: number; [index: number]: BrowserSpeechRecognitionResult };
};
type BrowserSpeechRecognitionErrorEvent = { error: string };
type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};
type BrowserRecognitionConstructor = new () => BrowserRecognition;

function recognitionConstructor(): BrowserRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | BrowserRecognitionConstructor
    | undefined;
  return typeof ctor === "function" ? ctor : null;
}

// Runtime capability detection — the ONLY support gate used by the app.
export function isSpeechRecognitionSupported(): boolean {
  return recognitionConstructor() !== null;
}

export const browserRecognizerFactory: RecognizerFactory = (lang, handlers: RecognizerHandlers) => {
  const ctor = recognitionConstructor();
  if (!ctor) {
    // Unsupported browsers fail deterministically at start() time with the
    // "unsupported" normalized code; UI built later can also pre-check
    // isSpeechRecognitionSupported() to avoid rendering a microphone.
    const err: SpeechError = { code: "unsupported" };
    return {
      start() {
        handlers.onError(err);
        handlers.onEnd();
      },
      stop() {},
      abort() {},
    };
  }

  const recognition = new ctor();
  recognition.lang = lang;
  // Single-utterance recognition matches both product flows: Basic Voice
  // (one spoken query) and Smart Find Trip (one spoken sentence).
  recognition.continuous = false;
  // Interim results let future UI show a live transcript preview; the final
  // result is the only one future flows act on.
  recognition.interimResults = true;
  // We never use alternates in the MVP; 1 is also the browser default.
  recognition.maxAlternatives = 1;

  recognition.onstart = () => handlers.onStart();

  recognition.onresult = (event) => {
    // Concatenate every result batch of the CURRENT session (browser emits
    // 0..n events; each event may contain multiple results). Reading from
    // resultIndex to the end of the list avoids double-counting earlier
    // batches and matches the documented event semantics.
    let transcript = "";
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      transcript += result[0]?.transcript ?? "";
      if (result.isFinal) isFinal = true;
    }
    const payload: RecognitionResult = { transcript: transcript.trim(), isFinal };
    handlers.onResult(payload);
  };

  recognition.onerror = (event) => {
    handlers.onError({ code: normalizeSpeechErrorCode(event.error), rawCode: event.error });
  };

  recognition.onend = () => handlers.onEnd();

  return {
    start() {
      recognition.start();
    },
    stop() {
      recognition.stop();
    },
    abort() {
      recognition.abort();
    },
  };
};