#!/usr/bin/env node
/** Build and validate AIDD Kit distributions with Node.js only. */
import { createHash } from "node:crypto";
import { deflateRawSync } from "node:zlib";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const DEV=join(ROOT,".aidd-kit-dev");
const MANIFEST_PATH=join(DEV,"export-manifest.json");
const ROLE_PATH=join(ROOT,".aidd-role.json");
const slash=value=>value.split(sep).join("/");
const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
function writeJson(path,value){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,`${JSON.stringify(value,null,2)}\n`,"utf8");}
function files(root){if(!existsSync(root))return[];const out=[];for(const entry of readdirSync(root,{withFileTypes:true})){if(["__pycache__",".pytest_cache"].includes(entry.name))continue;const path=join(root,entry.name);if(entry.isDirectory())out.push(...files(path));else if(entry.isFile()&&!/\.py[co]$/.test(entry.name))out.push(path);}return out.sort((a,b)=>slash(a).localeCompare(slash(b)));}
function copyEntry(source,target){if(!existsSync(source))throw new Error(`export source missing: ${slash(relative(ROOT,source))}`);if(statSync(source).isFile()){mkdirSync(dirname(target),{recursive:true});cpSync(source,target,{preserveTimestamps:true});return;}mkdirSync(target,{recursive:true});for(const path of files(source)){const dest=join(target,relative(source,path));mkdirSync(dirname(dest),{recursive:true});cpSync(path,dest,{preserveTimestamps:true});}}
function replaceTree(source,target){rmSync(target,{recursive:true,force:true});copyEntry(source,target);}
function git(...args){return spawnSync("git",args,{cwd:ROOT,encoding:"utf8"});}
const sha256=data=>createHash("sha256").update(data).digest("hex");
function fileManifest(root,excluded=new Set()){return files(root).map(path=>({path:slash(relative(root,path)),sha256:sha256(readFileSync(path))})).filter(item=>!excluded.has(item.path));}
function aggregateHash(items){const hash=createHash("sha256");for(const item of items)hash.update(`${item.path}\0${item.sha256}\n`);return hash.digest("hex");}
function skillMap(root){return Object.fromEntries(files(root).map(path=>[slash(relative(root,path)),sha256(readFileSync(path))]));}
function sameMap(left,right){const leftKeys=Object.keys(left).sort(),rightKeys=Object.keys(right).sort();return leftKeys.length===rightKeys.length&&leftKeys.every((key,index)=>key===rightKeys[index]&&left[key]===right[key]);}
function roleRecord(role){return{schema_version:1,role,managed_by:"AIDD Kit export/bootstrap",mutable_by_user:false};}
function originRecord(stage,manifest){const status=git("status","--porcelain"),commit=git("rev-parse","HEAD"),commitText=commit.status===0?commit.stdout.trim():"";return{schema_version:1,purpose:"provenance-only",upgrade_contract:"none",kit_version:manifest.kit_version,source_commit:commitText||"uncommitted",source_dirty:status.status!==0||Boolean(status.stdout.trim()),export_manifest_sha256:sha256(readFileSync(MANIFEST_PATH)),payload_sha256:aggregateHash(fileManifest(stage,new Set([".aidd-kit-origin.json"])))};}
function mergedSkillRoot(stage){const merged=join(stage,"skills");copyEntry(join(ROOT,".ai/skills"),merged);const maintainer=join(DEV,"skills");if(existsSync(maintainer))for(const entry of readdirSync(maintainer)){const source=join(maintainer,entry),destination=join(merged,entry);if(existsSync(destination))throw new Error(`maintainer skill collides with portable skill: ${entry}`);copyEntry(source,destination);}return merged;}
export function syncProviders(){const temporary=mkdtempSync(join(tmpdir(),"aidd-kit-skills-"));try{const merged=mergedSkillRoot(temporary);for(const target of [join(ROOT,".agents/skills"),join(ROOT,".claude/skills")])replaceTree(merged,target);}finally{rmSync(temporary,{recursive:true,force:true});}}
const KIT_COMMAND_OPTIONS={status:[],validate:[],"sync-providers":[],"refresh-fixture-guides":[],export:["directory","zip"],"new-project":["directory","zip","project-id","name","mode","source-location"]};
function parseOptions(command,args){
  if(!(command in KIT_COMMAND_OPTIONS))throw new Error("usage: kit.mjs status|validate|sync-providers|refresh-fixture-guides|export|new-project");
  const result={_:[]},allowed=new Set(KIT_COMMAND_OPTIONS[command]);let positionalOnly=false;
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(!positionalOnly&&arg==="--"){positionalOnly=true;continue;}
    if(!positionalOnly&&arg.startsWith("--")&&arg.length>2){
      const equals=arg.indexOf("="),key=arg.slice(2,equals<0?undefined:equals);
      if(!allowed.has(key))throw new Error(`${command}: unknown option --${key}`);
      const value=equals>=0?arg.slice(equals+1):i+1<args.length&&!args[i+1].startsWith("--")?args[++i]:null;
      if(value===null||!String(value).trim())throw new Error(`${command}: --${key} requires a value`);
      result[key]=value;
    }else result._.push(arg);
  }
  if(result._.length)throw new Error(`${command}: unexpected argument(s) ${result._.join(", ")}`);
  if(["export","new-project"].includes(command)){
    if(Boolean(result.directory)===Boolean(result.zip))throw new Error(`${command}: exactly one of --directory or --zip is required`);
    if(command==="new-project"){
      const missing=["project-id","name"].filter(key=>!result[key]);if(missing.length)throw new Error(`new-project: ${missing.map(key=>`--${key}`).join(", ")} option(s) required`);
      if(result.mode&&!new Set(["greenfield","existing-system"]).has(result.mode))throw new Error("new-project: --mode must be one of greenfield, existing-system");
    }
  }
  return result;
}
export function assemble(stage,role,project=null){const manifest=readJson(MANIFEST_PATH);for(const entry of manifest.entries)copyEntry(join(ROOT,entry.source),join(stage,entry.target));for(const target of [join(stage,".agents/skills"),join(stage,".claude/skills")])replaceTree(join(stage,".ai/skills"),target);writeJson(join(stage,".aidd-role.json"),roleRecord("kit-template"));if(project){const args=[join(stage,".ai/tools/aidd.mjs"),"project-bootstrap","--project-id",project.project_id,"--name",project.name,"--mode",project.mode];if(project.source_location)args.push("--source-location",project.source_location);const run=spawnSync(process.execPath,args,{cwd:stage,encoding:"utf8"});if(run.error)throw new Error(`project-bootstrap process failed: ${run.error.message}`);if(run.status!==0)throw new Error(`${run.stdout??""}${run.stderr??""}`.trim()||`project-bootstrap exited with status ${run.status}`);writeJson(join(stage,".aidd-role.json"),roleRecord("product-workspace"));}else if(role!=="kit-template")throw new Error(`unsupported assembled role: ${role}`);writeJson(join(stage,".aidd-kit-origin.json"),originRecord(stage,manifest));const errors=validateExportTree(stage,Boolean(project));if(errors.length)throw new Error(`invalid export:\n- ${errors.join("\n- ")}`);}
export function validateExportTree(root,expectProject){const errors=[],manifest=readJson(MANIFEST_PATH),names=files(root).map(path=>slash(relative(root,path)));for(const prefix of manifest.forbidden_prefixes??[]){const value=prefix.replace(/\/$/,"");if(names.some(path=>path===value||path.startsWith(`${value}/`)))errors.push(`forbidden export prefix found: ${prefix}`);}if(!expectProject)for(const prefix of manifest.template_forbidden_prefixes??[]){const value=prefix.replace(/\/$/,"");if(names.some(path=>path===value||path.startsWith(`${value}/`)))errors.push(`forbidden template prefix found: ${prefix}`);}for(const name of manifest.forbidden_names??[])if(names.some(path=>path.split("/").includes(name)))errors.push(`forbidden export name found: ${name}`);for(const required of ["AGENTS.md",".ai/spec/index.md",".ai/docs/guides/project-team-guide.md",".ai/manifests/terminology.json",".aidd-role.json",".aidd-kit-origin.json"])if(!existsSync(join(root,required)))errors.push(`required export file missing: ${required}`);try{const expected=expectProject?"product-workspace":"kit-template";if(readJson(join(root,".aidd-role.json")).role!==expected)errors.push(`role marker must be ${expected}`);}catch(error){errors.push(`role marker invalid: ${error.message}`);}if(expectProject&&!existsSync(join(root,"project/.aidd/ssot/project.json")))errors.push("new-project output has no product SSOT");if(expectProject&&!existsSync(join(root,"project/.aidd/ssot/terminology.json")))errors.push("new-project output has no project terminology SSOT");if(!expectProject&&existsSync(join(root,"project")))errors.push("template export unexpectedly contains project/");const portable=skillMap(join(root,".ai/skills"));for(const provider of [".agents/skills",".claude/skills"])if(!sameMap(skillMap(join(root,provider)),portable))errors.push(`provider skill drift: ${provider}`);return errors;}
const CHANGE_CLASSES=new Set(["C1","C2","C3"]);
const CHANGE_STATUSES=new Set(["proposed","in_progress","in_review","verified","released","rejected"]);
const DECISION_STATUSES=new Set(["proposed","accepted","superseded","rejected"]);
const EVIDENCE_METADATA_FLOOR=11;
const CLOCK_SKEW_MS=60000;
const CORRECTED_EVIDENCE_IDS=new Set(["KIT-EVD-024","KIT-EVD-025","KIT-EVD-026","KIT-EVD-027","KIT-EVD-028"]);
const RECORD_FILE_PATTERNS={changes:/^KIT-CHG-\d{3}\.json$/,decisions:/^KIT-ADR-\d{3}\.json$/,evidence:/^KIT-EVD-\d{3}\.json$/};
function recordEntries(directory){
  const root=join(DEV,directory),pattern=RECORD_FILE_PATTERNS[directory],paths=[],errors=[];
  for(const entry of readdirSync(root,{withFileTypes:true})){
    if(!entry.isFile()||!entry.name.endsWith(".json"))continue;
    if(pattern.test(entry.name))paths.push(join(root,entry.name));
    else errors.push(`${directory}/${entry.name}: record file name must match ${pattern.source}`);
  }
  return {paths:paths.sort(),errors};
}
function idOf(path){return basename(path,".json");}
export function recordErrors(now=Date.now()){
  const text=(record,field)=>typeof record[field]==="string"&&record[field].trim();
  const changes=recordEntries("changes"),decisions=recordEntries("decisions"),evidence=recordEntries("evidence");
  const errors=[...changes.errors,...decisions.errors,...evidence.errors];
  const changeIds=new Set(changes.paths.map(idOf));
  for(const path of changes.paths){
    const id=idOf(path),label=`changes/${id}.json`;let record;
    try{record=readJson(path);}catch(error){errors.push(`${label}: invalid JSON: ${error.message}`);continue;}
    if(record.id!==id)errors.push(`${label}: id must match the file name`);
    if(record.schema_version!==1)errors.push(`${label}: schema_version must be 1`);
    if(!CHANGE_CLASSES.has(record.class))errors.push(`${label}: class must be one of ${[...CHANGE_CLASSES].join(", ")}`);
    if(!CHANGE_STATUSES.has(record.status))errors.push(`${label}: status must be one of ${[...CHANGE_STATUSES].join(", ")}`);
    for(const field of ["title","problem","intent","completion_blocker"])if(!text(record,field))errors.push(`${label}: ${field} must be a non-empty string`);
    for(const field of ["scope","validation"])if(!Array.isArray(record[field])||!record[field].length)errors.push(`${label}: ${field} must be a non-empty list`);
  }
  for(const path of decisions.paths){
    const id=idOf(path),label=`decisions/${id}.json`;let record;
    try{record=readJson(path);}catch(error){errors.push(`${label}: invalid JSON: ${error.message}`);continue;}
    if(record.id!==id)errors.push(`${label}: id must match the file name`);
    if(record.schema_version!==1)errors.push(`${label}: schema_version must be 1`);
    if(!DECISION_STATUSES.has(record.status))errors.push(`${label}: status must be one of ${[...DECISION_STATUSES].join(", ")}`);
    for(const field of ["title","decision","rationale"])if(!text(record,field))errors.push(`${label}: ${field} must be a non-empty string`);
  }
  for(const path of evidence.paths){
    const id=idOf(path),label=`evidence/${id}.json`;let record;
    try{record=readJson(path);}catch(error){errors.push(`${label}: invalid JSON: ${error.message}`);continue;}
    if(record.id!==id)errors.push(`${label}: id must match the file name`);
    if(record.schema_version!==1)errors.push(`${label}: schema_version must be 1`);
    if(typeof record.change!=="string"||!changeIds.has(record.change))errors.push(`${label}: change must reference an existing change record`);
    const sequence=Number(id.replace(/^KIT-EVD-/,""));
    if(Number.isInteger(sequence)&&sequence>=EVIDENCE_METADATA_FLOOR)for(const field of ["kind","performed_by","performed_at"])if(!text(record,field))errors.push(`${label}: ${field} must be a non-empty string`);
    if(CORRECTED_EVIDENCE_IDS.has(id)&&!record.performed_at_correction)errors.push(`${label}: performed_at_correction is required for a record on the corrected list`);
    if(text(record,"performed_at")){
      const performed=Date.parse(record.performed_at);
      if(Number.isNaN(performed))errors.push(`${label}: performed_at must be a parsable date`);
      else if(/[T ]\d{2}:\d{2}/.test(record.performed_at)&&performed>now+CLOCK_SKEW_MS&&!CORRECTED_EVIDENCE_IDS.has(id))errors.push(`${label}: performed_at ${record.performed_at} is in the future; record the value read from the system clock`);
    }
  }
  return errors;
}
export function validateSource(){const errors=[...recordErrors()];try{const active=readJson(join(DEV,"repository.json")).active_change;if(typeof active!=="string"||!existsSync(join(DEV,`changes/${active}.json`)))errors.push("repository active_change must identify an existing change record");}catch(error){errors.push(`repository metadata invalid: ${error.message}`);}try{if(readJson(ROLE_PATH).role!=="kit-source")errors.push("root .aidd-role.json must declare kit-source");}catch(error){errors.push(`root role marker invalid: ${error.message}`);}if(existsSync(join(ROOT,"project")))errors.push("kit-source root must not contain product project/");for(const required of [".ai/spec/index.md",".ai/docs/guides/project-team-guide.md",".ai/manifests/terminology.json",".aidd-kit-dev/guides/kit-maintainer-guide.md",".aidd-kit-dev/skills/aidd-kit-release/SKILL.md",".aidd-kit-dev/export/AGENTS.md",".ai/tools/aidd.mjs",".ai/tools/aidd_hook.mjs"])if(!existsSync(join(ROOT,required)))errors.push(`required source file missing: ${required}`);try{const cli=readFileSync(join(ROOT,".ai/tools/aidd.mjs"),"utf8"),locked=cli.match(/const COMMON_TERMINOLOGY_SHA256="([a-f0-9]{64})";/)?.[1],actual=sha256(readFileSync(join(ROOT,".ai/manifests/terminology.json")));if(!locked)errors.push("portable CLI has no immutable AIDD terminology baseline");else if(locked!==actual)errors.push("AIDD terminology registry differs from the portable immutable baseline");}catch(error){errors.push(`AIDD terminology baseline invalid: ${error.message}`);}const portable=skillMap(join(ROOT,".ai/skills")),maintainer=skillMap(join(DEV,"skills"));for(const key of Object.keys(portable))if(key in maintainer)errors.push(`maintainer and portable skill paths collide: ${key}`);const expected={...portable,...maintainer};for(const provider of [".agents/skills",".claude/skills"])if(!sameMap(skillMap(join(ROOT,provider)),expected))errors.push(`source provider skill drift: ${provider}`);for(const path of files(ROOT).filter(path=>path.endsWith(".py")))errors.push(`Python runtime source is forbidden: ${slash(relative(ROOT,path))}`);try{const temp=mkdtempSync(join(tmpdir(),"aidd-kit-validate-"));try{assemble(join(temp,"template"),"kit-template");}finally{rmSync(temp,{recursive:true,force:true});}}catch(error){errors.push(error.message);}return errors;}

