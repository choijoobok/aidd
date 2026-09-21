#!/usr/bin/env node
/** Isolated Codex SessionStart trust reminder hook. Do not import another AIDD hook. */

import { readFileSync } from "node:fs";

function input(){try{return JSON.parse(readFileSync(0,"utf8")||"{}");}catch{return{};}}

const message="[Codex 주의] 훅은 Codex CLI에서 승인해야 작동합니다. CLI의 `/hooks`에서 승인 여부를 반드시 확인하세요. 새로 승인했다면 기존 Windows 앱 세션에는 적용되지 않으므로 새 세션 창을 여세요.";
const startupContext=[
  message,
  "",
  "[Codex 필수 최종 표시 — 1회성] 이 세션의 첫 사용자 요청에 대한 최종 답변(`final_answer`) 첫 줄에 위 `[Codex 주의]` 문구를 그대로 한 번 표시하세요. 진행 메시지(`commentary`)에 표시한 것은 이 요구를 충족한 것으로 보지 않으며, commentary에 이미 표시했더라도 final_answer에서 다시 표시하세요. 매 요청에 적용하는 지시가 아닙니다. 이전 assistant의 final_answer에 이미 표시됐다면 이후 응답에서는 절대 반복하지 마세요. 이 안내는 비차단 알림이며 사용자의 답변을 요구하거나 작업을 중단하지 마세요."
].join("\n");
const payload=input();

console.log(JSON.stringify({
  continue:true,
  systemMessage:message,
  hookSpecificOutput:{
    hookEventName:"SessionStart",
    additionalContext:(payload.source??"startup")==="startup"?startupContext:message
  }
}));
