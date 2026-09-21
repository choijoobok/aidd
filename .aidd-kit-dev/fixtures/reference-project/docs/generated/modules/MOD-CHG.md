<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# MOD-CHG — 변경과 유지보수

- 상태: in_progress
- 목적: 기존 시스템 동작을 기준선화하고 기능, 결함, 장애, 마이그레이션과 병합 영향을 관리한다.
- 의존 모듈: MOD-GOV, MOD-QA

## 요구사항

| 요구사항 | 제목 | 상태 | 검증 |
| --- | --- | --- | --- |
| REQ-006 | 가역적인 결정과 학습 | specified | TC-005 |
| REQ-010 | 기존 시스템과 유지보수 변경 | specified | TC-005 |
| REQ-012 | 병합 영향 이력 | specified | TC-006 |
| REQ-018 | 증거 기반 출시와 운영 | specified | TC-001 |
| REQ-023 | Git과 CI 품질 게이트 강제 | implemented | TC-006, TC-014 |
| REQ-027 | 기본 브랜치 보호와 필수 CI 검사 | specified | TC-019, TC-020 |
| REQ-035 | 변경 유형별 문서 동기화와 레거시 전환 | implemented | TC-027 |

## 작업 항목

| 작업 | 제목 | 상태 | 변경 | 요구사항 | 포괄 범위 | 선행 작업 | 증거 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WRK-002 | 병합 훅과 CI 검사 구현 | completed | CHG-005 | REQ-023 | - | WRK-001 | EVD-010, EVD-011 |
| WRK-008 | GitHub 브랜치 보호 기준 구성 | completed | CHG-006 | REQ-027 | - | WRK-002 | EVD-017 |
| WRK-009 | GitHub 브랜치 보호 원격 활성화 검증 | blocked | CHG-006 | REQ-027 | - | WRK-008 | EVD-018 |

## 인터페이스

| ID | 이름 | 상태 | 제공 | 소비 | 호환성 |
| --- | --- | --- | --- | --- | --- |
| IFC-003 | CI-브랜치 보호 계약 | current | MOD-QA | MOD-CHG | 작업 이름 변경 시 repository.json과 ruleset을 함께 변경한다. |

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
| ADR-005 | accepted | 변경 등급에 따라 엄격성 조정 |
| ADR-012 | accepted | 구현 표면 기반 문서 동기화와 레거시 단계 전환 |

## 관련 테스트

| ID | 상태 | 제목 |
| --- | --- | --- |
| TC-001 | passed | 정본 그래프와 상태 뷰 검증 |
| TC-005 | passed | 결정 대체와 기존 시스템 변경 정본 전이 시나리오 |
| TC-006 | passed | 병합 커밋 기록·영향 평가·재검토 이력 |
| TC-014 | passed | 병합 훅 인자와 GitHub CI 정의 검증 |
| TC-019 | passed | GitHub 브랜치 보호 구성과 CI 이름 정합성 |
| TC-020 | failed | GitHub 브랜치 보호 원격 활성화 검증 |
| TC-027 | passed | 변경 유형별 분석·설계·문서 동기화와 레거시 전환 통제 |

## UI 정본

- 화면: 0개
- 매뉴얼: 0개

## 모듈 정본

### MOD-CHG — 변경과 유지보수

- **id:** MOD-CHG
- **name:** 변경과 유지보수
- **purpose:** 기존 시스템 동작을 기준선화하고 기능, 결함, 장애, 마이그레이션과 병합 영향을 관리한다.
- **status:** in_progress
- **dependencies:** MOD-GOV, MOD-QA
- **requirements:** REQ-006, REQ-010, REQ-012, REQ-018, REQ-023, REQ-027, REQ-035

## 요구사항 상세

### REQ-006 — 가역적인 결정과 학습

