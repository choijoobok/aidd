<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 프로젝트 문서 포맷 기준

- 상태: pilot
- 책임자: 프로젝트 책임자
- 합의 시점: 기능 구현 전

## 운영 원칙

- Kit의 작업 서식은 프로젝트 문서의 확정 포맷이 아니라 대화·분석을 시작하는 예시다.
- 프로젝트 착수 시 사용자와 문서 유형별 독자, 목적, 필수 항목, 용어, 근거 정본과 승인 기준을 합의한다.
- 필수 항목을 추가·변경하면 동일 문서 유형 전체에 소급 적용한다. 자동 근거가 있으면 채우고, 없으면 미작성 표시와 OI를 남긴다.
- 정본·파생 문서·소스의 불일치는 자동으로 정답을 정하지 않고 현행화 후보로 기록·검토한다.
- 제품 소스는 모듈별 화면 경로·API·배치·이벤트·연동·마이그레이션 표면에 연결하며, 기존 문서는 같은 변경에서 갱신하고 문서 없는 기존 기능의 후속 작성은 대상과 기한이 있는 WRK로 추적한다.

## 문서 유형별 합의 현황

| ID | 문서 유형 | 독자 | 상태 | 적용 생성물 | 필수 항목 | Kit 예시 서식 |
|---|---|---|---|---|---|---|
| DOC-REQ | 기능 요건 정의서 | 승인자와 구현·검증 AI | pilot | requirements.md, modules/*.md | 기능 개요와 범위, 처리 흐름·업무 규칙·예외, 인수 기준과 금지되는 결과 | .ai/templates/artifact/feature-spec-workbook.md |
| DOC-SCR | 화면 요구사항 정의서 | 사용자, UX 검토자와 구현·검증 AI | pilot | ui/modules/*/requirements.md | 업무 맥락·진입 조건·상태, 입력·동작·권한·접근성, 화면 인수 기준과 오류·복구 | .ai/templates/artifact/screen-requirements-workbook.md |
| DOC-MAN | 사용자 매뉴얼 | 실제 업무 사용자 | pilot | user-manual.md, manuals/**/*.md | 시작 전 준비와 권한, 업무 절차와 예상 결과, 안 될 때와 지원 경로 | .ai/templates/artifact/user-manual-workbook.md |
| DOC-RUN | 운영자 가이드·런북 | 운영자와 지원 담당자 | pilot | operator-guide.md, operations/**/*.md | 시작 전 확인·중단 조건, 절차·확인점·재실행 안전성, 복구·롤백·에스컬레이션 | .ai/templates/artifact/runbook-workbook.md |
| DOC-LEG | 레거시 시스템 문서 현행화 계획 | 사용자, 분석·설계·개발·검증 AI와 PM | pilot | legacy/**/*.md, migration/**/*.md | 대상·근거·제외 범위, 모듈별 화면·API·작업·연동 인벤토리, 기존 문서 출처와 AIDD 변환, 우선순위·작업·마감·완료 기준 | .ai/templates/artifact/legacy-reconciliation-workbook.md |
| DOC-WRK | 협업 작업 기록 | 프로젝트 팀, PM과 감사·인수 담당자 | pilot | work-log/**/*.md | 참여자 ID와 기록 Git 신원, 수행 이유·결과·다음 행동, 연결된 CHG·WRK·REQ·OI·ADR·EVD | .ai/templates/artifact/daily-work-log.md |

새 항목은 documentation.json의 해당 문서 유형에 추가한다. 생성기는 같은 유형의 기존 문서 전체에 항목을 소급 표시하고, 확인된 자동 근거가 없으면 미작성으로 표시한다.
