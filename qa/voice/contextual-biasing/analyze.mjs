import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const here = new URL("./", import.meta.url);
const readJson = async (name) =>
  JSON.parse(await readFile(new URL(name, here), "utf8"));

const protocol = await readJson("protocol.v1.json");
const baselineFiles = [
  "native-baseline.v1.json",
  "native-baseline-repeat.v1.json",
];
const baselineEvidence = await Promise.all(baselineFiles.map(readJson));
const biasEvidence = await readJson("native-biased-unsupported.v1.json");
const nBestFiles = [
  "native-nbest-critical.v1.json",
  "native-nbest-critical-repeat.v1.json",
];
const nBestEvidence = await Promise.all(nBestFiles.map(readJson));

const normalize = (text) =>
  String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const containsTerm = (transcript, term) =>
  ` ${normalize(transcript)} `.includes(` ${normalize(term)} `);

const containsFiveDays = (transcript) =>
  /(?:^|\s)(?:5|five)\s+days?(?:\s|$)/.test(normalize(transcript));

function primaryMetrics(attempts) {
  const positive = attempts.filter(({ prompt }) => prompt.context !== "negative");
  const negative = attempts.filter(({ prompt }) => prompt.context === "negative");
  const command = positive.filter(({ prompt }) => prompt.importantFields);
  const entitySlots = positive.flatMap((attempt) =>
    attempt.prompt.expectedEntities.map((entity) => ({ attempt, entity })),
  );
  const exactSlots = entitySlots.filter(({ attempt, entity }) =>
    containsTerm(attempt.primaryFinalTranscript, entity),
  );
  const allEntities = positive.filter((attempt) =>
    attempt.prompt.expectedEntities.every((entity) =>
      containsTerm(attempt.primaryFinalTranscript, entity),
    ),
  );
  const fullCommands = command.filter((attempt) =>
    attempt.prompt.importantFields.every((field) =>
      field === "5 days"
        ? containsFiveDays(attempt.primaryFinalTranscript)
        : containsTerm(attempt.primaryFinalTranscript, field),
    ),
  );
  const empty = attempts.filter(
    ({ primaryFinalTranscript }) => !normalize(primaryFinalTranscript),
  );
  const falseInsertions = negative.filter((attempt) =>
    protocol.curatedVocabulary.some((term) =>
      containsTerm(attempt.primaryFinalTranscript, term),
    ),
  );

  return {
    attempts: attempts.length,
    positiveAttempts: positive.length,
    negativeAttempts: negative.length,
    entitySlots: entitySlots.length,
    exactEntitySlots: exactSlots.length,
    exactEntitySlotRate: exactSlots.length / entitySlots.length,
    missingEntitySlots: entitySlots.length - exactSlots.length,
    missingEntitySlotRate: 1 - exactSlots.length / entitySlots.length,
    attemptsWithAllExpectedEntities: allEntities.length,
    allExpectedEntitiesRate: allEntities.length / positive.length,
    commandAttempts: command.length,
    fullCommands: fullCommands.length,
    fullCommandRate: command.length ? fullCommands.length / command.length : null,
    emptyFinals: empty.length,
    emptyFinalRate: empty.length / attempts.length,
    falseDomainInsertions: falseInsertions.length,
    falseDomainInsertionRate: negative.length
      ? falseInsertions.length / negative.length
      : null,
  };
}

function entityBreakdown(attempts) {
  const result = {};
  for (const attempt of attempts) {
    for (const entity of attempt.prompt.expectedEntities) {
      result[entity] ??= { slots: 0, exactSurvivals: 0 };
      result[entity].slots += 1;
      if (containsTerm(attempt.primaryFinalTranscript, entity)) {
        result[entity].exactSurvivals += 1;
      }
    }
  }
  for (const item of Object.values(result)) {
    item.rate = item.exactSurvivals / item.slots;
  }
  return result;
}

function finalAlternatives(attempt) {
  return attempt.results
    .filter(({ isFinal }) => isFinal)
    .flatMap(({ alternatives }) => alternatives ?? [])
    .map(({ transcript, confidence, alternativeIndex }) => ({
      transcript,
      confidence,
      alternativeIndex,
    }));
}

