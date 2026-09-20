<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# MOD-DOC — 산출물 생성

- 상태: in_progress
- 목적: 정본 데이터를 현재 상태의 이해관계자용 문서와 다이어그램으로 투영한다.
- 의존 모듈: MOD-GOV

## 요구사항

| 요구사항 | 제목 | 상태 | 검증 |
| --- | --- | --- | --- |
| REQ-002 | 파생 산출물 | specified | TC-002 |
| REQ-015 | 생애주기 산출물 | specified | TC-002 |
| REQ-025 | 운영자·사용자·보안 가이드의 정본 기반 생성 | implemented | TC-016 |
| REQ-030 | 안전한 템플릿 초기화와 협업 브랜치 흐름 | implemented | TC-023 |
| REQ-031 | 프로젝트별 개발 기반 정본 | implemented | TC-024 |
| REQ-032 | 모듈별 UI·공통 컴포넌트 정본 | implemented | TC-025 |
| REQ-033 | 운영 런북과 제출 패키지 정책 | implemented | TC-024, TC-025 |
| REQ-034 | 감사 가능한 작업 패키지 배정과 개발 범위 포괄성 | implemented | TC-026 |
| REQ-035 | 변경 유형별 문서 동기화와 레거시 전환 | implemented | TC-027 |

## 작업 항목

| 작업 | 제목 | 상태 | 책임 참여자 | 변경 | 요구사항 | 포괄 범위 | 선행 작업 | 증거 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WRK-005 | 운영자·사용자·보안 가이드 자동 생성 | completed | - | CHG-006 | REQ-025 | - | WRK-003 | EVD-015 |
| WRK-014 | 변경 유형별 문서 동기화와 레거시 전환 통제 | completed | HUM-001 | CHG-013 | REQ-035 | design, implementation, test, documentation, migration, operations, training | WRK-003, WRK-005, WRK-013 | EVD-028 |

## 인터페이스

| ID | 이름 | 상태 | 제공 | 소비 | 호환성 |
| --- | --- | --- | --- | --- | --- |
| IFC-001 | 정본-생성 문서 계약 | current | MOD-GOV | MOD-DOC, MOD-STATUS, MOD-QA | 필드 변경 시 생성기·검증·테스트·산출물 목록을 같은 변경에서 갱신한다. |
| IFC-004 | 개발 기반 정본-파생 산출물 계약 | current | MOD-ARCH | MOD-DOC, MOD-DELIVERY, MOD-QA | 필드나 상태 전이를 바꾸면 로더·검증기·생성기·산출물 카탈로그와 TC-024·TC-025를 같은 변경에서 갱신한다. |

## 모듈 의존성

| ID | 출발 | 도착 | 상태 | 설명 |
| --- | --- | --- | --- | --- |
| DPN-001 | MOD-GOV | MOD-DOC | current | 정본 구조가 생성 문서의 입력 계약을 제공한다. |

## 관련 변경

| ID | 등급 | 상태 | 제목 |
| --- | --- | --- | --- |
| CHG-001 | C2 | in_progress | AIDD 기반 구조 수립 |
| CHG-002 | C2 | in_progress | 기술 스택 게이트와 방법론 분석 보강 |
| CHG-003 | C2 | in_progress | 배포 환경과 설계 위험 예방 게이트 보강 |
| CHG-006 | C2 | in_progress | 프로젝트 착수 전 실행 기반 완성 |
| CHG-009 | C2 | in_progress | 안전한 템플릿 초기화와 협업 브랜치 흐름 |
| CHG-010 | C2 | in_progress | 모듈별 정본 분할과 확장 가능한 명세 |
| CHG-011 | C2 | in_progress | 프로젝트 개발 기반·UI·운영·제출 정본 체계 |
| CHG-012 | C2 | done | 감사 가능한 팀 작업 배정과 개발 범위 포괄성 |
| CHG-013 | C2 | in_progress | 변경 유형별 분석·설계 진입과 레거시 문서 현행화 통제 |

## 관련 결정

