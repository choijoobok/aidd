<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 방법론 비교

## 선정 정책

### MTP-001 — 상황 적응형 혼합 방법론 정책

- **id:** MTP-001
- **title:** 상황 적응형 혼합 방법론 정책
- **status:** current
- **requirements:** REQ-017, REQ-019
- **rule:** 하나의 방법론을 전체 프로젝트에 강제하지 않는다. 요구 안정성, 불확실성, 변경 비용, 규제·감사 수준, 안전 중요도, 배포 빈도와 운영 책임에 따라 아래 통제를 조합하되 AIDD 정본·추적성·증거·고객 결정 규칙은 유지한다.
- **routing:** 안정된 범위·계약·규제 승인에는 예측형 기준선과 단계 게이트를 강화한다., 불확실한 제품 가치와 빈번한 피드백에는 애자일·스크럼의 짧은 증분을 강화한다., 복잡한 아키텍처와 높은 기술 위험에는 RUP의 위험 우선 반복과 실행 가능한 아키텍처 기준선을 강화한다., 안전·검증 중요 시스템에는 시스템공학 V 모델의 요구-검증 대응을 강화한다., 모든 소프트웨어에는 SSDF를 적용하고, 운영 서비스에는 SRE 관측·신뢰성·사후학습을 추가한다., AI가 구현할 때는 Spec Kit·BMAD에서 차용한 명세 우선, 명확화, 반대 검토, 작업 분해와 수렴 검사를 사용한다.

## 프로필

### MPR-001 — AIDD 균형형 혼합 수행 프로필

- **id:** MPR-001
- **name:** AIDD 균형형 혼합 수행 프로필
- **scope:** 현재 AIDD 기반 구조와 일반 소프트웨어 프로젝트의 기본값
- **status:** accepted
- **selected_methods:** MTH-001, MTH-002, MTH-003, MTH-004, MTH-006, MTH-007, MTH-008, MTH-009
- **rationale:** 정본·승인·추적성은 예측형과 시스템공학에서, 위험 우선 반복과 작은 증분은 RUP·애자일에서, 보안과 운영은 SSDF·SRE에서, AI 작업 흐름은 Spec Kit·BMAD에서 선택한다. 스크럼 이벤트와 역할은 팀 운영 방식이 정해질 때 선택적으로 적용한다.
- **mandatory_controls:** 정본과 안정적인 ID, 고객 의사결정과 ADR, 요구사항-검증 추적, C0~C3 위험 비례 게이트, TG-001·TG-002, 보안·운영 관점, 구현 후 수렴과 릴리스 증거
- **reassessment_triggers:** 프로젝트 규제·안전 등급 변경, 요구 안정성 또는 배포 빈도 변화, 팀 운영 모델 확정, 방법론 절차 비용이 가치보다 커짐, 감사·운영 실패로 통제 가정이 반증됨
- **requirements:** REQ-017, REQ-019

## 방법

### MTH-001 — 예측형·단계 게이트

- **id:** MTH-001
- **name:** 예측형·단계 게이트
- **category:** 전통적 프로젝트 관리
- **best_fit:** 범위와 승인 기준이 안정적이고 계약·예산·규제 통제가 중요한 작업
- **strengths:** 기준선과 책임이 명확함, 일정·비용·범위 변경을 통제하기 쉬움, 감사와 인수 증거를 계획하기 쉬움
- **limitations:** 불확실성이 높으면 늦은 학습과 재작업 비용이 커짐, 문서 완료가 실제 가치 전달로 오인될 수 있음
- **adopted_controls:** 단계별 진입·종료 기준, 승인된 기준선, 변경·위험·이슈 통제, 공식 인수와 종료
- **aidd_mapping:** 발견·범위화의 고객 승인, C2·C3 게이트, 정본 변경 이력, 릴리스 승인
- **sources:** https://www.pmi.org/learning/thought-leadership/series/achieving-greater-agility/spectrum-of-approaches, https://www.pmi.org/about/what-is-a-project

