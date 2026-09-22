# 08 — 설계 검증 맵과 S04 실행 경계

## 1. 요구 → 설계 → 실제 시험 계획

각 행은 요구 `KIT-REQ-018-NNN`과 ACC-NNN의 세 AC를 모두 대상으로 한다. 실행 상태는 아직 not_run이며, S03의 문서 검사는 이를 대신하지 않는다.

| 요구 | 설계 문서 | 구현 단계 | 실제 확인할 시험 |
|---|---|---|---|
| 001 | 01, 03 | S05 | A 운영/B 추가·동일 모듈 활성 변경·빈 모듈 완료 거부 |
| 002 | 01, 03 | S05 | 전체 요구 중 미검토·무관/관련 모듈·범위 삭제 우회 |
| 003 | 01, 03 | S05 | 미완성 저장·업무별 적용성·미정/NA·관찰 가능한 NFR |
| 004 | 03, 04 | S05 | 범위/개정 없는 review 거부·취소/환불 누락의 AI 의미 검토·선택적 재검토 |
| 005 | 01, 04 | S05~06 | 분석 후보와 FEAT/SCR/DAT/NAV/IFC 추적·orphan·공통 단일 소유 |
| 006 | 01~03 | S05 | 부분 응답·오래된 질문 개정·OI/DRQ 동시 보존·새 문맥 재개 |
| 007 | 01~04 | S05~06 | 정의/실행 해시 분리·영향 변경·읽기 불변·파일 이동·의미적 오탈자 |
| 008 | 01~02 | S04 | owner별 파일·중복 ID·분할/move selector 보존 |
| 009 | 02, 04 | S04 | read 계측·인덱스 누락/동일 stat 변조·범위/전역 오류 격리 |
| 010 | 02 | S04 | 두 writer conflict·중간 crash·인덱스 실패·재시도/복구 시 후속 수정 보존 |
| 011 | 01, 03 | S06 | FEAT ID 재사용·다대다 UI/비UI·새 업무 규칙 요구 복귀 |
| 012 | 03, 06 | S06 | 목업 렌더/조작·입력/표현 변경·미검토/제목만 있는 결과 거부 |
| 013 | 03, 05 | S06 | W1 ready/W2 blocked·선행 output 유형·개발 전 테스트 계획과 실행 분리 |
| 014 | 04 | S06 | typed transitive path·순환/미해결·부분 재개·운영 기록 보존 |
| 015 | 03~04 | S05~06 | 최신 failed/old passed·필수 게이트 누락·범위 OI/DRQ·예외 경계 |
| 016 | 02~03, 06 | S07 | 동일 입력 상태/문서 일치·next action·조회 불변·대화 없는 재개 |
| 017 | 06 | S07 | 전체 파일/내용 재생성·scope output 보존·DLP·목업/실화면·오프라인 |
| 018 | 05~06, assets | S04~08 | 전체 인벤토리·reference drift·스킬 원본/복사본·훅 격리·실제 provider 수행 |
| 019 | 05, 07 | S09 | 임시 new-project 전체 흐름·모듈 추가·directory/zip payload/금지 경계 |
| 020 | 07 | S09 | v1 공식 입력 변환·ID/원문·unknown 필드·실패/중복·채택 안 하면 불변 |
| 021 | 01, 03~04 | S05~06 | 공통 BSL 재사용·stub와 실통합·공급 계약 폐기·영향 소비자만 재판정 |

E2E-001은 S06 최소 UI/비UI 연결 흐름으로 시작하고 S07 문서·S09 new-project와 명시적 전환·S10 최종 인수로 확장한다. 미완성 단계를 현재 통과 증거에 포함하지 않는다.

## 2. 파일별 시험 책임

- 기존 harness.test.mjs: 13개 훅·이벤트/입출력·경로 보호·provider 격리, 신규 index/snapshot 경계와 일반 writer/generator 허용/거부.
- 기존 Kit kit.test.mjs/release-version.test.mjs: 역할·허용 목록·관리 메타·버전 준비 경계 보존. 실제 릴리스 실행은 하지 않는다.
- 기존 history/decision-continuity/terminology 테스트: 의미와 실패 사례는 유지하고 v2 저장/조회 fixture로 전환한다.
- 기존 aidd.test.mjs: SCR 용어/문서 경로와 reference fixture의 **전체** 생성 결과 비교 유지.
- 새 관리 테스트 후보: record-store.test.mjs(S04), lifecycle-readiness.test.mjs(S05), design-impact.test.mjs(S06), scoped-documents.test.mjs(S07), migration.test.mjs(S09). 파일을 추가하는 이유는 기존 짧은 테스트에 서로 다른 상태/실패 경계를 모두 압축하지 않기 위해서다. 새 별도 evidence 시스템은 없다.
- 실제 의미 검토·화면 이해 가능성·provider 행동은 사람이 확인할 평가와 실제 수행 결과를 구별한다. 자동 fixture 통과만으로 이를 완료 처리하지 않는다.

