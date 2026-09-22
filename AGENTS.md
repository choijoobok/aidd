# AIDD Kit 관리 수행 계약

## 범위와 권한

- 이 저장소는 업무 시스템이나 애플리케이션 프로젝트가 아니라 AIDD Kit의 `kit-source`다.
- 고객은 Kit의 목적, 배포 정책, 호환성, 위험 수용과 되돌리기 어려운 결정의 최종 책임자다.
- 이식 가능한 Kit 행동 명세는 `.ai/spec/`, 기계 판독 가능한 공개 목록은 `.ai/manifests/kit.json`을 정본으로 취급한다.
- Kit 관리 생명주기와 현재 기준선은 `.aidd-kit-dev/`의 `KIT-CHG`, 필요한 `KIT-ADR`, release 기록으로 관리한다. 과거 상세 이력은 Git에 남기며 별도 evidence 파일을 기본 요구하지 않는다.
- 루트에 제품용 `project/`를 만들지 않는다. 제품 회귀 데이터는 `.aidd-kit-dev/fixtures/`의 명시적인 fixture로만 둔다.

## 독자와 공개 경계

- Kit 관리자는 `.aidd-kit-dev/guides/kit-maintainer-guide.md`를 따른다.
- 프로젝트 수행팀은 `.ai/docs/guides/project-team-guide.md`와 export된 `AGENTS.md`를 따른다.
- 루트 `AGENTS.md`, `CLAUDE.md`, `README.md`는 `kit-source` 관리자용이다. `.aidd-kit-dev/export/`의 같은 이름 파일은 배포 루트에 놓일 프로젝트용 원본이며 서로 복사본으로 맞추지 않는다.
- `.aidd-kit-dev/` 전체와 `aidd-kit-release` 관리 스킬은 프로젝트 배포물에 포함하지 않는다.
- export는 `.aidd-kit-dev/export-manifest.json` 허용 목록으로만 조립한다. 새 루트 파일을 만들었다는 이유로 자동 배포하지 않는다.

## 작업 방식

- 훅 격리는 다른 모든 훅 설계 기준보다 우선하는 1번 규칙이다. provider·이벤트·책임별 전용 `.ai/hooks/*.mjs` 프로세스를 사용하고 런타임 훅 사이의 공통 dispatcher·공통 라이브러리·상호 import·상호 호출을 금지한다. 코드 중복은 허용한다. 한 훅의 추가·수정·삭제가 다른 훅의 명령, 실행 파일, 등록 인덱스 또는 승인 해시를 바꾸면 안 된다. provider 제약 때문에 완전 격리를 보장할 수 없으면 구현하지 말고 사용자에게 한계를 알린다.
- 한글을 포함한 모든 문서와 소스는 UTF-8(BOM 없음), 줄바꿈 LF로 관리한다. 실행 도구와 provider 훅은 Node.js 22 이상과 표준 라이브러리만 사용하며, 훅 입력은 원본 바이트를 UTF-8로 해석한다.
- Codex 세션 시작 시 `node .ai/tools/aidd_hook.mjs self-test --hook`, `node .aidd-kit-dev/tools/kit.mjs status`, `git status --short`로 훅 배선·역할·현재 변경을 확인한다. 새 `startup` 세션의 첫 사용자 요청에 대한 최종 답변(`final_answer`) 첫 줄에는 아래 문구를 그대로 한 번 표시한다. 진행 메시지(`commentary`)에 표시한 것은 이 요구를 충족한 것으로 보지 않으며, commentary에 이미 표시했더라도 final_answer에서 다시 표시한다. 이 규칙은 매 요청에 적용하지 않는다. 현재 대화의 이전 assistant `final_answer`에 이 문구가 이미 있으면 이후 응답에서는 절대 반복하지 않는다. 이 문구는 provider 자체 신뢰 기능을 확인하는 비차단 알림이며 AIDD가 승인 상태나 재시작 상태를 저장하거나 사용자의 답을 기다리거나 작업을 막지 않는다. Claude에는 이 Codex 전용 안내를 연결하지 않는다.

  > [Codex 주의] 훅은 Codex CLI에서 승인해야 작동합니다. CLI의 `/hooks`에서 승인 여부를 반드시 확인하세요. 새로 승인했다면 기존 Windows 앱 세션에는 적용되지 않으므로 새 세션 창을 여세요.
