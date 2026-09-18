# AIDD 작업 서식

이 폴더의 파일은 제품 정본을 대신하지 않는 **AI 인터뷰·정리용 서식**이다. 작성 결과는 반드시 project/.aidd/ssot/의 구조화된 레코드로 옮기고, 생성 문서는 project/docs/generated/에서만 만든다.

| 상황 | 사용할 템플릿 | 반영할 정본 |
|---|---|---|
| 기능 범위·규칙·예외 합의 | feature-spec-workbook.md | REQ / USE / MOD |
| 화면 정의와 승인 전 목업 | screen-requirements-workbook.md | SCR / UXB / UIP / CMP |
| 실제 사용자 업무 안내 | user-manual-workbook.md | MAN |
| 운영 절차·장애 복구 | runbook-workbook.md | RUN / EVD |
| 대안 조사와 수용 판단 | research-note.md | ADR / REQ / OI |
| 중요한 선택과 트레이드오프 | decision-card.md | DEC / ADR |
| 테스트 실행 결과 | test-result-workbook.md | EVD / TST |
| 일별 수행 맥락과 다음 행동 기록 | daily-work-log.md | work-log / CHG / WRK / OI / EVD |

정본을 갱신한 뒤 python .ai/tools/aidd.py generate를 실행한다. project/docs/generated/site/의 HTML은 파생물이며 직접 수정하지 않는다.
