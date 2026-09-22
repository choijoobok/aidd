# AIDD Kit 유지보수 관리자 가이드

이 문서는 `kit-source`를 변경·검증·export·출시하는 **관리자 전용 단일 진입점**이다. 프로젝트 생성 이후의 수행법은 배포되는 [프로젝트 수행팀 가이드](../../.ai/docs/guides/project-team-guide.md)에 둔다.

## 진행 중인 단계별 개편

`repository.json`에 `active_plan`이 있으면 연결된 계획 진입점과 `active_plan_status`를 작업 전에 읽는다. 현재 [모듈별 생애주기 개편](../plans/modular-lifecycle/README.md)은 사용자의 요청에 따라 각 단계 종료 후 상태를 기록하고 다음 단계의 명시적 승인을 받은 뒤 진행한다. 계정·세션 전환 시에도 승인된 단계의 범위를 유지한다.

APR-005의 S07A는 선행 시스템·업무 분석을 기존 S05~S07에 추가한 증분이다. [추가 명세](../plans/modular-lifecycle/supplements/S07A-business-discovery.md)를 참고한다. frozen requirements/design 파일은 수정하지 않으며, 새 판정기에서 기존 검토를 자동 승인하지 않는 호환성 경계를 테스트한다. 테스트 fixture의 사용자 결정은 실제 프로젝트 승인과 다르다.

## 관리자 문서 지도

S08B-1 역분석 초안 기능은 [portable 계약](../../.ai/spec/reverse-engineering.md)과 KIT-ADR-012를 따른다. 회귀는 legacy-reverse.test.mjs의 RE-AC-01~06에 연결되며 실제 제품 스택 파서/운영 검증과 구분한다. 기존 .ai export 허용 목록 안에서 도구·명세·스킬을 배포하고 새 runtime 훅은 추가하지 않는다.

S08B-2의 [순차 검토·재분석 계약](../../.ai/spec/legacy-review-reanalysis.md)은 KIT-ADR-013과 legacy-review-reanalysis.test.mjs에 연결된다. 생성 기준 이미지를 사용자 편집본과 분리하고 채택 시 사용자 판단·HIS·재검토 OI/IMP를 남긴다. 재분석은 소스와 전체 정본 read set을 재검사하므로 무관한 동시 수정에도 미리보기가 다시 필요할 수 있으나 독립 모듈 상태를 초기화하지 않는다. 선언된 외부 루트는 Git staged만으로 검사할 수 없으므로 legacy-source-check를 별도 실행한다.

S08B-3의 [모듈 도입·검증 계약](../../.ai/spec/legacy-adoption.md)은 KIT-ADR-014와 legacy-adoption.test.mjs에 연결된다. legacy-adoption-check/adopt는 모듈/공통 의존 조회와 기존 정본·검토·게이트를 재사용한다. 문서 채택은 DOC/HIS만 기록하고 실제 테스트·운영 이력은 별도다. 기존 UI 재사용 판단을 과거 목업 승인으로 바꾸지 않으며 신규 변경에는 정상 게이트를 적용한다. 회귀 fixture 통과를 실제 고객 시스템 도입·실행 완료로 주장하지 않는다.

S08A는 [접속 정책 보완](../plans/modular-lifecycle/supplements/S08A-system-access.md)이다. 기존 POL의 system_access 하위 계약과 ACT/UC 참조를 추가하며, 일반 정책이나 Kit 수행팀 신원 관리는 변경하지 않는다. 판정기 갱신 시 기존 승인을 자동 생성하지 않고 제품 ID/이력을 보존한다.

전문 명령·스킬·훅 통합과 v2 배포·최종 인수 결과는 [통합 지도](../plans/modular-lifecycle/integration/README.md), [S10 기록](../plans/modular-lifecycle/checkpoints/S10.md)과 [인수 결과](../plans/modular-lifecycle/acceptance/S10-results.json)를 따른다. [KIT-ADR-011](../decisions/KIT-ADR-011.json)에 따라 이전 AIDD 전용 변환은 제외했다. 신규 프로젝트·export·v2 배포 기준은 일반 레거시 소스/문서 분석과 구별한다. 현재 상태는 계획 status.json이 정본이다.

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
