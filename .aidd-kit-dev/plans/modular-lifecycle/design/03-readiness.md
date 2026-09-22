# 03 — 상태·검토·게이트 계약

요구 연결: 001~007, 011~016, 021. 결정 제안: KIT-ADR-007.

## 1. 저장 상태와 계산 상태

- 정의 lifecycle은 draft/in_review/active/retired다. active를 승인 완료로 해석하지 않는다.
- WRK/CHG의 실행은 planned/in_progress/blocked/completed/cancelled, TC 실행은 EVD로 not_run/passed/failed 등을 구별한다. 단순 문자열로 완료를 선언할 수 없다.
- 조회 결과의 검토 유효성은 current/stale/missing/unknown/rejected, 준비 판정은 ready/blocked/unknown/not_applicable이다. `not_applicable`은 사유와 적용 정책이 있어야 한다.
- phase는 작업을 읽기 쉽게 설명하는 집계다. 요구분석 CHG와 운영 중 REL을 함께 표시한다. 과거 완료 사실은 보존하고 현재 준비 판정이 달라졌음을 따로 표시한다.
- 상태 변경 명령은 필요한 증거·현재 입력을 검증한다. 파일을 직접 바꿔 completed를 적어도 validate와 게이트가 부족한 근거를 검출한다. 악의적 기록 조작을 인증으로 방지하는 시스템은 아니다.

## 2. 일관된 판정 결과

일반 CLI의 공통 evaluator가 다음 결과를 만들고 status·게이트·생성기가 이를 소비한다.

```json
{
  "scope": {"kind": "work", "id": "WRK-001"},
  "input_digest": "...",
  "readiness": "blocked",
  "validity": "stale",
  "blockers": [{"code": "prototype_review_stale", "subject": "SCR-001", "reason": "관련 데이터 규칙 변경", "path": ["DAT-001", "FEAT-001", "SCR-001"]}],
  "unknowns": [],
  "next_actions": [],
  "coverage": {"scope_complete": true, "project_complete": false}
}
```

같은 입력·동일 평가 시각이면 같은 결과가 나와야 한다. 만료 EXC 등 시간 의존 검사는 `evaluated_at`을 명시 입력으로 고정한다. 조회로 정본의 승인·완료 상태를 덮어쓰지 않는다.

## 3. 요구 검토부터 설계 진입까지

1. **범위 확정:** CHG의 포함/제외/보류 요구와 governing 계약을 사용자에게 제시하고 scope RVW로 대상 개정을 고정한다. 최초에는 초안 작성이 가능하며 승인되지 않은 범위로 설계를 확정하지 않는다.
2. **개별 상세화:** REQ/NFR의 적용 필드·AC·출처·가치·예외·데이터/접점·미결을 검사한다. 실제 필요 규칙은 C0/C1이라도 생략하지 않는다.
3. **목록 포괄성:** 분석 수준 FEAT/SCR/DAT/NAV/IFC/SURF 후보와 근거를 연결한다. 모든 화면의 상세 설계나 TC 구현을 요구하지 않는다.
4. **의미 검토:** individual/related_rules/end_to_end RVW가 범위·개정본·관점·발견·해결/불확실성을 갖는지 확인한다. AI가 수행한 후보 발견과 사용자 업무 결정을 구분한다.
5. **사용자 수용:** 포함된 각 요구의 현재 정의에 대한 accepted 결과와 적용 입력을 확인한다. 묶음 중 일부 보완은 전체 승인으로 확대하지 않는다.
6. **기준선 고정:** 위 대상을 requirements BSL로 고정하고 사용자 검토 대상과 대응시킨다. 먼저 만든 검토 BSL에 승인하거나, 이미 검토한 동일 개정의 집합을 BSL에 고정할 수 있다. 다른 개정본을 끼워 넣지 못한다.
7. **설계 진입:** 현재 CHG 전체 요구의 위 조건과 관련 OI/DRQ/IMP 및 공통 계약이 유효해야 ready다. C의 독립 초안·미결은 차단하지 않는다.

요구 기반선에 고정한 **분석 목록 투영**은 항목 ID·업무 목적·원인 요구·적용 범위·주요 행동/정보다. 그 후 FEAT의 내부 처리 순서나 SCR 레이아웃을 상세화하는 것만으로 분석 승인을 무효화하지 않는다. 타입별 analysis projection을 manifest에 명시하고 그 투영 해시를 BSL에 둔다. 새로운 업무 규칙·데이터 수집·권한·기능 범위 변화는 이 투영 또는 연결 요구를 바꾸므로 요구 영향 검토 대상이다. 전체 정의 해시와 투영 해시를 혼용하지 않는다.

## 4. 설계·개발 진입

### FEAT/SCR 설계 준비

