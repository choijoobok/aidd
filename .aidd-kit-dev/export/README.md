# AIDD 프로젝트 작업공간

이 저장소는 AIDD Kit에서 생성한 독립 프로젝트다. Kit 원본을 개발하거나 다른 프로젝트를 export하는 저장소가 아니다.

`.aidd-role.json`이 `kit-template`이면 고객과 프로젝트 ID·이름·신규/기존 시스템 여부를 확인한 뒤 다음 명령으로 제품 정본을 만든다.

```powershell
python .ai/tools/aidd.py project-bootstrap --project-id <ID> --name "<이름>" --mode greenfield
```

성공하면 `.aidd-role.json`은 `product-workspace`로 전환된다. 이후에는 기존 `project/.aidd/ssot/`를 읽고 제품 수행을 계속한다.

과거 템플릿에서 이미 `project/`를 만들었지만 역할 표식이 `kit-template`으로 남은 경우에는 bootstrap을 다시 실행하거나 JSON을 직접 고치지 않는다. 다음 명령은 기존 제품 정본을 검증한 뒤에만 역할을 정합화한다.

```powershell
python .ai/tools/aidd.py project-reconcile-role
```

정본이 준비되면 `AGENTS.md`와 [.ai/docs/guides/project-team-guide.md](.ai/docs/guides/project-team-guide.md)를 따른다. 처음부터 전체 흐름을 익히려면 [.ai/docs/guides/aidd-kit-guide.md](.ai/docs/guides/aidd-kit-guide.md)를 함께 읽는다. 제품 정본은 `project/.aidd/ssot/`, 파생 문서는 `project/docs/generated/`, 제품 소스는 `project/src/`에 둔다.

`.aidd-kit-origin.json`은 생성에 사용한 Kit의 출처만 나타낸다. 원본 Kit과 자동 업그레이드·역동기화되지 않으며, 이 프로젝트의 규칙·스킬·훅은 프로젝트 정본과 검증 절차에 따라 독립적으로 수정할 수 있다.
