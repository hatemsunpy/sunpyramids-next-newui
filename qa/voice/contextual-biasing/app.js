const protocol = await fetch('./protocol.v1.json', { cache: 'no-store' }).then((response) => response.json());

const byId = (id) => document.getElementById(id);
const ui = {
  runtimeSummary: byId('runtime-summary'), runtimeJson: byId('runtime-json'), mode: byId('mode'), plan: byId('plan'),
  prompt: byId('prompt'), boost: byId('boost'), progress: byId('progress'), spokenPrompt: byId('spoken-prompt'),
  timer: byId('timer'), startRun: byId('start-run'), startAttempt: byId('start-attempt'), stopAttempt: byId('stop-attempt'),
  nextAttempt: byId('next-attempt'), primary: byId('primary'), alternatives: byId('alternatives'), events: byId('events'),
  attemptCount: byId('attempt-count'), latestJson: byId('latest-json'), download: byId('download'), clear: byId('clear')
};

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const Phrase = window.SpeechRecognitionPhrase;
const state = { runtime: null, attempts: [], queue: [], queueIndex: -1, recognizer: null, activeAttempt: null, stopTimer: null };

function ownShape(value) {
  if (!value) return null;
  const prototype = Object.getPrototypeOf(value);
  return {
    ownKeys: Reflect.ownKeys(value).map(String),
    prototypeKeys: prototype ? Reflect.ownKeys(prototype).map(String) : [],
    values: Object.fromEntries(Reflect.ownKeys(value).filter((key) => typeof key === 'string').map((key) => {
      try { return [key, value[key]]; } catch (error) { return [key, `[throws: ${String(error)}]`]; }
    }))
  };
}

function phraseSupportProbe(recognition) {
  const evidence = {
    constructorPresent: typeof Phrase === 'function',
    constructorName: Phrase?.name ?? null,
    constructorLength: Phrase?.length ?? null,
    constructorSource: Phrase ? String(Phrase) : null,
    propertyInRecognition: 'phrases' in recognition,
    initialValue: null,
    phraseShape: null,
    assignment: { attempted: false, threw: false, error: null, readbackLength: null },
    replacement: { attempted: false, threw: false, error: null, readback: null },
    boostBoundaryProbe: []
  };
  try { evidence.initialValue = recognition.phrases ?? null; } catch (error) { evidence.initialValue = `[throws: ${String(error)}]`; }
  if (!evidence.constructorPresent || !evidence.propertyInRecognition) return evidence;

  try {
    const phrase = new Phrase('Cairo', protocol.moderateBoost);
    evidence.phraseShape = ownShape(phrase);
    evidence.assignment.attempted = true;
    recognition.phrases = [phrase];
    evidence.assignment.readbackLength = recognition.phrases?.length ?? null;
  } catch (error) {
    evidence.assignment.threw = true;
    evidence.assignment.error = String(error);
  }

  for (const boost of [0, 5, 10, -0.1, 10.1]) {
    try {
      const phrase = new Phrase('Cairo', boost);
      evidence.boostBoundaryProbe.push({ boost, accepted: true, readback: phrase.boost ?? null });
    } catch (error) {
      evidence.boostBoundaryProbe.push({ boost, accepted: false, error: String(error) });
    }
  }

  try {
    evidence.replacement.attempted = true;
    recognition.phrases = [new Phrase('Aswan', 5)];
    recognition.phrases = [new Phrase('Nile', 5), new Phrase('Luxor', 5)];
    evidence.replacement.readback = Array.from(recognition.phrases ?? []).map((item) => ({ phrase: item.phrase, boost: item.boost }));
  } catch (error) {
    evidence.replacement.threw = true;
    evidence.replacement.error = String(error);
  }
  return evidence;
}

function inspectRuntime() {
  const evidence = {
    capturedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    speechRecognition: typeof window.SpeechRecognition,
    webkitSpeechRecognition: typeof window.webkitSpeechRecognition,
    selectedConstructor: window.SpeechRecognition ? 'SpeechRecognition' : window.webkitSpeechRecognition ? 'webkitSpeechRecognition' : null,
    selectedConstructorSource: Recognition ? String(Recognition) : null,
    configuredLocale: protocol.locale,
    continuousRequested: protocol.continuous,
    maxAlternativesRequested: protocol.maxAlternatives,
    recognitionShape: null,
    phraseSupport: null,
    configurationErrors: []
  };
  if (!Recognition) return evidence;
  const recognition = new Recognition();
  try { recognition.lang = protocol.locale; } catch (error) { evidence.configurationErrors.push({ field: 'lang', error: String(error) }); }
  try { recognition.continuous = true; } catch (error) { evidence.configurationErrors.push({ field: 'continuous', error: String(error) }); }
  try { recognition.interimResults = true; } catch (error) { evidence.configurationErrors.push({ field: 'interimResults', error: String(error) }); }
  try { recognition.maxAlternatives = protocol.maxAlternatives; } catch (error) { evidence.configurationErrors.push({ field: 'maxAlternatives', error: String(error) }); }
  evidence.recognitionShape = {
    lang: recognition.lang,
    continuous: recognition.continuous,
    interimResults: recognition.interimResults,
    maxAlternatives: recognition.maxAlternatives,
    ownKeys: Reflect.ownKeys(recognition).map(String),
    prototypeKeys: Reflect.ownKeys(Object.getPrototypeOf(recognition)).map(String)
  };
  evidence.phraseSupport = phraseSupportProbe(recognition);
  return evidence;
}

