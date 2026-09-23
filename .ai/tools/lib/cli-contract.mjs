// aidd.mjs 명령 계약의 단일 정본. 도움말, 필수 옵션 검사, 사용 가능 여부 판정이 모두 이 표를 읽는다.
// 옵션 이름 목록(파싱 규칙)은 각 실행 모듈에 두고, 여기에는 필수·대안·설명·예시·사용 조건만 둔다.

export const GROUPS = {
  setup: '프로젝트 준비',
  store: '정본 저장·조회',
  module: '모듈',
  readiness: '준비도·검토·게이트',
  decision: '결정·가정·용어 이력',
  integration: 'Git 통합',
  document: '문서·제출',
  evaluation: 'AI provider 평가',
  legacy: '레거시 역분석·도입',
};

// availability
//   always   : 정본 유무와 무관하게 실행한다.
//   template : 제품 정본이 없는 kit-template에서만 실행한다.
//   product  : 제품 정본이 있으면 실행한다(v1·v2 모두).
//   v2       : owned-records-v2 정본에서만 실행한다.
//   v1       : 구형 전역 정본에서만 실행한다.
const ex = text => `node .ai/tools/aidd.mjs ${text}`;
const PUT_SKELETON = [
  '입력 JSON 최소 골격(REQ 예):',
  '  {"schema_version":2,"id":"REQ-001","type":"REQ","owner":{"kind":"module","id":"MOD-A"},"revision":1,',
  '   "title":"…","lifecycle":"draft","relations":[],',
  '   "definition":{"statement":{"status":"known","value":"…"},"source":{"status":"unknown"},',
  '                 "value":{"status":"not_applicable","reason":"…"}}}',
  '요구·설계 정의 필드는 {status:"known",value} / {status:"unknown"} / {status:"not_applicable",reason} 중 하나로 감싼다. 평문을 그대로 넣으면 준비도 판정에서 차단된다.',
];

