# 미출시 변경

## KIT-CHG-004 · Node.js 단일 런타임 전환

상태: 전환 구현 중, 행동 동등성·macOS·독립 C3 검토 대기(`in_review`)

- portable CLI, Kit 관리 CLI, provider 훅과 테스트를 Node.js 22 이상 표준 라이브러리로 통일한다.
- 실행 가능한 `.py` 파일과 provider의 Python 명령을 제거한다.
- provider 훅 원본 바이트를 UTF-8로 직접 해석하고 대화 기록을 UTF-8로 추가한다.
- Codex Desktop의 `commandWindows`에서 `$repo`·`$LASTEXITCODE` 같은 중첩 변수를 제거한다.
- Windows 실제 명령과 비 ASCII 입력, directory·ZIP export 및 샘플 프로젝트를 Node 테스트로 검증한다.
- 신뢰 기록 존재는 실제 훅 실행·저장 성공과 구분해 안내한다.
- 현행 가이드와 reference fixture 런타임 정본·파생 문서를 Node.js 22 기준으로 통일하고 회귀 검사로 고정한다.
- 기존 Python 검증 근거 `KIT-EVD-007`, `KIT-EVD-008`은 전환 배경으로만 유지하며 Node 결과는 별도 증거로 기록한다.
- 기존 CLI 전체 행동 동등성, 실제 macOS provider 증거와 C3 독립 검토 전에는 완료·출시 준비 완료로 표시하지 않는다.

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
