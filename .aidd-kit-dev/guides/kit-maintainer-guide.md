# AIDD Kit 유지보수 관리자 가이드

이 문서는 `kit-source`를 변경·검증·export·출시하는 **관리자 전용 단일 진입점**이다. 프로젝트 생성 이후의 수행법은 배포되는 [프로젝트 수행팀 가이드](../../.ai/docs/guides/project-team-guide.md)에 둔다.

## 관리자 문서 지도

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
