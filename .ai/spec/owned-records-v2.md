# 소유 레코드 v2 실행 계약

모듈형 정본의 현재 실행 계약이다. `project.json.storage_format = owned-records-v2`인 프로젝트에는 이 문서가 구형 전역 배열·단일 phase·별도 FEAT 미채택 설명보다 우선한다. 구형 fixture는 이전 형식 회귀 입력이며 혼합 저장을 허용하지 않는다. 이전 AIDD 버전 전용 형식 변환은 제공하지 않는다.

## 저장과 조회

- 정본은 `.aidd/ssot/common/<TYPE>/<ID>.json` 또는 `modules/<MOD>/<TYPE>/<ID>.json`. MOD는 `modules/<MOD>/module.json`이다. 한 ID에는 한 현재 소유자만 있다.
- 외피: schema_version 2, id/type/owner/revision/title/lifecycle/definition/relations. execution/extensions는 객체다. lifecycle active는 승인·완료가 아니다.
- `record-read --id`, `record-list --module`은 현재 정본을 읽는다. `--at BSL-ID`는 고정 원문을 읽는다. 인덱스는 파생물이며 조회는 인덱스를 쓰지 않는다. 인덱스가 없거나 낡아도 실제 파일을 읽고 불완전 범위를 보고한다.
- `record-put --input FILE --operation ID --create` 또는 `--expected-hash HASH`로 저장한다. 요구·설계 정의에는 `--change CHG-ID`가 필요하며 주기 범위에 함께 등록된다. 이동은 `record-move`로 수행한다.
- byte hash는 충돌/복원, definition hash는 의미 개정, input digest는 의존·정책까지 포함한 현재 판정 입력이다. 실행 상태 변경은 정의 승인을 무효화하지 않는다.
- 원본 바이트는 `.aidd/snapshots/records`에 보존한다. RVW/BSL/HIS/EVD/GTR은 수정 대신 새 정정 기록으로 supersedes한다.
- 동시 저장은 expected hash와 짧은 repository lock으로 보호한다. prepared 저널이 남으면 `transaction-status`, 명시적인 `transaction-recover --operation ID --action resume|rollback`을 사용한다. 후속 사용자 수정은 덮어쓰지 않는다. 정본 저장 성공 후 index 실패는 committed/index stale로 보고한다.
- 32KiB/400줄은 의미 있는 분할 검토 경고이지 강제 속성별 파일화가 아니다. `part_of` 관계와 안정 속성 key를 유지한다.

## 선행 시스템·업무 분석

기존 시스템에서 시작할 때는 [일반 레거시 역분석 계약](reverse-engineering.md)의 읽기 전용 수집·초안 미리보기·생성 전용 적용을 사용한다. 관측 장부는 실행 증거나 사용자 승인으로 바꾸지 않는다.

[시스템·업무 분석 계약](business-discovery.md)을 함께 적용한다. SYS/CAP/ACT/UC/BPR의 명시적 범위·현재 사용자 검토와 업무 흐름의 요구 추적을 먼저 확인한다. `discovery-check --change`와 BG-001은 선행 분석을, 기존 requirement/design-check는 이를 포함한 요구 확정을 판정한다. 초안은 자유롭게 오가며 운영 이력을 초기화하지 않는다.

## 명시적 동등성과 제한된 예외

RVW(kind=equivalence)는 현재 subjects/hash와 사용자 결정, equivalence(previous_review/previous_input_digest/current_input_digest/subject_hashes_before/reason)를 갖춰야 이전 scope/requirement/consistency/design 검토를 재사용할 수 있다. 기존 검토의 사용자 수용과 coverage도 유지한다. 오탈자라는 분류만으로 면제하지 않으며 목업의 현재 출력 검토는 별개다.

EXC는 applies_to/criteria/policy/reason/compensating_controls/decision_source/expires_at/input_hashes를 갖춘다. POL.definition.exception_criteria가 명시적으로 허용한 predecessor_output/foundation_stale/provider_contract_retired에만 적용한다. scope/요구 사용자 승인·상세·목업 검토·실통합 증거는 blanket waiver하지 않는다. 예외가 있는 평가·상태·문서·게이트·제출에는 같은 `--evaluated-at ISO시각`을 명시한다. 시각이 없으면 unknown, 만료/대상 변경이면 blocked다. 주어진 시각의 판단이지 무기한 현재 승인으로 표시하지 않는다.

