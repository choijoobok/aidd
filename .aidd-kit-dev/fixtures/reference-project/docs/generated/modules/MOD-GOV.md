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
| REQ-028 | 1인·팀 프로젝트의 가역적 협업 전환 | implemented | TC-021 |
| REQ-029 | Git·호스팅 신원과 협업 참여자 대조 | implemented | TC-022 |
| REQ-030 | 안전한 템플릿 초기화와 협업 브랜치 흐름 | implemented | TC-023 |
| REQ-034 | 감사 가능한 작업 패키지 배정과 개발 범위 포괄성 | implemented | TC-026 |
| REQ-035 | 변경 유형별 문서 동기화와 레거시 전환 | implemented | TC-027 |

## 작업 항목

| 작업 | 제목 | 상태 | 책임 참여자 | 변경 | 요구사항 | 포괄 범위 | 선행 작업 | 증거 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WRK-001 | 게이트 실행과 증거 무결성 강제 | completed | - | CHG-004 | REQ-022 | - | - | EVD-008, EVD-009 |
| WRK-010 | 1인·팀 협업 프로필 양방향 전환 | completed | - | CHG-007 | REQ-028 | - | WRK-001, WRK-008 | EVD-019 |
| WRK-013 | 팀 작업 배정·감사 이력·포괄성 게이트 | completed | HUM-001 | CHG-012 | REQ-034 | design, implementation, test, documentation, migration, operations | WRK-003, WRK-010, WRK-011 | EVD-026 |

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
| CHG-007 | C2 | in_progress | 1인·팀 협업 프로필의 가역적 전환 |
| CHG-008 | C2 | in_progress | Git 신원과 협업 참여자 대조 통제 |
| CHG-009 | C2 | in_progress | 안전한 템플릿 초기화와 협업 브랜치 흐름 |
| CHG-010 | C2 | in_progress | 모듈별 정본 분할과 확장 가능한 명세 |
| CHG-012 | C2 | done | 감사 가능한 팀 작업 배정과 개발 범위 포괄성 |
| CHG-013 | C2 | in_progress | 변경 유형별 분석·설계 진입과 레거시 문서 현행화 통제 |

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

## 관련 테스트

| ID | 상태 | 제목 |
| --- | --- | --- |
| TC-001 | passed | 정본 그래프와 상태 뷰 검증 |
| TC-004 | not_run | 요구 발굴 인터뷰와 트레이드오프 실제 AI 행동 평가 |
| TC-005 | passed | 결정 대체와 기존 시스템 변경 정본 전이 시나리오 |
| TC-009 | passed | 방법론 비교와 AIDD 통제 연결 검증 |
| TC-012 | passed | 게이트 실행·증거·승인 우회 방지 |
| TC-013 | passed | 정본 참조와 증거 무결성 부정 테스트 |
| TC-015 | passed | 모듈 상세 실행 계획과 참조 무결성 |
| TC-021 | passed | 1인·팀 협업 프로필 양방향 전환과 ruleset 생성 |
| TC-022 | passed | Git 신원 매핑·미등록 탐지·사람 수 분리 |
| TC-023 | passed | 안전한 템플릿 Git 초기화와 1인·팀 브랜치 정책 |
| TC-026 | passed | 팀 작업 배정 권한·감사 이력·개발 범위 포괄성 |
| TC-027 | passed | 변경 유형별 분석·설계·문서 동기화와 레거시 전환 통제 |

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
- **requirements:** REQ-001, REQ-003, REQ-005, REQ-006, REQ-007, REQ-014, REQ-017, REQ-019, REQ-022, REQ-024, REQ-028, REQ-029, REQ-030, REQ-034, REQ-035

## 요구사항 상세

### REQ-001 — 프로젝트 정본 레코드

- **id:** REQ-001
- **title:** 프로젝트 정본 레코드
- **statement:** 프레임워크는 의도, 요구사항, 설계, 결정, 위험, 작업, 테스트, 릴리스와 유지보수 이력을 기계가 읽을 수 있는 정본 레코드로 관리해야 한다.
- **rationale:** 정규화된 하나의 정본은 서술형 산출물 사이의 불일치를 방지한다.
- **priority:** must
- **status:** specified
- **owner:** 거버넌스
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
- **owner:** 감리
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
- **owner:** 제품
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
- **owner:** 거버넌스
- **modules:** MOD-GOV, MOD-CHG
- **verification:** TC-005
- **acceptance_criteria:** 승인된 결정에 결과와 롤백 지침이 있다, 대체된 레코드를 보존한다
- **source:** USER-2026-09-17

