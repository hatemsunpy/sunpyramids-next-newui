"use client";

// VoiceSearchButton — reusable Basic Voice Search microphone for a single
// existing search form. Owns one useSpeechRecognition session, writes the
// final transcript into the caller-owned title input, then auto-submits via
// the caller-owned form's native requestSubmit() (existing GET behavior).
//
// Each rendered instance is fully independent (own hook session, own refs),
// so desktop and mobile Header search forms never interfere with each other.

import { useEffect, useId, useRef } from "react";
import { browserRecognizerFactory, isSpeechRecognitionSupported } from "@/lib/voice/browser-speech-recognizer";
import { useSpeechRecognition } from "@/lib/voice/use-speech-recognition";
import type { RecognizerFactory } from "@/lib/voice/speech-recognizer";
import type { SpeechErrorCode } from "@/lib/voice/types";
import { voiceCopy } from "@/lib/voice-copy";
import type { Locale } from "@/types/api";

export type VoiceSearchButtonProps = {
  locale?: Locale;
  // Explicit ownership: the exact pre-existing input + form this instance
  // may write to and submit. Never a global document query.
  inputRef: React.RefObject<HTMLInputElement | null>;
  formRef: React.RefObject<HTMLFormElement | null>;
  // Test-only injection points (production uses the browser defaults).
  factory?: RecognizerFactory;
  isSupported?: () => boolean;
};

function VoiceMicIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3.5" />
    </svg>
  );
}

function errorMessageKey(code: SpeechErrorCode): string {
  switch (code) {
    case "permission":
      return "permissionDenied";
    case "no-speech":
      return "noSpeech";
    case "audio-capture":
    case "network":
    case "unknown":
      return "recognitionError";
    case "language-unavailable":
    case "unsupported":
      return "recognitionUnavailable";
    case "aborted":
      return "cancelled";
    default:
      return "recognitionError";
  }
}

export function VoiceSearchButton({
  locale = "en",
  inputRef,
  formRef,
  factory,
  isSupported,
}: VoiceSearchButtonProps) {
  const copy = voiceCopy(locale);
  const voice = useSpeechRecognition(
    locale,
    factory ?? browserRecognizerFactory,
    isSupported ?? isSpeechRecognitionSupported,
  );
  const { supported, status, interimTranscript, finalTranscript, error, start, stop, cancel } = voice;
  const statusId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // Exactly-once submit bookkeeping, session-based (NOT transcript-text
  // based): each mic-started session gets an id; a session may submit once.
  // Two sessions recognizing the identical phrase therefore submit twice —
  // legitimately — while re-renders/status transitions can never resubmit.
  const sessionIdRef = useRef(0);
  const submittedSessionRef = useRef(0);

  const active = status === "listening" || status === "starting";

  // Final-result auto-submit: hook state (processing + non-empty final).
  // Interim results are never acted on.
  useEffect(() => {
    if (status !== "processing") return;
    const text = finalTranscript.trim();
    if (!text) return;
    if (submittedSessionRef.current === sessionIdRef.current) return;
    const input = inputRef.current;
    const form = formRef.current;
    if (!input || !form) return;
    submittedSessionRef.current = sessionIdRef.current;
    input.value = text;
    form.requestSubmit();
  }, [status, finalTranscript, inputRef, formRef]);

  // Manual-submission invalidation: if the user submits the form themselves
  // (Enter key / any submitter) while a voice session is still pending,
  // consume that session and abort recognition so a late voice result can
  // never create a second, unexpected search. Passive observation only —
  // the native submit behavior is never altered.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handleManualSubmit = () => {
      if (submittedSessionRef.current !== sessionIdRef.current) {
        submittedSessionRef.current = sessionIdRef.current;
        cancel();
      }
    };
    form.addEventListener("submit", handleManualSubmit);
    return () => form.removeEventListener("submit", handleManualSubmit);
  }, [formRef, cancel]);

  if (!supported) return null;

  const handleClick = () => {
    if (active) {
      stop();
      return;
    }
    sessionIdRef.current += 1;
    start();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Scoped to the focused mic button: Escape cancels recognition without
    // touching global keyboard handling (e.g. the mobile drawer stays open).
    if (event.key === "Escape" && active) {
      event.stopPropagation();
      cancel();
    }
  };

  // Intentional aborts are handled quietly: idle, no message, no submit.
  const visibleError = status === "error" && error && !error.intentional ? error : null;
  const statusText = active
    ? copy.listening
    : status === "processing"
      ? copy.processing
      : visibleError
        ? copy[errorMessageKey(visibleError.code)] ?? copy.recognitionError
        : "";

  const label = active ? copy.stopListening : copy.voiceSearch;

  return (
    <>
      <button
        type="button"
        className={`voice-mic${active ? " is-listening" : ""}${visibleError ? " has-error" : ""}`}
        aria-label={label}
        aria-pressed={active}
        aria-describedby={statusText ? `${statusId}-status` : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <VoiceMicIcon />
        {active ? <span className="voice-mic-dot" aria-hidden="true" /> : null}
      </button>
      {statusText ? (
        <span
          id={`${statusId}-status`}
          className={`voice-status${visibleError ? " voice-status--error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {active && interimTranscript ? (
            <>
              <span className="voice-status-label">{statusText}</span>{" "}
              <span className="voice-status-preview" aria-hidden="true">{interimTranscript}</span>
            </>
          ) : (
            statusText
          )}
          {visibleError ? (
            <>
              {" "}
              <button type="button" className="voice-status-retry" onClick={handleClick}>
                {copy.tryAgain}
              </button>
            </>
          ) : null}
        </span>
      ) : null}
    </>
  );
}