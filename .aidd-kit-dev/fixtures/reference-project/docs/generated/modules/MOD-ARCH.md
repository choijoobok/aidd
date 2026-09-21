<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# MOD-ARCH — 아키텍처와 사용자 경험

- 상태: planned
- 목적: 배포·운영 조건과 품질 속성에 맞는 기술 스택을 선정하고 모듈, 애플리케이션, 데이터, 데이터베이스, 보안, 인프라와 UI 기반을 정의한다.
- 의존 모듈: MOD-GOV, MOD-DISC

## 요구사항

| 요구사항 | 제목 | 상태 | 검증 |
| --- | --- | --- | --- |
| REQ-009 | 모듈 단위 수행 | specified | TC-001 |
| REQ-010 | 기존 시스템과 유지보수 변경 | specified | TC-005 |
| REQ-011 | UI와 개발 표준 우선 | specified | TC-007, TC-008 |
| REQ-014 | 다분야 역할 관점 | specified | TC-001 |
| REQ-016 | 설계 단계의 보안·데이터·인프라·운영 | specified | TC-001 |
| REQ-019 | 상황 적응형 방법론 근거 | implemented | TC-009 |
| REQ-020 | 배포·운영 환경의 조기 확인 | implemented | TC-010 |
| REQ-021 | 동시성·트랜잭션·성능 위험의 설계 예방 | implemented | TC-011 |
| REQ-031 | 프로젝트별 개발 기반 정본 | implemented | TC-024 |
| REQ-032 | 모듈별 UI·공통 컴포넌트 정본 | implemented | TC-025 |

## 작업 항목

| 작업 | 제목 | 상태 | 변경 | 요구사항 | 포괄 범위 | 선행 작업 | 증거 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WRK-012 | 개발 기반·UI·운영·제출 정본과 생성 계약 | doing | CHG-011 | REQ-011, REQ-015, REQ-025, REQ-031, REQ-032, REQ-033 | design, implementation, test, documentation, migration, operations, training | WRK-003, WRK-005 | EVD-023, EVD-024 |

## 인터페이스

| ID | 이름 | 상태 | 제공 | 소비 | 호환성 |
| --- | --- | --- | --- | --- | --- |
| IFC-002 | 공통 AI 스킬-플랫폼 어댑터 계약 | current | MOD-AI | MOD-DISC, MOD-ARCH, MOD-DELIVERY, MOD-QA, MOD-STATUS | 플랫폼 전용 지침과 훅은 얇게 유지하고 공통 수행 규칙은 AGENTS.md, 공통 스킬 의미는 .ai/skills에 둔다. |
| IFC-004 | 개발 기반 정본-파생 산출물 계약 | current | MOD-ARCH | MOD-DOC, MOD-DELIVERY, MOD-QA | 필드나 상태 전이를 바꾸면 로더·검증기·생성기·산출물 카탈로그와 TC-024·TC-025를 같은 변경에서 갱신한다. |

## 모듈 의존성

| ID | 출발 | 도착 | 상태 | 설명 |
| --- | --- | --- | --- | --- |

## 관련 변경

| ID | 등급 | 상태 | 제목 |
| --- | --- | --- | --- |
| CHG-002 | C2 | in_progress | 기술 스택 게이트와 방법론 분석 보강 |
| CHG-003 | C2 | in_progress | 배포 환경과 설계 위험 예방 게이트 보강 |
| CHG-010 | C2 | in_progress | 모듈별 정본 분할과 확장 가능한 명세 |
| CHG-011 | C2 | in_progress | 프로젝트 개발 기반·UI·운영·제출 정본 체계 |

## 관련 결정

| ID | 상태 | 제목 |
| --- | --- | --- |
| ADR-004 | accepted | 역할을 증거 생성 관점으로 취급 |
| ADR-006 | accepted | 기술 스택과 개발 기반을 기능 개발 전에 게이트로 확정 |
| ADR-007 | accepted | 단일 방법론 대신 상황 적응형 혼합 통제 사용 |
| ADR-008 | accepted | 기술 선택 전에 배포·운영 맥락을 게이트로 확인 |
| ADR-009 | accepted | 모듈별 요구사항 조각과 생성 명세 사용 |
| ADR-010 | accepted | 개발 기반 정본과 모듈별 UI 조각을 분리해 생성 |

## 관련 테스트

