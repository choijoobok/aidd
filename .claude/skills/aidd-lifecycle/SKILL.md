---
name: aidd-lifecycle
description: 정본 AIDD 레코드, 위험 비례 게이트, 변경 등급과 역할 관점을 사용해 의도부터 운영까지 AI 주도 개발 생애주기(lifecycle)를 조율한다. 프로젝트나 중대한 변경을 시작·재개·범위화·조정할 때 사용하며, 다른 AIDD 스킬 하나로 충분한 좁은 작업에는 사용하지 않는다.
---

# AIDD 생애주기

모듈별 정본 조회·전문 명령·게이트는 [v2 통합 계약](../../../.ai/spec/specialty-integration.md)을 적용한다. 현재 owner/CHG 범위를 먼저 고르고 공통 정의를 참조한다. 쓰기 명령에는 고유 operation을 사용하며 사용자 결정·현재 유효성·실제 실행을 구분한다.

owned-records-v2에서는 `.ai/docs/guides/owned-records-workflow.md`와 `.ai/spec/owned-records-v2.md`를 먼저 읽는다. MOD는 경계, CHG는 독립 개발 주기, WRK는 기능/화면 작업이다. 운영 기준선과 진행 중 주기를 분리하고 프로젝트 단일 phase로 모듈들을 동기화하지 않는다. 제안된 기능이나 미구현 명령을 완료로 보고하지 않는다.

신규 시스템·모듈의 요구 발굴은 `.ai/spec/business-discovery.md`와 aidd-discovery로 SYS/CAP/ACT, 접속 POL, UC/BPR부터 진행한다. 역할 정의 직후 `.ai/spec/system-access.md`에 따라 최초 화면·인증 필요 여부·접근 제한을 결정한다. 요구 초안 작성과 확정은 다르며 discovery-check/requirement-check의 차단을 건너뛰어 설계하지 않는다. 공통 정의를 재사용하고 관련 항목만 되돌아가며, ACT 업무 역할과 제품 인증 정책은 아래의 수행팀 인력/권한 관리 제외 원칙과 다른 제품 분석 대상이다.

1. 재개 시에는 project-init-status·훅 self-test·status·integration-status를 읽고 관련 모듈/CHG를 validate한다. project-init의 Git/훅 초기화는 프로젝트 초기 설정을 요청받은 때만 실행한다. 상태 조회만으로 저장소·설정·정본을 쓰거나 커밋하지 않는다.
2. 요청을 신규 기능, 기존 변경, 결함, 레거시 고도화, 내부 리팩터링 또는 거버넌스로 분류하고 CHG `delivery_path`와 C0~C3 등급을 정한다.
3. 성과, 요구사항, 모듈, 작업 패키지, 인터페이스, 결정, 배포 프로필, 기술 기준선, 설계 위험, 게이트 실행, 증거, 예외, 미결사항, DRQ 결정 요청, 테스트, 릴리스와 가이드를 안정 ID로 찾는다. 대화만을 유일한 근거로 삼지 않는다. 상태·재개 요청이나 현재 작업이 미응답 결정에 의존하면 `aidd-decision-management`가 전체 큐에서 권장 묶음을 고른다. 독립 작업에서 새 결정이 생기면 실제 미결 대상과 새 DRQ를 추가하고 기존 묶음을 보존한다.
4. 불확실성, 규제·안전, 변경 비용, 배포 빈도와 운영 책임에 맞춰 예측형·적응형·혼합형 경로를 선택한다.
5. 가장 작은 유효 생애주기 경로를 선택하고 필요한 전문 스킬로 연결한다. 새롭거나 모호한 용어는 `aidd-terminology`로 검토하고 프로젝트의 오프라인 결정 뒤 같은 흐름에서 현행화한다.
6. 범위, 우선순위, 중요한 트레이드오프, 잔여 위험과 출시 여부를 추측하지 않는다. 사용자 결정을 질문하기 전에 `aidd-decision-management`로 OI와 대상 링크를 만든 뒤 DRQ를 저장하고, 프로젝트가 정한 결정을 현재 정본과 필요한 `HIS`·`ADR`·`CHG`·`TCH`에 기록한 뒤 OI와 DRQ를 종료한다.
7. 신규 기능은 요구분석·설계·최신 `SURF` 문서를 선행한다. 기존 기능은 문서가 있으면 같은 변경에서 갱신하고, 레거시는 인벤토리와 변환 계획부터 만든다. 구현 전 `development-check`, 출시 전 `release-check`를 실행한다.
8. 의미 있는 분석·설계·용어·소스·범위·상태 결정은 `record-history`로 대상 ID, 결정 주체, 결정, 이유, 이전 상태, 영향과 출처를 남긴다. 사소한 편집은 기록하지 않는다.
9. AI 공통 규칙을 바꾸면 같은 EVS와 루브릭으로 provider별 행동을 평가한다. 실행하지 않은 결과를 추정하지 않는다.
10. 인력, 역할, PM 위임, 일정, 작업 배정과 승인 권한은 프로젝트 운영 영역으로 둔다. AIDD 참여자·신원 레코드를 만들거나 실행 조건으로 검사하지 않는다. 브랜치와 리뷰 방식도 프로젝트가 정하며 AIDD는 Git 상태와 병합 영향을 보고한다.

진입·종료 기준과 변경 등급은 [references/gates.md](references/gates.md), 착수와 변경 통제는 [references/kickoff-and-change.md](references/kickoff-and-change.md)를 함께 적용한다.
