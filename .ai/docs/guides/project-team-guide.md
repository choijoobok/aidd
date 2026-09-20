# AIDD 프로젝트 수행팀 가이드

이 문서는 AIDD Kit으로 생성한 업무 시스템·애플리케이션 프로젝트의 PM, 구성원, 1인 프로젝트 사용자와 AI가 함께 읽는 가이드다. Kit 자체를 export하거나 출시하는 관리 절차는 다루지 않는다.

## 시작

1. 세션 시작 시 `node .ai/tools/aidd_hook.mjs self-test --hook`으로 AIDD 배선을 점검한다. provider가 자체 훅 검토 UI를 제공하면 그 일반 기능을 사용할 수 있지만 AIDD는 별도 승인·재시작·Git 서명을 요구하지 않는다.
2. `.aidd-role.json`이 `kit-template`이고 `project/.aidd/ssot/`가 없으면 고객 확인 뒤 `project-bootstrap`을 실행한다. 성공하면 역할이 `product-workspace`로 전환되며, 이후에는 기존 `project/.aidd/ssot/`를 먼저 읽는다. 이미 정본이 있는데 역할만 `kit-template`이면 bootstrap을 다시 실행하지 말고 `project-reconcile-role`로 정합화한다.
3. `current-actor`, `status --level executive`, `integration-status`로 신원·진척·통합 위험을 확인한다.
4. 제품 의도·성과·범위·모듈·배포 맥락을 합의하고 미정 사항은 가정 또는 미결사항으로 기록한다.
5. 제품 의도·목적·성과 기준을 합의한 직후 `BEN-TRIAGE`로 벤치마킹 필요성을 고객과 판단한다. 필요하면 조사 질문·후보·평가 기준·출처 품질·제외 범위를 합의한 뒤 조사하고, 불필요하면 이유와 재검토 조건을 ADR 또는 OI에 남긴다.
6. 프로젝트 규모와 위험에 맞는 작업·게이트·승인 수준을 정한다.

## 로컬 대화 이력

사용자·AI 대화 원문은 제품 정본·증거·생성물이 아니다. 훅이 제공한 UTF-8 원문만 Git 무시 루트 `chat-history/YYYY-MM/YYYY-MM-DD.md`에 로컬 기록한다. 이 규칙은 아직 `kit-template`인 상태에도 같으므로 대화 기록 때문에 `project/`가 먼저 생성되지는 않는다. 저장 실패 시 대화 내용을 노출하지 않고 오류 유형만 경고한다. `AIDD_LOCAL_CONVERSATION_LOG=0`이면 현재 프로세스의 기록을 끌 수 있다.

## AI에게 요청하는 방법

명령어를 외울 필요는 없다. Codex 또는 Claude에서 이 프로젝트를 열고, 해결하려는 문제·원하는 결과·제약·현재 알고 있는 사실을 자연어로 말한다. AI는 먼저 `AGENTS.md`, 역할 표식과 제품 정본을 읽고, 중요한 가정·선택·위험은 구현 전에 분리해 제시해야 한다.

아직 `kit-template`인 새 프로젝트에서는 다음처럼 시작한다.

> 이 저장소는 AIDD 프로젝트 템플릿이야. 아직 구현하지 말고, 내가 만들려는 제품의 프로젝트 ID·이름·신규 또는 기존 시스템 여부를 확인한 뒤 빈 제품 정본을 준비해줘. 기존 소스는 이동하거나 덮어쓰지 마.

이미 진행 중인 프로젝트에서는 다음처럼 요청한다.

> 현재 프로젝트의 작업자, 진척, 통합 위험, 막힌 게이트와 다음 결정을 짧게 브리핑해줘. 근거 없는 완료 추정은 하지 마.

> 사용자에게 어떤 문제가 있는지 먼저 인터뷰해줘. 목적·성과·범위·가정·미결사항을 구분하고, 중요한 선택은 대안과 추천 이유를 보여준 뒤 내 결정을 받아 기록해줘. 아직 구현하지 마.

