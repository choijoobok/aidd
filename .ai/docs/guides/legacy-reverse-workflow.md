# 레거시 자료에서 정본 초안 시작하기

원래 소스·문서를 옮기거나 실행할 필요가 없다. 기존 시스템은 그대로 두고 별도의 owned-records-v2 작업 공간에서 자료 위치와 분석 범위를 지정한다. 새 v2 공간 준비는 [모듈형 작업 안내](owned-records-workflow.md)를 따른다. 이전 AIDD 버전 변환과 업무 데이터 이관은 이 기능이 아니다.

## 수집 → 관측 → 미리보기 → 저장

아래 명령은 JSON을 표준 출력으로 반환한다. 응답 전체 또는 `data`를 다음 입력 파일로 보존한다. 사용자는 업무 판단에 집중하고 AI가 구조화 관측과 JSON 작성을 돕는다.

```text
node .ai/tools/aidd.mjs legacy-inventory --input scope.json
node .ai/tools/aidd.mjs legacy-draft --input analysis.json --inventory inventory.json
node .ai/tools/aidd.mjs legacy-apply --input plan.json --operation legacy-first
```

scope.json 예시(경로는 실제 사용자 지정 위치로 바꾼다):

```json
{
  "roots": [
    {"key":"app","path":"D:/legacy/application","kind":"source"},
    {"key":"manual","path":"D:/legacy/documents","kind":"document","revision":"기준일 미확인"}
  ],
  "exclude": ["vendor","build"]
}
```

첫 명령은 파일 해시/행수와 제외·미지원·읽기 실패를 기록한다. UTF-8 텍스트로 수집돼도 업무 분석 완료라는 뜻은 아니다. 링크는 따라가지 않고 PDF/Office·바이너리·이미지는 미지원으로 표시한다. 원본 스크립트 실행·설치·서비스 기동·외부 전송은 수행하지 않는다.

AI가 실제 텍스트를 읽고 [입력 계약](../../spec/reverse-engineering.md)에 맞춰 관측과 후보를 작성한다. 예를 들어 아래 분석은 새 모듈/SYS의 **미정 뼈대**를 생성할 수 있다. 의미 있는 자동 채움은 `observations`에 실제 출처와 값을 넣고 `fields`에서 참조해야 한다. 설명·표제만 작성했다고 검토 완료가 되지 않는다.

```json
{
  "namespace":"legacy-shop", "batch":"orders-first", "title":"주문 업무 초안",
  "observations":[],
  "candidates":[
    {"key":"orders","type":"MOD","title":"주문 모듈 후보","fields":{}},
    {"key":"overview","type":"SYS","owner":"project","title":"시스템 개요 후보","fields":{}},
    {"key":"order-entry","type":"UC","owner":{"$ref":"orders"},"title":"주문 접수 후보","fields":{}}
  ]
}
```

관측은 파일 해시와 행 범위를 갖는다. 예: `{key:"entry",kind:"ui_route",status:"observed",summary:"주문 경로 등록",method:"라우트 선언 직접 확인",anchors:[{root:"app",path:"routes.js",sha256:"인벤토리의 실제 해시",start_line:10,end_line:12}],value:"/orders"}`. 대응 후보의 `fields.entry:["entry"]`처럼 필드에 연결한다. 인증 정책의 공개/필수/혼합 여부를 자료 부재만으로 추측해 확정하지 않는다.

미리보기의 `ids`, `expected.creates/unchanged`, `issues`, `counts`, `coverage`를 확인한 뒤 승인 범위에만 적용한다. 원본/출처가 바뀌면 새 인벤토리와 관측이 필요하다. 기존 정본이 다르면 전체 저장을 중단한다. 재실행해도 기존 ID를 재사용하며 임의로 새 ID를 만들어 충돌을 우회하지 않는다.

## 저장 후 검토

자료 목록은 DOC, 관측은 SURF, 필드별 대응은 DOC, 배치 요약은 LDP로 나뉜다. 업무 정본은 공통/모듈별 한 항목 한 파일로 저장하고 기존 인덱스로 찾는다. 각 후보의 OI는 검토 필요를 나타내며 실제 사용자 질문/답변은 기존 DRQ/RVW로 관리한다.

SYS/CAP → 역할과 접속 정책 → UC/프로세스 → 요구/인수 기준 → 설계 순서로 보완한다. `record-read`로 근거와 해시를 확인하고 `record-put --change`로 해당 초안을 수정한다. 기존 시스템을 그대로 수용할지 개선할지는 별도 사용자 판단이다. 사용자 수정 후 초기 legacy-apply를 다시 적용하지 않고 아래의 검토/재분석 명령을 사용한다.

```text
node .ai/tools/aidd.mjs generate --change CHG-ID
node .ai/tools/aidd.mjs validate --change CHG-ID
node .ai/tools/aidd.mjs discovery-check --change CHG-ID
node .ai/tools/aidd.mjs requirement-check --change CHG-ID
```

CHG-ID는 미리보기의 `change` 값이다. 초안 상태에서 마지막 두 명령이 blocked인 것은 정상이다. 파일/관측 건수, 미정·충돌·미검토 건수, 실제 테스트를 각각 보고한다. 수집률이나 문서 생성 성공을 프로젝트 완료로 표시하지 않는다. 모듈 도입은 아래의 준비·채택 절차를 따른다.

중간 저장 실패는 `transaction-status`와 명시적 `transaction-recover --operation ID --action resume|rollback`으로 확인한다. 이미 committed인 같은 operation 재시도는 과거 결과를 반환할 뿐 현재 자료를 재검증하지 않는다. 새 검사를 원하면 새 미리보기/operation을 사용한다.

## 순차 질문과 부분 답변

