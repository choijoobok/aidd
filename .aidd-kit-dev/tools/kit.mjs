#!/usr/bin/env node
/** Build and validate AIDD Kit distributions with Node.js only. */
import { createHash } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { harnessErrors } from "../../.ai/tools/aidd_hook.mjs";
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
function gitAt(root,...args){return spawnSync("git",args,{cwd:root,encoding:"utf8"});}
function git(...args){return gitAt(ROOT,...args);}
function processFailure(result){return result.error?.message??String(result.stderr??result.stdout??"unknown process failure").trim();}
const sha256=data=>createHash("sha256").update(data).digest("hex");
function fileManifest(root,excluded=new Set()){return files(root).map(path=>({path:slash(relative(root,path)),sha256:sha256(readFileSync(path))})).filter(item=>!excluded.has(item.path));}
function aggregateHash(items){const hash=createHash("sha256");for(const item of items)hash.update(`${item.path}\0${item.sha256}\n`);return hash.digest("hex");}
function skillMap(root){return Object.fromEntries(files(root).map(path=>[slash(relative(root,path)),sha256(readFileSync(path))]));}
function sameMap(left,right){const leftKeys=Object.keys(left).sort(),rightKeys=Object.keys(right).sort();return leftKeys.length===rightKeys.length&&leftKeys.every((key,index)=>key===rightKeys[index]&&left[key]===right[key]);}
function roleRecord(role){return{schema_version:1,role,managed_by:"AIDD Kit export/bootstrap",mutable_by_user:false};}
function originRecord(stage,manifest){const status=git("status","--porcelain"),commit=git("rev-parse","HEAD"),commitText=commit.status===0?commit.stdout.trim():"";return{schema_version:1,purpose:"provenance-only",upgrade_contract:"none",kit_version:manifest.kit_version,source_commit:commitText||"uncommitted",source_dirty:status.status!==0||Boolean(status.stdout.trim()),export_manifest_sha256:sha256(readFileSync(MANIFEST_PATH)),payload_sha256:aggregateHash(fileManifest(stage,new Set([".aidd-kit-origin.json"])))};}
function mergedSkillRoot(stage){const merged=join(stage,"skills");copyEntry(join(ROOT,".ai/skills"),merged);const maintainer=join(DEV,"skills");if(existsSync(maintainer))for(const entry of readdirSync(maintainer)){const source=join(maintainer,entry),destination=join(merged,entry);if(existsSync(destination))throw new Error(`maintainer skill collides with portable skill: ${entry}`);copyEntry(source,destination);}return merged;}
export function syncProviders(){const temporary=mkdtempSync(join(tmpdir(),"aidd-kit-skills-"));try{const merged=mergedSkillRoot(temporary),expected=skillMap(merged);for(const target of [join(ROOT,".agents/skills"),join(ROOT,".claude/skills")])if(!sameMap(skillMap(target),expected))replaceTree(merged,target);for(const [source,target] of [[join(DEV,"export/.codex/hooks.json"),join(ROOT,".codex/hooks.json")],[join(DEV,"export/.claude/settings.json"),join(ROOT,".claude/settings.json")]])if(!existsSync(target)||!readFileSync(source).equals(readFileSync(target)))copyEntry(source,target);}finally{rmSync(temporary,{recursive:true,force:true});}}
const KIT_USAGE="usage: kit.mjs status|check|smoke|kit-release-plan|prepare-kit-release|sync-providers|refresh-fixture|export|new-project";
const KIT_COMMAND_OPTIONS={status:[],check:[],smoke:[],"kit-release-plan":[],"prepare-kit-release":["date"],"sync-providers":[],"refresh-fixture":[],export:["directory","zip"],"new-project":["directory","zip","project-id","name","mode","source-location"]};
export function parseOptions(command,args){
  if(!(command in KIT_COMMAND_OPTIONS))throw new Error(KIT_USAGE);
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
export function assemble(stage,role="kit-template"){if(role!=="kit-template")throw new Error(`unsupported assembled role: ${role}`);const manifest=readJson(MANIFEST_PATH);for(const entry of manifest.entries)copyEntry(join(ROOT,entry.source),join(stage,entry.target));for(const target of [join(stage,".agents/skills"),join(stage,".claude/skills")])replaceTree(join(stage,".ai/skills"),target);writeJson(join(stage,".aidd-role.json"),roleRecord(role));writeJson(join(stage,".aidd-kit-origin.json"),originRecord(stage,manifest));const errors=validateExportTree(stage,false);if(errors.length)throw new Error(`invalid export:\n- ${errors.join("\n- ")}`);}
export function validateExportTree(root,expectProject){
  const errors=[],manifest=readJson(MANIFEST_PATH),names=files(root).map(path=>slash(relative(root,path)));
  for(const prefix of manifest.forbidden_prefixes??[]){const value=prefix.replace(/\/$/,"");if(names.some(path=>path===value||path.startsWith(`${value}/`)))errors.push(`forbidden export prefix found: ${prefix}`);}
  if(!expectProject)for(const prefix of manifest.template_forbidden_prefixes??[]){const value=prefix.replace(/\/$/,"");if(names.some(path=>path===value||path.startsWith(`${value}/`)))errors.push(`forbidden template prefix found: ${prefix}`);}
  for(const name of manifest.forbidden_names??[])if(names.some(path=>path.split("/").includes(name)))errors.push(`forbidden export name found: ${name}`);
  for(const required of ["AGENTS.md",".ai/spec/index.md",".ai/docs/guides/project-team-guide.md",".ai/manifests/terminology.json",".aidd-role.json",".aidd-kit-origin.json"])if(!existsSync(join(root,required)))errors.push(`required export file missing: ${required}`);
  try{const expected=expectProject?"product-workspace":"kit-template";if(readJson(join(root,".aidd-role.json")).role!==expected)errors.push(`role marker must be ${expected}`);}catch(error){errors.push(`role marker invalid: ${error.message}`);}
  if(expectProject){
    const projectPath=join(root,"project/.aidd/ssot/project.json"),ssot=dirname(projectPath);
    if(!existsSync(projectPath))errors.push("new-project output has no product SSOT");
    else try{
      const project=readJson(projectPath);
      if(project.schema_version!==2||project.storage_format!=="owned-records-v2")errors.push("new-project product SSOT must use owned-records-v2");
      const mixed=readdirSync(ssot,{withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith(".json")&&entry.name!=="project.json").map(entry=>entry.name).sort();
      if(mixed.length)errors.push(`new-project product SSOT mixes legacy root records: ${mixed.join(", ")}`);
    }catch(error){errors.push(`new-project product SSOT invalid: ${error.message}`);}
    for(const required of ["project/.aidd/schemas/owned-record.schema.json","project/.aidd/index/index.json","project/docs/generated/status.json","project/docs/generated/manifests/project.json"])if(!existsSync(join(root,required)))errors.push(`new-project v2 baseline missing: ${required}`);
    if(existsSync(join(root,"project/.aidd/schemas/artifact.schema.json")))errors.push("new-project contains retired legacy artifact schema");
  }
  if(!expectProject&&existsSync(join(root,"project")))errors.push("template export unexpectedly contains project/");
  const portable=skillMap(join(root,".ai/skills"));for(const provider of [".agents/skills",".claude/skills"])if(!sameMap(skillMap(join(root,provider)),portable))errors.push(`provider skill drift: ${provider}`);return errors;
}
export async function assembleProduct(stage,project){
  assemble(stage,"kit-template");
  const priorRoot=process.env.AIDD_WORKSPACE_ROOT,priorLibraryMode=process.env.AIDD_LIBRARY_MODE;
  try{
    process.env.AIDD_WORKSPACE_ROOT=stage;process.env.AIDD_LIBRARY_MODE="1";
    const portable=await import(pathToFileURL(join(stage,".ai/tools/aidd.mjs")).href+"?project-bootstrap="+Date.now()+"-"+process.pid);
    portable.projectBootstrap({"project-id":project.project_id,name:project.name,mode:project.mode,"source-location":project.source_location||undefined});
    const owned=await import(pathToFileURL(join(stage,".ai/tools/lib/owned-cli.mjs")).href+"?project-generate="+Date.now()+"-"+process.pid);
    for(const command of ["generate","documentation-check","validate"]){const result=owned.runOwned(stage,command,[]);if(result.exitCode)throw new Error(`new-project ${command} failed`);}
  }finally{
    if(priorRoot===undefined)delete process.env.AIDD_WORKSPACE_ROOT;else process.env.AIDD_WORKSPACE_ROOT=priorRoot;
    if(priorLibraryMode===undefined)delete process.env.AIDD_LIBRARY_MODE;else process.env.AIDD_LIBRARY_MODE=priorLibraryMode;
  }
  const manifest=readJson(MANIFEST_PATH);writeJson(join(stage,".aidd-role.json"),roleRecord("product-workspace"));writeJson(join(stage,".aidd-kit-origin.json"),originRecord(stage,manifest));
  const errors=validateExportTree(stage,true);if(errors.length)throw new Error("invalid export:\n- "+errors.join("\n- "));
}
function changeRecordsAt(root=ROOT){const changes=join(root,".aidd-kit-dev/changes");return readdirSync(changes,{withFileTypes:true}).filter(entry=>entry.isFile()&&/^KIT-CHG-\d{3}\.json$/.test(entry.name)).map(entry=>readJson(join(changes,entry.name))).sort((left,right)=>left.id.localeCompare(right.id));}
function changeRecords(){return changeRecordsAt(ROOT);}
const SEMVER=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const VERSION_IMPACTS=["none","patch","minor","major"];
function semverParts(value){const match=typeof value==="string"&&value.match(SEMVER);return match?[Number(match[1]),Number(match[2]),Number(match[3])]:null;}
function compareSemver(left,right){const a=semverParts(left),b=semverParts(right);if(!a||!b)throw new Error(`invalid semantic version comparison: ${left}, ${right}`);for(let index=0;index<3;index++)if(a[index]!==b[index])return a[index]-b[index];return 0;}
export function bumpVersion(version,impact){const parts=semverParts(version);if(!parts)throw new Error(`invalid semantic version: ${version}`);if(!VERSION_IMPACTS.includes(impact)||impact==="none")throw new Error(`version impact cannot produce a release: ${impact}`);if(impact==="major")return `${parts[0]+1}.0.0`;if(impact==="minor")return `${parts[0]}.${parts[1]+1}.0`;return `${parts[0]}.${parts[1]}.${parts[2]+1}`;}
export function releaseMetadataErrors(root=ROOT){
  const errors=[],dev=join(root,".aidd-kit-dev");let repository,manifest,changes=[];
  try{repository=readJson(join(dev,"repository.json"));}catch(error){errors.push(`repository metadata invalid: ${error.message}`);}
  try{manifest=readJson(join(dev,"export-manifest.json"));}catch(error){errors.push(`export manifest invalid: ${error.message}`);}
  try{changes=changeRecordsAt(root);}catch(error){errors.push(`change records invalid: ${error.message}`);}
  const current=repository?.current_version,exported=manifest?.kit_version;
  if(!semverParts(current))errors.push("repository current_version must be strict SemVer");
  if(!semverParts(exported))errors.push("export manifest kit_version must be strict SemVer");
  if(semverParts(current)&&semverParts(exported)&&current!==exported)errors.push(`version mismatch: repository=${current}, export-manifest=${exported}`);
  if(semverParts(current)&&!existsSync(join(dev,`releases/KIT-REL-${current}.md`)))errors.push(`current release record missing: KIT-REL-${current}.md`);
  for(const change of changes){
    if(!VERSION_IMPACTS.includes(change.version_impact))errors.push(`${change.id}: version_impact must be one of ${VERSION_IMPACTS.join(", ")}`);
    if(change.released_in!==undefined){
      if(!semverParts(change.released_in)){errors.push(`${change.id}: released_in must be strict SemVer`);continue;}
      if(semverParts(current)&&compareSemver(change.released_in,current)>0)errors.push(`${change.id}: released_in ${change.released_in} is newer than current_version ${current}`);
      const releasePath=join(dev,`releases/KIT-REL-${change.released_in}.md`);
      if(!existsSync(releasePath))errors.push(`${change.id}: release record missing for ${change.released_in}`);
      else if(!readFileSync(releasePath,"utf8").includes(`\`${change.id}\``))errors.push(`${change.id}: release record ${change.released_in} does not list the change`);
    }
  }
  return errors;
}
export function kitReleasePlan(root=ROOT){
  const errors=releaseMetadataErrors(root);if(errors.length)throw new Error(`release metadata invalid:\n- ${errors.join("\n- ")}`);
  const dev=join(root,".aidd-kit-dev"),repository=readJson(join(dev,"repository.json")),changes=changeRecordsAt(root),candidates=changes.filter(change=>change.released_in===undefined);
  const impact=candidates.reduce((highest,change)=>VERSION_IMPACTS.indexOf(change.version_impact)>VERSION_IMPACTS.indexOf(highest)?change.version_impact:highest,"none");
  return{current_version:repository.current_version,next_version:impact==="none"?null:bumpVersion(repository.current_version,impact),version_impact:impact,candidates,blockers:candidates.filter(change=>change.status!=="verified").map(change=>`${change.id}: status is ${change.status}`)};
}
function today(){const now=new Date(),pad=value=>String(value).padStart(2,"0");return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [year,month,day]=value.split("-").map(Number),date=new Date(Date.UTC(year,month-1,day));return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;}
function listValue(value,fallback){return typeof value==="string"&&value.trim()?value.trim():fallback;}
function releaseRecord(plan,date){
  const lines=[`# AIDD Kit ${plan.next_version}`,"",`기준일: ${date}`,`버전 영향도: \`${plan.version_impact}\``,`포함 변경: ${plan.candidates.map(change=>`\`${change.id}\``).join(", ")}`,"","## 사용자 영향",""];
  for(const change of plan.candidates)lines.push(`- \`${change.id}\` ${change.title}: ${listValue(change.intent,"변경 레코드에 기록된 범위를 반영했다.")}`);
  lines.push("","## 호환성·마이그레이션","");for(const change of plan.candidates)lines.push(`- \`${change.id}\`: ${listValue(change.compatibility,"별도 호환성 주의 사항 없음.")}`);
  lines.push("","## 검증","");for(const change of plan.candidates){const validation=listValue(change.validation_result,Array.isArray(change.validation)&&change.validation.length?change.validation.join(", "):"변경 레코드의 검증 절차를 따른다.");lines.push(`- \`${change.id}\`: ${validation}`);}
  lines.push("","## 알려진 제한","");for(const change of plan.candidates)lines.push(`- \`${change.id}\`: ${listValue(change.known_limit,"기록된 알려진 제한 없음.")}`);
  lines.push("","## 롤백","");for(const change of plan.candidates)lines.push(`- \`${change.id}\`: ${listValue(change.rollback,"해당 변경 커밋을 되돌린다.")}`);
  return `${lines.join("\n")}\n`;
}
export function prepareKitRelease({root=ROOT,date=today(),requireClean=true}={}){
  if(!validDate(date))throw new Error("prepare-kit-release: date must be a real YYYY-MM-DD value");
  const plan=kitReleasePlan(root);if(!plan.next_version)throw new Error("prepare-kit-release: no unreleased change requires a version bump");if(plan.blockers.length)throw new Error(`prepare-kit-release blocked:\n- ${plan.blockers.join("\n- ")}`);
  if(requireClean){const status=gitAt(root,"status","--porcelain");if(status.status!==0)throw new Error(`prepare-kit-release: cannot inspect Git worktree: ${processFailure(status)}`);if(status.stdout.trim())throw new Error("prepare-kit-release: Git worktree must be clean");}
  const dev=join(root,".aidd-kit-dev"),releasePath=join(dev,`releases/KIT-REL-${plan.next_version}.md`);
  if(existsSync(releasePath))throw new Error(`prepare-kit-release: target release record already exists: KIT-REL-${plan.next_version}.md`);
  if(requireClean){for(const tag of [plan.next_version,`v${plan.next_version}`]){const found=gitAt(root,"tag","--list",tag);if(found.status!==0)throw new Error(`prepare-kit-release: cannot inspect Git tag ${tag}: ${processFailure(found)}`);if(found.stdout.trim())throw new Error(`prepare-kit-release: Git tag already exists: ${tag}`);}}
  const repositoryPath=join(dev,"repository.json"),manifestPath=join(dev,"export-manifest.json"),unreleasedPath=join(dev,"releases/UNRELEASED.md"),repository=readJson(repositoryPath),manifest=readJson(manifestPath);
  repository.current_version=plan.next_version;manifest.kit_version=plan.next_version;
  const writes=[[repositoryPath,`${JSON.stringify(repository,null,2)}\n`],[manifestPath,`${JSON.stringify(manifest,null,2)}\n`],[releasePath,releaseRecord(plan,date)],[unreleasedPath,"# Unreleased changes\n"]];
  for(const change of plan.candidates){const path=join(dev,`changes/${change.id}.json`),updated={...change,released_in:plan.next_version};writes.push([path,`${JSON.stringify(updated,null,2)}\n`]);}
  const originals=new Map(writes.filter(([path])=>existsSync(path)).map(([path])=>[path,readFileSync(path)]));
  try{for(const [path,content] of writes){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,content,"utf8");}}
  catch(error){for(const [path] of writes)if(originals.has(path))writeFileSync(path,originals.get(path));else rmSync(path,{force:true});throw new Error(`prepare-kit-release rolled back after write failure: ${error.message}`);}
  return plan;
}
export function validateSource(){const errors=[...harnessErrors(),...releaseMetadataErrors()];try{const active=readJson(join(DEV,"repository.json")).active_change;if(typeof active!=="string"||!existsSync(join(DEV,`changes/${active}.json`)))errors.push("repository active_change must identify an existing change record");}catch(error){errors.push(`repository metadata invalid: ${error.message}`);}try{if(readJson(ROLE_PATH).role!=="kit-source")errors.push("root .aidd-role.json must declare kit-source");}catch(error){errors.push(`root role marker invalid: ${error.message}`);}if(existsSync(join(ROOT,"project")))errors.push("kit-source root must not contain product project/");for(const required of [".ai/spec/index.md",".ai/hooks/contract.json",".ai/docs/guides/project-team-guide.md",".ai/manifests/terminology.json",".ai/skills/aidd-requirement-verification/SKILL.md",".ai/skills/aidd-terminology/SKILL.md",".aidd-kit-dev/guides/kit-maintainer-guide.md",".aidd-kit-dev/skills/aidd-kit-release/SKILL.md",".aidd-kit-dev/export/AGENTS.md",".ai/templates/project-skeleton/.aidd/schemas/owned-record.schema.json",".aidd-kit-dev/fixtures/v2-distribution-contract.json",".ai/tools/aidd.mjs",".ai/tools/aidd_hook.mjs"])if(!existsSync(join(ROOT,required)))errors.push(`required source file missing: ${required}`);if(existsSync(join(ROOT,".ai/templates/project-skeleton/.aidd/schemas/artifact.schema.json")))errors.push("project skeleton must not export the retired legacy artifact schema");for(const path of [".ai/hooks/contract.json",".ai/hooks/policy.json",".ai/manifests/kit.json",".aidd-kit-dev/export-manifest.json",".aidd-kit-dev/fixtures/v2-distribution-contract.json",".claude/settings.json"])try{readJson(join(ROOT,path));}catch(error){errors.push(`${path} is invalid JSON: ${error.message}`);}try{const cli=readFileSync(join(ROOT,".ai/tools/aidd.mjs"),"utf8"),locked=cli.match(/const COMMON_TERMINOLOGY_SHA256="([a-f0-9]{64})";/)?.[1],actual=sha256(readFileSync(join(ROOT,".ai/manifests/terminology.json")));if(!locked)errors.push("portable CLI has no immutable AIDD terminology baseline");else if(locked!==actual)errors.push("AIDD terminology registry differs from the portable immutable baseline");}catch(error){errors.push(`AIDD terminology baseline invalid: ${error.message}`);}const portable=skillMap(join(ROOT,".ai/skills")),maintainer=skillMap(join(DEV,"skills"));for(const key of Object.keys(portable))if(key in maintainer)errors.push(`maintainer and portable skill paths collide: ${key}`);const expected={...portable,...maintainer};for(const provider of [".agents/skills",".claude/skills"])if(!sameMap(skillMap(join(ROOT,provider)),expected))errors.push(`source provider skill drift: ${provider}`);return errors;}