| ID | 상태 | 제목 |
| --- | --- | --- |
| ADR-001 | accepted | 구조화된 JSON 레지스트리를 정본으로 사용 |
| ADR-002 | accepted | 생성 문서는 읽기 전용 투영으로 관리 |
| ADR-009 | accepted | 모듈별 요구사항 조각과 생성 명세 사용 |
| ADR-010 | accepted | 개발 기반 정본과 모듈별 UI 조각을 분리해 생성 |
| ADR-012 | accepted | 구현 표면 기반 문서 동기화와 레거시 단계 전환 |

## 관련 테스트

| ID | 상태 | 제목 |
| --- | --- | --- |
| TC-002 | passed | 결정적 최신 산출물 생성 |
| TC-016 | passed | 운영자·사용자·보안 가이드 결정적 생성 |
| TC-023 | passed | 안전한 템플릿 Git 초기화와 1인·팀 브랜치 정책 |
| TC-024 | passed | 개발 표준·골든 패스·예외·런북·제출 프로필 정본 검증 |
| TC-025 | passed | 모듈별 UI 정본과 결정적 화면·매뉴얼 생성 |
| TC-026 | passed | 팀 작업 배정 권한·감사 이력·개발 범위 포괄성 |
| TC-027 | passed | 변경 유형별 분석·설계·문서 동기화와 레거시 전환 통제 |

## UI 정본

- 화면: 0개
- 매뉴얼: 0개

## 모듈 정본

### MOD-DOC — 산출물 생성

- **id:** MOD-DOC
- **name:** 산출물 생성
- **purpose:** 정본 데이터를 현재 상태의 이해관계자용 문서와 다이어그램으로 투영한다.
- **status:** in_progress
- **dependencies:** MOD-GOV
- **requirements:** REQ-002, REQ-015, REQ-025, REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035

## 요구사항 상세

### REQ-002 — 파생 산출물

- **id:** REQ-002
- **title:** 파생 산출물
- **statement:** 프레임워크는 정본 레코드에서 사람이 읽는 프로젝트 산출물을 생성하고 오래된 생성 결과를 탐지해야 한다.
- **rationale:** 생성된 뷰는 별도의 정본이 되지 않으면서 최신 상태를 유지한다.
- **priority:** must
- **status:** specified
- **owner:** 거버넌스
- **modules:** MOD-DOC
- **verification:** TC-002
- **acceptance_criteria:** 생성 결과가 결정적이다, 생성 파일의 수동 변경을 탐지한다
- **source:** USER-2026-09-17

### REQ-015 — 생애주기 산출물

- **id:** REQ-015
- **title:** 생애주기 산출물
- **statement:** 프레임워크는 적용 가능한 경우 최신 요구사항, 유즈케이스, 다이어그램, 목업, 테스트 케이스·결과서, 개발자·운영자 가이드와 사용자 매뉴얼을 만들어야 한다.
- **rationale:** 이해관계자는 동일한 시스템을 자신에게 맞는 뷰로 볼 수 있어야 한다.
- **priority:** must
- **status:** specified
- **owner:** 문서화
- **modules:** MOD-DOC, MOD-DELIVERY
- **verification:** TC-002
- **acceptance_criteria:** 산출물 적용 여부가 선언된다, 생성 산출물이 정본 ID와 연결된다
- **source:** USER-2026-09-17

### REQ-025 — 운영자·사용자·보안 가이드의 정본 기반 생성

- **id:** REQ-025
- **title:** 운영자·사용자·보안 가이드의 정본 기반 생성
- **statement:** 프레임워크는 운영자 가이드와 런북, 사용자 매뉴얼, 보안 모델과 검증 가이드를 구조화된 정본에서 생성하고 변경과 함께 현행화해야 한다.
- **rationale:** 직접 작성된 가이드만 두면 기능·운영·보안 변경에서 쉽게 누락되고 정본과 모순된다.
- **priority:** must
- **status:** implemented
- **owner:** 운영·보안·제품
- **modules:** MOD-DOC, MOD-DELIVERY, MOD-QA
- **verification:** TC-016
- **acceptance_criteria:** 세 대상별 가이드가 정본 출처를 가진다, 가이드 생성이 결정적이며 드리프트를 검출한다, 운영 절차에 검증·복구·병합 영향 대응이 포함된다
- **source:** AUDIT-2026-09-18

