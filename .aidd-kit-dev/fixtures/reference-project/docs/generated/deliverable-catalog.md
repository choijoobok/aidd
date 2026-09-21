<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 산출물 카탈로그

## 산출물

### DLV-BRIEF — 프로젝트 개요

- **id:** DLV-BRIEF
- **name:** 프로젝트 개요
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/project-brief.md
- **source:** project.json

### DLV-SITE — 프로젝트 HTML 홈 사이트

- **id:** DLV-SITE
- **name:** 프로젝트 HTML 홈 사이트
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/site/index.html
- **source:** project.json, deliverables.json
- **note:** 좌측 상단 로고와 프로젝트명은 이 홈으로 돌아오며, 제품 소개·개요·목적·주요 기능과 생성 문서 진입점을 표시한다.

### DLV-CAT — 산출물 목록

- **id:** DLV-CAT
- **name:** 산출물 목록
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/deliverable-catalog.md
- **source:** deliverables.json

### DLV-GLOSSARY — 통합 용어 사전

- **id:** DLV-GLOSSARY
- **name:** 통합 용어 사전
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/glossary.md
- **source:** .ai/manifests/terminology.json, terminology.json
- **note:** 수정 불가 AIDD 공통 용어와 프로젝트에서 결정한 전용 용어를 한 곳에서 읽게 하며, 고객용 HTML에는 customer 공개 범위와 end_user 독자 용어만 노출한다.

### DLV-SURFACE — 시스템 표면과 문서 현행화 범위