export const COMMANDS = {
  // 프로젝트 준비
  'project-bootstrap': { group: 'setup', availability: 'template', summary: 'kit-template에 제품 정본(project/)을 만들고 역할을 product-workspace로 바꾼다', required: ['project-id', 'name'], example: ex('project-bootstrap --project-id CRM --name "CRM" --mode greenfield') },
  'project-init': { group: 'setup', availability: 'always', summary: '현재 폴더에 Git 저장소를 초기화한다', example: ex('project-init') },
  'project-init-status': { group: 'setup', availability: 'always', summary: 'Git 저장소와 제품 정본 준비 상태를 보여준다', example: ex('project-init-status') },
  'install-hooks': { group: 'setup', availability: 'always', summary: '.githooks를 Git hooksPath로 연결한다', example: ex('install-hooks') },
  'project-reconcile-role': { group: 'setup', availability: 'template', summary: '이미 정본이 있는데 역할이 kit-template로 남은 경우 검증 뒤 역할을 맞춘다', example: ex('project-reconcile-role') },
  'sync-ai': { group: 'setup', availability: 'always', summary: '.ai/skills 정본에서 provider별 스킬 복사본을 갱신하고 훅 배선을 검사한다', example: ex('sync-ai') },
  hook: { group: 'setup', availability: 'always', summary: 'provider 훅 진입점(훅 설정에서 호출, 직접 실행용이 아님)', required: ['platform', 'event'] },

  // 정본 저장·조회
  'record-read': { group: 'store', availability: 'v2', summary: '레코드 하나와 정의 해시, 검토 입력 다이제스트를 읽는다', required: ['id'], example: ex('record-read --id REQ-001') },
  'record-list': { group: 'store', availability: 'v2', summary: '범위(모듈·소유자·타입·변경)의 레코드를 조회한다', example: ex('record-list --module MOD-A --type REQ') },
  'record-put': { group: 'store', availability: 'v2', summary: 'v2 레코드 JSON 파일을 정본에 생성 또는 갱신한다', required: ['input', 'operation'], one_of: [['create', 'expected-hash']], notes: ['새 레코드는 --create, 기존 레코드 갱신은 --expected-hash <현재 blob 해시>를 준다.', '요구·설계 정의(REQ·NFR·FEAT·SCR 등)를 쓰려면 --change CHG-ID가 필요하고, 그 CHG 범위에 자동 등록된다.', ...PUT_SKELETON], example: ex('record-put --input req.json --operation add-req-001 --create --change CHG-001') },
  'record-move': { group: 'store', availability: 'v2', summary: '레코드의 소유자(공통↔모듈)를 옮긴다', required: ['id', 'owner', 'expected-hash', 'operation'], example: ex('record-move --id REQ-001 --owner MOD-B --expected-hash <해시> --operation move-req-001') },
  'index-check': { group: 'store', availability: 'v2', summary: '파생 인덱스가 실제 파일과 맞는지 검사한다', example: ex('index-check') },
  'index-rebuild': { group: 'store', availability: 'v2', summary: '파생 인덱스를 실제 파일에서 다시 만든다', example: ex('index-rebuild') },
  'transaction-status': { group: 'store', availability: 'v2', summary: '저장 작업(operation)의 저널 상태를 조회한다', required: ['operation'], example: ex('transaction-status --operation add-req-001') },
  'transaction-recover': { group: 'store', availability: 'v2', summary: '중단된 저장 작업을 재개(resume)하거나 되돌린다(rollback)', required: ['operation', 'action'], example: ex('transaction-recover --operation add-req-001 --action rollback') },
  validate: { group: 'store', availability: 'product', summary: '정본의 구조·참조·의미 정합성을 검사한다', example: ex('validate') },

  // 모듈
  'add-module': { group: 'module', availability: 'product', summary: 'MOD 레코드를 만든다', required: ['id', 'name', 'purpose'], example: ex('add-module --id MOD-SALES --name "영업" --purpose "영업 기회 관리"') },
  'module-status': { group: 'module', availability: 'product', summary: '모듈의 현재 상태를 읽기 전용으로 보여준다(직접 변경 불가)', required: ['module'], example: ex('module-status --module MOD-SALES --format text') },
  'init-module-ui': { group: 'module', availability: 'product', summary: '모듈 UI 초기화 안내(v2에서는 빈 파일을 만들지 않는다)', required: ['module'] },
  'init-module-surfaces': { group: 'module', availability: 'product', summary: '모듈 실행 표면 초기화 안내(v2에서는 빈 파일을 만들지 않는다)', required: ['module'] },
  'migrate-module-specs': { group: 'module', availability: 'v1', summary: '구형 전역 정본을 모듈 조각으로 나눈다(v1 전용)' },

  // 준비도·검토·게이트
  status: { group: 'readiness', availability: 'product', summary: '프로젝트·모듈·변경·작업 브리핑을 만든다(읽기 전용)', example: ex('status --level executive --format text') },
  'discovery-check': { group: 'readiness', availability: 'v2', summary: '변경 주기의 선행 시스템·업무 분석 준비도를 판정한다', required: ['change'], example: ex('discovery-check --change CHG-001') },
  'requirement-check': { group: 'readiness', availability: 'v2', summary: '변경 주기의 요구 확정 준비도를 판정한다', required: ['change'], example: ex('requirement-check --change CHG-001') },
  'design-check': { group: 'readiness', availability: 'v2', summary: '변경 주기의 설계 진입 준비도를 판정한다', required: ['change'], example: ex('design-check --change CHG-001') },
  'development-check': { group: 'readiness', availability: 'product', summary: '작업(WRK) 또는 변경(CHG) 단위의 개발 착수 준비도를 판정한다', one_of: [['work', 'change']], example: ex('development-check --work WRK-001') },
  'release-check': { group: 'readiness', availability: 'product', summary: '릴리스의 출시 준비도를 판정한다', required: ['release'], example: ex('release-check --release REL-001') },
  'baseline-create': { group: 'readiness', availability: 'v2', summary: '범위의 정본 원문과 해시를 기준선(BSL)으로 고정한다', required: ['input', 'operation'], example: ex('baseline-create --input bsl.json --operation bsl-001') },
  'review-record': { group: 'readiness', availability: 'v2', summary: '검토 결과(RVW)를 기록하고 필요하면 OI/DRQ를 종료한다', required: ['input', 'operation'], example: ex('review-record --input rvw.json --operation rvw-001') },
  'gate-run': { group: 'readiness', availability: 'v2', summary: '게이트를 실행해 결과(GTR)를 기록한다', required: ['scope', 'gate', 'operation'], example: ex('gate-run --scope CHG-001 --gate RG-001 --operation gate-rg-001') },
  impact: { group: 'readiness', availability: 'product', summary: '레코드 변경의 직접·간접 영향 후보를 계산한다(읽기 전용)', required: ['id'], example: ex('impact --id REQ-001') },
  'impact-apply': { group: 'readiness', availability: 'v2', summary: '영향 후보의 분류 결과(IMP)를 저장하고 재개할 WRK를 정한다', required: ['input', 'operation'], example: ex('impact-apply --input imp.json --operation imp-001') },
  'workload-coverage': { group: 'readiness', availability: 'product', summary: '변경 범위의 요구·설계 항목이 WRK로 덮이는지 본다', required: ['change'], example: ex('workload-coverage --change CHG-001') },

  // 결정·가정·용어 이력
  'record-history': { group: 'decision', availability: 'product', summary: '의미 있는 결정을 HIS 이력으로 남긴다', required: ['id', 'type', 'subject', 'decided-by', 'decision', 'reason', 'occurred-at', 'operation'], notes: ['ID의 날짜(HIS-YYYYMMDD-###)는 --occurred-at의 UTC 날짜와 같아야 한다.', '--type: analysis|design|terminology|source|scope|status|operation|decision'], example: ex('record-history --id HIS-20260923-001 --occurred-at 2026-09-23T03:00:00.000Z --type decision --subject REQ-001 --change CHG-001 --decided-by "프로젝트팀 협의" --decision "…" --reason "…" --operation his-20260923-001') },
  'add-assumption': { group: 'decision', availability: 'product', summary: '확인되지 않은 가정(ASM)을 기록한다', required: ['id', 'statement', 'rationale', 'due-gate', 'operation'], notes: ['--due-gate: 가정을 해소해야 하는 게이트 ID(BG-001, RG-001, DG-001, FG-001, TG-001, TG-002, RL-001)'], example: ex('add-assumption --id ASM-001 --statement "…" --rationale "…" --due-gate DG-001 --operation asm-001') },
  'resolve-assumption': { group: 'decision', availability: 'product', summary: '가정을 확인 또는 무효로 해소한다', required: ['id', 'resolution', 'status', 'operation'], notes: ['--status: confirmed|invalidated'], example: ex('resolve-assumption --id ASM-001 --status confirmed --resolution "…" --operation asm-001-resolve') },
  'term-review': { group: 'decision', availability: 'product', summary: '용어 추가·변경·제거의 영향 카드를 만든다(읽기 전용)', required: ['action', 'id'], notes: ['--action: add|change|remove. add에는 --term --key --concept-type --category --definition --scope도 필요하다.'], example: ex('term-review --action add --id TRM-001 --term "기회" --key opportunity --concept-type business --category 영업 --definition "…" --scope MOD-SALES') },
  'term-apply': { group: 'decision', availability: 'product', summary: '결정된 용어 변경을 TRM·TCH에 반영하고 용어집을 재생성한다', required: ['action', 'id', 'history', 'decided-by', 'summary', 'operation'], example: ex('term-apply --action add --id TRM-001 … --history TCH-001 --decided-by "프로젝트팀 협의" --summary "…" --operation trm-001') },
  'terminology-refresh': { group: 'decision', availability: 'product', summary: '용어집 파생 문서를 다시 만든다', example: ex('terminology-refresh') },

  // Git 통합
  'integration-status': { group: 'integration', availability: 'product', summary: '브랜치·작업 트리·원격 차이·미완 병합 재검토를 보여준다', example: ex('integration-status') },
  'record-merge': { group: 'integration', availability: 'product', summary: '현재 HEAD가 병합 커밋이면 MRG를 기록한다(post-merge 훅용)', example: ex('record-merge --operation merge-<HEAD>') },
  'assess-merge': { group: 'integration', availability: 'product', summary: '병합의 영향 모듈·충돌 해결·추가 테스트 필요를 평가한다', required: ['merge', 'notes', 'additional-testing', 'operation'], example: ex('assess-merge --merge MRG-001 --modules MOD-A --notes "…" --additional-testing required --operation mrg-001-assess') },
  'add-merge-recheck': { group: 'integration', availability: 'product', summary: '병합 후 재검토(MRC) 항목을 만든다', required: ['merge', 'type', 'title', 'operation'], notes: ['--type: review|test'], example: ex('add-merge-recheck --merge MRG-001 --type test --title "…" --test TC-001 --operation mrc-001') },
  'complete-merge-recheck': { group: 'integration', availability: 'product', summary: '재검토 결과를 증거와 함께 완료 처리한다', required: ['merge', 'recheck', 'performed-by', 'result', 'operation'], notes: ['--result: passed|failed'], example: ex('complete-merge-recheck --merge MRG-001 --recheck MRC-001 --performed-by "…" --result passed --evidence EVD-001 --operation mrc-001-done') },

  // 문서·제출
  generate: { group: 'document', availability: 'product', summary: '정본에서 파생 문서·목업·사이트를 다시 만든다', example: ex('generate --module MOD-A') },
  'documentation-check': { group: 'document', availability: 'product', summary: '파생 문서가 현재 정본과 같은지 검사한다(--staged: 커밋 대상 소스 포함)', example: ex('documentation-check --staged') },
  'document-impact': { group: 'document', availability: 'product', summary: '변경된 파일이 어떤 정본·문서에 영향을 주는지 본다(읽기 전용)', example: ex('document-impact --path project/src/app.js') },
  'delivery-build': { group: 'document', availability: 'v2', summary: '제출 정책(DLP)에 따라 인도 패키지를 조립한다', required: ['profile'], one_of: [['output', 'directory']], example: ex('delivery-build --profile DLP-001 --output dist/delivery') },
  'delivery-glossary': { group: 'document', availability: 'product', summary: '용어집 전용 제출물을 조립한다', required: ['profile', 'directory'], example: ex('delivery-glossary --profile DLP-GLOSSARY --directory dist/glossary') },

  // AI provider 평가
  'evaluation-prompt': { group: 'evaluation', availability: 'product', summary: '평가 시나리오(EVS)의 프롬프트와 fixture를 꺼낸다', required: ['scenario'], example: ex('evaluation-prompt --scenario EVS-001') },
  'evaluation-status': { group: 'evaluation', availability: 'product', summary: '시나리오별 provider 평가 현황을 보여준다', example: ex('evaluation-status') },
  'record-evaluation': { group: 'evaluation', availability: 'product', summary: '실제 provider 평가 결과(EVR)를 기록한다', required: ['scenario', 'platform', 'status', 'evidence', 'scores', 'summary', 'operation'], notes: ['--platform: codex|claude, --status: passed|failed, --scores: rubric 항목 수만큼 0~2'], example: ex('record-evaluation --scenario EVS-001 --platform claude --status passed --evidence EVD-001 --scores 2 2 1 --summary "…" --operation evr-001') },

  // 레거시 역분석·도입
  'legacy-inventory': { group: 'legacy', availability: 'v2', summary: '기존 소스·문서를 읽기 전용으로 수집해 관측 장부를 만든다', required: ['input'], example: ex('legacy-inventory --input scope.json') },
  'legacy-draft': { group: 'legacy', availability: 'v2', summary: '관측 장부에서 정본 초안을 미리 본다(저장하지 않음)', required: ['input', 'inventory'], example: ex('legacy-draft --input plan.json --inventory inventory.json') },
  'legacy-apply': { group: 'legacy', availability: 'v2', summary: '초안을 생성 전용으로 정본에 적용한다', required: ['input', 'operation'], example: ex('legacy-apply --input draft.json --operation legacy-001') },
  'legacy-review': { group: 'legacy', availability: 'v2', summary: '변경 주기의 레거시 초안을 순차 검토용으로 나열한다', required: ['change'], example: ex('legacy-review --change CHG-001 --limit 3') },
  'legacy-review-request': { group: 'legacy', availability: 'v2', summary: '초안 검토 질문을 사용자에게 제시할 DRQ로 저장한다', required: ['input', 'operation'], example: ex('legacy-review-request --input request.json --operation lrq-001') },
  'legacy-review-answer': { group: 'legacy', availability: 'v2', summary: '검토 답변(부분 응답 포함)을 반영한다', required: ['input', 'operation'], example: ex('legacy-review-answer --input answer.json --operation lra-001') },
  'legacy-reanalyze': { group: 'legacy', availability: 'v2', summary: '생성 기준·사용자 편집·새 제안의 세 버전을 비교한다', required: ['input', 'inventory', 'previous'], example: ex('legacy-reanalyze --input plan.json --inventory inventory.json --previous draft.json') },
  'legacy-reconcile': { group: 'legacy', availability: 'v2', summary: '재분석 결과 중 채택한 값을 정본에 반영한다', required: ['input', 'operation'], example: ex('legacy-reconcile --input reconcile.json --operation lrc-001') },
  'legacy-source-check': { group: 'legacy', availability: 'v2', summary: '레거시 소스가 관측 시점 이후 바뀌었는지 검사한다', required: ['change'], example: ex('legacy-source-check --change CHG-001') },
  'legacy-adoption-check': { group: 'legacy', availability: 'v2', summary: '모듈 CHG 단위의 문서 채택·실행 검증 준비도를 판정한다', required: ['change', 'module'], example: ex('legacy-adoption-check --change CHG-001 --module MOD-A') },
  'legacy-adopt': { group: 'legacy', availability: 'v2', summary: '검토된 레거시 초안을 모듈 정본으로 채택한다', required: ['input', 'operation'], example: ex('legacy-adopt --input adopt.json --operation adopt-001') },
};

