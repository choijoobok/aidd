# AIDD Kit 사용 가이드

이 문서는 AIDD Kit을 처음 사용하는 고객·프로젝트 책임자를 위한 학습용 안내서다. AI가 일을 대신 결정하는 도구가 아니라, 고객의 의도와 승인 아래에서 정본·증거·산출물을 일관되게 관리하는 작업 체계를 만드는 것이 목표다.

## 1. Kit 복사와 제품 정본 만들기

`project/`는 AIDD Kit 자체가 아니라 **현재 수행 중인 한 제품의 산출물**이다. 따라서 다른 프로젝트를 시작할 때는 이 Kit의 `.git`과 `project/`를 제외한 내용을 새 프로젝트 폴더로 복사한다. `.ai/templates/project-skeleton/`은 반드시 함께 복사한다.

1. `.gitignore`를 먼저 검토해 비밀키, 환경 변수 파일, 운영 데이터, 개인 설정이 포함되지 않았는지 확인한다.
2. Codex 또는 Claude Code로 새 폴더를 열고 `python .ai/tools/aidd.py project-init`을 실행한다. 이 명령은 Git이 없는 경우 로컬 `main` 브랜치와 `.githooks`만 만들며, 파일을 자동으로 `git add`·커밋하거나 Git 신원을 등록하지 않는다.
3. 제품 작업공간과 빈 정본을 명시적으로 만든다.

```powershell
python .ai/tools/aidd.py project-bootstrap --project-id CRM-PORTAL --name "고객 관리 포털" --mode greenfield
```

4. 기존에 개발된 제품을 수용한다면, 현재 소스 위치를 기록만 하고 자동 이동은 하지 않는다.

```powershell
python .ai/tools/aidd.py project-bootstrap --project-id ERP-CORE --name "기존 ERP" --mode existing-system --source-location "D:\workspace\legacy-erp"
```

5. `project-bootstrap`은 `project/`가 이미 있으면 중단하며 기존 정본·소스·문서를 덮어쓰지 않는다. 생성 직후에는 정본이 `bootstrap` 상태이므로, 제품 목적·범위·모듈·배포 맥락을 합의하기 전에는 문서 생성이나 구현 게이트를 통과한 것으로 보지 않는다.
6. `python .ai/tools/aidd.py project-init-status`와 `python .ai/tools/aidd.py status --level executive`로 Git 및 제품 착수 상태를 확인한다.

기존 소스가 새 저장소 루트나 다른 폴더에 있다면 AI에게 먼저 “`project/src/`로 옮길 대상, 제외할 빌드 산출물·비밀정보·운영 데이터를 분석하고 이동 계획만 제안해줘”라고 요청한다. 사람의 승인 전에는 자동 이동하지 않는다.

### 프로젝트 홈을 먼저 합의하기

프로젝트를 시작할 때 AI와 아래 다섯 가지를 먼저 합의한다. 이 내용은 `project/.aidd/ssot/project.json`의 정본 필드이며, `python .ai/tools/aidd.py generate`를 실행하면 `project/docs/generated/site/index.html`의 첫 화면으로 생성된다.

- 프로젝트 소개: 무엇을 위한 제품인가
- 프로젝트 개요: 대상, 범위와 현재 맥락은 무엇인가
- 목적과 의도: 어떤 문제를 어떤 원칙으로 해결하려는가
- 주요 기능: 사용자가 얻는 핵심 능력은 무엇인가
- 생성 문서 진입점: 요구사항·설계·운영·사용자 안내를 어디서 볼 수 있는가

다음처럼 요청하면 된다.

> 프로젝트 소개, 개요, 목적과 의도, 주요 기능을 먼저 인터뷰해서 정본에 기록해줘. 아직 확정하지 못한 내용은 미결사항으로 분리하고, 합의한 내용으로 생성 HTML 사이트의 홈 화면도 만들어줘.

