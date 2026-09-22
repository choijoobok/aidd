# S04~S07 구현·검증 위치

제출 당시 design/assets.json(기존 367개)은 불변 설계 인벤토리다. 현재 증분과 잔여 통합은 이 파일과 status.json을 함께 읽는다.

| 책임 | 구현 | 실제 시험 |
|---|---|---|
| v2 외피/정의·분석 해시/타입 필드 | .ai/tools/lib/record-contracts.mjs, manifests/record-types.json, owned-record.schema.json | owned-contracts, record-store |
| scope read/ID/현재·과거/진단 | record-store.mjs | record-store, lifecycle-operations |
| owner/type/page index | record-index.mjs | record-store |
| CAS/lock/저널/복구/replay | record-transaction.mjs | record-store, owned-cli(two processes) |
| CHG/요구/검토/BSL/GTR | readiness.mjs, lifecycle-operations.mjs, readiness-policies.json | lifecycle-readiness, lifecycle-operations |
| FEAT/SCR/목업/작업/릴리스 | readiness.mjs, prototype-renderer.mjs, semantic-validation.mjs | design-impact |
| typed 영향·선택적 재개 | dependency-graph.mjs | design-impact |
| 브리핑·ID별 문서·제출 | record-views.mjs, document-renderer.mjs | scoped-documents |
| 기존 진입점/v2 라우팅 | aidd.mjs, owned-cli.mjs, kit.mjs bootstrap 경계 | owned-cli, 기존 Kit/aidd 회귀, smoke |
| 독립 훅 | protect-file/shell 4개, post-check 2개; 기존 등록 슬롯/명령 유지 | harness, owned-hooks, hook self-test |
| 수행 지침 | owned-records-v2.md, owned-records-workflow.md, 관련 10개 portable 스킬 | Kit check, sync-providers |

추가된 관리 테스트는 9개 파일과 tests/helpers/modular-fixture.mjs이며 제품 정본이 아니다. equivalence-exceptions 시험은 현재 사용자 동등성 수용 및 정책·해시·만료에 한정된 예외와 필수 요구 승인 면제 금지를 검증한다. 임시 작업공간은 테스트 종료 시 정리한다. 프로젝트 `.aidd/work/`와 index는 배포 루트 gitignore에서 제외하며 snapshots는 역사적 정본 원문으로 보존한다.

## S07A 시스템·업무 분석 보완

- 정본/완료 조건: `.ai/spec/business-discovery.md`, `business-discovery.mjs`, record-contracts와 두 공개 JSON 계약.
- scope·검토·기준선: readiness/lifecycle-operations/record-transaction/owned-cli. BG-001/discovery-check, requirements/development/release의 선행 분석, 묶음 검토 저장, 현재 출처와 단계별 누락 검사.
- 영향: dependency-graph의 derived_from/performed_by/realizes 및 BPR 내부 actor/use_case/subprocess 참조. 기존 IMP 선택적 재개 유지.
- 출력: process-renderer의 오프라인 SVG, document-renderer의 공통 인덱스/SYS 홈/BPR 명세·흐름도/내부 설계 제출, record-views의 discovery 준비도.
- 수행: discovery/lifecycle/architecture/status 스킬 및 참조·팀 가이드. provider sync를 사용하고 런타임 훅/등록 슬롯은 변경하지 않는다.
- 회귀: business-discovery.test.mjs와 modular-fixture, lifecycle-operations 실제 저장 시험. 검증 결과는 최신 체크포인트가 정본이다.

## S08 전수 통합

### S08B-1 일반 레거시 역분석 초안

`reverse-engineering.md`와 KIT-ADR-012에 입력/출력·출처·미정·ID·적용 계약을 둔다. `legacy-inventory.mjs`는 범위·해시·처리 coverage를, `legacy-drafts.mjs`는 LDP/DOC/SURF·업무 정본/CHG/OI 생성과 생성 전용 CAS를 담당하고 `owned-cli.mjs`에서 연결한다. 기존 transaction/index/문서/게이트를 재사용하며 legacy 스킬·두 provider·팀 가이드를 갱신했다. `legacy-reverse.test.mjs` 14건이 RE-AC-01~06과 검토 입력/독립 모듈 CAS를 검증한다.

### S08B-2 순차 사용자 검토·재분석·영향

