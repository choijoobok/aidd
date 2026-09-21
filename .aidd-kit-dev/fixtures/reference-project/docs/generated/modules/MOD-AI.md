<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# MOD-AI — AI 플랫폼 어댑터

- 상태: in_progress
- 목적: 이식 가능한 스킬과 공통 정책을 Codex·Claude Code 검색 경로와 생애주기 훅에 동기화한다.
- 의존 모듈: MOD-GOV

## 요구사항

| 요구사항 | 제목 | 상태 | 검증 |
| --- | --- | --- | --- |
| REQ-013 | Codex·Claude 동등성 | specified | TC-003 |
| REQ-023 | Git과 CI 품질 게이트 강제 | implemented | TC-006, TC-014 |
| REQ-026 | Codex·Claude 행동 품질 동등성 평가 | specified | TC-004, TC-017, TC-018 |
| REQ-035 | 변경 유형별 문서 동기화와 레거시 전환 | implemented | TC-027 |

## 작업 항목

| 작업 | 제목 | 상태 | 변경 | 요구사항 | 포괄 범위 | 선행 작업 | 증거 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WRK-006 | Codex·Claude 공통 행동 평가 하네스 | completed | CHG-006 | REQ-026 | - | WRK-003 | EVD-016 |
| WRK-007 | Codex·Claude 실제 교차 행동 평가 | todo | CHG-006 | REQ-026 | - | WRK-006 | - |

## 인터페이스

| ID | 이름 | 상태 | 제공 | 소비 | 호환성 |
| --- | --- | --- | --- | --- | --- |
| IFC-002 | 공통 AI 스킬-플랫폼 어댑터 계약 | current | MOD-AI | MOD-DISC, MOD-ARCH, MOD-DELIVERY, MOD-QA, MOD-STATUS | 플랫폼 전용 지침과 훅은 얇게 유지하고 공통 수행 규칙은 AGENTS.md, 공통 스킬 의미는 .ai/skills에 둔다. |

## 모듈 의존성

| ID | 출발 | 도착 | 상태 | 설명 |
| --- | --- | --- | --- | --- |

## 관련 변경

| ID | 등급 | 상태 | 제목 |
| --- | --- | --- | --- |
| CHG-001 | C2 | in_progress | AIDD 기반 구조 수립 |
| CHG-005 | C2 | in_progress | Git 병합 훅과 GitHub CI 강제 |
| CHG-006 | C2 | in_progress | 프로젝트 착수 전 실행 기반 완성 |
| CHG-013 | C2 | in_progress | 변경 유형별 분석·설계 진입과 레거시 문서 현행화 통제 |

## 관련 결정

| ID | 상태 | 제목 |
| --- | --- | --- |
| ADR-003 | accepted | 이식 가능한 스킬 코어와 생성형 AI 어댑터 |
| ADR-012 | accepted | 구현 표면 기반 문서 동기화와 레거시 단계 전환 |
| ADR-011 | accepted | AGENTS.md를 공통 AI 수행 계약의 단일 정본으로 사용 |

## 관련 테스트

| ID | 상태 | 제목 |
| --- | --- | --- |
| TC-003 | passed | 공통 AI 계약 단일 정본과 Codex·Claude 스킬 동등성 검증 |
| TC-004 | not_run | 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가 |
| TC-006 | passed | 병합 커밋 기록·영향 평가·재검토 이력 |
| TC-014 | passed | 병합 훅 인자와 GitHub CI 정의 검증 |
| TC-017 | not_run | Codex·Claude 실제 교차 행동 평가 |
| TC-018 | passed | AI 교차 평가 하네스와 공통 루브릭 검증 |
| TC-027 | passed | 변경 유형별 분석·설계·문서 동기화와 레거시 전환 통제 |

## UI 정본

- 화면: 0개
- 매뉴얼: 0개

## 모듈 정본

### MOD-AI — AI 플랫폼 어댑터

- **id:** MOD-AI
- **name:** AI 플랫폼 어댑터
- **purpose:** 이식 가능한 스킬과 공통 정책을 Codex·Claude Code 검색 경로와 생애주기 훅에 동기화한다.
- **status:** in_progress
- **dependencies:** MOD-GOV
- **requirements:** REQ-013, REQ-023, REQ-026, REQ-035

## 요구사항 상세

### REQ-013 — Codex·Claude 동등성

