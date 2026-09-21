<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# MOD-STATUS — 상태와 포트폴리오 뷰

- 상태: in_progress
- 목적: 경영진, 모듈과 항목 수준의 진척·의사결정 브리핑을 생성한다.
- 의존 모듈: MOD-GOV

## 요구사항

| 요구사항 | 제목 | 상태 | 검증 |
| --- | --- | --- | --- |
| REQ-007 | 미결사항 추적 | specified | TC-001 |
| REQ-008 | 거시·미시 상태 브리핑 | specified | TC-001 |
| REQ-009 | 모듈 단위 수행 | specified | TC-001 |
| REQ-020 | 배포·운영 환경의 조기 확인 | implemented | TC-010 |
| REQ-022 | 실행 가능한 게이트와 증거 무결성 | implemented | TC-012, TC-013 |
| REQ-024 | 모듈 단위 상세 실행 계획과 진척 추적 | implemented | TC-015 |

## 작업 항목

| 작업 | 제목 | 상태 | 변경 | 요구사항 | 포괄 범위 | 선행 작업 | 증거 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WRK-003 | 모듈·마일스톤·작업·인터페이스·의존성 상세 추적 | completed | CHG-006 | REQ-024 | - | WRK-001 | EVD-012 |

## 인터페이스

| ID | 이름 | 상태 | 제공 | 소비 | 호환성 |
| --- | --- | --- | --- | --- | --- |
| IFC-001 | 정본-생성 문서 계약 | current | MOD-GOV | MOD-DOC, MOD-STATUS, MOD-QA | 필드 변경 시 생성기·검증·테스트·산출물 목록을 같은 변경에서 갱신한다. |
| IFC-002 | 공통 AI 스킬-플랫폼 어댑터 계약 | current | MOD-AI | MOD-DISC, MOD-ARCH, MOD-DELIVERY, MOD-QA, MOD-STATUS | 플랫폼 전용 지침과 훅은 얇게 유지하고 공통 수행 규칙은 AGENTS.md, 공통 스킬 의미는 .ai/skills에 둔다. |

## 모듈 의존성

| ID | 출발 | 도착 | 상태 | 설명 |
| --- | --- | --- | --- | --- |
| DPN-002 | MOD-GOV | MOD-STATUS | current | 상태 뷰는 정본 ID와 증거 상태만 집계한다. |

## 관련 변경

| ID | 등급 | 상태 | 제목 |
| --- | --- | --- | --- |
| CHG-001 | C2 | in_progress | AIDD 기반 구조 수립 |
| CHG-003 | C2 | in_progress | 배포 환경과 설계 위험 예방 게이트 보강 |
| CHG-004 | C2 | in_progress | 실행 가능한 게이트와 증거 무결성 |
| CHG-006 | C2 | in_progress | 프로젝트 착수 전 실행 기반 완성 |
| CHG-010 | C2 | in_progress | 모듈별 정본 분할과 확장 가능한 명세 |
| CHG-011 | C2 | in_progress | 프로젝트 개발 기반·UI·운영·제출 정본 체계 |

## 관련 결정

| ID | 상태 | 제목 |
| --- | --- | --- |
| ADR-008 | accepted | 기술 선택 전에 배포·운영 맥락을 게이트로 확인 |
| ADR-009 | accepted | 모듈별 요구사항 조각과 생성 명세 사용 |

## 관련 테스트

| ID | 상태 | 제목 |
| --- | --- | --- |
| TC-001 | passed | 정본 그래프와 상태 뷰 검증 |
| TC-010 | passed | 배포·운영 맥락 게이트와 프로필 구조 검증 |
| TC-012 | passed | 게이트 실행·증거·게이트 우회 방지 |
| TC-013 | passed | 정본 참조와 증거 무결성 부정 테스트 |
| TC-015 | passed | 모듈 상세 실행 계획과 참조 무결성 |

## UI 정본

- 화면: 0개
- 매뉴얼: 0개

## 모듈 정본

### MOD-STATUS — 상태와 포트폴리오 뷰

- **id:** MOD-STATUS
- **name:** 상태와 포트폴리오 뷰
- **purpose:** 경영진, 모듈과 항목 수준의 진척·의사결정 브리핑을 생성한다.
- **status:** in_progress
- **dependencies:** MOD-GOV
- **requirements:** REQ-007, REQ-008, REQ-009, REQ-020, REQ-022, REQ-024

## 요구사항 상세

### REQ-007 — 미결사항 추적

- **id:** REQ-007
- **title:** 미결사항 추적
- **statement:** 프레임워크는 해결되지 않은 질문, 결정 조건, 차단 영향과 해결 링크를 기록해야 한다.
- **rationale:** 답하지 않은 질문은 의도적으로 해결할 때까지 보여야 한다.
- **priority:** must
- **status:** specified
- **modules:** MOD-GOV, MOD-STATUS
- **verification:** TC-001
- **acceptance_criteria:** 차단 미결사항이 릴리스 준비도에 표시된다, 종료한 항목에는 해결 내용이 있다
- **source:** USER-2026-09-17

### REQ-008 — 거시·미시 상태 브리핑

