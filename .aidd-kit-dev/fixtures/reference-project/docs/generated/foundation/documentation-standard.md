<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 프로젝트 문서 포맷 기준

- 상태: pilot
- 결정 시점: 기능 구현 전

## 운영 원칙

- Kit의 작업 서식은 프로젝트 문서의 확정 포맷이 아니라 대화·분석을 시작하는 예시다.
- 프로젝트 착수 시 사용자와 문서 유형별 독자, 목적, 필수 항목, 용어, 근거 정본과 검증 기준을 합의한다.
- 필수 항목을 추가·변경하면 동일 문서 유형 전체에 소급 적용한다. 자동 근거가 있으면 채우고, 없으면 미작성 표시와 OI를 남긴다.
- 정본·파생 문서·소스의 불일치는 자동으로 정답을 정하지 않고 현행화 후보로 기록·검토한다.
- 제품 소스는 모듈별 화면 경로·API·배치·이벤트·연동·마이그레이션 표면에 연결하며, 기존 문서는 같은 변경에서 갱신하고 문서 없는 기존 기능의 후속 작성은 대상과 기한이 있는 WRK로 추적한다.

## 문서 유형별 합의 현황

| ID | 문서 유형 | 독자 | 상태 | 적용 생성물 | 필수 항목 | Kit 예시 서식 |
| --- | --- | --- | --- | --- | --- | --- |
| DOC-REQ | 제품 요구사항 정의서 | 제품 범위 승인자와 분석·검증 AI | pilot | requirements.md | 사용자 가치와 관찰 가능한 결과, 포함 범위와 명시적 비목표, 인수 기준과 검증 연결 | .ai/templates/artifact/product-requirements-workbook.md |
| DOC-FUNC | 기능 상세 명세서 | 구현·검증 AI와 기능 검토자 | pilot | modules/*.md | 기능 개요와 연결 제품 요구사항, 처리 흐름·업무 규칙·예외, 인수 기준과 금지되는 결과 | .ai/templates/artifact/feature-detail-spec-workbook.md |
| DOC-SCR | 화면 명세서 | 사용자, UX 검토자와 구현·검증 AI | pilot | ui/modules/*/specification.md | 업무 맥락·진입 조건·상태, 입력·동작·권한·접근성, 화면 인수 기준과 오류·복구 | .ai/templates/artifact/screen-spec-workbook.md |
| DOC-MAN | 사용자 매뉴얼 | 실제 업무 사용자 | pilot | user-manual.md, manuals/**/*.md | 시작 전 준비와 권한, 업무 절차와 예상 결과, 안 될 때와 지원 경로 | .ai/templates/artifact/user-manual-workbook.md |
| DOC-RUN | 운영자 가이드·런북 | 운영자와 지원 담당자 | pilot | operator-guide.md, operations/**/*.md | 시작 전 확인·중단 조건, 절차·확인점·재실행 안전성, 복구·롤백·에스컬레이션 | .ai/templates/artifact/runbook-workbook.md |
| DOC-LEG | 레거시 시스템 문서 현행화 계획 | 사용자와 분석·설계·개발·검증 AI | pilot | legacy/**/*.md, migration/**/*.md | 대상·근거·제외 범위, 모듈별 화면·API·작업·연동 인벤토리, 기존 문서 출처와 AIDD 변환, 우선순위·작업·마감·완료 기준 | .ai/templates/artifact/legacy-reconciliation-workbook.md |
| DOC-HIS | 결정 이력 입력 | 프로젝트 팀과 감사·인수 담당자 | pilot | project/.aidd/ssot/history/**/*.json | 대상 ID·결정 주체·결정·이유, 이전 상태·영향·출처, 연결 CHG와 대체 이력 | .ai/templates/artifact/decision-history-entry.md |