### REQ-030 — 안전한 템플릿 초기화와 협업 브랜치 흐름

- **id:** REQ-030
- **title:** 안전한 템플릿 초기화와 협업 브랜치 흐름
- **statement:** 프레임워크는 복사한 템플릿에서 로컬 Git과 훅을 안전하게 초기화하고, 1인·팀 프로필에 맞는 기본 브랜치·작업 브랜치 흐름을 안내·검증하며 사람이 학습할 수 있는 사용 가이드를 제공해야 한다.
- **rationale:** 자동 스테이징·커밋·신원 등록은 비밀정보와 책임자를 잘못 확정할 수 있고, 팀 전환 뒤 기본 브랜치 직접 작업은 검토 통제를 우회할 수 있다.
- **priority:** must
- **status:** implemented
- **owner:** DevOps·PM·AI 플랫폼
- **modules:** MOD-GOV, MOD-AI, MOD-CHG, MOD-DOC, MOD-QA
- **verification:** TC-023
- **acceptance_criteria:** 초기화는 local main과 훅만 만들고 자동 스테이징·커밋·신원 등록을 하지 않는다, 팀 프로필에서는 기본 브랜치 직접 커밋을 로컬에서 차단한다, 1인 프로필과 팀 프로필의 브랜치 규칙이 명시된다, 사람용 한글 템플릿 사용 가이드가 존재한다, Codex·Claude의 AI 정본 규칙이 동기화된다
- **source:** USER-2026-09-18

### REQ-031 — 프로젝트별 개발 기반 정본

- **id:** REQ-031
- **title:** 프로젝트별 개발 기반 정본
- **statement:** 프레임워크는 기술 스택과 분리된 메타 구조로 개발 표준, 골든 패스와 기한 있는 예외를 관리하고 프로젝트가 선택한 기술 기준선에 맞는 규칙과 실행 검증을 연결해야 한다.
- **rationale:** 기술 규칙을 템플릿에 고정하지 않으면서도 어느 AI와 개발자가 참여해도 동일한 품질 기준을 적용해야 한다.
- **priority:** must
- **status:** implemented
- **owner:** 아키텍처·개발·품질 보증
- **modules:** MOD-ARCH, MOD-DOC, MOD-DELIVERY, MOD-QA
- **verification:** TC-024
- **acceptance_criteria:** STD, GPH, EXC 레코드가 안정 ID와 기술 기준선, 모듈, 요구사항, 검증을 연결한다, 계약형과 정책형 표준을 구분하고 기술 스택 구체 규칙은 프로젝트 기준선에서 작성한다, 예외는 승인, 담당자, 만료일과 보완 통제 없이는 유효하지 않다
- **source:** USER-2026-09-18

### REQ-032 — 모듈별 UI·공통 컴포넌트 정본

- **id:** REQ-032
- **title:** 모듈별 UI·공통 컴포넌트 정본
- **statement:** 프레임워크는 UI 기준선, 패턴, 공통 컴포넌트와 모듈별 화면·매뉴얼을 구조화된 정본으로 관리하고 화면 정의서와 검토용 목업을 결정적으로 생성해야 한다.
- **rationale:** 사용자와 합의한 UI 품질을 모듈과 AI 도구에 걸쳐 재사용하고 운영 중 새 모듈에도 적용해야 한다.
- **priority:** must
- **status:** implemented
- **owner:** 제품·UX·아키텍처
- **modules:** MOD-ARCH, MOD-DOC, MOD-DELIVERY, MOD-QA
- **verification:** TC-025
- **acceptance_criteria:** UXB, UIP, CMP, SCR, MAN 참조와 상태 전이가 검증된다, UI가 없는 모듈은 UI 조각 없이 정상이고 필요할 때 빈 조각을 초기화할 수 있다, 목업은 실제 화면 증거와 구분되고 출시용 매뉴얼은 검증 증거를 요구한다
- **source:** USER-2026-09-18

