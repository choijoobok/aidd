# 스킬과 훅

## 스킬을 사용하는 방법

스킬은 특정 종류의 작업에서 AI가 따라야 할 절차다. 사용자가 스킬 이름을 외울 필요는 없다. 원하는 결과를 자연어로 요청하면 설명과 범위가 맞는 스킬을 선택한다. 정확히 지정하려면 “`aidd-discovery` 스킬로 요구를 정리해줘”처럼 말할 수 있다.

| 요청 | 주로 사용하는 스킬 |
|---|---|
| 문제·성과·범위와 중요한 선택 탐색 | `aidd-discovery` |
| 프로젝트 또는 큰 변경의 전체 흐름 조율 | `aidd-lifecycle` |
| 아키텍처·데이터·인프라 결정 | `aidd-architecture` |
| 새 용어 발견·유사 용어 구분·용어집 변경 | `aidd-terminology` |
| 구현·테스트·출시·운영 변경 | `aidd-delivery` |
| 기존 시스템 조사와 현행화 계획 | `aidd-legacy-reconciliation` |
| 화면 명세·사용자 절차 | `aidd-ui-spec` |
| 구현 결정 전 HTML 목업 | `aidd-ui-prototype` |
| 사용자 가이드와 실제 화면 검증 | `aidd-user-guide` |
| 제출 패키지 조립 | `aidd-deliverable-build` |
| 진행·위험·다음 작업 브리핑 | `aidd-status` |
| 문서·코드·정본 의미 일관성 검토 | `aidd-document-consistency` |
| 독립 QA·감리·보안 검토 | `aidd-assurance` |
| 훅·스킬·provider 어댑터 변경 | `aidd-harness-management` |
| AIDD 요건·스펙 구현 충실성 검증 | `aidd-requirement-verification` |

좁은 작업에는 해당 스킬 하나만 사용한다. 독립 감사, 보안 또는 권한 검토는 사용자가 요청하거나 제품 정본이 요구할 때만 `aidd-assurance` 범위로 추가한다.

자연어 요청 예시:

> 사용자 문제와 범위를 먼저 인터뷰해줘. 아직 구현하지 말고 중요한 가정과 선택지를 분리해줘.

> 현재 프로젝트 상태를 정본에서 브리핑해줘. 완료를 추정하지 말고 차단사항, 위험과 다음 작업을 보여줘.

> 설계 중 새 용어가 나왔어. 기존 용어와 비교하고, 프로젝트가 결정할 수 있는 읽기 전용 용어 확인 카드를 만들어줘. 아직 용어집은 바꾸지 마.

> 이 훅 변경이 정말 필요한지 기존 수단과 중복을 확인하고, 입력·출력·실패 동작과 안전한 비활성화 방법부터 제안해줘.

## 스킬 파일의 정본과 provider 복사본

공통 스킬의 정본은 `.ai/skills/`다. `.agents/skills/`와 `.claude/skills/`는 provider가 읽는 복사본이므로 직접 수정하지 않는다.

프로젝트가 스킬을 변경한 뒤에는 다음을 실행한다.

> 방금 바꾼 공통 스킬을 provider 복사본에 동기화하고, 훅 배선과 변경 영역 동작만 확인해줘.

```powershell
node .ai/tools/aidd.mjs sync-ai
node .ai/tools/aidd_hook.mjs self-test --hook
```

프로젝트는 원본 Kit과 독립적으로 스킬·훅·도구·템플릿을 확장할 수 있다. 변경 이유, 적용 요구, 검증과 롤백을 프로젝트 정본에 연결한다.

## 훅이 하는 일

공통 계약은 `.ai/hooks/contract.json`, 실행기는 `.ai/tools/aidd_hook.mjs`다. provider 설정은 `.codex/hooks.json`과 `.claude/settings.json`의 얇은 어댑터다.

훅의 책임은 다음으로 제한된다.

- 세션 시작에 작은 역할·프로젝트 상태 요약 제공
- 계약과 provider 이벤트 배선 self-test
- 생성 문서와 provider 스킬 복사본의 직접 수정 방지
- 프로젝트 용어 정본을 직접 변경한 경우 용어 문서 현행화 보조; 정상 오프라인 결정 흐름의 `term-apply`는 자체적으로 생성·검증까지 완료
- 훅이 제공받은 대화 원문의 선택 가능한 로컬 기록