### MTH-002 — 시스템공학 V 모델

- **id:** MTH-002
- **name:** 시스템공학 V 모델
- **category:** 전통적 시스템공학
- **best_fit:** 안전·하드웨어 통합·다단계 요구 분해처럼 검증 비용이 높고 추적성이 중요한 시스템
- **strengths:** 요구 수준마다 검증 방법을 조기에 설계, 통합과 검증 책임이 명확함, 검증과 사용자 목적 확인을 구분
- **limitations:** 가벼운 변경에는 과도할 수 있음, 불확실한 제품 탐색에는 느릴 수 있음
- **adopted_controls:** 요구사항-검증 양방향 추적, 설계 시점의 테스트 전략, 검증과 유효성 확인 구분
- **aidd_mapping:** 요구사항 verification 링크, 추적성 매트릭스, 위험 비례 테스트, 출시 증거
- **sources:** https://www.nasa.gov/reference/systems-engineering-handbook/, https://www.nasa.gov/reference/5-0-product-realization/

### MTH-003 — RUP 반복·위험 우선

- **id:** MTH-003
- **name:** RUP 반복·위험 우선
- **category:** 반복형 소프트웨어 공학
- **best_fit:** 기술·아키텍처 위험이 크고 여러 모듈을 점진적으로 통합해야 하는 시스템
- **strengths:** 초기에 높은 위험을 다룸, 반복마다 실행 가능한 결과와 품질 확인, 유즈케이스·아키텍처·변경 통제를 함께 다룸
- **limitations:** 역할과 산출물을 그대로 적용하면 무거워질 수 있음, 조직별 맞춤화가 필요함
- **adopted_controls:** 위험 우선 반복, 실행 가능한 아키텍처 기준선, 반복별 통합·테스트, 변경 통제
- **aidd_mapping:** C0~C3 변경 등급, TG-001·TG-002, 모듈별 독립 순환, 증분 검증
- **sources:** https://www.ibm.com/docs/en/rational-clearquest/10.0.7?topic=settings-project-planning

### MTH-004 — 애자일 원칙

- **id:** MTH-004
- **name:** 애자일 원칙
- **category:** 적응형 제품 개발
- **best_fit:** 요구와 해결책의 불확실성이 높고 사용자 피드백으로 가치를 학습해야 하는 제품
- **strengths:** 작은 증분과 빠른 피드백, 변경 수용, 작동하는 결과와 기술적 우수성 중시
- **limitations:** 장기 아키텍처·규제 증거를 저절로 보장하지 않음, 속도를 문서·통제 생략으로 오해할 수 있음
- **adopted_controls:** 가치 우선 증분, 고객과의 빈번한 확인, 정기 회고, 단순성과 지속 가능한 속도
- **aidd_mapping:** 되돌릴 수 있는 작은 변경, 성과 중심 요구, 운영 피드백 환류, 위험 비례 문서
- **sources:** https://agilemanifesto.org/principles

### MTH-005 — 스크럼

- **id:** MTH-005
- **name:** 스크럼
- **category:** 적응형 전달 프레임워크
- **best_fit:** 복잡한 제품을 짧은 주기로 검사·적응하며 다기능 팀이 전달하는 환경
- **strengths:** 목표·백로그·증분의 투명성, 정기 검사와 적응, 책임과 이벤트가 단순함
- **limitations:** 기술·보안·운영 표준은 별도 필요, 형식적 이벤트만 수행하면 품질을 보장하지 못함
- **adopted_controls:** 제품 목표와 우선순위 백로그, 짧은 검증 주기, 완료 기준, 회고와 개선
- **aidd_mapping:** 성과·요구사항 우선순위, 변경 단위 수행, 완료 게이트, 상태 브리핑
- **sources:** https://scrumguides.org/scrum-guide.html

### MTH-006 — NIST SSDF·DevSecOps

