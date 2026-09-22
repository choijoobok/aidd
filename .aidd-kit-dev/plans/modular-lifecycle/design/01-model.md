# 01 — 정본 모델과 개정본

요구 연결: 001~008, 011~013, 015, 021. 결정 제안: KIT-ADR-006, 007.

## 1. 경계와 기존 레코드 재사용

| 개념 | 정본·소유 | 책임과 비책임 |
|---|---|---|
| 프로젝트 | `project.json`, project 소유 | 목적·공통 범위·정책 진입점. 하나의 phase로 모든 모듈을 제어하지 않는다. |
| 모듈 | `MOD`, 자신 소유 | 업무 경계·공개 계약·운영 기준선 참조. 활성 CHG·진척은 역조회한다. |
| 개발 주기 | 기존 `CHG` | 목적·변경 등급·범위·기준 입력·검증/롤백. 단일 모듈이면 그 모듈, 횡단 변경이면 project 소유다. |
| 실행 조각 | 기존 `WRK` | 한 CHG의 기능/화면/계약 작업, 수행 영역과 완료 조건. 개발 준비 여부는 계산한다. |
| 요구 | `REQ`, `NFR`, `OUT`, `UC` | 관찰 결과와 업무 의미. 기능 상세 설계나 구현 상태를 중복 작성하지 않는다. |
| 기능 계약 | 신규 `FEAT` | 지속되는 기능 상세 명세. CHG마다 복제하지 않고 개정본으로 변경 범위를 식별한다. |
| 화면/메뉴/데이터 | 기존 `SCR`, 신규 `NAV`, `DAT` | SCR은 표현/동작 계약, NAV는 탐색 구조, DAT는 업무 데이터 의미·속성. 실제 DB 설계는 ADR/실행 계약과 연결한다. |
| 검토/기준선/영향 | 신규 `RVW`, `BSL`, `IMP` | 각각 검토 기록, 고정 입력 집합, 변경 영향 판정. OI/DRQ/HIS/GTR/EVD를 대체하지 않는다. |
| 미결/질문/결정 이력 | 기존 `OI`, `DRQ`, `HIS`, `ADR`, `TCH` | 미결 대상, 질문 큐, 결과의 이유/역사. 파일은 분리하되 전역 논리 큐를 유지한다. |
| 증거/게이트/릴리스 | 기존 `TC`, `EVD`, `GTR`, `REL`, `EXC` | 계획과 실제 실행을 구분하고 대상 입력에 대한 유효성을 계산한다. |

별도의 cycle/feature-workflow/approval-person 레코드 군은 만들지 않는다. `MLS/IFC/DPN/SURF/LDP/STD/UXB/UIP/CMP/GPH/RUN/MAN/DLP/MRG/MRC/TRM` 및 기타 기존 식별 레코드는 책임을 유지하면서 같은 소유 저장 형식으로 옮긴다. 정책도 식별 가능한 기존 ID를 유지한다.

## 2. 공통 레코드 형식 v2

현재 레코드에는 다음 공통 외피를 사용한다. 타입별 정의 계약은 portable manifest와 Node 검증기에서 일치시키며 외부 JSON Schema 런타임을 도입하지 않는다.

```json
{
  "schema_version": 2,
  "id": "FEAT-ORDER-CANCEL",
  "type": "FEAT",
  "owner": {"kind": "module", "id": "MOD-ORDER"},
  "revision": 1,
  "title": "주문 취소",
  "lifecycle": "draft",
  "definition": {},
  "relations": [],
  "execution": {},
  "extensions": {}
}
```

- 필수 외피: schema_version, id, type, owner, revision, title, lifecycle, definition, relations. execution/extensions는 없으면 빈 객체로 정규화한다. 초안도 ID·타입·소유·참조 형식과 알려진 필드 타입은 유효해야 한다.
- owner.kind는 project 또는 module. module이면 존재하는 MOD ID가 필요하다. 한 ID는 현재 소유 정본 하나만 가진다. 타입/소유 변경은 명시적 이동/변환이며 조용한 ID 재사용은 금지한다.
- revision은 양의 정수, 관리 쓰기 성공마다 증가한다. 충돌 검사는 revision만 믿지 않고 읽은 원본 바이트 해시를 함께 사용한다.
- lifecycle은 draft / in_review / active / retired. `active`는 사용 중인 정의라는 뜻이지 사용자 승인이나 테스트 통과가 아니다. 승인은 RVW, 구현은 execution 및 EVD, 현재 준비도는 계산값이다.
- definition에는 타입별 업무/설계 계약만 둔다. execution에는 작업 실행 상태·실제 결과 참조만 둔다. 검토·기준선에 영향을 주는 내용을 execution으로 숨기지 못하도록 타입별 허용 필드를 제한한다.
- unknown 타입·필드는 조용히 무시하지 않는다. 승인된 확장은 extensions에 보존하고 해시에 포함한다. 준비도 판정에 필요한 확장 의미를 검증할 수 없으면 `unknown`으로 보고한다.

