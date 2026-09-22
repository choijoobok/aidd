# 시스템·업무 분석 계약 (owned-records-v2)

## 목적과 진행 순서

요구를 잘 작성하는 것과 필요한 요구를 충분히 발굴하는 것을 구별한다. 시스템 이해 → 핵심 업무 → 업무 사용자/역할 → 접속·인증·접근 정책 → 유즈케이스 ↔ 업무 프로세스 → REQ/NFR → 기능·화면·데이터·연동·메뉴 후보를 기본 흐름으로 한다. UC와 프로세스는 함께 정교화한다. 초안은 언제든 작성·수정할 수 있고, 순서대로 파일을 만들었다는 사실로 승인을 추정하지 않는다.

CAP는 업무 수준의 능력이고 FEAT는 요구를 충족하는 상세 기능이다. ACT는 제품의 사용자 그룹/업무 역할·외부 시스템·자동 실행 주체이며 AIDD 수행팀 명부, 인증 계정, 검토 권한 레코드가 아니다. NAV는 역할별 업무 흐름과 화면 후보에서 도출한다. UC·FEAT·SCR·메뉴를 일대일 대응시키거나 API·배치에 화면을 강제하지 않는다.

## 정본과 상세 항목

기존 owner/type/ID 경로, CAS 저장, revision, RVW/BSL/IMP를 그대로 사용한다. 큰 프로세스는 별도 BPR로 분리하여 subprocess로 연결한다. SYS는 시스템 공통 정의로 관리하고 공통 ACT와 모듈 간 종단 프로세스는 한 소유자의 정본을 참조한다. 공통 내용을 모듈별로 복사하지 않는다.

일반 상세 필드는 `{status:"known",value:...}`, `{status:"unknown"}`, `{status:"not_applicable",reason:...}` 형식이다. 아래에서 명시한 구조 필드만 직접 배열/문자열이다. unknown은 저장 가능하지만 준비 완료는 아니다.

| 유형 | 필드 | 비적용 허용 |
|---|---|---|
| SYS | problem, purpose, outcomes, boundary, exclusions, external_context | exclusions, external_context |
| CAP | purpose, outcomes, business_objects | business_objects |
| ACT | kind, group, goals, responsibilities, business_permissions, access | business_permissions, access |
| UC | goal, trigger, preconditions, postconditions, main_flow, alternatives, exceptions, access | alternatives, exceptions, access |
| BPR | purpose, trigger, outcomes, steps, transitions, initial, terminals | 없음; 단계 data_state는 비적용 가능 |

- ACT.kind는 human/external_system/automation이다. goals는 `{key,goal}` 배열이다. 목표 key는 이름이 바뀌어도 유지한다.
- ACT/UC.access와 POL.kind=system_access의 계약은 [접속·인증·접근 정책](system-access.md)을 따른다. 제품 인증 요건을 다루는 것이며 AIDD 수행팀의 인증 계정을 관리하는 것이 아니다. 필수 결정은 인증 필요 여부이지 로그인 자체가 아니다.
- CAP는 `part_of → SYS` 관계를 가진다.
- UC는 `realizes → CAP`, `performed_by → ACT` 관계를 가지며 performed_by.selector는 역할 목표 key다. main_flow/alternatives/exceptions의 known.value는 `{key,action,outcome}` 배열이다. key는 UC 전체에서 고유하다. 이는 화면 클릭 순서가 아닌 목표 달성을 위한 업무 시나리오다.
- BPR.steps는 `{key,title,kind,actor,outcome,data_state,use_case?,use_case_step?,subprocess?}` 배열이다. kind는 system/manual/external/subprocess다. actor는 ACT ID, system 단계는 UC ID와 UC 흐름 key, subprocess 단계는 별도 BPR ID를 참조한다. 필드에 담긴 참조도 조회·검토 입력·영향 그래프에 포함한다. 같은 참조를 relations에 중복 작성할 필요가 없다.
- BPR.transitions는 `{from,to,kind,condition}` 배열이다. kind는 normal/alternative/exception/parallel이다. initial은 시작 key, terminals는 종료 key 배열이다. 모든 단계가 시작에서 도달 가능하고 종료 경로가 있어야 한다. 반복 전이는 허용하지만 재귀적인 하위 프로세스 포함은 허용하지 않는다. 업무 조건의 상호 배타성·병렬 합류·보상 처리의 의미는 사용자와 AI의 흐름 검토 대상이며 이 그래프 검사가 실행 엔진/BPMN 검증을 대신하지 않는다.

## 주기 범위와 누락 판정

CHG.definition.scope.discovery:

```json
{
  "overview": "SYS-ORDERS",
  "capabilities": {"status":"known","value":["CAP-ORDERS"]},
  "actors": {"status":"known","value":["ACT-CUSTOMER"]},
  "access_policies": {"status":"known","value":["POL-CUSTOMER-ACCESS"]},
  "use_cases": {"status":"known","value":["UC-CANCEL"]},
  "processes": {"status":"known","value":["BPR-CANCEL"]},
  "dispositions": []
}
```

