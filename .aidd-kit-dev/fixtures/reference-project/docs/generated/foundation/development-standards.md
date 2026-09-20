<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 개발 표준

## 표준

### STD-001 — 정본과 파생 산출물 관리

- **id:** STD-001
- **title:** 정본과 파생 산출물 관리
- **status:** current
- **kind:** policy
- **scope:** 모든 프로젝트와 모듈
- **modules:** MOD-GOV, MOD-DOC
- **requirements:** REQ-001, REQ-002, REQ-031
- **technology_baseline:** TSB-001
- **rules:** project/.aidd/ssot의 구조화 레코드를 승인된 의도의 정본으로 취급한다., project/docs/generated와 제출 manifest는 정본에서 결정적으로 재생성한다., 코드와 정본의 불일치는 어느 한쪽을 몰래 우선하지 않고 변경 또는 결함으로 기록한다.
- **guarantees:** 사람과 AI가 동일한 승인 기록과 안정 ID를 참조한다.
- **non_guarantees:** 문서 또는 훅의 존재만으로 실제 준수나 게이트 통과를 보장하지 않는다.
- **verification:** TC-024
- **evidence:** EVD-023
- **owner:** 거버넌스
- **supersedes:** -
- **replaced_by:** -

### STD-002 — 프로젝트별 개발 기반 작성

- **id:** STD-002
- **title:** 프로젝트별 개발 기반 작성
- **status:** template
- **kind:** policy
- **scope:** TG-002를 적용하는 제품 프로젝트
- **modules:** MOD-ARCH, MOD-DELIVERY, MOD-QA
- **requirements:** REQ-011, REQ-031
- **technology_baseline:** TSB-001
- **rules:** 기술 스택 선정 뒤 아키텍처, 보안, 테스트, 관측성, 배포와 운영 표준을 프로젝트 정본으로 작성한다., 실행 실패로 드러나는 contract와 조용히 위반될 수 있는 policy를 구분해 검증 방법을 정한다., 적용 가능한 표준에는 골든 패스 또는 실행 가능한 검증기를 연결한다.
- **guarantees:** 프로젝트별 기술 선택을 존중하면서 AI의 개발 절차와 품질 기준을 일관되게 전달한다.
- **non_guarantees:** 이 템플릿은 특정 프레임워크, 언어 또는 UI 라이브러리를 선택하지 않는다.
- **verification:** TC-024
- **evidence:** EVD-023
- **owner:** 아키텍처·개발
- **supersedes:** -
- **replaced_by:** -