export const requiredFor = command => COMMANDS[command]?.required ?? [];
export const oneOfFor = command => COMMANDS[command]?.one_of ?? [];

const present = value => value !== undefined && value !== false && !(Array.isArray(value) && value.length === 0) && (value === true || Array.isArray(value) || String(value).trim() !== '');
// 누락된 필수 옵션과 충족되지 않은 대안 묶음을 돌려준다. 검증기와 도움말이 같은 판정을 쓴다.
export function missingOptions(command, options) {
  return { missing: requiredFor(command).filter(key => !present(options[key])), unmet: oneOfFor(command).filter(group => !group.some(key => present(options[key]))) };
}
export function missingMessage(command, { missing, unmet }) {
  const parts = [];
  if (missing.length) parts.push(`필수 옵션 누락: ${missing.map(key => `--${key}`).join(', ')}`);
  for (const group of unmet) parts.push(`${group.map(key => `--${key}`).join(' 또는 ')} 중 하나가 필요하다`);
  return `${parts.join('. ')}. '${command} --help'로 사용법을 확인한다.`;
}
export function requirementText(command) {
  const required = requiredFor(command).map(key => `--${key}`), groups = oneOfFor(command).map(group => `${group.map(key => `--${key}`).join(' 또는 ')} 중 하나`);
  if (!required.length && !groups.length) return '없음';
  return [required.join(', '), ...groups].filter(Boolean).join(required.length && groups.length ? ', 그리고 ' : '');
}