홈 화면의 좌측 상단 AIDD 로고와 프로젝트명은 항상 `index.html`을 가리킨다. 따라서 사이트의 홈 링크로 사용하며, 생성된 HTML은 직접 수정하지 않는다.

### 상세 문서와 오프라인 문서 사이트

착수 후에는 막연한 메모 대신 용도별 작업 서식을 사용한다. 서식은 AI가 질문할 항목과 사람이 검토할 기준을 구체화하지만, 제품별 프레임워크·DB 컬럼·컴포넌트 이름을 강제하지는 않는다.

| 필요한 대화·작업 | 사용할 Kit 서식 | 정본으로 옮길 결과 |
|---|---|---|
| 기능 범위, 업무 규칙, 예외, 인수 기준 합의 | `.ai/templates/artifact/feature-spec-workbook.md` | REQ·USE·MOD |
| 화면 상태, 입력·동작, 권한, 접근성, 금지 조건 정의 | `.ai/templates/artifact/screen-requirements-workbook.md` | SCR·UXB·UIP·CMP |
| 실제 사용자 절차, 오류 복구, 다른 메뉴와의 관계 | `.ai/templates/artifact/user-manual-workbook.md` | MAN |
| 점검, 장애 대응, 재실행, 롤백, 에스컬레이션 | `.ai/templates/artifact/runbook-workbook.md` | RUN·EVD |
| 대안 조사와 중요한 설계 선택 | `.ai/templates/artifact/research-note.md`, `.ai/templates/artifact/decision-card.md` | ADR·DEC·OI |
| 실행한 테스트 결과와 잔여 위험 | `.ai/templates/artifact/test-result-workbook.md` | EVD·TST |

다음처럼 AI에게 요청할 수 있다.

> 이 기능의 요건 정의서를 기능 요건 서식 수준으로 작성해줘. 사용자 업무 흐름, 업무 규칙, 예외, 화면·데이터 영향, 인수 기준과 되면 안 되는 경우를 분리하고, 모르는 내용은 미결사항으로 남겨줘.

`python .ai/tools/aidd.py generate`를 실행하면 세 개의 오프라인 HTML 사이트가 함께 생성된다.

- `project/docs/generated/site/design/index.html`: 설계·검증 문서
- `project/docs/generated/site/user/index.html`: 사용자 가이드
- `project/docs/generated/site/operations/index.html`: 운영·개발 가이드

각 사이트는 좌측 트리 목차, 제목·본문 검색, 인쇄, 테마·글꼴·크기 설정을 제공한다. 상단 프로젝트명은 공통 홈으로 돌아온다. HTML은 모두 파생물이므로 문서 내용은 정본과 생성 Markdown을 수정한 뒤 재생성한다.

### 프로젝트별 문서 포맷을 합의하고 현행화하기

위 서식은 그대로 복사해 강제하는 표준이 아니라 **대화의 출발점**이다. 프로젝트의 규제, 업무 복잡도, 사용자군, 제품 유형에 맞춰 사용자와 AI가 문서 포맷을 다시 합의한다. 합의 결과는 `project/.aidd/ssot/documentation.json`에 기록하며, 생성되는 기준 문서는 `project/docs/generated/foundation/documentation-standard.md`에서 확인한다.

1. 문서 유형별 독자와 판단 목적을 먼저 정한다. 예를 들어 요건 정의서는 승인자·구현 AI, 사용자 매뉴얼은 실제 업무 사용자, 런북은 장애 대응 운영자가 독자다.
2. 각 문서의 필수 항목, 용어, 근거 정본, 승인 기준을 함께 정한다. 프로젝트에만 필요한 항목은 해당 문서 유형의 `required_sections`에 추가한다.
3. 새 필수 항목을 추가하면 생성기가 같은 유형의 기존 문서 전체에 소급 표시한다. `fill_from`으로 확인된 정본 필드를 연결한 항목은 자동으로 채우고, 근거가 없으면 ‘미작성’으로 표시해 OI로 확인한다.
4. 구현 또는 기존 기능 수정 뒤에는 `python .ai/tools/aidd.py document-impact`를 실행한다. 요건 정의서 → 화면 요건 → 사용자 매뉴얼 → 운영 런북 → 테스트·증거를 순서대로 대조한다.
5. 소스 변경 뒤 Codex·Claude 훅도 같은 현행화 후보를 경고한다. 훅은 변경 사실만 감지하며 의미상 어느 쪽이 옳은지는 판단하지 않는다. 불일치는 `aidd-document-consistency` 검토로 근거와 처리를 기록한 뒤 정본을 확정한다.