- **id:** MTH-006
- **name:** NIST SSDF·DevSecOps
- **category:** 보안 소프트웨어 생애주기
- **best_fit:** 모든 소프트웨어, 특히 공급망·취약점·규제 위험이 있는 제품
- **strengths:** 보안을 특정 개발 방법론과 독립적으로 통합, 조직 준비·보호·안전한 개발·취약점 대응을 포괄, 공급자와 공통 언어 제공
- **limitations:** 구체 도구와 위험 임계치는 조직이 정해야 함, 준수 체크리스트만으로 제품 보안을 보장하지 않음
- **adopted_controls:** 보안 요구와 위협 검토, 공급망·비밀정보·의존성 통제, 보안 검증, 취약점 원인과 재발 방지
- **aidd_mapping:** 보안 역할 관점, TG-001 공급망·라이선스 검토, C2·C3 독립 검토, 운영 학습
- **sources:** https://csrc.nist.gov/pubs/sp/800/218/final

### MTH-007 — 사이트 신뢰성 공학(SRE)

- **id:** MTH-007
- **name:** 사이트 신뢰성 공학(SRE)
- **category:** 운영·신뢰성 공학
- **best_fit:** 지속 운영하며 신뢰성 목표, 관측성, 사고 대응과 자동화가 필요한 서비스
- **strengths:** 개발과 운영을 하나의 생애주기로 연결, SLO와 오류 예산으로 신뢰성 트레이드오프를 수치화, 사후 분석과 자동화로 반복 장애를 줄임
- **limitations:** 측정 가능한 서비스와 운영 역량이 필요, 초기 탐색 제품에는 일부 통제가 과도할 수 있음
- **adopted_controls:** SLO·관측성, 출시·복구 준비도, 사고 대응과 비난 없는 사후 분석, 운영 작업 자동화
- **aidd_mapping:** 운영·개선 단계, 릴리스 준비도, 인프라·SRE 역할 관점, 장애에서 변경으로 환류
- **sources:** https://sre.google/books/

### MTH-008 — GitHub Spec Kit 에이전트형 SDD

- **id:** MTH-008
- **name:** GitHub Spec Kit 에이전트형 SDD
- **category:** AI 주도 명세 개발
- **best_fit:** 코딩 에이전트가 명세·계획·작업·구현을 일관된 흐름으로 수행하는 변경
- **strengths:** 의도와 증거를 구현보다 앞세움, 명확화·체크리스트·교차 산출물 분석, 다수 코딩 에이전트 어댑터
- **limitations:** Markdown 산출물이 서로 다른 정본으로 갈라질 수 있음, 운영·포트폴리오·장기 유지보수 통제는 확장이 필요함
- **adopted_controls:** 명세 우선, 선택적 명확화·분석 게이트, 의존 순서 작업 분해, 구현 후 수렴 검사
- **aidd_mapping:** 요구 발굴 스킬, 정본에서 생성하는 산출물, 위험 비례 게이트, 구현-명세 수렴 검토
- **sources:** https://github.com/github/spec-kit/blob/main/docs/index.md, https://github.github.com/spec-kit/reference/agentic-sdd.html

### MTH-009 — BMAD Method

- **id:** MTH-009
- **name:** BMAD Method
- **category:** AI 주도 역할·경로 기반 개발
- **best_fit:** 작은 수정부터 대규모 제품까지 작업 크기에 맞는 AI 스킬과 계획 경로가 필요한 환경
- **strengths:** 생각하기와 만들기 스킬 분리, 변경 규모에 맞는 진입점, 기존 코드베이스 컨텍스트와 역할 기반 확장
- **limitations:** 역할별 산출물이 중복 정본이 될 수 있음, 조직의 승인·추적·릴리스 증거 정책을 별도로 통합해야 함
- **adopted_controls:** 규모별 계획 경로, 아이디어 반대 검토와 의사결정 조사, 명명된 재사용 스킬, 기존 시스템 컨텍스트
- **aidd_mapping:** C0~C3 엄격성, 요구 발굴·아키텍처·전달·보증 스킬, 공유 정본 역할 관점, 기존 시스템 기준선
- **sources:** https://docs.bmad-method.org/
