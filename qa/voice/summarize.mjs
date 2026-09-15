import { readFileSync, writeFileSync } from 'node:fs';
const baseline = JSON.parse(readFileSync('qa/voice/baseline.v1.results.json', 'utf8'));
const adjudication = JSON.parse(readFileSync('qa/voice/baseline.v1.adjudication.json', 'utf8'));
const invalid = new Set(adjudication.invalidOracleCases);
const locales = baseline.locales.map(raw => {
  const rows = baseline.results.filter(row => row.locale === raw.locale && !invalid.has(row.id));
  const challenge = rows.filter(row => row.partition === 'challenge');
  const safety = rows.filter(row => row.safetyCase);
  return { locale: raw.locale, raw, validLabels: {
    total: rows.length, pass: rows.filter(row => row.pass).length,
    percent: 100 * rows.filter(row => row.pass).length / rows.length,
    challengeTotal: challenge.length, challengePass: challenge.filter(row => row.pass).length,
    safetyTotal: safety.length, safetyPass: safety.filter(row => row.pass).length,
    falseConfidentApplicationCases: rows.filter(row => row.wrongApplied.length).length,
    confirmedFailures: rows.filter(row => !row.pass).map(row => row.id),
  }};
});
writeFileSync('qa/voice/baseline.v1.summary.json', JSON.stringify({
  rawTotal: baseline.results.length, rawPass: baseline.results.filter(row => row.pass).length,
  invalidOracleCases: [...invalid], validTotal: baseline.results.length - invalid.size,
  validPass: baseline.results.filter(row => row.pass && !invalid.has(row.id)).length,
  policy: 'Separate annotation adjudication; raw frozen results and recommendations are preserved. No production edits.',
  locales,
}, null, 2) + '\n');