`legacy-review-reanalysis.md`와 KIT-ADR-013을 따른다. `legacy-review.mjs`는 항목별 순차 묶음·OI/DRQ·부분/오래된 답변의 RVW/HIS를, `legacy-reanalysis.mjs`는 생성 기준/현재/새 제안의 세 버전 비교와 명시 채택·생성 기준 DOC·검토 OI/pending IMP를 담당한다. `legacy-source-check.mjs`는 선언 루트의 자료 변경과 영향 경로를 읽기 전용으로 확인하며 `source-documentation.mjs`의 staged 검사에 연결한다. `record-views.mjs`의 브리핑과 파생 문서는 같은 검토 모델을 사용한다. `legacy-review-reanalysis.test.mjs` 14건은 RE-AC-07~11 및 RE-AC-16의 검토/재분석 부분을 검증한다. 기존 핵심 impactGraph/transaction을 재사용하며 새 runtime 훅은 없다.

### S08B-3 모듈별 문서 채택·실제 검증 연결

`legacy-adoption.md`와 KIT-ADR-014를 따른다. `legacy-adoption.mjs`는 한 모듈 CHG의 기존 요구/검토 준비·계획·차이 작업 연결과 실제 EVD의 현재 입력/최신 결과를 별도로 평가한다. `legacy-adopt`는 DOC/HIS만 CAS 저장한다. `legacy-source-check`는 채택 시 관련 모듈/공통 조회를 사용할 수 있고, 브리핑/파생 문서는 동일 순수 모델의 source_check 미실행 경계를 표시한다. `legacy-adoption.test.mjs`는 RE-AC-12~16과 모듈 격리·실제 증거/소스 변경·후속 정상 게이트·복구/CLI를 검증한다. 실행기/훅/정본 유형을 추가하지 않았다.

### S08A 접속 정책 증분

`system-access.md`와 CLI 내부 `system-access.mjs`에 POL 하위 계약·ACT/UC 참조·필수 상세·인증 모순·역할/요구 연결 판정을 둔다. business-discovery/readiness/record-transaction 및 두 공개 필드 계약에 연결한다. 기존 참조 파이프라인으로 조회·인덱스·검토/BSL·영향·상태·문서가 연결되며 내부 설계 제출에도 정책을 포함한다. discovery/architecture/lifecycle 스킬과 가이드·provider 복사본을 보완한다. 회귀 입력과 system-access.test.mjs는 Kit 관리 전용이다. 상세 결과는 checkpoints/S08A.md와 status.json을 따른다.

- 전문 명령은 specialty-operations, staged 문서는 source-documentation에 연결했다. gate 의미·단계별 입력, DRQ 질문 묶음과 명시적 의존 필드의 영향 전파를 보완했다.
- portable 17개 스킬은 specialty-integration 계약에 연결하고 전역 경로·FEAT 설명·자동 초기화·호환 명령 지침을 정리했다. 관리 스킬 경계는 유지하며 367개 처리 내역은 integration/README.md에 있다.
- 본문 scope 조회는 실제 파일 이름 인벤토리에서 찾고 필요한 본문을 읽는다. 인덱스는 탐색/최신성용이며 정본으로 승격하지 않았다. 모든 유효성에서 file mtime만 믿지 않는다.
- 실제 provider 프로젝트 진행 평가와 브라우저별 시각/접근성은 not_run이다. 이전 AIDD 전용 변환은 KIT-ADR-011로 취소했다.
- 파일시스템 동시성은 협력 writer/로컬 FS 기준이다. 비협력 편집기·분산 FS·전원 장애의 완전 원자성을 보증하지 않는다.

## S09~S10 배포·최종 인수

- `kit.mjs`는 v2-only new-project, 초기 파생 문서/검증, mixed legacy SSOT 거부와 directory/ZIP 내용 동등성을 확인한다. `s09-distribution.test.mjs`와 `v2-distribution-contract.json`에 연결된다.
- 신규 스켈레톤은 `owned-record.schema.json`만 공개하고 구형 자유형 artifact schema는 legacy fixture에만 보존한다. 프로젝트/Kit CI는 각각 v2 문서·검증 회귀와 전체 Kit 회귀·smoke를 실행한다.
- S08의 S09 잔여 59개는 `integration/S09-disposition.json`에서 전수 대응한다.
- `acceptance/S10-results.json`과 `s10-acceptance.test.mjs`가 요구 21개·인수 기준 63개·시나리오 22개의 현재 결과를 연결한다. KIT-REQ-018-020은 KIT-ADR-011로 superseded이며 passed로 세지 않는다.