export async function referenceFixtureGeneratedArtifactErrors({refresh=false}={}){
  const fixture=join(DEV,"fixtures/reference-project"),temporary=mkdtempSync(join(tmpdir(),"aidd-reference-validate-")),errors=[];
  try{
    copyEntry(join(ROOT,".ai"),join(temporary,".ai"));copyEntry(join(ROOT,".ai/skills"),join(temporary,".agents/skills"));mkdirSync(join(temporary,".claude"),{recursive:true});copyEntry(join(ROOT,".claude/settings.json"),join(temporary,".claude/settings.json"));copyEntry(join(ROOT,".ai/skills"),join(temporary,".claude/skills"));copyEntry(join(ROOT,".codex"),join(temporary,".codex"));copyEntry(fixture,join(temporary,"project"));writeJson(join(temporary,".aidd-role.json"),roleRecord("product-workspace"));
    const priorRoot=process.env.AIDD_WORKSPACE_ROOT,priorLibraryMode=process.env.AIDD_LIBRARY_MODE;
    try{process.env.AIDD_WORKSPACE_ROOT=temporary;process.env.AIDD_LIBRARY_MODE="1";const portable=await import(pathToFileURL(join(temporary,".ai/tools/aidd.mjs")).href+"?fixture-validate="+Date.now()+"-"+process.pid),result=portable.validate(portable.loadRecords(),{generated:false});if(result.errors.length)throw new Error(`reference fixture portable validate failed: ${result.errors.join("; ")}`);portable.generate(portable.loadRecords());}
    finally{if(priorRoot===undefined)delete process.env.AIDD_WORKSPACE_ROOT;else process.env.AIDD_WORKSPACE_ROOT=priorRoot;if(priorLibraryMode===undefined)delete process.env.AIDD_LIBRARY_MODE;else process.env.AIDD_LIBRARY_MODE=priorLibraryMode;}
    const generated=join(fixture,"docs/generated"),expected=join(temporary,"project/docs/generated");
    if(refresh){replaceTree(expected,generated);return errors;}
    const actualMap=skillMap(generated),expectedMap=skillMap(expected),actualNames=Object.keys(actualMap),expectedNames=Object.keys(expectedMap);
    for(const path of expectedNames)if(!(path in actualMap))errors.push(`reference fixture generated file missing: ${path}`);else if(actualMap[path]!==expectedMap[path])errors.push(`reference fixture generated file differs from current SSOT: ${path}`);
    for(const path of actualNames)if(!(path in expectedMap))errors.push(`reference fixture obsolete generated file remains: ${path}`);
  }catch(error){errors.push("reference fixture generated-artifact verification failed: "+error.message);}
  finally{rmSync(temporary,{recursive:true,force:true});}
  return errors;
}
export async function validateSourceAsync(){const errors=validateSource();errors.push(...await distributionErrors());errors.push(...await referenceFixtureGeneratedArtifactErrors());return errors;}

