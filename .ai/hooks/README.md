# AIDD 훅 계약과 정책

`.ai/hooks/policy.json`은 보호 정책, `.ai/hooks/contract.json`은 provider 공통 이벤트 계약이고, `.claude/settings.json`과 `.codex/hooks.json`은 얇은 어댑터다. `.ai/tools/aidd_hook.mjs self-test`는 두 어댑터가 같은 행동 계약을 연결했는지 검사한다. 파일 모양의 동일성이 아니라 행동 동등성이 기준이다.

- 사전 보호: 생성물 직접 쓰기, 생성물로 향하는 셸 쓰기, 명백한 파괴 명령을 차단한다. 리디렉션·`tee`·`sed -i`·복사/이동·PowerShell 쓰기 계열도 검사한다. 입력을 해석할 수 없으면 거부한다.
- 복구 차선: **정책 또는 계약 자체를 읽지 못한 내부 고장일 때만** `contract.json`에 열거된 작은 훅 런타임 파일을 고칠 수 있다. 일반적인 정책 거부를 우회하거나 제품·정본 파일을 쓰는 데 사용할 수 없다.
- 세션 검사: 시작·재개·초기화·컨텍스트 압축 시 Codex 대화 기록 훅의 신뢰 상태와 현재 프로젝트·협업·AI 평가·Git 통합 상태를 브리핑한다. 신뢰 레코드 유무와 무관하게 `/hooks` 검토·신뢰 절차와 직접 사용자 선언을 안내하며, 자동 `fetch`·`pull`·`merge`·`push`나 훅 신뢰 변경은 하지 않는다.
- 대화 원문: `UserPromptSubmit`과 `Stop` 어댑터가 제공하는 UTF-8 입력만 역할과 제품 활성화 여부에 관계없이 `chat-history/YYYY-MM/YYYY-MM-DD.md`에 날짜별 Markdown으로 남긴다. Node 런타임은 훅 원본 바이트를 UTF-8로 해석해 추가하므로 Windows 코드페이지에 의존하지 않는다. 이 경로는 Git 무시 대상이며, 상태·정본·생성 문서에는 포함하지 않는다. 따라서 `kit-template` 상태에서도 `project/`를 만들지 않는다. 흔한 토큰·비밀번호 표기를 마스킹하고 항목/일별 파일 크기를 제한한다. 저장 실패는 대화 내용을 포함하지 않는 오류 유형만 표준 오류에 경고하고 대화를 중단하지 않는다. `AIDD_LOCAL_CONVERSATION_LOG=0`이면 현재 프로세스에서는 기록하지 않는다.
- Codex Desktop에서 프로젝트 훅의 검토·신뢰 화면이 나타나지 않아도, 세션 시작 AI는 매번 `node .ai/tools/aidd.mjs hook-trust-status`와 승인 게이트를 안내한다. 이 명령은 훅을 우회 실행하거나 신뢰 상태를 바꾸지 않는다. 사용자는 터미널에서 `codex -C "<프로젝트 루트>"`를 열어 `/hooks`에서 모든 AIDD 훅을 직접 검토·신뢰한다. AI는 승인 시점을 `1) 현재 세션 시작 전에 이미 모든 AIDD 훅이 승인된 상태 2) 현재 세션 시작 후 AIDD 훅을 새로 승인한 상태` 두 선택지로만 한 번에 질문한다. 직접 검토·승인한 사실이 참이면 사용자는 `1` 또는 `2`만 답해 승인 사실과 시점을 함께 확인할 수 있다. 자연어 답변은 고정 문구가 아니라 의미로 처리하며 번호·어미·백틱 같은 표현 차이는 허용하지만, 부정·모순·모호한 답변은 승인으로 처리하지 않는다. Windows Codex 앱에서 2번이면 일반 작업은 새 앱 창에서 재시작했고 훅이 승인된 상태라는 의미를 확인할 때까지 금지된다. CLI에서는 현재 `acknowledge` 훅이 2번 답변을 실제 수신한 경우 별도 재시작 절차를 적용하지 않는다. 훅 구성·실행기·계약·관련 테스트·가이드는 잠긴 창에서도 유지보수할 수 있다. 훅 리비전이 바뀌면 Windows 앱의 이전 세션은 최신 훅을 승인한 새 앱 창에서 재개한다. CLI의 이전 세션은 `/hooks`에서 최신 훅을 승인하고 현재 `acknowledge`가 2번 답변을 실제 수신하면 시작 리비전을 갱신해 새 CLI 세션 없이 재개한다. 승인 전에는 알려진 읽기 전용 도구, 훅 유지보수, 그리고 그 세션이 관측한 경로의 명시적 `git add <path>`·로컬 `git commit`만 사용할 수 있고 분류할 수 없는 도구는 기본 차단한다. 상태는 Git 무시 `chat-history/.aidd-hook-approvals/hook-state.json`에 리비전·세션 시작 리비전·관측 경로만 기록한다. Claude에는 이 승인 게이트를 적용하지 않는다. `TRUST_RECORD_FOUND`는 신뢰 레코드의 존재만 뜻하며 현재 해시 일치·실제 실행·저장 성공의 증거가 아니다.
- 훅 신뢰 리비전은 실제 Codex provider 정의 `.codex/hooks.json`만 해시한다. `/hooks`에 새 정의가 나타나는 이 파일의 내용 변경만 version 3 세션의 재승인을 요구하고, 정의를 바꾸지 않는 정책·실행기·계약·테스트·가이드 수정은 세션을 잠그지 않는다. 기존 version 2 상태에는 당시 provider 정의 단독 해시가 없으므로 `approved`를 자동 승격하지 않고 현재 리비전의 `unconfirmed`로 한 번 마이그레이션한다. `/hooks`가 이미 active라면 사용자는 기존 승인 선택 `1`로 다시 확인할 수 있다.
- export된 provider 명령은 아직 Git 저장소가 아닌 템플릿에서도 동작하도록 모든 이벤트에서 `codex -C "<프로젝트 루트>"`의 작업 디렉터리를 기준으로 `.ai/` 경로를 해석한다.
- 잠긴 세션의 shell 읽기 예외는 하나의 완결된 명령에만 적용한다. 따옴표 밖의 `;`, 파이프, 개행, 리다이렉션, backtick·`$()`·`()`·`@()` 명령/그룹/배열 식과 쓰기 가능한 Git·`rg --pre` 변형은 차단한다. Windows package 또는 명시적인 Desktop origin은 앱으로, origin과 package가 모두 없는 실제 CLI 환경은 CLI로 식별한다. 그 밖의 알 수 없는 origin은 신규 승인을 현재 세션에 즉시 적용하지 않고 새 세션 확인을 요구한다.
- 잠긴 세션의 close-out은 그 세션이 관측한 literal 경로를 하나씩 명시한 `git add`만 허용한다. 옵션, pathspec magic, 와일드카드와 광범위 경로는 허용하지 않는다. 로컬 커밋은 메시지 인자 형식만 허용하며, staged 집합이 비어 있지 않고 모든 staged 경로가 관측 경로일 때만 실행할 수 있다. amend 같은 기존 커밋 변경은 허용하지 않는다.
- Codex의 Windows `commandWindows`는 바깥 PowerShell이 명령 문자열을 먼저 해석한다. 중첩된 `powershell.exe -Command`가 사용할 `$repo`·`$LASTEXITCODE` 같은 변수는 backtick으로 escape해 내부 PowerShell까지 보존하며, 회귀 테스트도 handler 문자열을 바깥 `powershell.exe -Command`의 인자로 전달해 Desktop 실행 경계를 재현한다.
- Git pre-commit: `.githooks/pre-commit`이 브랜치 정책 다음에 `documentation-check --staged`를 실행한다. staged `project/src/` 변경은 모듈별 `SURF` 소스 패턴에 매핑되어야 하며 기존 문서 정본이 함께 staged되거나, 문서가 없는 기존 기능에 한해 고객이 선택한 기한 있는 현행화 WRK가 있어야 한다.
- 이 훅은 편의와 실수 방지 통제다. 셸 파서, OS 권한, 원격 브랜치 보호 또는 보안 경계를 대체하지 않는다.

