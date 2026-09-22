---
name: aidd-delivery
description: AIDD 표준에 따라 요구사항과 연결된 변경을 구현·테스트·출시·운영·유지보수한다. 코드나 공통 컴포넌트 개발, 마이그레이션, 릴리스 준비 또는 개발자·운영자·사용자 가이드 작성에 사용하며 연결된 증거 없이 완료를 선언하지 않는다.
---

# AIDD 개발·전달

모듈별 정본 조회·전문 명령·게이트는 [v2 통합 계약](../../../.ai/spec/specialty-integration.md)을 적용한다. 현재 owner/CHG 범위를 먼저 고르고 공통 정의를 참조한다. 쓰기 명령에는 고유 operation을 사용하며 사용자 결정·현재 유효성·실제 실행을 구분한다.

owned-records-v2에서는 `.ai/docs/guides/owned-records-workflow.md`와 `.ai/spec/owned-records-v2.md`를 먼저 읽는다. 정본은 소유자/타입/ID별 파일이며 `record-put`의 expected hash와 CHG를 사용한다. 전역 배열 writer를 호출하거나 index/snapshot을 직접 수정하지 않는다. 미구현/unknown은 완료가 아니다.

1. 변경 ID와 등급, 영향 요구사항·모듈, WRK와 선행 의존성, 현재 결정·배포 프로필·기술 기준선, 기반 준비도, 설계 위험, 테스트 전략, 마이그레이션, 롤백과 관련 DRQ를 확인한다. 차단 `awaiting_decision`이 있으면 구현보다 먼저 `aidd-decision-management`로 재개한다.
2. 작업을 검토 가능한 요구사항 크기로 나누고 `MLS`·`WRK`·`IFC`·`DPN`에 연결한다. WRK는 책임자 배정표가 아니라 수행 범위·완료 조건·증거 계약이다.
3. 결정된 기술 스택, UI 패턴과 공통 컴포넌트를 재사용한다. 공통·프로젝트 용어를 일관되게 사용하고 용어 변경은 `aidd-terminology`로 처리한다.
4. CHG `delivery_path`와 영향 `SURF`를 확인한다. 신규 기능은 요구분석·설계·문서를 선행하고 기존 문서가 있는 기능은 같은 변경에서 갱신한다. `development-check`와 pre-commit의 `documentation-check --staged`를 통과시킨다.
5. 경계에는 단위·계약 테스트, 의존성·데이터에는 통합 테스트, 핵심 여정에는 종단 간 테스트, 영향 동작에는 회귀 테스트를 적용한다. 필요하면 경쟁·재시도·부하·복구·장애 주입·보안 테스트를 추가한다.
6. 병합 충돌 해결의 이유, 영향 모듈·파일, 달라진 가정과 추가 테스트를 기록한다.
7. 출시 전에 추적성, 테스트, 보안 발견사항, 마이그레이션 연습, 롤백, 관측성, 지원 준비도, 필수 게이트 통과와 잔여 위험 처리를 확인한다.
8. 생성·검증과 관련 빌드·테스트를 실행한다. 결과를 명령·시각·커밋과 함께 EVD로 기록하고 테스트·게이트에 연결한다. 필수 게이트가 통과하지 않은 변경은 완료하지 않는다.
9. 프로젝트가 요구한 독립 검토를 수행하되 AIDD가 사람 역할이나 승인 권한을 판정하지 않는다. 검토 결과는 증거와 결정 이력으로 남긴다.
10. 사용자 판단이 필요한 구현·설계·운영 선택은 질문 전에 `aidd-decision-management`로 OI와 대상 링크를 만든 뒤 DRQ를 저장한다. 결정 뒤 관련 안정 ID와 `HIS`에 주체·결정·이유·영향을 기록하고 OI와 DRQ를 종료한다. 정확한 소스 차이는 Git에 맡긴다.

완료와 릴리스는 [references/done-and-release.md](references/done-and-release.md), 기능 슬라이스와 가이드는 [references/slice-runbook-guides.md](references/slice-runbook-guides.md)를 함께 적용한다.
