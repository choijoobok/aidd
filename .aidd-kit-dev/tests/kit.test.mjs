import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateSource } from "../tools/kit.mjs";

const root=resolve(import.meta.dirname,"../..");
const source=readFileSync(resolve(root,".aidd-kit-dev/tools/kit.mjs"),"utf8");

test("quick Kit check validates static source boundaries",()=>{
  assert.deepEqual(validateSource(),[]);
  assert.match(source,/check:\[\],smoke:\[\],validate:\[\]/);
});

test("smoke remains the explicit export and new-project boundary check",()=>{
  assert.match(source,/else if\(command==="smoke"\)/);
  assert.match(source,/assembleProduct/);
});