새 훅·스킬·플러그인·도구는 다음을 모두 설명한 뒤에만 수용한다: (1) 해결할 구체적 실패, (2) 기존 조합으로 해결되지 않는 이유, (3) 계약·트리거·출력, (4) 기존 항목과의 중복 여부, (5) 로컬에서 안전하게 비활성화·되돌리는 방법. 외부 서비스는 추가로 권한, 프롬프트 주입, 개인정보·비밀정보, 장애 시 안전한 동작을 검토한다.

새 훅 대상은 반드시 `.ai/tools/` 아래의 `.mjs`로 두고 `contract.json`의 `node_runtime` 계약을 따른다. `self-test`는 provider JSON이 Node 정본만 참조하고 비-Node 실행 경로를 포함하지 않는지, Node 22 이상인지, 공통 스킬이 동기화됐는지 검사한다. 새 훅에는 실제 provider 명령으로 비 ASCII JSON을 전달하는 회귀 사례를 추가한다.

공통 AI 수행 계약은 `AGENTS.md`에서, 훅·스킬 정본과 정책은 `.ai/**`에서 수정한다. `sync-ai`로 `.agents/skills/**`와 `.claude/skills/**`를 재생성하며 파생 provider 스킬을 직접 수정하지 않는다. `CLAUDE.md`는 `@AGENTS.md`를 import하는 Claude 전용 어댑터다.
