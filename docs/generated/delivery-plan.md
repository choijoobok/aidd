<!-- tools/aidd.py가 .aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 모듈 전달 계획

## 마일스톤

| ID | 마일스톤 | 상태 | 모듈 | 목표일 | 작업 |
|---|---|---|---|---|---|
| MLS-001 | 실행 가능한 AIDD 사전 기반 완성 | 진행 중 | MOD-GOV, MOD-DOC, MOD-AI, MOD-QA, MOD-STATUS, MOD-CHG | - | WRK-001, WRK-002, WRK-003, WRK-004, WRK-005, WRK-006, WRK-007, WRK-008, WRK-009, WRK-010, WRK-011 |

## 작업 항목

| ID | 작업 | 상태 | 모듈 | 변경 | 선행 작업 | 증거 |
|---|---|---|---|---|---|---|
| WRK-001 | 게이트 실행과 증거 무결성 강제 | 완료 | MOD-GOV | CHG-004 | - | EVD-008, EVD-009 |
| WRK-002 | 병합 훅과 CI 검사 구현 | 완료 | MOD-CHG | CHG-005 | WRK-001 | EVD-010, EVD-011 |
| WRK-003 | 모듈·마일스톤·작업·인터페이스·의존성 상세 추적 | 완료 | MOD-STATUS | CHG-006 | WRK-001 | EVD-012 |
| WRK-004 | 결정 대체와 개발 시작 차단 합성 시나리오 | 완료 | MOD-QA | CHG-006 | WRK-001 | EVD-013, EVD-014 |
| WRK-005 | 운영자·사용자·보안 가이드 자동 생성 | 완료 | MOD-DOC | CHG-006 | WRK-003 | EVD-015 |
| WRK-006 | Codex·Claude 공통 행동 평가 하네스 | 완료 | MOD-AI | CHG-006 | WRK-003 | EVD-016 |
| WRK-007 | Codex·Claude 실제 교차 행동 평가 | 할 일 | MOD-AI | CHG-006 | WRK-006 | - |
| WRK-008 | GitHub 브랜치 보호 기준 구성 | 완료 | MOD-CHG | CHG-006 | WRK-002 | EVD-017 |
| WRK-009 | GitHub 브랜치 보호 원격 활성화 검증 | 차단됨 | MOD-CHG | CHG-006 | WRK-008 | EVD-018 |
| WRK-010 | 1인·팀 협업 프로필 양방향 전환 | 완료 | MOD-GOV | CHG-007 | WRK-001, WRK-008 | EVD-019 |
| WRK-011 | Git 신원과 협업 참여자 대조 | 완료 | MOD-CHG | CHG-008 | WRK-002, WRK-010 | EVD-020 |

## 모듈 인터페이스

| ID | 인터페이스 | 상태 | 제공 모듈 | 소비 모듈 | 계약 | 호환성 |
|---|---|---|---|---|---|---|
| IFC-001 | 정본-생성 문서 계약 | 최신 | MOD-GOV | MOD-DOC, MOD-STATUS, MOD-QA | FILES 레지스트리와 render_documents가 모든 정본 및 파생 문서를 결정적으로 연결한다. | 필드 변경 시 생성기·검증·테스트·산출물 목록을 같은 변경에서 갱신한다. |
| IFC-002 | 공통 AI 스킬-플랫폼 어댑터 계약 | 최신 | MOD-AI | MOD-DISC, MOD-ARCH, MOD-DELIVERY, MOD-QA, MOD-STATUS | .ai 정본을 Codex와 Claude 검색 경로에 동기화하고 동일성을 검사한다. | 플랫폼 전용 훅은 얇게 유지하고 의미 규칙은 공통 스킬에 둔다. |
| IFC-003 | CI-브랜치 보호 계약 | 최신 | MOD-QA | MOD-CHG | 브랜치 보호의 필수 검사 이름은 GitHub Actions 작업 이름과 정확히 일치한다. | 작업 이름 변경 시 repository.json과 ruleset을 함께 변경한다. |

## 전달 의존성

| ID | 출발 | 도착 | 유형 | 상태 | 설명 | 검증 |
|---|---|---|---|---|---|---|
| DPN-001 | MOD-GOV | MOD-DOC | 계약 | 최신 | 정본 구조가 생성 문서의 입력 계약을 제공한다. | TC-002와 TC-016 |
| DPN-002 | MOD-GOV | MOD-STATUS | 계약 | 최신 | 상태 뷰는 정본 ID와 증거 상태만 집계한다. | TC-001과 TC-015 |
| DPN-003 | WRK-006 | WRK-007 | 작업 흐름 | 차단됨 | 실제 교차 평가에는 검증된 공통 하네스가 선행한다. | TC-017과 TC-018 |
| DPN-004 | WRK-008 | WRK-009 | 작업 흐름 | 차단됨 | 원격 보호 활성화에는 로컬 규칙 구성과 GitHub Pro·공개 저장소·대체 호스팅 중 하나의 정책 결정이 필요하다. | TC-019와 TC-020 |
