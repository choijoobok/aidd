<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# MOD-GOV — 거버넌스와 정본

- 상태: in_progress
- 목적: 산출물 식별자, 추적성, 의사결정, 미결사항, 위험과 게이트를 관리한다.
- 의존 모듈: 없음

## 요구사항

| 요구사항 | 제목 | 상태 | 검증 |
| --- | --- | --- | --- |
| REQ-001 | 프로젝트 정본 레코드 | specified | TC-001 |
| REQ-003 | 생애주기 전체 추적성 | specified | TC-001 |
| REQ-005 | 트레이드오프 의사결정 | specified | TC-004 |
| REQ-006 | 가역적인 결정과 학습 | specified | TC-005 |
| REQ-007 | 미결사항 추적 | specified | TC-001 |
| REQ-014 | 다분야 역할 관점 | specified | TC-001 |
| REQ-017 | 위험 비례 품질 게이트 | specified | TC-001 |
| REQ-019 | 상황 적응형 방법론 근거 | implemented | TC-009 |
| REQ-022 | 실행 가능한 게이트와 증거 무결성 | implemented | TC-012, TC-013 |
| REQ-024 | 모듈 단위 상세 실행 계획과 진척 추적 | implemented | TC-015 |
| REQ-035 | 변경 유형별 문서 동기화와 레거시 전환 | implemented | TC-027 |
| REQ-036 | 프로젝트 운영 분리와 추적 가능한 결정 이력 | implemented | TC-028 |

## 작업 항목

| 작업 | 제목 | 상태 | 변경 | 요구사항 | 포괄 범위 | 선행 작업 | 증거 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WRK-001 | 게이트 실행과 증거 무결성 강제 | completed | CHG-004 | REQ-022 | - | - | EVD-008, EVD-009 |
| WRK-015 | 프로젝트 운영 분리와 결정 이력 계약 | completed | CHG-014 | REQ-036 | design, implementation, test, documentation, migration, operations | WRK-003 | EVD-029 |

## 인터페이스

| ID | 이름 | 상태 | 제공 | 소비 | 호환성 |
| --- | --- | --- | --- | --- | --- |
| IFC-001 | 정본-생성 문서 계약 | current | MOD-GOV | MOD-DOC, MOD-STATUS, MOD-QA | 필드 변경 시 생성기·검증·테스트·산출물 목록을 같은 변경에서 갱신한다. |

## 모듈 의존성

| ID | 출발 | 도착 | 상태 | 설명 |
| --- | --- | --- | --- | --- |
| DPN-001 | MOD-GOV | MOD-DOC | current | 정본 구조가 생성 문서의 입력 계약을 제공한다. |
| DPN-002 | MOD-GOV | MOD-STATUS | current | 상태 뷰는 정본 ID와 증거 상태만 집계한다. |

## 관련 변경

| ID | 등급 | 상태 | 제목 |
| --- | --- | --- | --- |
| CHG-001 | C2 | in_progress | AIDD 기반 구조 수립 |
| CHG-002 | C2 | in_progress | 기술 스택 게이트와 방법론 분석 보강 |
| CHG-004 | C2 | in_progress | 실행 가능한 게이트와 증거 무결성 |
| CHG-006 | C2 | in_progress | 프로젝트 착수 전 실행 기반 완성 |
| CHG-010 | C2 | in_progress | 모듈별 정본 분할과 확장 가능한 명세 |
| CHG-013 | C2 | in_progress | 변경 유형별 분석·설계 진입과 레거시 문서 현행화 통제 |
| CHG-014 | C2 | done | 프로젝트 운영 분리와 결정 이력 중심 전환 |

## 관련 결정

| ID | 상태 | 제목 |
| --- | --- | --- |
| ADR-001 | accepted | 구조화된 JSON 레지스트리를 정본으로 사용 |
| ADR-004 | accepted | 역할을 증거 생성 관점으로 취급 |
| ADR-005 | accepted | 변경 등급에 따라 엄격성 조정 |
| ADR-006 | accepted | 기술 스택과 개발 기반을 기능 개발 전에 게이트로 확정 |
| ADR-007 | accepted | 단일 방법론 대신 상황 적응형 혼합 통제 사용 |
| ADR-009 | accepted | 모듈별 요구사항 조각과 생성 명세 사용 |
| ADR-012 | accepted | 구현 표면 기반 문서 동기화와 레거시 단계 전환 |
| ADR-013 | accepted | 프로젝트 운영과 AIDD 산출물 추적을 분리 |

## 관련 테스트