- **id:** REQ-008
- **title:** 거시·미시 상태 브리핑
- **statement:** 프레임워크는 현재 레코드에서 전체, 모듈과 항목 수준의 진척, 위험, 차단사항, 결정과 다음 작업을 브리핑해야 한다.
- **rationale:** 의사결정 종류에 따라 필요한 상세 수준이 다르다.
- **priority:** must
- **status:** specified
- **modules:** MOD-STATUS
- **verification:** TC-001
- **acceptance_criteria:** 경영진과 상세 상태 뷰를 제공한다, 모듈별 필터링을 지원한다
- **source:** USER-2026-09-17

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

### REQ-022 — 실행 가능한 게이트와 증거 무결성

- **id:** REQ-022
- **title:** 실행 가능한 게이트와 증거 무결성
- **statement:** 프레임워크는 변경별 게이트 실행, 판정 기준, 증거, 통과 판정과 예외를 구조화하고 통과하지 않았거나 증거가 없는 상태가 릴리스 준비 완료로 계산되지 않게 해야 한다.
- **rationale:** 정책 문서와 상태 문자열만으로는 게이트 우회와 근거 없는 완료 선언을 막을 수 없다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-GOV, MOD-QA, MOD-STATUS
- **verification:** TC-012, TC-013
- **acceptance_criteria:** 통과한 게이트의 모든 통과 기준에 유효한 증거가 연결된다, 증거에는 수행자·명령 또는 방법·시각·커밋·결과가 있다, 미통과·실패·만료 게이트와 유효하지 않은 예외는 릴리스를 차단한다, 알 수 없는 정본 참조와 증거 없는 통과 상태는 검증에 실패한다
- **source:** AUDIT-2026-09-18

### REQ-024 — 모듈 단위 상세 실행 계획과 진척 추적

- **id:** REQ-024
- **title:** 모듈 단위 상세 실행 계획과 진척 추적
- **statement:** 프레임워크는 모듈별 마일스톤, 작업, 인터페이스와 전달 의존성을 요구사항·변경·증거에 연결해 독립적으로 계획하고 브리핑해야 한다.
- **rationale:** 모듈의 단일 상태만으로는 실제 남은 작업, 차단 관계와 통합 영향을 판단할 수 없다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-GOV, MOD-STATUS
- **verification:** TC-015
- **acceptance_criteria:** 작업은 단일 담당 모듈과 변경·요구사항·인수 기준을 가진다, 완료 작업은 구조화된 증거를 가진다, 모듈 뷰에서 요구사항·작업·의존성을 함께 확인한다
- **source:** AUDIT-2026-09-18

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

### CHG-004 — 실행 가능한 게이트와 증거 무결성

- **id:** CHG-004
- **title:** 실행 가능한 게이트와 증거 무결성
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-QA, MOD-STATUS
- **requirements:** REQ-003, REQ-007, REQ-017, REQ-018, REQ-022
- **required_gates:** TG-002
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
- **impact:** 게이트 정의와 변경별 실행을 분리하고 증거·통과 판정·예외를 구조화하여 상태값만으로 완료를 우회할 수 없게 한다.
- **migration:** 기존 통과 테스트의 자유문자 증거를 EVD 레코드로 이관하고 기존 C2 변경에 미결 게이트 실행을 생성한다.
- **rollback:** gate-runs.json·evidence.json의 연결 검증을 제거하고 tests.json 증거를 이전 문자열 형식으로 되돌린다.
- **regression_scope:** 정본 로딩, 테스트 증거, 게이트 통과, 릴리스 차단, 상태·생성 문서, AI 스킬

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

## 관련 테스트

### TC-001 — 정본 그래프와 상태 뷰 검증

- **id:** TC-001
- **title:** 정본 그래프와 상태 뷰 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-001, REQ-003, REQ-007, REQ-008, REQ-009, REQ-014, REQ-016, REQ-017, REQ-018
- **evidence:** EVD-001

### TC-010 — 배포·운영 맥락 게이트와 프로필 구조 검증

- **id:** TC-010
- **title:** 배포·운영 맥락 게이트와 프로필 구조 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-020
- **evidence:** EVD-006

### TC-012 — 게이트 실행·증거·게이트 우회 방지

- **id:** TC-012
- **title:** 게이트 실행·증거·게이트 우회 방지
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-022
- **evidence:** EVD-008

### TC-013 — 정본 참조와 증거 무결성 부정 테스트

- **id:** TC-013
- **title:** 정본 참조와 증거 무결성 부정 테스트
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-022
- **evidence:** EVD-009

### TC-015 — 모듈 상세 실행 계획과 참조 무결성

- **id:** TC-015
- **title:** 모듈 상세 실행 계획과 참조 무결성
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-024
- **evidence:** EVD-012

## 가정

등록된 항목이 없습니다.

## 작업 상세

### WRK-003 — 모듈·마일스톤·작업·인터페이스·의존성 상세 추적

- **id:** WRK-003
- **title:** 모듈·마일스톤·작업·인터페이스·의존성 상세 추적
- **type:** governance
- **status:** completed
- **module:** MOD-STATUS
- **change:** CHG-006
- **requirements:** REQ-024
- **depends_on:** WRK-001
- **acceptance_criteria:** 모듈 뷰에서 요구사항과 작업 및 의존성을 함께 추적한다
- **evidence:** EVD-012

## 기능 상세 명세서 공통 항목

### 기능 개요와 연결 제품 요구사항

AIDD Kit은 고객과 AI가 소프트웨어 제품의 의도부터 운영·개선까지 함께 관리하도록 돕는 재사용 가능한 개발·운영 키트다.

### 처리 흐름·업무 규칙·예외

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.

### 인수 기준과 금지되는 결과

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.
