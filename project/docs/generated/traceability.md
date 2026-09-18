<!-- .ai/tools/aidd.py가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 추적성 매트릭스

| 요구사항 | 제목 | 상태 | 모듈 | 검증 | 출처 |
|---|---|---|---|---|---|
| REQ-001 | 프로젝트 정본 레코드 | 정의됨 | MOD-GOV | TC-001 | USER-2026-09-17 |
| REQ-002 | 파생 산출물 | 정의됨 | MOD-DOC | TC-002 | USER-2026-09-17 |
| REQ-003 | 생애주기 전체 추적성 | 정의됨 | MOD-GOV, MOD-QA | TC-001 | USER-2026-09-17 |
| REQ-004 | 의도 발굴과 레드팀 검토 | 정의됨 | MOD-DISC | TC-004 | USER-2026-09-17 |
| REQ-005 | 트레이드오프 의사결정 | 정의됨 | MOD-DISC, MOD-GOV | TC-004 | USER-2026-09-17 |
| REQ-006 | 가역적인 결정과 학습 | 정의됨 | MOD-GOV, MOD-CHG | TC-005 | USER-2026-09-17 |
| REQ-007 | 미결사항 추적 | 정의됨 | MOD-GOV, MOD-STATUS | TC-001 | USER-2026-09-17 |
| REQ-008 | 거시·미시 상태 브리핑 | 정의됨 | MOD-STATUS | TC-001 | USER-2026-09-17 |
| REQ-009 | 모듈 단위 수행 | 정의됨 | MOD-ARCH, MOD-STATUS | TC-001 | USER-2026-09-17; USER-2026-09-18 |
| REQ-010 | 기존 시스템과 유지보수 변경 | 정의됨 | MOD-CHG, MOD-ARCH, MOD-QA | TC-005 | USER-2026-09-17 |
| REQ-011 | UI와 개발 표준 우선 | 정의됨 | MOD-ARCH, MOD-DELIVERY | TC-007, TC-008 | USER-2026-09-17 |
| REQ-012 | 병합 영향 이력 | 정의됨 | MOD-CHG, MOD-QA | TC-006 | USER-2026-09-17 |
| REQ-013 | Codex·Claude 동등성 | 정의됨 | MOD-AI | TC-003 | USER-2026-09-17 |
| REQ-014 | 다분야 역할 관점 | 정의됨 | MOD-GOV, MOD-ARCH, MOD-QA, MOD-DELIVERY | TC-001 | USER-2026-09-17 |
| REQ-015 | 생애주기 산출물 | 정의됨 | MOD-DOC, MOD-DELIVERY | TC-002 | USER-2026-09-17 |
| REQ-016 | 설계 단계의 보안·데이터·인프라·운영 | 정의됨 | MOD-ARCH, MOD-QA, MOD-DELIVERY | TC-001 | USER-2026-09-17 |
| REQ-017 | 위험 비례 품질 게이트 | 정의됨 | MOD-GOV, MOD-QA | TC-001 | USER-2026-09-17 |
| REQ-018 | 증거 기반 출시와 운영 | 정의됨 | MOD-QA, MOD-DELIVERY, MOD-CHG | TC-001 | USER-2026-09-17 |
| REQ-019 | 상황 적응형 방법론 근거 | 구현됨 | MOD-GOV, MOD-DISC, MOD-ARCH | TC-009 | USER-2026-09-17 |
| REQ-020 | 배포·운영 환경의 조기 확인 | 구현됨 | MOD-DISC, MOD-ARCH, MOD-STATUS | TC-010 | USER-2026-09-18 |
| REQ-021 | 동시성·트랜잭션·성능 위험의 설계 예방 | 구현됨 | MOD-ARCH, MOD-QA, MOD-DELIVERY | TC-011 | USER-2026-09-18 |
| REQ-022 | 실행 가능한 게이트와 증거 무결성 | 구현됨 | MOD-GOV, MOD-QA, MOD-STATUS | TC-012, TC-013 | AUDIT-2026-09-18 |
| REQ-023 | Git과 CI 품질 게이트 강제 | 구현됨 | MOD-AI, MOD-CHG, MOD-QA | TC-006, TC-014 | AUDIT-2026-09-18 |
| REQ-024 | 모듈 단위 상세 실행 계획과 진척 추적 | 구현됨 | MOD-GOV, MOD-STATUS | TC-015 | AUDIT-2026-09-18 |
| REQ-025 | 운영자·사용자·보안 가이드의 정본 기반 생성 | 구현됨 | MOD-DOC, MOD-DELIVERY, MOD-QA | TC-016 | AUDIT-2026-09-18 |
| REQ-026 | Codex·Claude 행동 품질 동등성 평가 | 정의됨 | MOD-AI, MOD-DISC, MOD-QA | TC-004, TC-017, TC-018 | AUDIT-2026-09-18 |
| REQ-027 | 기본 브랜치 보호와 필수 CI 검사 | 정의됨 | MOD-CHG, MOD-QA | TC-019, TC-020 | AUDIT-2026-09-18 |
| REQ-028 | 1인·팀 프로젝트의 가역적 협업 전환 | 구현됨 | MOD-GOV, MOD-CHG, MOD-QA, MOD-STATUS | TC-021 | USER-2026-09-18 |
| REQ-029 | Git·호스팅 신원과 협업 참여자 대조 | 구현됨 | MOD-GOV, MOD-CHG, MOD-QA, MOD-STATUS | TC-022 | USER-2026-09-18 |
| REQ-030 | 안전한 템플릿 초기화와 협업 브랜치 흐름 | 구현됨 | MOD-GOV, MOD-AI, MOD-CHG, MOD-DOC, MOD-QA | TC-023 | USER-2026-09-18 |
| REQ-031 | 프로젝트별 개발 기반 정본 | 구현됨 | MOD-ARCH, MOD-DOC, MOD-DELIVERY, MOD-QA | TC-024 | USER-2026-09-18 |
| REQ-032 | 모듈별 UI·공통 컴포넌트 정본 | 구현됨 | MOD-ARCH, MOD-DOC, MOD-DELIVERY, MOD-QA | TC-025 | USER-2026-09-18 |
| REQ-033 | 운영 런북과 제출 패키지 정책 | 구현됨 | MOD-DOC, MOD-DELIVERY, MOD-QA | TC-024, TC-025 | USER-2026-09-18 |
| REQ-034 | 감사 가능한 작업 패키지 배정과 개발 범위 포괄성 | 구현됨 | MOD-GOV, MOD-DOC, MOD-DELIVERY, MOD-QA, MOD-STATUS, MOD-CHG | TC-026 | USER-2026-09-18 |
