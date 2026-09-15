// Speech Recognizer Adapter — the smallest stable abstraction the React hook
// consumes so that no component ever depends on browser speech globals.
//
// The shape intentionally mirrors the real browser SpeechRecognition lifecycle
// (start/stop/abort + onStart/onResult/onError/onEnd) rather than inventing a
// generic event framework. Implementations: browser adapter (production) and
// FakeSpeechRecognizer (tests only).

import type { SpeechError } from "./types";

export type RecognitionResult = {
  // Text recognized so far in this recognition session (browser emits
  // incremental result events; the implementation hands us each batch).
  transcript: string;
  isFinal: boolean;
  // Optional complete indexed snapshot, for command capture. An index belongs
  // to one native recognition instance, not to an entire user command.
  segments?: { index: number; transcript: string; isFinal: boolean }[];
};

export type RecognizerHandlers = {
  onStart: () => void;
  onResult: (result: RecognitionResult) => void;
  onError: (error: SpeechError) => void;
  onEnd: () => void;
};

export interface SpeechRecognizer {
  start(): void;
  stop(): void;
  abort(): void;
}

// A recognizer that has already been configured with a recognition language.
export type RecognizerOptions = { continuous?: boolean; indexedResults?: boolean };
export type RecognizerFactory = (lang: string, handlers: RecognizerHandlers, options?: RecognizerOptions) => SpeechRecognizer;
