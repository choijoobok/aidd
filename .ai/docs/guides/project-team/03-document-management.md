# 문서 관리

## 문서의 네 가지 역할

| 역할 | 위치 | 수정 방법 |
|---|---|---|
| AIDD 행동 명세 | `.ai/spec/`, `AGENTS.md` | 프로젝트 변경 절차로 수정 |
| 제품 정본 | `project/.aidd/ssot/` | 승인된 사실·결정·상태를 구조화해 수정 |
| 파생 문서 | `project/docs/generated/` | 직접 수정하지 않고 정본에서 재생성 |
| 수행 기록 | `work-log/`, 로컬 `chat-history/` | 작업 결과 기록 또는 훅이 로컬 추가 |

`.ai/docs/methodology/`는 산출물 모델과 방법론을 설명하고, `.ai/templates/`는 상세 입력을 빠뜨리지 않게 돕는다. 둘 다 현재 제품 사실의 정본은 아니다.

## 정본을 갱신하는 원칙

- 합의된 사실만 확정 상태로 기록한다.
- 불확실한 내용은 가정이나 `OI`로 분리한다.
- 제목이 바뀌어도 안정 ID는 유지한다.
- 결정을 취소할 때 이전 기록을 삭제하지 않고 새 ADR의 대체 관계를 둔다.
- 코드와 정본이 다르면 어느 한쪽을 몰래 정답으로 만들지 않고 변경 또는 결함으로 기록한다.
- 생성 문서에서 내용을 복사해 정본을 역으로 덮어쓰지 않는다.

## 변경 시 문서 흐름

1. 관련 `REQ`, `CHG`, `WRK`, `ADR`, 위험과 문서 독자를 확인한다.
2. `document-impact`로 영향 후보를 확인한다.
3. 제품 정본과 필요한 상세 원천 문서를 수정한다.
4. `generate`로 모든 파생 문서를 다시 만든다.
5. `validate`로 현재 renderer 결과와 파일 전체를 비교한다.
6. 변경 영역의 테스트와 독자 관점 검토를 수행한다.

AI에게는 다음처럼 요청할 수 있다.

> 이 변경이 어떤 정본과 사용자·운영·설계 문서에 영향을 주는지 찾아줘. 생성 문서는 직접 고치지 말고 정본을 수정한 뒤 전체를 다시 생성·비교해줘. 근거가 없는 내용은 만들지 마.

> 현재 정본과 파생 문서가 일치하는지 확인해줘. 누락 파일, 내용 차이와 더 이상 생성 대상이 아닌 파일을 모두 구분해서 알려줘.

```powershell
node .ai/tools/aidd.mjs document-impact --path project/.aidd/ssot/requirements.json
node .ai/tools/aidd.mjs generate
node .ai/tools/aidd.mjs validate
```

`validate`는 누락 파일, 내용 차이와 더 이상 생성 대상이 아닌 파일도 오류로 본다. 파생 문서의 충실성 검토는 제목이나 일부 문구만 찾는 것이 아니라 현재 정본으로 다시 만든 전체 결과를 비교한다.

## 상세 문서와 템플릿

구조화 정본만으로 충분하지 않은 상세 분석은 `.ai/templates/`의 워크시트를 사용한다. 템플릿을 채운 문서는 연결 ID와 소유자, 상태를 가져야 하며 정본과 충돌하면 정본 변경 또는 문서 결함으로 처리한다.

- 요구·유즈케이스: 사용자 문제, 흐름, 예외와 인수 기준
- 아키텍처·ADR: 대안, 트레이드오프, 영향과 롤백
- 운영 런북: 선행 조건, 단계, 확인, 롤백과 에스컬레이션
- 테스트 결과: 실행 대상, 방법, 환경, 결과와 잔여 위험
- 사용자 가이드: 승인된 화면 요구와 검증된 실제 화면

문서를 하나 더 만드는 것이 목적이 아니다. 의사결정 또는 독자 전달에 필요한 정보가 구조화 정본만으로 표현되지 않을 때만 추가한다.

> 이 변경에 새 문서가 정말 필요한지 먼저 판단해줘. 기존 정본·생성 문서·템플릿으로 충분하면 새 파일을 만들지 말고, 필요하다면 독자와 목적, 필수 항목과 연결 ID를 제안해줘.

## 프로젝트 홈과 독자별 산출물

프로젝트 홈은 현재 목표, 주요 모듈, 상태, 미결 결정, 위험과 다음 행동을 빠르게 찾게 해야 한다. 상세 설계·운영·사용자 문서는 독자별로 분리할 수 있지만 같은 제품 정본에서 생성하거나 명시적으로 연결한다.

`DLP`는 제출 대상, 포함·제외, 목업 허용 여부와 용어집 공개 범위를 정의한다. build 결과나 ZIP은 제출용 조립물이지 정본이 아니다. 사용자 가이드의 출시본 화면은 대상 커밋·환경·화면 ID와 연결된 실제 검증 자료 또는 승인된 예외를 사용한다.

## 용어 관리

`.ai/manifests/terminology.json`은 공통 AIDD 용어 정본이며 프로젝트가 바꾸거나 같은 뜻을 재정의하지 않는다. 업무 용어는 `project/.aidd/ssot/terminology.json`에서 관리한다.

> 프로젝트에서 “고객 요청”이라는 용어를 새로 쓰고 싶어. 기존 공통·프로젝트 용어와 충돌하는지 확인하고, 제안·영향 검토·승인·반영 종료 순서로 진행해줘. 승인 전에는 확정 용어처럼 사용하지 마.

```powershell
node .ai/tools/aidd.mjs term-propose --id TRM-001 --term "고객 요청" --key customerRequest --category 업무 --definition "고객이 처리를 요청한 업무 단위" --requested-by HUM-001 --audience project_team --visibility customer
node .ai/tools/aidd.mjs term-impact --id TIR-001 --term TRM-001 --change-type add --performed-by HUM-001 --recommendation "승인 후 요구사항과 화면에 사용" --scope 요구사항 --scope 화면
node .ai/tools/aidd.mjs term-decide --id TAP-001 --term TRM-001 --impact-review TIR-001 --decision approved --decided-by HUM-001 --rationale "업무 단위를 하나로 통일"
node .ai/tools/aidd.mjs term-close --impact-review TIR-001 --closed-by HUM-001 --result "요구사항과 화면에 반영"
```

`TIR` 영향 검토와 `TAP` 승인 전 제안을 확정 용어처럼 사용하지 않는다. `project/docs/generated/glossary.md`와 HTML은 생성물이므로 직접 고치지 않는다.

## 작업 기록과 대화 원문

작업 기록에는 수행 이유, 결과, 다음 행동과 연결 ID를 남긴다. 사용자·AI 대화 원문은 제품 정본이나 증거가 아니다. 훅이 받은 원문만 Git 무시 루트 `chat-history/YYYY-MM/YYYY-MM-DD.md`에 UTF-8로 로컬 기록한다. `AIDD_LOCAL_CONVERSATION_LOG=0`이면 현재 프로세스의 기록을 끌 수 있다.