// workspace: { role, format } — format은 project.json의 storage_format(v2), 구형이면 'legacy', 정본이 없으면 null.
export function availability(command, workspace) {
  const contract = COMMANDS[command]; if (!contract) return { available: false, reason: '알 수 없는 명령' };
  const hasProject = workspace.format !== null, v2 = workspace.format === 'owned-records-v2';
  switch (contract.availability) {
    case 'always': return { available: true };
    case 'template': return hasProject ? { available: false, reason: '이미 제품 정본이 있다. product-workspace에서는 사용하지 않는다' } : { available: true };
    case 'product': return hasProject ? { available: true } : { available: false, reason: 'project-bootstrap으로 제품 정본을 먼저 만든다' };
    case 'v2': return v2 ? { available: true } : hasProject ? { available: false, reason: '구형 전역 정본 프로젝트에서는 사용하지 않는다(owned-records-v2 전용)' } : { available: false, reason: 'project-bootstrap으로 v2 제품 정본을 먼저 만든다' };
    case 'v1': return !hasProject ? { available: false, reason: '제품 정본이 없다' } : v2 ? { available: false, reason: 'owned-records-v2 정본은 이미 레코드별 파일이다. 구형 정본 전용 명령' } : { available: true };
    default: return { available: false, reason: '사용 조건이 정의되지 않았다' };
  }
}

