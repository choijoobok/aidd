# 06 — 브리핑·파생물·모든 스킬과 훅

요구 연결: 012, 016~019. 전체 파일별 처리 분류는 [assets.json](assets.json), 범위·처리 이유는 [assets.md](assets.md)에서 확인한다.

## 1. 상태와 세션 재개

- 프로젝트 요약: 모듈별 운영 기준선·활성 CHG·요구/설계/구현/검증 현황·현재 미결과 전역 큐 개수. 하나의 project.phase로 덮지 않는다.
- 모듈/CHG/WRK 상세: 대상 ID·개정, 적용 공통 입력, current/stale/missing/unknown, 정확한 차단 ID·이유·다음 가능 작업. 완료율은 명시한 모집단/규칙이 있을 때만 제공한다.
- 승인·상태 질문 재개는 scope 우선 조회와 전체 결정 큐 요약을 조합한다. 전체 본문을 기본으로 읽지 않는다. 미응답 묶음 선택은 관련 차단→명시 우선순위→오래된 순이며 독립 요청이 기존 묶음을 지우지 않는다.
- 훅 SessionStart는 역할 안내만 유지한다. 매 시작에 전체 프로젝트 검사를 실행하거나 훅이 DRQ/승인을 자동 변경하지 않는다. 자세한 브리핑은 status 스킬과 일반 조회 명령이 담당한다.

## 2. 문서·목업·제출 생성

- source of truth는 v2 정본, generator input은 고정 read snapshot + 공통 evaluator 결과다. 생성 중 입력이 바뀌면 결과를 현재 문서로 확정하지 않고 재시도/중단한다.
- 모듈 index는 요약/목차이며 상세 FEAT/SCR/DAT/IFC/WRK/TC/MAN은 항목별 Markdown을 생성한다. 기존 `modules/MOD-ID.md` 링크는 한 이행 기간의 짧은 이동 안내로 남길 수 있지만 전체 상세를 재복제하지 않는다.
- 요구·아키텍처·용어·결정·테스트·릴리스 문서는 프로젝트 목차와 모듈/공통 상세로 연결한다. 단일 파일에 모든 내용을 다시 모으는 것을 기본값으로 하지 않는다.
- UI 목업 경로 `ui/modules/MOD-ID/SCR-ID/mockup.html`과 specification.md는 유지한다. SCR 상태/동작 시나리오를 렌더하고 핵심 정상/오류 상호작용을 제공한다. 입력은 기술 중립 JSON이며 제품 프런트엔드 구현을 강제하지 않는다.
- 생성 시각은 입력 manifest의 as_of 또는 명시 build 시각으로 고정한다. 실행마다 바뀌는 현재 시간을 문서 본문에 넣어 재현 비교를 깨뜨리지 않는다.
- MAN은 실제 사용자 절차, RUN은 운영 절차를 생성한다. 설계 목업과 릴리스 실제 화면 EVD를 명시적으로 구별한다. 사용자 공개물의 내부 ID·관리 이력·용어 노출 제한은 유지한다.
- 온라인 서비스는 추가하지 않는다. 현재 오프라인 사이트 기능을 유지하되 프로젝트/모듈 landing과 범위별 사이트를 생성한다. DLP가 원하는 경우 범위가 고정된 단일 HTML 묶음을 별도 제출 출력으로 만들 수 있다. 대형 전체 HTML을 항상 기본 출력으로 강제하지 않는다.
- scope별 출력 manifest는 source digest, renderer/assets version, outputs[{path,hash,owner}], audience와 기준선을 갖는다. shared asset은 별도 project 소유 manifest가 관리한다. A 재생성은 A 소유 과거 출력만 정리한다.
- 출력 파일이 사용자에 의해 수정되어 기존 manifest hash와 다르면 덮어쓰기/삭제를 중단하고 차이를 보고한다. manifest에 없는 파일을 glob으로 삭제하지 않는다.
- 전체 재생성 검사는 임시 경로에서 기대 파일 집합·전체 내용·링크를 비교한다. 선택적 생성 성공을 전체 문서 최신이라고 보고하지 않는다.

## 3. 스킬 전수 영향 판단

새 스킬을 추가하지 않는다. 기존 17개 portable + 1개 관리 스킬의 역할이 충분하며 파일별 반영과 테스트는 해당 구현 단계에서 진행한다. 표의 references도 같은 패키지의 검토 대상이다. agents/openai.yaml의 표시명은 현재 의미가 유지되어 기본 보존한다.

