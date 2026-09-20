import assert from "node:assert/strict";
import test from "node:test";
import { validateSource } from "../tools/kit.mjs";

test("quick Kit check validates source and provider boundaries",()=>{
  assert.deepEqual(validateSource(),[]);
});