AI에게는 다음처럼 요청하면 된다.

> 이 프로젝트의 요건 정의서·화면 정의서·사용자 매뉴얼·운영 런북 포맷을 먼저 제안해줘. 각 문서의 독자, 목적, 필수 항목, 근거 정본, 승인 기준을 비교해서 나와 합의한 뒤 documentation.json에 기록해줘. 이후 항목이 추가되면 기존 문서에도 소급 적용하고, 소스 변경 시 문서 현행화 후보를 점검해줘.

### 현재 상태와 일별 수행 기록

상태를 한 파일에 무한히 누적하지 않는다. 목적이 다른 세 층으로 나눈다.

| 목적 | 위치 | 유지 원칙 |
|---|---|---|
| 지금 집중하는 일, 다음 행동, 주시할 미결사항 | `project/.aidd/ssot/workboard.json` | 작고 최신 상태만 유지한다. 완료한 일은 제거한다. |
| 변경·슬라이스·태스크·미결·가정·위험의 공식 상태와 근거 | `changes.json`, `delivery-plan.json`, `open-items.json`, `assumptions.json`, `risks.json`, `evidence.json` | 안정 ID와 상태를 사용한다. |
| 언제 무엇을 왜 수행했고 결과와 다음 행동이 무엇인지 | `project/work-log/YYYY-MM/YYYY-MM-DD/HUM-001.md` | Git으로 추적한다. 하루·검증된 참여자 단위로 분리해 팀원끼리 같은 파일을 수정하지 않는다. |

AI에게 “오늘 한 작업을 이유·결과·다음 행동·연결 ID와 함께 기록해줘”라고 요청하거나 아래 명령을 사용한다. 명령은 현재 저장소의 Git `user.name`·`user.email`을 `collaboration.json`의 등록된 활성 신원과 대조해 `HUM-001.md` 같은 참여자별 파일을 선택한다. 원시 Git 이름이나 이메일을 파일명으로 쓰지 않으므로 별칭·이메일 변경에도 이력이 분산되지 않는다. 신원이 미등록이면 임의로 기록하지 않고 `identity-check`와 `collaboration-identity`로 먼저 매핑한다.

```powershell
python .ai/tools/aidd.py record-work --summary "요건 인터뷰 정리" --why "착수 범위를 합의하기 위해" --result "REQ와 OI를 갱신" --next "화면 포맷 검토" --link CHG-001
```

팀의 배정 단위는 개발 슬라이스보다 큰 작업 패키지(WRK)다. 하나 이상의 REQ와 CHG별 필수 작업 영역을 묶고, 슬라이스는 WRK 내부에서 실행한다. 기본 영역은 설계·구현·시험·문서이며 프로젝트 맥락에 따라 보안·데이터·마이그레이션·배포·운영·교육을 CHG의 `required_work_coverage`에 추가한다. 개발 배분 전에 아래 점검을 통과해야 하며, REQ 연결·책임자·필수 수행 범위가 하나라도 빠지면 배분 완료가 아니다.

```powershell
python .ai/tools/aidd.py workload-coverage --change CHG-ID
```

팀의 기본 방식은 PM 배정이다. 두 번째 활성 참여자를 추가하기 전에 기존 참여자 또는 새 참여자에게 `PM` 역할을 지정해야 한다. PM 부재 시 PM은 활성 팀원을 위임자로 지정하거나, 오프라인으로 업무를 합의하는 자율 배정으로 바꿀 수 있다.