| 스킬 | 변경할 절차·참조 내용 | 단계 |
|---|---|---|
| aidd-lifecycle | 역할 먼저 분기, project-init 무조건 실행 제거, CHG 주기/BSL/RVW·범위별 진입. gates 및 kickoff-and-change의 신원 검사·C2 일괄 독립 검토 서술 정합화 | S04~06, S08 |
| aidd-discovery | 적용 필드·개별/관계/전체 흐름·사용자 검토·범위 확정·분석 목록. interview-playbook의 위험만으로 종료하는 표현을 필수 내용 완료와 구별. benchmarking의 합의된 조사 원칙 유지 | S05, S08 |
| aidd-architecture | 요구 기준선 이후 FEAT/DAT/IFC 상세, 공통 기준선 재사용·관련 DG/TG 재평가. design-checks/development-foundation의 적용성·순환 선행 방지 | S05~06 |
| aidd-decision-management | 전역 물리 파일 경로 제거, 논리 큐와 scope, RVW/BSL 개정별 응답, transaction 저장 후 질문/종료 | S04~05 |
| aidd-delivery | --work 개발 진입, 선행 output 종류, FEAT/SCR/목업·TC 계획. slice-runbook-guides의 무조건 전체 회귀 표현을 관련 검증으로 정합화 | S06 |
| aidd-assurance | current vs historical 판정, 양방향 수작업 링크 대신 역조회, 필요한 범위의 실제 검증/독립성. review-matrix/consistency-and-merge 함께 수정 | S05~06, S08 |
| aidd-document-consistency | typed 영향·review snapshot·문서 policy ID 조회, 자동 구조와 의미 판단 분리. 검토만 요청했을 때 쓰지 않는 원칙 유지 | S06~07 |
| aidd-integration | Git 동작 보존, MRG/MRC 범위와 현재 입력 재검증. 단순 병합이라는 이유로 무조건 전역 판정·새 승인 발명 금지 | S06, S08 |
| aidd-legacy-reconciliation | SURF/LDP/기존 문서 출처의 소유 파일 전환, 기능/데이터 후보 매핑. reconciliation-contract도 현행화 | S04, S09 |
| aidd-status | 전역 validate부터 시작하는 흐름을 scope-first로, 운영/변경 공존·같은 evaluator. briefing-views의 협업 신원 서술 제거, pending-work의 현재 유효성 보강 | S05, S07 |
| aidd-terminology | 단일 terminology.json 대신 TRM/TCH ID 조회·owner 선택·결정 트랜잭션, 용어집 독자 경계 보존 | S04, S07 |
| aidd-ui-spec | FEAT/DAT/NAV 및 SCR 상태·개정·목업 review 연결, UI 전체가 아니라 대상 범위 문서 생성 | S06~07 |
| aidd-ui-prototype | 의미 있는 HTML, 렌더/자산 입력 고정, 사용자 검토 대상과 stale 판정, 실제 화면과 구별 | S06 |
| aidd-user-guide | 모듈/릴리스 baseline MAN/SCR 조회, 실제 EVD 유효성, 항목별 문서와 오프라인 site | S07 |
| aidd-deliverable-build | fixed BSL/DLP·출력 manifest, 생성 Markdown 직접 수정 안내를 정본 수정으로 교정, 미검증 구분 | S07 |
| aidd-requirement-verification | v2 경로·요구-설계-검증 맵, scope와 전역 검증 결과 구분, 전체 생성물 비교 원칙 유지 | S04~09 |
| aidd-harness-management | 인덱스/스냅샷 보호·변경후 안내의 독립 훅, 일반 CLI와 런타임 격리 재확인 | S04, S08 |
| aidd-kit-release | v2/new-project·전환 입력/관리 경계 시험과 단계 상태, 실제 릴리스 별도 승인 유지 | S09 |

위 발견사항은 현재 파일에서 확인한 영향이다. 이번 S03에서는 스킬을 아직 수정하지 않는다. 순차 구현 중 관련 정본/스킬을 함께 갱신하고 sync-providers·check·변경 경계 smoke를 실행한다. 필요 없는 새 skill이나 플러그인을 만들지 않는다.

## 4. 훅 13개와 어댑터

| 기존 훅 | 판단 | 이유와 실행 계약 |
|---|---|---|
| codex/claude-session-brief (2) | 유지 | 역할만 안내. 프로젝트 전체 읽기·승인 저장 추가 안 함 |
| codex-hook-review-reminder (1) | 유지 | Codex 전용 비차단 안내. Claude에 연결하지 않음 |
| codex/claude-log-user, log-assistant (4) | 유지 | 대화 로그는 제품 정본 구조와 독립. 큐·잠금·원문/추론 제외·파일 회전 보존 |
| codex/claude-protect-file, protect-shell (4) | 수정 | index/snapshots 생성 영역 보호와 새 공식 writer/generator 명령 안내. 각 파일의 정책은 독립 복제 |
| codex/claude-post-check (2) | 수정 | owner별 TRM/TCH 경로 직접 변경을 감지해 terminology-refresh/검사 안내. 공식 transaction 중간에는 재귀 실행하지 않고 완료 뒤 후처리 |

- 기존 등록부 event/group/handler 위치와 명령·timeout을 유지한다. 새로운 훅은 필요 없다. 한 훅을 수정할 때 다른 12개 실행 파일·명령·등록 위치·승인 hash가 그대로인지 비교한다.
- 보호 영역의 policy.json/contract.json/README는 설계 계약이지만 런타임에서 공통 policy loader를 import하지 않는다. 일치성은 일반 self-test로 검사한다.
- 새 명령 allowlist도 생성물 쓰기의 일반 승인 우회가 아니다. 입력의 실제 명령/대상을 확인하며 셸 문자열에 명령명을 포함했다는 이유만으로 광범위한 직접 쓰기를 허용하지 않도록 기존 테스트와 정상/거부 사례를 점검한다. 별도 보안 감사나 신원 통제는 추가하지 않는다.
- PostToolUse는 사용자 응답을 해석해 승인·정본 상태를 바꾸지 않는다. 실패는 warning, 정책 거부는 거부, 런타임 오류는 오류로 구별한다. 다른 훅을 fallback으로 호출하지 않는다.
- 등록부 변경 없이 독립 실행 파일의 경로 패턴만 바꾸는 것을 기본으로 한다. 실제 provider의 승인 격리를 검증할 수 없거나 다른 훅 승인까지 바뀌면 작업을 중단하고 사용자에게 한계를 보고한다.
- provider 복사본은 원본 sync 결과다. 일치 테스트와 실제 Codex/Claude 수행 시험은 다른 검증이며 미실행한 실제 행동은 not_run으로 남긴다.
