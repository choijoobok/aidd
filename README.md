# AIDD Kit Source

이 저장소는 AIDD Kit 자체를 설계·검증·출시하는 `kit-source`다. 실제 업무 시스템이나 애플리케이션의 제품 정본을 루트 `project/`에서 관리하지 않는다.

AIDD Kit은 AI와 사람이 제품 의도부터 운영까지 추적 가능하게 수행하도록 돕는 규칙, 구조화 정본 모델, 스킬, 훅, 도구와 템플릿을 제공한다. 이식 가능한 행동 명세는 [.ai/spec/index.md](.ai/spec/index.md), Kit 관리 절차는 [.aidd-kit-dev/guides/kit-maintainer-guide.md](.aidd-kit-dev/guides/kit-maintainer-guide.md), 배포된 프로젝트의 수행 절차는 [.ai/docs/guides/project-team-guide.md](.ai/docs/guides/project-team-guide.md)에서 확인한다. 각 가이드가 해당 독자의 단일 진입점이다.

이 루트의 `AGENTS.md`, `CLAUDE.md`, `README.md`는 Kit 유지보수 관리자용이다. `.aidd-kit-dev/export/`의 같은 이름 파일은 배포 후 프로젝트 루트에 놓일 프로젝트 팀용 원본이므로 목적과 내용이 의도적으로 다르다.

## 역할 구분

- `kit-source`: 이 저장소. Kit 명세·구현·이력·릴리스와 export를 관리한다.
- `kit-template`: 제품 정본을 아직 만들지 않은 배포 스냅샷이다.
- `product-workspace`: `project/.aidd/ssot/`와 제품 소스를 가진 실제 프로젝트다.

역할은 `.aidd-role.json`에 기록되며 임의 설정 토글이 아니다. export와 bootstrap 과정이 역할을 정한다.

## AI에게 관리 작업 요청하기

명령을 외울 필요는 없다. Kit 저장소를 연 AI에게 문제, 원하는 결과와 변경 범위를 자연어로 설명하면 AI가 역할과 현재 `KIT-CHG`를 확인하고 필요한 명령을 선택해야 한다.

> 현재 Kit 역할과 진행 중 변경, 작업 트리 상태를 확인하고 이 변경이 portable 기능인지 관리자 전용 기능인지 판단해줘. 아직 파일은 수정하지 마.

> 프로젝트 팀 가이드가 현재 명세와 구현을 정확히 설명하는지 검토하고, 관리자 절차가 배포 문서에 섞이지 않게 고쳐줘. 변경 영역 검사만 실행하고 결과를 요약해줘.

> 현재 변경으로 export와 new-project 경계가 영향을 받는지 판단해줘. 영향이 있을 때만 smoke를 실행하고, 프로젝트 배포물에 관리자 전용 파일이 들어가지 않았는지 확인해줘.

## 직접 실행하는 관리 명령

아래 명령은 자동화·재현 또는 문제 해결에 사용할 관리 진입점이다. 매 변경마다 모든 명령을 실행하는 목록이 아니다.

```powershell
node .aidd-kit-dev/tools/kit.mjs status
node .aidd-kit-dev/tools/kit.mjs sync-providers
node .aidd-kit-dev/tools/kit.mjs check
```

변경 영역의 관련 test 파일만 실행한다. 생성기·fixture·export·new-project·provider 경계를 변경했을 때만 `node .aidd-kit-dev/tools/kit.mjs smoke`를 추가한다. AIDD 요건 구현 검증 요청에는 `aidd-requirement-verification` 스킬을 사용한다.

빈 프로젝트 템플릿과 초기화된 프로젝트는 같은 허용 목록 기반 조립기를 사용한다.

```powershell
node .aidd-kit-dev/tools/kit.mjs export --zip D:\dist\aidd-kit.zip
node .aidd-kit-dev/tools/kit.mjs new-project --directory D:\work\crm --project-id CRM --name "CRM" --mode greenfield
```

관리 전용 `.aidd-kit-dev/`와 `aidd-kit-release` 스킬은 배포물에 포함되지 않는다. 배포된 프로젝트는 독립적으로 규칙·스킬·훅을 변경할 수 있으며 원본과 자동 업그레이드 또는 역동기화되지 않는다. 개선은 [.ai/spec/change-sharing.md](.ai/spec/change-sharing.md)의 변경 설명 형식으로 공유한 뒤 각 환경에서 별도 구현한다.

## 주요 구조

```text
.ai/spec/                       이식 가능한 Kit 명세
.ai/manifests/                  공개 구성·정책 목록
.ai/skills/                     프로젝트에도 배포하는 스킬 정본
.ai/hooks/                      프로젝트 수행 훅 계약
.ai/tools/                      제품 정본 생성·검증 도구
.ai/templates/                  프로젝트 수행 템플릿
.aidd-kit-dev/guides/           Kit 관리팀 전용 가이드
.aidd-kit-dev/tools/            export·Kit 검증 도구
.aidd-kit-dev/skills/           관리 전용 스킬
.aidd-kit-dev/changes/          Kit 변경 이력
.aidd-kit-dev/decisions/        Kit 결정 이력
.aidd-kit-dev/releases/         Kit 릴리스 노트
.aidd-kit-dev/fixtures/         회귀 검증용 제품 fixture
```

Markdown 문서군의 수정 책임과 배포 여부는 [.aidd-kit-dev/guides/repository-and-document-boundaries.md](.aidd-kit-dev/guides/repository-and-document-boundaries.md)에 정리되어 있다. fixture의 생성 문서는 회귀 출력이며 현재 Kit 가이드가 아니다.