| ID | 상태 | 제목 |
| --- | --- | --- |
| TC-001 | passed | 정본 그래프와 상태 뷰 검증 |
| TC-005 | passed | 결정 대체와 기존 시스템 변경 정본 전이 시나리오 |
| TC-007 | passed | 기능 구현 전 기반 준비도 강제 |
| TC-008 | passed | 기술 스택·개발 기반 게이트 구조 검증 |
| TC-009 | passed | 방법론 비교와 AIDD 통제 연결 검증 |
| TC-010 | passed | 배포·운영 맥락 게이트와 프로필 구조 검증 |
| TC-011 | passed | 동시성·트랜잭션·성능 위험 카탈로그 검증 |
| TC-024 | passed | 개발 표준·골든 패스·예외·런북·제출 프로필 정본 검증 |
| TC-025 | passed | 모듈별 UI 정본과 결정적 화면·매뉴얼 생성 |

## UI 정본

- 화면: 0개
- 매뉴얼: 0개

## 모듈 정본

### MOD-ARCH — 아키텍처와 사용자 경험

- **id:** MOD-ARCH
- **name:** 아키텍처와 사용자 경험
- **purpose:** 배포·운영 조건과 품질 속성에 맞는 기술 스택을 선정하고 모듈, 애플리케이션, 데이터, 데이터베이스, 보안, 인프라와 UI 기반을 정의한다.
- **status:** planned
- **dependencies:** MOD-GOV, MOD-DISC
- **requirements:** REQ-009, REQ-010, REQ-011, REQ-014, REQ-016, REQ-019, REQ-020, REQ-021, REQ-031, REQ-032

## 요구사항 상세

### REQ-009 — 모듈 단위 수행

- **id:** REQ-009
- **title:** 모듈 단위 수행
- **statement:** 프레임워크는 공통 인터페이스와 릴리스 의존성을 보존하면서 모듈을 독립적으로 계획·개발·추적하고, 모듈별 정본 조각과 생성 명세로 분석할 수 있어야 한다.
- **rationale:** 대규모 시스템은 전체 일관성을 잃지 않으면서 병렬 진행할 수 있어야 한다.
- **priority:** must
- **status:** specified
- **modules:** MOD-ARCH, MOD-STATUS
- **verification:** TC-001
- **acceptance_criteria:** 각 모듈에 범위, 상태, 의존성과 요구사항 링크가 있다, 상태를 단일 모듈로 좁힐 수 있다, 요구사항은 하나의 모듈 정본 조각에만 저장되고 다중 모듈 영향은 ID 링크로 유지된다, 신규 모듈은 기존 모듈의 요구사항을 다시 쓰지 않고 카탈로그·빈 정본 조각·생성 명세를 추가할 수 있다
- **source:** USER-2026-09-17; USER-2026-09-18

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

### REQ-011 — UI와 개발 표준 우선

- **id:** REQ-011
- **title:** UI와 개발 표준 우선
- **statement:** 제품 개발에서는 성과·요구사항·품질 속성과 제약을 근거로 기술 스택을 먼저 선정하고, 기능 규모 구현 전에 AI가 UI 레이아웃·상호작용 패턴, 공통 컴포넌트, 아키텍처 규칙, 코딩 표준과 개발 지침을 확정해야 한다.
- **rationale:** 공통 기반은 분산된 AI·사람 작업의 일관성을 보장한다.
- **priority:** must
- **status:** specified
- **modules:** MOD-ARCH, MOD-DELIVERY
- **verification:** TC-007, TC-008
- **acceptance_criteria:** 기술 선택 전에 품질 속성과 제약이 정의된다, 현행 유지안을 포함한 대안 비교와 ADR을 거쳐 기술 기준선을 결정한다, 기능 개발 게이트에 UI·개발 기반 준비도가 포함된다, 예외에는 기록된 결정이 필요하다
- **source:** USER-2026-09-17

### REQ-014 — 다분야 역할 관점

- **id:** REQ-014
- **title:** 다분야 역할 관점
- **statement:** 프레임워크는 관련될 때 제품, 분석, 아키텍처, 개발, QA, 감리, 보안, 인프라, 데이터, 데이터베이스, DevOps, 운영과 접근성 관점을 적용해야 한다.
- **rationale:** 생애주기 전체 품질에는 소스 코드 밖의 관점이 필요하다.
- **priority:** must
- **status:** specified
- **modules:** MOD-GOV, MOD-ARCH, MOD-QA, MOD-DELIVERY
- **verification:** TC-001
- **acceptance_criteria:** 아키텍처가 모든 필수 관점을 정의한다, 게이트가 증거 담당을 명시한다
- **source:** USER-2026-09-17

