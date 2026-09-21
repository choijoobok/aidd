#!/usr/bin/env node
/** Isolated Codex UserPromptSubmit stager. Do not import another AIDD hook. */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");

if(process.env.AIDD_LOCAL_CONVERSATION_LOG!=="0"){
  try{
    const payload=JSON.parse(readFileSync(0,"utf8")||"{}");
    const prompt=String(payload.prompt??payload.message??payload.text??"").trim();
    const sessionId=String(payload.session_id??"").trim();
    const turnId=String(payload.turn_id??"").trim();
    if(prompt&&sessionId&&turnId){
      const key=createHash("sha256").update(`${ROOT}\0Codex\0${sessionId}\0${turnId}`).digest("hex");
      const path=join(tmpdir(),"aidd-conversation-log","pending",`${key}.json`);
      mkdirSync(dirname(path),{recursive:true});
      writeFileSync(path,JSON.stringify({started_at:Date.now(),prompt:prompt.slice(0,16000)}),"utf8");
    }
  }catch{console.error("AIDD Codex user conversation staging failed.");process.exitCode=1;}
}
