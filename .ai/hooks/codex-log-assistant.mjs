#!/usr/bin/env node
/** Isolated Codex Stop pair logger. Do not import another AIDD hook. */

import { createHash } from "node:crypto";
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const WAIT_ARRAY=new Int32Array(new SharedArrayBuffer(4));
const MAX_ITEM_CHARS=120000;
const MAX_DAILY_FILE_BYTES=5242880;
const MAX_ROTATIONS=999;

if(process.env.AIDD_LOCAL_CONVERSATION_LOG!=="0"){
  try{
    const payload=JSON.parse(readFileSync(0,"utf8")||"{}");
    const message=String(payload.last_assistant_message??payload.assistant_message??payload.message??payload.text??"").trim();
    const sessionId=String(payload.session_id??"").trim();
    const turnId=String(payload.turn_id??"").trim();
    if(message&&sessionId&&turnId){
      const sessionKey=createHash("sha256").update(`${ROOT}\0Codex\0${sessionId}`).digest("hex");
      const legacyKey=createHash("sha256").update(`${ROOT}\0Codex\0${sessionId}\0${turnId}`).digest("hex");
      const pendingFolder=join(tmpdir(),"aidd-conversation-log","pending");
      const sessionPath=join(pendingFolder,`${sessionKey}.json`);
      const legacyPath=join(pendingFolder,`${legacyKey}.json`);
      const pendingPath=existsSync(sessionPath)?sessionPath:legacyPath;
      withLock(pendingPath,()=>{
        if(existsSync(pendingPath)){
          const pending=JSON.parse(readFileSync(pendingPath,"utf8"));
          const prompts=normalizePrompts(pending,turnId);
          const startedAt=new Date(Number(prompts[0]?.submitted_at));
          if(!Number.isNaN(startedAt.valueOf())&&prompts.length){
            const basePath=resolve(process.env.AIDD_CONVERSATION_LOG_FILE??join(ROOT,"chat-history",month(startedAt),"raw",`${day(startedAt)}.md`));
            const progress=readVisibleProgress(payload.transcript_path,new Set(prompts.map(item=>item.turn_id).filter(Boolean)));
            const userSection=formatItems(prompts,"Prompt","prompt","submitted_at");
            const progressSection=progress.length?`\n\n### AI PROGRESS (Codex)\n\n${formatItems(progress,"Update","text","created_at")}`:"";
            const entry=`## [${stamp(startedAt)}] Codex\n\n### USER\n\n${userSection}${progressSection}\n\n### AI (Codex)\n\n${message.slice(0,MAX_ITEM_CHARS)}\n\n---\n\n`;
            withLock(basePath,()=>{appendEntry(basePath,entry);});
            unlinkSync(pendingPath);
          }
        }
      });
    }
  }catch(error){
    console.error(error?.message==="rotation-exhausted"?"AIDD Codex conversation log rotation limit reached.":"AIDD Codex conversation pair write failed.");
    process.exitCode=1;
  }
}

function normalizePrompts(pending,turnId){
  const values=Array.isArray(pending?.prompts)?pending.prompts:[{submitted_at:pending?.started_at,turn_id:turnId,prompt:pending?.prompt}];
  return values.map(item=>({
    submitted_at:Number(item?.submitted_at),
    turn_id:String(item?.turn_id??turnId).trim(),
    prompt:String(item?.prompt??"").trim().slice(0,MAX_ITEM_CHARS)
  })).filter(item=>Number.isFinite(item.submitted_at)&&item.prompt).sort((left,right)=>left.submitted_at-right.submitted_at);
}

function readVisibleProgress(transcriptPath,turnIds){
  if(!transcriptPath||!turnIds.size)return [];
  try{
    const lines=readFileSync(String(transcriptPath),"utf8").split(/\r?\n/);
    const result=[];
    let activeTurn="";
    for(const line of lines){
      if(!line.trim())continue;
      let record;
      try{record=JSON.parse(line);}catch{continue;}
      if(record?.type==="event_msg"&&record?.payload?.type==="task_started")activeTurn=String(record.payload.turn_id??"");
      if(record?.type==="event_msg"&&["task_complete","turn_aborted"].includes(record?.payload?.type)&&String(record.payload.turn_id??"")===activeTurn){activeTurn="";continue;}
      const item=record?.payload;
      if(!turnIds.has(activeTurn)||record?.type!=="response_item"||item?.type!=="message"||item?.role!=="assistant"||item?.phase!=="commentary")continue;
      const text=Array.isArray(item.content)?item.content.filter(part=>part?.type==="output_text").map(part=>String(part.text??"")).join("\n").trim():"";
      if(text)result.push({created_at:new Date(record.timestamp).valueOf(),text:text.slice(0,MAX_ITEM_CHARS)});
    }
    return result.filter(item=>Number.isFinite(item.created_at));
  }catch{return [];}
}

/** Rotate to a numbered sibling instead of dropping the block; an oversized block still lands in a fresh file. */
function appendEntry(basePath,entry){
  const bytes=Buffer.byteLength(entry,"utf8");
  mkdirSync(dirname(basePath),{recursive:true});
  for(let index=1;index<=MAX_ROTATIONS;index+=1){
    const target=index===1?basePath:numbered(basePath,index);
    const current=existsSync(target)?statSync(target).size:0;
    if(current===0||current+bytes<=MAX_DAILY_FILE_BYTES){appendFileSync(target,entry,{encoding:"utf8",flag:"a"});return;}
  }
  throw new Error("rotation-exhausted");
}

function numbered(path,index){
  const extension=extname(path);
  return join(dirname(path),`${basename(path,extension)}-${index}${extension}`);
}

function formatItems(items,label,textKey,timeKey){
  if(items.length===1)return String(items[0][textKey]);
  return items.map((item,index)=>`#### ${label} ${index+1} [${stamp(new Date(item[timeKey]))}]\n\n${String(item[textKey])}`).join("\n\n");
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
