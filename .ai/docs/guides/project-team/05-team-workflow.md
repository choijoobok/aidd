# Git 변경, 인계와 병합 흐름

AIDD는 팀원 명부, PM 위임, 작업 배정과 일정을 관리하지 않는다. 팀은 별도 운영 방식으로 누가 무엇을 언제 수행할지 정한다. AIDD의 `WRK`는 담당자 배정표가 아니라 요구사항·변경·수행 범위·완료 조건·증거를 묶는 실행 패키지다.

## 작업 시작

1. `status`와 `integration-status`로 현재 정본과 Git 상태를 확인한다.
2. 관련 `REQ`, `ADR`, `CHG`, `WRK`, `SURF`와 테스트를 읽는다.
3. `workload-coverage --change CHG-###`로 요구사항과 필수 수행 영역이 빠짐없이 연결됐는지 확인한다.
4. 팀이 정한 브랜치·리뷰 방식으로 작업한다. AIDD가 사람이나 브랜치를 역할에 따라 차단하지 않는다.

```powershell
node .ai/tools/aidd.mjs status --level executive
node .ai/tools/aidd.mjs integration-status
node .ai/tools/aidd.mjs workload-coverage --change CHG-001
```

## 수행과 인계

요구·설계·구현·테스트·문서를 같은 작은 증분에서 갱신한다. 인계 시에는 현재 상태, 남은 위험, 재현 명령과 관련 안정 ID를 전달한다. 제품 동작이나 설계 선택을 바꾼 중요한 판단은 `record-history`로 남긴다. 단순 활동 일지나 개인별 작업 시간표는 AIDD 정본에 저장하지 않는다.

## 병합 후 재검토

병합 레코드의 영향 모듈과 추가 테스트를 평가하고 필요한 `MRC`를 추가한다. 완료할 때 `--performed-by`에 실제 수행 주체를 자유문자로 기록한다. 이는 참여자 계정 검증이 아니다.

```powershell
node .ai/tools/aidd.mjs complete-merge-recheck --merge MRG-001 --recheck MRC-001 --performed-by "통합 검토 회의" --result "영향 없음" --evidence EVD-001
```

## 완료 기준

- 관련 정본·소스·테스트·문서가 같은 변경에서 갱신됐다.
- 의미 있는 결정의 주체·이유·영향이 HIS·ADR·CHG·TCH 중 적절한 기록에 남았다.
- `generate`, `validate`와 영향 테스트가 통과했다.
- 병합 영향과 추가 재검토가 닫혔다.
