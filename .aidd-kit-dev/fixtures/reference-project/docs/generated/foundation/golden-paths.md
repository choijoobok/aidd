<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 골든 패스

## 골든 패스

### GPH-001 — 정본 변경의 최소 골든 패스

- **id:** GPH-001
- **title:** 정본 변경의 최소 골든 패스
- **status:** current
- **scope:** AIDD 정본·생성기 변경
- **standards:** STD-001
- **modules:** MOD-GOV, MOD-DOC, MOD-QA
- **requirements:** REQ-002, REQ-031
- **steps:** 관련 안정 ID와 변경 레코드를 확인한다., 구조화 정본과 검증기를 같은 증분에서 갱신한다., node .ai/tools/aidd.mjs generate를 실행한다., node .ai/tools/aidd.mjs validate와 변경 영역의 관련 테스트를 실행한다., working-tree 증거와 미통과 게이트 상태를 사실대로 기록한다.
- **implementation_paths:** .ai/tools/aidd.mjs, .ai/tests/harness.test.mjs
- **tests:** TC-024, TC-025
- **supersedes:** -
- **replaced_by:** -
