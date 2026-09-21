import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { bumpVersion, kitReleasePlan, parseOptions, prepareKitRelease, releaseMetadataErrors } from "../tools/kit.mjs";

function writeJson(path,value){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,`${JSON.stringify(value,null,2)}\n`,"utf8");}
function change(id,status,version_impact,extra={}){return{schema_version:1,id,title:`Change ${id}`,class:"C2",status,version_impact,delivery_path:"kit-maintenance",intent:`Intent ${id}`,compatibility:`Compatibility ${id}`,validation:[`validate ${id}`],rollback:`Rollback ${id}`,...extra};}
function fixture(candidates=[]){
  const root=mkdtempSync(join(tmpdir(),"aidd-release-version-")),dev=join(root,".aidd-kit-dev");
  writeJson(join(dev,"repository.json"),{schema_version:1,id:"AIDD-KIT",current_version:"0.2.0",active_change:candidates.at(-1)?.id??"KIT-CHG-001"});
  writeJson(join(dev,"export-manifest.json"),{schema_version:1,kit_version:"0.2.0",entries:[]});
  writeJson(join(dev,"changes/KIT-CHG-001.json"),change("KIT-CHG-001","verified","minor",{released_in:"0.2.0"}));
  for(const candidate of candidates)writeJson(join(dev,`changes/${candidate.id}.json`),candidate);
  mkdirSync(join(dev,"releases"),{recursive:true});
  writeFileSync(join(dev,"releases/KIT-REL-0.2.0.md"),"# AIDD Kit 0.2.0\n\n포함 변경: `KIT-CHG-001`\n","utf8");
  writeFileSync(join(dev,"releases/UNRELEASED.md"),"# Unreleased changes\n\n- pending\n","utf8");
  return root;
}
function cleanup(root){rmSync(root,{recursive:true,force:true});}

test("semantic version bump follows the declared impact",()=>{
  assert.equal(bumpVersion("1.2.3","patch"),"1.2.4");
  assert.equal(bumpVersion("1.2.3","minor"),"1.3.0");
  assert.equal(bumpVersion("1.2.3","major"),"2.0.0");
  assert.throws(()=>bumpVersion("1.2","patch"),/invalid semantic version/);
});

test("Kit release commands identify their target explicitly",()=>{
  assert.deepEqual(parseOptions("kit-release-plan",[]),{_:[]});
  assert.deepEqual(parseOptions("prepare-kit-release",["--date","2026-09-22"]),{_:[],date:"2026-09-22"});
  assert.throws(()=>parseOptions("release-plan",[]),/usage: kit\.mjs/);
  assert.throws(()=>parseOptions("prepare-release",[]),/usage: kit\.mjs/);
});

test("release plan aggregates the highest impact and reports unverified blockers",()=>{
  const root=fixture([
    change("KIT-CHG-002","verified","patch"),
    change("KIT-CHG-003","in_progress","minor"),
    change("KIT-CHG-004","verified","major")
  ]);
  try{
    const plan=kitReleasePlan(root);
    assert.equal(plan.current_version,"0.2.0");
    assert.equal(plan.version_impact,"major");
    assert.equal(plan.next_version,"1.0.0");
    assert.deepEqual(plan.candidates.map(item=>item.id),["KIT-CHG-002","KIT-CHG-003","KIT-CHG-004"]);
    assert.deepEqual(plan.blockers,["KIT-CHG-003: status is in_progress"]);
  }finally{cleanup(root);}
});

test("prepare release updates every release authority without creating Git state",()=>{
  const root=fixture([
    change("KIT-CHG-002","verified","none"),
    change("KIT-CHG-003","verified","minor",{known_limit:"Known limit"})
  ]);
  try{
    const plan=prepareKitRelease({root,date:"2026-09-22",requireClean:false});
    assert.equal(plan.next_version,"0.3.0");
    assert.equal(JSON.parse(readFileSync(join(root,".aidd-kit-dev/repository.json"),"utf8")).current_version,"0.3.0");
    assert.equal(JSON.parse(readFileSync(join(root,".aidd-kit-dev/export-manifest.json"),"utf8")).kit_version,"0.3.0");
    for(const id of ["KIT-CHG-002","KIT-CHG-003"])assert.equal(JSON.parse(readFileSync(join(root,`.aidd-kit-dev/changes/${id}.json`),"utf8")).released_in,"0.3.0");
    const release=readFileSync(join(root,".aidd-kit-dev/releases/KIT-REL-0.3.0.md"),"utf8");
    assert.match(release,/기준일: 2026-09-22/);
    assert.match(release,/버전 영향도: `minor`/);
    assert.match(release,/`KIT-CHG-002`, `KIT-CHG-003`/);
    assert.match(release,/## 사용자 영향/);
    assert.match(release,/## 호환성·마이그레이션/);
    assert.match(release,/Known limit/);
    assert.equal(readFileSync(join(root,".aidd-kit-dev/releases/UNRELEASED.md"),"utf8"),"# Unreleased changes\n");
    assert.deepEqual(releaseMetadataErrors(root),[]);
  }finally{cleanup(root);}
});

test("prepare release refuses unsafe or ambiguous state before writing",()=>{
  const root=fixture([change("KIT-CHG-002","in_review","patch")]);
  try{
    const before=readFileSync(join(root,".aidd-kit-dev/repository.json"),"utf8");
    assert.throws(()=>prepareKitRelease({root,date:"2026-09-22",requireClean:false}),/KIT-CHG-002: status is in_review/);
    assert.equal(readFileSync(join(root,".aidd-kit-dev/repository.json"),"utf8"),before);
    const changePath=join(root,".aidd-kit-dev/changes/KIT-CHG-002.json"),record=JSON.parse(readFileSync(changePath,"utf8"));record.status="verified";writeJson(changePath,record);
    writeFileSync(join(root,".aidd-kit-dev/releases/KIT-REL-0.2.1.md"),"already exists\n","utf8");
    assert.throws(()=>prepareKitRelease({root,date:"2026-09-22",requireClean:false}),/target release record already exists/);
    assert.equal(readFileSync(join(root,".aidd-kit-dev/repository.json"),"utf8"),before);
    assert.equal(existsSync(join(root,".aidd-kit-dev/changes/KIT-CHG-002.json")),true);
  }finally{cleanup(root);}
});

test("release metadata rejects version drift and missing impact declarations",()=>{
  const root=fixture([change("KIT-CHG-002","verified","patch")]);
  try{
    const manifestPath=join(root,".aidd-kit-dev/export-manifest.json"),manifest=JSON.parse(readFileSync(manifestPath,"utf8"));manifest.kit_version="0.2.1";writeJson(manifestPath,manifest);
    const changePath=join(root,".aidd-kit-dev/changes/KIT-CHG-002.json"),record=JSON.parse(readFileSync(changePath,"utf8"));delete record.version_impact;writeJson(changePath,record);
    const errors=releaseMetadataErrors(root);
    assert.ok(errors.some(error=>error.includes("version mismatch")));
    assert.ok(errors.some(error=>error.includes("version_impact must be one of")));
  }finally{cleanup(root);}
});
