"use client";

import { useEffect, useId, useRef, useState } from "react";
import { voiceCopy } from "@/lib/voice-copy";
import { useSpeechRecognition } from "@/lib/voice/use-speech-recognition";
import type { RecognizerFactory } from "@/lib/voice/speech-recognizer";
import type { CapabilityField, CapabilityResult, SpeechErrorCode, VoiceTaxonomyInput } from "@/lib/voice/types";
import type { ApiPage, Locale } from "@/types/api";

export type FindTripValues = { destination: string; duration: string; category: string };

type Props = VoiceTaxonomyInput & {
  locale: Locale;
  values: FindTripValues;
  onApply: (changes: Partial<FindTripValues>) => void;
  factory?: RecognizerFactory;
  isSupported?: () => boolean;
};

function optionLabel(option: ApiPage): string {
  return option.title || option.name || option.slug || String(option.id || "");
}

function validDays(days: number): boolean {
  return Number.isInteger(days) && days >= 1 && days <= 45;
}

const errorKeys: Record<SpeechErrorCode, string> = {
  permission: "permissionDenied", "no-speech": "noSpeech", "audio-capture": "recognitionError",
  network: "recognitionError", "language-unavailable": "recognitionUnavailable",
  aborted: "cancelled", unsupported: "recognitionUnavailable", unknown: "recognitionError",
};

function informationalText(field: CapabilityField, locale: Locale): string {
  const copy = voiceCopy(locale);
  if (field.field === "month") return new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2020, Number(field.value) - 1, 1)));
  if (field.field === "privacy") return copy[String(field.value)];
  if (field.field === "travelers" && typeof field.value === "object" && !("raw" in field.value)) {
    const travelers = field.value;
    return [travelers.total !== undefined ? String(travelers.total) : "", travelers.adults !== undefined ? `${copy.adults}: ${travelers.adults}` : "", travelers.children !== undefined ? `${copy.children}: ${travelers.children}` : ""].filter(Boolean).join(" · ");
  }
  return field.raw || "";
}

