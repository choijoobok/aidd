---
name: aidd-harness-management
description: AIDD 훅, AI 스킬, provider 어댑터, 새 도구 또는 플러그인의 수용·변경과 공통 계약 검증을 관리한다. 훅·스킬·어댑터·자동화 추가 또는 변경에 사용한다.
---

# AIDD 하네스 관리

1. 공통 AI 수행 계약은 루트 `AGENTS.md`를 단일 정본으로 사용하고 `CLAUDE.md`는 이를 import하는 얇은 Claude 전용 어댑터로 유지한다. 공통 스킬·훅·도구·템플릿은 `.ai`를 정본으로 사용하며 provider별 JSON·스킬 복사본을 직접 고치지 않는다.
2. 새 훅·스킬·도구·플러그인은 해결할 실패, 기존 수단 부족, 트리거·입출력 계약, 중복 여부, 비활성화·롤백을 먼저 검토한다. 보안·권한 검사는 적용 정본이나 사용자가 명시적으로 요구할 때만 추가한다.
3. 공통 행동은 `.ai/hooks/contract.json`에 먼저 정의하고, Codex와 Claude의 지원 이벤트·입력 차이는 얇은 어댑터에서 처리한다. 한 provider에 없는 이벤트를 지원되는 것처럼 가장하지 않는다.
4. 보호 훅의 정책 거부와 런타임 고장을 구분한다. 복구 차선은 계약에 열거된 훅 런타임 파일만 허용하며 정상 정책 거부를 우회하지 않는다.
5. 변경 후 `node .aidd-kit-dev/tools/kit.mjs sync-providers`, `node .ai/tools/aidd_hook.mjs self-test --hook`, 관련 행위 테스트를 실행한다. provider별 별도 평가나 기록은 사용자가 요청하거나 실제 provider 차이를 재현할 때만 만든다.
