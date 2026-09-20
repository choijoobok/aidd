# 프로젝트 준비와 시작

## 1. 받은 배포물 확인

프로젝트 팀은 Kit 원본 저장소가 아니라 관리자가 export한 폴더 또는 ZIP에서 시작한다. 루트의 `.aidd-role.json`이 `kit-template`인지 확인하고, 기존 `project/`나 제품 소스가 있다면 덮어쓰지 않는다.

필수 환경은 Git, Node.js 22 이상, 그리고 저장소를 읽고 쓸 수 있는 Codex 또는 Claude Code 중 하나다. AIDD CLI는 별도 패키지 설치 없이 Node 표준 라이브러리로 실행된다. 원격 저장소, CI, 클라우드와 DBMS는 프로젝트가 필요할 때 별도로 준비한다.

AI에게는 다음처럼 요청할 수 있다.

> 이 AIDD 프로젝트 템플릿에서 새 프로젝트를 시작해줘. 프로젝트 ID와 이름, 신규 구축인지 기존 시스템인지 먼저 확인하고, 기존 파일을 이동하거나 덮어쓰지 말아줘. 자동 커밋이나 푸시는 하지 말고 실행 결과를 설명해줘.

## 2. Git과 훅 준비

> 이 템플릿에서 Git과 AIDD 훅을 준비해줘. 자동 커밋·푸시나 Git 신원 변경은 하지 말고, 훅 배선에서 확인한 것과 확인하지 않은 것을 구분해줘.

직접 재현할 때는 다음 명령을 사용한다.

```powershell
node .ai/tools/aidd.mjs project-init
node .ai/tools/aidd.mjs project-init-status
node .ai/tools/aidd_hook.mjs self-test --hook
```

`project-init`은 필요할 때 로컬 Git 저장소와 `.githooks`를 준비한다. 파일을 자동으로 stage·commit·push하지 않고 Git 사용자 정보를 임의로 설정하지 않는다.

`self-test --hook`은 다음을 빠르게 확인한다.

- Node.js 최소 버전과 훅 런타임 파일
- `contract.json`의 필수 정책 루트와 이벤트 정의
- Codex·Claude provider 설정에 필요한 이벤트 토큰이 연결되었는지
- 폐기된 승인·서명·비 Node 훅 패턴이 다시 들어오지 않았는지

이는 전체 소스 의존성 검사, 보안 감사, 원격 권한 확인이나 제품 테스트가 아니다.

## 3. 제품 정본 생성

신규 구축은 다음처럼 요청한다.

> 프로젝트 ID는 `CRM-PORTAL`, 이름은 `고객 관리 포털`이고 신규 구축이야. 빈 제품 정본을 만들되 아직 요구사항이나 기술을 추측해 채우지 마.

직접 실행할 때:

```powershell
node .ai/tools/aidd.mjs project-bootstrap --project-id CRM-PORTAL --name "고객 관리 포털" --mode greenfield
```

기존 시스템 수용은 다음처럼 요청한다.

> 프로젝트 ID는 `ERP-CORE`, 이름은 `기존 ERP`야. 기존 소스는 `D:\workspace\legacy-erp`에 있어. 위치만 기록하고 파일은 이동하거나 덮어쓰지 말고, 이후 조사 계획부터 제안해줘.

직접 실행할 때:

```powershell
node .ai/tools/aidd.mjs project-bootstrap --project-id ERP-CORE --name "기존 ERP" --mode existing-system --source-location "D:\workspace\legacy-erp"
```

성공하면 `project/.aidd/ssot/`가 생성되고 역할은 `product-workspace`로 전환된다. `project/`가 이미 있으면 명령은 중단해야 한다. 기존 시스템의 소스 위치는 기록할 뿐 자동으로 이동하지 않는다.

과거 템플릿에서 제품 정본은 이미 있지만 역할만 `kit-template`인 경우 JSON을 직접 고치거나 bootstrap을 다시 실행하지 않는다.

```powershell
node .ai/tools/aidd.mjs project-reconcile-role
```

이 명령은 기존 제품 정본을 검증한 뒤에만 역할을 정합화한다.

## 4. 최초 소유자와 현재 Git 신원 등록

bootstrap 직후 `collaboration.json`에는 참여자와 신원 매핑이 없다. 따라서 `current-actor`를 먼저 실행하면 실패하는 것이 정상이다. 최초 소유자를 만든 뒤 현재 Git 신원을 그 참여자에 연결한다.

> 현재 Git 이름과 이메일을 확인하고 나를 최초 프로젝트 소유자 `HUM-001`로 등록해줘. 다른 사람이나 봇으로 추정하지 말고, 실제 입력값과 생성된 신원 매핑을 보여줘.

```powershell
node .ai/tools/aidd.mjs collaboration-member --id HUM-001 --name "프로젝트 소유자" --role "소유자" --role PM --status active --reason "프로젝트 최초 소유자 등록"
node .ai/tools/aidd.mjs collaboration-identity --id IDM-001 --type human --participant HUM-001 --git-name "Git 사용자 이름" --git-email "user@example.com" --reason "현재 Git 신원을 최초 소유자에 연결"
node .ai/tools/aidd.mjs current-actor
```

실제 `git config user.name`과 `user.email`을 확인해 정확히 입력한다. 다른 사람이나 봇 신원을 임의로 사람에게 연결하지 않는다. 팀원 추가와 신원 변경은 [팀 작업 흐름](05-team-workflow.md)을 따른다.

## 5. 시작 상태 확인과 최초 기준선

> 초기화된 정본과 역할, 현재 작업자, 통합 상태를 확인해줘. 아직 합의하지 않은 목적·범위·모듈은 완료로 표시하지 말고 다음 인터뷰 질문을 제안해줘.

```powershell
node .ai/tools/aidd.mjs status --level executive
node .ai/tools/aidd.mjs integration-status
node .ai/tools/aidd.mjs validate
```

bootstrap 상태는 제품 목적·범위·모듈이 합의되었다는 뜻이 아니다. 먼저 해결할 문제와 성과를 합의한 뒤 정본을 채운다. 초기 파일을 검토한 후 기준선 커밋이 필요하면 팀의 Git 정책에 따라 수행한다. AIDD 자체는 서명 커밋을 강제하지 않으며 자동 커밋이나 원격 푸시를 하지 않는다.

## 6. 세션을 다시 시작할 때

새 세션에서는 기존 제품 정본을 먼저 읽고 다음을 확인한다.

> 기존 프로젝트를 이어서 진행할게. 훅 배선과 현재 작업자, 경영진 수준 상태, 통합 위험을 확인하고 가장 작은 다음 행동을 알려줘.

```powershell
node .ai/tools/aidd_hook.mjs self-test --hook
node .ai/tools/aidd.mjs current-actor
node .ai/tools/aidd.mjs status --level executive
node .ai/tools/aidd.mjs integration-status
```

AI에게 “현재 작업자, 확정된 범위, 막힌 결정, 통합 위험과 가장 작은 다음 작업을 근거와 함께 브리핑해줘”라고 요청하면 된다.