```powershell
python .ai/tools/aidd.py set-assignment-policy --mode delegated --delegate HUM-002 --reason "PM 부재 기간의 업무 배정 위임"
python .ai/tools/aidd.py set-assignment-policy --mode self_assignment --reason "팀원 오프라인 협의에 따른 자율 배정"
python .ai/tools/aidd.py assign-work --work WRK-ID --participant HUM-ID --reason "요구사항 범위와 전문성을 고려한 배정"
python .ai/tools/aidd.py work-check --work WRK-ID
```

`pm_controlled`에서는 PM, `delegated`에서는 PM 또는 지정 위임자만 다른 사람에게 배정할 수 있다. `self_assignment`에서는 각 팀원이 오프라인 협의를 전제로 자신에게만 배정한다. `offline_coordination_required`는 `self_assignment`에서만 `true`이며 다른 두 모드에서는 `false`다. 어떤 방식에서도 점유·잠금·자동 `pull` 검사는 사용하지 않는다. 정책 변경과 작업 패키지 재배정은 이전 값·변경자·시각·사유가 협업 감사 이력에 남는다.

개발 중 파생 요구가 현재 작업 패키지의 승인된 범위 안이면 담당 팀원이 CHG·REQ를 기록하고 같은 WRK의 `requirements`와 `coverage`에 추가해 끝까지 처리한다. 다른 모듈·다른 WRK·승인 범위를 넘으면 PM 또는 위임자가 새 WRK 또는 범위 변경을 결정한 뒤 다시 `workload-coverage`를 실행한다. 팀원은 구현 전 `work-check`를 실행하며, 배정자가 다르거나 배정이 없으면 작업을 시작하지 않는다. 1인 프로필은 같은 명령으로 브랜치·작업 상태만 확인하며 배정 제한은 없다.

대화 원문은 상태·증거와 분리한다. 훅이 제공한 원문만 Git 무시 경로 `project/chat-history/YYYY-MM/YYYY-MM-DD.md`에 날짜별 Markdown으로 남긴다.

Git이 설치되어 있지 않다면 먼저 설치해야 한다. 템플릿 관리 도구는 Python 표준 라이브러리만 사용한다. Node.js는 이 템플릿의 필수 조건이 아니라, React 등 선택한 제품 기술 스택의 요구사항일 때 추가한다.

## 2. 최초 기준선 커밋

초기화 자동화는 의도적으로 최초 커밋을 만들지 않는다. 다음을 고객이 확인한 뒤에만 기준선을 만든다.

```powershell
git config user.name
git config user.email
git status
git add <검토한 파일>
git commit -m "chore: AIDD 프로젝트 기준선"
```

Git 이름·이메일이 확인되면 AI에게 “이 Git 신원을 프로젝트 책임자(HUM-001)에 등록해줘”라고 요청한다. AI는 `collaboration-identity`로 `IDM` 매핑과 이력을 남긴다. 다른 사람의 이메일이나 CI 봇 계정은 사람을 자동 생성하지 않으므로, 기존 사람의 별칭·새 팀원·봇 중 무엇인지 먼저 확인한다.

AI가 커밋을 만들 때는 [.ai/templates/git/commit-message.md](../../templates/git/commit-message.md)의 구조를 사용한다. 커밋에는 변경 이유, 영향 ID, 검증 결과만 간략히 남기고 상세한 요구사항·결정·증거를 중복 작성하지 않는다.

## 3. 1인과 팀의 브랜치 흐름

| 상황 | `main` 직접 커밋 | 작업 브랜치 | 검토 |
|---|---|---|---|
| 1인 프로젝트 C0 | 허용 | 선택 | 보통의 자체 점검 |
| 1인 프로젝트 C1~C3 | 권장하지 않음 | 권장 | C2·C3은 분리된 AI 검토 또는 Codex·Claude 교차 검토 |
| 팀 프로젝트 | 금지 | 필수 | 작성자 외 활성 사람 최소 1명 승인 |

