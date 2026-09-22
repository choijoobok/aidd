import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { harnessErrors } from "../tools/aidd_hook.mjs";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const CODEX=JSON.parse(readFileSync(join(ROOT,".codex/hooks.json"),"utf8"));
const EXPORTED=existsSync(join(ROOT,".aidd-kit-dev/export/.codex/hooks.json"));
const CODEX_EXPORT=EXPORTED?JSON.parse(readFileSync(join(ROOT,".aidd-kit-dev/export/.codex/hooks.json"),"utf8")):null;
const CLAUDE=JSON.parse(readFileSync(join(ROOT,".claude/settings.json"),"utf8"));
const CLAUDE_EXPORT=EXPORTED?JSON.parse(readFileSync(join(ROOT,".aidd-kit-dev/export/.claude/settings.json"),"utf8")):null;

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
  if(EXPORTED){
    assert.deepEqual(CODEX,CODEX_EXPORT);
    assert.deepEqual(CLAUDE,CLAUDE_EXPORT);
  }
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
  for(const file of ["codex-protect-file.mjs","codex-protect-shell.mjs","claude-protect-file.mjs"]){
    const denied=runHook(file,{tool_input:{path:"project/docs/generated/status.md"}});
    assert.equal(denied.status,2,`${file}: ${denied.stderr}`);
    assert.match(denied.stderr,/read-only/);
  }
  const shell=runHook("claude-protect-shell.mjs",{tool_input:{command:"rm -rf project/docs/generated/status.md"}});
  assert.equal(shell.status,2,`claude-protect-shell.mjs: ${shell.stderr}`);
  assert.match(shell.stderr,/read-only/);
  for(const file of ["codex-protect-file.mjs","codex-protect-shell.mjs","claude-protect-file.mjs","claude-protect-shell.mjs"]){
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

test("Codex keeps steered prompts and visible progress, raises item limits, and rotates forward only",()=>{
  const folder=mkdtempSync(join(tmpdir(),"aidd-hook-codex-steering-"));
  const runtimeDir=join(folder,".ai","hooks"),path=join(folder,"codex-steering.md"),transcript=join(folder,"rollout.jsonl");
  mkdirSync(runtimeDir,{recursive:true});
  for(const file of ["codex-log-user.mjs","codex-log-assistant.mjs"])cpSync(join(ROOT,".ai/hooks",file),join(runtimeDir,file));
  const env={AIDD_LOCAL_CONVERSATION_LOG:"1",AIDD_CONVERSATION_LOG_FILE:path};
  const records=[
    {timestamp:"2026-09-22T01:00:00.000Z",type:"event_msg",payload:{type:"task_started",turn_id:"turn-first"}},
    {timestamp:"2026-09-22T01:00:01.000Z",type:"response_item",payload:{type:"message",role:"assistant",phase:"commentary",content:[{type:"output_text",text:"first visible progress"}]}},
    {timestamp:"2026-09-22T01:00:02.000Z",type:"response_item",payload:{type:"custom_tool_call",input:"changed-source-code-must-not-be-logged"}},
    {timestamp:"2026-09-22T01:00:03.000Z",type:"response_item",payload:{type:"reasoning",summary:"hidden-reasoning-must-not-be-logged"}},
    {timestamp:"2026-09-22T01:00:04.000Z",type:"event_msg",payload:{type:"turn_aborted",turn_id:"turn-first"}},
    {timestamp:"2026-09-22T01:00:05.000Z",type:"event_msg",payload:{type:"task_started",turn_id:"turn-second"}},
    {timestamp:"2026-09-22T01:00:06.000Z",type:"response_item",payload:{type:"message",role:"assistant",phase:"commentary",content:[{type:"output_text",text:"second visible progress"}]}},
    {timestamp:"2026-09-22T01:00:07.000Z",type:"response_item",payload:{type:"message",role:"assistant",phase:"final_answer",content:[{type:"output_text",text:"transcript final must not replace Stop output"}]}}
  ];
  writeFileSync(transcript,records.map(record=>JSON.stringify(record)).join("\n"),"utf8");
  const run=(file,payload)=>spawnSync(process.execPath,[join(runtimeDir,file)],{cwd:folder,input:JSON.stringify(payload),encoding:"utf8",env:{...process.env,...env}});
  try{
    const first=run("codex-log-user.mjs",{session_id:"steering-session",turn_id:"turn-first",prompt:"first user prompt"});
    assert.equal(first.status,0,first.stderr);
    const sameTurn=run("codex-log-user.mjs",{session_id:"steering-session",turn_id:"turn-first",prompt:"same-turn follow-up prompt"});
    assert.equal(sameTurn.status,0,sameTurn.stderr);
    const second=run("codex-log-user.mjs",{session_id:"steering-session",turn_id:"turn-second",prompt:"second user prompt"});
    assert.equal(second.status,0,second.stderr);
    assert.equal(exists(path),false,"queued prompts must remain pending until a complete response exists");

    const stop=run("codex-log-assistant.mjs",{session_id:"steering-session",turn_id:"turn-second",transcript_path:transcript,last_assistant_message:"final answer from Stop"});
    assert.equal(stop.status,0,stop.stderr);
    const block=readFileSync(path,"utf8");
    assert.ok(block.indexOf("first user prompt")<block.indexOf("same-turn follow-up prompt"),"same-turn prompts must keep submission order");
    assert.ok(block.indexOf("same-turn follow-up prompt")<block.indexOf("second user prompt"),"replacement-turn prompts must keep submission order");
    assert.ok(block.includes("first visible progress"));
    assert.ok(block.includes("second visible progress"));
    assert.ok(block.includes("final answer from Stop"));
    assert.ok(!block.includes("changed-source-code-must-not-be-logged"));
    assert.ok(!block.includes("hidden-reasoning-must-not-be-logged"));
    assert.ok(!block.includes("transcript final must not replace Stop output"));
    assert.equal((block.match(/#### Prompt/g)??[]).length,3);
    assert.equal((block.match(/#### Update/g)??[]).length,2);

    writeFileSync(path,"x".repeat(5242880),"utf8");
    const longPrompt="p".repeat(119980)+"-prompt-tail";
    const longAnswer="a".repeat(119980)+"-answer-tail";
    const staged=run("codex-log-user.mjs",{session_id:"rotate-session",turn_id:"rotate-turn",prompt:longPrompt});
    assert.equal(staged.status,0,staged.stderr);
    const rotated=run("codex-log-assistant.mjs",{session_id:"rotate-session",turn_id:"rotate-turn",last_assistant_message:longAnswer});
    assert.equal(rotated.status,0,rotated.stderr);
    assert.equal(readFileSync(path,"utf8").length,5242880,"a full daily file must not be appended to");
    const overflow=readFileSync(join(folder,"codex-steering-2.md"),"utf8");
    assert.ok(overflow.includes("-prompt-tail"),"Codex prompts through the 120000-character item limit must survive");
    assert.ok(overflow.includes("-answer-tail"),"Codex answers through the 120000-character item limit must survive");

    writeFileSync(join(folder,"codex-steering-2.md"),"y".repeat(5242880-500),"utf8");
    assert.equal(run("codex-log-user.mjs",{session_id:"big-session",turn_id:"big-turn",prompt:"big-"+"q".repeat(2000)}).status,0);
    assert.equal(run("codex-log-assistant.mjs",{session_id:"big-session",turn_id:"big-turn",last_assistant_message:"big-answer"}).status,0);
    assert.equal(run("codex-log-user.mjs",{session_id:"small-session",turn_id:"small-turn",prompt:"small-question"}).status,0);
    assert.equal(run("codex-log-assistant.mjs",{session_id:"small-session",turn_id:"small-turn",last_assistant_message:"small-answer"}).status,0);
    const third=readFileSync(join(folder,"codex-steering-3.md"),"utf8");
    assert.ok(third.includes("big-answer"),"a block too large for the current Codex file must move forward");
    assert.ok(third.includes("small-answer"),"a later Codex block must stay in the newest file");
    assert.ok(!readFileSync(join(folder,"codex-steering-2.md"),"utf8").includes("small-answer"),"Codex rotation must never fall back to an earlier file");
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

test("Claude protection hooks judge the write target and normalize Windows separators",()=>{
  const backslash=String.fromCharCode(92);
  const generated="project/docs/generated/status.md";
  const windows=("D:/workspace/"+generated).replaceAll("/",backslash);
  const deniedFile=runHook("claude-protect-file.mjs",{tool_name:"Write",tool_input:{file_path:windows,content:"x"}});
  assert.equal(deniedFile.status,2,"a Windows target path must not slip past file protection");
  const deniedShell=runHook("claude-protect-shell.mjs",{tool_name:"PowerShell",tool_input:{command:"Set-Content "+windows+" hi"}});
  assert.equal(deniedShell.status,2,"a Windows path in a shell command must not slip past shell protection");
  const mention=runHook("claude-protect-file.mjs",{tool_name:"Edit",tool_input:{file_path:"D:/workspace/.ai/hooks/README.md",old_string:"see "+generated,new_string:"see "+generated+" output"}});
  assert.equal(mention.status,0,"text that only mentions a generated path must stay editable");
  const disguised=runHook("claude-protect-file.mjs",{tool_name:"Write",tool_input:{file_path:"D:/workspace/"+generated,content:"node .ai/tools/aidd.mjs generate"}});
  assert.equal(disguised.status,2,"file content must not exempt a write into a generated root");
});

test("Claude PostToolUse advisories reach Claude instead of a silent exit 0",()=>{
  const advisory=runHook("claude-post-check.mjs",{tool_name:"Edit",tool_input:{file_path:join(ROOT,".ai/skills/aidd-status/SKILL.md")}});
  assert.equal(advisory.status,2,"Claude Code hides stderr from a hook that exits 0");
  assert.match(advisory.stderr,/AIDD note/);
  const quiet=runHook("claude-post-check.mjs",{tool_name:"Edit",tool_input:{file_path:join(ROOT,"README.md")}});
  assert.equal(quiet.status,0,quiet.stderr);
});

test("Claude Stop pairs staged prompts with transcript progress and the final assistant text",()=>{
  const folder=mkdtempSync(join(tmpdir(),"aidd-hook-claude-stop-"));
  const runtimeDir=join(folder,".ai","hooks");
  mkdirSync(runtimeDir,{recursive:true});
  for(const file of ["claude-log-user.mjs","claude-log-assistant.mjs"])cpSync(join(ROOT,".ai/hooks",file),join(runtimeDir,file));
  const path=join(folder,"transcript-pair.md"),transcript=join(folder,"transcript.jsonl");
  const env={AIDD_LOCAL_CONVERSATION_LOG:"1",AIDD_CONVERSATION_LOG_FILE:path};
  const records=[
    {type:"user",message:{role:"user",content:"claude-user-message"}},
    {type:"assistant",isSidechain:false,message:{role:"assistant",content:[{type:"text",text:"progress commentary"}]}},
    {type:"assistant",isSidechain:false,message:{role:"assistant",content:[{type:"thinking",thinking:"hidden-reasoning"},{type:"tool_use",id:"call-1",name:"Bash",input:{}}]}},
    {type:"user",isSidechain:false,message:{role:"user",content:[{type:"tool_result",tool_use_id:"call-1",content:"ok"}]}},
    {type:"assistant",isSidechain:false,message:{role:"assistant",content:[{type:"text",text:"claude-final-answer"}]}},
    {type:"assistant",isSidechain:true,message:{role:"assistant",content:[{type:"text",text:"subagent chatter"}]}}
  ];
  writeFileSync(transcript,records.map(record=>JSON.stringify(record)).join("\n"),"utf8");
  const run=(file,payload)=>spawnSync(process.execPath,[join(runtimeDir,file)],{cwd:folder,input:JSON.stringify(payload),encoding:"utf8",env:{...process.env,...env}});
  try{
    assert.equal(run("claude-log-user.mjs",{session_id:"transcript-session",prompt:"claude-user-message"}).status,0);
    const stop=run("claude-log-assistant.mjs",{session_id:"transcript-session",transcript_path:transcript,hook_event_name:"Stop"});
    assert.equal(stop.status,0,stop.stderr);
    const block=readFileSync(path,"utf8");
    assert.ok(block.includes("claude-user-message"),"the staged prompt must be paired with the response");
    assert.ok(block.includes("claude-final-answer"),"the final assistant text must be logged");
    assert.ok(block.includes("### AI PROGRESS (Claude)"),"interim assistant text must be logged as progress");
    assert.ok(block.includes("progress commentary"),"interim assistant text must be logged");
    assert.ok(!block.includes("hidden-reasoning"),"thinking must not be logged");
    assert.ok(!block.includes("subagent chatter"),"subagent output must not be logged");
    const tail=["### AI (Claude)","","claude-final-answer","","---",""].join(String.fromCharCode(10));
    assert.ok(block.endsWith(tail+String.fromCharCode(10)),"the last text block must be the final answer");
  }finally{
    rmSync(folder,{recursive:true,force:true});
  }
});

test("Claude keeps every prompt queued during one response and rotates a full daily file forward only",()=>{
  const folder=mkdtempSync(join(tmpdir(),"aidd-hook-claude-queue-"));
  const runtimeDir=join(folder,".ai","hooks"),path=join(folder,"claude-queue.md"),transcript=join(folder,"queue.jsonl");
  mkdirSync(runtimeDir,{recursive:true});
  for(const file of ["claude-log-user.mjs","claude-log-assistant.mjs"])cpSync(join(ROOT,".ai/hooks",file),join(runtimeDir,file));
  const env={AIDD_LOCAL_CONVERSATION_LOG:"1",AIDD_CONVERSATION_LOG_FILE:path};
  const run=(file,payload)=>spawnSync(process.execPath,[join(runtimeDir,file)],{cwd:folder,input:JSON.stringify(payload),encoding:"utf8",env:{...process.env,...env}});
  const answer=text=>writeFileSync(transcript,JSON.stringify({type:"assistant",timestamp:new Date().toISOString(),message:{role:"assistant",content:[{type:"text",text}]}}),"utf8");
  try{
    assert.equal(run("claude-log-user.mjs",{session_id:"queue-session",prompt:"first-question"}).status,0);
    assert.equal(run("claude-log-user.mjs",{session_id:"queue-session",prompt:"second-question"}).status,0);
    answer("queued-final-answer");
    const stop=run("claude-log-assistant.mjs",{session_id:"queue-session",transcript_path:transcript,hook_event_name:"Stop"});
    assert.equal(stop.status,0,stop.stderr);
    const block=readFileSync(path,"utf8");
    assert.ok(block.includes("#### Prompt 1"),"a steered turn must number its prompts");
    assert.ok(block.includes("first-question"),"the first prompt must survive a follow-up prompt");
    assert.ok(block.includes("second-question"),"the follow-up prompt must be logged");
    assert.ok(block.indexOf("first-question")<block.indexOf("second-question"),"prompts must keep submission order");

    writeFileSync(path,"x".repeat(5242880),"utf8");
    assert.equal(run("claude-log-user.mjs",{session_id:"rotate-session",prompt:"rotating-question"}).status,0);
    answer("rotated-final-answer");
    const rotated=run("claude-log-assistant.mjs",{session_id:"rotate-session",transcript_path:transcript,hook_event_name:"Stop"});
    assert.equal(rotated.status,0,rotated.stderr);
    assert.equal(readFileSync(path,"utf8").length,5242880,"a full daily file must not be appended to");
    assert.ok(readFileSync(join(folder,"claude-queue-2.md"),"utf8").includes("rotating-question"),"the overflow must continue in a numbered file");

    writeFileSync(join(folder,"claude-queue-2.md"),"y".repeat(5242880-500),"utf8");
    assert.equal(run("claude-log-user.mjs",{session_id:"big-session",prompt:"big-"+"q".repeat(2000)}).status,0);
    answer("big-answer");
    assert.equal(run("claude-log-assistant.mjs",{session_id:"big-session",transcript_path:transcript,hook_event_name:"Stop"}).status,0);
    assert.equal(run("claude-log-user.mjs",{session_id:"small-session",prompt:"small-question"}).status,0);
    answer("small-answer");
    assert.equal(run("claude-log-assistant.mjs",{session_id:"small-session",transcript_path:transcript,hook_event_name:"Stop"}).status,0);
    const third=readFileSync(join(folder,"claude-queue-3.md"),"utf8");
    assert.ok(third.includes("big-answer"),"a block too large for the current file must move forward");
    assert.ok(third.includes("small-answer"),"a later block must stay in the newest file");
    assert.ok(!readFileSync(join(folder,"claude-queue-2.md"),"utf8").includes("small-answer"),"rotation must never fall back to an earlier file");
  }finally{
    rmSync(folder,{recursive:true,force:true});
  }
});

test("Claude shell protection denies a generated target and leaves reading open",()=>{
  const generated="project/docs/generated/";
  const newline=String.fromCharCode(10);
  const cases=[
    ["ls -la "+generated,0],
    ["grep -rn TODO "+generated,0],
    ["sed -n 1,5p "+generated+"index.md",0],
    ["git log --oneline -- "+generated,0],
    ["cat > .ai/hooks/example.mjs <<EOF"+newline+"const roots=["+generated+"];"+newline+"EOF",0],
    ["echo hi > "+generated+"a.md",2],
    ["echo hi >"+generated+"a.md",2],
    ["rm -rf "+generated,2],
    ["ls -la && rm -rf "+generated+"a.md",2],
    ["cat a.md | tee "+generated+"a.md",2],
    ["sed -i s/a/b/ "+generated+"a.md",2],
    ["git checkout -- "+generated,2],
    ["Set-Content "+generated+"a.md hi",2],
    ["echo aidd.mjs generate >> "+generated+"a.md",2]
  ];
  for(const [command,status] of cases){
    const run=runHook("claude-protect-shell.mjs",{tool_name:"Bash",tool_input:{command,description:"regression"}});
    assert.equal(run.status,status,command+" gave "+run.status+" "+run.stderr);
  }
});

function exists(path){
  try{readFileSync(path);return true;}catch{return false;}
}
