#!/usr/bin/env node
/** Isolated Codex UserPromptSubmit stager. Do not import another AIDD hook. */

import { createHash } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const WAIT_ARRAY=new Int32Array(new SharedArrayBuffer(4));
const MAX_ITEM_CHARS=120000;

if(process.env.AIDD_LOCAL_CONVERSATION_LOG!=="0"){
  try{
    const payload=JSON.parse(readFileSync(0,"utf8")||"{}");
    const prompt=String(payload.prompt??payload.message??payload.text??"").trim();
    const sessionId=String(payload.session_id??"").trim();
    const turnId=String(payload.turn_id??"").trim();
    if(prompt&&sessionId&&turnId){
      const key=createHash("sha256").update(`${ROOT}\0Codex\0${sessionId}`).digest("hex");
      const path=join(tmpdir(),"aidd-conversation-log","pending",`${key}.json`);
      mkdirSync(dirname(path),{recursive:true});
      withLock(path,()=>{
        const submittedAt=Date.now();
        let pending={version:2,prompts:[]};
        if(existsSync(path)){
          try{
            const current=JSON.parse(readFileSync(path,"utf8"));
            if(Array.isArray(current.prompts))pending={version:2,prompts:current.prompts};
            else if(String(current.prompt??"").trim())pending.prompts.push({submitted_at:Number(current.started_at)||submittedAt,turn_id:turnId,prompt:String(current.prompt).slice(0,MAX_ITEM_CHARS)});
          }catch{}
        }
        pending.prompts.push({submitted_at:submittedAt,turn_id:turnId,prompt:prompt.slice(0,MAX_ITEM_CHARS)});
        writeFileSync(path,JSON.stringify(pending),"utf8");
      });
    }
  }catch{console.error("AIDD Codex user conversation staging failed.");process.exitCode=1;}
}

function withLock(path,action){
  const folder=join(tmpdir(),"aidd-conversation-log","locks");
  const lock=join(folder,`${createHash("sha256").update(path).digest("hex")}.lock`);
  const deadline=Date.now()+5000;
  mkdirSync(folder,{recursive:true});
  while(true){
    try{const handle=openSync(lock,"wx");closeSync(handle);break;}
    catch(error){
      if(error?.code!=="EEXIST")throw error;
      try{if(Date.now()-statSync(lock).mtimeMs>15000)unlinkSync(lock);}catch{}
      if(Date.now()>=deadline)throw new Error("lock-timeout");
      Atomics.wait(WAIT_ARRAY,0,0,25);
    }
  }
  try{action();}finally{try{unlinkSync(lock);}catch{}}
}