### REQ-007 — 미결사항 추적

- **id:** REQ-007
- **title:** 미결사항 추적
- **statement:** 프레임워크는 해결되지 않은 질문, 담당자, 기한, 차단 영향과 해결 링크를 기록해야 한다.
- **rationale:** 답하지 않은 질문은 의도적으로 해결할 때까지 보여야 한다.
- **priority:** must
- **status:** specified
- **owner:** PM
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
- **owner:** 거버넌스
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
- **owner:** 감리
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
- **owner:** 거버넌스
- **modules:** MOD-GOV, MOD-DISC, MOD-ARCH
- **verification:** TC-009
- **acceptance_criteria:** 전통적 방법론과 AI 주도 방법론을 동일한 기준으로 비교한다, 채택한 통제가 AIDD 단계·게이트·정본 증거에 연결된다, 프로젝트 특성에 따른 예측형·적응형·혼합형 수행 경로 선택 규칙이 있다
- **source:** USER-2026-09-17

### REQ-022 — 실행 가능한 게이트와 증거 무결성

- **id:** REQ-022
- **title:** 실행 가능한 게이트와 증거 무결성
- **statement:** 프레임워크는 변경별 게이트 실행, 판정 기준, 증거, 승인과 예외를 구조화하고 승인되지 않았거나 증거가 없는 상태가 릴리스 준비 완료로 계산되지 않게 해야 한다.
- **rationale:** 정책 문서와 상태 문자열만으로는 게이트 우회와 근거 없는 완료 선언을 막을 수 없다.
- **priority:** must
- **status:** implemented
- **owner:** 거버넌스·품질 보증
- **modules:** MOD-GOV, MOD-QA, MOD-STATUS
- **verification:** TC-012, TC-013
- **acceptance_criteria:** 승인된 게이트의 모든 통과 기준에 유효한 증거가 연결된다, 증거에는 수행자·명령 또는 방법·시각·커밋·결과가 있다, 미승인·거절·만료 게이트와 유효하지 않은 예외는 릴리스를 차단한다, 알 수 없는 정본 참조와 증거 없는 통과 상태는 검증에 실패한다
- **source:** AUDIT-2026-09-18

### REQ-024 — 모듈 단위 상세 실행 계획과 진척 추적

- **id:** REQ-024
- **title:** 모듈 단위 상세 실행 계획과 진척 추적
- **statement:** 프레임워크는 모듈별 마일스톤, 작업, 인터페이스와 전달 의존성을 요구사항·변경·증거에 연결해 독립적으로 계획하고 브리핑해야 한다.
- **rationale:** 모듈의 단일 상태만으로는 실제 남은 작업, 차단 관계와 통합 영향을 판단할 수 없다.
- **priority:** must
- **status:** implemented
- **owner:** PM·아키텍처
- **modules:** MOD-GOV, MOD-STATUS
- **verification:** TC-015
- **acceptance_criteria:** 작업은 단일 담당 모듈과 변경·요구사항·인수 기준을 가진다, 완료 작업은 구조화된 증거를 가진다, 모듈 뷰에서 요구사항·작업·의존성을 함께 확인한다
- **source:** AUDIT-2026-09-18

### REQ-028 — 1인·팀 프로젝트의 가역적 협업 전환

- **id:** REQ-028
- **title:** 1인·팀 프로젝트의 가역적 협업 전환
- **statement:** 프레임워크는 활성 사람 참여자가 1명이면 1인 프로젝트 통제를, 2명 이상이면 팀 프로젝트 통제를 적용하고 참여자 증감에 따라 양방향으로 전환하며 이력과 저장소 규칙을 함께 갱신해야 한다.
- **rationale:** 고정된 사람 승인 규칙은 1인 프로젝트를 막거나 팀 프로젝트의 상호 검토를 약화시킨다.
- **priority:** must
- **status:** implemented
- **owner:** PM·DevOps·품질 보증
- **modules:** MOD-GOV, MOD-CHG, MOD-QA, MOD-STATUS
- **verification:** TC-021
- **acceptance_criteria:** 활성 참여자 1명은 사람 승인 0명의 1인 프로필을 적용한다, 두 번째 활성 참여자가 생기면 최소 1명 승인의 팀 프로필로 전환한다, 다시 1명이 되면 1인 프로필로 복귀한다, 모든 참여자 변경과 프로필 전환 이력이 보존된다, 현재 프로필에서 ruleset이 결정적으로 생성된다
- **source:** USER-2026-09-18

