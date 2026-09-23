import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TYPES, IMMUTABLE, DEFINITION_FIELDS, recordErrors, record } from '../../.ai/tools/lib/record-contracts.mjs';
import { POLICIES } from '../../.ai/tools/lib/readiness.mjs';

test('portable registry, static schema and executable contracts agree', () => {
  const registry = JSON.parse(readFileSync(new URL('../../.ai/manifests/record-types.json', import.meta.url)));
  const schema = JSON.parse(readFileSync(new URL('../../.ai/templates/project-skeleton/.aidd/schemas/owned-record.schema.json', import.meta.url)));
  const policies = JSON.parse(readFileSync(new URL('../../.ai/manifests/readiness-policies.json', import.meta.url)));
  const terminology = JSON.parse(readFileSync(new URL('../../.ai/manifests/terminology.json', import.meta.url)));
  assert.deepEqual(registry.types, TYPES); assert.deepEqual(schema.properties.type.enum, TYPES); assert.deepEqual(registry.immutable, [...IMMUTABLE]); assert.deepEqual(policies.gates, POLICIES);
  assert.deepEqual(TYPES.filter(type => !terminology.terms.some(term => term.term === type)), [], 'every v2 record type needs a shared glossary entry');
  for (const [type, keys] of Object.entries(DEFINITION_FIELDS)) { assert.deepEqual(registry.definition_fields[type], keys.split(' ')); const entry = schema.allOf.find(x => x.if.properties.type.const === type); assert.deepEqual(Object.keys(entry.then.properties.definition.properties), keys.split(' ')); }
});
test('unknown meaning is never hidden in execution or silently dropped from a typed definition', () => {
  const r = record('FEAT', 'FEAT-A', 'MOD-A', 'Feature'); r.execution.hidden_rule = 'refund twice'; assert(recordErrors(r).length);
  delete r.execution.hidden_rule; r.definition.unknown_rule = true; assert(recordErrors(r).length);
  delete r.definition.unknown_rule; r.extensions.unknown_rule = true; assert.deepEqual(recordErrors(r), []);
});
