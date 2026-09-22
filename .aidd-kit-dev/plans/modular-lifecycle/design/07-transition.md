# 07 — 신규 시작·기존 정본 전환·롤백

요구 연결: 008~010, 018~021. 결정 제안: KIT-ADR-009.

## 1. 지원 범위와 비지원

- 신규 프로젝트는 v2만 생성한다. 구형 전역 파일과 신형 소유 파일을 나란히 쓰는 기본 경로는 없다.
- 전환의 초기 지원 입력은 **현재 Kit 1.0.0 계열의 schema_version=1 정본 계약**이다. 기존 KIT-CHG-017의 하위 호환 변경처럼 형식이 같아도 입력 계약/해시로 확인한다. 모든 과거/미래 버전과 사설 확장을 자동 지원하지 않는다.
- 제품 정본의 로컬 형식 변환과 Kit 파일 업그레이드는 다르다. 변환 도구는 REQ/SCR/TC/CHG/HIS/EVD 등의 데이터를 후보 v2 트리로 옮긴다. AGENTS/스킬/훅/소스의 자동 patch·merge·Kit 자동 설치·역동기화는 제공하지 않는다.
- 기존 프로젝트는 새 Kit를 별도 평가한 뒤 자체 CHG로 채택한다. 새로운 버전마다 지원 출발 형식·검사·변환 한계를 명시한다. 이번 설계를 모든 미래 버전 전환 보증으로 확대하지 않는다.
- FEAT는 새 정본이므로 기존 FEAT ID는 없다. 사람이 검토할 신규 FEAT 후보를 만들고 기존 REQ/UC/SCR/TC와 연결한다. 원래 없던 기능 명세·요구 사용자 검토·목업 검토를 자동으로 완료 처리하지 않는다.

## 2. 입력 추출·소유 매핑

v1 입력은 공식 파일과 공식 조각을 명시적으로 읽는다. `requirements.json + modules/**/*.json`, `ui-modules/**/*.json`, `system-surfaces.json + system-surfaces/**/*.json`, `history/YYYY-MM/*.json`도 포함한다. 경로가 없으면 실제 입력의 명세에 따라 빈 optional 조각인지 필수 결손인지 구분한다.

| 구형 파일 | 추출할 현재/역사적 항목 |
|---|---|
| project.json | 프로젝트 목적·범위·outcomes, 기존 project_id |
| requirements.json / modules 조각 | requirements(REQ/NFR), 기존 AC/참조 |
| modules.json | MOD 정의 |
| architecture.json | principles/components/flows/role_lenses/quality_attributes |
| decisions/open-items/assumptions/risks/changes.json | 각 decisions/open_items/assumptions/risks/changes |
| tests/releases/merges/deliverables/evidence/gate-runs.json | test_cases/releases/merges(내부 rechecks 포함)/deliverables/evidence/gate_runs |
| scenarios.json | use_cases/sequences |
| deployment.json | policy/gate/profiles/interview_dimensions/risk_patterns |
| technology.json | policy/gates/baselines |
| methodologies.json | selection_policy/profiles/methods |
| delivery-plan.json | milestones/work_items/interfaces/dependencies |
| guides/evaluations.json | guides, policy/scenarios/runs |
| repository.json | RGP 정의와 기존 검증 사실 |
| foundation/ui-system.json | standards/golden_paths/exceptions, baselines/patterns/components |
| ui-modules 조각 | SCR/MAN |
| operations/delivery-profiles.json | runbooks/delivery_profiles |
| documentation.json | policy/templates |
| system-surfaces.json 및 조각 | policy/surfaces/legacy_plans |
| workboard.json | WB 메타, current_focus/next_actions/watch_items/decision_requests |
| terminology.json | TRM terms/TCH change_history |
| history 조각 | HIS 원문·supersedes·대상 관계 |

각 레코드의 기존 단일 module이면 해당 소유, 명시적인 project 공통이면 common, 여러 모듈/소유 불명확이면 자동 복제하지 않고 매핑 결정 대상으로 보고한다. type은 collection 계약으로 지정하고 ID 접두사만 보고 임의 추정하지 않는다. 중첩 안정 ID는 독립 변경 단위인지에 따라 별도 파일 또는 부모+selector로 보존하고 대응표를 만든다.

## 3. 명시적 후보 변환 절차

