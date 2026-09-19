<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 골든 패스와 참조 구현

## GPH-001 — 정본 변경의 최소 골든 패스

- 상태: `최신`
- 범위: AIDD 정본·생성기 변경
- 적용 표준: STD-001
- 모듈: MOD-GOV, MOD-DOC, MOD-QA
- 구현 경로: .ai/tools/aidd.mjs, .aidd-kit-dev/tests/aidd.test.mjs
- 테스트: TC-024, TC-025

1. 관련 안정 ID와 변경 레코드를 확인한다.
2. 구조화 정본과 검증기를 같은 증분에서 갱신한다.
3. node .ai/tools/aidd.mjs generate를 실행한다.
4. node .ai/tools/aidd.mjs validate와 전체 Node 테스트를 실행한다.
5. working-tree 증거와 미승인 게이트 상태를 사실대로 기록한다.