- FEAT의 적용 입력/출력·규칙·예외·데이터·인터페이스·AC 대응을 상세화하고 design RVW를 기록한다. SCR은 상태·필드·행동·검증·접근성·관련 FEAT를 구체화한다.
- 목업 생성 결과는 SCR 정의 + 사용한 FEAT/DAT/UXB/UIP/CMP + 렌더러/자산 버전 + 시나리오의 입력 digest를 가진다. 출력 해시·검토한 상태/뷰포트·사용자 결과를 prototype RVW와 snapshot에 연결한다.
- 제목만 있는 placeholder는 필요한 fields/actions/states/scenarios 포괄성 검사에서 실패한다. 자동 포괄성 검사와 사람이 실제 이해 가능한 화면인지 확인하는 검토는 별개다.
- 비UI는 UI 적용성이 not_applicable이며 해당 IFC/배치/이벤트 계약을 검사한다. 목업 파일 생성은 요구하지 않는다.

### WRK 개발 준비

`requirements_ready(CHG) AND applicable_foundations_current AND feature_designs_current AND applicable_screen_designs_and_prototypes_current AND acceptance_test_plans_ready AND required_predecessor_outputs_ready`.

- 작업의 기능·화면 목록은 관련 requirements/FEAT/SCR 관계와 CHG scope에서 교차 확인한다. 개발을 허용받으려고 필요한 화면/테스트를 목록에서 빼면 coverage 오류다.
- WRK A가 준비되면 B 설계가 미완료여도 A를 진행한다. 다만 CHG 전체 요구 기준선은 공유 선행 조건이다.
- DPN.required_output은 contract / implementation / integration이다. contract 의존은 유효한 합의 계약이면 충분하다. implementation은 실제 산출/해당 증거, integration은 조합/환경별 실행 증거가 필요하다.
- WRK의 `work_kind`는 product_feature / foundation / investigation / documentation / refactor 등 적용성을 구별한다. foundation은 해당 STD/GPH/기반 계약으로 개발하고 자기 구현 완료 증거를 착수 전 요구하지 않는다. TG-002는 기능 규모 개발 전에 기반 결과를 요구한다. investigation은 미승인 제품 기능 완료나 출시로 승격하지 않는다.
- 테스트는 개발 전 TC의 절차·입력·기대/금지 결과·검증 방식이 필요하다. TC의 passed/EVD 실제 실행은 구현 후 완료/릴리스 조건이다.

## 5. 게이트 선택과 현재 실행

- 기존 DG-001/TG-001/TG-002를 유지하고 요구 준비 `RG-001`과 작업 설계 준비 `FG-001`을 gate policy로 추가한다. 새 게이트도 GTR/GCR/EVD 모델을 사용한다.
- CHG/WRK와 적용 정책으로 필수 게이트를 도출한다. 필수 게이트를 CLI 옵션에서 생략하는 방식은 허용하지 않는다. 프로젝트 정책은 기본 필수 요구 검토를 암묵적으로 낮출 수 없다.
- GTR scope_ref는 CHG 또는 WRK 또는 REL, 입력은 target/required inputs/policy/evaluator contract digest다. 실행 이력은 attempt 순서·supersedes로 최신 유효 결과를 찾는다. 시계가 다른 실행의 timestamp만으로 승자를 정하지 않는다.
- 같은 평가 key의 후속 failed/blocked 실행이 있으면 과거 passed를 선택하지 않는다. 다시 통과하려면 해당 최신 입력에 대한 새 실행이 있어야 한다. 대상 입력이 다르면 이전 결과는 historical이며 현재 ready를 만들지 않는다.
- 위 필요 조건은 read-only evaluator로도 계산한다. 영구 GTR 기록은 명시적인 `gate-run` 쓰기로 남긴다. 기존 development-check/release-check는 읽기 전용이다.
- 승인된 동등성 RVW로 재사용할 때는 이전/현재 해시, 적용된 의존 범위, 동등성 이유·주체를 남긴다. 업무 규칙 변경을 '오탈자' 분류만으로 면제하지 않는다. 게이트 정책/검사기 의미 버전 변경 역시 필요한 재평가를 유발한다.

## 6. 완료와 릴리스

- completed WRK는 연결된 현재 AC에 대한 실제 EVD와 필요한 GTR, 문서/운영 영향 처리 결과를 요구한다. 빈 모듈이나 작업 상태 변경만으로 완료를 인정하지 않는다.
- REL은 포함 CHG/WRK 및 배포 조합/기준선/환경을 명시한다. 실제 통합이 필요한 의존은 stub 통과와 별도로 검증한다.
- OI/DRQ/RSK/EXC/MRC/IMP 차단은 대상과 관련 dependency closure 및 project-wide 적용 범위에 한정한다. owner가 project라는 이유만으로 전역 차단하지 않고 `applies_to`를 확인한다. `applies_to=project`만 전역이다.
- 관련 미결의 범위를 알 수 없으면 unknown으로 보고하고 적용성을 분류할 때까지 해당 판단을 유보한다. 무관하다고 증명한 항목까지 차단하지 않는다.
- EXC는 허용된 정책의 기준만 제한된 대상·만료·사유·보완 통제로 대체한다. mandatory 사용자 요구 수용 자체를 blanket waiver할 수 없다.
- release-check 성공은 배포 실행이 아니다. MOD 운영 기준선은 실제 전달/배포 결과가 확인된 REL로만 바꾸며 개발 중 재검토가 기존 운영 사실을 삭제하지 않는다.
