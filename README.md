# AIDD Kit Source

이 저장소는 AIDD Kit 자체를 설계·검증·출시하는 `kit-source`다. 실제 업무 시스템이나 애플리케이션의 제품 정본을 루트 `project/`에서 관리하지 않는다.

AIDD Kit은 AI와 사람이 제품 의도부터 운영까지 추적 가능하게 수행하도록 돕는 규칙, 구조화 정본 모델, 스킬, 훅, 도구와 템플릿을 제공한다. 이식 가능한 행동 명세는 [.ai/spec/index.md](.ai/spec/index.md), Kit 관리 절차는 [.aidd-kit-dev/guides/kit-maintainer-guide.md](.aidd-kit-dev/guides/kit-maintainer-guide.md), 배포된 프로젝트의 수행 절차는 [.ai/docs/guides/project-team-guide.md](.ai/docs/guides/project-team-guide.md)에서 확인한다.

## 역할 구분

- `kit-source`: 이 저장소. Kit 명세·구현·이력·릴리스와 export를 관리한다.
- `kit-template`: 제품 정본을 아직 만들지 않은 배포 스냅샷이다.
- `product-workspace`: `project/.aidd/ssot/`와 제품 소스를 가진 실제 프로젝트다.

역할은 `.aidd-role.json`에 기록되며 임의 설정 토글이 아니다. export와 bootstrap 과정이 역할을 정한다.

## 관리 명령

```powershell
python .aidd-kit-dev/tools/kit.py status
python .aidd-kit-dev/tools/kit.py sync-providers
python .aidd-kit-dev/tools/kit.py validate
python -m unittest discover -s .aidd-kit-dev/tests -v
python -m unittest discover -s .ai/tests -v
```

빈 프로젝트 템플릿과 초기화된 프로젝트는 같은 허용 목록 기반 조립기를 사용한다.

```powershell
python .aidd-kit-dev/tools/kit.py export --zip D:\dist\aidd-kit.zip
python .aidd-kit-dev/tools/kit.py new-project --directory D:\work\crm --project-id CRM --name "CRM" --mode greenfield
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