- **id:** REQ-006
- **title:** 가역적인 결정과 학습
- **statement:** 프레임워크는 실수를 맥락 손실 없이 되돌릴 수 있도록 의사결정 이력, 롤백 경로, 대체 관계와 교훈을 보존해야 한다.
- **rationale:** 안전한 실험에는 되돌리기와 조직 기억이 필요하다.
- **priority:** must
- **status:** specified
- **modules:** MOD-GOV, MOD-CHG
- **verification:** TC-005
- **acceptance_criteria:** 승인된 결정에 결과와 롤백 지침이 있다, 대체된 레코드를 보존한다
- **source:** USER-2026-09-17

### REQ-010 — 기존 시스템과 유지보수 변경

- **id:** REQ-010
- **title:** 기존 시스템과 유지보수 변경
- **statement:** 프레임워크는 현재 기준선, 영향, 마이그레이션, 롤백과 회귀 추적을 포함해 기존 시스템의 모듈 추가·기능 변경·결함 수정을 지원해야 한다.
- **rationale:** 초기 출시 후에도 생애주기가 계속되어야 한다.
- **priority:** must
- **status:** specified
- **modules:** MOD-CHG, MOD-ARCH, MOD-QA
- **verification:** TC-005
- **acceptance_criteria:** 모든 변경이 유형과 영향 산출물을 선언한다, 기존 시스템 충돌을 불일치로 기록한다
- **source:** USER-2026-09-17

### REQ-012 — 병합 영향 이력

- **id:** REQ-012
- **title:** 병합 영향 이력
- **statement:** 프레임워크는 Git 병합 맥락, 변경 파일, 영향 모듈, 충돌 해결 기록과 추가 회귀 테스트 결정을 기록하고, 필요한 병합 후 재검토·재테스트의 완료 이력을 추적해야 한다.
- **rationale:** 기계적으로 성공한 팀 병합도 기존 가정을 무효화할 수 있다.
- **priority:** must
- **status:** specified
- **modules:** MOD-CHG, MOD-QA
- **verification:** TC-006
- **acceptance_criteria:** 병합 커밋에서 영향 레코드를 생성할 수 있다, 평가하지 않은 병합과 대기 중인 병합 후 재검토가 세션 브리핑에 표시된다, 재검토 완료 시 실제 수행자·시각·결과·증거를 기록하고 필수 미완료 항목은 릴리스를 차단한다
- **source:** USER-2026-09-17

### REQ-018 — 증거 기반 출시와 운영

- **id:** REQ-018
- **title:** 증거 기반 출시와 운영
- **statement:** 프레임워크는 연결된 테스트, 보안, 마이그레이션, 롤백, 문서와 운영 증거로 릴리스 준비도를 판단하고 장애·사용 학습을 변경 레코드로 환류해야 한다.
- **rationale:** 완료 주장은 증거가 있어야 하며 출시 후에도 생애주기가 학습해야 한다.
- **priority:** must
- **status:** specified
- **modules:** MOD-QA, MOD-DELIVERY, MOD-CHG
- **verification:** TC-001
- **acceptance_criteria:** 릴리스 준비도가 차단사항을 식별한다, 운영 학습으로 추적 가능한 변경을 만들 수 있다
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

### REQ-027 — 기본 브랜치 보호와 필수 CI 검사

- **id:** REQ-027
- **title:** 기본 브랜치 보호와 필수 CI 검사
- **statement:** 프레임워크는 main 브랜치의 Pull Request, 승인, 필수 AIDD 검사와 강제 푸시 방지 규칙을 버전 관리하고 원격 활성화 상태를 검증해야 한다.
- **rationale:** 워크플로 파일만 존재하고 필수 검사로 연결되지 않으면 팀원이 검증을 우회할 수 있다.
- **priority:** must
- **status:** specified
- **modules:** MOD-CHG, MOD-QA
- **verification:** TC-019, TC-020
- **acceptance_criteria:** 보호 규칙의 필수 검사 이름이 CI 작업 이름과 일치한다, main 직접 삭제·강제 푸시와 필수 검사 없는 병합을 차단한다, 원격 조회 증거 없이 활성화 완료를 선언하지 않는다
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

