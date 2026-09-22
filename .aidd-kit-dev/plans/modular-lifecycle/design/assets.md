# 전체 자산 영향 목록

S03 조사 범위는 Git 추적 파일과 무시되지 않은 신규 파일에서 이 계획 폴더를 제외한 **기존 367개 파일**이다. 실제 동작의 구현 완료나 모든 줄의 독립 감리를 뜻하지 않는다. 책임별 영향을 전수 분류했고, 구체 내용 검토는 스킬/참조·핵심 명세·저장/판정/생성 경계에 집중했다.

파일마다 조사 시 원본 SHA256, 처리 그룹, 구현 계획 상태를 기록했다. 이후 단계에서는 변경 여부와 처리/검증 결과를 갱신한다. 현재 변경·관리 상태 파일의 해시는 조사 당시 값이며 앞으로도 같은 값이어야 한다는 잠금이 아니다.

## 파일 분할과 탐색

처리 규칙 정본은 [assets.json](assets.json), 파일별 행은 다음 조각에 있다. 중복 목록을 직접 유지하지 않는다.

| 조각 | 파일 수 | 주요 내용 |
|---|---:|---|
| [공개 계약·가이드](assets/public-contracts.json) | 20 | spec·manifest·방법론·프로젝트 팀 문서 |
| [원본 스킬·참조](assets/skills.json) | 43 | portable 17개 + 관리 1개의 본문·references·표시 metadata |
| [훅](assets/hooks.json) | 16 | 13개 독립 실행 파일·contract/policy/README |
| [런타임·테스트](assets/runtime-tests.json) | 16 | CLI·Kit 도구·회귀/평가 입력 |
| [템플릿](assets/templates.json) | 22 | artifact·프로젝트 골격·site assets·커밋 형식 |
| [루트·export 원본](assets/root-and-export.json) | 24 | 역할별 AGENTS/README/CLAUDE, provider 등록·CI·Git 정책 |
| [관리 기록](assets/management.json) | 33 | 기존 변경/ADR/릴리스·관리 가이드·manifest |
| [fixture 입력](assets/fixture-source.json) | 53 | 구형 정본·schema·fixture 안내 |
| [fixture 생성물](assets/fixture-generated.json) | 54 | 직접 수정 금지, 정본에서 전체 재생성 |
| [provider 스킬 복사본](assets/provider-copies.json) | 86 | 원본 sync로만 갱신 |

현재 분류: 유지 67, 수정 108, 구조 교체 52, 재생성 140. 이는 작업량/완료율이 아니다. 한 처리 그룹은 공통 이유와 단계 범위를 가지며, 스킬별 구체 내용은 [스킬 영향표](06-views-harness.md)에 따로 설명한다.

## 주요 교체와 보존

- aidd.mjs: 명령 진입점은 유지하고 내부 FILES/loadRecords/전역 판정/통합 생성 구현을 분리·교체한다.
- 기능 명세: no-FEAT 정책과 워크시트를 명시적으로 대체한다. 기존 기능 ID를 보존하는 것이 아니라 새 FEAT를 생성하고 기존 요구/화면/테스트에 연결한다.
- 전역 배열: 모듈/공통 레코드로 분할한다. 기존 프로젝트를 변환할 때만 ID/내용/역사적 증거를 보존하며 신규 프로젝트에는 구형 데이터를 만들지 않는다.
- 기존 훅 중 7개는 그대로 유지, 보호 4개와 후처리 2개만 대상 경로/허용 계약을 수정한다. 등록부와 runtime isolation은 유지한다.
- provider 스킬 86개 파일은 독립적인 수작업 수정 대상이 아니라 43개 원본 파일의 복사 결과다.
- 과거 KIT-CHG/KIT-ADR/릴리스는 새 의미로 다시 작성하지 않는다. KIT-ADR-006~009는 신규 제안이며, 006/007은 004의 물리 저장/범위 해석을 명시적으로 보완한다.
- export manifest는 현재 `.ai` 허용 범위로 새 하위 lib·schema·manifest를 포함할 수 있으므로 불필요하게 넓히지 않는다. 실제 staging에서 관리 파일 배제와 새 파일 포함을 확인한다.

## 신규 파일 계획

현재 inventory는 기존 파일이다. 다음 신규 경로는 승인 이후 구현 단계에 추가하고 inventory에 편입한다.

- S03 관리 산출물: 이 설계 폴더, KIT-ADR-006~009, S03 체크포인트. 공개 export 대상이 아니다.
- S04 일반 CLI 기반: `.ai/tools/lib/record-store.mjs`, `record-contracts.mjs`, `record-index.mjs`, `record-transaction.mjs`, `dependency-graph.mjs`, `legacy-records.mjs`, 초기 `record-views.mjs`, `document-renderer.mjs`.
- S04 계약: `.ai/manifests/record-types.json`, `.ai/spec/record-storage.md`, 프로젝트 골격의 `.aidd/schemas/record.schema.json` 및 타입별 schema. 기존 artifact.schema.json은 새 공통 외피와 대응시킨다.
- S05: `.ai/tools/lib/readiness.mjs`, `.ai/manifests/readiness-policies.json`, `.ai/spec/requirements-review.md` 및 requirement/review/baseline schema.
- S06: `.ai/spec/readiness-and-impact.md`, feature/impact schema와 기존 화면 template의 상세화. 새 runtime hook이나 새 skill은 계획하지 않는다.
- S09: `.ai/tools/lib/record-migration.mjs`, `.ai/spec/format-transition.md`.
- 관리 회귀: `.aidd-kit-dev/tests/record-store.test.mjs`, `lifecycle-readiness.test.mjs`, `design-impact.test.mjs`, `scoped-documents.test.mjs`, `migration.test.mjs`; `.aidd-kit-dev/fixtures/modular-lifecycle/`, `legacy-v1/`.
- 생성 대상: 실제 프로젝트의 owner별 정본·index/snapshots와 항목별 docs/generated. kit-source 루트에 project를 만들지 않는다.

## 누락·드리프트 검사

1. `git ls-files --cached --others --exclude-standard`의 중복을 제거하고 현재 계획 경로 및 이번 단계의 명시적 신규 파일을 구분한다.
2. assets.json의 shards를 읽어 파일 경로 집합을 합친다. 중복·분류 없는 항목·실제 없는 파일·새로 생겼지만 미분류인 파일을 보고한다.
3. 원본 스킬 집합과 두 provider 스킬의 상대 경로를 대조한다. 관리 스킬의 배포 제외를 별도로 확인한다.
4. 조사 시 해시와 현재 차이를 검토해 이후 사용자 변경이나 구현 변경을 분리한다. 다른 변경을 자동 되돌리거나 과거 해시로 덮어쓰지 않는다.
5. 모든 planned 항목이 처리/유지 근거와 검증 결과에 연결되어야 S08/S10 통합 완료다. 단순 전수 열거를 실제 동작 검증 완료로 바꾸지 않는다.
