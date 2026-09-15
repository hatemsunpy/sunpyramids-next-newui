import type { RecognitionResult, RecognizerFactory, RecognizerHandlers, SpeechRecognizer } from "./speech-recognizer";

export type CommandCaptureOptions = {
  continuous: boolean;
  quietMs: number;
  maxRestarts: number;
  maxCaptureMs: number;
};

// A UX starting point, not a linguistic rule or a statistically optimal pause.
export const HEADER_COMMAND_CAPTURE: CommandCaptureOptions = {
  continuous: true, quietMs: 800, maxRestarts: 1, maxCaptureMs: 30_000,
};
// Normal completion follows native onend immediately. This is only a hard
// drain bound for an engine that stops responding, including manual Stop.
const SETTLE_MS = 1000;

// Replayed boundaries can overlap after a native restart. Compare words only;
// no spelling repair, aliases, or travel interpretation belongs in capture.
function joinContinuation(previous: string, next: string): string {
  const before = previous.trim().split(/\s+/).filter(Boolean);
  const after = next.trim().split(/\s+/).filter(Boolean);
  let overlap = Math.min(before.length, after.length);
  while (overlap && !before.slice(-overlap).every((word, index) => word.toLowerCase() === after[index].toLowerCase())) overlap -= 1;
  return [...before, ...after.slice(overlap)].join(" ");
}

// Adapts ASR segment finals into one command final. The shared React hook
// still owns locale, mounting, and explicit command-session boundaries.
export function commandSpeechRecognizer(
  factory: RecognizerFactory,
  lang: string,
  handlers: RecognizerHandlers,
  options: CommandCaptureOptions,
): SpeechRecognizer {
  let engine: SpeechRecognizer | null = null;
  let generation = 0;
  let closed = false;
  let started = false;
  let settling = false;
  let restarts = 0;
  let previousFinal = "";
  let currentFinal = "";
  let currentInterim = "";
  let quietTimer: ReturnType<typeof setTimeout> | undefined;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let captureTimer: ReturnType<typeof setTimeout> | undefined;

  const finalText = () => joinContinuation(previousFinal, currentFinal);
  function clearTimers() {
    clearTimeout(quietTimer);
    clearTimeout(settleTimer);
    clearTimeout(captureTimer);
  }
  function close() {
    closed = true;
    generation += 1;
    clearTimers();
    const outgoing = engine;
    engine = null;
    outgoing?.abort();
  }
  function finish() {
    if (closed) return;
    const transcript = finalText();
    close();
    if (transcript) handlers.onResult({ transcript, isFinal: true });
    handlers.onEnd();
  }
  function settle() {
    if (closed || settling) return;
    settling = true;
    clearTimeout(quietTimer);
    if (!engine) { finish(); return; }
    // stop() may deliver its last final before onend. A missing onend cannot
    // leave the microphone active forever; never promote interim text.
    settleTimer = setTimeout(finish, SETTLE_MS);
    engine.stop();
  }
  function speechActivity() {
    // Chrome can pause interim delivery while still decoding live speech.
    // Before a usable final, a result gap is not an utterance boundary.
    if (settling || !finalText()) return;
    clearTimeout(quietTimer);
    quietTimer = setTimeout(settle, options.quietMs);
  }
  function collect(recognized: RecognitionResult) {
    if (recognized.segments) {
      // Full snapshots replace indexed entries, including shrinking interim
      // tails. Repeated/growing native events therefore cannot append twice.
      const ordered = [...recognized.segments].sort((a, b) => a.index - b.index);
      currentFinal = ordered.filter((segment) => segment.isFinal).map((segment) => segment.transcript.trim()).filter(Boolean).join(" ");
      currentInterim = ordered.filter((segment) => !segment.isFinal).map((segment) => segment.transcript.trim()).filter(Boolean).join(" ");
    } else if (recognized.isFinal) {
      currentFinal = joinContinuation(currentFinal, recognized.transcript);
      currentInterim = "";
    } else currentInterim = recognized.transcript.trim();
    const preview = joinContinuation(finalText(), currentInterim);
    if (!preview) return;
    handlers.onResult({ transcript: preview, isFinal: false });
    if (currentFinal || currentInterim) speechActivity();
  }
  function openEngine() {
    const instance = ++generation;
    currentFinal = "";
    currentInterim = "";
    const valid = () => !closed && generation === instance;
    engine = factory(lang, {
      onStart: () => { if (valid()) handlers.onStart(); },
      onResult: (recognized) => { if (valid()) collect(recognized); },
      onError: (error) => {
        if (!valid()) return;
        if (error.code === "no-speech" && finalText()) { finish(); return; }
        close();
        handlers.onError(error);
      },
      onEnd: () => {
        if (!valid()) return;
        engine = null;
        generation += 1;
        if (settling) { finish(); return; }
        previousFinal = finalText();
        currentFinal = "";
        currentInterim = "";
        if (!previousFinal) { finish(); return; }
        if (restarts < options.maxRestarts) {
          restarts += 1;
          openEngine();
        }
        // Keep the original quiet deadline. An empty restart/onend must not
        // extend a command or create a native restart loop.
      },
    }, { continuous: options.continuous, indexedResults: true });
    engine.start();
  }
  return {
    start() {
      if (started || closed) return;
      started = true;
      captureTimer = setTimeout(settle, options.maxCaptureMs);
      openEngine();
    },
    stop: settle,
    abort() {
      if (closed) return;
      close();
      handlers.onError({ code: "aborted", intentional: true });
    },
  };
}
