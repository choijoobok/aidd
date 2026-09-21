#!/usr/bin/env node
/** Isolated Codex SessionStart brief hook. Do not import another AIDD hook. */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");

try{
  const role=JSON.parse(readFileSync(join(ROOT,".aidd-role.json"),"utf8")).role;
  console.log(`# AIDD session\n- role: ${role}\n- hooks: isolated session context, generated-output protection, terminology follow-up, and unified local conversation logging`);
}catch{
  console.log("# AIDD session\n- workspace role marker is unavailable");
}