### REQ-029 — Git·호스팅 신원과 협업 참여자 대조

- **id:** REQ-029
- **title:** Git·호스팅 신원과 협업 참여자 대조
- **statement:** 프레임워크는 Git 작성자·커미터와 호스팅 계정을 사람 참여자 또는 봇에 명시적으로 연결하고, 설명되지 않은 신원을 자동으로 팀원으로 단정하지 않으면서 경고·고위험 변경·릴리스 통제에 반영해야 한다.
- **rationale:** 여러 Git 아이디가 한 사람의 별칭인지 실제 미등록 팀원인지 봇인지 확인하지 않으면 1인·팀 통제와 승인 독립성을 잘못 판단할 수 있다.
- **priority:** must
- **status:** implemented
- **owner:** PM·DevOps·품질 보증
- **modules:** MOD-GOV, MOD-CHG, MOD-QA, MOD-STATUS
- **verification:** TC-022
- **acceptance_criteria:** Git 이름과 이메일 쌍을 기존 HUM 참여자 또는 봇에 연결한다, 미등록 신원만으로 참여자나 팀 프로필을 자동 생성하지 않는다, 미등록 신원과 참여자 이탈 뒤의 새 커밋은 경고되고 C2·C3 개발 진입과 릴리스를 차단한다, 봇 신원은 활성 사람 수에서 제외한다, Git에서 알 수 없는 실제 push·PR 행위자는 호스팅 제공자 증거와 별도로 대조한다
- **source:** USER-2026-09-18

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
- **impact:** 게이트 정의와 변경별 실행을 분리하고 증거·승인·예외를 구조화하여 상태값만으로 완료를 우회할 수 없게 한다.
- **migration:** 기존 통과 테스트의 자유문자 증거를 EVD 레코드로 이관하고 기존 C2 변경에 미결 게이트 실행을 생성한다.
- **rollback:** gate-runs.json·evidence.json·approvals.json과 연결 검증을 제거하고 tests.json 증거를 이전 문자열 형식으로 되돌린다.
- **regression_scope:** 정본 로딩, 테스트 증거, 게이트 승인, 릴리스 차단, 상태·생성 문서, AI 스킬

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

### CHG-007 — 1인·팀 협업 프로필의 가역적 전환

- **id:** CHG-007
- **title:** 1인·팀 협업 프로필의 가역적 전환
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-CHG, MOD-QA, MOD-STATUS
- **requirements:** REQ-028
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
- **impact:** 활성 사람 참여자 수에 따라 1인·팀 협업 프로필, 사람 승인 수와 AI 독립 검토를 전환하고 전환 이력과 GitHub ruleset을 재생성한다.
- **migration:** 현재 프로젝트 책임자 1명을 활성 참여자로 기준선화하고 이후 참여·이탈은 collaboration-member 명령으로 기록한다.
- **rollback:** 협업 정본과 생성 규칙을 제거하고 repository.json의 고정 승인 정책으로 복귀하되 참여자·전환 이력은 내보내 보존한다.
- **regression_scope:** 협업 프로필 선택, 참여자 이력, 1인·팀 양방향 전환, ruleset 승인 수, 상태·협업 문서, 정본 참조

### CHG-008 — Git 신원과 협업 참여자 대조 통제

- **id:** CHG-008
- **title:** Git 신원과 협업 참여자 대조 통제
- **type:** feature
- **class:** C2
- **status:** in_progress
- **requested_by:** 고객
- **modules:** MOD-GOV, MOD-CHG, MOD-QA, MOD-STATUS
- **requirements:** REQ-029
- **required_gates:** TG-002
- **required_work_coverage:** design, implementation, test, documentation, security, migration, operations
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
- **impact:** Git 작성자·커미터를 사람 참여자 또는 봇 매핑과 대조하고 미등록 신원을 상태·개발 진입·릴리스 통제에 반영한다.
- **migration:** 현재 joobok Git 신원을 HUM-001의 기준선 별칭으로 등록하고 이후 별칭·봇·호스팅 계정은 collaboration-identity 명령으로 추가한다.
- **rollback:** 신원 정책·매핑·이벤트와 대조 명령을 제거하되 확인했던 신원 목록과 감사 이력을 내보내 보존한다.
- **regression_scope:** Git 작성자·커미터 스캔, 사람·봇·별칭 분류, 미등록 신원 경고, C2·C3 개발 차단, 릴리스 차단, 협업 상태·생성 문서

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
- **decision:** 분석·설계에서 품질 속성과 제약을 확정한 뒤 TG-001로 기술 기준선을 승인하고, TG-002로 UI·아키텍처·보안·테스트·관측성·배포 공통 기반을 검증한 후 기능 증분을 개발한다.
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