function nBestMetrics(attempts) {
  let failedPrimaryEntitySlots = 0;
  let recoveredEntitySlots = 0;
  const recoveryExamples = [];
  const maximumAlternativeCountPerAttempt = [];

  for (const attempt of attempts) {
    const finalResults = attempt.results.filter(({ isFinal }) => isFinal);
    maximumAlternativeCountPerAttempt.push(
      Math.max(0, ...finalResults.map(({ alternatives }) => alternatives?.length ?? 0)),
    );
    const alternatives = finalAlternatives(attempt);
    for (const entity of attempt.prompt.expectedEntities) {
      if (containsTerm(attempt.primaryFinalTranscript, entity)) continue;
      failedPrimaryEntitySlots += 1;
      const secondary = alternatives.filter(({ alternativeIndex }) => alternativeIndex > 0);
      const recovery = secondary.find(({ transcript }) => containsTerm(transcript, entity));
      if (recovery) {
        recoveredEntitySlots += 1;
        recoveryExamples.push({
          promptId: attempt.prompt.id,
          repeat: attempt.repeat,
          entity,
          primary: attempt.primaryFinalTranscript,
          recovery,
        });
      }
    }
  }

  const alternativeCountDistribution = maximumAlternativeCountPerAttempt.reduce(
    (counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return {
    requestedMaxAlternatives: protocol.maxAlternatives,
    failedPrimaryEntitySlots,
    recoveredEntitySlots,
    recoveryRate: failedPrimaryEntitySlots
      ? recoveredEntitySlots / failedPrimaryEntitySlots
      : null,
    maximumAlternativeCountPerAttempt,
    alternativeCountDistribution,
    recoveryExamples,
  };
}

const baselineAttempts = baselineEvidence.flatMap(({ attempts }) => attempts);
assert.equal(baselineAttempts.length, 54);
assert.ok(baselineAttempts.every(({ mode }) => mode.id === "A"));
assert.equal(biasEvidence.attempts.length, 1);
assert.equal(biasEvidence.attempts[0].mode.id, "B");
assert.equal(biasEvidence.attempts[0].configured.phrasesRequested, true);
assert.equal(biasEvidence.attempts[0].configured.phraseCount, 18);
assert.equal(biasEvidence.attempts[0].error?.error, "phrases-not-supported");
const nBestAttempts = nBestEvidence.flatMap(({ attempts }) => attempts);
assert.equal(nBestAttempts.length, 24);
assert.ok(nBestAttempts.every(({ mode }) => mode.id === "C"));
assert.ok(
  nBestAttempts.every(
    ({ configured }) => configured.maxAlternatives === protocol.maxAlternatives,
  ),
);

const analysis = {
  phase: "7.25",
  version: 1,
  generatedAt: new Date().toISOString(),
  method: {
    exactEntitySurvival:
      "Case-folded, punctuation-folded whole-term occurrence in the primary final transcript.",
    fullCommandPreservation:
      "Every declared important field is present; five/five-day forms are accepted for the 5 days field.",
    caution:
      "Missing exact terms are auditable. Separate substitution from truncation/omission only by reviewing raw transcripts; this analyzer does not infer alignment from absent audio.",
  },
  sources: {
    baselineFiles,
    contextualBiasing: "native-biased-unsupported.v1.json",
    nBest: nBestFiles,
  },
  totals: {
    recognizerStartAttempts:
      baselineAttempts.length + biasEvidence.attempts.length + nBestAttempts.length,
    attemptsReachingAudioLifecycle:
      baselineAttempts.length + nBestAttempts.length,
    contextualBiasingStartsRejectedBeforeAudio: biasEvidence.attempts.length,
  },
  baseline: {
    combined: primaryMetrics(baselineAttempts),
    runs: baselineEvidence.map((evidence, index) => ({
      file: baselineFiles[index],
      exportedAt: evidence.exportedAt,
      metrics: primaryMetrics(evidence.attempts),
    })),
    entityBreakdown: entityBreakdown(baselineAttempts),
  },
  contextualBiasing: {
    requested: {
      vocabularySize: biasEvidence.attempts[0].configured.phraseCount,
      boost: biasEvidence.attempts[0].configured.boost,
      maxAlternatives: biasEvidence.attempts[0].configured.maxAlternatives,
    },
    operationalResult: "unsupported",
    error: biasEvidence.attempts[0].error,
    events: biasEvidence.attempts[0].events,
    transcript: biasEvidence.attempts[0].primaryFinalTranscript,
    measurableTranscriptionMetrics: null,
  },
  nBest: {
    primaryMetrics: primaryMetrics(nBestAttempts),
    entityBreakdown: entityBreakdown(nBestAttempts),
    alternatives: nBestMetrics(nBestAttempts),
    runs: nBestEvidence.map((evidence, index) => ({
      file: nBestFiles[index],
      exportedAt: evidence.exportedAt,
      attempts: evidence.attempts.length,
    })),
  },
};

await writeFile(
  new URL("analysis.v1.json", here),
  `${JSON.stringify(analysis, null, 2)}\n`,
);
console.log("Phase 7.25 evidence analysis: PASS");
console.log(JSON.stringify(analysis.totals));
console.log(JSON.stringify(analysis.baseline.combined));
console.log(JSON.stringify(analysis.nBest.alternatives));