overview는 항상 SYS를 참조한다. 나머지 목록은 현재 주기에 적용하지 않는 경우 not_applicable와 구체적 사유를 사용할 수 있다. 순수 품질·정책 변경에 가짜 사용자나 UC를 만들지 않는다. 그렇더라도 실제 연결된 선행 업무 정의를 목록에서 숨길 수 없다. scope 검토가 비적용 판단의 사용자 수용을 포함한다.

CAP별 UC, ACT 목표별 UC, UC별 프로세스 내 위치를 확인한다. REQ/NFR 확정 때는 UC의 정상·대안·예외 흐름 key와 BPR의 system 단계별 요구 연결까지 확인한다. 이미 알려진 항목의 제외·보류는 discovery.dispositions에 `{id,selector?,disposition:"excluded"|"deferred",reason}`로 기록한다. ACT 목표를 제외할 때 selector를 생략할 수 없다. 이를 승인 없는 누락이나 암묵적 미래 범위로 취급하지 않는다.

REQ/NFR는 `derived_from` 관계로 발굴 근거를 가진다. UC/BPR 대상이면 selector는 해당 흐름/단계 key다. UC 흐름에 연결된 요구는 같은 흐름을 실행하는 프로세스 단계도 포괄하고, 반대 방향도 동일하다. 비기능·횡단 요구는 SYS/CAP/ACT/POL/IFC/STD/ADR/OUT를 근거로 삼을 수 있다. 대상은 현재 discovery 또는 governing 범위에 포함해야 한다. source 상세 필드는 출처의 설명이고 관계는 기계적으로 추적할 참조이며 둘을 함께 작성한다.

사용자·AI의 의미 검토는 역할별 목표 누락, 수작업/시스템 경계, 인계 책임, 예외·복구, 데이터 상태의 모순, 외부/시간 기반 이벤트를 확인한다. 도구는 구조상 연결 누락을 찾지만 실제 업무가 빠짐없거나 모순이 없다고 보증하지 않는다.

## 검토·준비도·재개

- SYS/CAP/ACT와 접속 POL은 RVW.kind=intent, UC/BPR는 business_flow 검토를 사용한다. 실제 사용자 출처와 현재 subjects/definition_hash/input_digest/항목별 accepted가 필요하다. 묶음 또는 개별 RVW가 가능하며 부분 응답은 해당 항목에만 적용한다. 공통 정본 검토는 공통 소유 RVW에 기록하여 다른 모듈에서도 재사용할 수 있게 한다.
- `discovery-check --change CHG-ID`는 scope 검토와 위 선행 정의·검토를 판정한다. 요구가 아직 없다고 선행 업무 분석 자체를 실패시키지 않는다. 저장 명령은 아니며 BG-001을 명시적으로 실행할 때만 GTR이 생긴다.
- `requirement-check`/`design-check`는 선행 분석, 요구 출처·흐름 포괄성, 기존 요구 상세·검토·일관성·기준선을 함께 검사한다. 요구 초안 작성과 요구 확정/설계 진입은 다르다. 분석이 불완전하다고 초안 기록을 막지 않는다.
- requirements BSL에는 discovery의 공통/모듈 정의도 자동 포함한다. SYS/ACT 변경은 같은 CHG뿐 아니라 연결된 다른 모듈의 현재 검토를 낡게 할 수 있다. 과거 RVW/BSL/REL은 수정하지 않는다.
- 상세 기능/화면/목업/테스트를 작성하는 기존 개발 절차는 유지한다. `derived_from`, `performed_by`, `realizes`와 BPR 단계 참조를 따라 영향 후보를 찾아 IMP로 분류하고 필요한 WRK만 재개한다. 영향 없음은 자동 결정하지 않는다.
- 독립 신규 모듈은 공통 정의와 유효한 기존 검토를 재사용한다. 미래의 모든 모듈 요구가 확정되어야 현재 모듈을 설계하는 전역 관문을 만들지 않는다.

정의의 draft/in_review/active와 현재 ready/blocked/unknown, 검토 current/stale는 별개다. active를 사용자 승인으로 사용하지 않는다. 기존 v2에서 이번 계약의 근거가 없는 검토를 자동 변환하지 않는다. 판정기 버전 변경으로 과거 input_digest는 현재 승인으로 인정하지 않으며, 필요한 재검토 또는 명시적인 현재 사용자 동등성 검토를 수행한다. 이전 ID·원문·이력은 보존한다.

## 파생물

generate는 기존 ID별 명세·인덱스 외에 공통 문서 인덱스, SYS 기반 홈, BPR SVG와 전이 번호·조건 명세를 만든다. SVG는 오프라인 구조도이며 실행 가능한 워크플로가 아니다. BPR 수정 후 다시 생성하고 documentation-check로 전체 결과를 비교한다. SVG나 생성 Markdown을 직접 고치지 않는다. status의 discovery는 같은 판정기를 사용하며 요구/개발 준비도와 구별한다.