| ID | 상태 | 제목 |
| --- | --- | --- |
| TC-001 | passed | 정본 그래프와 상태 뷰 검증 |
| TC-004 | not_run | 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가 |
| TC-005 | passed | 결정 대체와 기존 시스템 변경 정본 전이 시나리오 |
| TC-009 | passed | 방법론 비교와 AIDD 통제 연결 검증 |
| TC-012 | passed | 게이트 실행·증거·게이트 우회 방지 |
| TC-013 | passed | 정본 참조와 증거 무결성 부정 테스트 |
| TC-015 | passed | 모듈 상세 실행 계획과 참조 무결성 |
| TC-027 | passed | 변경 유형별 분석·설계·문서 동기화와 레거시 전환 통제 |
| TC-028 | passed | 프로젝트 운영 분리와 결정 이력 계약 |

## UI 정본

- 화면: 0개
- 매뉴얼: 0개

## 모듈 정본

### MOD-GOV — 거버넌스와 정본

- **id:** MOD-GOV
- **name:** 거버넌스와 정본
- **purpose:** 산출물 식별자, 추적성, 의사결정, 미결사항, 위험과 게이트를 관리한다.
- **status:** in_progress
- **dependencies:** -
- **requirements:** REQ-001, REQ-003, REQ-005, REQ-006, REQ-007, REQ-014, REQ-017, REQ-019, REQ-022, REQ-024, REQ-035, REQ-036

## 요구사항 상세

### REQ-001 — 프로젝트 정본 레코드

- **id:** REQ-001
- **title:** 프로젝트 정본 레코드
- **statement:** 프레임워크는 의도, 요구사항, 설계, 결정, 위험, 작업, 테스트, 릴리스와 유지보수 이력을 기계가 읽을 수 있는 정본 레코드로 관리해야 한다.
- **rationale:** 정규화된 하나의 정본은 서술형 산출물 사이의 불일치를 방지한다.
- **priority:** must
- **status:** specified
- **modules:** MOD-GOV
- **verification:** TC-001
- **acceptance_criteria:** 모든 정본 레코드는 파싱 가능하고 안정적인 ID가 있다, 레코드 간 참조가 검증된다
- **source:** USER-2026-09-17

### REQ-003 — 생애주기 전체 추적성

- **id:** REQ-003
- **title:** 생애주기 전체 추적성
- **statement:** 프레임워크는 변경되지 않는 식별자로 성과, 요구사항, 모듈, 결정, 변경, 테스트, 릴리스와 병합 영향을 추적해야 한다.
- **rationale:** 생애주기 전체 연결이 없으면 영향과 완전성을 판단할 수 없다.
- **priority:** must
- **status:** specified
- **modules:** MOD-GOV, MOD-QA
- **verification:** TC-001
- **acceptance_criteria:** 알 수 없는 참조는 검증에 실패한다, 추적성 매트릭스가 생성된다
- **source:** USER-2026-09-17

### REQ-005 — 트레이드오프 의사결정

- **id:** REQ-005
- **title:** 트레이드오프 의사결정
- **statement:** AI는 중요한 선택을 추천하기 전에 실행 가능한 대안의 장점, 비용, 위험, 불확실성과 가역성을 제시해야 한다.
- **rationale:** 고객에게는 숨겨진 AI 선호가 아니라 높은 의사결정 품질이 필요하다.
- **priority:** must
- **status:** specified
- **modules:** MOD-DISC, MOD-GOV
- **verification:** TC-004
- **acceptance_criteria:** 추천과 고객 결정을 분리한다, 결정 기록에 채택하지 않은 대안을 포함한다
- **source:** USER-2026-09-17

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

### REQ-017 — 위험 비례 품질 게이트

- **id:** REQ-017
- **title:** 위험 비례 품질 게이트
- **statement:** 프레임워크는 필수 안전·추적 통제를 유지하면서 변경 위험에 맞춰 분석, 검토와 증거 수준을 조정해야 한다.
- **rationale:** 일률적인 중량 프로세스는 작은 작업을 늦추고, 게이트가 없으면 큰 작업을 위험하게 만든다.
- **priority:** must
- **status:** specified
- **modules:** MOD-GOV, MOD-QA
- **verification:** TC-001
- **acceptance_criteria:** 모든 변경에 엄격성 등급이 있다, 높은 위험 등급일수록 강한 증거가 필요하다
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

### REQ-036 — 프로젝트 운영 분리와 추적 가능한 결정 이력

