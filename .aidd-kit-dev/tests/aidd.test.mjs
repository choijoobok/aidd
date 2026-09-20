import assert from "node:assert/strict";
import test from "node:test";
import { referenceFixtureGeneratedArtifactErrors } from "../tools/kit.mjs";

test("reference project validates and every generated document matches current SSOT",async()=>{
  assert.deepEqual(await referenceFixtureGeneratedArtifactErrors(),[]);
});
