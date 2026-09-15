import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const protocol = JSON.parse(await readFile(new URL('./protocol.v1.json', import.meta.url), 'utf8'));
assert.equal(protocol.locale, 'en-US');
assert.equal(protocol.continuous, true);
assert.equal(protocol.moderateBoost, 5);
assert.equal(protocol.maxAlternatives, 3);
assert.equal(protocol.curatedVocabulary.length, 18);
assert.equal(new Set(protocol.curatedVocabulary).size, protocol.curatedVocabulary.length);
assert.deepEqual(protocol.modes.map(({ id, phrases, maxAlternatives }) => ({ id, phrases, maxAlternatives })), [
  { id: 'A', phrases: false, maxAlternatives: 1 },
  { id: 'B', phrases: true, maxAlternatives: 1 },
  { id: 'C', phrases: false, maxAlternatives: 3 },
  { id: 'D', phrases: true, maxAlternatives: 3 }
]);
assert.equal(protocol.prompts.length, 27);
assert.equal(new Set(protocol.prompts.map(({ id }) => id)).size, protocol.prompts.length);
assert.equal(protocol.prompts.filter(({ context }) => context === 'negative').length, 6);
assert.deepEqual(protocol.prompts.filter(({ critical }) => critical).map(({ id }) => id), [
  'aswan-command', 'abu-simbel-command', 'sharm-command', 'nile-command'
]);
for (const prompt of protocol.prompts) {
  assert.equal(typeof prompt.phrase, 'string');
  assert.ok(prompt.phrase.length > 0);
  assert.ok(Array.isArray(prompt.expectedEntities));
}
console.log('Phase 7.25 contextual-biasing harness protocol: PASS');
