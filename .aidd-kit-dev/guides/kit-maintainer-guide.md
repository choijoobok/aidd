# AIDD Kit 유지보수 관리자 가이드

이 문서는 `kit-source`를 변경·검증·export·출시하는 **관리자 전용 단일 진입점**이다. 프로젝트 생성 이후의 수행법은 배포되는 [프로젝트 수행팀 가이드](../../.ai/docs/guides/project-team-guide.md)에 둔다.

## 현재 기준선과 변경 이력

현재 변경은 `repository.json`의 `active_change`가 가리키는 `KIT-CHG`에서 확인한다. 완료된 모듈별 생애주기 개편은 [KIT-CHG-018 변경 요약](../changes/KIT-CHG-018.md)에 기능·호환성·검증·한계를 정리했다. 구현 완료와 실제 릴리스는 구분하며 버전 귀속은 각 변경의 `released_in`으로 확인한다.

진행 중에 만든 상세 계획은 완료 결과를 `changes/`에 정리한 뒤 Git 이력으로 보존할 수 있다. 정리할 때 현재 가이드·테스트·변경 레코드의 의존을 함께 해소한다. 릴리스 완료를 정리의 선행 조건으로 요구하지 않는다.

## 관리자 문서 지도

모듈 소유 정본·개정본 검토·준비도는 [v2 계약](../../.ai/spec/owned-records-v2.md), 시스템·업무 분석은 [업무 분석 계약](../../.ai/spec/business-discovery.md), 접속·역할 정책은 [접속 계약](../../.ai/spec/system-access.md)을 따른다.

일반 레거시의 [역분석](../../.ai/spec/reverse-engineering.md), [사용자 검토·재분석](../../.ai/spec/legacy-review-reanalysis.md), [모듈 도입·검증](../../.ai/spec/legacy-adoption.md)은 KIT-ADR-012~014와 영역별 회귀 테스트에 연결된다. 문서 초안·채택과 실제 고객 시스템 검증을 구별한다.

전문 명령·스킬·훅은 [통합 계약](../../.ai/spec/specialty-integration.md), 신규 프로젝트·export는 [배포 계약](../../.ai/spec/distribution-layout.md)을 따른다. [KIT-ADR-011](../decisions/KIT-ADR-011.json)에 따라 이전 AIDD 형식 전용 변환은 제외한다.

| 작업 | 읽을 문서 |
|---|---|
| `.ai`와 `.aidd-kit-dev`의 경계, Markdown 수정 위치 판단 | [저장소와 문서 경계](repository-and-document-boundaries.md) |
| KIT-CHG·ADR, 검증 수준과 회귀 범위 결정 | [변경과 검증](change-and-validation.md) |
| provider 동기화, export·new-project·릴리스 | [Export와 릴리스](export-and-release.md) |

## 빠른 작업 흐름

1. 세션 시작 상태를 확인한다.

   ```powershell
   node .ai/tools/aidd_hook.mjs self-test --hook
   node .aidd-kit-dev/tools/kit.mjs status
   git status --short
   ```

2. 연결된 `.ai/spec/`, `KIT-CHG`, 필요한 `KIT-ADR`, 구현, 테스트와 두 독자용 가이드를 확인한다.
3. portable 행동은 `.ai/`, 관리자 전용 행동과 기록은 `.aidd-kit-dev/`에서 변경한다.
4. 스킬 변경이면 provider 복사본을 동기화한다.

   ```powershell
   node .aidd-kit-dev/tools/kit.mjs sync-providers
   ```

5. 빠른 경계 검사와 변경 영역 테스트를 실행한다.

   ```powershell
   node .aidd-kit-dev/tools/kit.mjs check
   node <영향받은 test 파일>
   ```

6. 생성기·fixture·export·new-project·provider 경계가 바뀐 경우에만 smoke를 추가한다.

   ```powershell
   node .aidd-kit-dev/tools/kit.mjs smoke
   ```

7. Kit 릴리스를 준비할 때는 대상이 명시된 관리 명령으로 계획을 먼저 확인한 뒤 정본을 갱신한다.

   ```powershell
   node .aidd-kit-dev/tools/kit.mjs kit-release-plan
   node .aidd-kit-dev/tools/kit.mjs prepare-kit-release
   ```

8. 변경·결정·릴리스 기록을 현행화하고 diff를 검토한다.

## 핵심 원칙

- 루트에 제품용 `project/`를 만들지 않는다. 제품 데이터는 명시적 fixture로만 둔다.
- export는 `.aidd-kit-dev/export-manifest.json`의 허용 목록만 사용한다.
- `.aidd-kit-dev/`와 `aidd-kit-release` 스킬은 프로젝트 배포물에 포함하지 않는다.
- 사용자·AI 대화 원문, build 결과와 fixture 생성물을 정본이나 현재 검증 증거로 취급하지 않는다.
- 일상 검증은 빠른 구조 검사와 변경 영역 행위 테스트로 끝낸다.
- 파생 문서는 현재 정본에서 재생성한 전체 파일과 내용을 엄격히 비교한다.
- 보안·권한·신원·서명 검토는 명세 또는 사용자 요청에 있을 때만 수행한다.
- 별도 evidence 파일이나 반복 독립 검토를 기본 완료 조건으로 만들지 않는다.

## 프로젝트 팀과의 경계

관리자는 템플릿과 `new-project` 출력이 프로젝트 팀에게 충분한지 확인하지만, Kit 저장소에서 실제 제품을 수행하지 않는다. 프로젝트 팀 문서에는 프로젝트가 실행할 명령과 개념만 두고, `kit.mjs`, KIT-CHG, 내부 fixture와 릴리스 절차는 넣지 않는다.