export function refreshReferenceFixtureRuntimeDocs(){
  const fixture=join(DEV,"fixtures/reference-project"),ssot=join(fixture,".aidd/ssot"),generated=join(fixture,"docs/generated");
  const deployment=readJson(join(ssot,"deployment.json")).profiles.find(item=>item.id==="DEP-001");
  const baseline=readJson(join(ssot,"technology.json")).baselines.find(item=>item.id==="TSB-001");
  const runbook=readJson(join(ssot,"operations.json")).runbooks.find(item=>item.id==="RUN-001");
  const goldenPath=readJson(join(ssot,"foundation.json")).golden_paths.find(item=>item.id==="GPH-001");
  if(!deployment||!baseline||!runbook||!goldenPath)throw new Error("reference fixture runtime SSOT is incomplete");
  const runtimeChoice=baseline.choices.find(item=>item.area==="런타임"),automationChoice=baseline.choices.find(item=>item.area==="변경·자동화");
  if(!runtimeChoice||!automationChoice)throw new Error("reference fixture technology choices are incomplete");
  const updates=new Map([
    ["deployment-and-runtime.md",[["Python 3.11 이상 단기 실행 프로세스",deployment.runtime]]],
    ["technology-gates.md",[
      ["외부 런타임 의존성을 최소화한 Python 표준 라이브러리 CLI, 버전 관리되는 JSON 정본, 생성 Markdown, Git 훅, 공통 SKILL.md와 플랫폼별 얇은 어댑터를 사용한다.",baseline.decision],
      ["Python 3.11 이상 표준 라이브러리",runtimeChoice.selection],
      ["이식성과 설치 부담 최소화",runtimeChoice.reason],
      ["Git, 저장소 훅과 Python 검증기",automationChoice.selection]
    ]],
    ["foundation/golden-paths.md",[["node .ai/tools/aidd.mjs validate와 전체 unittest를 실행한다.",goldenPath.steps[3]]]],
    ["operations/runbooks.md",[["전체 unittest를 실행하고 결과를 EVD에 연결한다.",runbook.steps[3]]]],
    ["site/design/index.html",[
      ["외부 런타임 의존성을 최소화한 Python 표준 라이브러리 CLI, 버전 관리되는 JSON 정본, 생성 Markdown, Git 훅, 공통 SKILL.md와 플랫폼별 얇은 어댑터를 사용한다.",baseline.decision],
      ["Python 3.11 이상 표준 라이브러리",runtimeChoice.selection],
      ["이식성과 설치 부담 최소화",runtimeChoice.reason],
      ["Git, 저장소 훅과 Python 검증기",automationChoice.selection],
      ["node .ai/tools/aidd.mjs validate와 전체 unittest를 실행한다.",goldenPath.steps[3]]
    ]],
    ["site/operations/index.html",[
      ["Python 3.11 이상 단기 실행 프로세스",deployment.runtime],
      ["전체 unittest를 실행하고 결과를 EVD에 연결한다.",runbook.steps[3]]
    ]]
  ]);
  let changed=0;
  for(const [name,replacements] of updates){
    const path=join(generated,name);let text=readFileSync(path,"utf8"),next=text;
    for(const [oldValue,newValue] of replacements)next=next.replaceAll(oldValue,newValue);
    if(next!==text){writeFileSync(path,next,"utf8");changed++;}
  }
  const temporary=mkdtempSync(join(tmpdir(),"aidd-reference-terminology-"));
  try{
    copyEntry(join(ROOT,".ai"),join(temporary,".ai"));
    copyEntry(fixture,join(temporary,"project"));
    writeJson(join(temporary,".aidd-role.json"),roleRecord("product-workspace"));
    const run=spawnSync(process.execPath,[join(temporary,".ai/tools/aidd.mjs"),"generate"],{cwd:temporary,encoding:"utf8"});
    if(run.error)throw new Error(`reference terminology generation failed: ${run.error.message}`);
    if(run.status!==0)throw new Error(`${run.stdout??""}${run.stderr??""}`.trim()||`reference terminology generation exited with status ${run.status}`);
    const glossary=readFileSync(join(temporary,"project/docs/generated/glossary.md"));
    const glossaryPath=join(generated,"glossary.md");
    if(!existsSync(glossaryPath)||!readFileSync(glossaryPath).equals(glossary)){writeFileSync(glossaryPath,glossary);changed++;}
    for(const site of ["design","operations","user"]){
      const path=join(generated,"site",site,"index.html"),source=readFileSync(join(temporary,"project/docs/generated/site",site,"index.html"),"utf8"),text=readFileSync(path,"utf8");
      const navigation=source.match(/<li><button class="tnode empty-chev" data-page-link="doc-glossary-md"[\s\S]*?<\/li>/)?.[0],page=source.match(/<section class="delivery-page" data-page id="doc-glossary-md" hidden>[\s\S]*?<\/section>/)?.[0];
      if(!navigation||!page)throw new Error(`reference terminology site section is missing: ${site}`);
      const stripped=text.replace(/<li><button class="tnode empty-chev" data-page-link="doc-glossary-md"[\s\S]*?<\/li>/g,"").replace(/<section class="delivery-page" data-page id="doc-glossary-md" hidden>[\s\S]*?<\/section>/g,"");
      const lineEnding=stripped.includes("\r\n")?"\r\n":"\n",nav=navigation.replaceAll("\n",lineEnding),section=page.replaceAll("\n",lineEnding);
      const next=stripped.replace("</ul></li></ul></nav>",`${nav}</ul></li></ul></nav>`).replace("</main>",`${section}</main>`);
      if(next===stripped)throw new Error(`reference terminology site insertion point is missing: ${site}`);
      if(next!==text){writeFileSync(path,next,"utf8");changed++;}
    }
  }finally{rmSync(temporary,{recursive:true,force:true});}
  return changed;
}