### TC-012 — 게이트 실행·증거·승인 우회 방지

- **id:** TC-012
- **title:** 게이트 실행·증거·승인 우회 방지
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

### TC-021 — 1인·팀 협업 프로필 양방향 전환과 ruleset 생성

- **id:** TC-021
- **title:** 1인·팀 협업 프로필 양방향 전환과 ruleset 생성
- **type:** scenario
- **status:** passed
- **required:** true
- **requirements:** REQ-028
- **evidence:** EVD-019

### TC-022 — Git 신원 매핑·미등록 탐지·사람 수 분리

- **id:** TC-022
- **title:** Git 신원 매핑·미등록 탐지·사람 수 분리
- **type:** scenario
- **status:** passed
- **required:** true
- **requirements:** REQ-029
- **evidence:** EVD-020

### TC-023 — 안전한 템플릿 Git 초기화와 1인·팀 브랜치 정책

- **id:** TC-023
- **title:** 안전한 템플릿 Git 초기화와 1인·팀 브랜치 정책
- **type:** integration
- **status:** passed
- **required:** true
- **requirements:** REQ-030
- **evidence:** EVD-021

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

### WRK-001 — 게이트 실행과 증거 무결성 강제

- **id:** WRK-001
- **title:** 게이트 실행과 증거 무결성 강제
- **type:** governance
- **status:** completed
- **module:** MOD-GOV
- **change:** CHG-004
- **requirements:** REQ-022
- **depends_on:** -
- **owner:** 거버넌스·품질 보증
- **acceptance_criteria:** 증거 없는 통과와 승인 우회를 검증기가 거부한다
- **evidence:** EVD-008, EVD-009

### WRK-010 — 1인·팀 협업 프로필 양방향 전환

- **id:** WRK-010
- **title:** 1인·팀 협업 프로필 양방향 전환
- **type:** governance
- **status:** completed
- **module:** MOD-GOV
- **change:** CHG-007
- **requirements:** REQ-028
- **depends_on:** WRK-001, WRK-008
- **owner:** PM·DevOps·품질 보증
- **acceptance_criteria:** 활성 참여자 수로 협업 프로필을 결정한다, 팀원 참여와 이탈 모두 이력을 남긴다, 현재 프로필에서 ruleset을 재생성한다
- **evidence:** EVD-019

### WRK-013 — 팀 작업 배정·감사 이력·포괄성 게이트

- **id:** WRK-013
- **title:** 팀 작업 배정·감사 이력·포괄성 게이트
- **type:** governance
- **status:** completed
- **module:** MOD-GOV
- **change:** CHG-012
- **requirements:** REQ-034
- **depends_on:** WRK-003, WRK-010, WRK-011
- **owner:** PM·개발·품질 보증
- **assignee:** HUM-001
- **coverage:** design, implementation, test, documentation, migration, operations
- **acceptance_criteria:** 팀 전환 전에 활성 PM을 검증한다, PM 배정·위임 배정·자율 배정의 권한을 구분한다, 오프라인 협의는 자율 배정에만 필수로 표시한다, 정책과 WRK 책임자 변경 이력을 보존한다, CHG별 필수 작업 영역과 모든 요구사항·미완료 WRK 책임자 누락을 개발 진입에서 차단한다, 생성 전달 계획과 협업 문서에서 요구사항·포괄 범위·변경 이력을 확인한다
- **evidence:** EVD-026

## 기능 요건 정의서 공통 항목

### 기능 개요와 범위

AIDD Kit은 고객과 AI가 소프트웨어 제품의 의도부터 운영·개선까지 함께 관리하도록 돕는 재사용 가능한 개발·운영 키트다.

### 처리 흐름·업무 규칙·예외

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.

### 인수 기준과 금지되는 결과

미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요.
