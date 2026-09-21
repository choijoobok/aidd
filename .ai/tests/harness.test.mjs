import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { harnessErrors } from "../tools/aidd_hook.mjs";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const CODEX=JSON.parse(readFileSync(join(ROOT,".codex/hooks.json"),"utf8"));
const CODEX_EXPORT=JSON.parse(readFileSync(join(ROOT,".aidd-kit-dev/export/.codex/hooks.json"),"utf8"));
const CLAUDE=JSON.parse(readFileSync(join(ROOT,".claude/settings.json"),"utf8"));
const CLAUDE_EXPORT=JSON.parse(readFileSync(join(ROOT,".aidd-kit-dev/export/.claude/settings.json"),"utf8"));

function handlers(provider){
  return Object.entries(provider.hooks).flatMap(([event,groups])=>groups.flatMap((group,groupIndex)=>(group.hooks??[]).map((handler,handlerIndex)=>({event,groupIndex,handlerIndex,handler}))));
}

function runtime(handler){
  const source=[handler.command,...(handler.args??[])].filter(Boolean).join(" ").replaceAll("\\","/");
  return source.match(/\.ai\/hooks\/([A-Za-z0-9._-]+\.mjs)/)?.[1]??null;
}

function runHook(file,payload,env={}){
  return spawnSync(process.execPath,[join(ROOT,".ai/hooks",file)],{
    cwd:ROOT,
    input:JSON.stringify(payload),
    encoding:"utf8",
    env:{...process.env,...env}
  });
}

function runHookAsync(path,payload,env={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path],{cwd:dirname(dirname(dirname(path))),env:{...process.env,...env}});
    let stderr="";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data",chunk=>{stderr+=chunk;});
    child.on("error",reject);
    child.on("close",status=>resolve({status,stderr}));
    child.stdin.end(JSON.stringify(payload));
  });
}

test("provider adapters implement the isolated portable hook contract",()=>{
  assert.deepEqual(harnessErrors(),[]);
  assert.deepEqual(CODEX,CODEX_EXPORT);
  assert.deepEqual(CLAUDE,CLAUDE_EXPORT);
});

test("every registered hook owns one runtime and stable registration slot",()=>{
  const codexSlots=handlers(CODEX).map(({event,groupIndex,handlerIndex,handler})=>`${event}:${groupIndex}:${handlerIndex}:${runtime(handler)}`);
  const claudeSlots=handlers(CLAUDE).map(({event,groupIndex,handlerIndex,handler})=>`${event}:${groupIndex}:${handlerIndex}:${runtime(handler)}`);
  assert.deepEqual(codexSlots,[
    "SessionStart:0:0:codex-session-brief.mjs",
    "SessionStart:0:1:codex-hook-review-reminder.mjs",
    "PreToolUse:0:0:codex-protect-file.mjs",
    "PreToolUse:1:0:codex-protect-shell.mjs",
    "PostToolUse:0:0:codex-post-check.mjs",
    "UserPromptSubmit:0:0:codex-log-user.mjs",
    "Stop:0:0:codex-log-assistant.mjs"
  ]);
  assert.deepEqual(claudeSlots,[
    "SessionStart:0:0:claude-session-brief.mjs",
    "PreToolUse:0:0:claude-protect-file.mjs",
    "PreToolUse:1:0:claude-protect-shell.mjs",
    "PostToolUse:0:0:claude-post-check.mjs",
    "UserPromptSubmit:0:0:claude-log-user.mjs",
    "Stop:0:0:claude-log-assistant.mjs"
  ]);
  const all=[...codexSlots,...claudeSlots].map(slot=>slot.split(":").at(-1));
  assert.equal(new Set(all).size,all.length);
});

test("Codex startup reminder preserves the one-time final-answer contract",()=>{
  const startup=runHook("codex-hook-review-reminder.mjs",{source:"startup"});
  assert.equal(startup.status,0,startup.stderr);
  const output=JSON.parse(startup.stdout.trim());
  assert.equal(output.continue,true);
  assert.match(output.systemMessage,/\[Codex 주의\]/);
  assert.match(output.hookSpecificOutput.additionalContext,/final_answer/);
  assert.match(output.hookSpecificOutput.additionalContext,/commentary/);
  assert.match(output.hookSpecificOutput.additionalContext,/이후 응답에서는 절대 반복하지 마세요/);

  const resume=runHook("codex-hook-review-reminder.mjs",{source:"resume"});
  assert.equal(resume.status,0,resume.stderr);
  const resumed=JSON.parse(resume.stdout.trim());
  assert.equal(resumed.hookSpecificOutput.additionalContext,resumed.systemMessage);
  assert.doesNotMatch(resumed.hookSpecificOutput.additionalContext,/final_answer|commentary/);
});

