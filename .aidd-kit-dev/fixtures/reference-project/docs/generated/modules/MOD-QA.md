<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# MOD-QA — 검증과 품질 보증

- 상태: in_progress
- 목적: 테스트, 보안, 감리, 추적성, 동시성·성능·장애와 위험 기반 품질 증거를 제공한다.
- 의존 모듈: MOD-GOV

## 요구사항

| 요구사항 | 제목 | 상태 | 검증 |
| --- | --- | --- | --- |
| REQ-003 | 생애주기 전체 추적성 | specified | TC-001 |
| REQ-010 | 기존 시스템과 유지보수 변경 | specified | TC-005 |
| REQ-012 | 병합 영향 이력 | specified | TC-006 |
| REQ-014 | 다분야 역할 관점 | specified | TC-001 |
| REQ-016 | 설계 단계의 보안·데이터·인프라·운영 | specified | TC-001 |
| REQ-017 | 위험 비례 품질 게이트 | specified | TC-001 |
| REQ-018 | 증거 기반 출시와 운영 | specified | TC-001 |
| REQ-021 | 동시성·트랜잭션·성능 위험의 설계 예방 | implemented | TC-011 |
| REQ-022 | 실행 가능한 게이트와 증거 무결성 | implemented | TC-012, TC-013 |
| REQ-023 | Git과 CI 품질 게이트 강제 | implemented | TC-006, TC-014 |
| REQ-025 | 운영자·사용자·보안 가이드의 정본 기반 생성 | implemented | TC-016 |
| REQ-026 | Codex·Claude 행동 품질 동등성 평가 | specified | TC-004, TC-017, TC-018 |
| REQ-027 | 기본 브랜치 보호와 필수 CI 검사 | specified | TC-019, TC-020 |
| REQ-031 | 프로젝트별 개발 기반 정본 | implemented | TC-024 |
| REQ-032 | 모듈별 UI·공통 컴포넌트 정본 | implemented | TC-025 |
| REQ-033 | 운영 런북과 제출 패키지 정책 | implemented | TC-024, TC-025 |
| REQ-035 | 변경 유형별 문서 동기화와 레거시 전환 | implemented | TC-027 |

## 작업 항목

| 작업 | 제목 | 상태 | 변경 | 요구사항 | 포괄 범위 | 선행 작업 | 증거 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WRK-004 | 결정 대체와 개발 시작 차단 합성 시나리오 | completed | CHG-006 | REQ-006, REQ-010, REQ-011 | - | WRK-001 | EVD-013, EVD-014 |

## 인터페이스

| ID | 이름 | 상태 | 제공 | 소비 | 호환성 |
| --- | --- | --- | --- | --- | --- |
| IFC-001 | 정본-생성 문서 계약 | current | MOD-GOV | MOD-DOC, MOD-STATUS, MOD-QA | 필드 변경 시 생성기·검증·테스트·산출물 목록을 같은 변경에서 갱신한다. |
| IFC-002 | 공통 AI 스킬-플랫폼 어댑터 계약 | current | MOD-AI | MOD-DISC, MOD-ARCH, MOD-DELIVERY, MOD-QA, MOD-STATUS | 플랫폼 전용 지침과 훅은 얇게 유지하고 공통 수행 규칙은 AGENTS.md, 공통 스킬 의미는 .ai/skills에 둔다. |
| IFC-003 | CI-브랜치 보호 계약 | current | MOD-QA | MOD-CHG | 작업 이름 변경 시 repository.json과 ruleset을 함께 변경한다. |
| IFC-004 | 개발 기반 정본-파생 산출물 계약 | current | MOD-ARCH | MOD-DOC, MOD-DELIVERY, MOD-QA | 필드나 상태 전이를 바꾸면 로더·검증기·생성기·산출물 카탈로그와 TC-024·TC-025를 같은 변경에서 갱신한다. |

## 모듈 의존성

| ID | 출발 | 도착 | 상태 | 설명 |
| --- | --- | --- | --- | --- |

## 관련 변경

