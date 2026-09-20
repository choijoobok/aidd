import assert from "node:assert/strict";
import test from "node:test";
import { codexHookReviewOutput, generatedWriteError, harnessErrors, skillSyncNotice } from "../tools/aidd_hook.mjs";

test("provider events implement the portable hook contract",()=>{
  assert.deepEqual(harnessErrors(),[]);
});

test("Codex sessions receive a prominent CLI hook review reminder",()=>{
  const output=codexHookReviewOutput();
  assert.equal(output.continue,true);
  assert.match(output.systemMessage,/AIDD Codex 훅 확인 필수/);
  assert.match(output.systemMessage,/Codex CLI/);
  assert.match(output.systemMessage,/`\/hooks`/);
});

test("generated outputs are protected without inspecting unrelated commands",()=>{
  const policy={generated_roots:["project/docs/generated/",".agents/skills/"],allowed_generators:["aidd.mjs generate","kit.mjs sync-providers"]};
  assert.match(generatedWriteError({tool_input:{path:"project/docs/generated/status.md"}},policy),/read-only/);
  assert.match(generatedWriteError({tool_input:{path:".agents/skills/aidd-status/SKILL.md"}},policy),/read-only/);
  assert.equal(generatedWriteError({tool_input:{command:"node .ai/tools/aidd.mjs generate"}},policy),null);
  assert.equal(generatedWriteError({tool_input:{command:"git status --short"}},policy),null);
  assert.equal(generatedWriteError({tool_input:{command:"Remove-Item unrelated.tmp"}},policy),null);
});

test("skill sync guidance uses the workspace role's available command",()=>{
  const portable={tool_input:{path:".ai/skills/aidd-delivery/SKILL.md"}};
  const maintainer={tool_input:{path:".aidd-kit-dev/skills/aidd-kit-release/SKILL.md"}};
  assert.match(skillSyncNotice(portable,"kit-source"),/kit\.mjs sync-providers/);
  assert.match(skillSyncNotice(maintainer,"kit-source"),/kit\.mjs sync-providers/);
  assert.match(skillSyncNotice(portable,"kit-template"),/aidd\.mjs sync-ai/);
  assert.match(skillSyncNotice(portable,"product-workspace"),/aidd\.mjs sync-ai/);
  assert.equal(skillSyncNotice(maintainer,"product-workspace"),null);
  assert.equal(skillSyncNotice({tool_input:{path:"project/src/app.mjs"}},"product-workspace"),null);
});