- **id:** REQ-013
- **title:** Codex·Claude 동등성
- **statement:** 프레임워크는 AGENTS.md를 공통 AI 수행 계약의 단일 정본으로 사용하고 Claude Code가 이를 import하게 하며, 공통 스킬과 검증 동작을 두 플랫폼에 동기화해야 한다.
- **rationale:** 도구 선택이 수행 품질이나 거버넌스 기대 수준을 바꾸면 안 된다.
- **priority:** must
- **status:** specified
- **modules:** MOD-AI
- **verification:** TC-003
- **acceptance_criteria:** AGENTS.md가 공통 규칙의 단일 정본이고 CLAUDE.md가 이를 import한다, 두 에이전트가 동일한 스킬 내용을 읽는다, 어댑터 불일치가 검증에 실패한다
- **source:** USER-2026-09-17

### REQ-023 — Git과 CI 품질 게이트 강제

- **id:** REQ-023
- **title:** Git과 CI 품질 게이트 강제
- **statement:** 프레임워크는 병합 훅과 CI에서 동일한 생성·검증·테스트·AI 어댑터 동등성 검사를 실행하고 병합 영향을 추적해야 한다.
- **rationale:** 로컬 자발적 실행만으로는 팀 저장소의 정합성과 병합 품질을 보장할 수 없다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-AI, MOD-CHG, MOD-QA
- **verification:** TC-006, TC-014
- **acceptance_criteria:** Git post-merge 훅이 Git 전달 인자를 처리한다, GitHub CI가 생성 문서·정본·테스트·어댑터 불일치를 차단한다, 병합 영향 레코드의 모듈·추가 테스트 참조가 검증된다
- **source:** AUDIT-2026-09-18

### REQ-026 — Codex·Claude 행동 품질 동등성 평가

- **id:** REQ-026
- **title:** Codex·Claude 행동 품질 동등성 평가
- **statement:** 프레임워크는 파일 동등성을 넘어 Codex와 Claude가 동일한 대표 시나리오와 루브릭에서 요구 발굴, 변경 통제와 게이트 판단을 같은 품질 수준으로 수행하는지 평가해야 한다.
- **rationale:** 동일한 스킬 파일도 모델과 훅 차이 때문에 다른 행동 결과를 만들 수 있다.
- **priority:** must
- **status:** specified
- **modules:** MOD-AI, MOD-DISC, MOD-QA
- **verification:** TC-004, TC-017, TC-018
- **acceptance_criteria:** 두 플랫폼이 같은 픽스처와 루브릭을 사용한다, 플랫폼별 결과와 증거가 분리된다, 중대 금지 행동과 점수 차이 기준을 모두 통과한다
- **source:** AUDIT-2026-09-18

### REQ-035 — 변경 유형별 문서 동기화와 레거시 전환

- **id:** REQ-035
- **title:** 변경 유형별 문서 동기화와 레거시 전환
- **statement:** 프레임워크는 신규 기능의 분석·설계를 구현보다 먼저 완료하고, 기존 기능과 레거시 변경은 시스템 표면별 문서 상태에 따라 즉시 현행화하거나 기한 있는 후속 작업을 만들며, 커밋 전에 소스만 변경된 상태를 탐지해야 한다.
- **rationale:** 화면·API와 문서의 괴리를 방치하지 않으면서 문서가 없는 기존 시스템의 단계적 고도화를 현실적으로 지원한다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-GOV, MOD-DOC, MOD-AI, MOD-CHG, MOD-QA, MOD-DELIVERY
- **verification:** TC-027
- **acceptance_criteria:** 신규 기능은 결정된 요구분석과 설계 및 최신 문서 없이 개발 진입할 수 없다, 기존 문서가 있는 표면은 같은 변경에서 현행화한다, 문서가 없는 기존 표면은 고객의 즉시 작성 또는 기한 있는 후속 작업 선택을 기록한다, 레거시 화면 경로·API·배치·이벤트·연동·마이그레이션을 모듈별로 조사하고 기존 문서의 출처를 보존해 변환한다, 커밋 전 검사에서 소스 변경과 문서 변경 또는 결정된 후속 작업의 연결을 검증한다
- **source:** USER-2026-09-18

## 관련 변경

### CHG-001 — AIDD 기반 구조 수립

- **id:** CHG-001
- **title:** AIDD 기반 구조 수립
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-DOC, MOD-AI, MOD-STATUS, MOD-CHG, MOD-QA
- **requirements:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018
- **required_gates:** DG-001, TG-001, TG-002
- **required_work_coverage:** design, implementation, test, documentation, security, data, migration, deployment, operations
- **delivery_path:**