function phrasesUsable() {
  const support = state.runtime?.phraseSupport;
  return Boolean(support?.constructorPresent && support?.propertyInRecognition && support?.assignment.attempted && !support?.assignment.threw);
}

function renderRuntime() {
  state.runtime = inspectRuntime();
  ui.runtimeJson.textContent = JSON.stringify(state.runtime, null, 2);
  if (!Recognition) {
    ui.runtimeSummary.textContent = 'SpeechRecognition is unavailable in this runtime.';
    ui.runtimeSummary.classList.add('unsupported');
  } else if (phrasesUsable()) {
    ui.runtimeSummary.textContent = 'Native recognition and contextual phrase assignment are exposed. A microphone run is still required to prove operational support.';
    ui.runtimeSummary.classList.add('supported');
  } else {
    ui.runtimeSummary.textContent = 'Native recognition is exposed; contextual phrase assignment is unavailable in this runtime. N-best can still be measured.';
    ui.runtimeSummary.classList.add('unsupported');
  }
}

function populateControls() {
  for (const mode of protocol.modes) {
    const option = document.createElement('option');
    option.value = mode.id;
    option.textContent = `Mode ${mode.id} — ${mode.label}`;
    if (mode.phrases && !phrasesUsable()) option.disabled = true;
    ui.mode.append(option);
  }
  for (const prompt of protocol.prompts) {
    const option = document.createElement('option');
    option.value = prompt.id;
    option.textContent = `${prompt.id}: ${prompt.phrase}`;
    ui.prompt.append(option);
  }
  ui.boost.value = String(protocol.moderateBoost);
}

function selectedMode() { return protocol.modes.find((mode) => mode.id === ui.mode.value); }
function selectedPrompt() { return protocol.prompts.find((prompt) => prompt.id === ui.prompt.value); }

function buildQueue() {
  const mode = selectedMode();
  const plan = ui.plan.value;
  const prompts = plan === 'single' ? [selectedPrompt()] : plan === 'critical-three' ? protocol.prompts.filter((prompt) => prompt.critical) : protocol.prompts;
  const repeats = plan === 'critical-three' ? 3 : 1;
  return prompts.flatMap((prompt) => Array.from({ length: repeats }, (_, index) => ({ mode, prompt, repeat: index + 1, repeats })));
}

function renderCurrent() {
  const current = state.queue[state.queueIndex];
  if (!current) return;
  ui.progress.textContent = `Mode ${current.mode.id} · ${state.queueIndex + 1} of ${state.queue.length} · repeat ${current.repeat}/${current.repeats}`;
  ui.spokenPrompt.textContent = current.prompt.phrase;
  ui.primary.textContent = '—';
  ui.alternatives.replaceChildren();
  ui.events.textContent = '';
  ui.timer.textContent = '';
  ui.startAttempt.disabled = false;
  ui.nextAttempt.disabled = true;
}

function addEvent(type, detail = {}) {
  if (!state.activeAttempt) return;
  const event = { type, atMs: Math.round(performance.now() - state.activeAttempt.clockStart), ...detail };
  state.activeAttempt.events.push(event);
  ui.events.textContent = state.activeAttempt.events.map((item) => JSON.stringify(item)).join('\n');
}

function configureRecognizer(mode, attempt) {
  const recognition = new Recognition();
  recognition.lang = protocol.locale;
  recognition.continuous = protocol.continuous;
  recognition.interimResults = true;
  recognition.maxAlternatives = mode.maxAlternatives;
  attempt.configured = {
    lang: recognition.lang,
    continuous: recognition.continuous,
    interimResults: recognition.interimResults,
    maxAlternatives: recognition.maxAlternatives,
    phrasesRequested: mode.phrases,
    phraseCount: 0,
    boost: mode.phrases ? Number(ui.boost.value) : null
  };
  if (mode.phrases) {
    const values = protocol.curatedVocabulary.map((value) => new Phrase(value, attempt.configured.boost));
    recognition.phrases = values;
    attempt.configured.phraseCount = values.length;
    attempt.configured.phrasesReadback = Array.from(recognition.phrases ?? []).map((item) => ({ phrase: item.phrase, boost: item.boost }));
  }
  return recognition;
}

