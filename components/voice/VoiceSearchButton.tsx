"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { withLocale } from "@/lib/locales";
import type { HeaderVoiceFilters, HeaderVoiceResolution } from "@/lib/header-voice-resolution";
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
  onNavigate?: () => void;
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
  onNavigate,
}: VoiceSearchButtonProps) {
  const { push } = useRouter();
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
  const requestRef = useRef<AbortController | null>(null);
  const [resolving, setResolving] = useState(false);
  const [serviceFailed, setServiceFailed] = useState(false);
  const [review, setReview] = useState<Extract<HeaderVoiceResolution, { mode: "structured" }> | null>(null);

  const active = status === "listening" || status === "starting";

  // Final and onEnd can share a React batch. Resolve the final transcript
  // independently of lifecycle status; stale requests cannot navigate.
  useEffect(() => {
    const text = finalTranscript.trim();
    if (!text) return;
    if (submittedSessionRef.current === sessionIdRef.current) return;
    const input = inputRef.current;
    const form = formRef.current;
    if (!input || !form) return;
    const session = sessionIdRef.current;
    const controller = new AbortController();
    let disposed = false;
    Promise.resolve().then(async () => {
      if (disposed) return;
      submittedSessionRef.current = session;
      requestRef.current = controller;
      setResolving(true);
      const response = await fetch("/api/voice/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, locale }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("resolution-unavailable");
      const resolution = await response.json() as HeaderVoiceResolution;
      if (disposed || controller.signal.aborted || session !== sessionIdRef.current) return;
      setResolving(false);
      if (resolution.mode === "title") {
        input.value = text;
        form.requestSubmit();
        return;
      }
      if (resolution.decisions.length) {
        setReview(resolution);
        return;
      }
      const params = new URLSearchParams(resolution.applicable);
      if (!params.size) throw new Error("invalid-resolution");
      push(withLocale(`/trips?${params.toString()}`, locale));
      onNavigate?.();
    }).catch(() => {
      if (disposed || controller.signal.aborted || session !== sessionIdRef.current) return;
      input.value = text;
      setResolving(false);
      setServiceFailed(true);
    });
    return () => {
      disposed = true;
      controller.abort();
    };
  }, [finalTranscript, locale, inputRef, formRef, push, onNavigate]);

  // Manual-submission invalidation: if the user submits the form themselves
  // (Enter key / any submitter) while a voice session is still pending,
  // consume that session and abort recognition so a late voice result can
  // never create a second, unexpected search. Passive observation only —
  // the native submit behavior is never altered.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handleManualSubmit = () => {
      sessionIdRef.current += 1;
      submittedSessionRef.current = sessionIdRef.current;
      requestRef.current?.abort();
      cancel();
      setReview(null);
      setResolving(false);
      setServiceFailed(false);
    };
    form.addEventListener("submit", handleManualSubmit);
    const input = inputRef.current;
    input?.addEventListener("input", handleManualSubmit);
    return () => {
      form.removeEventListener("submit", handleManualSubmit);
      input?.removeEventListener("input", handleManualSubmit);
    };
  }, [formRef, inputRef, cancel]);

  if (!supported) return null;

  const handleClick = () => {
    if (active) {
      stop();
      return;
    }
    requestRef.current?.abort();
    cancel();
    sessionIdRef.current += 1;
    setReview(null);
    setServiceFailed(false);
    setResolving(false);
    start();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Scoped to the focused mic button: Escape cancels recognition without
    // touching global keyboard handling (e.g. the mobile drawer stays open).
    if (event.key === "Escape" && (active || resolving || review || serviceFailed)) {
      event.stopPropagation();
      sessionIdRef.current += 1;
      submittedSessionRef.current = sessionIdRef.current;
      requestRef.current?.abort();
      cancel();
      setReview(null);
      setResolving(false);
      setServiceFailed(false);
    }
  };

  // Intentional aborts are handled quietly: idle, no message, no submit.
  const visibleError = error && !error.intentional ? error : null;
  const statusText = active
    ? copy.listening
    : resolving
      ? copy.smartProcessing
      : serviceFailed
        ? copy.resolverUnavailable
        : visibleError
          ? copy[errorMessageKey(visibleError.code)] ?? copy.recognitionError
          : "";

  const label = active ? copy.stopListening : copy.voiceSearch;
  const fieldLabels = { days: copy.duration, destination: copy.destination, main: copy.category };

  function confirm(field: keyof HeaderVoiceFilters, value?: string) {
    if (!review) return;
    const applicable = { ...review.applicable };
    if (value) applicable[field] = value;
    const decisions = review.decisions.filter((decision) => decision.field !== field);
    if (!decisions.length && Object.keys(applicable).length) {
      setReview(null);
      push(withLocale(`/trips?${new URLSearchParams(applicable).toString()}`, locale));
      onNavigate?.();
    } else setReview({ mode: "structured", applicable, decisions });
  }

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
          data-hj-suppress
          data-clarity-mask="true"
        >
          {active && interimTranscript ? (
            <>
              <span className="voice-status-label">{statusText}</span>{" "}
              <span className="voice-status-preview" aria-hidden="true">{interimTranscript}</span>
            </>
          ) : (
            statusText
          )}
          {visibleError || serviceFailed ? (
            <>
              {" "}
              <button type="button" className="voice-status-retry" onClick={handleClick}>
                {copy.tryAgain}
              </button>
            </>
          ) : null}
        </span>
      ) : null}
      {review ? (
        <div
          className="header-voice-review"
          role="group"
          aria-label={copy.headerVoiceReview}
          data-hj-suppress
          data-clarity-mask="true"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              setReview(null);
            }
          }}
        >
          <p role="status">{copy.headerVoiceReview}</p>
          <p>{copy.heard}: “{finalTranscript}”</p>
          {Object.keys(review.applicable).length ? (
            <p>{Object.entries(review.applicable)
              .map(([key, value]) => `${fieldLabels[key as keyof HeaderVoiceFilters]}: ${value}`)
              .join(" · ")}</p>
          ) : null}
          {review.decisions.map((decision) => (
            <fieldset key={decision.field}>
              <legend>
                {fieldLabels[decision.field]}: {decision.kind === "confirm" ? copy.didYouMean : decision.options.length ? copy.chooseOne : copy.notFilter}
              </legend>
              <div className="header-voice-review__choices">
                {decision.options.map((option) => (
                  <button type="button" key={option.value} onClick={() => confirm(decision.field, option.value)}>
                    {decision.field === "days" ? `${option.value} ${copy.days}` : option.label || option.value}
                  </button>
                ))}
                <button type="button" onClick={() => confirm(decision.field)}>{copy.ignoreVoiceFilter}</button>
              </div>
            </fieldset>
          ))}
          {!review.decisions.length ? <p>{copy.noVoiceFilters}</p> : null}
          <button type="button" className="voice-status-retry" onClick={() => setReview(null)}>{copy.dismissVoiceReview}</button>
        </div>
      ) : null}
    </>
  );
}