## 3. 설계상 위험과 적용성

| 위험/관점 | 설계 처리 | 남은 실제 검증 |
|---|---|---|
| 리뷰 후 authoring 상태 변경이 자기 승인을 무효화 | 편집 lifecycle과 의미적 retired를 구분해 hash 계약 명시 | 해시 golden vectors S04 |
| 분석 목록 상세화만으로 요구 기준선이 계속 stale | analysis projection과 full definition을 명시 분리 | 새 업무 규칙 vs 정상 상세화 S05~06 |
| 같은 파일 두 활성 변경 | ID는 하나, CHG 기준선 pinning·expected hash·overlap | 실제 쓰기 경합 S04, 주기 판정 S05 |
| 전역 영향 정확성과 최소 본문 읽기의 긴장 | 일반 scope와 전역 incoming coverage를 구분, unknown 명시 | 읽기 계측·깨진 B·누락 shard S04~06 |
| 게이트 기록을 조회가 변경하거나 old passed 선택 | 순수 evaluator·명시 gate-run·attempt/supersedes | 부정 게이트 S05~06 |
| 부분 저장·Windows rename·잠금 잔재 | 저널/read-set/복구·후속 변경 감지 | 로컬 실제 filesystem 실패 주입 S04 |
| 역변환으로 신형 정보 유실 | 자동 downgrade 미지원·별도 원본/신형 기록 보존 | 전환 rollback 경계 S09 |
| 공통 코드가 훅 격리를 깨뜨림 | CLI lib만 공유, 등록 명령/위치 유지 | self-test와 개별 훅 변경 비교 S04/S08 |

실행 환경은 현재 저장소의 Node.js 22+ 표준 라이브러리·로컬 파일/Git이며 서버·DBMS·분산 인스턴스를 새로 선택하지 않는다. 네트워크 FS·전원 장애 완전 원자성은 지원 보증에 포함하지 않는다. 데이터 관점은 정본/원문/인덱스 일관성과 복구, 운영 관점은 실패·재실행·범위 보존으로 적용한다. 제품 보안·개인정보·DBA·인프라 기술 설계는 이번 Kit 관리 범위에 없는 업무 조건을 새로 만들지 않는다. 경로 이탈/덮어쓰기 방지는 요청된 파일 관리의 기본 실패 방지이지 별도 신원/권한 감사가 아니다.

## 4. S03 자체 확인

- 요구 21개→설계→인수 시나리오 연결, 기존 36개 명령의 처리, 기존 전체 자산 inventory 분류와 신규 계획 경로를 대조한다.
- 문서의 hash/projection·scope·독립/공통 계약·과거/현재·도구/훅 경계 간 충돌을 자체 검토한다. 사용자 수용이나 독립 감리라고 부르지 않는다.
- 설계 검증용 작은 실행 모델에서 최신 게이트, 관계 전파/순환, 정의/실행 hash 구분의 불변 조건을 확인한다. 이는 제품 구현/파일 복구 시험이 아니다.
- 현재 Kit quick check와 관련 관리 경계 테스트, JSON·링크·인코딩·diff를 확인한다. portable 코드/fixture/export 변경이 없으면 smoke/sync는 수행하지 않는다.

설계 실험은 [model-check.mjs](model-check.mjs)를 `node .aidd-kit-dev/plans/modular-lifecycle/design/model-check.mjs`로 실행한다. 2026-09-22 로컬 실행에서 정의/실행 해시, 분석/상세 투영, 최신 실패, 전이/순환 탐색, 범위 미결, 임시 파일 교체와 역사적 원문 보존의 6건이 통과했다. 제품 구현을 호출하지 않는 제한된 모델이다. 실제 다중 writer와 crash 복구는 S04 시험을 해야 한다.

## 5. S04 착수 승인 범위

사용자 승인 후 다음 증분만 구현한다.

1. v2 공통 외피·타입/ID/소유 계약과 read/hash API, 분할 저장의 대표 fixture.
2. 계층 index 생성·ID 조회·scope read·진단/본문 read 계측.
3. expected-hash 저장·짧은 잠금·operation 저널·복구/재시도와 실패 주입 시험.
4. 기존 aidd.mjs 명령의 저장/조회 adapter 연결 및 v2 bootstrap/validate의 최소 동작. 초기 생성/스킬·훅·가이드가 깨지지 않게 같은 증분에서 필요한 부분만 맞춘다.
5. 관련 quick check·행위 시험·hook self-test·smoke. 정본·파일 보호/허용 계약을 함께 검증한다.

S05의 요구 사용자 승인 흐름·S06의 실제 목업/개발·S07의 완성 문서·S09의 전환 도구까지 한꺼번에 구현하지 않는다. S04 완료에는 새 준비도 기능이 미구현인 경우 unknown/not_implemented를 명확히 보고하는 경계가 포함된다. 완료 후 체크포인트와 검증 결과를 기록하고 S05 승인을 요청한다.