팀원이 합류할 예정이면 먼저 다음 변경용 작업 브랜치를 만든 뒤 `collaboration-member`로 합류를 기록한다.

```powershell
git switch -c feature/CHG-001-설명
python .ai/tools/aidd.py collaboration-member --id HUM-002 --name "팀원 이름" --role 개발자 --status active --reason "팀원 합류"
python .ai/tools/aidd.py branch-check --change CHG-001
```

활성 사람이 다시 한 명이 되면 1인 프로필로 자동 전환된다. 과거 참여·승인·전환 이력은 남고, 이후 변경부터 1인 통제가 적용된다. 로컬 pre-commit 훅은 팀 프로필에서 `main` 직접 커밋을 차단한다. 원격 PR·승인·병합 강제는 GitHub 규칙과 CI를 별도로 활성화·검증해야 한다.

## 4. 프로젝트를 AI와 시작하는 대화

처음에는 구현을 요청하기보다 목적과 맥락을 말한다. 예시는 다음과 같다.

> 신규 서비스로 시작할게. 대상 사용자는 누구이고 어떤 문제를 해결하며, 성공을 어떻게 측정할지 인터뷰해줘. 배포 환경과 DBMS는 아직 미정이니 미결사항으로 관리해줘.

AI는 요구 발굴, 대안 비교, 미결사항, 의사결정, 모듈·작업 분해, 배포·기술 스택 게이트를 정본에 연결해야 한다. 중요한 선택에서는 선택지별 장점·비용·위험·가역성과 추천 근거를 제시하고, 고객이 선택한 결과를 기록한다.

기존 시스템이라면 현재 기준선, 영향 모듈, 호환성 제약, 데이터·운영 환경을 먼저 제공한다. 정본이 아직 `bootstrap` 상태이면 기존 소스의 이동·분석 계획과 제품 의도부터 합의한 뒤 다음 단계로 전환한다. 새 기능·결함·마이그레이션을 각각 `CHG`로 추적하고, 기존 기능을 코드만 보고 추측하여 요구사항을 바꾸지 않게 한다.

## 5. 일상적인 확인 명령

```powershell
python .ai/tools/aidd.py status --level executive
python .ai/tools/aidd.py status --level module --module MOD-ID
python .ai/tools/aidd.py collaboration-status
python .ai/tools/aidd.py identity-check
python .ai/tools/aidd.py development-check --change CHG-ID
python .ai/tools/aidd.py branch-check --change CHG-ID
python .ai/tools/aidd.py generate
python .ai/tools/aidd.py validate
```

### 가정·결정·검증 부담 관리

고객 확인 전에도 작업을 진행해야 하면 추측을 사실로 쓰지 말고 `ASM` 가정으로 등록한다. 가정은 영향 모듈·연결 ID·확인 게이트를 가지며, 확인하거나 무효가 되어도 이력을 삭제하지 않는다.

```powershell
python .ai/tools/aidd.py add-assumption --id ASM-001 --statement "피크 동시 사용자는 50명 이하" --rationale "현재 사용자 수 기준 임시 추정" --due-gate TG-001 --module MOD-ARCH --link REQ-020
python .ai/tools/aidd.py resolve-assumption --id ASM-001 --status confirmed --resolution "고객이 피크 40명이라고 확인했다."
```

중요한 `GTR`에는 레드팀 발견사항, 업무 언어의 결정 카드, AI가 확신하지 못한 역질문을 남긴다. 기능·작업 단위에는 수정 라운드, 미검증 업무 규칙, 품질 실패, 명세 결함, 레드팀 수정 수를 `verification_load`로 기록할 수 있다. 이 값은 절대적인 통과선이 아니라 반복 품질 문제를 조기에 찾는 추세 지표다.