### REQ-033 — 운영 런북과 제출 패키지 정책

- **id:** REQ-033
- **title:** 운영 런북과 제출 패키지 정책
- **statement:** 프레임워크는 운영 절차와 설계·사용자·운영 제출 패키지 정책을 구조화하고, 정본에서 결정적 런북과 검증 가능한 제출 manifest를 생성해야 한다.
- **rationale:** 검토용 목업과 출시용 실제 증거가 혼동되지 않고 대상별 산출물이 일관되게 조립돼야 한다.
- **priority:** must
- **status:** implemented
- **owner:** 문서화·운영·전달
- **modules:** MOD-DOC, MOD-DELIVERY, MOD-QA
- **verification:** TC-024, TC-025
- **acceptance_criteria:** RUN 레코드에 트리거, 절차, 검증, 롤백과 에스컬레이션이 있다, DLP 레코드는 포함·제외 범위와 목업·실제 캡처 정책을 구분한다, 실제 패키지 빌드 전에도 결정적 manifest로 정책을 검토할 수 있다
- **source:** USER-2026-09-18

### REQ-034 — 감사 가능한 작업 패키지 배정과 개발 범위 포괄성

- **id:** REQ-034
- **title:** 감사 가능한 작업 패키지 배정과 개발 범위 포괄성
- **statement:** 프레임워크는 팀 전환 전에 활성 PM을 보장하고 PM 배정·위임 배정·오프라인 협의 기반 자율 배정을 지원하며, 정책과 책임자 변경 이력을 보존하고 변경별 필수 작업 영역과 요구사항이 모든 미완료 작업 패키지에 빠짐없이 배정되었는지 개발 진입 전에 검증해야 한다.
- **rationale:** 배정되지 않은 요구사항이나 누락된 보안·데이터·배포·운영 작업은 아무도 수행하지 않으며, 현재 값만 보존하면 누가 언제 왜 책임을 바꿨는지 재구성할 수 없다.
- **priority:** must
- **status:** implemented
- **owner:** PM·개발·품질 보증
- **modules:** MOD-GOV, MOD-DOC, MOD-DELIVERY, MOD-QA, MOD-STATUS, MOD-CHG
- **verification:** TC-026
- **acceptance_criteria:** 팀 프로필에는 활성 PM이 최소 1명 존재한다, PM은 활성 팀원에게 배정 권한을 위임하거나 자율 배정으로 전환할 수 있다, 오프라인 협의 필수 표시는 자율 배정에만 적용된다, 배정 정책과 WRK 책임자 변경의 이전 값·변경자·시각·사유가 보존된다, 각 CHG는 프로젝트 맥락에 맞는 필수 작업 영역을 선언한다, 개발 진입 전에 모든 CHG 요구사항·필수 작업 영역·팀 책임자 누락을 차단한다, 배정 범위 안의 파생 요구는 현재 담당 WRK에 추가하고 범위를 넘으면 새 WRK 또는 범위 변경으로 처리한다, 생성 전달 계획에서 WRK의 요구사항·책임자·포괄 범위를 확인할 수 있다
- **source:** USER-2026-09-18

### REQ-035 — 변경 유형별 문서 동기화와 레거시 전환