- 변경 전 해결할 실패, 영향 명세, 이식 가능 여부, 호환성·롤백과 검증 방법을 먼저 정한다. 보안·권한·신원 검토는 정본 요건에 있거나 사용자가 명시적으로 요청한 범위에서만 수행한다.
- 새 훅·스킬·도구·플러그인은 기존 수단 부족, 트리거·입출력 계약, 중복, 안전한 비활성화와 롤백을 확인한 뒤 추가한다. 새 훅은 `.ai/hooks/` 아래의 독립 `.mjs`로 만들고 Node.js 표준 라이브러리만 사용하며 `self-test`의 격리·provider 배선 검사를 통과해야 한다.
- portable 동작은 `.ai/`에서, Kit 관리 전용 동작은 `.aidd-kit-dev/`에서 구현한다. 경계가 모호하면 기본적으로 배포하지 않고 명시적인 결정으로 남긴다.
- 사용자·AI 대화 원문은 정본·증거·배포물에 포함하지 않는다. `UserPromptSubmit`은 다음 응답에 속한 사용자 원문을 모두 임시 보관하고 `Stop`이 최종 응답과 결합한 뒤, `Codex` 또는 `Claude`를 표시한 한 블록을 현재 프로젝트 루트의 `chat-history/YYYY-MM/raw/YYYY-MM-DD.md`에 잠금 아래 한 번에 추가한다. Codex와 Claude는 처리 중 추가 질의를 세션 큐에 순서대로 보존하고 transcript에서 사용자에게 실제 표시된 진행 메시지만 최선 노력으로 함께 기록하며, 추론(Claude는 thinking)·도구 호출·도구 출력·소스 diff는 기록하지 않는다. Claude는 일자 파일이 한도를 넘으면 첫 파일 이름을 그대로 두고 `YYYY-MM-DD-2.md`부터 번호를 붙인 다음 파일에 이어 쓴다. 사용자 또는 AI 한쪽만 있는 블록은 기록하지 않는다. `AIDD_CONVERSATION_LOG_FILE`은 테스트나 명시적 운영 경로가 필요할 때만 기본 경로를 대신한다.
- 공통 portable 스킬은 `.ai/skills/`, 관리 전용 스킬은 `.aidd-kit-dev/skills/`가 정본이다. 원본 provider 어댑터는 `node .aidd-kit-dev/tools/kit.mjs sync-providers`로 두 집합을 합쳐 갱신한다.
- 새롭거나 모호한 용어의 발견, 확인 카드, 추가·변경·제거와 파생 용어집 검증에는 `aidd-terminology` 스킬을 사용한다. AIDD 공통 용어 정본은 `.ai/manifests/terminology.json`, 프로젝트 용어 정본은 `project/.aidd/ssot/terminology.json`이며 생성 Markdown과 HTML은 직접 수정하지 않는다.
- 생성물이나 fixture를 제품 정본으로 가장하지 않는다. 기존 제품 fixture의 레코드는 회귀 입력일 뿐 현재 Kit 상태가 아니다.
- 사용자가 AIDD 요건·스펙 구현 검증을 요청하면 `aidd-requirement-verification` 스킬을 사용한다. 빠른 구조 검사와 요청 범위의 행위 테스트만 수행하고, 파생 문서는 현재 정본에서 다시 생성한 전체 결과와 비교한다.
- 작고 되돌릴 수 있는 증분을 선호한다. 기준선 초기화가 필요하면 현재 작업 트리에는 채택된 기준선만 남기고 과거 상세 이력은 Git에서 조회한다.

## 배포와 변경 공유

- 빈 템플릿은 `kit.mjs export`, 제품 정본까지 포함한 새 프로젝트는 `kit.mjs new-project`로 만든다.
- 폴더와 ZIP은 동일한 staging·검증 경로를 사용한다. 기존 출력 대상은 덮어쓰지 않는다.
- `.aidd-kit-origin.json`은 버전·원본 커밋·manifest·payload 해시를 기록하는 provenance일 뿐 업그레이드 잠금이나 호환성 보증이 아니다.
- 각 `KIT-CHG`는 `version_impact`를 선언한다. `kit-release-plan`은 미출시 변경의 최고 영향도로 다음 SemVer를 계산하고, `prepare-kit-release`는 검증 완료된 변경만 두 버전 정본·릴리스 귀속·릴리스 노트에 함께 반영한다. 커밋과 Git 태그는 자동 생성하지 않는다.
- 원본과 프로젝트 간 자동 업그레이드, patch 적용, merge, reverse sync를 제공하지 않는다.
- 개선은 문제·의도·환경·전제·구현 접근·검증·위험·롤백을 담은 변경 설명서로 공유한다. 수신 측은 자체 변경으로 영향 분석·승인·구현한다.
- 프로젝트가 자신의 `AGENTS.md`, 스킬, 훅, 도구와 템플릿을 바꾸는 것을 막지 않는다.

## 완료 조건

- 영향받는 `.ai/spec/`, 구현, 테스트, 독자별 가이드, export manifest, 변경·결정·릴리스 기록을 함께 검토한다.
- 스킬 변경 뒤 `node .aidd-kit-dev/tools/kit.mjs sync-providers`와 `node .aidd-kit-dev/tools/kit.mjs check`를 실행한다.
- 변경 범위에 맞는 `node <대상 test 파일>`을 실행하고, 생성기·export·new-project·provider 경계 변경에는 `node .aidd-kit-dev/tools/kit.mjs smoke`를 추가한다.
- 독립 검토, 보안 감사, 권한 검사는 변경 정본이나 사용자가 요구할 때만 추가한다. 별도 evidence 파일이나 반복 재검토를 기본 완료 조건으로 삼지 않는다.
- AI가 커밋 메시지를 작성할 때는 `.ai/templates/git/commit-message.md` 형식을 따르고, 실질 기여 AI만 마지막 trailer 묶음에 기록한다.