### REQ-016 — 설계 단계의 보안·데이터·인프라·운영

- **id:** REQ-016
- **title:** 설계 단계의 보안·데이터·인프라·운영
- **statement:** 프레임워크는 설계와 검증에서 위협, 개인정보, 데이터 소유권, 마이그레이션, 복구, 인프라, 관측성, 배포와 운영 준비도를 다뤄야 한다.
- **rationale:** 비기능 위험을 출시 직전까지 미루면 비용이 크게 증가한다.
- **priority:** must
- **status:** specified
- **modules:** MOD-ARCH, MOD-QA, MOD-DELIVERY
- **verification:** TC-001
- **acceptance_criteria:** 관련 관점을 명시적으로 승인하거나 적용 대상 아님으로 기록한다, 치명적 잔여 위험에는 고객 수용이 필요하다
- **source:** USER-2026-09-17

### REQ-019 — 상황 적응형 방법론 근거

- **id:** REQ-019
- **title:** 상황 적응형 방법론 근거
- **statement:** 프레임워크는 전통적·적응형·운영·AI 주도 개발 방법론의 장점과 한계를 비교하고 프로젝트의 불확실성, 규제, 위험, 변경 비용과 운영 특성에 맞춰 적용할 통제를 선택해야 한다.
- **rationale:** 하나의 방법론을 일률적으로 적용하면 작은 변경에는 과도하고 고위험 변경에는 부족할 수 있다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-GOV, MOD-DISC, MOD-ARCH
- **verification:** TC-009
- **acceptance_criteria:** 전통적 방법론과 AI 주도 방법론을 동일한 기준으로 비교한다, 채택한 통제가 AIDD 단계·게이트·정본 증거에 연결된다, 프로젝트 특성에 따른 예측형·적응형·혼합형 수행 경로 선택 규칙이 있다
- **source:** USER-2026-09-17

### REQ-020 — 배포·운영 환경의 조기 확인

- **id:** REQ-020
- **title:** 배포·운영 환경의 조기 확인
- **statement:** AI는 기술 스택과 상세 설계를 확정하기 전에 고객에게 배포 위치, 실행 플랫폼, DBMS 제약, 단일·다중 인스턴스, 자동 확장, 워크로드, 가용성·복구, 상태 관리, 보안과 운영 책임을 확인해야 한다.
- **rationale:** 배포 토폴로지와 운영 제약을 늦게 발견하면 상태·동시성·데이터·복구 설계를 광범위하게 다시 해야 한다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-DISC, MOD-ARCH, MOD-STATUS
- **verification:** TC-010
- **acceptance_criteria:** DG-001이 TG-001보다 먼저 수행된다, 설계를 바꾸는 환경 범주와 미결 결정이 배포 프로필에 기록된다, 미정 사항에는 결정 조건·영향이 있으며 중대한 항목은 차단된다
- **source:** USER-2026-09-18

### REQ-021 — 동시성·트랜잭션·성능 위험의 설계 예방

- **id:** REQ-021
- **title:** 동시성·트랜잭션·성능 위험의 설계 예방
- **statement:** AI는 설계 단계부터 트랜잭션 경계, 프록시 AOP, 스레드 전환, 다중 인스턴스 경쟁, 재시도·중복, 스케줄 작업, 자원 병목과 장애 전파 위험을 식별하고 통제와 검증 시나리오를 정의해야 한다.
- **rationale:** 단일 스레드 기능 테스트만으로는 운영 환경의 데이터 손상, 중복 처리, 교착, 풀 고갈과 연쇄 장애를 예방할 수 없다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-ARCH, MOD-QA, MOD-DELIVERY
- **verification:** TC-011
- **acceptance_criteria:** 핵심 업무에 측정 가능한 동시성 불변 조건이 있다, 적용되는 위험 패턴마다 설계 통제와 부정·경쟁·부하·장애 검증이 연결된다, 로컬 락이나 스레드 컨텍스트를 다중 인스턴스 보장으로 오인하지 않는다
- **source:** USER-2026-09-18

### REQ-031 — 프로젝트별 개발 기반 정본

