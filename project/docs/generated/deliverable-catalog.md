<!-- .ai/tools/aidd.py가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 산출물 목록

| ID | 산출물 | 생성 방식 | 적용 조건 | 상태 | 경로 | 정본 출처 | 비고 |
|---|---|---|---|---|---|---|---|
| DLV-BRIEF | 프로젝트 개요 | 자동 생성 | 필수 | 최신 | project/docs/generated/project-brief.md | project.json | - |
| DLV-SITE | 프로젝트 HTML 홈 사이트 | 자동 생성 | 필수 | 최신 | project/docs/generated/site/index.html | project.json, deliverables.json | 좌측 상단 로고와 프로젝트명은 이 홈으로 돌아오며, 제품 소개·개요·목적·주요 기능과 생성 문서 진입점을 표시한다. |
| DLV-CAT | 산출물 목록 | 자동 생성 | 필수 | 최신 | project/docs/generated/deliverable-catalog.md | deliverables.json | - |
| DLV-WORKBOARD | 현재 작업 보드 | 자동 생성 | 필수 | 최신 | project/docs/generated/workboard.md | workboard.json | 현재 초점·다음 작업·관찰 항목만 유지하는 작고 갱신 가능한 운영 뷰다. 날짜별 수행 이력은 project/work-log/에 별도로 기록한다. |
| DLV-REQ | 요구사항 정의서 | 자동 생성 | 필수 | 최신 | project/docs/generated/requirements.md | requirements.json, modules/*.json | - |
| DLV-ASM | 가정 원장 | 자동 생성 | 필수 | 최신 | project/docs/generated/assumptions.md | assumptions.json | - |
| DLV-UC | 유즈케이스 목록 | 자동 생성 | 조건부 | 최신 | project/docs/generated/use-cases.md | scenarios.json | - |
| DLV-SEQ | 시퀀스 다이어그램 | 자동 생성 다이어그램 | 조건부 | 최신 | project/docs/generated/sequences.md | scenarios.json | - |
| DLV-ARCH | 아키텍처와 모듈 뷰 | 자동 생성 | 필수 | 최신 | project/docs/generated/architecture.md | architecture.json, modules.json | - |
| DLV-MOD | 모듈별 명세 | 자동 생성 | 필수 | 최신 | project/docs/generated/modules | modules.json, modules/*.json, delivery-plan.json, changes.json, decisions.json, tests.json | - |
| DLV-TECH | 기술 스택과 개발 기반 게이트 | 자동 생성 | 필수 | 최신 | project/docs/generated/technology-gates.md | technology.json, requirements.json, modules/*.json, decisions.json | - |
| DLV-DEPLOY | 배포·운영 맥락과 설계 위험 | 자동 생성 | 필수 | 최신 | project/docs/generated/deployment-and-runtime.md | deployment.json, requirements.json, modules/*.json, technology.json | - |
| DLV-GOV-EVIDENCE | 게이트 실행과 검증 증거 | 자동 생성 | 필수 | 최신 | project/docs/generated/governance-evidence.md | gate-runs.json, evidence.json, approvals.json, changes.json | - |
| DLV-METHOD | 방법론 비교와 적용 지침 | 자동 생성 | 필수 | 최신 | project/docs/generated/methodology-comparison.md | methodologies.json, requirements.json | - |
| DLV-FOUND | 개발 표준·골든 패스·예외 원장 | 자동 생성 | 필수 | 최신 | project/docs/generated/foundation | foundation.json, technology.json, tests.json, evidence.json | - |
| DLV-UX | UI 기준선·패턴·컴포넌트·화면 목업 | 자동 생성 | 조건부 | 최신 | project/docs/generated/ui | ui-system.json, ui-modules/*.json, modules.json, requirements.json, modules/*.json, tests.json, approvals.json | 현재 CLI에는 UI가 적용 대상이 아니며 기준선에 사유를 기록했다. 제품 UI 모듈은 선택적 조각에서 화면과 목업을 생성한다. |
| DLV-MANUALS | 모듈별 사용자 매뉴얼 | 자동 생성 | 조건부 | 최신 | project/docs/generated/manuals | ui-modules/*.json, evidence.json | - |
| DLV-RUN | 구조화된 운영 런북 | 자동 생성 | 필수 | 최신 | project/docs/generated/operations/runbooks.md | operations.json, tests.json | - |
| DLV-PKG | 제출 패키지 manifest | 자동 생성 | 필수 | 최신 | project/docs/generated/deliverables/manifest.md | delivery-profiles.json | - |
| DLV-TRACE | 추적성 매트릭스 | 자동 생성 | 필수 | 최신 | project/docs/generated/traceability.md | requirements.json, modules/*.json, modules.json, tests.json | - |
| DLV-TEST | 테스트 케이스와 결과서 | 자동 생성 | 필수 | 최신 | project/docs/generated/test-report.md | tests.json | - |
| DLV-DEV | 개발자 가이드 | 직접 작성·연결 | 필수 | 최신 | project/README.md | architecture.json, foundation.json | - |
| DLV-OPS | 운영자 가이드와 런북 | 자동 생성 | 필수 | 최신 | project/docs/generated/operator-guide.md | guides.json, requirements.json | - |
| DLV-USER | 사용자 매뉴얼 | 자동 생성 | 필수 | 최신 | project/docs/generated/user-manual.md | guides.json, requirements.json | - |
| DLV-SEC | 위협 모델과 보안 검증 | 자동 생성 | 필수 | 최신 | project/docs/generated/security-guide.md | guides.json, requirements.json, risks.json | - |
| DLV-DATA | 데이터 모델·계보·마이그레이션 계획 | 직접 작성·연결 | 조건부 | 해당 없음 | - |  | 현재 기반 구조 범위에 실행 데이터베이스가 없다. |
| DLV-RELEASE | 릴리스 준비도 보고서 | 자동 생성 | 필수 | 최신 | project/docs/generated/release-readiness.md | releases.json, changes.json, tests.json, risks.json, open-items.json, merges.json | - |
| DLV-PLAN | 모듈 전달 계획 | 자동 생성 | 필수 | 최신 | project/docs/generated/delivery-plan.md | delivery-plan.json, modules.json, changes.json, requirements.json, modules/*.json, evidence.json | - |
| DLV-AI-EVAL | AI 교차 플랫폼 행동 평가 | 자동 생성 | 필수 | 최신 | project/docs/generated/ai-evaluation.md | evaluations.json, evidence.json | - |
| DLV-REPO | 저장소 보호와 CI 정책 | 자동 생성 | 필수 | 최신 | project/docs/generated/repository-governance.md | repository.json, collaboration.json | - |
| DLV-COLLAB | 협업 운영 프로필 | 자동 생성 | 필수 | 최신 | project/docs/generated/collaboration-governance.md | collaboration.json, repository.json | - |
| DLV-TEMPLATE | AIDD Kit 사용 가이드 | 직접 작성·연결 | 필수 | 최신 | .ai/docs/guides/aidd-kit-guide.md | README.md, collaboration.json | - |
| DLV-CONVERSATION | AI 대화형 프로젝트 진행 가이드 | 직접 작성·연결 | 필수 | 최신 | .ai/docs/guides/ai-conversation-project-guide.md | README.md | - |