> 제품 의도와 성과 기준을 정한 뒤 `BEN-TRIAGE`를 수행해줘. 벤치마킹이 필요한지와 이유를 먼저 제안하고, 필요하면 조사 질문·비교 대상·평가 기준·출처 품질·제외 범위를 나와 합의한 다음에만 조사해줘. 조사 결과는 우리 환경과의 차이·한계·출처를 포함해 비교하고, 추천과 대안을 보여준 뒤 내 수용·보류·제외 결정을 ADR·REQ·OI에 기록해줘.

> 이 기능 변경을 분석해줘. 관련 요구사항·변경·작업·실행 표면·문서·위험·게이트를 확인하고, 구현 전에 필요한 결정과 검증 계획을 제안해줘.

> 승인된 계획대로 작은 증분으로 구현해줘. 변경한 정본·코드·문서·테스트와 증거를 연결하고, 필수 게이트가 남아 있으면 완료나 출시 준비 완료로 표시하지 마.

다른 Kit 또는 프로젝트의 개선 설명서를 받았다면 다음처럼 요청한다.

> 이 개선 설명서를 이 프로젝트 관점에서 검토해줘. 원본 코드를 자동 병합하거나 덮어쓰지 말고, 환경 차이·영향·위험을 분석한 뒤 별도 변경으로 구현할 계획을 제안해줘.

AI가 명령어 실행을 제안할 수 있지만, 명령어는 재현·자동화용 보조 수단이다. 사람은 제품 의도·우선순위·위험 수용과 되돌리기 어려운 결정을 승인한다.

## 역할별 책임

- 고객 또는 제품 책임자는 의도, 우선순위, 위험 수용과 되돌리기 어려운 결정을 승인한다.
- PM은 팀 프로필의 작업 패키지와 책임 범위를 조율한다.
- 구성원은 배정된 작업의 요구·설계·구현·시험·문서·운영 영향을 함께 책임진다.
- AI는 근거를 조사하고 선택지를 비교하며 구현·검증을 돕지만 승인과 실제 증거를 꾸며내지 않는다.
- 1인 프로젝트의 독립 검토는 별도 AI 세션 또는 다른 AI의 교차 검토로 수행한다.

## 일상 수행

작업 전에는 관련 `REQ`, `CHG`, `WRK`, 위험과 게이트를 확인한다. 기능 규모 구현은 `development-check`를 통과한 뒤 시작한다. 코드나 정본 변경 뒤에는 영향받은 범위의 `document-impact`, `generate`, `validate`와 관련 테스트만 수행한다. 생성기는 정본의 구조화 필드, 가이드 명령·절차와 합의한 문서 필수 항목을 보존하고 근거 없는 항목은 미작성으로 표시한다. `validate`는 현재 생성 결과와 다른 내용과 더 이상 대상이 아닌 생성물을 거부한다. 생성 문서는 직접 편집하지 않는다.

AIDD 요건·스펙 구현 검증을 요청받으면 `aidd-requirement-verification` 스킬을 사용한다. 명세 밖 보안·권한 검사는 사용자가 별도로 요청하지 않는 한 추가하지 않는다.

## 함께 쓰는 용어

`.ai/manifests/terminology.json`은 AIDD 진행 대화에 쓰는 공통 용어 정본이다. 프로젝트는 이 목록을 수정하거나 같은 용어·key·별칭을 다른 뜻으로 재정의하지 않는다. 업무 시스템에만 필요한 말은 `project/.aidd/ssot/terminology.json`의 `TRM`으로 분리한다.

새 업무 용어나 의미 변경이 필요하면 누구나 `term-propose`로 정의·영문 key·독자·공개 범위와 연결 대상을 요청한다. 이어 `term-impact`로 영향 후보를 기록하고, PM(1인 프로젝트는 소유자) 또는 명시된 위임자가 `term-decide`로 `TAP` 승인·반려·보류를 남긴다. 승인된 영향을 실제 정본·코드·문서에 반영한 뒤 `term-close`로 결과를 닫고 생성한다. 승인 전 제안을 확정 용어로 사용하지 않는다.

