# AIDD Kit 관리 수행 계약

## 범위와 권한

- 이 저장소는 업무 시스템이나 애플리케이션 프로젝트가 아니라 AIDD Kit의 `kit-source`다.
- 고객은 Kit의 목적, 배포 정책, 호환성, 위험 수용과 되돌리기 어려운 결정의 최종 책임자다.
- 이식 가능한 Kit 행동 명세는 `.ai/spec/`, 기계 판독 가능한 공개 목록은 `.ai/manifests/kit.json`을 정본으로 취급한다.
- Kit 관리 생명주기와 이력은 `.aidd-kit-dev/`의 `KIT-CHG`, `KIT-ADR`, evidence, release 기록으로 관리한다.
- 루트에 제품용 `project/`를 만들지 않는다. 제품 회귀 데이터는 `.aidd-kit-dev/fixtures/`의 명시적인 fixture로만 둔다.

## 독자와 공개 경계

- Kit 관리자는 `.aidd-kit-dev/guides/kit-maintainer-guide.md`를 따른다.
- 프로젝트 수행팀은 `.ai/docs/guides/project-team-guide.md`와 export된 `AGENTS.md`를 따른다.
- `.aidd-kit-dev/` 전체와 `aidd-kit-release` 관리 스킬은 프로젝트 배포물에 포함하지 않는다.
- export는 `.aidd-kit-dev/export-manifest.json` 허용 목록으로만 조립한다. 새 루트 파일을 만들었다는 이유로 자동 배포하지 않는다.

## 작업 방식

- 한글을 포함한 모든 문서와 소스는 UTF-8(BOM 없음), 줄바꿈 LF로 관리한다. 실행 도구와 provider 훅은 Node.js 22 이상과 표준 라이브러리만 사용하며, 훅 입력은 원본 바이트를 UTF-8로 해석한다.
- Codex 세션 시작 시 먼저 `node .ai/tools/aidd.mjs hook-trust-status`를 실행하고, 신뢰 레코드 유무와 무관하게 사용자에게 터미널에서 `codex -C "<현재 루트>"`를 연 뒤 `/hooks`에서 모든 AIDD 훅을 검토·신뢰하도록 안내한다. 이어 `1) 현재 세션 시작 전에 이미 모든 AIDD 훅이 승인된 상태 2) 현재 세션 시작 후 AIDD 훅을 새로 승인한 상태` 두 선택지만 한 질문으로 제시한다. 사용자는 직접 검토·승인한 사실이 참일 때 `1` 또는 `2`만 답해도 승인 사실과 시점을 함께 확인할 수 있다. 자연어 응답도 고정 문구를 요구하지 않고 의미로 처리하되 부정·모순·모호한 답변은 다시 확인한다. Windows Codex 앱에서 2번이면 현재 창의 일반 작업을 금지하고 새 앱 창에서 재시작·승인 상태를 의미상 확인한 뒤 진행한다. CLI에서는 현재 `acknowledge` 훅이 2번 답변을 실제 수신한 경우 별도 앱 재시작 절차를 적용하지 않는다. 훅 리비전이 세션 시작 뒤 변경되면 앱과 CLI 모두 최신 훅을 승인한 뒤 같은 클라이언트의 새 세션에서 재개한다. 그 뒤 `node .aidd-kit-dev/tools/kit.mjs status`와 `git status --short`로 역할, 현재 변경, 작업 트리를 확인한다.
- 변경 전 해결할 실패, 영향 명세, 이식 가능 여부, 호환성·보안·롤백과 검증 방법을 먼저 정한다.
- 새 훅·스킬·도구·플러그인은 기존 수단 부족, 트리거·입출력 계약, 중복, 안전한 비활성화와 롤백을 확인한 뒤 추가한다. 새 훅은 `.ai/tools/` 아래의 `.mjs`로 만들고 Node.js 표준 라이브러리만 사용하며 `self-test`의 provider 배선 검사를 통과해야 한다.
- portable 동작은 `.ai/`에서, Kit 관리 전용 동작은 `.aidd-kit-dev/`에서 구현한다. 경계가 모호하면 기본적으로 배포하지 않고 명시적인 결정으로 남긴다.
- 사용자·AI 대화 원문은 정본·증거·배포물에 포함하지 않는다. 훅이 제공한 원문만 역할과 제품 활성화 여부에 관계없이 Git 무시 루트 `chat-history/`에 로컬 기록한다.
- 공통 portable 스킬은 `.ai/skills/`, 관리 전용 스킬은 `.aidd-kit-dev/skills/`가 정본이다. 원본 provider 어댑터는 `node .aidd-kit-dev/tools/kit.mjs sync-providers`로 두 집합을 합쳐 갱신한다.
- 생성물이나 fixture를 제품 정본으로 가장하지 않는다. 기존 제품 fixture의 레코드는 회귀 입력일 뿐 현재 Kit 상태가 아니다.
- 작고 되돌릴 수 있는 증분을 선호하고 과거 결정·검증 이력을 지우지 않는다.

## 배포와 변경 공유

- 빈 템플릿은 `kit.mjs export`, 제품 정본까지 포함한 새 프로젝트는 `kit.mjs new-project`로 만든다.
- 폴더와 ZIP은 동일한 staging·검증 경로를 사용한다. 기존 출력 대상은 덮어쓰지 않는다.
- `.aidd-kit-origin.json`은 버전·원본 커밋·manifest·payload 해시를 기록하는 provenance일 뿐 업그레이드 잠금이나 호환성 보증이 아니다.
- 원본과 프로젝트 간 자동 업그레이드, patch 적용, merge, reverse sync를 제공하지 않는다.
- 개선은 문제·의도·환경·전제·구현 접근·검증·위험·롤백을 담은 변경 설명서로 공유한다. 수신 측은 자체 변경으로 영향 분석·승인·구현한다.
- 프로젝트가 자신의 `AGENTS.md`, 스킬, 훅, 도구와 템플릿을 바꾸는 것을 막지 않는다.

## 완료 조건

- 영향받는 `.ai/spec/`, 구현, 테스트, 독자별 가이드, export manifest, 변경·결정·릴리스 기록을 함께 검토한다.
- `node .aidd-kit-dev/tools/kit.mjs sync-providers`와 `node .aidd-kit-dev/tools/kit.mjs validate`를 실행한다.
- `node --test .aidd-kit-dev/tests/*.test.mjs`와 `node --test .ai/tests/*.test.mjs`를 실행한다.
- 샘플 `new-project`에서 AIDD `validate`와 provider 스킬 동일성을 확인한다.
- C2·C3 변경은 구현 흐름과 분리된 AI 검토 세션 또는 사람 검토 증거가 있기 전에는 완료·검증·출시 준비 완료로 표시하지 않는다.
- AI가 커밋 메시지를 작성할 때는 `.ai/templates/git/commit-message.md` 형식을 따르고, 실질 기여 AI만 마지막 trailer 묶음에 기록한다.
