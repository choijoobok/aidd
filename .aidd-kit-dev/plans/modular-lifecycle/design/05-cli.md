# 05 — CLI 계약과 내부 구성

모든 새 명령·옵션·파일은 설계 제안이며 아직 실행할 수 있는 기능이 아니다. 기존 진입점 `node .ai/tools/aidd.mjs`는 유지한다. 새 서버·DB·플러그인·스킬을 만들 필요 없이 현재 CLI의 부족한 저장/판정을 확장한다.

## 1. 내부 책임 분리

현재 거대한 aidd.mjs를 진입/옵션 계층으로 얇게 만들고 일반 라이브러리를 `.ai/tools/lib/`로 분리한다.

| 파일 | 책임 | 첫 단계 |
|---|---|---|
| record-store.mjs | v2 읽기·ID/소유 해석·스냅샷 | S04 |
| record-contracts.mjs | 타입 계약·정의/분석 투영·구조 검증 | S04, 타입 확장 S05~06 |
| record-index.mjs | 계층 인덱스·최신성·역조회·읽기 계측 | S04 |
| record-transaction.mjs | 기대 해시·잠금·저널·복구·재시도 | S04 |
| readiness.mjs | 순수 범위/요구/설계/작업/릴리스 판정 | S05~06 |
| dependency-graph.mjs | typed 관계 closure·영향 경로·coverage | S04 최소 조회, S06 의미 전파 |
| record-views.mjs | 동일 평가 결과의 브리핑/문서 데이터 | S05 최소, S07 확장 |
| document-renderer.mjs | Markdown/HTML/목업/출력 manifest | S04 호환 연결, S06~07 확장 |
| legacy-records.mjs | 구형 fixture/명시적 변환의 제한 로더 | S04부터 이행용, S09 공개 명령에서 격리 |
| record-migration.mjs | v1→v2 별도 후보 트리 계획/변환 | S09 |

manifest `.ai/manifests/record-types.json`는 타입·소유·필드·관계·투영 선언, `.ai/manifests/readiness-policies.json`는 기본 적용/필수 조건이다. 타입별 JSON Schema는 project-skeleton의 `.aidd/schemas/`에 정적 설명으로 제공하고 Node 표준 라이브러리 검증기와 테스트로 대응시킨다. 선언과 검증 로직 불일치 테스트가 필요하다.

위 공통화는 **일반 CLI 내부만**이다. `.ai/hooks/*.mjs`에는 import하거나 공유 런타임으로 연결하지 않는다. aidd_hook.mjs는 기존 self-test/하네스 검사 책임만 유지하고 제품 상태 판정의 새 진입점으로 쓰지 않는다.

## 2. 새 명령 계약

공통 출력은 `--format json|text`, JSON은 schema_version/command/scope/data/diagnostics/coverage를 포함한다. 조회는 읽기 전용이다. 오류 코드는 0=성공/ready, 1=계약/준비 차단, 2=잘못된 호출, 3=저장 충돌/복구 필요로 구분한다. 텍스트만 필요한 기존 스크립트도 nonzero 실패 계약은 유지한다.

| 명령 | 필수 입력·출력·부작용 | 단계 |
|---|---|---|
| record-read | --id, optional --at BSL-ID. 레코드·출처·유효성, 쓰기 없음 | S04 |
| record-list | --module MOD-ID 또는 --owner project, optional --type/--change. 요약/diagnostics | S04 |
| record-put | --input 파일 --operation ID --expected-hash HASH 또는 --create, 정의 작업은 --change. 구조 검사 후 트랜잭션 | S04 |
| record-move | --id --owner --expected-hash --operation, 필요 --change. ID 보존·참조 검사·이동 | S04 |
| index-check / index-rebuild | optional --module. 전자는 읽기 검사, 후자는 파생 index 재생성 | S04 |
| transaction-status / transaction-recover | --operation, recover는 --action rollback|resume. 원본 hash 확인·실패 범위 복구 | S04 |
| requirement-check | --change. 상세/목록/검토 준비 및 누락을 조회 | S05 |
| baseline-create | --input manifest --operation. 입력 재확인·snapshot·BSL 원자 저장, 승인 생성 안 함 | S05 |
| review-record | --input 검토 결과 --operation. 제시 개정/항목별 응답·출처 저장, 결정 시 OI/DRQ/HIS 함께 반영 | S05 |
| design-check | --change. 주기 전체 요구/공통 조건의 설계 진입 판정 | S05 |
| gate-run | --scope ID --gate ID --operation. 해당 입력/실제 검사 결과를 GTR로 기록 | S05~06 |
| impact-apply | --input IMP 판정 --operation --expected-hash. 선택적 재작업/질문 연결 | S06 |
| migration-plan | --source 기존 ssot --output 미존재 관리 후보 경로. 원본 읽기·차이/누락 보고만 | S09 |
| migration-build | --plan 계획파일 --directory 미존재 후보 경로. 명시적 후보 v2 정본 생성, 원본 교체 안 함 | S09 |

