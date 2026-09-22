<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 통합 용어 사전

AIDD 공통 용어와 프로젝트 전용 용어를 한 곳에서 찾는 읽기용 파생 문서입니다. 두 영역의 정본과 변경 권한은 분리됩니다.

## AIDD 공통 용어 — 프로젝트에서 변경할 수 없음

- 정본: `.ai/manifests/terminology.json`
- 변경: kit-source의 KIT-CHG 절차만 허용

| ID | 용어 | 이름 | 분류 | 정의 | 별칭 | 독자 | 출처 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AIDD-TERM-001 | AIDD | AI 주도 개발 | 방법론 | 의도·요구·설계·구현·검증·운영을 구조화된 정본과 증거로 연결해 AI와 사람이 함께 수행하는 개발 방식이다. | AI-Driven Development | project_team, developer, operator | .ai/spec/purpose-and-boundaries.md |
| AIDD-TERM-002 | SSOT | 정본 | 정본 | 같은 사실을 한 곳에서만 정의하는 유일한 진실의 원천이다. | Single Source of Truth | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-003 | REQ | 제품 요구사항 | 추적성 ID | 제품이나 시스템이 제공해야 하는 사용자 가치와 관찰 가능한 결과, 인수 기준을 식별한다. AIDD에서 수식어 없는 요구사항은 REQ를 뜻한다. | - | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-004 | NFR | 비기능 요구사항 | 추적성 ID | 성능·보안·신뢰성·운영성처럼 기능의 품질 수준과 제약을 식별한다. | Non-Functional Requirement | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-005 | MOD | 모듈 | 추적성 ID | 책임·정본·인터페이스와 진행 상태를 독립적으로 관리하는 시스템 범위다. | - | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-006 | CHG | 변경 | 변경 관리 | 문제·의도·범위·위험·검증과 롤백을 함께 추적하는 변경 단위다. | 변경 요청 | project_team, developer, operator | .ai/spec/change-sharing.md |
| AIDD-TERM-007 | ADR | 결정 기록 | 의사결정 | 중요한 선택의 맥락·대안·결정·결과·롤백을 보존하는 기록이다. | Architecture Decision Record | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-008 | OI | 미결 항목 | 의사결정 | 답이나 조치가 남아 있어 추적해야 하는 질문·결정·작업이다. | Open Item | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-009 | ASM | 가정 | 의사결정 | 검증되지 않았지만 임시로 참으로 두며 확인 기한과 영향을 추적하는 전제다. | Assumption | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-010 | RSK | 위험 | 거버넌스 | 발생 가능성과 영향, 완화·수용 여부를 관리하는 불확실한 사건이다. | Risk | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-011 | TST | 테스트 | 검증 | 요구와 계약이 실제로 충족되는지 실행 가능한 조건과 결과로 확인하는 항목이다. | 테스트 케이스 | project_team, developer | .ai/spec/conformance.md |
| AIDD-TERM-012 | EVD | 증거 | 검증 | 누가 언제 어떤 환경과 명령으로 무엇을 확인했는지 입증하는 실행·검토 기록이다. | Evidence | project_team, developer, operator | .ai/spec/conformance.md |
| AIDD-TERM-013 | GTR | 게이트 실행 | 게이트 | 특정 변경이나 범위에 대해 게이트 기준별 판정과 증거를 남긴 실행 기록이다. | Gate Run | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-014 | WRK | 작업 항목 | 계획 | 담당·선행 조건·완료 조건·증거를 가진 수행 단위다. | Work Item | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-015 | MLS | 마일스톤 | 계획 | 여러 작업과 결과를 묶어 일정과 완료 조건을 추적하는 이정표다. | Milestone | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-016 | IFC | 인터페이스 계약 | 아키텍처 | 모듈이나 외부 시스템 사이의 입력·출력·호환성·실패 동작을 정의한다. | Interface Contract | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-017 | DPN | 의존성 | 아키텍처 | 한 모듈·작업·계약이 다른 대상에 기대는 방향과 조건을 기록한다. | Dependency | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-018 | SURF | 시스템 표면 | 문서화 | 화면·API·배치·이벤트·연동처럼 사용자나 다른 시스템이 접하는 구현 표면이다. | System Surface | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-019 | SCR | 화면 명세 | UI | 연결된 제품 요구사항과 유즈케이스를 특정 사용자 진입점의 상태·정보·행동·오류·접근성 계약으로 구체화한 정본이다. | Screen Specification | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-020 | MAN | 사용자 절차 | 사용자 문서 | 사용자가 업무를 완료하도록 사전 조건·단계·예상 결과·복구를 설명하는 절차다. | Manual | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-021 | DLP | 전달 프로필 | 제출 | 독자별 산출물 포함·제외·검증·공개 범위를 정의하는 제출 정책이다. | Delivery Profile | project_team, developer, operator | .ai/spec/distribution-layout.md |
| AIDD-TERM-022 | GPH | 골든 패스 | 개발 기반 | 대표 기능을 안전하게 구현·검증하는 권장 절차와 예시다. | Golden Path | developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-023 | STD | 개발 표준 | 개발 기반 | 코드·오류·보안·테스트·관측성·배포에 반복 적용하는 기준이다. | Standard | developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-024 | UXB | UX 기준선 | UI | 사용자 여정·정보 구조·접근성·레이아웃의 공통 결정 기준이다. | UX Baseline | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-025 | UIP | UI 패턴 | UI | 여러 화면에서 재사용하는 상호작용과 상태 표현 규칙이다. | UI Pattern | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-026 | CMP | 공통 컴포넌트 | UI | 현재 유효한 계약과 상태를 갖고 여러 화면에서 재사용하는 UI 구성 요소다. | Component | developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-027 | MRG | 병합 기록 | 통합 | 병합 커밋의 부모·변경·충돌 해결·영향 평가를 보존하는 기록이다. | Merge Record | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-028 | MRC | 병합 후 재검토 | 통합 | 병합 영향으로 다시 수행해야 하는 검토나 테스트 항목이다. | Merge Recheck | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-029 | C0 | 경미한 변경 | 변경 등급 | 의미·계약·실행 동작에 영향을 주지 않는 낮은 위험의 변경 등급이다. | - | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-030 | C1 | 국소 변경 | 변경 등급 | 영향 범위가 제한적이고 기존 계약을 유지하는 변경 등급이다. | - | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-031 | C2 | 중요 변경 | 변경 등급 | 여러 산출물·계약 또는 사용자 동작에 영향을 주어 독립 검토가 필요한 변경 등급이다. | - | project_team, developer, operator | .ai/spec/conformance.md |
| AIDD-TERM-032 | C3 | 중대 변경 | 변경 등급 | 광범위하거나 되돌리기 어렵고 높은 위험을 가져 강화된 검증과 독립 검토가 필요한 변경 등급이다. | - | project_team, developer, operator | .ai/spec/conformance.md |
| AIDD-TERM-033 | 게이트 | 게이트 | 게이트 | 다음 단계로 진행하기 전에 기준과 증거의 충족 여부를 확인하는 통제 지점이다. | Gate | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-034 | 정본 | 정본 | 정본 | 현재 유효한 사실과 의도를 기계가 읽을 수 있게 보존하는 원본 기록이다. | Canonical Record | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-035 | 파생물 | 파생물 | 정본 | 정본에서 결정적으로 다시 만들 수 있으며 직접 수정하지 않는 문서나 결과물이다. | Generated Artifact | project_team, developer, operator | .ai/spec/conformance.md |
| AIDD-TERM-038 | TRM | 프로젝트 용어 | 용어 관리 | 프로젝트가 영향 검토와 자체 결정 절차를 거쳐 현재 사용하도록 정의한 업무·제품·기술 개념이다. | Project Term | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-039 | TCH | 용어 변경 이력 | 용어 관리 | 프로젝트가 결정한 용어 추가·변경·제거의 전후 값, 결정 주체, 영향 범위, 적용 결과와 검증을 보존하는 이력이다. | Terminology Change History | project_team, developer, operator | .ai/spec/project-lifecycle.md |
| AIDD-TERM-040 | HIS | 결정 이력 | 정본 | 중요한 분석·설계·용어·소스·범위·상태 결정의 주체, 내용, 이유, 이전 상태, 영향과 출처를 안정 ID에 연결해 append-only로 보존하는 기록이다. | Decision History | project_team, developer, operator | .ai/docs/methodology/artifact-model.md |
| AIDD-TERM-041 | UC | 유즈케이스 | 분석 | 사용자나 외부 시스템이 목적을 달성하는 시작 조건, 정상 흐름, 대안·실패 흐름과 완료 결과를 식별한다. | Use Case | project_team, developer | .ai/spec/project-lifecycle.md |
| AIDD-TERM-042 | 기능 상세 명세 | 기능 상세 명세 | 문서화 | 하나의 기능 단위가 연결된 REQ를 충족하는 처리 흐름, 업무 규칙, 예외, 데이터·연계, 화면과 검증을 구체화한 명세다. v2에서는 독립 FEAT JSON 정본으로 관리하며 요구사항 자체와는 구분한다. 구형 입력의 기존 ID와 이력은 보존한다. | Feature Detail Specification | project_team, developer | .ai/docs/methodology/artifact-model.md |
| AIDD-TERM-043 | DRQ | 결정 요청 | 의사결정 | 공통 OI로 기록된 미결 결정 중 사용자 또는 프로젝트 결정권자에게 실제로 제시한 질문과 선택지, 권장안, 미응답 영향, 우선순위와 재개 상태를 보존하고 OI와 대상 정본 ID를 참조하는 현재 작업 보드 항목이다. 미결 대상과 최종 결정 자체는 OI·대상 정본과 필요한 HIS에 기록한다. | Decision Request, 결정 대기 항목 | project_team, developer, operator | .ai/spec/project-lifecycle.md |

