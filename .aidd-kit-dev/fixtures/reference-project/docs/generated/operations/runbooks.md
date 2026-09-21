<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 운영 런북

## 런북

### RUN-001 — 정본 생성·검증 복구

- **id:** RUN-001
- **title:** 정본 생성·검증 복구
- **status:** current
- **scope:** AIDD 정본과 생성 문서
- **modules:** MOD-DOC, MOD-QA, MOD-DELIVERY
- **requirements:** REQ-025, REQ-033
- **triggers:** 생성 문서가 오래됨, 정본 참조 검증 실패, 생성 중단
- **prerequisites:** Node.js 22 이상, 저장소 루트에서 실행
- **steps:** node .ai/tools/aidd.mjs generate를 실행한다., node .ai/tools/aidd.mjs validate를 실행한다., 검증 실패의 정본 ID와 원인을 수정하고 다시 생성한다., 변경 영역의 관련 테스트를 실행하고, 제품 정본이 요구하는 경우에만 결과를 EVD에 연결한다.
- **verification:** 생성 명령과 검증 명령이 모두 종료 코드 0이다.
- **rollback:** 정본과 생성기 변경을 함께 되돌린 뒤 다시 생성·검증한다.
- **escalation:** 반복 실패 또는 데이터 손실 위험은 프로젝트 책임자와 거버넌스 담당에게 알린다.
- **tests:** TC-024
- **supersedes:** -
- **replaced_by:** -