const crcTable=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}return table;})();
function crc32(buffer){let c=0xffffffff;for(const byte of buffer)c=crcTable[(c^byte)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function u16(n){const b=Buffer.alloc(2);b.writeUInt16LE(n);return b;}function u32(n){const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b;}
export function writeZip(source,target){const locals=[],centrals=[];let offset=0;for(const path of files(source)){const name=Buffer.from(slash(relative(source,path)),"utf8"),data=readFileSync(path),compressed=deflateRawSync(data,{level:9}),crc=crc32(data);const local=Buffer.concat([u32(0x04034b50),u16(20),u16(0x800),u16(8),u16(0),u16(0),u32(crc),u32(compressed.length),u32(data.length),u16(name.length),u16(0),name,compressed]);locals.push(local);const external=(slash(relative(source,path)).startsWith(".githooks/")?0o100755:0o100644)<<16;centrals.push(Buffer.concat([u32(0x02014b50),u16(0x0314),u16(20),u16(0x800),u16(8),u16(0),u16(0),u32(crc),u32(compressed.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(external),u32(offset),name]));offset+=local.length;}const central=Buffer.concat(centrals),body=Buffer.concat(locals);const end=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(centrals.length),u16(centrals.length),u32(central.length),u32(body.length),u16(0)]);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,Buffer.concat([body,central,end]));}
function deliver(stage,directory,archive){const destination=resolve(directory??archive);if(existsSync(destination))throw new Error(`output already exists; refusing to overwrite: ${destination}`);mkdirSync(dirname(destination),{recursive:true});if(directory)renameSync(stage,destination);else writeZip(stage,destination);return destination;}