- **id:** DLV-SURFACE
- **name:** 시스템 표면과 문서 현행화 범위
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/system-surface-coverage.md
- **source:** system-surfaces.json, system-surfaces/*.json, changes.json, delivery-plan.json

### DLV-WORKBOARD — 현재 작업 보드

- **id:** DLV-WORKBOARD
- **name:** 현재 작업 보드
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/workboard.md
- **source:** workboard.json
- **note:** 현재 초점·다음 작업·관찰 항목만 유지하는 작고 갱신 가능한 실행 뷰다. 중요한 결정은 안정 ID와 연결된 HIS 이력으로 별도 기록한다.

### DLV-REQ — 요구사항 정의서

- **id:** DLV-REQ
- **name:** 요구사항 정의서
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/requirements.md
- **source:** requirements.json, modules/*.json

### DLV-ASM — 가정 원장

- **id:** DLV-ASM
- **name:** 가정 원장
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/assumptions.md
- **source:** assumptions.json

### DLV-UC — 유즈케이스 목록

- **id:** DLV-UC
- **name:** 유즈케이스 목록
- **mode:** generated
- **applicability:** conditional
- **status:** current
- **path:** project/docs/generated/use-cases.md
- **source:** scenarios.json

### DLV-SEQ — 시퀀스 다이어그램

- **id:** DLV-SEQ
- **name:** 시퀀스 다이어그램
- **mode:** generated-diagram
- **applicability:** conditional
- **status:** current
- **path:** project/docs/generated/sequences.md
- **source:** scenarios.json

### DLV-ARCH — 아키텍처와 모듈 뷰

- **id:** DLV-ARCH
- **name:** 아키텍처와 모듈 뷰
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/architecture.md
- **source:** architecture.json, modules.json

### DLV-MOD — 모듈별 명세

- **id:** DLV-MOD
- **name:** 모듈별 명세
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/modules
- **source:** modules.json, modules/*.json, delivery-plan.json, changes.json, decisions.json, tests.json

### DLV-TECH — 기술 스택과 개발 기반 게이트

- **id:** DLV-TECH
- **name:** 기술 스택과 개발 기반 게이트
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/technology-gates.md
- **source:** technology.json, requirements.json, modules/*.json, decisions.json

### DLV-DEPLOY — 배포·운영 맥락과 설계 위험

- **id:** DLV-DEPLOY
- **name:** 배포·운영 맥락과 설계 위험
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/deployment-and-runtime.md
- **source:** deployment.json, requirements.json, modules/*.json, technology.json

### DLV-GOV-EVIDENCE — 게이트 실행과 검증 증거

- **id:** DLV-GOV-EVIDENCE
- **name:** 게이트 실행과 검증 증거
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/governance-evidence.md
- **source:** gate-runs.json, evidence.json, changes.json

### DLV-METHOD — 방법론 비교와 적용 지침

- **id:** DLV-METHOD
- **name:** 방법론 비교와 적용 지침
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/methodology-comparison.md
- **source:** methodologies.json, requirements.json

### DLV-FOUND — 개발 표준·골든 패스·예외 원장

- **id:** DLV-FOUND
- **name:** 개발 표준·골든 패스·예외 원장
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/foundation
- **source:** foundation.json, technology.json, tests.json, evidence.json

### DLV-UX — UI 기준선·패턴·컴포넌트·화면 목업

- **id:** DLV-UX
- **name:** UI 기준선·패턴·컴포넌트·화면 목업
- **mode:** generated
- **applicability:** conditional
- **status:** current
- **path:** project/docs/generated/ui
- **source:** ui-system.json, ui-modules/*.json, modules.json, requirements.json, modules/*.json, tests.json
- **note:** 현재 CLI에는 UI가 적용 대상이 아니며 기준선에 사유를 기록했다. 제품 UI 모듈은 선택적 조각에서 화면과 목업을 생성한다.

### DLV-MANUALS — 모듈별 사용자 매뉴얼

- **id:** DLV-MANUALS
- **name:** 모듈별 사용자 매뉴얼
- **mode:** generated
- **applicability:** conditional
- **status:** current
- **path:** project/docs/generated/manuals
- **source:** ui-modules/*.json, evidence.json

### DLV-RUN — 구조화된 운영 런북

- **id:** DLV-RUN
- **name:** 구조화된 운영 런북
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/operations/runbooks.md
- **source:** operations.json, tests.json

### DLV-PKG — 제출 패키지 manifest

- **id:** DLV-PKG
- **name:** 제출 패키지 manifest
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/deliverables/manifest.md
- **source:** delivery-profiles.json

### DLV-TRACE — 추적성 매트릭스

- **id:** DLV-TRACE
- **name:** 추적성 매트릭스
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/traceability.md
- **source:** requirements.json, modules/*.json, modules.json, tests.json

### DLV-TEST — 테스트 케이스와 결과서

- **id:** DLV-TEST
- **name:** 테스트 케이스와 결과서
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/test-report.md
- **source:** tests.json

### DLV-DEV — 개발자 가이드

- **id:** DLV-DEV
- **name:** 개발자 가이드
- **mode:** authored-and-linked
- **applicability:** required
- **status:** current
- **path:** project/README.md
- **source:** architecture.json, foundation.json

### DLV-OPS — 운영자 가이드와 런북

- **id:** DLV-OPS
- **name:** 운영자 가이드와 런북
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/operator-guide.md
- **source:** guides.json, requirements.json

### DLV-USER — 사용자 매뉴얼

- **id:** DLV-USER
- **name:** 사용자 매뉴얼
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/user-manual.md
- **source:** guides.json, requirements.json

### DLV-SEC — 위협 모델과 보안 검증

- **id:** DLV-SEC
- **name:** 위협 모델과 보안 검증
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/security-guide.md
- **source:** guides.json, requirements.json, risks.json

### DLV-DATA — 데이터 모델·계보·마이그레이션 계획

- **id:** DLV-DATA
- **name:** 데이터 모델·계보·마이그레이션 계획
- **mode:** authored-and-linked
- **applicability:** conditional
- **status:** not_applicable
- **path:** -
- **source:** -
- **note:** 현재 기반 구조 범위에 실행 데이터베이스가 없다.

### DLV-RELEASE — 릴리스 준비도 보고서

- **id:** DLV-RELEASE
- **name:** 릴리스 준비도 보고서
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/release-readiness.md
- **source:** releases.json, changes.json, tests.json, risks.json, open-items.json, merges.json

### DLV-PLAN — 모듈 전달 계획

- **id:** DLV-PLAN
- **name:** 모듈 전달 계획
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/delivery-plan.md
- **source:** delivery-plan.json, modules.json, changes.json, requirements.json, modules/*.json, evidence.json

### DLV-AI-EVAL — AI 교차 플랫폼 행동 평가

- **id:** DLV-AI-EVAL
- **name:** AI 교차 플랫폼 행동 평가
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/ai-evaluation.md
- **source:** evaluations.json, evidence.json

### DLV-REPO — 저장소 보호와 CI 정책

- **id:** DLV-REPO
- **name:** 저장소 보호와 CI 정책
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/repository-governance.md
- **source:** repository.json

### DLV-TEMPLATE — AIDD Kit 사용자 가이드

- **id:** DLV-TEMPLATE
- **name:** AIDD Kit 사용자 가이드
- **mode:** authored-and-linked
- **applicability:** required
- **status:** current
- **path:** .ai/docs/guides/aidd-kit-guide.md
- **source:** README.md
- **note:** 자연어 초기화부터 프로젝트 생애주기, 문서·협업·Git 운영까지 제공하는 단일 사용자 진입점이다.

### DLV-CONVERSATION — AI 대화형 프로젝트 진행 가이드(통합됨)

- **id:** DLV-CONVERSATION
- **name:** AI 대화형 프로젝트 진행 가이드(통합됨)
- **mode:** authored-and-linked
- **applicability:** conditional
- **status:** superseded
- **path:** -
- **source:** README.md
- **replaced_by:** DLV-TEMPLATE
- **note:** 중복을 제거하기 위해 전체 내용을 DLV-TEMPLATE에 통합했다.

### DLV-HISTORY — 결정 이력

- **id:** DLV-HISTORY
- **name:** 결정 이력
- **mode:** generated
- **applicability:** required
- **status:** current
- **path:** project/docs/generated/decision-history.md
- **source:** history/**/*.json, changes.json, decisions.json, terminology.json
- **note:** 현재 정본의 근거를 보완하는 append-only 결정 이력이다.
