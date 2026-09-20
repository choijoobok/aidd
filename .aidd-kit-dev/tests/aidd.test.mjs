import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root=resolve(import.meta.dirname,"../..");
const source=readFileSync(resolve(root,".ai/tools/aidd.mjs"),"utf8");
const contract=JSON.parse(readFileSync(resolve(root,".ai/hooks/contract.json"),"utf8"));

test("terminology keeps TIR/TAP records without signature attestation",()=>{
  assert.match(source,/function termDecide/);
  assert.match(source,/function termClose/);
  assert.doesNotMatch(source,/else if\(command==="term-attest"\)/);
  assert.equal("approval_gate" in contract,false);
});

test("end-user glossary boundary remains explicit",()=>{
  assert.match(source,/function secureDeliveryGlossary/);
  assert.match(source,/audience==="end_user"/);
  assert.match(source,/function endUserDeliveryErrors/);
});