const [command,...rest]=process.argv.slice(2);
try{
  const options=parseOptions(command,rest);
  if(command==="status"){
    const repository=readJson(join(DEV,"repository.json")),change=readJson(join(DEV,`changes/${repository.active_change}.json`));
    const others=recordEntries("changes").paths.map(readJson).filter(item=>["in_progress","in_review"].includes(item.status)&&item.id!==change.id);
    const lines=["# AIDD Kit 관리 상태",`- 역할: \`${readJson(ROLE_PATH).role}\``,`- 버전: \`${repository.current_version}\``,`- 현재 변경: \`${change.id}\` · ${change.status}`];
    for(const item of others)lines.push(`- 진행 중인 다른 변경: \`${item.id}\` · ${item.status}`);
    lines.push("- 배포: 허용 목록 기반 directory/zip, 자동 업그레이드·역동기화 없음");
    console.log(lines.join("\n"));
  }
  else if(command==="sync-providers"){syncProviders();console.log("portable 스킬과 Kit 관리 스킬을 원본 provider 어댑터에 동기화했습니다.");}
  else if(command==="refresh-fixture-guides"){console.log(`reference fixture 런타임·용어 파생물 ${refreshReferenceFixtureRuntimeDocs()}개를 갱신했습니다.`);}
  else if(command==="validate"){const errors=validateSource();if(errors.length){console.error(`Kit validation failed:\n- ${errors.join("\n- ")}`);process.exitCode=1;}else console.log("AIDD Kit source and export boundary validation passed");}
  else if(["export","new-project"].includes(command)){const directory=options.directory,archive=options.zip;if(!directory&&!archive)throw new Error("--directory or --zip is required");const temp=mkdtempSync(join(tmpdir(),"aidd-kit-export-")),stage=join(temp,"payload");try{mkdirSync(stage);const project=command==="new-project"?{project_id:options["project-id"],name:options.name,mode:options.mode??"greenfield",source_location:options["source-location"]??""}:null;assemble(stage,project?"product-workspace":"kit-template",project);const destination=deliver(stage,directory,archive);console.log(`AIDD ${project?"product-workspace":"kit-template"} created: ${destination}`);}finally{rmSync(temp,{recursive:true,force:true});}}
  else{console.error("usage: kit.mjs status|validate|sync-providers|refresh-fixture-guides|export|new-project");process.exitCode=2;}
}catch(error){console.error(`ERROR: ${error.message}`);process.exitCode=2;}
