# AIDD 프로젝트 작업공간

이 저장소는 AIDD Kit에서 생성한 독립 프로젝트다. Kit 원본을 개발하거나 다른 프로젝트를 export하는 저장소가 아니다.

이 README와 같은 배포물의 `AGENTS.md`, `CLAUDE.md`는 프로젝트 팀용이다. Kit 원본 저장소의 같은 이름 문서나 관리자 전용 절차를 따르지 않는다.

## AI에게 먼저 요청하기

명령어를 외울 필요는 없다. Codex 또는 Claude Code로 이 폴더를 열고 다음처럼 요청하면 AI가 역할, 기존 파일과 필수 입력을 확인한 뒤 필요한 명령을 실행한다.

> 이 AIDD 프로젝트 템플릿에서 새 프로젝트를 시작해줘. 만들려는 제품을 설명할 테니 프로젝트 ID와 이름, 신규 구축인지 기존 시스템인지 먼저 확인해줘. 기존 파일은 덮어쓰거나 이동하지 말고, 자동 커밋이나 푸시도 하지 마.

이미 제품 정본이 있다면 다음처럼 요청한다.

> 기존 AIDD 프로젝트를 이어서 진행하려고 해. 현재 작업자, 확정된 목표와 범위, 막힌 결정, 진행 중 작업과 통합 위험을 정본에서 확인해 짧게 브리핑해줘. 대화만으로 완료를 추정하지 마.

프로젝트가 준비된 뒤의 자연어 요청 예시는 [.ai/docs/guides/project-team-guide.md](.ai/docs/guides/project-team-guide.md)와 각 상세 장에서 확인한다.

## 명령을 직접 실행할 때

`.aidd-role.json`이 `kit-template`이면 고객과 프로젝트 ID·이름·신규/기존 시스템 여부를 확인한 뒤 다음 명령으로 제품 정본을 만든다.

```powershell
node .ai/tools/aidd.mjs project-bootstrap --project-id <ID> --name "<이름>" --mode greenfield
```

성공하면 `.aidd-role.json`은 `product-workspace`로 전환된다. 이후에는 기존 `project/.aidd/ssot/`를 읽고 제품 수행을 계속한다.

과거 템플릿에서 이미 `project/`를 만들었지만 역할 표식이 `kit-template`으로 남은 경우에는 bootstrap을 다시 실행하거나 JSON을 직접 고치지 않는다. 다음 명령은 기존 제품 정본을 검증한 뒤에만 역할을 정합화한다.

```powershell
node .ai/tools/aidd.mjs project-reconcile-role
```

정본이 준비되면 `AGENTS.md`와 [.ai/docs/guides/project-team-guide.md](.ai/docs/guides/project-team-guide.md)를 따른다. 이 가이드에서 프로젝트 준비, 전체 생명주기, 문서 관리, 스킬·훅, 팀 작업, 완료·출시 장으로 이동할 수 있다. 제품 정본은 `project/.aidd/ssot/`, 파생 문서는 `project/docs/generated/`, 제품 소스는 `project/src/`에 둔다.

`.aidd-kit-origin.json`은 생성에 사용한 Kit의 출처만 나타낸다. 원본 Kit과 자동 업그레이드·역동기화되지 않으며, 이 프로젝트의 규칙·스킬·훅은 프로젝트 정본과 검증 절차에 따라 독립적으로 수정할 수 있다.
