<!-- tools/aidd.py가 .aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 산출물 목록

| ID | 산출물 | 생성 방식 | 적용 조건 | 상태 | 경로 | 정본 출처 | 비고 |
|---|---|---|---|---|---|---|---|
| DLV-BRIEF | 프로젝트 개요 | 자동 생성 | 필수 | 최신 | docs/generated/project-brief.md | project.json | - |
| DLV-CAT | 산출물 목록 | 자동 생성 | 필수 | 최신 | docs/generated/deliverable-catalog.md | deliverables.json | - |
| DLV-REQ | 요구사항 정의서 | 자동 생성 | 필수 | 최신 | docs/generated/requirements.md | requirements.json | - |
| DLV-UC | 유즈케이스 목록 | 자동 생성 | 조건부 | 최신 | docs/generated/use-cases.md | scenarios.json | - |
| DLV-SEQ | 시퀀스 다이어그램 | 자동 생성 다이어그램 | 조건부 | 최신 | docs/generated/sequences.md | scenarios.json | - |
| DLV-ARCH | 아키텍처와 모듈 뷰 | 자동 생성 | 필수 | 최신 | docs/generated/architecture.md | architecture.json, modules.json | - |
| DLV-TECH | 기술 스택과 개발 기반 게이트 | 자동 생성 | 필수 | 최신 | docs/generated/technology-gates.md | technology.json, requirements.json, decisions.json | - |
| DLV-DEPLOY | 배포·운영 맥락과 설계 위험 | 자동 생성 | 필수 | 최신 | docs/generated/deployment-and-runtime.md | deployment.json, requirements.json, technology.json | - |
| DLV-METHOD | 방법론 비교와 적용 지침 | 자동 생성 | 필수 | 최신 | docs/generated/methodology-comparison.md | methodologies.json, requirements.json | - |
| DLV-UX | UI 레이아웃·패턴·목업 | 직접 작성·연결 | 조건부 | 해당 없음 | - |  | 현재 기반 구조는 CLI다. 제품 프로젝트에서 기능 UI 개발 전에 필수다. |
| DLV-TRACE | 추적성 매트릭스 | 자동 생성 | 필수 | 최신 | docs/generated/traceability.md | requirements.json, modules.json, tests.json | - |
| DLV-TEST | 테스트 케이스와 결과서 | 자동 생성 | 필수 | 최신 | docs/generated/test-report.md | tests.json | - |
| DLV-DEV | 개발자 가이드 | 직접 작성·연결 | 필수 | 최신 | README.md | architecture.json, AGENTS.md | - |
| DLV-OPS | 운영자 가이드와 런북 | 직접 작성·연결 | 조건부 | 계획됨 | - |  | - |
| DLV-USER | 사용자 매뉴얼 | 직접 작성·연결 | 조건부 | 계획됨 | - |  | - |
| DLV-SEC | 위협 모델과 보안 검증 | 직접 작성·연결 | 조건부 | 계획됨 | - |  | - |
| DLV-DATA | 데이터 모델·계보·마이그레이션 계획 | 직접 작성·연결 | 조건부 | 해당 없음 | - |  | 현재 기반 구조 범위에 실행 데이터베이스가 없다. |
| DLV-RELEASE | 릴리스 준비도 보고서 | 자동 생성 | 필수 | 최신 | docs/generated/release-readiness.md | releases.json, changes.json, tests.json, risks.json, open-items.json, merges.json | - |
