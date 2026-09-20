# 팀 작업 흐름

## 1인 프로젝트와 팀 프로젝트

1인 프로젝트도 참여자 `HUM`, Git 신원 `IDM`, 변경 `CHG`와 작업 `WRK`를 사용한다. 팀원이 합류하면 동일한 정본을 유지한 채 협업 프로필과 배정 정책을 조정한다. 별도 프로젝트로 다시 만들 필요가 없다.

## 참여자와 신원

bootstrap 직후에는 [프로젝트 준비와 시작](01-project-setup.md)의 절차로 최초 소유자와 신원을 등록한다. 새 팀원은 먼저 사람을 등록하고, 확인된 Git 또는 hosting 신원을 연결한다.

> 새 팀원이 합류했어. 이름과 역할, 실제 Git 신원을 나에게 확인한 뒤 참여자와 신원 매핑을 순서대로 기록해줘. 기존 사람의 별칭인지 새 사람인지 임의로 판단하지 마.

```powershell
node .ai/tools/aidd.mjs collaboration-member --id HUM-002 --name "팀원 이름" --role "개발자" --status active --reason "프로젝트 합류"
node .ai/tools/aidd.mjs collaboration-identity --id IDM-002 --type human --participant HUM-002 --git-name "Git 사용자 이름" --git-email "member@example.com" --reason "팀원 Git 신원 연결"
node .ai/tools/aidd.mjs identity-check
node .ai/tools/aidd.mjs collaboration-status
```

신원 매핑은 실제 사람을 확인한 뒤 수행한다. 이메일이나 별칭이 바뀌었다고 새 사람을 자동 생성하지 않는다. 봇은 `type bot`으로 구분하고 사람 참여자로 가장하지 않는다.

## 작업 만들기와 배정

각 `WRK`는 하나 이상의 요구 또는 변경과 연결하고, 설계·구현·테스트·문서·마이그레이션·운영 영향 중 필요한 범위를 포함한다. 배정 전에는 작업자의 활성 상태와 역할, 기존 작업량을 확인한다.

> CHG-001의 일을 팀이 검토할 수 있는 작업으로 나누고 누락된 영향 영역과 선행 의존성을 확인해줘. 현재 작업량을 보여준 뒤 담당자 배정안을 제안하고, 내 확인 전에는 배정하지 마.

```powershell
node .ai/tools/aidd.mjs assign-work --work WRK-001 --participant HUM-002 --reason "첫 수직 기능 구현"
node .ai/tools/aidd.mjs work-check --work WRK-001
node .ai/tools/aidd.mjs workload-coverage --change CHG-001
```

명령 옵션은 프로젝트에 포함된 현재 CLI 계약을 따른다. AI에게 작업 ID와 담당자, 이유를 말해 실행을 요청해도 된다. PM은 우선순위와 충돌을 조율하고, 구성원은 배정된 작업의 전체 영향에 책임진다.

## 브랜치와 커밋

작은 변경은 팀의 저장소 정책에 맞는 작업 브랜치에서 수행한다. AIDD는 서명 커밋이나 특정 원격 서비스 사용을 자체적으로 강제하지 않는다. 커밋 메시지는 변경 이유와 연결 ID가 드러나게 작성하고, 자동 커밋·푸시는 사용자가 요청한 범위에서만 수행한다.

작업 전에 다음을 확인한다.

> 이 작업에 맞는 브랜치 상태와 통합 위험을 확인해줘. 변경 이유와 연결 ID가 드러나는 커밋 메시지를 제안하되, 내가 요청하기 전에는 커밋하거나 푸시하지 마.

```powershell
node .ai/tools/aidd.mjs branch-check
node .ai/tools/aidd.mjs integration-status
```

루트 규칙, 원격 브랜치 보호 또는 CI가 별도 요구를 둔다면 실제 설정을 확인한다. 로컬 JSON에 목표 상태가 적혀 있다는 이유만으로 원격 적용이 완료됐다고 기록하지 않는다.

## 인계와 일일 기록

수행 이유, 변경 결과, 검증, 남은 위험과 다음 행동을 `work-log/`에 연결 ID와 함께 남긴다. 원시 Git 이름이나 이메일 대신 확인된 `HUM` ID를 사용한다.

```powershell
node .ai/tools/aidd.mjs record-work --summary "작업 요약" --why "변경 이유" --result "수행 결과" --next "다음 행동" --link CHG-001 --link WRK-001
```

인계받는 사람은 대화 원문보다 정본, 작업 기록, 현재 diff와 검증 결과를 우선한다. 미완료 항목을 완료로 바꾸지 않고 차단 이유와 필요한 결정을 명시한다.

## 병합과 병합 후 재검토

병합 전에 요구·코드·테스트·문서와 게이트 상태를 확인한다. 병합 후에는 양쪽 부모와 결과를 비교해 새 충돌, 사라진 변경, 달라진 계약과 필요한 회귀 범위를 평가한다.

> 병합 전후의 두 부모와 결과를 비교해 의미가 달라진 정본·코드·테스트·문서를 찾아줘. 실제로 필요한 재검토만 제안하고 담당자나 완료 결과를 미리 만들지 마.

- `MRG`는 병합 영향과 충돌 해결 근거를 기록한다.
- 필요한 재검토·재테스트만 담당자 미지정 `MRC`로 만든다.
- PM 또는 관리자가 실제 수행자를 조율한다.
- 완료할 때 수행자, 시각, 결과와 관련 증거를 기록한다.
- 필수 `MRC`가 남아 있으면 이전 완료 이력을 지우지 않고 현재 출시 준비만 차단한다.

```powershell
node .ai/tools/aidd.mjs integration-status
node .ai/tools/aidd.mjs status --level detail
```

## 상태 공유

경영진 뷰는 성과, 주요 진척, 차단, 위험과 결정 요청을 보여준다. 모듈 뷰는 해당 모듈의 요구·작업·표면·테스트를 상세히 본다.

> 경영진에게 공유할 수 있도록 성과, 주요 진척, 차단사항, 위험, 필요한 결정과 다음 작업을 정본에서 요약해줘. 세부 명령이나 내부 파일 목록보다 판단에 필요한 내용을 먼저 보여줘.

```powershell
node .ai/tools/aidd.mjs status --level executive
node .ai/tools/aidd.mjs status --level detail
node .ai/tools/aidd.mjs status --level module --module MOD-APP
```

상태는 대화 기억이나 파일 개수로 추정하지 않고 현재 정본과 실제 검증 결과에서 만든다.