```json
{
  "kind": "governance",
  "analysis": "reused",
  "design": "reused",
  "documentation": "update_now",
  "surfaces": [],
  "documentation_work": [],
  "decided_by": "고객",
  "reason": "AIDD Kit 자체 거버넌스 변경"
}
```
- **impact:** 프로젝트 정본 구조, 이식 가능한 스킬, 검증, 생성 뷰와 생애주기 훅을 도입한다.
- **migration:** 파일럿에 저장소 구조를 적용하고 기존 시스템에서는 현재 사실을 안정적인 레코드로 가져온다.
- **rollback:** 도입 커밋을 되돌린다. 정본 JSON은 애플리케이션 실행 환경을 변경하지 않으며 계속 내보낼 수 있다.
- **regression_scope:** 레지스트리 검증, 문서 생성, AI 어댑터 동등성, 상태 렌더링, 병합 기록

### CHG-005 — Git 병합 훅과 GitHub CI 강제

- **id:** CHG-005
- **title:** Git 병합 훅과 GitHub CI 강제
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-AI, MOD-CHG, MOD-QA
- **requirements:** REQ-012, REQ-013, REQ-018, REQ-023
- **required_gates:** TG-002
- **required_work_coverage:** design, implementation, test, documentation, security, migration, deployment, operations
- **delivery_path:**

```json
{
  "kind": "governance",
  "analysis": "reused",
  "design": "reused",
  "documentation": "update_now",
  "surfaces": [],
  "documentation_work": [],
  "decided_by": "고객",
  "reason": "AIDD Kit 자체 거버넌스 변경"
}
```
- **impact:** Git post-merge 인자 처리와 GitHub Actions의 생성·검증·테스트·어댑터 동등성 검사를 추가한다.
- **migration:** 저장소에서 install-hooks를 실행하고 GitHub의 필수 상태 검사를 원격 설정한다.
- **rollback:** 워크플로와 훅 인자 처리를 제거하고 기존 수동 검증 절차로 복귀한다.
- **regression_scope:** 병합 기록, CLI 인자, 문서 생성, 정본 검증, 단위 테스트, 스킬 동기화

### CHG-006 — 프로젝트 착수 전 실행 기반 완성

- **id:** CHG-006
- **title:** 프로젝트 착수 전 실행 기반 완성
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-DOC, MOD-AI, MOD-QA, MOD-STATUS, MOD-CHG, MOD-DELIVERY
- **requirements:** REQ-004, REQ-005, REQ-006, REQ-010, REQ-011, REQ-024, REQ-025, REQ-026, REQ-027
- **required_gates:** TG-002
- **required_work_coverage:** design, implementation, test, documentation, security, migration, deployment, operations, training
- **delivery_path:**

```json
{
  "kind": "governance",
  "analysis": "reused",
  "design": "reused",
  "documentation": "update_now",
  "surfaces": [],
  "documentation_work": [],
  "decided_by": "고객",
  "reason": "AIDD Kit 자체 거버넌스 변경"
}
```
- **impact:** 모듈별 상세 계획, 결정 대체와 개발 시작 차단, 운영·사용자·보안 가이드, AI 교차 평가 하네스와 GitHub 보호 규칙 기준을 추가한다.
- **migration:** 기존 모듈과 변경을 작업·마일스톤에 연결하고 실제 프로젝트 착수 시 도메인 작업과 인터페이스를 같은 모델로 추가한다.
- **rollback:** delivery-plan.json·guides.json·evaluations.json·repository.json과 연결 생성기·검증을 제거하되 기존 증거와 변경 이력은 보존한다.
- **regression_scope:** 정본 참조, 모듈 상태 뷰, 가이드 생성, 개발 시작 게이트, AI 평가 현황, GitHub 보호 규칙, 릴리스 준비도

### CHG-013 — 변경 유형별 분석·설계 진입과 레거시 문서 현행화 통제

- **id:** CHG-013
- **title:** 변경 유형별 분석·설계 진입과 레거시 문서 현행화 통제
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-DOC, MOD-AI, MOD-CHG, MOD-QA, MOD-DELIVERY
- **requirements:** REQ-035
- **required_gates:** TG-002
- **required_work_coverage:** design, implementation, test, documentation, migration, operations, training
- **delivery_path:**