- **id:** REQ-035
- **title:** 변경 유형별 문서 동기화와 레거시 전환
- **statement:** 프레임워크는 신규 기능의 분석·설계를 구현보다 먼저 완료하고, 기존 기능과 레거시 변경은 시스템 표면별 문서 상태에 따라 즉시 현행화하거나 기한 있는 후속 작업을 만들며, 커밋 전에 소스만 변경된 상태를 탐지해야 한다.
- **rationale:** 화면·API와 문서의 괴리를 방치하지 않으면서 문서가 없는 기존 시스템의 단계적 고도화를 현실적으로 지원한다.
- **priority:** must
- **status:** implemented
- **owner:** 문서화·변경관리·품질 보증
- **modules:** MOD-GOV, MOD-DOC, MOD-AI, MOD-CHG, MOD-QA, MOD-DELIVERY
- **verification:** TC-027
- **acceptance_criteria:** 신규 기능은 승인된 요구분석과 설계 및 최신 문서 없이 개발 진입할 수 없다, 기존 문서가 있는 표면은 같은 변경에서 현행화한다, 문서가 없는 기존 표면은 고객의 즉시 작성 또는 기한 있는 후속 작업 선택을 기록한다, 레거시 화면 경로·API·배치·이벤트·연동·마이그레이션을 모듈별로 조사하고 기존 문서의 출처를 보존해 변환한다, 커밋 전 검사에서 소스 변경과 문서 변경 또는 승인된 후속 작업의 연결을 검증한다
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

### CHG-009 — 안전한 템플릿 초기화와 협업 브랜치 흐름

- **id:** CHG-009
- **title:** 안전한 템플릿 초기화와 협업 브랜치 흐름
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-AI, MOD-CHG, MOD-DOC, MOD-QA
- **requirements:** REQ-030
- **required_gates:** TG-002
- **required_work_coverage:** design, implementation, test, documentation, security, migration, operations, training
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
- **impact:** 복사본의 안전한 Git 초기화, Codex·Claude 세션 진입 규칙, 팀 전환 뒤 작업 브랜치 강제, 사람이 읽는 템플릿 사용 가이드를 추가한다.
- **migration:** 기존 저장소는 project-init으로 훅을 다시 활성화하고 팀 프로필이면 다음 변경부터 작업 브랜치를 사용한다.
- **rollback:** project-init·pre-commit과 협업 브랜치 정책을 제거하되 이미 만든 Git 이력·참여 전환·기준선 커밋은 보존한다.
- **regression_scope:** Git 미초기화 복사본, 자동 스테이징·커밋 방지, 로컬 훅 경로, 1인·팀 브랜치 판정, AI 어댑터 동기화, 사용 가이드 링크

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

### CHG-012 — 감사 가능한 팀 작업 배정과 개발 범위 포괄성

- **id:** CHG-012
- **title:** 감사 가능한 팀 작업 배정과 개발 범위 포괄성
- **type:** feature
- **class:** C2
- **status:** done
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-DOC, MOD-DELIVERY, MOD-QA, MOD-STATUS, MOD-CHG
- **requirements:** REQ-034
- **required_gates:** TG-002
- **required_work_coverage:** design, implementation, test, documentation, migration, operations
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
- **impact:** 팀 전환의 PM 전제, PM·위임·자율 배정 모드, 정책·책임자 감사 이력, 변경별 필수 작업 영역, 파생 요구 편입과 개발 진입 포괄성 검사를 정본·CLI·생성 문서에 연결한다.
- **migration:** 기존 pm_controlled 정책과 WRK-012 책임자를 최초 감사 이벤트로 기준선화하고, 기존 변경에는 필수 작업 영역을 명시한다.
- **rollback:** 배정 이벤트를 내보내 보존한 뒤 정책 전환·감사 이력·포괄성 게이트 확장을 제거하고 기존 assignee 단일 필드로 복귀한다.
- **regression_scope:** 팀 전환 PM 필수, 세 가지 배정 모드, 오프라인 협의 적용 범위, 정책·책임자 변경 이력, 변경별 작업 영역, 개발 진입 차단, 생성 전달 계획, Codex·Claude 동기화

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

### ADR-002 — 생성 문서는 읽기 전용 투영으로 관리

- **id:** ADR-002
- **title:** 생성 문서는 읽기 전용 투영으로 관리
- **status:** accepted
- **date:** 2026-09-17
- **context:** 파생 문서를 사람이 직접 수정하면 서로 다른 정의가 생긴다.
- **options:** 양방향 동기화, 수동 조정, 단방향 결정적 생성
- **decision:** 정본에서 이해관계자용 문서를 단방향 생성하고 불일치가 있으면 검증에 실패시킨다.
- **consequences:** 생성 파일을 재현할 수 있다, 정교한 사실은 정본 레코드에 모델링해야 한다, 변경 비교가 계속 유용하다
- **rollback:** 새 결정을 통해 권위와 조정 규칙을 정의한 경우에만 생성 뷰를 직접 작성하는 산출물로 승격한다.
- **supersedes:** -
- **requirements:** REQ-002, REQ-015

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

