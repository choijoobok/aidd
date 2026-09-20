@AGENTS.md

# Claude Code 전용 어댑터

공통 AI 수행 계약의 정본은 [`AGENTS.md`](AGENTS.md)다. 이 파일에는 Claude Code에서만 달라지는 연결 정보만 둔다.

- 공통 규칙은 `AGENTS.md`에서 수정하며 이 파일에 복제하지 않는다.
- 공통 스킬의 정본은 `.ai/skills/`이고 `sync-ai`가 `.claude/skills/`를 갱신한다.
- Claude Code 생애주기 훅은 `.claude/settings.json`이 `.ai/hooks/contract.json`의 공통 행동을 연결한다.
- Codex 전용 `/hooks` 검토·신뢰 안내는 Claude에 연결하지 않는다. Claude Code의 실제 훅 연결과 실행 정책은 `.claude/settings.json`과 Claude 자체 기능을 따른다.
- Claude 전용 차이가 새로 필요할 때만 이 파일에 추가하고, 공통화할 수 있는 규칙은 `AGENTS.md` 또는 `.ai` 정본으로 올린다.