## 브리핑·문서·제출

`status --module|--change|--work|--id`와 `module-status --module`은 읽기 전용이다. 운영 REL, 진행 CHG, WRK 실행 기록, 현재 ready/blocked/unknown과 다음 조치를 별도 표시한다. 사람이 읽는 출력은 `--format text`, 자동화는 `--format json`이다. 모듈의 --status 직접 변경은 거부한다.

`generate [--module MOD-ID|--change CHG-ID] [--output DIR]`는 ID별 명세, 모듈 인덱스, 상태 JSON/Markdown, SCR 목업·명세, MAN 절차, 오프라인 HTML과 프로젝트 홈을 만든다. 공통 항목은 한 정본을 참조한다. `manifests/<owner>.json`은 생성기 소유 파일과 해시를 기록한다. 전체 생성도 모듈별 소유 manifest를 사용하므로 후속 모듈 생성과 충돌하지 않는다. 다른 모듈·사용자 파일은 보존하며 생성물의 수동 수정은 덮어쓰지 않고 충돌로 보고한다. `documentation-check`는 현재 정본에서 전체 대상 파일 목록/내용을 재계산해 비교한다.

MAN.definition에는 audience/preconditions/steps/expected/error_recovery/support가 필요하다. 설계본과 실제 화면 증거를 구분한다. 실제 캡처 EVD에는 kind=screenshot, mode=actual, subjects(MAN), input_hash, commit/environment/screen과 file/sha256/alt를 기록한다. file은 project 내부 PNG/JPEG 파일이며 제출 시 원본 해시를 검사하고 HTML에 포함해 오프라인 열람을 보장한다.

`delivery-build --profile DLP-ID --output 미존재폴더`는 명시적 제출 정책만 조립한다. DLP는 audience(internal/end_user), purpose(design/release), includes(user/design/operations/glossary), modules, release를 지정한다. 출시본은 최신 release-check와 실제 화면 증거가 필요하다. 사용자용에는 내부 설계·ID·경로·내부 용어를 포함하지 않는다. customer 공개 범위이며 end_user 독자인 active TRM만 사용자 용어집에 들어간다. 빌드 결과는 정본이 아니고 기존 출력 폴더는 덮어쓰지 않는다.

용어·가정·결정 이력·병합·provider 평가·문서 영향 전문 명령은 [전문 명령 통합 계약](specialty-integration.md)을 따른다. 쓰기에는 고유 operation이 필요하며 기록·현재 유효성·실제 provider 수행을 구분한다. 이전 AIDD 형식 변환은 제공하지 않으며 구형 writer를 v2에서 우회 실행하지 않는다. 일반 레거시 소스·문서·산출물을 조사해 정본을 작성하는 작업은 별개이며, 관찰된 구현을 사용자 요구나 승인으로 자동 취급하지 않는다.

## 기능·화면·개발·영향

FEAT는 지속 기능 계약이며 CHG마다 복제하지 않는다. purpose/actors/preconditions/postconditions/main_flow/alternatives/rules/inputs/outputs/exceptions/data_access/interfaces/applicable_quality/acceptance_mapping을 적용성 객체로 상세화하고 satisfies로 REQ/AC에 연결한다. SCR은 purpose/entry/exit/fields/actions/view_states/transitions/validation/accessibility/applicable_permissions/prototype_scenarios와 presents 관계를 가진다. DAT 속성과 AC의 key는 이름 변경에도 안정적으로 유지한다.

SCR 목업 필드는 key/label/type(text, number, email, date, checkbox, select, textarea)/required/example/options, 행동은 key/label, 상태는 key/title/message, 전이는 from/action/to/validate/error_message, 시나리오는 key/title/initial/steps(action)/expected를 사용한다. 실제 HTML은 입력 검사·상태 전이·시나리오 선택이 가능하다. placeholder와 도달 불가능한 시나리오는 실패한다. 사용자 prototype RVW에는 현재 input_digest와 artifact(output_hash/states/viewports)를 연결한다. 렌더러 자동 시험은 실제 사용자 이해도 검토를 대신하지 않는다.