- **id:** REQ-031
- **title:** 프로젝트별 개발 기반 정본
- **statement:** 프레임워크는 기술 스택과 분리된 메타 구조로 개발 표준, 골든 패스와 기한 있는 예외를 관리하고 프로젝트가 선택한 기술 기준선에 맞는 규칙과 실행 검증을 연결해야 한다.
- **rationale:** 기술 규칙을 템플릿에 고정하지 않으면서도 어느 AI와 개발자가 참여해도 동일한 품질 기준을 적용해야 한다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-ARCH, MOD-DOC, MOD-DELIVERY, MOD-QA
- **verification:** TC-024
- **acceptance_criteria:** STD, GPH, EXC 레코드가 안정 ID와 기술 기준선, 모듈, 요구사항, 검증을 연결한다, 계약형과 정책형 표준을 구분하고 기술 스택 구체 규칙은 프로젝트 기준선에서 작성한다, 예외는 결정 주체·이유, 만료일과 보완 통제 없이는 유효하지 않다
- **source:** USER-2026-09-18

### REQ-032 — 모듈별 UI·공통 컴포넌트 정본

- **id:** REQ-032
- **title:** 모듈별 UI·공통 컴포넌트 정본
- **statement:** 프레임워크는 UI 기준선, 패턴, 공통 컴포넌트와 모듈별 화면·매뉴얼을 구조화된 정본으로 관리하고 화면 정의서와 검토용 목업을 결정적으로 생성해야 한다.
- **rationale:** 사용자와 합의한 UI 품질을 모듈과 AI 도구에 걸쳐 재사용하고 운영 중 새 모듈에도 적용해야 한다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-ARCH, MOD-DOC, MOD-DELIVERY, MOD-QA
- **verification:** TC-025
- **acceptance_criteria:** UXB, UIP, CMP, SCR, MAN 참조와 상태 전이가 검증된다, UI가 없는 모듈은 UI 조각 없이 정상이고 필요할 때 빈 조각을 초기화할 수 있다, 목업은 실제 화면 증거와 구분되고 출시용 매뉴얼은 검증 증거를 요구한다
- **source:** USER-2026-09-18

## 관련 변경

### CHG-002 — 기술 스택 게이트와 방법론 분석 보강

- **id:** CHG-002
- **title:** 기술 스택 게이트와 방법론 분석 보강
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-DISC, MOD-ARCH, MOD-DOC, MOD-DELIVERY, MOD-QA
- **requirements:** REQ-011, REQ-016, REQ-017, REQ-019
- **required_gates:** TG-001, TG-002
- **required_work_coverage:** design, implementation, test, documentation, security, migration
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
- **impact:** 기술 선택과 개발 기반 준비를 명시적인 연속 게이트로 만들고 전통적·적응형·운영·AI 주도 방법론을 구조화해 AIDD 단계와 증거에 연결한다.
- **migration:** 기존 프로젝트는 현재 기술을 TSB 기준선으로 등록하고 다음 기능 규모 변경에서 TG-001·TG-002를 평가한다.
- **rollback:** technology.json과 methodologies.json, 연결된 생성기·검증·문서를 제거하고 ADR-006·ADR-007을 대체 결정으로 폐기한다.
- **regression_scope:** 정본 참조 검증, 기술 게이트 생성 문서, 방법론 비교 생성 문서, 스킬 동기화, 상태와 릴리스 준비도

### CHG-003 — 배포 환경과 설계 위험 예방 게이트 보강

- **id:** CHG-003
- **title:** 배포 환경과 설계 위험 예방 게이트 보강
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-DISC, MOD-ARCH, MOD-DOC, MOD-STATUS, MOD-QA, MOD-DELIVERY
- **requirements:** REQ-016, REQ-018, REQ-020, REQ-021
- **required_gates:** DG-001, TG-002
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
- **impact:** 기획·요구분석에서 배포·DBMS·인스턴스·확장·SLO·복구 조건을 확인하고 설계에서 트랜잭션·AOP·스레드·분산 경쟁·성능·장애 위험을 통제·검증한다.
- **migration:** 기존 프로젝트는 현재 환경을 DEP 프로필로 기준선화하고 다음 중대한 변경 전에 DG-001과 적용되는 DPR 위험 패턴을 평가한다.
- **rollback:** deployment.json과 연결된 생성기·검증·스킬 보강을 제거하고 ADR-008을 대체 결정으로 폐기한다.
- **regression_scope:** 정본 참조 검증, 배포·운영 생성 문서, DG-001·TG-001·TG-002 순서, 위험 패턴 범위, 스킬 동기화, 상태와 릴리스 준비도

