<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 협업 거버넌스

## 정책

### CBG-001 — 활성 인원 기반 협업 프로필 전환

- **id:** CBG-001
- **title:** 활성 인원 기반 협업 프로필 전환
- **rule:** 프로젝트 책임자를 포함한 활성 사람 참여자가 1명이면 1인 프로필, 2명 이상이면 팀 프로필을 적용한다. 인원 변경은 이력을 남기고 저장소 규칙과 검토 책임을 함께 재생성한다.
- **current_profile:** CBP-SOLO

## 신원 정책

### IDP-001 — Git·호스팅 신원과 사람 참여자 대조

- **id:** IDP-001
- **title:** Git·호스팅 신원과 사람 참여자 대조
- **automatic_membership:** false
- **git_scope:** 모든 도달 가능한 커밋의 작성자와 커미터
- **unknown_identity_action:** 미등록 Git 신원과 참여자 이탈 시점 뒤의 새 커밋은 경고하고 C2·C3 개발 진입과 모든 릴리스를 차단한다. 실제 사람, 기존 참여자의 별칭 또는 봇인지 확인하기 전에는 참여자로 자동 등록하지 않는다.
- **hosting_actor_action:** PR 작성자·승인자·실제 push 행위자는 Git 이력만으로 알 수 없으므로 호스팅 제공자 API 또는 감사 로그 증거로 별도 대조한다.

## 작업 배정 정책

### 항목

- **mode:** pm_controlled
- **delegates:** -
- **offline_coordination_required:** false
- **changed_at:** 2026-09-18T17:49:46+09:00
- **changed_by:** HUM-001
- **reason:** 1인 기준선에서는 제한이 없으며, 팀 전환 시 PM이 배정을 통제하는 기본 모드를 유지한다.

## 프로필

### CBP-SOLO — 1인 프로젝트

- **id:** CBP-SOLO
- **name:** 1인 프로젝트
- **mode:** solo
- **min_active_humans:** 1
- **max_active_humans:** 1
- **human_review:** 선택 사항
- **independent_assurance:** C2·C3 변경은 별도 AI 검토 세션 또는 Codex·Claude 교차 검토 증거가 필요하다.
- **branch_policy:**

```json
{
  "default_branch_direct_commit": "C0 변경은 허용한다. C1~C3은 작업 브랜치를 권장하지만 로컬에서 차단하지 않는다.",
  "require_non_default_branch_for": []
}
```
- **repository_controls:**

```json
{
  "require_pull_request": true,
  "required_approving_review_count": 0,
  "dismiss_stale_reviews_on_push": false,
  "require_last_push_approval": false,
  "required_review_thread_resolution": true,
  "block_deletion": true,
  "block_force_push": true
}
```

### CBP-TEAM — 팀 프로젝트

- **id:** CBP-TEAM
- **name:** 팀 프로젝트
- **mode:** team
- **min_active_humans:** 2
- **max_active_humans:** -
- **human_review:** 최소 1명의 다른 사람 승인
- **independent_assurance:** C2·C3 변경은 작성자와 다른 검토 관점의 증거가 필요하고 필요하면 AI 교차 검토를 추가한다.
- **branch_policy:**

```json
{
  "default_branch_direct_commit": "새 변경은 기본 브랜치에 직접 커밋할 수 없다. 작업 브랜치와 PR 병합을 사용한다.",
  "require_non_default_branch_for": [
    "C0",
    "C1",
    "C2",
    "C3"
  ]
}
```
- **repository_controls:**

```json
{
  "require_pull_request": true,
  "required_approving_review_count": 1,
  "dismiss_stale_reviews_on_push": true,
  "require_last_push_approval": true,
  "required_review_thread_resolution": true,
  "block_deletion": true,
  "block_force_push": true
}
```

## 참여자

### HUM-001 — 프로젝트 책임자

- **id:** HUM-001
- **name:** 프로젝트 책임자
- **roles:** 고객, 소유자, PM, 개발자
- **status:** active
- **joined_at:** 2026-09-17
- **left_at:** -

## 신원 매핑

### IDM-001

- **id:** IDM-001
- **principal_type:** human
- **participant:** HUM-001
- **git_identities:**

```json
[
  {
    "name": "joobok",
    "email": "bbundoli@naver.com"
  },
  {
    "name": "joobok",
    "email": "joobok.choi@mobyus.com"
  }
]
```
- **hosting_accounts:** -
- **verified_at:** 2026-09-18T17:28:04+09:00
- **verified_by:** 프로젝트 책임자
- **reason:** 프로젝트 책임자가 현재 저장소에서 사용하는 Mobyus Git 이메일을 기존 HUM-001의 검증된 별칭으로 추가한다.

## 신원 이벤트

### IDE-001

- **id:** IDE-001
- **mapping:** IDM-001
- **action:** baseline
- **changed_at:** 2026-09-18T01:56:18+09:00
- **changed_by:** 프로젝트 책임자
- **reason:** 기존 Git 작성자·커미터 신원을 협업 정본에 기준선으로 등록한다.

### IDE-002

- **id:** IDE-002
- **mapping:** IDM-001
- **action:** alias_added
- **changed_at:** 2026-09-18T17:28:04+09:00
- **changed_by:** 프로젝트 책임자
- **reason:** 프로젝트 책임자가 현재 저장소에서 사용하는 Mobyus Git 이메일을 기존 HUM-001의 검증된 별칭으로 추가한다.

## 전이

### CBT-001

- **id:** CBT-001
- **from:** -
- **to:** CBP-SOLO
- **reason:** 프로젝트 책임자 1명으로 협업 기준선을 시작한다.
- **changed_at:** 2026-09-18T01:41:55+09:00
- **changed_by:** 프로젝트 책임자
- **participant:** HUM-001
- **participant_status:** active

## 배정 정책 이벤트

### APE-001

- **id:** APE-001
- **from_mode:** -
- **to_mode:** pm_controlled
- **delegates:** -
- **changed_at:** 2026-09-18T17:49:46+09:00
- **changed_by:** HUM-001
- **reason:** 1인 기준선에서는 제한이 없으며, 팀 전환 시 PM이 배정을 통제하는 기본 모드를 유지한다.

## 작업 배정 이벤트

### WAE-001

- **id:** WAE-001
- **work:** WRK-012
- **from_assignee:** -
- **to_assignee:** HUM-001
- **assigned_by:** HUM-001
- **assigned_at:** 2026-09-18T17:30:00+09:00
- **reason:** 현재 1인 프로젝트에서 진행 중인 AIDD Kit 기반 작업의 책임자를 기준선으로 기록한다.

### WAE-002

- **id:** WAE-002
- **work:** WRK-013
- **from_assignee:** -
- **to_assignee:** HUM-001
- **assigned_by:** HUM-001
- **assigned_at:** 2026-09-18T18:01:43+09:00
- **reason:** 승인된 CHG-012 정합성 보완을 현재 1인 프로젝트 책임자에게 배정한다.
