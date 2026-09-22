# 정본, 생성 문서와 결정 이력 관리

## 문서 계층

| 구분 | 위치 | 관리 방식 |
|---|---|---|
| 현재 제품 정본 | `project/.aidd/ssot/` | 의미 있는 변경에서 직접 갱신 |
| 결정 이력 | `project/.aidd/ssot/common/HIS/ 또는 modules/<MOD>/HIS/` | `record-history`로 append-only 추가 |
| 제품 소스 | `project/src/` | 정본 ID와 영향 범위를 연결해 구현 |
| 생성 문서 | `project/docs/generated/` | `generate`로 재생성, 직접 수정 금지 |
| 대화 원문 | `chat-history/` | 로컬 참고만, Git·정본·증거에서 제외 |

현재 정본에는 현재 상태와 지금도 유효한 핵심 근거를 둔다. 시간이 지나 변경 이유가 필요할 만한 분석·설계·용어·소스·범위·상태 결정은 HIS에 별도로 기록한다. 정확한 줄 단위 변경은 Git이 담당한다.

## 결정 이력 기록

```powershell
node .ai/tools/aidd.mjs record-history --operation history-20260921-001 `
  --id HIS-20260921-001 `
  --occurred-at 2026-09-21T12:00:00.000Z `
  --type design `
  --subject REQ-001 --subject ADR-001 `
  --change CHG-001 `
  --decided-by "프로젝트팀 오프라인 협의" `
  --decision "선택한 방안" `
  --reason "선택 이유" `
  --previous "이전 상태 또는 대안" `
  --impact MOD-CORE `
  --source-ref "회의록 2026-09-21"
```

`decided-by`는 추적용 자유문자다. Git 신원이나 AIDD 역할과 대조하지 않는다. 과거 이력을 정정할 때 기존 파일을 수정하지 않고 새 HIS에 `--supersedes`를 지정한다.

다음은 기록한다: 제품 동작·범위 변경, 되돌리기 어려운 설계 선택, 용어 의미 변경, 운영·마이그레이션 방식 변경, 테스트 결과 해석이 후속 작업을 바꾸는 판단. 오탈자·서식·의미 없는 기계 변경은 기록하지 않는다.

## 용어 변경

먼저 읽기 전용 카드로 정의·범위·혼동·영향을 검토한다.

```powershell
node .ai/tools/aidd.mjs term-review --action add --id TRM-001 --term "고객 요청" --key customerRequest --concept-type business --category "고객지원/접수" --definition "고객이 처리를 요청한 업무 단위" --scope "접수부터 처리 종료까지 추적하는 요청"
```

프로젝트가 정한 방식으로 결정한 뒤 적용한다.

```powershell
node .ai/tools/aidd.mjs term-apply --operation term-add-001 --action add --id TRM-001 --history TCH-001 --term "고객 요청" --key customerRequest --concept-type business --category "고객지원/접수" --definition "고객이 처리를 요청한 업무 단위" --scope "접수부터 처리 종료까지 추적하는 요청" --decided-by "프로젝트팀 오프라인 협의" --summary "영향 검토 후 용어 추가" --source-ref "회의록 2026-09-21"
```

TCH에는 결정 주체·시각·전후 값·영향·요약·검증을 남긴다. 특정 PM 역할이나 계정은 필요하지 않다.

## 변경 후 확인

```powershell
node .ai/tools/aidd.mjs document-impact
node .ai/tools/aidd.mjs generate
node .ai/tools/aidd.mjs validate
```