### CHG-010 — 모듈별 정본 분할과 확장 가능한 명세

- **id:** CHG-010
- **title:** 모듈별 정본 분할과 확장 가능한 명세
- **type:** refactoring
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-ARCH, MOD-DOC, MOD-STATUS, MOD-QA
- **requirements:** REQ-001, REQ-002, REQ-003, REQ-009, REQ-024
- **required_gates:** TG-002
- **required_work_coverage:** design, implementation, test, documentation, migration
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
- **impact:** 요구사항 정본을 모듈 조각으로 이관하고, 모듈별 생성 명세·상태 갱신·신규 모듈 추가와 조각 무결성 검증을 제공한다.
- **migration:** 기존 requirements.json의 각 요구사항을 기존 modules 배열의 첫 모듈 조각으로 한 번만 이관한다. 다중 모듈 링크와 모든 안정적인 ID는 유지한다.
- **rollback:** 안정적인 ID와 모듈 링크를 유지하면서 조각 요구사항을 전역 requirements.json으로 병합하고, 모듈별 생성 명세와 전용 명령을 제거한다.
- **regression_scope:** 정본 로딩, 요구사항·모듈 양방향 링크, 전체·모듈별 문서 생성, 생성 문서 드리프트, 신규 모듈 추가, 모듈별 상태, CLI 호환성

### CHG-011 — 프로젝트 개발 기반·UI·운영·제출 정본 체계