### ADR-005 — 변경 등급에 따라 엄격성 조정

- **id:** ADR-005
- **title:** 변경 등급에 따라 엄격성 조정
- **status:** accepted
- **date:** 2026-09-17
- **context:** 일률적인 절차는 작은 수정에 너무 무겁거나 위험한 변경에 너무 약하다.
- **options:** 모든 변경에 전체 절차 적용, 정책 없이 AI 판단에 위임, 최소 증거가 정의된 네 개의 위험 등급 사용
- **decision:** 영향 범위, 불확실성, 민감도와 가역성에 따라 C0~C3 변경 등급을 사용한다.
- **consequences:** 작은 작업은 빠르게 유지된다, 고위험 작업은 강한 게이트를 거친다, 분류 자체도 감사 가능하다
- **rollback:** 전달 지표와 장애를 검토한 뒤 대체 결정으로 등급 기준과 게이트를 조정한다.
- **supersedes:** -
- **requirements:** REQ-017, REQ-018

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

## 관련 테스트

### TC-001 — 정본 그래프와 상태 뷰 검증

- **id:** TC-001
- **title:** 정본 그래프와 상태 뷰 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-001, REQ-003, REQ-007, REQ-008, REQ-009, REQ-014, REQ-016, REQ-017, REQ-018
- **evidence:** EVD-001

### TC-005 — 결정 대체와 기존 시스템 변경 정본 전이 시나리오

- **id:** TC-005
- **title:** 결정 대체와 기존 시스템 변경 정본 전이 시나리오
- **type:** scenario
- **status:** passed
- **required:** true
- **requirements:** REQ-006, REQ-010
- **evidence:** EVD-013

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

### TC-019 — GitHub 브랜치 보호 구성과 CI 이름 정합성

- **id:** TC-019
- **title:** GitHub 브랜치 보호 구성과 CI 이름 정합성
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-027
- **evidence:** EVD-017

### TC-020 — GitHub 브랜치 보호 원격 활성화 검증

- **id:** TC-020
- **title:** GitHub 브랜치 보호 원격 활성화 검증
- **type:** integration
- **status:** failed
- **required:** true
- **requirements:** REQ-027
- **evidence:** EVD-018

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

### WRK-002 — 병합 훅과 CI 검사 구현

- **id:** WRK-002
- **title:** 병합 훅과 CI 검사 구현
- **type:** workflow
- **status:** completed
- **module:** MOD-CHG
- **change:** CHG-005
- **requirements:** REQ-023
- **depends_on:** WRK-001
- **acceptance_criteria:** 실제 병합 커밋을 기록하고 CI가 결정적 검사를 실행한다
- **evidence:** EVD-010, EVD-011

### WRK-008 — GitHub 브랜치 보호 기준 구성

- **id:** WRK-008
- **title:** GitHub 브랜치 보호 기준 구성
- **type:** governance
- **status:** completed
- **module:** MOD-CHG
- **change:** CHG-006
- **requirements:** REQ-027
- **depends_on:** WRK-002
- **acceptance_criteria:** 기본 브랜치의 PR·필수 CI 규칙이 버전 관리된다
- **evidence:** EVD-017

### WRK-009 — GitHub 브랜치 보호 원격 활성화 검증

- **id:** WRK-009
- **title:** GitHub 브랜치 보호 원격 활성화 검증
- **type:** workflow
- **status:** blocked
- **module:** MOD-CHG
- **change:** CHG-006
- **requirements:** REQ-027
- **depends_on:** WRK-008
- **acceptance_criteria:** 원격 main 규칙이 필수 CI를 강제한다
- **evidence:** EVD-018

## 기능 상세 명세서 공통 항목

### 기능 개요와 연결 제품 요구사항

AIDD Kit은 고객과 AI가 소프트웨어 제품의 의도부터 운영·개선까지 함께 관리하도록 돕는 재사용 가능한 개발·운영 키트다.

### 처리 흐름·업무 규칙·예외

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.

### 인수 기준과 금지되는 결과

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.
