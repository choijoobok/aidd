#!/usr/bin/env node
/** Isolated Claude Stop pair logger. Do not import another AIDD hook. */

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
    const sessionId=String(payload.session_id??"").trim();
    if(sessionId){
      const key=createHash("sha256").update(`${ROOT}\0Claude\0${sessionId}`).digest("hex");
      const pendingPath=join(tmpdir(),"aidd-conversation-log","pending",`${key}.json`);
      withLock(pendingPath,()=>{
        if(!existsSync(pendingPath))return;
        const prompts=normalizePrompts(JSON.parse(readFileSync(pendingPath,"utf8")));
        const startedAt=new Date(prompts[0]?.submitted_at);
        if(!prompts.length||Number.isNaN(startedAt.valueOf()))return;
        const turn=readTurn(payload,prompts[0].submitted_at);
        const direct=String(payload.last_assistant_message??payload.assistant_message??payload.message??payload.text??"").trim();
        const final=turn.final||direct.slice(0,MAX_ITEM_CHARS);
        if(!final)return;
        const basePath=resolve(process.env.AIDD_CONVERSATION_LOG_FILE??join(ROOT,"chat-history",month(startedAt),"raw",`${day(startedAt)}.md`));
        const userSection=formatItems(prompts,"Prompt","prompt","submitted_at");
        const progressSection=turn.progress.length?`\n\n### AI PROGRESS (Claude)\n\n${formatItems(turn.progress,"Update","text","created_at")}`:"";
        const entry=`## [${stamp(startedAt)}] Claude\n\n### USER\n\n${userSection}${progressSection}\n\n### AI (Claude)\n\n${final}\n\n---\n\n`;
        withLock(basePath,()=>{appendEntry(basePath,entry);});
        unlinkSync(pendingPath);
      });
    }
  }catch(error){
    console.error(error?.message==="rotation-exhausted"?"AIDD Claude conversation log rotation limit reached.":"AIDD Claude conversation pair write failed.");
    process.exitCode=1;
  }
}

function normalizePrompts(pending){
  const values=Array.isArray(pending?.prompts)?pending.prompts:[{submitted_at:pending?.started_at,prompt:pending?.prompt}];
  return values.map(item=>({
    submitted_at:Number(item?.submitted_at),
    prompt:String(item?.prompt??"").trim().slice(0,MAX_ITEM_CHARS)
  })).filter(item=>Number.isFinite(item.submitted_at)&&item.prompt).sort((left,right)=>left.submitted_at-right.submitted_at);
}

/** Claude Code Stop payloads carry no response text, so read the turn from the session transcript.
 *  Only assistant text blocks are collected; thinking, tool calls and tool output stay out of the log. */
function readTurn(payload,boundMs){
  const transcript=String(payload.transcript_path??"").trim();
  if(!transcript||!existsSync(transcript))return {progress:[],final:""};
  try{
    const lines=readFileSync(transcript,"utf8").split(/\r?\n/);
    const items=[];
    for(let index=lines.length-1;index>=0;index-=1){
      if(!lines[index].trim())continue;
      let record;
      try{record=JSON.parse(lines[index]);}catch{continue;}
      const createdAt=new Date(record?.timestamp).valueOf();
      if(Number.isFinite(createdAt)){if(createdAt<boundMs)break;}
      else if(record?.message?.role==="user"&&!isToolResult(record?.message?.content))break;
      if(record?.isSidechain===true||record?.isMeta===true)continue;
      if(record?.message?.role!=="assistant"||!Array.isArray(record?.message?.content))continue;
      const text=record.message.content.filter(block=>block?.type==="text").map(block=>String(block.text??"")).join("\n\n").trim();
      if(text)items.unshift({created_at:Number.isFinite(createdAt)?createdAt:boundMs,text:text.slice(0,MAX_ITEM_CHARS)});
    }
    if(!items.length)return {progress:[],final:""};
    return {progress:items.slice(0,-1),final:items[items.length-1].text};
  }catch{return {progress:[],final:""};}
}

function isToolResult(content){return Array.isArray(content)&&content.some(block=>block?.type==="tool_result");}

/** Rotate forward only, so a later block never lands in an earlier file; an oversized block still gets a fresh file. */
function appendEntry(basePath,entry){
  const bytes=Buffer.byteLength(entry,"utf8");
  mkdirSync(dirname(basePath),{recursive:true});
  let index=1;
  while(index<MAX_ROTATIONS&&existsSync(numbered(basePath,index+1)))index+=1;
  for(;index<=MAX_ROTATIONS;index+=1){
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