### 세 종류 식별

1. `blob_hash`: 저장된 파일 원본 바이트 SHA256. 낙관적 저장 충돌과 정확한 복원에 사용한다.
2. `definition_hash`: canonical JSON의 `{id,type,owner,title,retired,definition,relations,extensions}` SHA256. retired는 lifecycle이 retired인지의 불리언이다. draft/in_review/active는 편집 표시이므로 서로 바뀌어도 내용 검토를 무효화하지 않지만 폐기는 의미 변화다. 객체 key는 정렬, 배열 순서는 유지, 숫자/문자열/누락·null을 구분한다. revision·execution과 비의미 메타데이터만 제외한다. Unicode를 임의 정규화해 의미를 바꾸지 않는다.
3. `input_digest`: 대상 정의 해시, 적용된 의존 정의 해시, 범위/기준선, 게이트 정책 개정, 검사기/생성기 계약 버전을 정렬·결합한 해시. 대상만 그대로여도 의존이 바뀌면 달라진다.

어떤 필드를 왜 제외했는지는 타입 manifest의 명시 계약이다. 의미적 제목·근거·출처·적용 범위는 제외하지 않는다. 파일 경로만 바뀌면 definition_hash는 같고 owner가 바뀌면 다시 영향 검토한다. 실행 상태를 바꾸어도 FEAT의 정의 승인은 그대로지만 개발/릴리스 판정은 실행 입력까지 확인한다.

## 3. CHG 범위와 기준선

- CHG.definition: change_class, delivery_path, purpose, modules, scope, base_baselines, applicable_policies, validation_plan, rollback.
- scope는 포함 requirement ID, 제외/보류 ID와 이유, 적용 governing 계약, 변경할 feature/screen/data/interface 목록을 가진다. 분석 중에는 후보 목록으로 두며 설계 완료로 취급하지 않는다.
- 같은 주기의 모듈별 범위를 따로 표시할 수 있지만 하나의 CHG로 합의했다면 그 CHG의 전체 포함 요구가 설계 진입 단위다. 진정 독립 범위는 사용자 결정으로 별도 CHG로 나눈다.
- 최초 범위 및 범위 축소는 `RVW(kind=scope)`의 사용자 결정을 필요로 한다. 단순 목록 삭제·보류는 통과 수단이 아니다. 범위 내용과 적용 계약이 바뀌면 새로운 scope 검토본을 만든다.
- 요구/설계 레코드의 신규 저장은 `--change`로 생성 맥락을 전달하고 CHG 포함/제외 목록을 같은 트랜잭션으로 갱신한다. 직접 편집으로 어느 주기에도 귀속되지 않은 새 정의가 생기면 해당 소유 범위에 `unassigned_record`를 표시한다. 영향 주기를 분류하기 전에는 모듈의 새 설계 진입에서 누락으로 처리한다. 다른 명시적 미래 CHG에 속한 초안은 현재 CHG를 차단하지 않는다.
- MOD의 운영 기준선은 마지막 실제 전달/배포 결과 REL→BSL로 식별한다. 진행 중 CHG는 다른 기준선에 기반할 수 있다. 같은 항목을 두 CHG가 바꾸면 충돌을 명시하고 순차 적용·합의한 공동 변경·별도 Git 작업 트리 중 선택한다. Kit은 한 파일에 두 경쟁 현재 정의를 저장하지 않는다.

### BSL

- kind: requirements / design / release / foundation. scope_ref, members[{id, projection, content_hash, blob_hash}], inputs, created_at을 가진 불변 manifest다. projection은 definition 또는 analysis이며 해당 단계/타입 정책이 선택한다. 호출자가 임의로 좁은 투영을 골라 검토를 우회할 수 없다. definition 투영의 content_hash는 definition_hash와 같고 analysis는 명시한 분석 필드의 해시다.
- `requirements`에는 해당 CHG 전체 요구·적용 규칙과 분석 목록의 검토 시점 정의를 포함한다. downstream 설계 세부 값은 범위 분석 목록과 구별하여 요구 승인 후 작성할 수 있다.
- manifest 생성만으로 승인되지 않는다. 해당 BSL 및 구성 항목에 대한 유효한 RVW가 있어야 한다. 검토한 실제 내용을 보존하기 위해 스냅샷을 함께 저장한다.
- 사용자 응답 때 대상이 바뀌었으면 그 응답은 제시했던 개정본의 결정으로만 보존하며 현재 입력을 승인하지 않는다.
- BSL을 수정하지 않고 새 BSL로 supersedes한다. REL은 실제 전달한 BSL을 계속 가리킨다.

