# AIDD 훅 계약과 정책

`.ai/hooks/policy.json`은 보호 정책, `.ai/hooks/contract.json`은 provider 공통 이벤트 계약이고, `.claude/settings.json`과 `.codex/hooks.json`은 얇은 어댑터다. `.ai/tools/aidd_hook.mjs self-test`는 두 어댑터가 같은 행동 계약을 연결했는지 검사한다. 파일 모양의 동일성이 아니라 행동 동등성이 기준이다.

- 사전 보호: 생성물 직접 쓰기, 생성물로 향하는 셸 쓰기, 명백한 파괴 명령을 차단한다. 리디렉션·`tee`·`sed -i`·복사/이동·PowerShell 쓰기 계열도 검사한다. 입력을 해석할 수 없으면 거부한다.
- 복구 차선: **정책 또는 계약 자체를 읽지 못한 내부 고장일 때만** `contract.json`에 열거된 작은 훅 런타임 파일을 고칠 수 있다. 일반적인 정책 거부를 우회하거나 제품·정본 파일을 쓰는 데 사용할 수 없다.
- 세션 검사: 현재 프로젝트·협업·AI 평가와 Git 통합 상태를 브리핑한다. 자동 `fetch`·`pull`·`merge`·`push`는 하지 않는다.
- 대화 원문: `UserPromptSubmit`과 `Stop` 어댑터가 제공하는 UTF-8 입력만 역할과 제품 활성화 여부에 관계없이 `chat-history/YYYY-MM/YYYY-MM-DD.md`에 날짜별 Markdown으로 남긴다. Node 런타임은 훅 원본 바이트를 UTF-8로 해석해 추가하므로 Windows 코드페이지에 의존하지 않는다. 이 경로는 Git 무시 대상이며, 상태·정본·생성 문서에는 포함하지 않는다. 따라서 `kit-template` 상태에서도 `project/`를 만들지 않는다. 흔한 토큰·비밀번호 표기를 마스킹하고 항목/일별 파일 크기를 제한한다. 저장 실패는 대화 내용을 포함하지 않는 오류 유형만 표준 오류에 경고하고 대화를 중단하지 않는다. `AIDD_LOCAL_CONVERSATION_LOG=0`이면 현재 프로세스에서는 기록하지 않는다.
- Codex Desktop에서 프로젝트 훅의 검토·신뢰 화면이 나타나지 않은 경우, 세션 시작 AI는 `node .ai/tools/aidd.mjs hook-trust-status`로 신뢰 기록 부재를 알린다. 이 명령은 훅을 우회 실행하거나 신뢰 상태를 바꾸지 않는다. 사용자는 터미널에서 `codex -C "<프로젝트 루트>"`를 열어 `/hooks`에서 `UserPromptSubmit`과 `Stop` 훅을 직접 검토·신뢰한다. `TRUST_RECORD_FOUND`는 신뢰 레코드의 존재만 뜻하며 현재 해시 일치·실제 실행·저장 성공의 증거가 아니므로, 다음 대화가 `chat-history/`에 기록되는지도 확인한다.
- Codex의 Windows `commandWindows`는 바깥 PowerShell이 명령 문자열을 먼저 해석한다. 중첩된 `powershell.exe -Command`가 사용할 `$repo`·`$LASTEXITCODE` 같은 변수는 backtick으로 escape해 내부 PowerShell까지 보존하며, 회귀 테스트도 handler 문자열을 바깥 `powershell.exe -Command`의 인자로 전달해 Desktop 실행 경계를 재현한다.
- Git pre-commit: `.githooks/pre-commit`이 브랜치 정책 다음에 `documentation-check --staged`를 실행한다. staged `project/src/` 변경은 모듈별 `SURF` 소스 패턴에 매핑되어야 하며 기존 문서 정본이 함께 staged되거나, 문서가 없는 기존 기능에 한해 고객이 선택한 기한 있는 현행화 WRK가 있어야 한다.
- 이 훅은 편의와 실수 방지 통제다. 셸 파서, OS 권한, 원격 브랜치 보호 또는 보안 경계를 대체하지 않는다.

새 훅·스킬·플러그인·도구는 다음을 모두 설명한 뒤에만 수용한다: (1) 해결할 구체적 실패, (2) 기존 조합으로 해결되지 않는 이유, (3) 계약·트리거·출력, (4) 기존 항목과의 중복 여부, (5) 로컬에서 안전하게 비활성화·되돌리는 방법. 외부 서비스는 추가로 권한, 프롬프트 주입, 개인정보·비밀정보, 장애 시 안전한 동작을 검토한다.

새 훅 대상은 반드시 `.ai/tools/` 아래의 `.mjs`로 두고 `contract.json`의 `node_runtime` 계약을 따른다. `self-test`는 provider JSON이 Node 정본만 참조하고 비-Node 실행 경로를 포함하지 않는지, Node 22 이상인지, 공통 스킬이 동기화됐는지 검사한다. 새 훅에는 실제 provider 명령으로 비 ASCII JSON을 전달하는 회귀 사례를 추가한다.

공통 AI 수행 계약은 `AGENTS.md`에서, 훅·스킬 정본과 정책은 `.ai/**`에서 수정한다. `sync-ai`로 `.agents/skills/**`와 `.claude/skills/**`를 재생성하며 파생 provider 스킬을 직접 수정하지 않는다. `CLAUDE.md`는 `@AGENTS.md`를 import하는 Claude 전용 어댑터다.