function onResult(event) {
  for (let resultIndex = event.resultIndex; resultIndex < event.results.length; resultIndex += 1) {
    const result = event.results[resultIndex];
    const alternatives = Array.from(result).map((alternative, alternativeIndex) => ({
      alternativeIndex,
      transcript: alternative.transcript,
      confidence: Number.isFinite(alternative.confidence) ? alternative.confidence : null
    }));
    const snapshot = { resultIndex, isFinal: result.isFinal, alternatives };
    state.activeAttempt.results.push(snapshot);
    addEvent('result', { resultIndex, isFinal: result.isFinal, alternativeCount: alternatives.length });
    ui.alternatives.replaceChildren(...alternatives.map((alternative) => {
      const item = document.createElement('li');
      item.textContent = `${alternative.transcript} (confidence ${alternative.confidence ?? 'unavailable'})`;
      return item;
    }));
  }
  const finals = state.activeAttempt.results.filter((result) => result.isFinal).map((result) => result.alternatives[0]?.transcript ?? '').filter(Boolean);
  state.activeAttempt.primaryFinalTranscript = finals.join(' ').trim();
  ui.primary.textContent = state.activeAttempt.primaryFinalTranscript || 'No final yet';
}

function finishAttempt() {
  clearTimeout(state.stopTimer);
  if (!state.activeAttempt || state.activeAttempt.completedAt) return;
  state.activeAttempt.completedAt = new Date().toISOString();
  state.activeAttempt.emptyFinal = !state.activeAttempt.primaryFinalTranscript;
  state.attempts.push(state.activeAttempt);
  ui.latestJson.textContent = JSON.stringify(state.activeAttempt, null, 2);
  ui.attemptCount.textContent = `${state.attempts.length} attempts retained in page memory.`;
  state.activeAttempt = null;
  state.recognizer = null;
  ui.stopAttempt.disabled = true;
  ui.startAttempt.disabled = true;
  ui.nextAttempt.disabled = state.queueIndex >= state.queue.length - 1;
  if (state.queueIndex >= state.queue.length - 1) ui.progress.textContent += ' · run complete';
}

ui.startRun.addEventListener('click', () => {
  if (!Recognition) return;
  state.queue = buildQueue();
  state.queueIndex = 0;
  renderCurrent();
});

ui.startAttempt.addEventListener('click', () => {
  const current = state.queue[state.queueIndex];
  if (!current || state.activeAttempt) return;
  const attempt = {
    sequence: state.attempts.length + 1,
    startedAt: new Date().toISOString(),
    clockStart: performance.now(),
    mode: current.mode,
    prompt: current.prompt,
    repeat: current.repeat,
    configured: null,
    results: [],
    events: [],
    primaryFinalTranscript: '',
    error: null,
    completedAt: null
  };
  state.activeAttempt = attempt;
  try {
    const recognition = configureRecognizer(current.mode, attempt);
    state.recognizer = recognition;
    recognition.onstart = () => addEvent('start');
    recognition.onaudiostart = () => addEvent('audiostart');
    recognition.onspeechstart = () => addEvent('speechstart');
    recognition.onspeechend = () => addEvent('speechend');
    recognition.onaudioend = () => addEvent('audioend');
    recognition.onresult = onResult;
    recognition.onerror = (event) => {
      attempt.error = { error: event.error ?? null, message: event.message ?? null };
      addEvent('error', attempt.error);
    };
    recognition.onnomatch = () => addEvent('nomatch');
    recognition.onend = () => { addEvent('end'); finishAttempt(); };
    recognition.start();
    ui.startAttempt.disabled = true;
    ui.stopAttempt.disabled = false;
    let remaining = 7;
    ui.timer.textContent = `Automatic stop in ${remaining}s`;
    const tick = setInterval(() => {
      remaining -= 1;
      ui.timer.textContent = `Automatic stop in ${remaining}s`;
      if (remaining <= 0 || !state.activeAttempt) clearInterval(tick);
    }, 1000);
    state.stopTimer = setTimeout(() => {
      if (state.recognizer) { addEvent('automatic-stop-call'); state.recognizer.stop(); }
    }, 7000);
  } catch (error) {
    attempt.error = { error: 'configuration-or-start', message: String(error) };
    addEvent('configuration-or-start-error', attempt.error);
    finishAttempt();
  }
});

ui.stopAttempt.addEventListener('click', () => {
  if (state.recognizer) { addEvent('manual-stop-call'); state.recognizer.stop(); }
  ui.stopAttempt.disabled = true;
});

ui.nextAttempt.addEventListener('click', () => {
  if (state.queueIndex < state.queue.length - 1) { state.queueIndex += 1; renderCurrent(); }
});

ui.download.addEventListener('click', () => {
  const artifact = {
    phase: '7.25', version: 1, exportedAt: new Date().toISOString(),
    privacy: { audioRecorded: false, analytics: false, productionStorage: false, thirdPartySttAdded: false, llm: false },
    protocol, runtime: state.runtime,
    attempts: state.attempts.map(({ clockStart, ...attempt }) => attempt)
  };
  const blob = new Blob([`${JSON.stringify(artifact, null, 2)}\n`], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `phase7-25-contextual-asr-${new Date().toISOString().replaceAll(':', '').replaceAll('.', '')}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

ui.clear.addEventListener('click', () => {
  state.attempts = [];
  ui.attemptCount.textContent = '0 attempts retained in page memory.';
  ui.latestJson.textContent = '';
});

renderRuntime();
populateControls();