| ID | 등급 | 상태 | 제목 |
| --- | --- | --- | --- |
| CHG-001 | C2 | in_progress | AIDD 기반 구조 수립 |
| CHG-002 | C2 | in_progress | 기술 스택 게이트와 방법론 분석 보강 |
| CHG-003 | C2 | in_progress | 배포 환경과 설계 위험 예방 게이트 보강 |
| CHG-004 | C2 | in_progress | 실행 가능한 게이트와 증거 무결성 |
| CHG-005 | C2 | in_progress | Git 병합 훅과 GitHub CI 강제 |
| CHG-006 | C2 | in_progress | 프로젝트 착수 전 실행 기반 완성 |
| CHG-010 | C2 | in_progress | 모듈별 정본 분할과 확장 가능한 명세 |
| CHG-011 | C2 | in_progress | 프로젝트 개발 기반·UI·운영·제출 정본 체계 |
| CHG-013 | C2 | in_progress | 변경 유형별 분석·설계 진입과 레거시 문서 현행화 통제 |

## 관련 결정

| ID | 상태 | 제목 |
| --- | --- | --- |
| ADR-001 | accepted | 구조화된 JSON 레지스트리를 정본으로 사용 |
| ADR-004 | accepted | 역할을 증거 생성 관점으로 취급 |
| ADR-005 | accepted | 변경 등급에 따라 엄격성 조정 |
| ADR-006 | accepted | 기술 스택과 개발 기반을 기능 개발 전에 게이트로 확정 |
| ADR-007 | accepted | 단일 방법론 대신 상황 적응형 혼합 통제 사용 |
| ADR-008 | accepted | 기술 선택 전에 배포·운영 맥락을 게이트로 확인 |
| ADR-009 | accepted | 모듈별 요구사항 조각과 생성 명세 사용 |
| ADR-010 | accepted | 개발 기반 정본과 모듈별 UI 조각을 분리해 생성 |
| ADR-012 | accepted | 구현 표면 기반 문서 동기화와 레거시 단계 전환 |

## 관련 테스트

| ID | 상태 | 제목 |
| --- | --- | --- |
| TC-001 | passed | 정본 그래프와 상태 뷰 검증 |
| TC-004 | not_run | 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가 |
| TC-005 | passed | 결정 대체와 기존 시스템 변경 정본 전이 시나리오 |
| TC-006 | passed | 병합 커밋 기록·영향 평가·재검토 이력 |
| TC-011 | passed | 동시성·트랜잭션·성능 위험 카탈로그 검증 |
| TC-012 | passed | 게이트 실행·증거·게이트 우회 방지 |
| TC-013 | passed | 정본 참조와 증거 무결성 부정 테스트 |
| TC-014 | passed | 병합 훅 인자와 GitHub CI 정의 검증 |
| TC-016 | passed | 운영자·사용자·보안 가이드 결정적 생성 |
| TC-017 | not_run | Codex·Claude 실제 교차 행동 평가 |
| TC-018 | passed | AI 교차 평가 하네스와 공통 루브릭 검증 |
| TC-019 | passed | GitHub 브랜치 보호 구성과 CI 이름 정합성 |
| TC-020 | failed | GitHub 브랜치 보호 원격 활성화 검증 |
| TC-024 | passed | 개발 표준·골든 패스·예외·런북·제출 프로필 정본 검증 |
| TC-025 | passed | 모듈별 UI 정본과 결정적 화면·매뉴얼 생성 |
| TC-027 | passed | 변경 유형별 분석·설계·문서 동기화와 레거시 전환 통제 |

## UI 정본

- 화면: 0개
- 매뉴얼: 0개

## 모듈 정본

### MOD-QA — 검증과 품질 보증

- **id:** MOD-QA
- **name:** 검증과 품질 보증
- **purpose:** 테스트, 보안, 감리, 추적성, 동시성·성능·장애와 위험 기반 품질 증거를 제공한다.
- **status:** in_progress
- **dependencies:** MOD-GOV
- **requirements:** REQ-003, REQ-010, REQ-012, REQ-014, REQ-016, REQ-017, REQ-018, REQ-021, REQ-022, REQ-023, REQ-025, REQ-026, REQ-027, REQ-031, REQ-032, REQ-033, REQ-035