- **id:** CHG-011
- **title:** 프로젝트 개발 기반·UI·운영·제출 정본 체계
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-ARCH, MOD-DOC, MOD-DELIVERY, MOD-QA, MOD-STATUS
- **requirements:** REQ-011, REQ-015, REQ-025, REQ-031, REQ-032, REQ-033
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
  "reason": "AIDD Kit 자체 거버넌스 변경"
}
```
- **impact:** 기술 스택에 종속되지 않는 개발 표준·골든 패스·예외, UI 기준선·패턴·공통 컴포넌트·모듈별 화면과 매뉴얼, 운영 런북과 제출 프로필을 구조화하고 결정적 생성 뷰와 검증을 제공한다.
- **migration:** 기존 guides와 deliverables는 유지하고 새 정본 유형을 병행 도입한다. UI가 없는 기존 모듈은 조각을 만들지 않으며 새 UI가 필요할 때만 init-module-ui를 실행한다.
- **rollback:** 새 정본 파일과 생성 뷰를 내보내 보존한 뒤 FILES 등록·검증·생성 확장을 제거한다. 기존 요구사항·가이드·모듈 구조는 그대로 유지한다.
- **regression_scope:** 정본 로딩과 안정 ID, 모듈별 UI 조각, 표준·패턴·컴포넌트·테스트·승인 참조, 생성 문서 드리프트, 상태 요약, 산출물 카탈로그, 신규 모듈 추가
- **options:**

```json
[
  {
    "id": "now",
    "label": "지금 수용",
    "selected": true,
    "reason": "기능 개발 전에 개발 기반과 파생 산출물 계약을 먼저 확정해야 한다."
  },
  {
    "id": "later",
    "label": "후속 수용",
    "selected": false,
    "reason": "실제 프로젝트 착수 시 한꺼번에 도입하면 구현 편차와 마이그레이션 비용이 커진다."
  },
  {
    "id": "not_now",
    "label": "수용하지 않음",
    "selected": false,
    "reason": "동일 품질의 다중 AI 개발이라는 고객 목표를 충족하지 못한다."
  }
]
```
- **scope_delta:**

```json
{
  "requirements": 3,
  "standards": 2,
  "ui_baselines": 1,
  "runbooks": 1,
  "delivery_profiles": 2
}
```

## 관련 결정

### ADR-004 — 역할을 증거 생성 관점으로 취급

- **id:** ADR-004
- **title:** 역할을 증거 생성 관점으로 취급
- **status:** accepted
- **date:** 2026-09-17
- **context:** 독립된 AI 역할은 중복되거나 모순되는 문서를 만들 수 있다.
- **options:** 직무마다 분리된 에이전트 사용, 구분 없는 범용 에이전트 사용, 공유 정본에 조합 가능한 역할 관점 적용
- **decision:** 관련 역할 관점을 공유 변경에 적용하고 역할별 정본 대신 명시된 증거를 요구한다.
- **consequences:** 여러 분야의 고려사항이 명시적으로 남는다, 하나의 AI가 여러 관점을 다룰 수 있다, 고위험 작업에는 여전히 독립 검토를 요구할 수 있다
- **rollback:** 같은 정본을 유지하면서 선택한 품질 게이트에 독립 에이전트를 도입한다.
- **supersedes:** -
- **requirements:** REQ-014, REQ-017

### ADR-006 — 기술 스택과 개발 기반을 기능 개발 전에 게이트로 확정

- **id:** ADR-006
- **title:** 기술 스택과 개발 기반을 기능 개발 전에 게이트로 확정
- **status:** accepted
- **date:** 2026-09-18
- **context:** 기술 선택, UI·개발 표준과 공통 컴포넌트가 기능 개발과 동시에 임의로 결정되면 AI와 사람의 구현이 분산되고 되돌림 비용이 커진다.
- **options:** 팀별 자율 선택 후 사후 통합, 기술 스택만 선결하고 기반 표준은 기능과 함께 개발, 품질 속성 기반 기술 스택 게이트와 개발 기반 준비도 게이트를 순서대로 적용
- **decision:** 분석·설계에서 품질 속성과 제약을 확정한 뒤 TG-001로 기술 기준선을 결정하고, TG-002로 UI·아키텍처·보안·테스트·관측성·배포 공통 기반을 검증한 후 기능 증분을 개발한다.
- **consequences:** 분산 개발의 일관성과 재사용성이 높아진다, 초기 기반 작업과 증거 비용이 추가된다, UI가 없는 프로젝트는 UI 증거를 적용 대상 아님으로 기록할 수 있다, 현행 기준선 변경은 명시적인 재평가가 필요하다
- **rollback:** 게이트가 과도하면 C0~C1 변경의 증거를 축소하는 대체 결정을 작성하되 기술 기준선·보안·테스트·롤백 확인은 유지한다.
- **supersedes:** -
- **requirements:** REQ-011, REQ-016, REQ-017

### ADR-007 — 단일 방법론 대신 상황 적응형 혼합 통제 사용

- **id:** ADR-007
- **title:** 단일 방법론 대신 상황 적응형 혼합 통제 사용
- **status:** accepted
- **date:** 2026-09-18
- **context:** 예측형, 애자일, 시스템공학, DevSecOps, SRE와 AI 주도 방법론은 서로 다른 문제에 강하며 어느 하나도 전체 생애주기의 모든 위험을 충분히 다루지 않는다.
- **options:** 하나의 표준 방법론을 모든 프로젝트에 적용, 프로젝트마다 통제 없이 자유롭게 선택, 정본·추적성·증거 규칙은 고정하고 상황에 맞는 방법론 통제를 조합
- **decision:** 요구 안정성, 불확실성, 규제·안전, 변경 비용, 전달 주기와 운영 책임을 기준으로 방법론 통제를 조합하고 선택 근거를 정본에 기록한다.
- **consequences:** 프로젝트 맥락에 맞는 절차를 선택할 수 있다, 테일러링 근거를 설명하고 검토해야 한다, AIDD 공통 정본·추적성·고객 결정·증거 게이트는 면제되지 않는다
- **rollback:** 반복 지표에서 혼합 경로가 일관성을 해치면 특정 프로젝트 유형에 표준 프로필을 정의하는 대체 결정을 작성한다.
- **supersedes:** -
- **requirements:** REQ-017, REQ-019

### ADR-008 — 기술 선택 전에 배포·운영 맥락을 게이트로 확인

- **id:** ADR-008
- **title:** 기술 선택 전에 배포·운영 맥락을 게이트로 확인
- **status:** accepted
- **date:** 2026-09-18
- **context:** DBMS, 인스턴스 토폴로지, 자동 확장, 상태·세션, 가용성·복구와 운영 제약을 늦게 발견하면 단일 서버 가정과 로컬 동기화가 설계에 고착되고 광범위한 재작업이 발생한다.
- **options:** 기술 스택을 기획 초기에 바로 고정, 상세 설계 때 배포 환경을 확인, 기획·요구분석에서 환경 범주와 품질 제약을 확인하고 TG-001에서 구체 기술을 선택
- **decision:** DG-001에서 설계를 바꾸는 배포·운영 조건과 미결사항을 먼저 확정하고, 측정 가능한 품질·동시성 불변 조건을 만든 뒤 TG-001에서 기술 스택과 인프라를 선택한다.
- **consequences:** 성급한 제품명 고정을 피하면서 구조적 재작업 위험을 줄인다, 고객은 초기 단계에 운영·인프라 질문에 참여해야 한다, 세부 용량 값은 가정과 재평가 조건을 두고 늦출 수 있다, TG-002는 다중 스레드·다중 인스턴스·부하·장애 검증 증거를 요구한다
- **rollback:** 저위험 단일 사용자 도구에서는 적용 대상 아님 근거와 재평가 조건을 기록해 질문 깊이를 줄이되 환경 프로필 자체는 유지한다.
- **supersedes:** -
- **requirements:** REQ-020, REQ-021

### ADR-009 — 모듈별 요구사항 조각과 생성 명세 사용

- **id:** ADR-009
- **title:** 모듈별 요구사항 조각과 생성 명세 사용
- **status:** accepted
- **date:** 2026-09-18
- **context:** 단일 요구사항 파일과 전체 생성 문서가 커지면 특정 모듈의 상태와 명세를 분석하기 위해 관련 없는 내용을 함께 읽어야 한다.
- **options:** 전역 요구사항 파일과 전체 문서만 유지, 모듈마다 전체 요구사항을 복제, 요구사항을 모듈 정본 조각에 한 번 저장하고 모듈별 뷰를 생성
- **decision:** 사용자 요청에 따라 모듈 카탈로그는 전역 인덱스로 유지하고, 각 요구사항은 하나의 `project/.aidd/ssot/modules/MOD-ID.json` 조각에 저장한다. 다중 모듈 영향은 복제 대신 ID 링크로 표현하고, 모듈별 생성 명세를 제공한다.
- **consequences:** 모듈별 분석은 작은 정본 조각 또는 생성 명세로 제한할 수 있다, 교차 모듈 요구사항도 한 번만 수정한다, 새 모듈은 카탈로그와 빈 조각을 추가한 뒤 독립 상태로 진행할 수 있다, 로더와 검증기는 조각 파일명·소속·중복을 확인해야 한다
- **rollback:** 안정적인 ID와 모듈 링크를 유지한 채 조각을 전역 requirements.json으로 병합하고 모듈 문서 생성을 중단한다.
- **supersedes:** -
- **requirements:** REQ-001, REQ-002, REQ-003, REQ-009, REQ-024

### ADR-010 — 개발 기반 정본과 모듈별 UI 조각을 분리해 생성

- **id:** ADR-010
- **title:** 개발 기반 정본과 모듈별 UI 조각을 분리해 생성
- **status:** accepted
- **date:** 2026-09-18
- **context:** 프로젝트마다 기술 스택은 달라지지만 AI 개발 워크플로, 표준의 분류와 검증, UI 합의와 공통 컴포넌트 관리, 운영·제출 산출물 계약은 일관돼야 한다.
- **options:** 프로젝트별 Markdown 가이드를 자유 작성, 특정 기술 스택의 규칙을 AIDD 공통에 고정, 기술 독립 메타 정본과 프로젝트·모듈별 조각에서 파생물 생성
- **decision:** STD·GPH·EXC, UXB·UIP·CMP, SCR·MAN, RUN·DLP를 구조화된 정본으로 도입한다. 전역 기반과 모듈별 UI 조각을 분리하고 사람이 읽는 표준·목업·매뉴얼·런북·제출 manifest는 결정적으로 생성한다.
- **consequences:** 새 기술 스택은 같은 메타 구조에 프로젝트 고유 규칙과 검증기를 연결할 수 있다, UI가 없는 모듈은 별도 UI 조각이 필요 없다, 생성기와 검증기의 관리 범위가 넓어진다, 실제 사용자 사이트·ZIP 패키지·화면 캡처 자동화는 후속 실행 자산으로 남는다
- **rollback:** 안정 ID와 정본을 내보내 보존하고 기존 guides·deliverables 뷰로 축소한다. 모듈 요구사항 구조와 기존 산출물은 유지한다.
- **supersedes:** -
- **requirements:** REQ-011, REQ-015, REQ-025, REQ-031, REQ-032, REQ-033

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

### TC-007 — 기능 구현 전 기반 준비도 강제

- **id:** TC-007
- **title:** 기능 구현 전 기반 준비도 강제
- **type:** scenario
- **status:** passed
- **required:** true
- **requirements:** REQ-011
- **evidence:** EVD-014

### TC-008 — 기술 스택·개발 기반 게이트 구조 검증

- **id:** TC-008
- **title:** 기술 스택·개발 기반 게이트 구조 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-011
- **evidence:** EVD-004

### TC-009 — 방법론 비교와 AIDD 통제 연결 검증

- **id:** TC-009
- **title:** 방법론 비교와 AIDD 통제 연결 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-019
- **evidence:** EVD-005

### TC-010 — 배포·운영 맥락 게이트와 프로필 구조 검증

- **id:** TC-010
- **title:** 배포·운영 맥락 게이트와 프로필 구조 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-020
- **evidence:** EVD-006

### TC-011 — 동시성·트랜잭션·성능 위험 카탈로그 검증

- **id:** TC-011
- **title:** 동시성·트랜잭션·성능 위험 카탈로그 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-021
- **evidence:** EVD-007

### TC-024 — 개발 표준·골든 패스·예외·런북·제출 프로필 정본 검증

- **id:** TC-024
- **title:** 개발 표준·골든 패스·예외·런북·제출 프로필 정본 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-031, REQ-033
- **evidence:** EVD-023
- **rule_mutation:**

```json
{
  "applicable": true,
  "rules": [
    "알 수 없는 표준·기술 기준선·테스트 참조를 거부한다",
    "예외의 승인·만료·보완 통제 누락을 거부한다",
    "출시 캡처가 필수인 프로필의 목업 허용을 거부한다",
    "자연어 프로젝트 진행 가이드의 단계·가정·미결사항·환경 제약·아키텍처 비교 안내 결손을 탐지한다"
  ],
  "evidence": [
    "EVD-023"
  ]
}
```

### TC-025 — 모듈별 UI 정본과 결정적 화면·매뉴얼 생성

- **id:** TC-025
- **title:** 모듈별 UI 정본과 결정적 화면·매뉴얼 생성
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-032, REQ-033
- **evidence:** EVD-024
- **rule_mutation:**

```json
{
  "applicable": true,
  "rules": [
    "알 수 없는 UI 기준선·패턴·컴포넌트·화면 참조를 거부한다",
    "승인된 화면의 필수 상태·접근성·승인 누락을 거부한다",
    "검증된 매뉴얼의 증거 누락을 거부한다"
  ],
  "evidence": [
    "EVD-024"
  ]
}
```

## 가정

등록된 항목이 없습니다.

## 작업 상세

### WRK-012 — 개발 기반·UI·운영·제출 정본과 생성 계약

- **id:** WRK-012
- **title:** 개발 기반·UI·운영·제출 정본과 생성 계약
- **type:** contract
- **status:** doing
- **module:** MOD-ARCH
- **change:** CHG-011
- **requirements:** REQ-011, REQ-015, REQ-025, REQ-031, REQ-032, REQ-033
- **depends_on:** WRK-003, WRK-005
- **coverage:** design, implementation, test, documentation, migration, operations, training
- **acceptance_criteria:** 새 정본 유형의 참조·상태·대체·예외 만료를 검증한다, UI가 없는 모듈과 선택적 UI 조각을 모두 지원한다, 개발 기반·목업·매뉴얼·런북·제출 manifest를 결정적으로 생성한다, 기존 프로젝트의 가이드·산출물 구조를 새 정본 체계로 이관한다, 사용자와 AI가 새 문서·사이트 흐름을 익힐 수 있는 진행 가이드를 제공한다, TG-002의 실제 프로젝트 적용 전까지 변경과 게이트를 검토 중으로 유지한다
- **evidence:** EVD-023, EVD-024

## 기능 상세 명세서 공통 항목

### 기능 개요와 연결 제품 요구사항

AIDD Kit은 고객과 AI가 소프트웨어 제품의 의도부터 운영·개선까지 함께 관리하도록 돕는 재사용 가능한 개발·운영 키트다.

### 처리 흐름·업무 규칙·예외

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.

### 인수 기준과 금지되는 결과

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.
