import assert from "node:assert/strict";
import test from "node:test";
import { referenceFixtureGeneratedArtifactErrors } from "../tools/kit.mjs";

process.env.AIDD_LIBRARY_MODE="1";
const { screenSpecificationDocuments }=await import("../../.ai/tools/aidd.mjs");

test("screen specifications use SCR terminology and a specification filename",()=>{
  const docs=screenSpecificationDocuments([{id:"SCR-001",module:"MOD-UI",name:"조회"}]);
  assert.match(docs["ui/modules/MOD-UI/SCR-001/specification.md"],/^# SCR-001 화면 명세서/);
  assert.equal("ui/modules/MOD-UI/SCR-001/requirements.md" in docs,false);
});

test("reference project validates and every generated document matches current SSOT",async()=>{
  assert.deepEqual(await referenceFixtureGeneratedArtifactErrors(),[]);
});
