<!-- .ai/tools/aidd.py가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 운영 런북

## RUN-001 — 정본 생성·검증 복구

- 상태: `최신`
- 범위: AIDD 정본과 생성 문서
- 모듈: MOD-DOC, MOD-QA, MOD-DELIVERY
- 요구사항: REQ-025, REQ-033
- 트리거: 생성 문서가 오래됨; 정본 참조 검증 실패; 생성 중단

### 절차

1. python .ai/tools/aidd.py generate를 실행한다.
2. python .ai/tools/aidd.py validate를 실행한다.
3. 검증 실패의 정본 ID와 원인을 수정하고 다시 생성한다.
4. 전체 unittest를 실행하고 결과를 EVD에 연결한다.

### 검증

- 생성 명령과 검증 명령이 모두 종료 코드 0이다.

### 롤백

정본과 생성기 변경을 함께 되돌린 뒤 다시 생성·검증한다.

### 에스컬레이션

반복 실패 또는 데이터 손실 위험은 프로젝트 책임자와 거버넌스 담당에게 알린다.