## 4. 요구 상세 계약

REQ/NFR.definition은 source, priority, actors, value, statement, scope, triggers, preconditions, outcomes, rules, prohibited_outcomes, exceptions, boundaries, data_needs, touchpoints, quality_constraints, acceptance_criteria, applicability를 가진다. UC는 대표 업무 흐름의 별도 상세로 연결한다.

- 적용 항목은 `{status: known|unknown|not_applicable, value, reason}`로 표현한다. known은 비어 있지 않은 값, not_applicable은 이유가 필요하다. unknown은 초안 저장 가능하지만 필요한 준비도에서 실패한다.
- acceptance_criteria 항목은 안정적인 로컬 key, given/when/then, forbidden, verification_method를 갖는다. 정상·부정·경계 검토 여부와 비적용 이유를 기록하되 고정 사례 수는 강제하지 않는다.
- NFR은 적용 대상·측정 환경/방법·관찰 기준을 요구한다. 수치가 적절하지 않은 제약은 검사 가능한 준수 조건으로 표현한다.
- data_needs는 DAT의 업무 의미/속성 key를 참조하고 UI/배치 등 touchpoints는 분석 후보 목록에 연결한다. 설계 필드와 DB 자료형을 이 단계에 강제하지 않는다.
- REQ에 TC 목록을 복사하지 않는다. TC가 verifies 관계로 AC key를 참조하고 역조회한다. 분석에서는 검증 방식으로 충분하며 개발 진입 전에는 실행 가능한 TC 계획으로 구체화한다.

## 5. FEAT·SCR·DAT·NAV

| 타입 | 정의 내용 | 분석→설계 구분 |
|---|---|---|
| FEAT | purpose, actors, pre/postconditions, main_flow, alternatives, rules, inputs/outputs, exceptions, data_access, interfaces, applicable_quality, acceptance_mapping | 분석에서는 식별·목적·원인 요구만, 설계 준비에는 실제 적용 계약 전체 필요 |
| SCR | purpose, entry/exit, fields, actions, view_states, transitions, validation, accessibility, applicable_permissions, prototype_scenarios | FEAT를 presents로 참조. 필드 의미는 DAT, 표현 방식은 SCR/UXB/UIP/CMP |
| DAT | business_definition, identity, attributes[{key, meaning, required, domain, lifecycle}], ownership_rules | 속성 key는 이름 변경에도 유지. 물리 모델은 별도 설계 자산에 연결 |
| NAV | audience, entries[{key,label,screen_ref,parent_key,condition}], entry_routes | 순환 메뉴/없는 화면/불가능한 진입 검사. 메뉴 없는 UI는 비적용 이유 |

한 요소가 32KiB 또는 400줄을 넘으면 **분할 검토 경고**를 준다. 하드 실패나 모든 속성 파일화는 아니다. 독립 변경·검토 가능한 부분만 기존 타입의 하위 레코드로 분리하고 `part_of`로 연결한다. 로컬 key 참조는 `DAT-ID#attribute-key` 등 명시 구조를 사용한다. 분리 시 옛 참조의 대응표 또는 명시적 재연결을 검증한다.

## 6. RVW·OI/DRQ·HIS

- RVW.definition: kind(scope|requirement|consistency|design|prototype|equivalence), subjects[{id,definition_hash}], input_digest, coverage, findings, unresolved_refs, method, reviewer, occurred_at, per_subject_results, decision_source.
- 결과는 accepted / changes_requested / deferred / rejected. 의미 검토와 사용자 수용을 구분하기 위해 method와 decision_source에 AI 자체 검토·사용자 결정·외부 협의 출처를 남긴다. reviewer는 자유문자이며 인증 필드가 아니다.
- consistency는 individual / related_rules / end_to_end 검토 범위와 실제 결과를 포함한다. boolean reviewed만 저장하면 준비도 증거가 아니다.
- 묶음 검토에서도 항목별 결과를 보존한다. 실제 OI와 DRQ는 분리 파일이며 DRQ에는 대상 검토본/BSL·질문·옵션·미응답 영향·우선순위·묶음 순서를 연결한다.
- 사용자 응답 반영은 RVW와 필요한 HIS, 대상 현재 결정, OI/DRQ 종료를 한 트랜잭션으로 저장한다. RVW/BSL/HIS/EVD/GTR의 완료된 사실은 새 정정 기록으로 supersedes하며 과거 파일을 덮어쓰지 않는다.
- IMP와 RVW는 새로운 제품 진실을 발명하는 레코드가 아니라 014의 영향 판단 및 006의 검토 대상/결과를 구조화한다. 실행 범위는 CHG/WRK, 질문은 DRQ, 장기 선택은 ADR에 그대로 둔다.
