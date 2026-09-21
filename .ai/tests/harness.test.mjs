import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { codexHookReviewOutput, generatedWriteError, harnessErrors, skillSyncNotice } from "../tools/aidd_hook.mjs";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const CODEX_HOOKS=JSON.parse(readFileSync(join(ROOT,".codex/hooks.json"),"utf8"));
const KIT_AGENTS=readFileSync(join(ROOT,"AGENTS.md"),"utf8");
const PROJECT_AGENTS=readFileSync(join(ROOT,".aidd-role.json"),"utf8").includes('"role": "kit-source"')
  ? readFileSync(join(ROOT,".aidd-kit-dev/export/AGENTS.md"),"utf8")
  : KIT_AGENTS;

function codexHandlers(event){
  return (CODEX_HOOKS.hooks[event]??[]).flatMap(group=>group.hooks??[]);
}

test("provider events implement the portable hook contract",()=>{
  assert.deepEqual(harnessErrors(),[]);
});

test("Codex startup gives the UI and model the same non-blocking review reminder",()=>{
  const output=codexHookReviewOutput("startup");
  assert.equal(output.continue,true);
  assert.match(output.systemMessage,/\[Codex 주의\]/);
  assert.match(output.systemMessage,/Codex CLI/);
  assert.match(output.systemMessage,/`\/hooks`/);
  assert.equal(output.hookSpecificOutput.hookEventName,"SessionStart");
  assert.match(output.hookSpecificOutput.additionalContext,/\[Codex 주의\]/);
  assert.match(output.hookSpecificOutput.additionalContext,/final_answer/);
  assert.match(output.hookSpecificOutput.additionalContext,/commentary/);
  assert.match(output.hookSpecificOutput.additionalContext,/충족한 것으로 보지/);
  assert.match(output.hookSpecificOutput.additionalContext,/매 요청에 적용하는 지시가 아닙니다/);
  assert.match(output.hookSpecificOutput.additionalContext,/이후 응답에서는 절대 반복하지 마세요/);
  assert.match(output.hookSpecificOutput.additionalContext,/비차단/);
  assert.doesNotMatch(JSON.stringify(output),/permissionDecision|approval-gate|acknowledge/);
  assert.ok(KIT_AGENTS.includes(output.systemMessage));
  assert.ok(PROJECT_AGENTS.includes(output.systemMessage));
  assert.match(KIT_AGENTS,/이후 응답에서는 절대 반복하지 않는다/);
  assert.match(PROJECT_AGENTS,/이후 응답에서는 절대 반복하지 않는다/);
});

test("Codex resume keeps context without requesting another final-answer notice",()=>{
  const output=codexHookReviewOutput("resume");
  assert.equal(output.hookSpecificOutput.hookEventName,"SessionStart");
  assert.equal(output.hookSpecificOutput.additionalContext,output.systemMessage);
  assert.doesNotMatch(output.hookSpecificOutput.additionalContext,/final_answer|commentary/);
});

test("Codex hook commands resolve from the Git root and the configured reminder runs from a subdirectory",()=>{
  for(const handlers of Object.values(CODEX_HOOKS.hooks).flatMap(groups=>groups.map(group=>group.hooks??[]))){
    for(const handler of handlers){
      assert.match(handler.command,/git rev-parse --show-toplevel/);
      assert.match(handler.commandWindows,/git rev-parse --show-toplevel/);
      assert.match(handler.command,/\.aidd-role\.json/);
      assert.match(handler.commandWindows,/\.aidd-role\.json/);
    }
  }
  const reminder=codexHandlers("SessionStart").find(handler=>handler.command.includes("codex-hook-review-reminder"));
  assert.ok(reminder);
  assert.equal(reminder.additionalContextLimit,1000);
  const command=process.platform==="win32"?reminder.commandWindows:reminder.command;
  const run=spawnSync(command,{cwd:join(ROOT,".ai"),input:JSON.stringify({hook_event_name:"SessionStart",source:"startup"}),encoding:"utf8",shell:true});
  assert.equal(run.status,0,run.stderr);
  const output=JSON.parse(run.stdout.trim());
  assert.match(output.systemMessage,/\[Codex 주의\]/);
  assert.match(output.hookSpecificOutput.additionalContext,/final_answer/);
  assert.match(output.hookSpecificOutput.additionalContext,/commentary/);
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
