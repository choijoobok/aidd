import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const base = '.aidd-kit-dev/plans/modular-lifecycle';
const report = JSON.parse(readFileSync(`${base}/acceptance/S10-results.json`, 'utf8'));

test('S10 acceptance maps every frozen requirement, criterion and scenario to current evidence or an explicit superseding decision', () => {
  const directory = `${base}/requirements`;
  const requirementFiles = readdirSync(directory).filter(name => /^KIT-REQ-018-\d{3}\.md$/.test(name)).sort();
  assert.equal(requirementFiles.length, report.summary.requirements_total);
  assert.equal(report.results.length, report.summary.requirements_total);
  const acceptance = readFileSync(join(directory, 'acceptance.md'), 'utf8');
  const scenarios = [...acceptance.matchAll(/^## ((?:ACC-\d{3})|E2E-001)\b/gm)].map(match => match[1]);
  assert.equal(scenarios.length, report.summary.scenarios_total);
  for (const [index, name] of requirementFiles.entries()) {
    const source = readFileSync(join(directory, name), 'utf8'), result = report.results[index], number = name.match(/(\d{3})\.md$/)[1];
    assert.equal(result.requirement, `KIT-REQ-018-${number}`);
    assert.equal(result.scenario, `ACC-${number}`); assert(scenarios.includes(result.scenario));
    assert.deepEqual(result.criteria, [1, 2, 3].map(n => `AC-${number}-${n}`));
    for (const criterion of result.criteria) assert(source.includes(`- ${criterion}:`), `${name}: ${criterion}`);
    if (result.status === 'verified') for (const path of result.evidence) assert(existsSync(path), `${result.requirement}: ${path}`);
    else { assert.equal(result.status, 'superseded'); assert.equal(result.decision, 'KIT-ADR-011'); }
  }
  assert.equal(report.results.filter(item => item.status === 'verified').length, report.summary.verified);
  assert.equal(report.results.filter(item => item.status === 'superseded').length, report.summary.superseded);
  assert.equal(report.results.flatMap(item => item.criteria).length, report.summary.acceptance_criteria_total);
  assert.equal(report.results.filter(item => item.status === 'verified').flatMap(item => item.criteria).length, report.summary.applicable_verified);
  assert.equal(report.results.filter(item => item.status === 'superseded').flatMap(item => item.criteria).length, report.summary.superseded_criteria);
  assert(scenarios.includes(report.e2e.scenario)); for (const path of report.e2e.evidence) assert(existsSync(path), path);
  const decision = JSON.parse(readFileSync('.aidd-kit-dev/decisions/KIT-ADR-011.json', 'utf8')); assert.equal(decision.status, 'accepted');
});
