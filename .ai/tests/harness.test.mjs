import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { harnessErrors } from "../tools/aidd_hook.mjs";

const root=resolve(import.meta.dirname,"../..");
const text=path=>readFileSync(resolve(root,path),"utf8");

test("hook contract and provider JSON are well formed",()=>{
  assert.deepEqual(harnessErrors(),[]);
  const contract=JSON.parse(text(".ai/hooks/contract.json"));
  assert.deepEqual(contract.events.PreToolUse.required_tokens,["protect","--kind","file","shell"]);
  assert.equal("approval_gate" in contract,false);
});

test("portable hooks retain operational actions without an approval gate",()=>{
  const hook=text(".ai/tools/aidd_hook.mjs");
  for(const action of ["session-brief","self-test","protect","post-check","local-log"])assert.match(hook,new RegExp(`action===\\"${action}\\"`));
  const dispatcher=hook.slice(hook.indexOf("function main"));
  assert.doesNotMatch(dispatcher,/action===\"(?:approval-gate|approval-status|acknowledge)\"/);
});