export function VoiceFindTripPanel({ locale, destinations, rootCategories, values, onApply, factory, isSupported }: Props) {
  const copy = voiceCopy(locale);
  const voice = useSpeechRecognition(locale, factory, isSupported);
  const statusId = useId();
  const [review, setReview] = useState<CapabilityResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseFailed, setParseFailed] = useState(false);
  const session = useRef(0);
  const appliedSession = useRef(-1);
  const active = voice.status === "starting" || voice.status === "listening";

  // A final result may arrive in the same React batch as onEnd (idle).
  // Consume the transcript independently of recognition status, once per session.
  useEffect(() => {
    const transcript = voice.finalTranscript.trim();
    if (!transcript || appliedSession.current === session.current) return;
    const parsingSession = session.current;
    let disposed = false;
    Promise.resolve().then(async () => {
      if (disposed) return;
      setParsing(true);
      const [{ parseVoiceQuery }, { mapCapabilities }] = await Promise.all([
        import("@/lib/voice/parse-voice-query"), import("@/lib/voice/capability-mapper"),
      ]);
      if (disposed || session.current !== parsingSession) return;
      const capabilities = mapCapabilities(parseVoiceQuery(transcript, locale), { destinations, rootCategories });
      const changes: Partial<FindTripValues> = { category: "" };
      for (const field of capabilities.fields) {
        if (field.status !== "applicable") continue;
        if (field.field === "destination" && destinations.some((option) => option.slug === field.slug)) changes.destination = field.slug;
        if (field.field === "duration" && validDays(field.value)) changes.duration = String(field.value);
        if (field.field === "category" && rootCategories.some((option) => option.slug === field.slug)) changes.category = field.slug;
      }
      appliedSession.current = parsingSession;
      onApply(changes);
      setReview(capabilities);
      setParsing(false);
    }).catch(() => {
      if (disposed || session.current !== parsingSession) return;
      appliedSession.current = parsingSession;
      onApply({ category: "" });
      setParseFailed(true);
      setParsing(false);
    });
    return () => { disposed = true; };
  }, [voice.finalTranscript, locale, destinations, rootCategories, onApply]);

  function toggleRecognition() {
    if (active) { voice.stop(); return; }
    // Abort a recognizer still ending after a final result before restarting.
    voice.cancel();
    session.current += 1;
    setReview(null);
    setParseFailed(false);
    setParsing(false);
    voice.start();
  }

  const destination = destinations.find((option) => String(option.slug || option.id) === values.destination);
  const category = rootCategories.find((option) => option.slug === values.category);
  const visibleError = voice.error && !voice.error.intentional ? voice.error : null;
  const statusText = active ? copy.listening : parsing ? copy.smartProcessing : visibleError ? copy[errorKeys[visibleError.code]] : review ? copy.reviewReady : "";
  const showReview = Boolean(review || parseFailed);
  const dayLabel = (days: number | string) => `${days} ${copy.days}`;

  function reviewField(field: CapabilityField, index: number) {
    if (field.status === "applicable") return null;
    if ((field.field === "destination" || field.field === "category") && (field.status === "ambiguous" || field.status === "requires-confirmation")) {
      const options = field.field === "destination" ? destinations : rootCategories;
      const candidates = field.candidates.map((candidate) => options.find((option) => option.slug === candidate.slug)).filter((option): option is ApiPage => Boolean(option));
      return <li key={index}><strong>{copy[field.field]}: {field.status === "ambiguous" ? copy.chooseOne : copy.didYouMean}</strong> <span>{field.raw}</span><div className="voice-find-trip__choices">{candidates.map((option) => <button type="button" key={option.slug} aria-pressed={values[field.field] === option.slug} onClick={() => {
        if (options.some((live) => live.slug === option.slug)) onApply({ [field.field]: option.slug });
      }}>{optionLabel(option)}</button>)}</div>{!candidates.length ? <span>{copy.notFilter}</span> : null}</li>;
    }
    if (field.field === "duration" && (field.status === "ambiguous" || field.status === "requires-confirmation")) {
      const days = field.status === "requires-confirmation" ? [field.suggestedValue] : field.candidates.filter((candidate) => candidate.unit !== "nights").map((candidate) => candidate.unit === "weeks" ? candidate.value * 7 : candidate.value);
      const choices = [...new Set(days)].filter(validDays);
      return <li key={index}><strong>{copy.duration}: {field.status === "ambiguous" ? copy.chooseOne : copy.didYouMean}</strong> <span>{field.raw}</span><div className="voice-find-trip__choices">{choices.map((days) => <button type="button" key={days} aria-pressed={values.duration === String(days)} onClick={() => onApply({ duration: String(days) })}>{dayLabel(days)}</button>)}</div>{!choices.length ? <span>{copy.notFilter}</span> : null}</li>;
    }
    return <li key={index}><strong>{copy[field.field]}:</strong> {informationalText(field, locale)} <span>({copy.notFilter})</span></li>;
  }

  return <div className="voice-find-trip" data-hj-suppress data-clarity-mask="true">
    {voice.supported ? <button type="button" className="voice-find-trip__mic" aria-label={active ? copy.stopListening : copy.findTripVoice} aria-pressed={active} aria-describedby={statusText ? statusId : undefined} onClick={toggleRecognition} onKeyDown={(event) => {
      if (event.key === "Escape") { session.current += 1; voice.cancel(); setParsing(false); }
    }}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></svg>{active ? copy.stopListening : copy.findTripVoice}</button> : null}
    <p id={statusId} role="status" aria-live="polite">{statusText}</p>
    {active && voice.interimTranscript ? <p aria-hidden="true">{voice.interimTranscript}</p> : null}
    {visibleError ? <button type="button" onClick={toggleRecognition}>{copy.tryAgain}</button> : null}
    {showReview ? <section aria-label={copy.heard}><h3>{copy.heard}</h3><p className="voice-find-trip__transcript">“{voice.finalTranscript}”</p>{parseFailed || (review?.fields.length === 0 && !review.intent.keywords?.length) ? <p role="status">{copy.noMatch}</p> : null}</section> : null}
    {showReview || category ? <section aria-label={copy.applied}><h3>{copy.applied}</h3><ul className="voice-find-trip__applied">
      {destination ? <li>{copy.destination}: {optionLabel(destination)} ✓</li> : null}
      {values.duration ? <li>{copy.duration}: {dayLabel(values.duration)} ✓</li> : null}
      {category ? <li>{copy.category}: {optionLabel(category)} <button type="button" aria-label={`${copy.removeCategory}: ${optionLabel(category)}`} onClick={() => onApply({ category: "" })}>×</button></li> : null}
    </ul>{!values.destination || !values.duration ? <p>{copy.remainingRequired}</p> : null}</section> : null}
    {review && (review.fields.some((field) => field.status !== "applicable") || review.intent.keywords?.length) ? <section aria-label={copy.recognized}><h3>{copy.recognized}</h3><p>{copy.reviewInfo}</p><ul>{review.fields.map(reviewField)}{review.intent.keywords?.map((keyword) => <li key={keyword}>{keyword} ({copy.notFilter})</li>)}</ul></section> : null}
  </div>;
}