`development-check --work WRK-ID`는 CHG 요구 기준선 전체와 해당 작업의 FEAT/SCR/목업 검토, 현재 AC의 TC 실행 계획, 적용 공통 기반과 선행 output을 검사한다. 같은 CHG의 다른 WRK 설계가 미완성이어도 준비된 작업을 시작할 수 있다. 선행 관계 depends_on.required_output은 contract/implementation/integration을 구별한다. 비UI에는 ui_applicability의 비적용 사유를 기록한다. foundation/investigation/documentation/refactor는 product_feature와 적용 조건을 구분한다.

`impact --id ID`는 typed 역관계의 직접/간접 경로와 순환·미해결·전체 coverage를 보고한다. 후보를 자동 영향 없음으로 확정하지 않는다. `impact-apply`는 현재 graph_digest/after_hash를 재확인하고 IMP 후보의 affected/unaffected/pending과 이유를 저장하며 명시적으로 reopen한 WRK만 planned로 돌린다. 운영 REL/기준선·과거 증거는 바꾸지 않는다. 분류/재작업 조치가 끝난 IMP만 명시적으로 종료한다.

실제 완료에는 대상 definition hash의 EVD(subjects/kind/result/input_hash/command/occurred_at/artifacts)가 필요하다. 릴리스는 AC별 test EVD와 환경·조합의 actual integration EVD, 최신 필수 GTR을 추가로 요구한다. stub 통과·수동 completed·과거 passed는 이를 대신하지 않는다. 검사는 실제 배포를 실행하지 않는다.

## 요구·검토·기준선

CHG.scope에는 requirements/candidates/governing, 제외·보류 이유와 inventory(features/screens/data/navigation/interfaces)를 둔다. 요구의 source/priority/actors/value/statement/scope/triggers/preconditions/outcomes/rules/prohibited_outcomes/exceptions/boundaries/data_needs/touchpoints/quality_constraints는 known(value), unknown, not_applicable(reason)로 상세화한다. AC는 key/given/when/then/forbidden/verification_method, applicability는 normal/negative/boundary를 기록한다. NFR은 measurement도 필요하다.

`requirement-check`와 `design-check --change`는 전체 주기 범위·상세·분석 목록·사용자 승인·일관성·기준선·미결을 같은 evaluator로 판정한다. 비어 있는 주기, 미배정 정의, 이유 없는 범위 삭제, 다른 활성 주기와의 충돌은 통과하지 않는다. 독립 미래 CHG의 초안은 현재 주기를 막지 않는다.

`baseline-create --input FILE --operation ID` 입력은 id/kind/scope_ref/title이다. requirements 구성원은 CHG 전체 범위에서 계산하며 호출자가 줄일 수 없다. 원문 snapshot과 BSL을 저장하고 CHG에 연결한다. 승인 자체를 만들지는 않는다. 먼저 기준선을 고정한 뒤 현재 제시본에 검토를 기록하는 순서를 권장한다.

`review-record`는 RVW 외피 또는 `{record: RVW, resolve: [OI/DRQ ID]}`를 받는다. RVW는 kind, subjects(id/definition_hash), input_digest, sequence, coverage, findings, unresolved_refs, method, reviewer, occurred_at, decision_source(kind/reference), per_subject_results가 필요하다. scope/requirement/prototype의 수용은 실제 user 출처를 요구한다. consistency는 individual/related_rules/end_to_end 검토 결과를 필요로 한다. AI는 의미적 검토를 직접 수행해 발견사항을 남겨야 하며 빈 findings만 작성했다고 실제 검토한 것으로 주장하지 않는다.

변경된 제시본에 늦게 온 응답은 과거 검토 이력만 남기고 OI/DRQ를 종료하지 않는다. 현재 응답도 명시적으로 accepted인 대상만 종료한다. `gate-run --scope ID --gate ID --operation ID`만 GTR을 저장하며 조회는 상태를 변경하지 않는다. 최신 실패/입력 변경은 과거 통과로 가릴 수 없다.

저장·조회·충돌·복구 기반, 요구/범위/검토/설계 진입, 기능/화면/목업/개발/영향과 같은 판정의 브리핑·산출물을 연결한다. 지원하지 않는 명령은 명시적 오류이며 준비 완료로 취급하지 않는다. 자동 Kit 업데이트와 이전 AIDD 버전 전용 후보 변환은 제공하지 않는다.