RVW/BSL/HIS 등의 불변 완료 기록은 record-put으로 덮어쓸 수 없다. 일반 초안의 자유로운 내용 작성은 허용하되 승인/결정/완료를 부수 기록 없이 꾸미는 저장은 준비 조건을 충족하지 못한다. 파일을 직접 작성할 경우에도 같은 검증 결과를 얻어야 한다.

## 3. 기존 명령 전수 처리

| 기존 명령 | 목표 계약 |
|---|---|
| add-module | MOD 파일·인덱스만 생성. --status done 초기화 금지, with-ui는 UI 초안 진입점만 생성 |
| module-status | --module 읽기 집계로 전환. --status 직접 완료 변경은 명시적 오류와 대체 절차 안내 |
| project-bootstrap / project-init / project-init-status / project-reconcile-role | v2 골격 생성/역할 확인. Git 초기화·로컬 훅 설치 책임 유지, 사용자 사실/승인 발명 금지 |
| validate | 전역 기본 검사 유지, --module/--change 범위 검사 추가. scope_complete와 project_complete를 구분하고 현재 정본·인덱스·전체 생성 비교 옵션 구분 |
| status | 기존 executive/module/detail 유지. --change/--work/--id 추가, 공통 evaluator 소비. 읽기에서 generate·쓰기 금지 |
| development-check | --change 유지, --work 추가. CHG 집계에 미준비 WRK가 있어도 준비된 WRK 결과를 별도 표시; --work만 대상 착수 판정 |
| release-check | --release 유지, 현재 REL closure·실제 입력과 증거로 판정 |
| workload-coverage | --change 유지. 요구/FEAT/SCR/영역 포괄성과 선행 output 조건으로 확장 |
| impact | --id 유지, --before BSL/해시 및 --change 추가. 직접/전이 후보와 coverage; 읽기만 수행 |
| document-impact | --path 유지, ID/owner 해석과 영향 closure 사용. 의미 확정은 하지 않음 |
| generate | 기본 전체, --module/--change 및 --output 추가. 엄격한 입력 snapshot으로 생성·소유 manifest 관리 |
| documentation-check | --staged 유지. 경로 대신 ID/문서 policy·SURF·현재 생성 대응 확인 |
| init-module-surfaces / init-module-ui | v2 타입별 초안 초기화, 실제 화면/표면/승인 생성 금지 |
| migrate-module-specs | v2에서 실행 거부하고 migration-plan으로 안내. 구형 파일 재분할 쓰기 기능은 새 주 쓰기 경로에서 제거 |
| add-assumption / resolve-assumption | 기존 옵션 의미 유지, 소유 레코드·OI/게이트 범위·트랜잭션 연결 |
| record-history | 기존 ID·occurred-at·decided-by·supersedes 유지, 소유 위치·snapshot 참조 지원 |
| term-review / term-apply / terminology-refresh / delivery-glossary | 의미·공개 경계 보존. 분할 TRM/TCH·scope 읽기/저장·전체 독자별 생성 연결 |
| integration-status / record-merge / assess-merge / add-merge-recheck / complete-merge-recheck | Git 안전 계약 보존. MRG/MRC 소유/참조와 관련 릴리스 closure 연결 |
| evaluation-prompt / evaluation-status / record-evaluation | 실제 provider 결과 구분·기존 루브릭 유지. 분할 EVS/실행 레코드로 연결 |
| sync-ai / install-hooks / hook | 기존 역할과 격리 유지. 훅을 신규 공통 상태 엔진의 dispatcher로 만들지 않음 |

현재 KNOWN_COMMANDS 36개를 위 표로 포괄한다. 새 구현 시 옵션 parser/도움말·가이드·호환성 테스트를 함께 변경하며 obsolete 명령은 silent no-op로 남기지 않는다. major 변경의 구체 대체 안내를 제공한다.

## 4. 증분 동안 실행 가능한 기준선

- S04에서 v2 저장 기반과 최소 bootstrap/validate/read/generate 호환 경로를 함께 연결한다. 새로운 v2를 내보내면서 핵심 기존 명령이 구형 파일을 직접 덮어쓰게 방치하지 않는다.
- 이행 중 구형 reference fixture는 명시적인 legacy adapter가 읽는다. 파일의 storage_format으로 로더를 선택하고 형식을 섞지 않는다. v2-only 명령은 구형에 migration_required를 반환한다.
- S05/S06에서 타입별 실제 준비도 기능을 추가한다. 지원하지 않는 조건은 not_implemented/unknown으로 보고하고 ready를 주지 않는다.
- S07/S08은 누락 통합이지 앞 단계의 깨진 스킬/훅 연결을 방치할 유예 기간이 아니다. 각 단계가 만든 경로/명령은 해당 지침·시험을 같은 단계에서 맞춘다.
- S09에서 legacy 현재 쓰기 경로를 제거하고 명시적 변환 입력으로만 제한한다. 예전 테스트가 단지 옛 판정에 맞는다는 이유로 새 요구를 낮추지 않는다.
