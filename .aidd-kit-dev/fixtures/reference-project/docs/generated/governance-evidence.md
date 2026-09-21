<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 거버넌스 증거

## 증거

### EVD-001 — 정본 그래프와 상태 뷰 자동 검증

- **id:** EVD-001
- **title:** 정본 그래프와 상태 뷰 자동 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-001, REQ-003, REQ-007, REQ-008, REQ-009, REQ-014, REQ-016, REQ-017, REQ-018
- **tests:** TC-001
- **changes:** CHG-001
- **gates:** -
- **producer:** Python unittest와 AIDD CLI
- **command:** python .ai/tools/aidd.py validate; python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T00:00:00+09:00
- **commit:** 68574e88fb822403a8c825e88fe7c1439e01f340
- **artifacts:** project/docs/generated/status.md, project/docs/generated/traceability.md
- **result:** 정본 참조와 상태 뷰 검증 통과

### EVD-002 — 결정적 산출물 생성 검증

- **id:** EVD-002
- **title:** 결정적 산출물 생성 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-002, REQ-015
- **tests:** TC-002
- **changes:** CHG-001
- **gates:** -
- **producer:** Python unittest
- **command:** python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T00:00:00+09:00
- **commit:** 68574e88fb822403a8c825e88fe7c1439e01f340
- **artifacts:** project/docs/generated/deliverable-catalog.md
- **result:** 동일 정본의 반복 렌더링 결과 일치

### EVD-003 — Codex·Claude 어댑터 파일 동등성 검증