test("isolated protection hooks deny generated writes without depending on another hook",()=>{
  for(const file of ["codex-protect-file.mjs","codex-protect-shell.mjs","claude-protect-file.mjs","claude-protect-shell.mjs"]){
    const denied=runHook(file,{tool_input:{path:"project/docs/generated/status.md"}});
    assert.equal(denied.status,2,`${file}: ${denied.stderr}`);
    assert.match(denied.stderr,/read-only/);
    const allowed=runHook(file,{tool_input:{command:"node .ai/tools/aidd.mjs generate"}});
    assert.equal(allowed.status,0,`${file}: ${allowed.stderr}`);
  }
});

test("Codex and Claude append only complete provider-labelled conversation pairs",()=>{
  const folder=mkdtempSync(join(tmpdir(),"aidd-hook-log-"));
  const runtimeDir=join(folder,".ai","hooks");
  mkdirSync(runtimeDir,{recursive:true});
  const files=["codex-log-user.mjs","codex-log-assistant.mjs","claude-log-user.mjs","claude-log-assistant.mjs"];
  for(const file of files)cpSync(join(ROOT,".ai/hooks",file),join(runtimeDir,file));
  const runCopied=(file,payload)=>spawnSync(process.execPath,[join(runtimeDir,file)],{cwd:folder,input:JSON.stringify(payload),encoding:"utf8",env:{...process.env,AIDD_LOCAL_CONVERSATION_LOG:"1"}});
  try{
    const now=new Date(),month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`,day=`${month}-${String(now.getDate()).padStart(2,"0")}`;
    const path=join(folder,"chat-history",month,"raw",`${day}.md`);
    const codexUser={session_id:"codex-session",turn_id:"codex-turn",prompt:"codex-user-message"};
    const codexStop={session_id:"codex-session",turn_id:"codex-turn",last_assistant_message:"codex-assistant-message"};
    const claudeUser={session_id:"claude-session",prompt:"claude-user-message"};
    const claudeStop={session_id:"claude-session",last_assistant_message:"claude-assistant-message"};

    assert.equal(runCopied("codex-log-user.mjs",codexUser).status,0);
    assert.equal(exists(path),false,"UserPromptSubmit must not write a partial daily log");
    const codexRun=runCopied("codex-log-assistant.mjs",codexStop);
    assert.equal(codexRun.status,0,codexRun.stderr);
    const afterCodex=readFileSync(path,"utf8");
    assert.match(afterCodex,new RegExp(`^## \\[${day} \\d{2}:\\d{2}:\\d{2}\\] Codex\\n\\n### USER\\n\\ncodex-user-message\\n\\n### AI \\(Codex\\)\\n\\ncodex-assistant-message\\n\\n---\\n\\n$`));

    assert.equal(runCopied("claude-log-user.mjs",claudeUser).status,0);
    assert.equal(readFileSync(path,"utf8"),afterCodex,"staged Claude prompt must not appear before Stop");
    const claudeRun=runCopied("claude-log-assistant.mjs",claudeStop);
    assert.equal(claudeRun.status,0,claudeRun.stderr);
    const complete=readFileSync(path,"utf8");
    assert.match(complete,/## \[[^\]]+\] Claude\n\n### USER\n\nclaude-user-message\n\n### AI \(Claude\)\n\nclaude-assistant-message\n\n---\n\n$/);

    assert.equal(runCopied("claude-log-assistant.mjs",claudeStop).status,0);
    assert.equal(runCopied("codex-log-assistant.mjs",{session_id:"orphan",turn_id:"orphan",last_assistant_message:"orphan-assistant"}).status,0);
    assert.equal(readFileSync(path,"utf8"),complete,"duplicate or orphan Stop must not append a partial pair");
  }finally{
    rmSync(folder,{recursive:true,force:true});
  }
});

test("simultaneous sessions keep every user and assistant response in one locked block",async()=>{
  const folder=mkdtempSync(join(tmpdir(),"aidd-hook-log-concurrent-"));
  const runtimeDir=join(folder,".ai","hooks"),path=join(folder,"combined.md");
  mkdirSync(runtimeDir,{recursive:true});
  const files=["codex-log-user.mjs","codex-log-assistant.mjs","claude-log-user.mjs","claude-log-assistant.mjs"];
  for(const file of files)cpSync(join(ROOT,".ai/hooks",file),join(runtimeDir,file));
  const env={AIDD_LOCAL_CONVERSATION_LOG:"1",AIDD_CONVERSATION_LOG_FILE:path};
  const turns=Array.from({length:8},(_,index)=>({
    provider:index%2===0?"Codex":"Claude",
    session_id:`session-${index}`,
    turn_id:`turn-${index}`,
    user:`user-${index}-${"u".repeat(8000)}`,
    assistant:`assistant-${index}-${"a".repeat(8000)}`
  }));
  try{
    for(const turn of turns){
      const file=turn.provider==="Codex"?"codex-log-user.mjs":"claude-log-user.mjs";
      const payload={session_id:turn.session_id,prompt:turn.user};
      if(turn.provider==="Codex")payload.turn_id=turn.turn_id;
      const run=spawnSync(process.execPath,[join(runtimeDir,file)],{cwd:folder,input:JSON.stringify(payload),encoding:"utf8",env:{...process.env,...env}});
      assert.equal(run.status,0,run.stderr);
    }
    assert.equal(exists(path),false,"no staged prompt may reach the final log");

    const runs=await Promise.all(turns.map(turn=>{
      const file=turn.provider==="Codex"?"codex-log-assistant.mjs":"claude-log-assistant.mjs";
      const payload={session_id:turn.session_id,last_assistant_message:turn.assistant};
      if(turn.provider==="Codex")payload.turn_id=turn.turn_id;
      return runHookAsync(join(runtimeDir,file),payload,env);
    }));
    for(const run of runs)assert.equal(run.status,0,run.stderr);

    const blocks=readFileSync(path,"utf8").split("---\n\n").filter(Boolean);
    assert.equal(blocks.length,turns.length);
    for(const turn of turns){
      const block=blocks.find(value=>value.includes(turn.user));
      assert.ok(block,`missing ${turn.provider} user block`);
      assert.ok(block.includes(turn.assistant),`assistant response separated from ${turn.provider} user prompt`);
      assert.match(block,new RegExp(`^## \\[[^\\]]+\\] ${turn.provider}\\n\\n### USER\\n\\n`));
      assert.match(block,new RegExp(`\\n\\n### AI \\(${turn.provider}\\)\\n\\n`));
      assert.equal((block.match(/### USER/g)??[]).length,1);
      assert.equal((block.match(/### AI/g)??[]).length,1);
    }

    const duplicateUser={session_id:"duplicate-session",turn_id:"duplicate-turn",prompt:"duplicate-user"};
    const staged=spawnSync(process.execPath,[join(runtimeDir,"codex-log-user.mjs")],{cwd:folder,input:JSON.stringify(duplicateUser),encoding:"utf8",env:{...process.env,...env}});
    assert.equal(staged.status,0,staged.stderr);
    const duplicateStop={session_id:"duplicate-session",turn_id:"duplicate-turn",last_assistant_message:"duplicate-assistant"};
    const duplicates=await Promise.all([
      runHookAsync(join(runtimeDir,"codex-log-assistant.mjs"),duplicateStop,env),
      runHookAsync(join(runtimeDir,"codex-log-assistant.mjs"),duplicateStop,env)
    ]);
    for(const run of duplicates)assert.equal(run.status,0,run.stderr);
    const afterDuplicate=readFileSync(path,"utf8");
    assert.equal((afterDuplicate.match(/duplicate-user/g)??[]).length,1,"concurrent duplicate Stop must consume one pending prompt once");
    assert.equal((afterDuplicate.match(/duplicate-assistant/g)??[]).length,1,"concurrent duplicate Stop must append one complete block once");
  }finally{
    rmSync(folder,{recursive:true,force:true});
  }
});

function exists(path){
  try{readFileSync(path);return true;}catch{return false;}
}