1. 입력 형식/역할·현재 파일 목록·바이트 hash·ID/참조·확장 필드를 검사한다. 사용자 Git 상태와 지역 변경을 보고하되 자동 stash/commit하지 않는다.
2. `migration-plan`은 원본 불변 상태에서 입력 digest, mapping, 미지원/미확인 항목, 예상 출력, 손실 검사, 필요한 재검토를 보여준다. 계획 파일도 기존 대상을 덮어쓰지 않는다.
3. 프로젝트가 owner/type/불명확한 의미의 매핑을 결정한다. 미지원 정보는 원본 snapshot과 `legacy_extensions`로 보존하거나 변환을 중단한다. 지원하지 않는 의미를 보존했더라도 준비 완료로 인정하지 않는다.
4. `migration-build`는 plan의 원본 digest가 같은지 재확인하고 **별도 미존재 후보 디렉터리**에 v2 정본·snapshot·index와 변환 report를 만든다. 기존 project/.aidd를 교체하지 않는다.
5. 전체 구조/ID/참조·원문 보존·현재 유효성·문서 재생성을 검사한다. 결과는 converted / needs_review / unsupported / failed로 구분한다. 데이터가 읽힌다는 사실과 설계/릴리스 준비 완료는 다르다.
6. 프로젝트 수행팀이 후보를 검토하고 자체 변경으로 정본 경로를 교체한다. 채택 전 구형 쓰기를 중단하고 원본 보관·Git diff·경로 확인·복구 지점을 확보한다. Kit는 자동 in-place upgrade 명령을 제공하지 않는다.
7. 채택 후 v2 전용 validator로 구형 활성 파일 잔재·중복 소유·관련 명령/문서·기존 작업 연결을 확인한다. 보관 원본은 current ssot 밖에 두며 loader에서 읽지 않는다.

report에는 기존→새 경로/ID/selector, 보존/변환/미지원 필드, 양쪽 해시, 새로 필요한 review와 실행 결과를 남긴다. 원본 전체 데이터와 report를 대조하여 조용한 손실이 없는지 검사한다. 같은 plan 출력 재적용은 기존 target 존재로 거부한다. 후보 생성 중 실패는 해당 operation의 staging만 복구/표시하며 원본에는 쓰지 않는다.

## 4. 승인·실행 결과와 롤백

- 구형 done/implemented/passed는 과거 원문과 전환된 execution 사실로 보존한다. 새 RVW/BSL 기준을 충족하는 사용자 검토가 없으면 `missing` 또는 `legacy_unverified`의 진단을 표시한다.
- 실제 배포 사실이 있으면 구형 운영 기준선 snapshot으로 보존할 수 있다. 새 v2 요구·기능 검토가 아직 없다는 이유로 과거 배포가 없었다고 바꾸지 않는다. 다음 변경/릴리스의 새 준비도는 별도로 평가한다.
- 후보 생성 전에는 원본 불변이 기본 롤백이다. 채택 뒤에는 보관본과 채택 당시 diff/해시를 기준으로 **그 전환분만** 되돌린다. 채택 이후 사용자가 바꾼 항목은 자동 덮어쓰지 않고 별도로 조정한다.
- v2에서 새로 작성한 FEAT/RVW 등을 v1로 완전 역변환하는 기능은 지원하지 않는다. v1 도구로 돌아갈 때 새 정보는 별도 보존하고 반영 한계를 보고한다. 이를 데이터 손실 없는 자동 downgrade라고 부르지 않는다.

## 5. Kit 내부 이행

- 기존 reference fixture는 회귀 기준이지 고객 현재 데이터가 아니다. S04의 v2 대표 fixture를 별도로 추가하고 현재 fixture는 이행 동안 legacy adapter로 명시적으로 검사한다.
- S09에는 legacy 입력 fixture를 전환 시험 전용으로 고정하고, 주 reference fixture는 v2로 갱신하여 생성물 전체를 다시 만든다. generated 파일을 직접 수정하지 않는다.
- kit.mjs export/new-project는 같은 staging/allowlist 경로를 유지한다. 새 `.ai/tools/lib/`와 manifest/schema는 공개 payload, `.aidd-kit-dev/`·변환 시험/계획·대화는 비공개다.
- `.aidd/work/`는 로컬 임시 운영 자료로 Git에서 제외한다. index는 파생물로 재생성하며 snapshots는 참조된 검토/기준선 원문으로 보존·버전 관리한다. 새 프로젝트의 snapshot은 빈 상태다.
- S04~S09 구현 중 버전은 실제 릴리스 준비 요청까지 1.0.0 유지한다. 출처 파일은 호환성 보증이 아니며 미완료 변경을 실제 릴리스로 배포하지 않는다.