const crcTable=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}return table;})();
function crc32(buffer){let c=0xffffffff;for(const byte of buffer)c=crcTable[(c^byte)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function u16(n){const b=Buffer.alloc(2);b.writeUInt16LE(n);return b;}function u32(n){const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b;}
export function writeZip(source,target){const locals=[],centrals=[];let offset=0;for(const path of files(source)){const name=Buffer.from(slash(relative(source,path)),"utf8"),data=readFileSync(path),compressed=deflateRawSync(data,{level:9}),crc=crc32(data);const local=Buffer.concat([u32(0x04034b50),u16(20),u16(0x800),u16(8),u16(0),u16(0),u32(crc),u32(compressed.length),u32(data.length),u16(name.length),u16(0),name,compressed]);locals.push(local);const external=(slash(relative(source,path)).startsWith(".githooks/")?0o100755:0o100644)<<16;centrals.push(Buffer.concat([u32(0x02014b50),u16(0x0314),u16(20),u16(0x800),u16(8),u16(0),u16(0),u32(crc),u32(compressed.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(external),u32(offset),name]));offset+=local.length;}const central=Buffer.concat(centrals),body=Buffer.concat(locals);const end=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(centrals.length),u16(centrals.length),u32(central.length),u32(body.length),u16(0)]);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,Buffer.concat([body,central,end]));}
export function zipFileManifest(archive){
  const buffer=readFileSync(archive),items=[];let offset=0;
  while(offset+4<=buffer.length&&buffer.readUInt32LE(offset)===0x04034b50){
    const method=buffer.readUInt16LE(offset+8),compressedSize=buffer.readUInt32LE(offset+18),size=buffer.readUInt32LE(offset+22),nameLength=buffer.readUInt16LE(offset+26),extraLength=buffer.readUInt16LE(offset+28),name=buffer.subarray(offset+30,offset+30+nameLength).toString("utf8"),start=offset+30+nameLength+extraLength,compressed=buffer.subarray(start,start+compressedSize),data=method===8?inflateRawSync(compressed):method===0?compressed:null;
    if(!data||data.length!==size)throw new Error(`invalid ZIP entry: ${name}`);
    items.push({path:name,sha256:sha256(data)});offset=start+compressedSize;
  }
  if(!items.length)throw new Error("ZIP has no local file entries");
  return items.sort((a,b)=>a.path.localeCompare(b.path));
}
export async function distributionErrors(){
  const errors=[],temporary=mkdtempSync(join(tmpdir(),"aidd-distribution-"));
  try{
    for(const [kind,create] of [["template",stage=>assemble(stage,"kit-template")],["product",stage=>assembleProduct(stage,{project_id:"KIT-DIST",name:"Kit distribution sample",mode:"greenfield",source_location:""})]]){
      const stage=join(temporary,kind),archive=join(temporary,`${kind}.zip`);mkdirSync(stage);await create(stage);
      if(kind==="product"){
        const contract=readJson(join(DEV,"fixtures/v2-distribution-contract.json")),project=readJson(join(stage,"project/.aidd/ssot/project.json"));
        for(const [key,value] of Object.entries(contract.project_record))if(project[key]!==value)errors.push(`new-project ${key} must be ${value}`);
        for(const required of contract.required_paths)if(!existsSync(join(stage,required)))errors.push(`v2 distribution fixture missing: ${required}`);
        for(const forbidden of contract.forbidden_paths??[])if(existsSync(join(stage,forbidden)))errors.push(`v2 distribution fixture contains forbidden path: ${forbidden}`);
        for(const legacy of contract.forbidden_legacy_ssot_files)if(existsSync(join(stage,"project/.aidd/ssot",legacy)))errors.push(`v2 distribution fixture contains legacy SSOT: ${legacy}`);
        const run=args=>spawnSync(process.execPath,[join(stage,".ai/tools/aidd.mjs"),...args],{cwd:stage,encoding:"utf8",env:{...process.env,AIDD_LIBRARY_MODE:"0",AIDD_WORKSPACE_ROOT:""}});
        for(const args of [["validate"],["add-module","--id","MOD-SMOKE","--name","Smoke module","--purpose","exercise new-project v2 flow"],["generate"],["documentation-check"],["validate"]]){const result=run(args);if(result.status!==0)errors.push(`new-project representative command failed (${args[0]}): ${processFailure(result)}`);}
      }
      writeZip(stage,archive);
      const directoryManifest=fileManifest(stage),archiveManifest=zipFileManifest(archive);
      if(!sameMap(Object.fromEntries(directoryManifest.map(item=>[item.path,item.sha256])),Object.fromEntries(archiveManifest.map(item=>[item.path,item.sha256]))))errors.push(`${kind} directory and ZIP payload differ`);
    }
  }catch(error){errors.push(`distribution verification failed: ${error.message}`);}
  finally{rmSync(temporary,{recursive:true,force:true});}
  return errors;
}
function deliver(stage,directory,archive){const destination=resolve(directory??archive);if(existsSync(destination))throw new Error(`output already exists; refusing to overwrite: ${destination}`);mkdirSync(dirname(destination),{recursive:true});if(directory)renameSync(stage,destination);else writeZip(stage,destination);return destination;}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
const [command,...rest]=process.argv.slice(2);
try{
  const options=parseOptions(command,rest);
  if(command==="status"){
    const repository=readJson(join(DEV,"repository.json")),change=readJson(join(DEV,`changes/${repository.active_change}.json`));
    const plan=kitReleasePlan();
    const others=changeRecords().filter(item=>["in_progress","in_review"].includes(item.status)&&item.id!==change.id);
    const lines=["# AIDD Kit 관리 상태",`- 역할: \`${readJson(ROLE_PATH).role}\``,`- 버전: \`${repository.current_version}\``,`- 현재 변경: \`${change.id}\` · ${change.status}`,`- 릴리스 계획: 미출시 ${plan.candidates.length}건 · 영향도 \`${plan.version_impact}\` · 다음 버전 ${plan.next_version?`\`${plan.next_version}\``:"없음"} · 차단 ${plan.blockers.length}건`];
    for(const item of others)lines.push(`- 진행 중인 다른 변경: \`${item.id}\` · ${item.status}`);
    lines.push("- 배포: 허용 목록 기반 directory/zip, 자동 업그레이드·역동기화 없음");
    console.log(lines.join("\n"));
  }
  else if(command==="sync-providers"){syncProviders();console.log("portable 스킬과 Kit 관리 스킬을 원본 provider 어댑터에 동기화했습니다.");}
  else if(command==="refresh-fixture"){const errors=await referenceFixtureGeneratedArtifactErrors({refresh:true});if(errors.length)throw new Error(errors.join("; "));console.log("reference fixture 파생 문서를 현재 정본에서 다시 생성했습니다.");}
  else if(command==="check"){const errors=validateSource();if(errors.length){console.error(`Kit check failed:\n- ${errors.join("\n- ")}`);process.exitCode=1;}else console.log("AIDD Kit quick check passed");}
  else if(command==="smoke"){const errors=await validateSourceAsync();if(errors.length){console.error(`Kit smoke failed:\n- ${errors.join("\n- ")}`);process.exitCode=1;}else console.log("AIDD Kit generation, export, and new-project smoke passed");}
  else if(command==="kit-release-plan"){
    const plan=kitReleasePlan(),lines=["# AIDD Kit 릴리스 계획",`- 현재 버전: \`${plan.current_version}\``,`- 집계 영향도: \`${plan.version_impact}\``,`- 다음 버전: ${plan.next_version?`\`${plan.next_version}\``:"없음"}`,`- 미출시 변경: ${plan.candidates.length}건`];
    for(const change of plan.candidates)lines.push(`  - \`${change.id}\` · ${change.version_impact} · ${change.status} · ${change.title}`);
    lines.push(`- 준비 차단: ${plan.blockers.length}건`);for(const blocker of plan.blockers)lines.push(`  - ${blocker}`);console.log(lines.join("\n"));
  }
  else if(command==="prepare-kit-release"){
    const plan=prepareKitRelease({date:options.date??today()});
    console.log(`AIDD Kit ${plan.next_version} 릴리스 정본을 준비했습니다. 커밋과 Git 태그는 생성하지 않았습니다.`);
  }
  else if(command==="export"){const directory=options.directory,archive=options.zip;if(!directory&&!archive)throw new Error("--directory or --zip is required");const temp=mkdtempSync(join(tmpdir(),"aidd-kit-export-")),stage=join(temp,"payload");try{mkdirSync(stage);assemble(stage,"kit-template");const destination=deliver(stage,directory,archive);console.log(`AIDD kit-template created: ${destination}`);}finally{rmSync(temp,{recursive:true,force:true});}}
  else if(command==="new-project"){const directory=options.directory,archive=options.zip;if(!directory&&!archive)throw new Error("--directory or --zip is required");const temp=mkdtempSync(join(tmpdir(),"aidd-kit-new-project-")),stage=join(temp,"payload"),project={project_id:options["project-id"],name:options.name,mode:options.mode??"greenfield",source_location:options["source-location"]??""};try{mkdirSync(stage);await assembleProduct(stage,project);const destination=deliver(stage,directory,archive);console.log(`AIDD product-workspace created: ${destination}`);}finally{rmSync(temp,{recursive:true,force:true});}}
  else{console.error(KIT_USAGE);process.exitCode=2;}
}catch(error){console.error(`ERROR: ${error.message}`);process.exitCode=2;}
}