## 요구사항 상세

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

### REQ-025 — 운영자·사용자·보안 가이드의 정본 기반 생성

- **id:** REQ-025
- **title:** 운영자·사용자·보안 가이드의 정본 기반 생성
- **statement:** 프레임워크는 운영자 가이드와 런북, 사용자 매뉴얼, 보안 모델과 검증 가이드를 구조화된 정본에서 생성하고 변경과 함께 현행화해야 한다.
- **rationale:** 직접 작성된 가이드만 두면 기능·운영·보안 변경에서 쉽게 누락되고 정본과 모순된다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-DOC, MOD-DELIVERY, MOD-QA
- **verification:** TC-016
- **acceptance_criteria:** 세 대상별 가이드가 정본 출처를 가진다, 가이드 생성이 결정적이며 드리프트를 검출한다, 운영 절차에 검증·복구·병합 영향 대응이 포함된다
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

### REQ-033 — 운영 런북과 제출 패키지 정책

- **id:** REQ-033
- **title:** 운영 런북과 제출 패키지 정책
- **statement:** 프레임워크는 운영 절차와 설계·사용자·운영 제출 패키지 정책을 구조화하고, 정본에서 결정적 런북과 검증 가능한 제출 manifest를 생성해야 한다.
- **rationale:** 검토용 목업과 출시용 실제 증거가 혼동되지 않고 대상별 산출물이 일관되게 조립돼야 한다.
- **priority:** must
- **status:** implemented
- **modules:** MOD-DOC, MOD-DELIVERY, MOD-QA
- **verification:** TC-024, TC-025
- **acceptance_criteria:** RUN 레코드에 트리거, 절차, 검증, 롤백과 에스컬레이션이 있다, DLP 레코드는 포함·제외 범위와 목업·실제 캡처 정책을 구분한다, 실제 패키지 빌드 전에도 결정적 manifest로 정책을 검토할 수 있다
- **source:** USER-2026-09-18

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

### TC-006 — 병합 커밋 기록·영향 평가·재검토 이력

- **id:** TC-006
- **title:** 병합 커밋 기록·영향 평가·재검토 이력
- **type:** integration
- **status:** passed
- **required:** true
- **requirements:** REQ-012, REQ-023
- **evidence:** EVD-011

### TC-011 — 동시성·트랜잭션·성능 위험 카탈로그 검증

- **id:** TC-011
- **title:** 동시성·트랜잭션·성능 위험 카탈로그 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-021
- **evidence:** EVD-007

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

### TC-014 — 병합 훅 인자와 GitHub CI 정의 검증

- **id:** TC-014
- **title:** 병합 훅 인자와 GitHub CI 정의 검증
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-023
- **evidence:** EVD-010

### TC-016 — 운영자·사용자·보안 가이드 결정적 생성

- **id:** TC-016
- **title:** 운영자·사용자·보안 가이드 결정적 생성
- **type:** automated
- **status:** passed
- **required:** true
- **requirements:** REQ-025
- **evidence:** EVD-015

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

### WRK-004 — 결정 대체와 개발 시작 차단 합성 시나리오

- **id:** WRK-004
- **title:** 결정 대체와 개발 시작 차단 합성 시나리오
- **type:** contract
- **status:** completed
- **module:** MOD-QA
- **change:** CHG-006
- **requirements:** REQ-006, REQ-010, REQ-011
- **depends_on:** WRK-001
- **acceptance_criteria:** 결정 대체 순환을 거부한다, 미통과 필수 게이트가 구현 시작을 차단한다
- **evidence:** EVD-013, EVD-014

## 기능 상세 명세서 공통 항목

### 기능 개요와 연결 제품 요구사항

AIDD Kit은 고객과 AI가 소프트웨어 제품의 의도부터 운영·개선까지 함께 관리하도록 돕는 재사용 가능한 개발·운영 키트다.

### 처리 흐름·업무 규칙·예외

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.

### 인수 기준과 금지되는 결과

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.
