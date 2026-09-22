# 04 — 관계·영향·선택적 복귀

요구 연결: 004~009, 012~015, 021. 결정 제안: KIT-ADR-007.

## 1. 관계는 의미별로 한 곳에서 소유한다

| 관계 | 소유 정방향 | 변경 시 기본 탐색 |
|---|---|---|
| satisfies | FEAT → REQ/NFR의 AC | 요구에서 기능 소비자로 역방향 |
| presents | SCR → FEAT | 기능에서 화면 소비자로 역방향 |
| uses_data | REQ/FEAT/SCR/IFC → DAT의 선택 속성 | 선택된 속성/계약에서 소비자로 역방향 |
| consumes | 소비 FEAT/IFC → 공급 IFC/공통 계약 | 공급 계약에서 소비자로 역방향 |
| uses_foundation | FEAT/SCR/WRK → STD/UXB/UIP/CMP/GPH | 기준선에서 실제 소비자로 역방향 |
| implements | WRK → FEAT/SCR/IFC/STD | 명세에서 작업으로 역방향 |
| verifies | TC → 요구 AC/기능/화면/계약 | 검증 대상에서 TC와 EVD로 역방향 |
| documents | MAN/RUN/문서 계약 → 기능/화면/운영 대상 | 대상에서 해당 문서로 역방향 |
| depends_on | DPN → consumer/provider/required_output | typed 계약 또는 실제 산출 의존 방향에 따라 |
| part_of | 부분 레코드 → 소유 부모 | 부분 변화의 부모 집계 + 부모 정책의 부분 적용 |
| context | 문맥 관련 ID | 탐색 표시만. 자동 재검토 전파는 하지 않음 |

대상에서 원인 요구를 찾는 등의 역조회는 인덱스로 계산한다. `REQ.tests`와 `TC.requirements` 같은 동일 사실의 수작업 양방향 배열은 제거한다. CHG.scope/REL.contents는 그 집합 자체의 소유 정의이며 단순 역링크가 아니다. 관계 metadata에는 selector(전체 또는 안정 key), usage, required_output, pinned_baseline를 허용한다.

## 2. 분석 알고리즘

1. before 스냅샷과 현재 after의 정의/분석 투영/실행 입력 차이를 계산한다. 빠진 before나 알려지지 않은 extension은 불확실성으로 남긴다.
2. source ID와 바뀐 selector를 출발점으로 관계 registry의 규칙에 따라 BFS한다. `(ID, selector, impact-kind)` visited 집합으로 순환을 끝내고 경로는 제한된 대표 경로 + 총 경로 수로 요약한다.
3. 직접 후보, 전이 후보, 적용되지 않은 관계와 이유를 분리한다. 단순 module 소속이나 문자열 등장만으로 모든 연결 항목을 확정 영향으로 처리하지 않는다.
4. IMP.definition에 change_ref, before/after 해시, graph/input digest, scope_coverage, candidate[{target,paths,reason,proposed_return_to,classification,rationale}]를 기록한다. classification은 pending/affected/unaffected이다.
5. 의미 판단이 필요한 후보는 AI가 근거를 제시하고 사용자 결정이 필요한 업무 선택은 OI/DRQ로 연결한다. 사람이 이미 결정한 계약의 기계적 전파는 정해진 규칙으로 처리할 수 있다. pending을 unaffected로 자동 치환하지 않는다.
6. 확정 영향은 `impact-apply`로 CHG/WRK 재작업 및 필요한 OI/DRQ/TC 계획과 연결한다. gate의 현재 유효성은 조회 시 이미 stale일 수 있다. IMP 적용 전에 과거 승인을 유효한 것으로 쓰지 않는다.

## 3. 필요한 앞 단계만 다시 연다

| 발견 내용 | 돌아갈 지점 | 유지할 것 |
|---|---|---|
| 요구/범위·업무 규칙 변경 | CHG 요구·scope/consistency/user RVW와 관련 분석 목록 | 이전 BSL/RVW와 실제 배포/완료 사실 |
| 요구는 동일하지만 기능 처리 계약 변경 | FEAT 설계·관련 SCR/TC/WRK | 유효한 요구 기준선·무관한 기능 |
| 화면 표현·공통 UI 변경 | 사용한 SCR·목업 검토·관련 테스트 | 영향 없는 비UI·미사용 UI 요소 |
| 코드 결함, 의도·설계 불변 | 해당 구현·회귀 검증 | 그대로 유효한 요구/설계 검토 |
| 문서 표현·파일 이동만 동등 | 이유가 있는 equivalence RVW 또는 비의미 경로 이동 확인 | ID·연결·적용 가능한 기존 승인 |

정의가 변한 현재 항목을 수정하고 새 RVW/BSL/GTR을 추가한다. 운영 기준선을 과거로 덮어쓰거나 모든 항목을 draft로 초기화하지 않는다. 이전 결과를 복원해 다시 채택하더라도 새 결정/변경으로 연결하고 이력을 지우지 않는다.

## 4. 공통 계약과 pinning

- 소비자는 검토한 계약 definition_hash/BSL을 식별한다. 공급의 최신 작업 초안이 생겼다고 이미 운영 중인 소비 기준선의 역사적 검증이 실패로 바뀌지 않는다.
- 변경 CHG가 새 공급 계약을 채택하면 관련 소비 정의/테스트를 재평가한다. 운영상 더는 옛 계약을 제공할 수 없는 변화는 실제 배포 조합/호환성 문제로 별도 OI와 운영 변경에 연결한다.
- 이미 폐기되어 더는 공급하지 않는 계약을 pinning했다는 이유만으로 새 릴리스를 통과시키지 않는다. REL의 공급 계약 제공 가능 여부·환경·실제 통합 결과를 확인한다.
- 같은 모듈의 복수 CHG가 같은 current 정의를 수정하면 expected hash 충돌 또는 overlap 진단을 낸다. 프로젝트가 순서를 정한 뒤 다음 CHG를 새 기준으로 rebase한다. 자동 Git merge는 하지 않는다.

## 5. 누락과 불확실성

incoming 관계 인덱스의 coverage가 불완전하면 영향 분석도 incomplete다. 대상 없는 참조, 잘못된 selector, 누락된 데이터 속성, 순환 작업 선행 조건을 진단한다. 관계 그래프 순환 자체가 항상 금지는 아니지만 실제 선행 산출 요구가 순환하면 개발 순서를 만들 수 없으므로 차단한다. 관계를 삭제해 불확실성을 숨긴 변경도 before/after와 coverage 검사에 포함한다.

각 IMP의 판정은 해당 before/after/graph에만 적용된다. 이후 변경이 있으면 pending 후보를 다시 계산하고 무관한 확정 판정은 근거가 동일할 때 재사용한다. 코드·자유문자에서 발견한 ID 사용은 후보 증거로만 추가하고 정본 관계나 업무 영향 확정으로 가장하지 않는다.
