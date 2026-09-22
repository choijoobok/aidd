# 모듈별 레거시 정본 채택과 실행 검증

초안 생성·순차 검토 다음 단계다. 문서 관리의 채택, 실제 동작 검증, 운영/출시는 별개의 상태이며 하나의 완료율로 합치지 않는다. 새 훅·실행기·병렬 업무 정본을 추가하지 않는다.

## 범위와 준비

`legacy-adoption-check --change CHG-ID --module MOD-ID`는 읽기 전용이다. 독립 채택 단위는 한 모듈을 소유하고 modules에도 그 모듈만 포함한 레거시 CHG다. 공통 정의를 참조할 수 있으나 다른 모듈의 후보를 끌어와 부분 승인하지 않는다. 여러 모듈을 함께 선언한 CHG는 전체 범위 합의의 단위이므로 독립 도입이 필요하면 먼저 정상 변경으로 모듈별 CHG를 나눈다. 공통 의존은 기존 검토·영향 판정으로 유지한다.

정본 준비에는 현재 자료 인벤토리, 전체 읽기 가능 여부, 순차 검토 완료, 일반 requirement-check의 상세/범위/일관성/기준선, 검증 계획과 미결 영향 처리가 필요하다. source-check와 별도로 실행 증거를 확인한다. 제외/미지원/부분 조사에는 사용자 검토한 계획의 coverage_notes에 근거 있는 처리/제외 이유를 남긴다. 불완전 scope는 완료로 만들지 않는다.

## 검증·차이 계획

정상 record-put으로 모듈 소유 DOC(kind=legacy_validation_plan)를 작성한다. definition은 change, module, environment, coverage_notes, tests(TC ID 배열), scenarios(normal/exception/data_boundary), differences, existing_ui를 갖는다. 같은 CHG/모듈의 폐기되지 않은 계획은 하나다. relations.context로 CHG를, depends_on으로 TC·차이 후속 작업·기존 화면을 연결한다. 계획 자체에 현재 사용자 design RVW가 필요하며 TC/화면 변경은 관계를 통한 검토 입력에 반영된다.

각 scenario는 `{tests:[TC-ID...]}` 또는 `{not_applicable:"구체적 사유"}`다. normal은 비적용 불가다. TC는 steps/inputs/expected/forbidden/method와 verifies(REQ/AC key)를 갖추며 범위 안의 인수 기준마다 최소 하나의 계획이 필요하다. 이 계약은 시험 계획이지 실행 허가가 아니다.

differences는 각 요구/기능/화면/데이터/메뉴/연동 후보에 `{subject,disposition:retain|fix|improve|retire,reason,work?}`를 둔다. retain 이외는 실제 WRK 및 그 CHG와 해당 대상의 추적 연결을 요구한다. 목표와 현행 차이를 기록하며 WRK를 자동 완료하지 않는다. 기존 화면은 existing_ui에 `{screen,reason,reference}`로 현재 실제 화면을 확인한 근거와 재사용 판단을 남기고 현재 사용자 design 검토를 연결한다. 과거 prototype 승인을 소급 생성하지 않는다. 신규/변경 UI 개발은 정상 FG-001 목업 게이트를 따른다.

## 실제 검증 상태

조회는 실행하지 않고 각 TC의 not_run/passed/failed/stale/invalid를 보고한다. `test_bindings`가 반환하는 현재 검증 입력 digest를 실제 실행 EVD.extensions.legacy_validation의 `{plan,input_digest}`에 기록한다. 기존 EVD.definition은 kind=test, subjects=[TC-ID], input_hash=TC 정의 해시, mode=actual, environment=계획 환경, code_revision=현재 inventory digest, command/occurred_at/artifacts/result를 갖춘다. binding은 계획·TC·연결된 요구와 현재 자료에 묶인다. 과거 자료/요구/계획의 통과는 현재 통과가 아니다. 최신 시각의 실패를 과거 통과로 덮지 않으며 같은 시각의 복수 결과는 ambiguous다.

실행 전 사용자가 대상 환경·명령·부작용 범위를 허용했는지 확인한다. 소스 조사/Kit 기능 구현 승인은 제품 실행 권한이 아니다. 관측·문서 채택만으로 EVD/GTR/REL이나 구현 완료를 만들지 않는다. 도구는 제출된 실행 기록의 적합성을 확인할 뿐 실제 실행의 진실성이나 제품 품질을 보증하지 않는다.

## 명시 채택과 재개

`legacy-adopt --input FILE --operation ID` 입력은 `{change,module,document_digest,reviewer,occurred_at,decision_source:{kind:"user",reference}}`다. 최신 정본 준비와 source-check를 재확인하고 CAS transaction으로 모듈 소유 DOC(kind=legacy_adoption)와 불변 HIS만 생성한다. 실제 테스트 미실행은 문서 관리 채택을 막지 않지만 그 상태를 함께 기록한다. CHG/WRK/REL의 실행 상태, 기존 기준선/승인, 다른 모듈을 변경하지 않는다.

채택 기록은 대상 정의/검토/계획/자료가 바뀌면 stale로 표시하고 삭제하지 않는다. 실제 테스트 결과 추가만으로 문서 채택은 무효화하지 않는다. 기존 정본을 계속 편집하므로 이중 관리가 없다. 이후 기능 개발은 같은 ID를 참조하는 정상 CHG→요구/기준선→기능·화면/목업→WRK/테스트로 진행한다. 채택 기록을 신규 개발·릴리스 게이트의 면제권으로 사용하지 않는다.

상태/파생 문서는 저장된 정본 기준 준비와 검증 상태를 같은 모델로 계산하되 파일시스템 source-check는 수행하지 않았음을 표시한다. 실제 채택 명령에서는 현재 파일을 다시 확인한다. 기존 source-check/복구/재분석을 재사용하고 미완료 transaction은 transaction-recover로 처리한다. 이전 AIDD 형식 변환과 자동 운영 데이터 이관은 제공하지 않는다.