훅은 AIDD 승인 게이트나 재시작 상태를 저장하지 않고, Git 서명, 외부 trust root, 일반 shell 명령 분류, 원격 권한 확인이나 광범위 테스트를 자동으로 강제하지 않는다.

Codex는 CLI와 Windows 앱 구분 없이 매 `SessionStart`에 CLI `/hooks`에서 현재 작업공간 훅을 검토하고 신뢰 처리했는지 확인하라는 `systemMessage`와 모델 문맥을 전달한다. 새 `startup`에서는 Windows 앱이 `systemMessage`를 대화에 표시하지 않아도 보이도록 첫 사용자 요청에 대한 최종 답변(`final_answer`) 첫 줄에 같은 안내를 표시한다. 접히는 진행 메시지(`commentary`)에 표시한 것은 충족으로 보지 않으며 commentary에 이미 표시했더라도 그 첫 final_answer에서 다시 표시한다. 이는 매 요청 규칙이 아니라 세션당 한 번만 적용하는 규칙이다. 이전 assistant의 final_answer에 안내가 있으면 이후 응답에서는 반복하지 않고, resume·clear·compact에서도 그 최종 답변 줄을 다시 요구하지 않는다. Claude에는 이 경고를 표시하지 않는다. 신규·변경된 훅의 실제 신뢰 판정과 실행 여부는 Codex 자체 기능이 담당하며 AIDD는 별도 승인 상태를 저장하거나 사용자의 답을 기다리거나 작업을 차단하지 않는다. 하위 폴더에서 세션을 시작해도 훅 실행기는 Git 루트를 우선하고, 아직 Git 저장소가 아닌 템플릿에서는 가장 가까운 상위 `.aidd-role.json`을 기준으로 찾는다.

## self-test의 정확한 범위

```powershell
node .ai/tools/aidd_hook.mjs self-test --hook
```

이 검사는 Node.js 최소 버전, 훅 런타임 파일, 계약의 필수 정책 루트와 이벤트 목록, provider 이벤트 토큰, 폐기된 패턴의 재도입 여부를 확인한다. `--hook`은 provider 훅 호출 형식으로 결과를 반환한다.

self-test 통과만으로 모든 `.mjs`가 표준 라이브러리만 사용하는지, 제품 기능이 맞는지, 보안·권한이 적절한지 증명하지 않는다. 그런 검토는 해당 요구와 변경 범위에 맞는 테스트로 따로 수행한다.

## 훅 실패를 다루는 방법

1. 정책 거부인지 런타임 오류인지 구분한다.
2. 오류가 가리키는 계약, provider 설정 또는 정본을 확인한다.
3. 정상 정책 거부를 우회하지 않는다.
4. 가장 작은 수정 뒤 self-test와 관련 행위 테스트만 다시 실행한다.

훅이 없거나 비활성화된 환경에서도 정상 용어 변경은 `term-review`와 `term-apply`를 사용한다. `term-review`는 결정용 확인 카드를 만드는 읽기 전용 명령이고, `term-apply`는 프로젝트가 오프라인으로 결정한 뒤 결정 주체와 이유를 기록한다. Git 신원이나 특정 역할은 요구하지 않는다.

요구분석·설계·구현 중 새롭거나 모호한 용어를 발견하고 확인 카드부터 적용까지 조율하는 책임은 `aidd-terminology` 스킬에 있다. `aidd-discovery`, `aidd-architecture`, `aidd-delivery`는 용어 판단이 필요할 때 이 스킬로 연결한다. 훅은 사용자 의도를 이해하거나 프로젝트의 의사결정을 대신하지 않으므로 이 자동화를 훅으로 구현하지 않는다.

## AIDD 구현 검증을 요청할 때

> 현재 변경이 AIDD 요건과 스펙대로 규칙·스킬·훅·도구에 구현되었는지 빠르게 검증해줘. 변경 영역의 대표 행위만 테스트하고, 명세 밖 보안·권한 검사는 하지 마. 파생 문서는 정본에서 다시 생성한 전체 결과와 비교해줘.

이 요청에는 `aidd-requirement-verification`이 적용된다. 결과는 통과, 실패, 검증하지 않음으로 구분하며 별도 evidence 파일이나 반복 독립 검토를 기본으로 만들지 않는다.