```json
{
  "kind": "governance",
  "analysis": "reused",
  "design": "reused",
  "documentation": "update_now",
  "surfaces": [],
  "documentation_work": [],
  "decided_by": "고객",
  "reason": "AIDD Kit의 변경·문서화 정책 구현"
}
```
- **impact:** 신규 기능, 기존 기능 변경, 결함, 내부 리팩터링과 레거시 고도화를 구분하고 화면 경로·API·배치·이벤트·연동·마이그레이션 표면을 기준으로 문서 현행화를 통제한다.
- **migration:** 기존 CHG에는 거버넌스 경로를 소급하고 실제 프로젝트는 모듈별 시스템 표면을 등록한다. 레거시 프로젝트는 전체 인벤토리와 문서 전환 계획을 먼저 만든다.
- **rollback:** system-surfaces 정본과 커밋 전 검사를 제거하고 변경별 delivery_path를 내보내 보존한 뒤 종전 수동 문서 검토로 복귀한다.
- **regression_scope:** 신규 기능 분석·설계 진입, 기존 기능 문서 즉시·후속 작성 선택, 화면·API 표면 매핑, 레거시 인벤토리, 커밋 전 소스·문서 검사, 릴리스 문서 부채 차단

## 관련 결정

### ADR-003 — 이식 가능한 스킬 코어와 생성형 AI 어댑터

- **id:** ADR-003
- **title:** 이식 가능한 스킬 코어와 생성형 AI 어댑터
- **status:** accepted
- **date:** 2026-09-17
- **context:** Codex와 Claude Code는 프로젝트 스킬 검색 경로가 다르지만 SKILL.md 규약을 공유한다.
- **options:** 독립적인 스킬 세트 두 개 유지, 심볼릭 링크 사용, 하나의 정본 스킬 트리에서 복사하고 동일성 검증
- **decision:** .ai/skills에서 작성하고 두 어댑터 트리를 생성하며 네이티브 훅 설정은 얇게 유지한다.
- **consequences:** 의미 내용이 동일하다, 동기화를 명시적으로 수행하고 CI에서 검증할 수 있다, 다른 AI가 플랫폼 전용 메타데이터를 무시할 수 있다
- **rollback:** 지원하는 모든 플랫폼과 도구가 일관되게 처리할 수 있을 때 복사본을 심볼릭 링크로 대체한다.
- **supersedes:** -
- **requirements:** REQ-013

### ADR-012 — 구현 표면 기반 문서 동기화와 레거시 단계 전환

- **id:** ADR-012
- **title:** 구현 표면 기반 문서 동기화와 레거시 단계 전환
- **status:** accepted
- **date:** 2026-09-18
- **context:** 신규 기능의 분석·설계를 건너뛰거나 기존 소스만 변경하면 문서가 빠르게 낡지만, 문서가 전혀 없는 레거시 전체를 한 번에 문서화하도록 강제하는 것도 현실적이지 않다.
- **options:** 모든 변경에 전체 문서 선행 강제, 문서 현행화를 권고만 함, 변경 유형과 구현 표면별로 즉시 현행화 또는 기한 있는 후속 작업을 통제
- **decision:** 신규 기능은 요구분석·설계·최신 문서를 선행한다. 기존 기능은 문서가 있으면 같은 변경에서 갱신하고, 문서가 없을 때 고객이 후속 작성을 선택하면 표면·문서·기한이 있는 WRK로 추적한다. 레거시는 전체 표면 인벤토리와 기존 문서 출처를 먼저 기록해 단계적으로 전환한다.
- **consequences:** 화면 경로·API 등 실제 변경 단위와 문서 부채를 연결할 수 있다, 커밋 전 소스만 변경된 상태를 탐지한다, 레거시 고도화에는 초기 인벤토리 비용이 든다, 훅은 의미 정합성까지 자동 판단하지 않으므로 독립 문서 검토가 여전히 필요하다
- **rollback:** SURF와 LDP를 내보내 보존하고 pre-commit 차단을 경고로 낮추되 CHG별 문서 결정과 후속 WRK 추적은 유지한다.
- **supersedes:** -
- **requirements:** REQ-035

### ADR-011 — AGENTS.md를 공통 AI 수행 계약의 단일 정본으로 사용

- **id:** ADR-011
- **title:** AGENTS.md를 공통 AI 수행 계약의 단일 정본으로 사용
- **status:** accepted
- **date:** 2026-09-18
- **context:** 공통 계약을 .ai/core, AGENTS.md와 CLAUDE.md에 같은 내용으로 복제하고 sync-ai가 덮어쓰는 방식은 사람이 수정 위치와 플랫폼별 차이를 직관적으로 이해하기 어렵다.
- **options:** .ai/core에서 두 provider 파일을 계속 생성, AGENTS.md와 CLAUDE.md를 독립 관리, AGENTS.md를 정본으로 두고 CLAUDE.md가 import
- **decision:** AGENTS.md를 공통 AI 수행 계약의 단일 정본으로 삼고 CLAUDE.md는 @AGENTS.md import와 Claude Code 전용 연결만 유지한다. sync-ai는 공통 스킬 복사본만 갱신한다.
- **consequences:** 공통 규칙의 수정 위치가 저장소 루트에서 바로 보인다, CLAUDE.md의 중복이 사라진다, Claude Code의 import 구문에 의존하므로 검증기가 첫 import 줄을 검사한다, provider별 스킬과 훅은 기존처럼 별도 어댑터가 필요하다
- **rollback:** AGENTS.md 내용을 별도 공통 계약 파일로 옮기고 생성기를 복원하되 플랫폼별 전용 내용은 분리 유지한다.
- **supersedes:** -
- **requirements:** REQ-013

