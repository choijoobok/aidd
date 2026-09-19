@AGENTS.md

# Claude Code 전용 어댑터

공통 AI 수행 계약의 정본은 [`AGENTS.md`](AGENTS.md)다. 이 파일에는 Claude Code에서만 달라지는 연결 정보만 둔다.

- 공통 규칙은 `AGENTS.md`에서 수정하며 이 파일에 복제하지 않는다.
- 프로젝트에도 배포하는 스킬 정본은 `.ai/skills/`, Kit 관리 전용 스킬 정본은 `.aidd-kit-dev/skills/`다. `node .aidd-kit-dev/tools/kit.mjs sync-providers`가 원본 저장소의 `.claude/skills/`를 두 집합으로 갱신한다.
- Claude Code 생애주기 훅은 `.claude/settings.json`이 `.ai/hooks/contract.json`의 공통 행동을 연결한다.
- Claude 전용 차이가 새로 필요할 때만 이 파일에 추가한다. 프로젝트에도 전달할 규칙은 `AGENTS.md` 또는 `.ai`에, 관리 전용 규칙은 `.aidd-kit-dev/`에 둔다.
