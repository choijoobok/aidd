# AIDD Kit 관리팀 가이드

이 문서는 `kit-source` 저장소를 관리하는 사람과 AI 전용이다. 프로젝트 배포물에는 포함하지 않는다.

## 관리 대상

- `.ai/spec/`: 프로젝트에도 전달되는 Kit 행동 명세
- `.ai/manifests/kit.json`: 이식 가능한 구성과 배포 원칙
- `.ai/skills/`, `.ai/hooks/`, `.ai/tools/`, `.ai/templates/`: 프로젝트 실행 기반
- `.aidd-kit-dev/`: 관리 생명주기, export, 변경·결정·증거·릴리스 기록과 관리 전용 스킬
- `.agents/skills/`, `.claude/skills/`: 원본 저장소에서만 portable 스킬과 관리 스킬을 합쳐 만든 provider 어댑터

루트에는 제품용 `project/`를 두지 않는다. 회귀 검증에 필요한 제품 데이터는 `.aidd-kit-dev/fixtures/`에서 명시적인 fixture로 관리한다.

사용자·AI 대화 원문은 Kit 변경 이력이나 증거가 아니다. 훅이 제공한 UTF-8 원문만 Git 무시 루트 `chat-history/YYYY-MM/YYYY-MM-DD.md`에 로컬 기록한다. 이 위치는 `kit-source`, `kit-template`, `product-workspace`에서 같으며, 빈 템플릿이 대화 기록만으로 `project/`를 생성하지 않게 한다. 모든 실행 도구는 Node.js 22 이상과 표준 라이브러리만 사용한다. 실제 Windows provider 명령에 비 ASCII 입력을 전달하는 회귀 검사를 유지하고, `commandWindows`에는 바깥 PowerShell이 조기 확장할 `$repo`·`$LASTEXITCODE` 같은 중첩 변수를 넣지 않는다. provider JSON은 `.ai/tools/`의 Node 진입점만 참조하며 `self-test`가 비-Node 실행 경로 부재를 검사한다. 신뢰 레코드 존재와 실제 훅 실행·저장 성공은 별도 상태로 검증한다.

## AI에게 요청하는 방법

명령어를 직접 실행할 필요는 없다. 이 저장소를 Codex 또는 Claude에서 열고, 현재 저장소가 `kit-source`라는 점과 원하는 결과를 함께 말한다. AI는 먼저 역할·변경 이력·영향 명세를 확인하고, 파괴적 변경이나 출시 판단은 근거와 함께 제안해야 한다.

다음처럼 요청할 수 있다.

> 이 저장소는 AIDD Kit 원본이야. 현재 Kit 변경 상태, 미출시 변경, export 경계와 검증 결과를 짧게 브리핑해줘.

> 이 개선안을 검토해줘. 프로젝트에도 배포할 portable 기능인지, Kit 관리 전용 기능인지 분류하고, 영향을 받는 명세·스킬·훅·도구·가이드·테스트와 롤백 방법을 제안해줘. 아직 구현하지는 마.

> `KIT-CHG`로 이 변경을 진행해줘. 허용 목록 export에서 관리 전용 파일이 빠지는지, 폴더와 ZIP이 같은 결과를 내는지 검증해줘. 독립 검토가 필요하면 완료로 표시하지 마.

> CRM 프로젝트용 AIDD 시작 스냅샷을 지정한 빈 폴더에 만들어줘. Kit 관리팀 파일과 관리 전용 스킬은 절대 포함하지 말고, 결과를 bootstrap 전 템플릿인지 제품 작업공간인지 알려줘.

> 다른 프로젝트에서 받은 개선 설명서를 검토해줘. 코드를 자동 적용하지 말고, 이 Kit에 맞는 별도 변경의 목적·전제·위험·검증 계획을 작성해줘.