- **id:** REQ-036
- **title:** 프로젝트 운영 분리와 추적 가능한 결정 이력
- **statement:** 프레임워크는 인력·역할·승인·일정·작업 배정을 프로젝트 운영 영역으로 분리하고, 분석·설계·용어·소스·범위·상태의 중요한 결정은 안정 ID에 연결된 append-only 이력으로 기록해야 한다.
- **rationale:** 현재 정본만 보면 과거 결정의 이유와 영향 범위를 재구성하기 어렵지만, 신원과 권한 체계를 제품 실행 프레임워크가 직접 운영하는 것은 과도하다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-GOV
- **verification:** TC-028
- **acceptance_criteria:** 프로젝트 bootstrap과 검증은 사람·역할·Git 신원 정본을 요구하지 않는다, 실행·릴리스 게이트는 사람 승인이나 WRK 담당자 배정을 요구하지 않는다, HIS는 결정 시각·유형·대상 안정 ID·결정 주체·결정·이유·영향·출처를 기록한다, 현재 정본에는 현재 상태와 핵심 근거를 유지하고 상세 변경 과정은 HIS에서 조회한다, 용어 변경은 TCH에 결정 주체·시각·요약·영향을 남기며 PM 역할을 요구하지 않는다
- **source:** USER-2026-09-21

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

### CHG-014 — 프로젝트 운영 분리와 결정 이력 중심 전환

- **id:** CHG-014
- **title:** 프로젝트 운영 분리와 결정 이력 중심 전환
- **type:** governance
- **class:** C2
- **status:** done
- **requested_by:** 고객
- **modules:** MOD-GOV
- **requirements:** REQ-036
- **required_gates:** -
- **required_work_coverage:** design, implementation, test, documentation, migration, operations
- **delivery_path:**

```json
{
  "kind": "governance",
  "analysis": "complete",
  "design": "complete",
  "documentation": "update_now",
  "surfaces": [],
  "documentation_work": [],
  "decided_by": "고객과 프로젝트팀의 오프라인 협의",
  "reason": "AIDD는 실행과 산출물에 집중하고 프로젝트 운영은 별도 도구와 절차에서 관리한다."
}
```
- **impact:** AIDD 정본과 명령에서 신원·역할·승인·작업 배정을 제거하고 안정 ID 기반 결정 이력을 추가한다.
- **migration:** 기존 협업·승인 정본은 제거하고 현재 항목의 상태·근거와 HIS 이력을 함께 사용한다.
- **rollback:** HIS 레코드를 보존한 채 이전 Kit 버전의 협업 정본과 명령을 별도 프로젝트 정책으로 복원한다.
- **regression_scope:** 프로젝트 bootstrap, 결정 이력 기록·검증·생성, 용어 변경 이력, 게이트·병합 재검토, 가이드와 provider 어댑터

## 관련 결정

### ADR-001 — 구조화된 JSON 레지스트리를 정본으로 사용

- **id:** ADR-001
- **title:** 구조화된 JSON 레지스트리를 정본으로 사용
- **status:** accepted
- **date:** 2026-09-17
- **context:** 독립적으로 편집하는 여러 문서를 안정적으로 동기화할 수 없다.
- **options:** 서술형 문서를 동등한 정본으로 사용, 구조화된 레지스트리와 생성 뷰 사용, 외부 프로젝트 관리 데이터베이스 사용
- **decision:** 초기 기반에서는 저장소로 버전 관리하는 JSON 레지스트리와 자동 생성 Markdown 뷰를 사용한다.
- **consequences:** 참조를 결정적으로 검증할 수 있다, 관리 대상 사실은 구조화된 레코드에서 수정해야 한다, 향후 데이터베이스는 ID와 내보내기 호환성을 보존해야 한다
- **rollback:** 안정적인 ID를 유지하면서 JSON 레코드를 대체 저장소로 내보내고 생성기를 변경한다.
- **supersedes:** -
- **requirements:** REQ-001, REQ-002, REQ-003

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

### ADR-013 — 프로젝트 운영과 AIDD 산출물 추적을 분리