```text
node .ai/tools/aidd.mjs legacy-review --change CHG-ID --limit 3
node .ai/tools/aidd.mjs legacy-review-request --input questions.json --operation ask-01
node .ai/tools/aidd.mjs legacy-review-answer --input answers.json --operation answer-01
```

questions.json은 `{packet: 첫 명령의 data.packet, asked_at: 실제 제시 시각}`이다. 도구로 DRQ를 저장한 뒤 AI가 질문을 실제로 보여준다. answers.json은 `{answers:[{request:"DRQ-ID",result:"accepted",note:"확인한 업무 판단 요약"}],reviewer:"사용자",occurred_at:"ISO 시각",decision_source:{kind:"user",reference:"실제 답변 위치/결정 식별자"}}`다. 문장상의 설명 예이며 실제 JSON 파일은 AI가 값에 맞게 작성한다.

한두 항목만 답하면 그 항목만 기록한다. deferred/changes_requested/rejected도 가능하다. 제시 후 정의가 바뀐 답변은 과거 이력으로만 남고, accepted라도 상세 누락이 있으면 다음 단계로 넘어가지 않는다. 보완 후 새 질문으로 검토하며 CHG 범위·요구 일관성·목업·기준선·실행 검증은 기존 게이트를 계속 따른다.

## 자료 변경을 다시 분석할 때

```text
node .ai/tools/aidd.mjs legacy-source-check --change CHG-ID
node .ai/tools/aidd.mjs legacy-reanalyze --input analysis-new.json --inventory inventory-new.json --previous legacy-first
node .ai/tools/aidd.mjs legacy-reconcile --input choices.json --operation reconcile-01
```

변경된 자료를 재수집하고 실제 내용을 읽어 analysis-new.json을 보완한다. namespace/batch/key는 동일성을 유지한다. 최초 previous는 초안을 실제 저장한 operation, 다음부터는 마지막 reconcile operation이다. choices.json은 `{plan: 재분석 응답 data, decisions:{"항목ID":{choice:"merged",reason:"사용자 제목은 유지하고 새 규칙을 반영"}},reviewer,occurred_at,decision_source}`다. 사용자에게 차이를 설명한 뒤 실제 선택을 기록한다.

current는 현재 보존, proposed는 새 정의 채택, merged는 충돌 없는 필드 변경 결합이다. 충돌은 자동 결합하지 않으며 missing/unobserved는 current만 허용한다. 실행·운영 이력은 그대로이고 새 IMP/OI를 따라 필요한 대상만 검토/재개한다. [상세 입력/복구 계약](../../spec/legacy-review-reanalysis.md)을 함께 읽는다.

staged 검사는 저장소 안의 선언 루트와 Git index 차이를 확인한다. 다른 저장소나 Git 없는 외부 루트는 staged 목록으로 확인할 수 없으므로 legacy-source-check 결과와 그 검사 범위를 별도로 보고한다.

## 준비된 모듈부터 문서 관리 채택

각 모듈은 독립 CHG를 사용하고 공통 정의만 참조한다. 여러 모듈을 한 CHG에 묶었다면 일부만 채택하지 않고 먼저 범위를 나눈다. [도입 계약](../../spec/legacy-adoption.md)에 따라 모듈 소유 DOC(kind=legacy_validation_plan)를 작성한다. 예시 definition의 실제 ID/환경/사유는 프로젝트에 맞게 채운다.

```json
{
  "kind":"legacy_validation_plan", "change":"CHG-ORDERS", "module":"MOD-ORDERS",
  "environment":"사용자와 합의한 검증 환경", "coverage_notes":"조사 범위와 제외/미지원 처리 판단",
  "tests":["TC-CANCEL"],
  "scenarios":{"normal":{"tests":["TC-CANCEL"]},"exception":{"tests":["TC-CANCEL"]},"data_boundary":{"tests":["TC-CANCEL"]}},
  "differences":[{"subject":"REQ-CANCEL","disposition":"retain","reason":"현행 업무 유지"},{"subject":"FEAT-CANCEL","disposition":"fix","reason":"중복 처리 개선","work":"WRK-FIX"}],
  "existing_ui":[]
}
```

TC는 요구/AC의 verifies 관계를, DOC는 TC·후속 WRK·기존 화면의 depends_on 관계를 갖는다. 계획·기존 화면 재사용 판단을 사용자와 현재 개정으로 검토한다. 모듈의 일반 요구 게이트, 사용자 검토와 미결 영향을 마친 뒤 확인한다.

```text
node .ai/tools/aidd.mjs legacy-adoption-check --change CHG-ORDERS --module MOD-ORDERS
node .ai/tools/aidd.mjs legacy-adopt --input adoption.json --operation adopt-orders-01
```

adoption.json은 `{change,module,document_digest: 방금 확인한 값,reviewer,occurred_at,decision_source:{kind:"user",reference:"실제 채택 판단"}}`다. 문서 관리 채택만 기록하며 실제 테스트가 not_run이어도 이를 숨기지 않는다. 테스트 실행은 별도 허용된 환경/명령으로 수행한 뒤 결과 EVD에 test_bindings를 연결한다. 실패와 과거 입력의 통과는 현재 passed가 아니다. 도구가 제품 소스를 실행하거나 운영 데이터를 옮기지는 않는다.

기존 화면 확인을 과거 목업 승인으로 만들지 않는다. 후속 변경은 같은 ID를 새 CHG/WRK에서 참조하고 정상 요구 검토·기능/화면/목업·개발/테스트를 수행한다. 신규 UI 변경은 문서 채택 이력으로 설계 게이트를 우회할 수 없다. 브리핑/파생 문서는 같은 판정 모델을 쓰지만 현재 파일 재검사는 legacy-adoption-check 결과와 구분한다.
