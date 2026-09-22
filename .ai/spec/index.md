# AIDD Kit 명세

이 폴더는 AIDD Kit이 제공해야 하는 이식 가능한 행동과 프로젝트 수행 계약의 정본이다. Kit 원본 저장소와 배포된 프로젝트가 함께 읽을 수 있지만, Kit를 조립·출시하는 내부 절차는 포함하지 않는다.

## 문서 지도

- [목적과 경계](purpose-and-boundaries.md)
- [실행 역할](repository-roles.md)
- [프로젝트 수행 생명주기](project-lifecycle.md)
- [배포 구조](distribution-layout.md)
- [변경 정보 교환](change-sharing.md)
- [적합성 기준](conformance.md)

프로젝트 구성원이 읽을 사람용 단일 진입점은 [프로젝트 수행팀 가이드](../docs/guides/project-team-guide.md)다. 준비부터 완료까지의 상세 장은 그 문서에서 연결한다. `.ai/docs/methodology/`는 설명 자료, `.ai/skills/`는 AI 수행 계약, `.ai/templates/`는 입력 양식이며 이 명세나 제품 정본을 대체하지 않는다. Kit 관리팀 전용 가이드, export 구현, Kit 변경·릴리스 기록은 배포물에 포함하지 않는다.
# v2 우선 계약

`owned-records-v2` 프로젝트에는 [소유 레코드 v2 실행 계약](owned-records-v2.md)을 먼저 적용한다. 구형 전역 파일 경로는 legacy 입력에만 적용한다.

[전문 명령·게이트·질문 통합 계약](specialty-integration.md)은 v2 스킬과 CLI의 공통 수행 기준이다.

요구 발굴 앞단의 정의·검토·추적은 [시스템·업무 분석 계약](business-discovery.md)을 적용한다.

사용자 역할 정의 직후의 초기 화면·인증·인가와 요구 연결은 [접속·인증·접근 정책](system-access.md)을 적용한다.

AIDD와 무관한 기존 소스·문서에서 초안을 만들 때는 [일반 레거시 역분석 계약](reverse-engineering.md)을 적용한다. 관측·추정·미정과 사용자 검토를 구분하며 원본을 변경하지 않는다.

생성된 레거시 초안의 [순차 검토·재분석 계약](legacy-review-reanalysis.md)은 부분 응답·세 버전 비교·명시적 채택과 영향 연결을 정의한다.

[모듈별 정본 채택·실행 검증](legacy-adoption.md)은 문서 관리 채택, 실제 테스트 결과와 운영/출시 이력을 분리한다.
