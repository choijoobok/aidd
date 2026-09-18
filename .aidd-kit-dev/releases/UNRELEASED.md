# 미출시 변경

## KIT-CHG-003 · Codex 대화 기록 훅 신뢰 사전 점검

상태: 검증 완료, 미출시(`verified`)

- Codex 세션 시작 계약이 `hook-trust-status`를 실행해 `UserPromptSubmit`·`Stop`의 영구 신뢰 기록 부재를 알린다.
- 미승인 상태에서는 훅 또는 Codex 전역 설정을 자동으로 바꾸지 않고, interactive Codex CLI의 `/hooks` 검토·신뢰 절차만 안내한다.
- 검증 근거: `KIT-EVD-006`.

## KIT-CHG-002 · 의도 합의 뒤 벤치마킹 필요성 판단과 근거 기반 제안

상태: 검증 완료, 미출시(`verified`)

- 제품 의도·목적·성과 기준 뒤 BEN-TRIAGE를 수행하고, 필요성이 합의된 경우에만 외부 조사·비교·추천을 수행한다.
- 조사 관측과 출처·한계·우리 환경의 차이는 research-note에 남기며 고객 결정만 제품 정본에 반영한다.
- 검증 근거: `KIT-EVD-005`.