### TC-002 — 결정적 최신 산출물 생성

- **id:** TC-002
- **title:** 결정적 최신 산출물 생성
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-002, REQ-015
- **evidence:** EVD-002

### TC-016 — 운영자·사용자·보안 가이드 결정적 생성

- **id:** TC-016
- **title:** 운영자·사용자·보안 가이드 결정적 생성
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-025
- **evidence:** EVD-015

### TC-023 — 안전한 템플릿 Git 초기화와 1인·팀 브랜치 정책

- **id:** TC-023
- **title:** 안전한 템플릿 Git 초기화와 1인·팀 브랜치 정책
- **type:** integration
- **status:** passed
- **required:** true
- **requirements:** REQ-030
- **evidence:** EVD-021

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

### TC-026 — 팀 작업 배정 권한·감사 이력·개발 범위 포괄성

- **id:** TC-026
- **title:** 팀 작업 배정 권한·감사 이력·개발 범위 포괄성
- **type:** scenario
- **status:** passed
- **required:** true
- **requirements:** REQ-034
- **evidence:** EVD-026
- **rule_mutation:**

```json
{
  "applicable": true,
  "rules": [
    "활성 PM 없이 팀 프로필로 전환할 수 없다",
    "자율 배정이 아닌 모드에 오프라인 협의 필수를 표시할 수 없다",
    "배정 정책·책임자 변경 이력 필드 누락을 거부한다",
    "CHG별 필수 작업 영역 누락과 WRK 포괄 범위 누락을 거부한다",
    "생성 전달 계획에서 요구사항·책임자·포괄 범위 누락을 탐지한다"
  ],
  "evidence": [
    "EVD-026"
  ]
}
```

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

### WRK-005 — 운영자·사용자·보안 가이드 자동 생성

- **id:** WRK-005
- **title:** 운영자·사용자·보안 가이드 자동 생성
- **type:** contract
- **status:** completed
- **module:** MOD-DOC
- **change:** CHG-006
- **requirements:** REQ-025
- **depends_on:** WRK-003
- **owner:** 운영·보안·제품
- **acceptance_criteria:** 세 가이드가 구조화된 정본에서 결정적으로 생성된다
- **evidence:** EVD-015

### WRK-014 — 변경 유형별 문서 동기화와 레거시 전환 통제

- **id:** WRK-014
- **title:** 변경 유형별 문서 동기화와 레거시 전환 통제
- **type:** governance
- **status:** completed
- **module:** MOD-DOC
- **change:** CHG-013
- **requirements:** REQ-035
- **depends_on:** WRK-003, WRK-005, WRK-013
- **owner:** 문서화·변경관리·품질 보증
- **assignee:** HUM-001
- **coverage:** design, implementation, test, documentation, migration, operations, training
- **acceptance_criteria:** CHG delivery_path가 신규·기존·결함·레거시·내부·거버넌스 경로를 구분한다, 모듈별 시스템 표면과 레거시 인벤토리 계획을 정본으로 관리한다, 문서가 없는 기존 표면의 후속 작성에는 대상 문서와 마감이 있는 WRK가 필요하다, pre-commit이 staged 제품 소스와 staged 문서 또는 후속 작업 연결을 검사한다, 레거시 문서 변환 스킬과 자연어 사용 지침을 제공한다
- **evidence:** EVD-028

## 기능 요건 정의서 공통 항목

### 기능 개요와 범위

AIDD Kit은 고객과 AI가 소프트웨어 제품의 의도부터 운영·개선까지 함께 관리하도록 돕는 재사용 가능한 개발·운영 키트다.

### 처리 흐름·업무 규칙·예외

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.

### 인수 기준과 금지되는 결과

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.