사람이 읽는 통합 사전은 `project/docs/generated/glossary.md`다. 공통 AIDD 용어와 승인된 프로젝트 용어를 한 곳에 보여 주지만 정본은 아니므로 직접 고치지 않는다. 용어 정본이 승인 절차에 맞게 바뀌면 훅이 Markdown과 오프라인 HTML을 현행화하며, 훅을 사용하지 않는 환경에서는 `generate`로 같은 결과를 만든다. 설계·운영 사이트는 전체 용어를, 사용자 사이트와 end-user DLP 용어집은 고객 공개 용어의 명칭과 정의만 보여 준다.

```powershell
node .ai/tools/aidd.mjs term-propose --id TRM-001 --term "고객 요청" --key customerRequest --category 업무 --definition "고객이 처리를 요청한 업무 단위" --requested-by HUM-002 --audience project_team --audience end_user --visibility customer
node .ai/tools/aidd.mjs term-impact --id TIR-001 --term TRM-001 --change-type add --performed-by HUM-001 --recommendation "승인 후 요구사항·API·화면에 사용" --scope 요구사항 --scope API --scope 화면
node .ai/tools/aidd.mjs term-decide --id TAP-001 --term TRM-001 --impact-review TIR-001 --decision approved --decided-by HUM-001 --rationale "업무 단위를 하나로 통일함"
git add project/.aidd/ssot/terminology.json; git commit -S -m "Record pending TAP-001"
node .ai/tools/aidd.mjs set-terminology-approval-policy --mode delegated --delegate HUM-002 --reason "PM 부재 중 용어 승인 위임"
node .ai/tools/aidd.mjs term-close --impact-review TIR-001 --closed-by HUM-001 --result "요구사항·API·화면에 승인 용어 반영 완료" --evidence EVD-001
git add project/.aidd/ssot/terminology.json; git commit -S -m "Record pending TIR-001 closure"
node .ai/tools/aidd.mjs delivery-glossary --profile DLP-002 --directory build/deliverables/DLP-002/glossary
```

`delivery-glossary`는 기존 출력 폴더를 덮어쓰지 않으며, `DLP`가 요구한 `glossary.audience`에 따라 `internal` 전체 뷰 또는 `end_user` 공개 뷰의 **용어집만** 담은 Markdown·오프라인 HTML·assets·manifest를 조립한다. 사용자 포털에는 정본 source metadata나 다른 문서를 표시하지 않는다. end-user 뷰에는 고객 공개이면서 `end_user` 독자인 용어만 포함된다.

## 프로젝트별 확장

프로젝트는 `AGENTS.md`, `.ai/skills/`, 훅·도구·템플릿을 자체 요구에 맞게 추가하거나 수정할 수 있다. 변경은 프로젝트 정본의 요구·변경·결정·위험·증거와 연결한다. 원본 Kit과 계속 동일할 필요는 없다.

새 훅은 `.ai/tools/` 아래의 `.mjs`로 만들고 `contract.json`의 `node_runtime`을 따른다. `node .ai/tools/aidd_hook.mjs self-test`는 Node 22 이상, 표준 라이브러리 전용 계약, provider의 Node 정본 배선과 비-Node 실행 경로 부재를 검사한다. 실제 provider 명령에 비 ASCII JSON을 전달하는 회귀 테스트도 함께 둔다.

다른 Kit 또는 프로젝트의 개선을 도입할 때는 코드를 자동 병합하지 않는다. 문제·의도·환경·가정·구현 접근·검증·위험이 적힌 변경 설명서를 검토하고 이 프로젝트의 별도 변경으로 구현한다. 긴급 보안 권고도 자동 적용하지 않고 영향도와 완화책을 우선 평가한다.

## 완료와 출시

연결된 검증 증거 없는 요구사항은 완료가 아니다. 필수 게이트, 미결 위험, 문서·운영 지침, 병합 후 재검토와 출시 조건을 확인하고 `release-check` 결과가 준비된 경우에만 출시 준비 완료를 선언한다.
