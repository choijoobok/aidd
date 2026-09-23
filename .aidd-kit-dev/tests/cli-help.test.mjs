import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { COMMANDS, availability, commandIndex, missingOptions, suggestions } from '../../.ai/tools/lib/cli-contract.mjs';
import { OWNED_OPTIONS, V2_COMMANDS, ownedCommandHelp, bootstrapV2 } from '../../.ai/tools/lib/owned-cli.mjs';

const V2 = { role: 'product-workspace', format: 'owned-records-v2' }, TEMPLATE = { role: 'kit-template', format: null };

async function allCommands() {
  const previous = process.env.AIDD_LIBRARY_MODE; process.env.AIDD_LIBRARY_MODE = '1';
  try { return (await import('../../.ai/tools/aidd.mjs')).ALL_COMMANDS; }
  finally { if (previous === undefined) delete process.env.AIDD_LIBRARY_MODE; else process.env.AIDD_LIBRARY_MODE = previous; }
}
function cliRoot(t) {
  const root = mkdtempSync(join(tmpdir(), 'aidd-help-')); t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, '.ai'), { recursive: true });
  for (const dir of ['tools', 'templates', 'manifests']) cpSync(resolve(`.ai/${dir}`), join(root, `.ai/${dir}`), { recursive: true });
  writeFileSync(join(root, '.aidd-role.json'), JSON.stringify({ role: 'kit-template' }));
  const run = args => spawnSync(process.execPath, [join(root, '.ai/tools/aidd.mjs'), ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, AIDD_LIBRARY_MODE: '0' } });
  return { root, run };
}

test('every CLI command has one contract entry and the contract names only real commands', async () => {
  const commands = await allCommands();
  assert.deepEqual([...commands].filter(name => !COMMANDS[name]), []);
  assert.deepEqual(Object.keys(COMMANDS).filter(name => !commands.has(name)), []);
  for (const [name, contract] of Object.entries(COMMANDS)) { assert(contract.summary && contract.group && contract.availability, name); }
});

test('command help never repeats a flag and every required flag is a parseable option', () => {
  for (const [command, text] of Object.entries(OWNED_OPTIONS)) {
    const keys = text.split(' ').filter(Boolean);
    assert.equal(new Set(keys).size, keys.length, `${command}: duplicate option names`);
    for (const key of [...(COMMANDS[command].required ?? []), ...(COMMANDS[command].one_of ?? []).flat()]) assert(keys.includes(key), `${command}: --${key} is required but not parseable`);
    const help = ownedCommandHelp(command, V2), flags = [...help.matchAll(/^ {2}--([a-z-]+)/gm)].map(m => m[1]);
    assert.equal(new Set(flags).size, flags.length, `${command}: duplicate flag in help`);
    assert.match(help, /^사용법: /); assert.match(help, /^필수: /m);
  }
});

test('the missing-option error names exactly the flags the help calls required', t => {
  const { root, run } = cliRoot(t); bootstrapV2(root, { 'project-id': 'PRJ-HELP', name: 'help' });
  for (const command of Object.keys(OWNED_OPTIONS)) {
    const { missing, unmet } = missingOptions(command, {});
    if (!missing.length && !unmet.length) continue;
    const result = run([command]);
    assert.equal(result.status, 2, `${command}: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /^ERROR: usage: /);
    for (const key of missing) assert(result.stderr.includes(`--${key}`), `${command}: error omits --${key}`);
    for (const group of unmet) assert(result.stderr.includes(group.map(key => `--${key}`).join(' 또는 ')), `${command}: error omits one-of group ${group}`);
    assert.match(result.stderr, new RegExp(`'${command} --help'`));
    const help = run([command, '--help']); assert.equal(help.status, 0, help.stderr);
    for (const key of missing) assert.match(help.stdout, new RegExp(`--${key} VALUE \\(필수\\)`), `${command}: help does not mark --${key} required`);
  }
});

test('the command index shows only currently usable commands as usable', () => {
  const [templateUsable, templateBlocked] = commandIndex(Object.keys(COMMANDS), TEMPLATE).split('현재 사용할 수 없는 명령:');
  assert.match(templateUsable, /제품 정본 없음\(kit-template\)/); assert.match(templateUsable, /project-bootstrap/); assert.match(templateUsable, /sync-ai/);
  assert.doesNotMatch(templateUsable, /^ {2}(record-put|status|generate) /m); assert.match(templateBlocked, /제품 명령 \d+개 — project-bootstrap으로/);
  const [v2Usable, v2Blocked] = commandIndex(Object.keys(COMMANDS), V2).split('현재 사용할 수 없는 명령:');
  assert.match(v2Usable, /^ {2}record-put /m); assert.match(v2Usable, /^ {2}generate /m); assert.match(v2Usable, /^ {2}status /m); assert.doesNotMatch(v2Usable, /migrate-module-specs|project-bootstrap/);
  assert.match(v2Blocked, /migrate-module-specs/); assert.match(v2Blocked, /project-bootstrap/);
  for (const name of V2_COMMANDS) assert.equal(availability(name, { role: 'product-workspace', format: 'legacy' }).available, false, name);
  assert.equal(availability('migrate-module-specs', { role: 'product-workspace', format: 'legacy' }).available, true);
});

test('unknown and unavailable commands stop with exit 2 and a pointer to help', t => {
  const { root, run } = cliRoot(t);
  let result = run(['recod-put']); assert.equal(result.status, 2); assert.match(result.stderr, /unknown_command/); assert.match(result.stderr, /record-put/);
  result = run(['nope', '--help']); assert.equal(result.status, 2); assert.match(result.stderr, /unknown_command/);
  result = run(['status']); assert.equal(result.status, 2); assert.match(result.stderr, /unavailable_command/); assert.match(result.stderr, /project-bootstrap/);
  result = run([]); assert.equal(result.status, 0, result.stderr); assert.match(result.stdout, /역할 kit-template/);
  assert.deepEqual(suggestions('recod-put', Object.keys(COMMANDS)), ['record-put']);
  bootstrapV2(root, { 'project-id': 'PRJ-GUARD', name: 'guard' });
  result = run(['project-bootstrap', '--project-id', 'X', '--name', 'Y']); assert.equal(result.status, 2); assert.match(result.stderr, /unavailable_command/);
  result = run(['migrate-module-specs']); assert.equal(result.status, 2); assert.match(result.stderr, /unavailable_command/);
  result = run(['record-put', '--help']); assert.equal(result.status, 0); assert.match(result.stdout, /status:"known"/); assert.match(result.stdout, /--create 또는 --expected-hash 중 하나/);
});