export function commandHelp(command, { optionKeys, booleanOptions, workspace, requiredOverride }) {
  const contract = COMMANDS[command]; if (!contract) return null;
  const required = requiredOverride ?? requiredFor(command), state = workspace ? availability(command, workspace) : { available: true };
  const flags = [...new Set(optionKeys)].map(key => `  --${key}${booleanOptions.has(key) ? '' : ' VALUE'}${required.includes(key) ? ' (필수)' : ''}`);
  const lines = [`사용법: node .ai/tools/aidd.mjs ${command} [옵션]`, `설명: ${contract.summary}`, `그룹: ${GROUPS[contract.group]}`];
  if (workspace) lines.push(`현재 작업공간에서: ${state.available ? '사용 가능' : `사용 불가 — ${state.reason}`}`);
  lines.push(`필수: ${requiredOverride ? (requiredOverride.length ? requiredOverride.map(key => `--${key}`).join(', ') : '없음') : requirementText(command)}`);
  if (flags.length) lines.push('옵션:', ...flags);
  if (contract.notes?.length) lines.push('참고:', ...contract.notes.map(note => note.startsWith(' ') ? `   ${note}` : `  - ${note}`));
  if (contract.example) lines.push('예시:', `  ${contract.example}`);
  lines.push('', "'node .ai/tools/aidd.mjs --help'로 전체 명령 목록을 본다.");
  return lines.join('\n');
}