`CHG`에는 지금 반영·나중 반영·반영하지 않음의 세 선택지와 기준선 대비 범위 증감을 기록한다. 업무 규칙이 있는 테스트에는 `rule_mutation` 증거를 선택적으로 연결한다. 규칙을 의도적으로 뒤집었을 때 테스트가 실패하는지 확인하는 방식이며, UI·설정처럼 업무 규칙이 없는 테스트에는 적용 대상 아님 사유를 기록한다.

`project/docs/generated/`는 정본에서 파생되므로 직접 수정하지 않는다. 원하는 문서가 바뀌어야 한다면 AI에게 관련 `project/.aidd/ssot` 레코드를 먼저 갱신하도록 요청하고 생성한다. 반대로 제품별 UI·데이터 모델·인프라 문서는 해당 제품에서 적용 대상이 되면 정본과 링크해 추가한다.

### 모듈별 정본과 문서

`modules.json`은 모든 모듈의 작은 카탈로그(목적·상태·의존성)이고, 요구사항 정본은 `project/.aidd/ssot/modules/MOD-ID.json` 조각에 저장한다. 하나의 요구사항은 한 조각에만 저장하되, 여러 모듈에 영향을 주면 `modules` 배열로 모두 연결한다. 따라서 동일한 사실을 복제하지 않으면서 모듈별로 수정·검토할 수 있다.

`python .ai/tools/aidd.py generate`는 각 모듈에 `project/docs/generated/modules/MOD-ID.md`를 생성한다. 이 뷰에는 모듈 상태, 요구사항 상세, 작업, 인터페이스, 의존성, 관련 변경·결정·테스트가 포함된다. 전체 문서 대신 이 파일 또는 `python .ai/tools/aidd.py status --level module --module MOD-ID`를 사용해 모듈을 분석한다.

새 모듈은 다음처럼 카탈로그와 빈 정본 조각을 함께 만든다. 모듈별 진행 상태는 독립적으로 갱신할 수 있다.

```powershell
python .ai/tools/aidd.py add-module --id MOD-ORDERS --name "주문" --purpose "주문 수명주기를 관리한다." --dependency MOD-GOV
python .ai/tools/aidd.py module-status --module MOD-ORDERS --status in_progress
python .ai/tools/aidd.py generate
python .ai/tools/aidd.py validate
```

## 6. AI 규칙은 별도 가이드가 필요한가?

별도의 중복 AI 가이드는 만들 필요가 없다. `.ai/core/agent-contract.md`와 `.ai/skills/`가 AI용 정본이며, `python .ai/tools/aidd.py sync-ai`가 이를 Codex의 `AGENTS.md`·`.agents/skills/`와 Claude Code의 `CLAUDE.md`·`.claude/skills/`로 동기화한다. 두 플랫폼용 파일을 따로 고치면 다음 동기화에서 덮어써지거나 검증에서 불일치가 난다.

AI 공통 규칙을 바꿀 때만 `.ai` 정본을 수정하고 `sync-ai`, `generate`, `validate`를 순서대로 실행한다. 이 문서는 사람의 학습과 프로젝트 시작을 위한 안내서이므로 AI 규칙의 또 다른 정본이 아니다.

## 7. 안전한 되돌리기와 문제 해결

- 잘못된 결정을 발견하면 기존 기록을 삭제하지 말고, 대체 결정과 롤백 경로를 연결한다.
- 미등록 Git 신원이 나오면 사람·기존 별칭·봇 중 무엇인지 확인한 뒤 매핑한다. 확인 전에는 C2·C3 개발 진입과 릴리스가 차단될 수 있다.
- 팀 전환 직후 `main` 커밋이 차단되면 오류가 아니라 정책 작동이다. `git switch -c feature/CHG-ID-설명`으로 작업 브랜치를 만들고 진행한다.
- 생성 문서가 오래되었다는 오류는 정본을 수정한 뒤 `python .ai/tools/aidd.py generate`를 실행해 해결한다.
- 원격 브랜치 보호가 실제로 활성화되었는지는 로컬 JSON 파일이 아니라 호스팅 제공자의 조회 결과와 증거로 확인한다.
