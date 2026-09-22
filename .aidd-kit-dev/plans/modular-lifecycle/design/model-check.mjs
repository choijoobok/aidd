/** S03 bounded design experiment. Not the portable implementation or acceptance evidence. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

const canonical = value => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
    : value;
const digest = value => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
const definitionHash = record => digest({
  id: record.id, type: record.type, owner: record.owner, title: record.title,
  retired: record.lifecycle === "retired", definition: record.definition,
  relations: record.relations, extensions: record.extensions ?? {},
});
const analysisHash = record => digest({
  id: record.id, title: record.title, purpose: record.definition.purpose,
  requirements: record.relations.filter(edge => edge.type === "satisfies"),
  business_scope: record.definition.business_scope,
});

let checks = 0;
function check(name, run) { run(); checks += 1; console.log(`PASS ${name}`); }
const feature = {
  id: "FEAT-ONE", type: "FEAT", owner: {kind: "module", id: "MOD-A"},
  title: "취소", lifecycle: "draft", revision: 1,
  definition: {purpose: "취소 결과 확인", business_scope: "결제 전 주문", flow: []},
  relations: [{type: "satisfies", target: "REQ-ONE"}], execution: {status: "planned"},
};

check("definition and execution/authoring state are independent; retirement is not", () => {
  const after = structuredClone(feature);
  after.execution.status = "completed"; after.revision = 2; after.lifecycle = "active";
  assert.equal(definitionHash(feature), definitionHash(after));
  after.lifecycle = "retired";
  assert.notEqual(definitionHash(feature), definitionHash(after));
});

check("analysis inventory survives design elaboration, not changed business scope", () => {
  const after = structuredClone(feature);
  after.definition.flow = ["입력 검사", "취소 처리"];
  assert.equal(analysisHash(feature), analysisHash(after));
  assert.notEqual(definitionHash(feature), definitionHash(after));
  after.definition.business_scope = "결제 완료 주문도 허용";
  assert.notEqual(analysisHash(feature), analysisHash(after));
});

function effectiveRun(runs, currentInput) {
  const sameInput = runs.filter(run => run.input === currentInput);
  return sameInput.sort((a, b) => b.attempt - a.attempt)[0]?.result ?? "not_run";
}
check("latest failed blocks old passed and changed inputs have no inherited pass", () => {
  const runs = [{attempt: 1, input: "a", result: "passed"}, {attempt: 2, input: "a", result: "failed"}];
  assert.equal(effectiveRun(runs, "a"), "failed");
  assert.equal(effectiveRun(runs, "b"), "not_run");
  assert.equal(runs[0].result, "passed");
});

check("typed reverse traversal reaches indirect consumers and terminates cycles", () => {
  const edges = [
    {from: "FEAT-A", to: "DAT-X", type: "uses_data"},
    {from: "SCR-A", to: "FEAT-A", type: "presents"},
    {from: "TC-A", to: "SCR-A", type: "verifies"},
    {from: "DAT-X", to: "SCR-A", type: "uses_data"},
    {from: "MOD-C", to: "DAT-X", type: "context"},
  ];
  const visited = new Set(["DAT-X"]), queue = ["DAT-X"];
  while (queue.length) {
    const source = queue.shift();
    for (const edge of edges.filter(edge => edge.to === source && edge.type !== "context")) {
      if (!visited.has(edge.from)) { visited.add(edge.from); queue.push(edge.from); }
    }
  }
  assert.deepEqual([...visited].sort(), ["DAT-X", "FEAT-A", "SCR-A", "TC-A"]);
});

check("relevant blockers do not inherit unrelated module ownership", () => {
  const scope = new Set(["CHG-A", "REQ-A", "IFC-X"]);
  const open = [{id: "OI-B", applies_to: ["CHG-B"]}, {id: "OI-X", applies_to: ["IFC-X"]}];
  const blockers = open.filter(item => item.applies_to.includes("project") || item.applies_to.some(id => scope.has(id)));
  assert.deepEqual(blockers.map(item => item.id), ["OI-X"]);
});

const temporaryRoot = resolve(tmpdir());
const experimentDir = mkdtempSync(join(temporaryRoot, "aidd-s03-model-"));
try {
  check("local rename replaces a file while historical bytes stay separate", () => {
    const current = join(experimentDir, "current.json"), staged = join(experimentDir, "staged.json");
    const historical = join(experimentDir, "historical.json");
    writeFileSync(current, '{"value":"before"}\n', "utf8");
    const before = readFileSync(current);
    writeFileSync(historical, before);
    writeFileSync(staged, '{"value":"after"}\n', "utf8");
    renameSync(staged, current);
    assert.equal(JSON.parse(readFileSync(current, "utf8")).value, "after");
    assert.deepEqual(readFileSync(historical), before);
  });
} finally {
  assert.equal(dirname(resolve(experimentDir)), temporaryRoot);
  assert.ok(basename(experimentDir).startsWith("aidd-s03-model-"));
  rmSync(experimentDir, {recursive: true});
}
console.log(`${checks} design-model checks passed. No production readiness, concurrency, or crash recovery is certified.`);
