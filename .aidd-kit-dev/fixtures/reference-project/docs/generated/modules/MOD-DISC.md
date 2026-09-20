<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# MOD-DISC — 요구 발굴과 제품 범위화

- 상태: planned
- 목적: 의도, 성과, 경계, 배포·운영 제약, 대안, 가정과 반대 검토를 도출한다.
- 의존 모듈: MOD-GOV

## 요구사항

| 요구사항 | 제목 | 상태 | 검증 |
| --- | --- | --- | --- |
| REQ-004 | 의도 발굴과 레드팀 검토 | specified | TC-004 |
| REQ-005 | 트레이드오프 의사결정 | specified | TC-004 |
| REQ-019 | 상황 적응형 방법론 근거 | implemented | TC-009 |
| REQ-020 | 배포·운영 환경의 조기 확인 | implemented | TC-010 |
| REQ-026 | Codex·Claude 행동 품질 동등성 평가 | specified | TC-004, TC-017, TC-018 |

## 작업 항목

| 작업 | 제목 | 상태 | 책임 참여자 | 변경 | 요구사항 | 포괄 범위 | 선행 작업 | 증거 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

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
| CHG-002 | C2 | in_progress | 기술 스택 게이트와 방법론 분석 보강 |
| CHG-003 | C2 | in_progress | 배포 환경과 설계 위험 예방 게이트 보강 |

## 관련 결정

| ID | 상태 | 제목 |
| --- | --- | --- |
| ADR-007 | accepted | 단일 방법론 대신 상황 적응형 혼합 통제 사용 |
| ADR-008 | accepted | 기술 선택 전에 배포·운영 맥락을 게이트로 확인 |

## 관련 테스트

| ID | 상태 | 제목 |
| --- | --- | --- |
| TC-004 | not_run | 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가 |
| TC-009 | passed | 방법론 비교와 AIDD 통제 연결 검증 |
| TC-010 | passed | 배포·운영 맥락 게이트와 프로필 구조 검증 |
| TC-017 | not_run | Codex·Claude 실제 교차 행동 평가 |
| TC-018 | passed | AI 교차 평가 하네스와 공통 루브릭 검증 |

## UI 정본

- 화면: 0개
- 매뉴얼: 0개

## 모듈 정본

### MOD-DISC — 요구 발굴과 제품 범위화

- **id:** MOD-DISC
- **name:** 요구 발굴과 제품 범위화
- **purpose:** 의도, 성과, 경계, 배포·운영 제약, 대안, 가정과 반대 검토를 도출한다.
- **status:** planned
- **dependencies:** MOD-GOV
- **requirements:** REQ-004, REQ-005, REQ-019, REQ-020, REQ-026

## 요구사항 상세

### REQ-004 — 의도 발굴과 레드팀 검토

- **id:** REQ-004
- **title:** 의도 발굴과 레드팀 검토
- **statement:** AI는 인터뷰와 반대 검토 기법을 사용해 고객이 목적, 성과, 경계, 가정, 예외, 오용 사례와 실패 방식을 명확히 하도록 도와야 한다.
- **rationale:** 명확한 의도와 검증된 가정은 이후의 비싼 재작업을 줄인다.
- **priority:** must
- **status:** specified
- **owner:** 제품
- **modules:** MOD-DISC
- **verification:** TC-004
- **acceptance_criteria:** 모르는 내용은 추측하지 않고 기록한다, 중대한 가정에 반대 검토를 수행한다
- **source:** USER-2026-09-17

### REQ-005 — 트레이드오프 의사결정

- **id:** REQ-005
- **title:** 트레이드오프 의사결정
- **statement:** AI는 중요한 선택을 추천하기 전에 실행 가능한 대안의 장점, 비용, 위험, 불확실성과 가역성을 제시해야 한다.
- **rationale:** 고객에게는 숨겨진 AI 선호가 아니라 높은 의사결정 품질이 필요하다.
- **priority:** must
- **status:** specified
- **owner:** 제품
- **modules:** MOD-DISC, MOD-GOV
- **verification:** TC-004
- **acceptance_criteria:** 추천과 고객 결정을 분리한다, 결정 기록에 채택하지 않은 대안을 포함한다
- **source:** USER-2026-09-17

### REQ-019 — 상황 적응형 방법론 근거

- **id:** REQ-019
- **title:** 상황 적응형 방법론 근거
- **statement:** 프레임워크는 전통적·적응형·운영·AI 주도 개발 방법론의 장점과 한계를 비교하고 프로젝트의 불확실성, 규제, 위험, 변경 비용과 운영 특성에 맞춰 적용할 통제를 선택해야 한다.
- **rationale:** 하나의 방법론을 일률적으로 적용하면 작은 변경에는 과도하고 고위험 변경에는 부족할 수 있다.
- **priority:** must
- **status:** implemented
- **owner:** 거버넌스
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
- **owner:** 제품·아키텍처·인프라
- **modules:** MOD-DISC, MOD-ARCH, MOD-STATUS
- **verification:** TC-010
- **acceptance_criteria:** DG-001이 TG-001보다 먼저 수행된다, 설계를 바꾸는 환경 범주와 미결 결정이 배포 프로필에 기록된다, 미정 사항에는 담당자·기한·영향이 있으며 중대한 항목은 차단된다
- **source:** USER-2026-09-18

### REQ-026 — Codex·Claude 행동 품질 동등성 평가

- **id:** REQ-026
- **title:** Codex·Claude 행동 품질 동등성 평가
- **statement:** 프레임워크는 파일 동등성을 넘어 Codex와 Claude가 동일한 대표 시나리오와 루브릭에서 요구 발굴, 변경 통제와 게이트 판단을 같은 품질 수준으로 수행하는지 평가해야 한다.
- **rationale:** 동일한 스킬 파일도 모델과 훅 차이 때문에 다른 행동 결과를 만들 수 있다.
- **priority:** must
- **status:** specified
- **owner:** AI 플랫폼·품질 보증
- **modules:** MOD-AI, MOD-DISC, MOD-QA
- **verification:** TC-004, TC-017, TC-018
- **acceptance_criteria:** 두 플랫폼이 같은 픽스처와 루브릭을 사용한다, 플랫폼별 결과와 증거가 분리된다, 중대 금지 행동과 점수 차이 기준을 모두 통과한다
- **source:** AUDIT-2026-09-18

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

## 관련 결정

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

## 관련 테스트

### TC-004 — 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가

- **id:** TC-004
- **title:** 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가
- **type:** agent-eval
- **status:** not_run
- **required:** true
- **requirements:** REQ-004, REQ-005, REQ-026
- **evidence:** -

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

## 가정

등록된 항목이 없습니다.

## 작업 상세

등록된 항목이 없습니다.

## 기능 요건 정의서 공통 항목

### 기능 개요와 범위

AIDD Kit은 고객과 AI가 소프트웨어 제품의 의도부터 운영·개선까지 함께 관리하도록 돕는 재사용 가능한 개발·운영 키트다.

### 처리 흐름·업무 규칙·예외

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.

### 인수 기준과 금지되는 결과

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.