## 관련 테스트

### TC-003 — 공통 AI 계약 단일 정본과 Codex·Claude 스킬 동등성 검증

- **id:** TC-003
- **title:** 공통 AI 계약 단일 정본과 Codex·Claude 스킬 동등성 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-013
- **evidence:** EVD-003, EVD-027

### TC-004 — 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가

- **id:** TC-004
- **title:** 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가
- **type:** agent-eval
- **status:** not_run
- **required:** true
- **requirements:** REQ-004, REQ-005, REQ-026
- **evidence:** -

### TC-006 — 병합 커밋 기록·영향 평가·재검토 이력

- **id:** TC-006
- **title:** 병합 커밋 기록·영향 평가·재검토 이력
- **type:** integration
- **status:** passed
- **required:** true
- **requirements:** REQ-012, REQ-023
- **evidence:** EVD-011

### TC-014 — 병합 훅 인자와 GitHub CI 정의 검증

- **id:** TC-014
- **title:** 병합 훅 인자와 GitHub CI 정의 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-023
- **evidence:** EVD-010

### TC-017 — Codex·Claude 실제 교차 행동 평가

- **id:** TC-017
- **title:** Codex·Claude 실제 교차 행동 평가
- **type:** agent-eval
- **status:** not_run
- **required:** true
- **requirements:** REQ-026
- **evidence:** -

### TC-018 — AI 교차 평가 하네스와 공통 루브릭 검증

- **id:** TC-018
- **title:** AI 교차 평가 하네스와 공통 루브릭 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-026
- **evidence:** EVD-016

### TC-027 — 변경 유형별 분석·설계·문서 동기화와 레거시 전환 통제

- **id:** TC-027
- **title:** 변경 유형별 분석·설계·문서 동기화와 레거시 전환 통제
- **type:** scenario
- **status:** passed
- **required:** true
- **requirements:** REQ-035
- **evidence:** EVD-028
- **rule_mutation:**

```json
{
  "applicable": true,
  "rules": [
    "신규 기능의 분석·설계 또는 시스템 표면 누락을 거부한다",
    "기존 문서가 있는 표면의 후속 작성을 거부한다",
    "문서가 없는 표면의 마감 없는 후속 작업을 거부한다",
    "staged 제품 소스만 있는 커밋을 거부한다",
    "활성 인벤토리 계획 없는 레거시 고도화를 거부한다"
  ],
  "evidence": [
    "EVD-028"
  ]
}
```

## 가정

등록된 항목이 없습니다.

## 작업 상세

### WRK-006 — Codex·Claude 공통 행동 평가 하네스

- **id:** WRK-006
- **title:** Codex·Claude 공통 행동 평가 하네스
- **type:** contract
- **status:** completed
- **module:** MOD-AI
- **change:** CHG-006
- **requirements:** REQ-026
- **depends_on:** WRK-003
- **acceptance_criteria:** 두 플랫폼이 같은 픽스처와 루브릭으로 평가된다
- **evidence:** EVD-016

### WRK-007 — Codex·Claude 실제 교차 행동 평가

- **id:** WRK-007
- **title:** Codex·Claude 실제 교차 행동 평가
- **type:** contract
- **status:** todo
- **module:** MOD-AI
- **change:** CHG-006
- **requirements:** REQ-026
- **depends_on:** WRK-006
- **acceptance_criteria:** 모든 필수 시나리오에서 두 플랫폼이 기준 점수 이상을 얻는다, 중대 금지 행동이 없다
- **evidence:** -

## 기능 상세 명세서 공통 항목

### 기능 개요와 연결 제품 요구사항

AIDD Kit은 고객과 AI가 소프트웨어 제품의 의도부터 운영·개선까지 함께 관리하도록 돕는 재사용 가능한 개발·운영 키트다.

### 처리 흐름·업무 규칙·예외

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.

### 인수 기준과 금지되는 결과

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.