- **id:** ADR-013
- **title:** 프로젝트 운영과 AIDD 산출물 추적을 분리
- **status:** accepted
- **date:** 2026-09-21
- **context:** 팀이 서로 신뢰하고 별도 운영 절차를 사용하는 프로젝트에서 AIDD가 신원·역할·승인·작업 배정까지 관리하면 실행보다 거버넌스 비용이 커진다. 반면 중요한 결정의 이유와 영향은 시간이 지나도 복원할 수 있어야 한다.
- **options:** AIDD가 사람·권한·배정을 계속 관리, 사람 관리는 제거하고 Git 이력에만 의존, 프로젝트 운영은 외부로 분리하고 안정 ID 기반 결정 이력을 유지
- **decision:** 프로젝트 운영은 팀이 오프라인 또는 별도 도구에서 관리하고 AIDD는 현재 정본과 append-only HIS·ADR·CHG·TCH로 실행 결정의 주체·이유·영향을 추적한다.
- **consequences:** Git 계정과 팀 역할 변경이 AIDD 실행을 차단하지 않는다, 정확한 코드 차이는 Git에서, 결정 이유와 영향은 HIS에서 확인한다, 사소한 편집은 기록하지 않고 의미 있는 결정만 남긴다
- **rollback:** 필요한 프로젝트가 자체 정책과 도구로 역할·승인 레코드를 추가하되 portable Kit의 필수 계약으로 되돌리지는 않는다.
- **supersedes:** -
- **requirements:** REQ-036

## 관련 테스트

### TC-001 — 정본 그래프와 상태 뷰 검증

- **id:** TC-001
- **title:** 정본 그래프와 상태 뷰 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-001, REQ-003, REQ-007, REQ-008, REQ-009, REQ-014, REQ-016, REQ-017, REQ-018
- **evidence:** EVD-001

### TC-004 — 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가

- **id:** TC-004
- **title:** 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가
- **type:** agent-eval
- **status:** not_run
- **required:** true
- **requirements:** REQ-004, REQ-005, REQ-026
- **evidence:** -

### TC-005 — 결정 대체와 기존 시스템 변경 정본 전이 시나리오

- **id:** TC-005
- **title:** 결정 대체와 기존 시스템 변경 정본 전이 시나리오
- **type:** scenario
- **status:** passed
- **required:** true
- **requirements:** REQ-006, REQ-010
- **evidence:** EVD-013

### TC-009 — 방법론 비교와 AIDD 통제 연결 검증

- **id:** TC-009
- **title:** 방법론 비교와 AIDD 통제 연결 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-019
- **evidence:** EVD-005

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

### TC-028 — 프로젝트 운영 분리와 결정 이력 계약

- **id:** TC-028
- **title:** 프로젝트 운영 분리와 결정 이력 계약
- **type:** scenario
- **status:** passed
- **required:** true
- **requirements:** REQ-036
- **evidence:** EVD-029
- **rule_mutation:**

```json
{
  "applicable": true,
  "rules": [
    "사람·역할·신원 정본 없이 bootstrap과 검증이 성공한다",
    "알 수 없는 대상 ID와 잘못된 HIS 날짜를 거부한다",
    "유효한 HIS가 월별 경로에 저장되고 결정 이력 문서에 생성된다",
    "용어 변경은 PM 신원 없이 결정 주체와 이유를 기록한다"
  ],
  "evidence": [
    "EVD-029"
  ]
}
```

## 가정

등록된 항목이 없습니다.

## 작업 상세

### WRK-001 — 게이트 실행과 증거 무결성 강제

- **id:** WRK-001
- **title:** 게이트 실행과 증거 무결성 강제
- **type:** governance
- **status:** completed
- **module:** MOD-GOV
- **change:** CHG-004
- **requirements:** REQ-022
- **depends_on:** -
- **acceptance_criteria:** 증거 없는 통과와 게이트 우회를 검증기가 거부한다
- **evidence:** EVD-008, EVD-009

### WRK-015 — 프로젝트 운영 분리와 결정 이력 계약

- **id:** WRK-015
- **title:** 프로젝트 운영 분리와 결정 이력 계약
- **type:** governance
- **status:** completed
- **module:** MOD-GOV
- **change:** CHG-014
- **requirements:** REQ-036
- **depends_on:** WRK-003
- **coverage:** design, implementation, test, documentation, migration, operations
- **acceptance_criteria:** 인력·역할·일정·승인은 AIDD 정본과 실행 게이트에서 제외한다, 중요 결정은 안정 ID·결정 주체·결정·이유·영향과 함께 HIS에 기록한다, 현재 정본과 append-only 이력을 함께 조회할 수 있다
- **evidence:** EVD-029

## 기능 요건 정의서 공통 항목

### 기능 개요와 범위

AIDD Kit은 고객과 AI가 소프트웨어 제품의 의도부터 운영·개선까지 함께 관리하도록 돕는 재사용 가능한 개발·운영 키트다.

### 처리 흐름·업무 규칙·예외

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.

### 인수 기준과 금지되는 결과

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.
