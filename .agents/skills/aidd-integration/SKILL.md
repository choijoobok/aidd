---
name: aidd-integration
description: Git 브랜치 통합, 원격과의 차이, 병합 충돌, 병합 후 영향·재검토를 안전하게 관리한다. 원격 동기화, 병합, 충돌 해결, MRG 또는 MRC 관련 작업에 사용한다.
---

# AIDD 안전 통합

1. 먼저 `node .ai/tools/aidd.mjs integration-status`와 `git status --short`로 현재 작업 트리·추적 브랜치 차이를 확인한다. 이 명령은 네트워크나 Git 이력을 바꾸지 않는다.
2. 변경된 작업 트리에는 자동 `fetch`, `pull`, `merge`, `rebase`, `stash`, `reset`, `checkout`을 하지 않는다. 사용자가 무엇을 보존·통합할지 결정하게 한다.
3. 깨끗한 트리에서 뒤처진 경우에도 자동으로 가져오지 않는다. 사용자 승인을 받은 뒤에만 `git pull --ff-only`처럼 되돌리기 쉬운 통합을 수행한다.
4. 양쪽이 갈라진 경우에는 대상 브랜치, 변경 ID, 충돌 해결 책임과 롤백을 사용자와 확인한다. 의미 충돌은 원 작성자·업무 책임자의 확인 없이 추측해 해결하지 않는다.
5. 병합 커밋 뒤 `record-merge`, `assess-merge`로 영향 모듈·충돌 해소·추가 테스트 결정을 기록한다. 필요한 독립 검토·재테스트는 담당자를 미리 배정하지 않은 `MRC`로 남기며, 실제 수행자·시각·결과·증거만 완료 시점에 기록한다.
6. 정본 또는 공통 AI 정책이 병합되면 `generate`, `sync-ai`, `validate`, 관련 테스트를 다시 실행한다. 병합 이후에는 `aidd-document-consistency`로 의미적 모순도 독립 점검한다.