AI에게 “export해줘”, “검증해줘”, “변경을 구현해줘”처럼 짧게 말해도 되지만, 대상 폴더·프로젝트 ID·출시 여부처럼 결과를 바꾸는 정보는 함께 지정한다. 기존 폴더 덮어쓰기, 자동 업그레이드, 프로젝트 변경의 역반영은 요청하더라도 이 Kit의 기본 동작이 아니다.

## 변경 절차

1. 해결할 실패와 영향을 받는 portable 명세를 확인하고 `KIT-CHG`를 만든다.
2. 위험·호환성·롤백과 대안을 검토해 필요한 `KIT-ADR`을 기록한다.
3. 명세, 구현, 테스트, 두 가이드와 export 영향 중 관련 항목을 같은 변경에서 갱신한다.
4. `node .aidd-kit-dev/tools/kit.mjs sync-providers`로 원본 저장소의 provider 스킬을 동기화한다.
5. `node .aidd-kit-dev/tools/kit.mjs validate`와 전체 테스트를 실행한다.
6. C2·C3는 구현 흐름과 분리된 독립 검토를 받고 결과를 evidence에 기록한다.
7. 출시 시 버전, 호환성, 보안 영향, 변경 설명서와 검증 결과를 release note에 연결한다.

## 배포

AI에게 위 예시처럼 요청하거나, 자동화·CI에서 재현할 필요가 있을 때 아래 명령어를 사용한다.

### 배포용 템플릿을 자연어로 요청하기

배포용 템플릿 자체도 자연어로 요청할 수 있다. 이때 **빈 템플릿(`kit-template`)**인지, 제품 정본까지 만든 **새 프로젝트(`product-workspace`)**인지와 출력 형식·대상을 명확히 말한다.

> 현재 AIDD Kit의 배포용 템플릿을 `D:\dist\aidd-template.zip`에 ZIP으로 만들어줘. 아직 제품 정본은 만들지 말고 `kit-template`으로 유지해줘. 기존 파일은 덮어쓰지 말고, Kit 관리팀 파일과 관리 전용 스킬이 포함되지 않았는지 검증 결과도 알려줘.

> AIDD 배포용 템플릿을 `D:\work\aidd-template` 폴더에 만들어줘. 폴더가 이미 있으면 중단하고, `.aidd-kit-origin.json`은 출처 정보로만 넣어줘. 원본 Kit와 자동 업그레이드되도록 연결하지 마.

AI는 허용 목록으로 staging 조립·검증을 수행한 뒤 폴더 또는 ZIP을 만든다. 대상이 이미 존재하거나 비어 있지 않으면 보호를 위해 덮어쓰지 않고 중단한다. 대상 경로나 ZIP/폴더 형식이 빠졌다면 먼저 확인한다.

빈 템플릿은 다음처럼 만든다.

```powershell
node .aidd-kit-dev/tools/kit.mjs export --directory D:\work\aidd-template
node .aidd-kit-dev/tools/kit.mjs export --zip D:\dist\aidd-template.zip
```

제품 정본까지 초기화한 프로젝트는 다음처럼 만든다.

```powershell
node .aidd-kit-dev/tools/kit.mjs new-project --directory D:\work\crm --project-id CRM --name "CRM" --mode greenfield
```

출력 대상은 기존 파일을 보호하기 위해 존재하지 않아야 한다. 폴더와 ZIP은 같은 staging 조립과 검증을 거친다. `.aidd-kit-origin.json`은 출처 표식일 뿐 업그레이드 지시가 아니다.

## 변경 공유

원본과 프로젝트 사이에 patch, merge, pull 방식의 자동 업그레이드나 역반영을 제공하지 않는다. 개선을 공유할 때는 `.ai/spec/change-sharing.md`의 변경 설명 항목을 전달한다. 수신 측이 자체 변경·승인·검증으로 재구현한다.

보안 결함처럼 긴급도가 높은 경우에도 자동 코드를 배포하지 않는다. 영향 버전, 악용 조건, 완화책, 탐지 방법과 권장 구현 순서를 명확히 공지한다.