## 프로젝트 전용 용어

- 정본: `project/.aidd/ssot/terminology.json`
- 변경: 오프라인으로 결정한 결과를 `TCH`에 결정자·이유·전후 값·영향과 함께 기록하고 관련 산출물을 일괄 반영
- 개념 유형: `business` 업무, `product` 제품 동작·정책, `technical` 구현·운영, `external` 외부 표준·제품 어휘

| ID | 용어 | key | 유형 | 분류 | 정의 | 적용 범위 | 출처 | 별칭 | 사용 예 | 관련 용어 | 독자 | 영향 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRM-001 | 고객 요청 | customerRequest | 업무 | 고객지원/접수 | 고객이 제품팀에 전달해 접수·분석·처리하는 요구나 문의의 단위다. | 고객의 최초 접수부터 분석·처리 종료까지 추적하는 업무 요청에 사용한다. | - | 업무 요청 | 고객 요청 REQ-001을 접수하고 처리 상태를 기록한다. | AIDD-TERM-003 | project_team, developer, operator, end_user | MOD-GOV, REQ-001, project/docs/generated/requirements.md |

## 헷갈리기 쉬운 용어 구분

실제로 의미·경계·판단이 어긋날 수 있는 경우만 기록합니다.

| 용어 | 구분 대상 | 핵심 차이 | 판단 규칙 | 근거 |
| --- | --- | --- | --- | --- |
| TRM-001 고객 요청 | AIDD-TERM-003 | 고객 요청은 분석 전 입력 단위이고 REQ는 합의된 시스템 요구사항이다. | 고객이 전달한 원문·문의는 고객 요청, 분석과 합의를 거쳐 검증 기준이 생긴 내용은 REQ로 부른다. | 접수된 표현을 곧바로 결정된 요구사항으로 오해하지 않기 위해 구분한다. |
