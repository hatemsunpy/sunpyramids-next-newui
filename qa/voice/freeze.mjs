import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
const production = [
  ...walk('lib/voice').filter(path => !path.includes('.test.')),
  'lib/header-voice-resolution.ts', 'lib/voice-copy.ts',
  'components/voice/VoiceSearchButton.tsx', 'components/voice/VoiceFindTripPanel.tsx',
  'components/HomeSearchShortcuts.tsx', 'app/api/voice/resolve/route.ts',
];
const inputs = ['qa/voice/corpus.v1.json', 'qa/voice/taxonomy.fixture.json',
  'qa/voice/asr-matrix.v1.json', 'qa/voice/README.md',
  'qa/voice/benchmark.test.ts', 'qa/voice/vitest.config.ts'];
const digest = path => createHash('sha256').update(readFileSync(path)).digest('hex');
writeFileSync('qa/voice/freeze.v1.json', JSON.stringify({
  frozenAt: new Date().toISOString(),
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  production: Object.fromEntries(production.sort().map(path => [path, digest(path)])),
  inputs: Object.fromEntries(inputs.map(path => [path, digest(path)])),
}, null, 2) + '\n');
