#!/usr/bin/env node
/** Isolated Claude Stop pair logger. Do not import another AIDD hook. */

import { createHash } from "node:crypto";
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const WAIT_ARRAY=new Int32Array(new SharedArrayBuffer(4));

if(process.env.AIDD_LOCAL_CONVERSATION_LOG!=="0"){
  try{
    const payload=JSON.parse(readFileSync(0,"utf8")||"{}");
    const message=String(payload.last_assistant_message??payload.assistant_message??payload.message??payload.text??"").trim();
    const sessionId=String(payload.session_id??"").trim();
    if(message&&sessionId){
      const key=createHash("sha256").update(`${ROOT}\0Claude\0${sessionId}`).digest("hex");
      const pendingPath=join(tmpdir(),"aidd-conversation-log","pending",`${key}.json`);
      withLock(pendingPath,()=>{
        if(existsSync(pendingPath)){
          const pending=JSON.parse(readFileSync(pendingPath,"utf8"));
          const startedAt=new Date(Number(pending.started_at));
          if(!Number.isNaN(startedAt.valueOf())&&String(pending.prompt??"").trim()){
            const path=resolve(process.env.AIDD_CONVERSATION_LOG_FILE??join(ROOT,"chat-history",month(startedAt),"raw",`${day(startedAt)}.md`));
            const entry=`## [${stamp(startedAt)}] Claude\n\n### USER\n\n${String(pending.prompt).slice(0,16000)}\n\n### AI (Claude)\n\n${message.slice(0,16000)}\n\n---\n\n`;
            withLock(path,()=>{
              const current=existsSync(path)?statSync(path).size:0;
              if(current+Buffer.byteLength(entry,"utf8")>5242880)throw new Error("size-limit");
              mkdirSync(dirname(path),{recursive:true});
              appendFileSync(path,entry,{encoding:"utf8",flag:"a"});
            });
            unlinkSync(pendingPath);
          }
        }
      });
    }
  }catch(error){
    console.error(error?.message==="size-limit"?"AIDD Claude conversation log size limit reached.":"AIDD Claude conversation pair write failed.");
    process.exitCode=1;
  }
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

function pad(value){return String(value).padStart(2,"0");}
function month(date){return `${date.getFullYear()}-${pad(date.getMonth()+1)}`;}
function day(date){return `${month(date)}-${pad(date.getDate())}`;}
function stamp(date){return `${day(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;}