export function commandIndex(commands, workspace) {
  const width = Math.max(...commands.map(name => name.length)) + 2;
  const row = name => `  ${name.padEnd(width)}${COMMANDS[name]?.summary ?? ''}`;
  const usable = commands.filter(name => availability(name, workspace).available), blocked = commands.filter(name => !availability(name, workspace).available);
  const lines = ['사용법: node .ai/tools/aidd.mjs <명령> [옵션]', `현재 작업공간: 역할 ${workspace.role ?? '알 수 없음'} · 제품 정본 ${workspace.format === null ? '없음(kit-template)' : workspace.format === 'owned-records-v2' ? 'owned-records-v2' : '구형 전역 정본'}`, ''];
  for (const [group, title] of Object.entries(GROUPS)) {
    const members = usable.filter(name => COMMANDS[name]?.group === group).sort();
    if (members.length) lines.push(`[${title}]`, ...members.map(row), '');
  }
  if (blocked.length) {
    // 같은 이유로 막힌 명령이 많으면(정본 없음 등) 한 줄로 요약하고, 몇 개만 막혔으면 명령별로 보여준다.
    const byReason = new Map();
    for (const name of blocked.sort()) { const reason = availability(name, workspace).reason; byReason.set(reason, [...(byReason.get(reason) ?? []), name]); }
    lines.push('현재 사용할 수 없는 명령:');
    for (const [reason, names] of byReason) {
      if (names.length > 5) lines.push(`  제품 명령 ${names.length}개 — ${reason}`);
      else lines.push(...names.map(name => `  ${name.padEnd(width)}${reason}`));
    }
    lines.push('');
  }
  lines.push("'<명령> --help'로 옵션과 예시를 본다. 알 수 없는 명령은 오류로 끝나며 다른 명령으로 대신 실행하지 않는다.");
  return lines.join('\n');
}

// 오타 안내: 접두·부분 일치 또는 편집 거리 2 이하의 명령을 제안한다.
export function suggestions(input, commands) {
  const distance = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  const text = String(input ?? '').toLowerCase();
  return [...commands].filter(name => name.includes(text) || text.includes(name) || distance(name, text) <= 2).sort().slice(0, 5);
}
