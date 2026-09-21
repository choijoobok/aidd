# Export와 릴리스

## provider 동기화

portable 스킬 원본은 `.ai/skills/`, 관리자 스킬 원본은 `.aidd-kit-dev/skills/`다. 원본을 변경한 뒤 두 집합을 provider 디렉터리에 동기화한다.

```powershell
node .aidd-kit-dev/tools/kit.mjs sync-providers
node .aidd-kit-dev/tools/kit.mjs check
```

`.agents/skills/`와 `.claude/skills/`의 복사본을 직접 수정하지 않는다.

Codex 훅 어댑터의 정본은 `.aidd-kit-dev/export/.codex/hooks.json`이다. Codex 전용 `SessionStart` 훅 신뢰 확인 경고는 이 어댑터에만 연결하고 Claude 어댑터에는 추가하지 않는다. 훅 격리는 1순위 규칙이며 provider·이벤트·책임별 전용 `.ai/hooks/*.mjs`를 사용한다. 런타임 훅 사이의 공통 코드, 상호 import와 상호 호출을 금지하고 기존 event/group/handler 위치를 고정한다. 모델용 컨텍스트를 반환하는 handler에는 `additionalContextLimit`를 둔다. 어댑터를 바꾸면 `sync-providers`로 루트 복사본을 갱신한 뒤 self-test, 격리 행위 테스트와 smoke로 export 경계를 확인한다.

## Export 경계

`.aidd-kit-dev/export-manifest.json`이 유일한 허용 목록이다. 새 루트 파일을 만들었다는 이유로 자동 배포하지 않는다. 특히 다음은 제외한다.

- `.aidd-kit-dev/` 전체
- `aidd-kit-release` 관리자 스킬
- Kit 변경·결정·릴리스 내부 기록
- reference fixture와 임시 build 결과
- 대화 원문과 로컬 상태

`.ai/`의 portable 명세·가이드·스킬·훅·도구·템플릿은 manifest 정책에 따라 배포된다. 배포 루트의 `AGENTS.md`, `README.md`, `CLAUDE.md` 원본은 `.aidd-kit-dev/export/`에서 관리한다.

## 빈 템플릿과 초기화 프로젝트

빈 템플릿:

```powershell
node .aidd-kit-dev/tools/kit.mjs export --directory D:\dist\aidd-kit
node .aidd-kit-dev/tools/kit.mjs export --zip D:\dist\aidd-kit.zip
```

초기화된 제품 프로젝트:

```powershell
node .aidd-kit-dev/tools/kit.mjs new-project --directory D:\work\crm --project-id CRM --name "CRM" --mode greenfield
```

폴더와 ZIP은 같은 staging·검증 경로를 사용한다. 기존 출력 대상은 덮어쓰지 않는다. `.aidd-kit-origin.json`은 Kit 버전, 원본 커밋과 payload 해시를 기록하는 출처 정보일 뿐 자동 업그레이드 잠금이나 호환성 보증이 아니다.

## 출력 검토

export 또는 new-project 경계를 변경했다면 smoke로 다음을 확인한다.

- manifest 밖 파일이 포함되지 않는가
- 관리자 전용 경로와 스킬이 누출되지 않는가
- 폴더와 ZIP의 payload가 같은가
- `kit-template`과 `product-workspace` 역할이 맞는가
- 프로젝트 팀 가이드와 provider 설정이 실제 출력에 있는가
- reference fixture 파생 문서가 현재 정본과 같은가

## 릴리스 기록

`KIT-CHG.version_impact`를 미출시 변경 전체에서 집계해 가장 높은 영향도로 다음 SemVer를 계산한다. 버전은 변경 커밋이나 export 때마다 올리지 않고 릴리스 준비 시점에만 올린다.

먼저 읽기 전용 계획을 확인한다.

```powershell
node .aidd-kit-dev/tools/kit.mjs release-plan
```

계획은 현재 버전, 미출시 변경, 최고 영향도, 다음 버전과 미검증 차단 사유를 보여준다. `none`만 있으면 다음 버전이 없으며 릴리스를 준비할 수 없다.

모든 후보가 `verified`이고 작업 트리가 깨끗하면 릴리스 정본을 준비한다.

```powershell
node .aidd-kit-dev/tools/kit.mjs prepare-release
node .aidd-kit-dev/tools/kit.mjs prepare-release --date 2026-09-22
```

`prepare-release`는 다음을 한 작업으로 처리한다.

- `.aidd-kit-dev/repository.json`의 `current_version`과 `export-manifest.json`의 `kit_version`을 같은 값으로 갱신한다.
- 포함된 모든 KIT-CHG에 `released_in`을 기록한다.
- `KIT-REL-<버전>.md`를 변경 정본에서 생성한다.
- `UNRELEASED.md`를 빈 기준선으로 초기화한다.

버전 정본 불일치, 잘못된 SemVer, 영향도 누락, 미검증 변경, 이미 존재하는 대상 릴리스 파일 또는 Git 태그가 있으면 쓰기 전에 중단한다. 여러 파일 쓰기 중 실패하면 원본을 복원한다. 커밋과 `v<버전>` Git 태그는 자동 생성하지 않으므로 생성된 diff와 검증 결과를 사람이 확인한 뒤 별도 수행한다.

릴리스 노트에는 사용자에게 보이는 변경, 호환성·마이그레이션, 검증 범위, 알려진 제한과 롤백을 남긴다. 현재 기준선에는 채택된 상태만 유지하고 과거 상세 검증은 Git 이력에서 찾는다.

다른 Kit 또는 프로젝트에 개선을 공유할 때는 자동 patch나 merge를 제공하지 않는다. 문제, 의도, 환경, 전제, 구현 접근, 검증, 위험과 롤백을 담은 변경 설명서를 전달한다. 수신 측은 자체 영향 분석과 승인 뒤 별도 변경으로 구현한다.