- **id:** EVD-003
- **title:** Codex·Claude 어댑터 파일 동등성 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-013
- **tests:** TC-003
- **changes:** CHG-001
- **gates:** -
- **producer:** AIDD CLI와 스킬 검증기
- **command:** python .ai/tools/aidd.py validate; quick_validate.py .ai/skills/*
- **executed_at:** 2026-09-18T00:00:00+09:00
- **commit:** 68574e88fb822403a8c825e88fe7c1439e01f340
- **artifacts:** AGENTS.md, CLAUDE.md
- **result:** 정본 스킬과 두 어댑터의 파일 동등성 통과

### EVD-004 — 기술 게이트 구조 검증

- **id:** EVD-004
- **title:** 기술 게이트 구조 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-011
- **tests:** TC-008
- **changes:** CHG-002
- **gates:** TG-001, TG-002
- **producer:** Python unittest
- **command:** python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T00:00:00+09:00
- **commit:** 68574e88fb822403a8c825e88fe7c1439e01f340
- **artifacts:** project/docs/generated/technology-gates.md
- **result:** 기술 게이트 순서와 필수 필드 구조 검증 통과

### EVD-005 — 방법론 비교 구조 검증

- **id:** EVD-005
- **title:** 방법론 비교 구조 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-019
- **tests:** TC-009
- **changes:** CHG-002
- **gates:** -
- **producer:** Python unittest
- **command:** python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T00:00:00+09:00
- **commit:** 68574e88fb822403a8c825e88fe7c1439e01f340
- **artifacts:** project/docs/generated/methodology-comparison.md
- **result:** 방법론 분류·통제·근거 링크 구조 검증 통과

### EVD-006 — 배포 맥락 게이트 구조 검증

- **id:** EVD-006
- **title:** 배포 맥락 게이트 구조 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-020
- **tests:** TC-010
- **changes:** CHG-003
- **gates:** DG-001
- **producer:** Python unittest
- **command:** python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T00:00:00+09:00
- **commit:** 68574e88fb822403a8c825e88fe7c1439e01f340
- **artifacts:** project/docs/generated/deployment-and-runtime.md
- **result:** DG-001 순서와 배포 프로필 필수 필드 구조 검증 통과

### EVD-007 — 설계 위험 카탈로그 구조 검증

- **id:** EVD-007
- **title:** 설계 위험 카탈로그 구조 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-021
- **tests:** TC-011
- **changes:** CHG-003
- **gates:** TG-002
- **producer:** Python unittest
- **command:** python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T00:00:00+09:00
- **commit:** 68574e88fb822403a8c825e88fe7c1439e01f340
- **artifacts:** project/docs/generated/deployment-and-runtime.md
- **result:** DPR-001~008 질문·실패·통제·검증 필드 구조 검증 통과

### EVD-008 — 게이트 실행과 증거 우회 방지 테스트

- **id:** EVD-008
- **title:** 게이트 실행과 증거 우회 방지 테스트
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-022
- **tests:** TC-012
- **changes:** CHG-004
- **gates:** TG-002
- **producer:** Python unittest
- **command:** python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** .ai/tests/test_aidd.py, .ai/tools/aidd.py
- **result:** 증거 없는 통과와 통과 조건 누락을 검증 오류로 탐지

### EVD-009 — 정본 참조 무결성 부정 테스트

- **id:** EVD-009
- **title:** 정본 참조 무결성 부정 테스트
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-022
- **tests:** TC-013
- **changes:** CHG-004
- **gates:** TG-002
- **producer:** Python unittest
- **command:** python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** .ai/tests/test_aidd.py, .ai/tools/aidd.py
- **result:** 미결사항·산출물·병합 레코드의 알 수 없는 참조를 검증 오류로 탐지

### EVD-010 — 병합 훅 인자와 GitHub CI 정의 검증

- **id:** EVD-010
- **title:** 병합 훅 인자와 GitHub CI 정의 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-023
- **tests:** TC-014
- **changes:** CHG-005
- **gates:** TG-002
- **producer:** Python unittest
- **command:** python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** .githooks/post-merge, .github/workflows/aidd.yml, .ai/tools/aidd.py
- **result:** post-merge 인자 수용과 CI 필수 명령 포함 검증 통과

### EVD-011 — 실제 병합 커밋 기록 통합 테스트

- **id:** EVD-011
- **title:** 실제 병합 커밋 기록 통합 테스트
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-012, REQ-023
- **tests:** TC-006
- **changes:** CHG-005
- **gates:** TG-002
- **producer:** Python unittest와 임시 Git 저장소
- **command:** python .ai/tools/aidd.py generate; python .ai/tools/aidd.py validate; python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** .ai/tests/test_aidd.py, .ai/tools/aidd.py, AGENTS.md, .ai/skills/aidd-document-consistency/SKILL.md
- **result:** 두 부모가 있는 병합 커밋의 MRG 생성, 영향 모듈·해결 메모·추가 테스트 결정, 대기 MRC 생성, 완료 시 실제 수행 주체·시각·결과·증거 기록, 세션 브리핑·릴리스 차단 검증 통과

### EVD-012 — 모듈 상세 실행 계획 무결성 검증

- **id:** EVD-012
- **title:** 모듈 상세 실행 계획 무결성 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-024
- **tests:** TC-015
- **changes:** CHG-006
- **gates:** TG-002
- **producer:** Python unittest와 AIDD CLI
- **command:** python -m unittest discover -s .ai/tests -v; python .ai/tools/aidd.py status --level module --module MOD-AI
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/delivery-plan.json, project/docs/generated/delivery-plan.md
- **result:** 마일스톤·작업·인터페이스·의존성 참조 및 모듈 상세 뷰 검증 통과

### EVD-013 — 결정 대체와 기존 시스템 변경 합성 시나리오

- **id:** EVD-013
- **title:** 결정 대체와 기존 시스템 변경 합성 시나리오
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-006, REQ-010
- **tests:** TC-005
- **changes:** CHG-006
- **gates:** TG-002
- **producer:** Python unittest
- **command:** python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** .ai/tests/test_aidd.py, .ai/tools/aidd.py
- **result:** 유효한 결정 대체를 허용하고 순환 대체를 거부하는 정본 전이 검증 통과

### EVD-014 — 기능 구현 전 필수 게이트 차단 시나리오

- **id:** EVD-014
- **title:** 기능 구현 전 필수 게이트 차단 시나리오
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-011
- **tests:** TC-007
- **changes:** CHG-006
- **gates:** TG-002
- **producer:** Python unittest와 AIDD CLI
- **command:** python -m unittest discover -s .ai/tests -v; python .ai/tools/aidd.py development-check --change CHG-001
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** .ai/tests/test_aidd.py, .ai/tools/aidd.py
- **result:** 미통과 필수 게이트가 구현 시작을 차단하고 합성 통과 상태에서만 허용됨을 검증

### EVD-015 — 운영자·사용자·보안 가이드 생성 검증

- **id:** EVD-015
- **title:** 운영자·사용자·보안 가이드 생성 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-025
- **tests:** TC-016
- **changes:** CHG-006
- **gates:** TG-002
- **producer:** Python unittest와 AIDD 생성기
- **command:** python .ai/tools/aidd.py generate; python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** project/docs/generated/operator-guide.md, project/docs/generated/user-manual.md, project/docs/generated/security-guide.md
- **result:** 세 가이드의 정본 연결과 결정적 생성 검증 통과

### EVD-016 — AI 교차 평가 하네스 구조 검증

- **id:** EVD-016
- **title:** AI 교차 평가 하네스 구조 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-026
- **tests:** TC-018
- **changes:** CHG-006
- **gates:** TG-002
- **producer:** Python unittest와 AIDD CLI
- **command:** python -m unittest discover -s .ai/tests -v; python .ai/tools/aidd.py evaluation-status
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/evaluations.json, project/docs/generated/ai-evaluation.md, .ai/tests/fixtures/evaluations/EVS-001.md, .ai/tests/fixtures/evaluations/EVS-002.md, .ai/tests/fixtures/evaluations/EVS-003.md
- **result:** Codex·Claude 공통 픽스처·기대 행동·금지 행동·루브릭과 미실행 상태 분리 검증 통과

### EVD-017 — GitHub 브랜치 보호 구성 정합성 검증

- **id:** EVD-017
- **title:** GitHub 브랜치 보호 구성 정합성 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-027
- **tests:** TC-019
- **changes:** CHG-006
- **gates:** TG-002
- **producer:** Python unittest와 AIDD 검증기
- **command:** python .ai/tools/aidd.py validate; python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/repository.json, .github/rulesets/main.json, .github/workflows/aidd.yml
- **result:** 로컬 보호 규칙과 CI 필수 검사 이름의 정합성 검증 통과; 원격 활성화는 아직 검증하지 않음

### EVD-018 — GitHub 브랜치 보호 원격 활성화 실패

- **id:** EVD-018
- **title:** GitHub 브랜치 보호 원격 활성화 실패
- **type:** manual-review
- **status:** failed
- **requirements:** REQ-027
- **tests:** TC-020
- **changes:** CHG-006
- **gates:** TG-002
- **producer:** GitHub CLI와 GitHub REST API
- **command:** gh api -H Accept:application/vnd.github+json repos/choijoobok/aidd/rulesets
- **executed_at:** 2026-09-18T01:25:44+09:00
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/repository.json, project/docs/generated/repository-governance.md
- **result:** HTTP 403: 비공개 저장소에서 ruleset을 사용하려면 GitHub Pro 업그레이드 또는 공개 저장소 전환이 필요함

### EVD-022 — 모듈별 정본 조각과 생성 명세 검증

- **id:** EVD-022
- **title:** 모듈별 정본 조각과 생성 명세 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-001, REQ-002, REQ-003, REQ-009, REQ-024
- **tests:** TC-001
- **changes:** CHG-010
- **gates:** TG-002
- **producer:** Python unittest와 AIDD CLI
- **command:** python .ai/tools/aidd.py generate; python .ai/tools/aidd.py validate; python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T11:23:13+09:00
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/modules, project/docs/generated/modules, .ai/tools/aidd.py, .ai/tests/test_aidd.py
- **result:** 30개 요구사항을 9개 모듈 정본 조각으로 이관하고, 모듈별 명세 생성, 조각 파일명·소속 검증, 신규 모듈의 빈 조각 생성과 기존 전체 그래프 호환성을 검증함

### EVD-023 — 개발 기반·운영·제출 정본과 생성 뷰 검증

- **id:** EVD-023
- **title:** 개발 기반·운영·제출 정본과 생성 뷰 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-031, REQ-033
- **tests:** TC-024
- **changes:** CHG-011
- **gates:** TG-002
- **producer:** Python unittest와 AIDD CLI
- **command:** python .ai/tools/aidd.py generate; python .ai/tools/aidd.py validate; python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T15:00:00+09:00
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/foundation.json, project/.aidd/ssot/operations.json, project/.aidd/ssot/delivery-profiles.json, project/docs/generated/foundation, project/docs/generated/operations/runbooks.md, project/docs/generated/deliverables/manifest.md, .ai/docs/guides/aidd-kit-guide.md, README.md, .ai/tools/aidd.py, .ai/tests/test_aidd.py
- **result:** 개발 표준·골든 패스·예외, 운영 런북·제출 프로필, 자연어 중심 프로젝트 진행 가이드의 참조·상태·만료·정책과 환경 제약·아키텍처 비교 안내 검증 및 결정적 생성 테스트 통과

### EVD-024 — 모듈별 UI 정본과 화면·목업·매뉴얼 생성 검증

- **id:** EVD-024
- **title:** 모듈별 UI 정본과 화면·목업·매뉴얼 생성 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-032, REQ-033
- **tests:** TC-025
- **changes:** CHG-011
- **gates:** TG-002
- **producer:** Python unittest와 AIDD CLI
- **command:** python .ai/tools/aidd.py generate; python .ai/tools/aidd.py validate; python -m unittest discover -s .ai/tests -v
- **executed_at:** 2026-09-18T15:00:00+09:00
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/ui-system.json, .ai/tools/aidd.py, .ai/tests/test_aidd.py, project/docs/generated/ui
- **result:** 선택적 모듈 UI 조각, UI 기준선·패턴·컴포넌트·화면·매뉴얼 참조와 결정적 화면 정의서·HTML 목업 생성의 합성·부정 테스트 통과

### EVD-025 — 개발 기반·하네스 독립 AI 검토

- **id:** EVD-025
- **title:** 개발 기반·하네스 독립 AI 검토
- **type:** manual-review
- **status:** passed
- **requirements:** REQ-031, REQ-032, REQ-033
- **tests:** -
- **changes:** CHG-011
- **gates:** TG-002
- **producer:** 구현 세션과 분리된 AI reviewer 두 세션
- **review_method:** 정본·생성기와 하네스를 구현 에이전트와 분리해 재현 중심으로 검토하고 발견사항을 수정 후 재검증
- **executed_at:** 2026-09-18T17:30:00+09:00
- **commit:** working-tree
- **artifacts:** .ai/tools/aidd.py, .ai/tools/aidd_hook.py, .ai/tests/test_aidd.py, .ai/tests/test_harness.py, project/.aidd/ssot/foundation.json, project/.aidd/ssot/ui-system.json
- **result:** 실제 훅 payload·하위 경로 실행·승인 및 예외 우회·DLP 출시 캡처·stale 파생물·동시 모듈 갱신·실제 SHA-256 대조 결함을 발견해 보완했고 최종 독립 재검토에서 차단급 잔여 없음

### EVD-027 — AGENTS.md 단일 정본·Claude import·AI 기여 표기 검증

- **id:** EVD-027
- **title:** AGENTS.md 단일 정본·Claude import·AI 기여 표기 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-013
- **tests:** TC-003
- **changes:** CHG-001
- **gates:** -
- **producer:** Python unittest와 AIDD CLI·하네스 자체검사
- **command:** python .ai/tools/aidd.py sync-ai; python .ai/tools/aidd_hook.py self-test; python -m unittest discover -s .ai/tests -v; python .ai/tools/aidd.py generate; python .ai/tools/aidd.py validate; git diff --check
- **executed_at:** 2026-09-18T19:00:13+09:00
- **commit:** working-tree
- **artifacts:** AGENTS.md, CLAUDE.md, .ai/tools/aidd.py, .ai/tests/test_harness.py, .ai/templates/git/commit-message.md, .ai/skills, .agents/skills, .claude/skills
- **result:** AGENTS.md 단일 공통 계약, CLAUDE.md의 @AGENTS.md import, sync-ai의 지침 파일 비수정, 두 스킬 어댑터 동등성, 반복 가능한 AI-Assisted-By 표기와 전체 98개 테스트 통과

### EVD-028 — 변경 유형별 문서 동기화와 레거시 전환 통제 검증

- **id:** EVD-028
- **title:** 변경 유형별 문서 동기화와 레거시 전환 통제 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-035
- **tests:** TC-027
- **changes:** CHG-013
- **gates:** TG-002
- **producer:** Python unittest와 AIDD CLI·하네스 자체검사
- **command:** python -m unittest discover -s .ai/tests -v; python .ai/tools/aidd.py generate; python .ai/tools/aidd.py validate; python .ai/tools/aidd_hook.py self-test
- **executed_at:** 2026-09-18T20:30:00+09:00
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/system-surfaces.json, project/.aidd/ssot/system-surfaces, project/.aidd/ssot/changes.json, project/.aidd/ssot/delivery-plan.json, .ai/tools/aidd.py, .ai/skills/aidd-legacy-reconciliation, .githooks/pre-commit, .ai/tests/test_aidd.py, .ai/tests/test_harness.py
- **result:** 신규 기능 분석·설계 선행, 기존 문서 즉시 현행화, 문서 없는 기존 기능의 기한 있는 후속 WRK, 레거시 인벤토리 계획, staged 소스 문서 게이트와 모듈별 표면 조각 시나리오를 검증함

### EVD-029 — 프로젝트 운영 분리와 결정 이력 계약 검증

- **id:** EVD-029
- **title:** 프로젝트 운영 분리와 결정 이력 계약 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-036
- **tests:** TC-028
- **changes:** CHG-014
- **gates:** -
- **producer:** Node.js AIDD Kit 회귀 테스트
- **command:** node .aidd-kit-dev/tests/history.test.mjs; node .aidd-kit-dev/tests/terminology.test.mjs; node .aidd-kit-dev/tools/kit.mjs check
- **executed_at:** 2026-09-21T00:00:00.000Z
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/history, project/docs/generated/decision-history.md, .ai/tools/aidd.mjs, .ai/skills
- **result:** 인력 거버넌스 없이 프로젝트 bootstrap·검증이 동작하고 의미 있는 결정이 안정 ID와 연결된 HIS로 기록·검증·생성됨

### EVD-030 — 세션 간 결정 요청 복원과 상태 브리핑 검증

- **id:** EVD-030
- **title:** 세션 간 결정 요청 복원과 상태 브리핑 검증
- **type:** automated-test
- **status:** passed
- **requirements:** REQ-037
- **tests:** TC-029
- **changes:** CHG-015
- **gates:** -
- **producer:** Node.js AIDD Kit 회귀 테스트
- **command:** node .aidd-kit-dev/tests/decision-continuity.test.mjs; node .aidd-kit-dev/tools/kit.mjs smoke
- **executed_at:** 2026-09-22T00:00:00.000Z
- **commit:** working-tree
- **artifacts:** project/.aidd/ssot/workboard.json, project/docs/generated/status.md, project/docs/generated/workboard.md, .ai/tools/aidd.mjs, .ai/skills/aidd-decision-management, .ai/tests/fixtures/evaluations/EVS-004.md
- **result:** 모든 미응답 DRQ의 열린 OI 참조, OI와 DRQ 건수·묶음 수를 구분한 상태 브리핑, 복수 미응답 묶음 보존, 차단·우선순위·대기 시각에 따른 권장 질문 재노출, 묶음별 1~3건 검증, 구버전 작업 보드 호환과 bootstrap 실제 상태 보고를 검증함

## 게이트 실행

### GTR-001

- **id:** GTR-001
- **gate:** DG-001
- **change:** CHG-001
- **modules:** MOD-GOV, MOD-ARCH
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-001",
    "description": "프레임워크 배포 프로필과 미결 환경 결정 검토",
    "status": "pending",
    "evidence": []
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** -
- **commit:** -

### GTR-002

- **id:** GTR-002
- **gate:** TG-001
- **change:** CHG-001
- **modules:** MOD-ARCH
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-002",
    "description": "기술 기준선의 실제 파일럿 적합성 검토",
    "status": "pending",
    "evidence": []
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** -
- **commit:** -

### GTR-003

- **id:** GTR-003
- **gate:** TG-002
- **change:** CHG-001
- **modules:** MOD-DELIVERY, MOD-QA
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-003",
    "description": "실제 파일럿의 개발 기반 준비도와 골든 패스 검증",
    "status": "pending",
    "evidence": []
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** -
- **commit:** -

### GTR-004

- **id:** GTR-004
- **gate:** TG-001
- **change:** CHG-002
- **modules:** MOD-ARCH
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-004",
    "description": "기술 선택 게이트의 실제 프로젝트 적용성 검토",
    "status": "pending",
    "evidence": [
      "EVD-004"
    ]
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** -
- **commit:** -

### GTR-005

- **id:** GTR-005
- **gate:** TG-002
- **change:** CHG-002
- **modules:** MOD-DELIVERY, MOD-QA
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-005",
    "description": "실제 프로젝트의 공통 기반 적용성과 골든 패스 검증",
    "status": "pending",
    "evidence": [
      "EVD-004"
    ]
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** -
- **commit:** -

### GTR-006

- **id:** GTR-006
- **gate:** DG-001
- **change:** CHG-003
- **modules:** MOD-DISC, MOD-ARCH
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-006",
    "description": "실제 파일럿 배포 프로필 인터뷰 수행",
    "status": "pending",
    "evidence": [
      "EVD-006"
    ]
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** -
- **commit:** -

### GTR-007

- **id:** GTR-007
- **gate:** TG-002
- **change:** CHG-003
- **modules:** MOD-ARCH, MOD-QA
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-007",
    "description": "실제 동시성·부하·장애 시나리오 검증",
    "status": "pending",
    "evidence": [
      "EVD-007"
    ]
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** -
- **commit:** -

### GTR-008

- **id:** GTR-008
- **gate:** TG-002
- **change:** CHG-004
- **modules:** MOD-GOV, MOD-QA
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-008",
    "description": "게이트·증거 모델의 우회 부정 테스트와 회귀 검증",
    "status": "passed",
    "evidence": [
      "EVD-008",
      "EVD-009"
    ]
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** 2026-09-18T00:00:00+09:00
- **commit:** working-tree

### GTR-009

- **id:** GTR-009
- **gate:** TG-002
- **change:** CHG-005
- **modules:** MOD-CHG, MOD-QA
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-009",
    "description": "병합 훅과 GitHub CI 통합 검증",
    "status": "passed",
    "evidence": [
      "EVD-010",
      "EVD-011"
    ]
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** 2026-09-18T00:00:00+09:00
- **commit:** working-tree

### GTR-010

- **id:** GTR-010
- **gate:** TG-002
- **change:** CHG-006
- **modules:** MOD-GOV, MOD-DOC, MOD-AI, MOD-QA, MOD-CHG
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-010",
    "description": "모듈 계획·가이드·합성 시나리오·평가 하네스·보호 구성 검증",
    "status": "passed",
    "evidence": [
      "EVD-012",
      "EVD-013",
      "EVD-014",
      "EVD-015",
      "EVD-016",
      "EVD-017"
    ]
  },
  {
    "id": "GCR-011",
    "description": "Codex·Claude 실제 교차 행동 평가",
    "status": "pending",
    "evidence": []
  },
  {
    "id": "GCR-012",
    "description": "GitHub main 브랜치 보호 원격 활성화 검증",
    "status": "failed",
    "evidence": [
      "EVD-018"
    ]
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T00:00:00+09:00
- **evaluated_at:** -
- **commit:** working-tree

### GTR-015

- **id:** GTR-015
- **gate:** TG-002
- **change:** CHG-011
- **modules:** MOD-ARCH, MOD-DOC, MOD-DELIVERY, MOD-QA
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-017",
    "description": "개발 기반·UI·운영·제출 정본의 참조 무결성, 결정적 생성과 부정 검증",
    "status": "passed",
    "evidence": [
      "EVD-023",
      "EVD-024",
      "EVD-025"
    ]
  },
  {
    "id": "GCR-018",
    "description": "실제 제품 프로젝트에서 결정된 UI 패턴·컴포넌트·실제 화면 캡처를 포함한 TG-002 적용",
    "status": "pending",
    "evidence": []
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T15:00:00+09:00
- **evaluated_at:** -
- **commit:** working-tree

### GTR-017

- **id:** GTR-017
- **gate:** TG-002
- **change:** CHG-013
- **modules:** MOD-GOV, MOD-DOC, MOD-AI, MOD-CHG, MOD-QA, MOD-DELIVERY
- **status:** in_review
- **criteria:**

```json
[
  {
    "id": "GCR-020",
    "description": "변경 경로·시스템 표면·레거시 전환·커밋 전 문서 동기화 통제 검증",
    "status": "passed",
    "evidence": [
      "EVD-028"
    ]
  }
]
```
- **exceptions:** -
- **opened_at:** 2026-09-18T20:00:00+09:00
- **evaluated_at:** 2026-09-18T20:30:00+09:00
- **commit:** working-tree
