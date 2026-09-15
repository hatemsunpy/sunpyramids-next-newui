"use client";

// useSpeechRecognition — the only production-facing voice API future
// components will consume. Manages a single active recognizer session with:
//   - unmount → abort + no further state updates
//   - double start() → no duplicate sessions
//   - stale callbacks from previous sessions → ignored via session ids
//   - locale change mid-session → session abort (never mutate lang live)
//
// Auto-submit, parsing, and UI are intentionally NOT implemented here.

import { useCallback, useEffect, useRef, useState } from "react";
import { browserRecognizerFactory, isSpeechRecognitionSupported } from "./browser-speech-recognizer";
import type { RecognizerFactory, RecognizerHandlers, SpeechRecognizer } from "./speech-recognizer";
import { commandSpeechRecognizer, type CommandCaptureOptions } from "./command-speech-recognizer";
import { speechLanguageFor } from "./speech-languages";
import type { SpeechError, SpeechStatus } from "./types";
import type { Locale } from "@/types/api";

export type UseSpeechRecognition = {
  supported: boolean;
  status: SpeechStatus;
  interimTranscript: string;
  finalTranscript: string;
  error: SpeechError | null;
  start: () => void;
  stop: () => void;
  cancel: () => void;
};

export function useSpeechRecognition(
  locale: Locale,
  factory: RecognizerFactory = browserRecognizerFactory,
  isSupported: () => boolean = isSpeechRecognitionSupported,
  commandCapture?: CommandCaptureOptions,
): UseSpeechRecognition {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<SpeechError | null>(null);

  const sessionRef = useRef(0);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const mountedRef = useRef(true);

  // Detect capability on the client without a cascading synchronous setState
  // in the effect body: schedule the state update via rAF, which the lint
  // rule accepts and which matches how the codebase defers post-mount work
  // (requestAnimationFrame is also used in TripsFilterSidebar/Drawer). SSR
  // renders the idle/unsupported state, which upgrades after hydration.
  useEffect(() => {
    mountedRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      if (mountedRef.current) setSupported(isSupported());
    });
    return () => {
      mountedRef.current = false;
      window.cancelAnimationFrame(frame);
    };
    // Production defaults are module-level constants; test fakes are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Abort any active session when locale changes: recognition language is
  // fixed per session; mutating it mid-session is not supported behavior.
  // The stale session's callbacks are ignored via the session id, and the
  // status settles back to idle because the aborted session can never
  // deliver further state transitions we would honor.
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        sessionRef.current += 1; // invalidate the outgoing session's callbacks
        recognizerRef.current.abort();
        recognizerRef.current = null;
        if (mountedRef.current) setStatus("idle");
      }
    };
  }, [locale]);

  // Hard cleanup on unmount: abort and refuse any further state updates.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      recognizerRef.current?.abort();
      recognizerRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (recognizerRef.current) return; // session already active — no duplicates
    if (!isSupported()) {
      setStatus("error");
      setError({ code: "unsupported" });
      return;
    }

    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;

    setStatus("starting");
    setError(null);
    setInterimTranscript("");
    setFinalTranscript("");

    const handlers: RecognizerHandlers = {
      onStart: () => {
        if (sessionRef.current !== sessionId || !mountedRef.current) return;
        setStatus("listening");
      },
      onResult: (result) => {
        if (sessionRef.current !== sessionId || !mountedRef.current) return;
        if (result.isFinal) {
          setInterimTranscript("");
          setFinalTranscript(result.transcript);
          setStatus("processing");
        } else {
          setInterimTranscript(result.transcript);
        }
      },
      onError: (err) => {
        if (sessionRef.current !== sessionId || !mountedRef.current) return;
        recognizerRef.current = null;
        if (err.code === "aborted") {
          // Intentional cancellation is not a user-facing failure.
          setStatus("idle");
          setError({ ...err, intentional: true });
          return;
        }
        setStatus("error");
        setError(err);
      },
      onEnd: () => {
        if (sessionRef.current !== sessionId || !mountedRef.current) return;
        recognizerRef.current = null;
        setStatus("idle");
      },
    };
    const recognizer = commandCapture
      ? commandSpeechRecognizer(factory, speechLanguageFor(locale), handlers, commandCapture)
      : factory(speechLanguageFor(locale), handlers);

    recognizerRef.current = recognizer;
    recognizer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    recognizerRef.current?.abort();
  }, []);

  return {
    supported,
    status,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    cancel,
  };
}
