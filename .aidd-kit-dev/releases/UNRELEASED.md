# 미출시 변경

## KIT-CHG-004 · Node.js 단일 런타임 전환

상태: 배포물 AIDD 테스트 적합성 위반과 뒤이은 회귀 검사 무력화를 독립 재검토에서 확인·수정하고 새 독립 C3 재검토 PASS, 실제 macOS Codex·Claude provider 검증은 고객의 환경 부재로 연기(`in_review`, 출시 준비 미완료)

- portable CLI, Kit 관리 CLI, provider 훅과 테스트를 Node.js 22 이상 표준 라이브러리로 통일한다.
- 실행 가능한 `.py` 파일과 provider의 Python 명령을 제거한다.
- provider 훅 원본 바이트를 UTF-8로 직접 해석하고 대화 기록을 UTF-8로 추가한다.
- Codex Desktop의 `commandWindows`에서 `$repo`·`$LASTEXITCODE` 같은 중첩 변수를 제거한다.
- Windows 실제 명령과 비 ASCII 입력, directory·ZIP export 및 샘플 프로젝트를 Node 테스트로 검증한다.
- Kit `new-project`의 자식 Node 프로세스가 시작되지 않은 경우 `status === null`을 성공으로 오인하지 않고 원래 실행 오류를 즉시 보고하며, 성공·실패 모두 임시 staging을 정리한다.
- 기존 Python argparse와 같은 공개 명령·옵션 계약을 Node CLI에 선언해 필수 옵션 누락, 잘못된 choice, 알 수 없는 옵션과 허용되지 않은 위치 인자를 종료 코드 2로 거부한다.
- portable `sync-ai`·제품 `validate`·Kit-source `Stop` 검증도 자식 프로세스 시작 실패와 비정상 종료를 성공으로 오인하지 않고 실패 폐쇄형으로 처리한다.
- Git 기반 신원 감사·통합 상태·문서 영향·staged 문서 게이트는 Git 실행 실패를 빈 결과나 깨끗한 작업 트리로 오인하지 않고 명시적 오류로 중단한다.
- export provenance는 Git 상태를 읽지 못한 경우 작업 트리가 깨끗하다고 단정하지 않고 `source_commit: uncommitted`, `source_dirty: true`로 보수적으로 기록한다.
- Python 기준선과 같은 `assess-merge --modules`·`record-evaluation --scores` variadic 인자를 복원하고, 평가 rubric·증거, 병합 재검토, 협업 멤버·신원 전이를 실패 폐쇄형으로 검증한다.
- 전역 안정 ID 검사는 정본 레코드만 대상으로 하며 문서 내부의 `acceptance`·`procedure`·`context` 같은 국소 ID를 중복으로 오인하지 않는다.
- 잠긴 세션의 shell 예외는 단일 명령만 허용하고 합성·파이프·리다이렉션·명령 치환과 따옴표 밖 PowerShell `()`·`@()` 그룹/배열 식을 거부한다. 알 수 없는 client origin은 CLI로 추정하지 않으며, close-out stage는 관측한 literal 경로만 허용하고 staged 전체가 관측 범위인 메시지 형식의 새 로컬 커밋으로 제한한다.
- Node 생성기는 정본의 구조화 필드, 가이드 절차·명령과 합의한 문서 필수 항목을 보존한다. 근거 없는 필수 항목은 미작성으로 표시하고, `validate`는 현재 renderer와 다른 내용 및 obsolete 생성물을 거부한다.
- `add-module`은 저장소 잠금, 잠금 뒤 catalog 재읽기와 다중 파일 실패 롤백을 사용한다. 죽은 소유자의 lock은 별도의 exclusive cleanup lock을 획득하고 소유 token을 재확인한 뒤에만 회수한다. cleanup 잠금도 PID·token을 재확인해 죽은 소유자의 잔여 잠금만 회수하며, 살아 있거나 형식이 불명확하거나 소유권이 바뀐 경쟁은 fail-closed로 중단한다. 임시 JSON 파일은 성공·실패 모두 정리한다.
- portable parser는 `--option=value`, 반복 scalar의 최종값, append·variadic 반복 그룹을 argparse 기준으로 처리한다. 선택 scalar·append 옵션도 이름 뒤 값이 없으면 종료 코드 2로 거부하고, `nargs=*`만 빈 그룹을 허용하며 `nargs+`는 최소 한 값을 요구한다. Kit parser는 알 수 없는 옵션·위치 인자와 required·상호 배타 위반을 종료 코드 2로 거부한다.
- 신뢰 기록 존재는 실제 훅 실행·저장 성공과 구분해 안내하며, Codex `SessionStart` 배선에서 매번 신뢰 상태를 확인한다.
- Codex에서만 신뢰 레코드 유무와 무관하게 사용자 직접 승인 확인을 요구한다. 승인 시점은 현재 세션 시작 전 기존 승인과 시작 후 신규 승인 두 선택지로만 한 번에 묻고, 직접 검토·승인한 사용자는 최초 응답에 `1` 또는 `2`만 입력해 승인 사실과 시점을 함께 확인할 수 있다. 자연어에는 부정·모호성을 거부하는 결정적 의미 분류를 사용한다. Windows Codex 앱의 신규 승인 뒤 일반 쓰기를 새 앱 세션에서 재개하게 하며, CLI에서는 현재 acknowledge 훅이 신규 승인 답변을 실제 수신한 경우 별도 재시작 절차를 적용하지 않는다. 훅 신뢰 리비전은 `/hooks`가 검토하는 실제 `.codex/hooks.json` 정의만 해시하므로 version 3에서는 그 정의 변경 때만 재승인을 요구한다. 과거 version 2 상태는 provider 정의 단독 해시가 없어 기존 승인을 보존하지 않고 `unconfirmed`로 한 번 전환한다. 정의 변경 뒤 Windows 앱은 최신 훅을 승인한 새 앱 세션에서 재개하고, CLI는 최신 훅 승인 뒤 현재 acknowledge가 신규 승인 답변을 받으면 현재 세션의 시작 리비전을 갱신해 새 CLI 세션 없이 재개한다. export된 모든 훅 이벤트는 Git 초기화 전에도 세션 루트 상대 경로로 실행된다. 잠긴 창에서는 알려진 읽기 전용 도구, 훅 유지보수와 관측된 자기 변경의 close-out만 예외로 허용한다. Claude에는 이 게이트를 적용하지 않는다.
- portable 훅 테스트는 `.aidd-role.json`의 역할에 따라 Codex 루트 해석 계약을 나눠 단정한다. `kit-source`는 중첩 PowerShell Git 루트 해석을, 배포물은 `git rev-parse` 부재와 세션 cwd 상대 `node .ai/tools/*.mjs` 진입점을 검증한다. Kit 회귀 검사는 kit-template export와 sample new-project 안에서 portable AIDD 테스트 전체 통과를 확인해 배포물이 첫 CI부터 실패하지 않게 한다. 이 검사는 중첩 `node --test`에 `NODE_TEST_`·`NODE_OPTIONS` 환경변수를 상속시키지 않고 `--test-reporter=tap`을 명시하며, 종료 코드와 함께 `not ok` 부재·`# fail 0`·전량 통과 수를 단정하고 배포물 테스트 스위트가 원본과 바이트 단위로 같은지 확인한다. 결함을 재주입하면 실제로 실패하는 것을 반증으로 확인했다.
- Windows Desktop의 `restart_required`는 Desktop client kind에만 적용해 같은 저장소의 CLI `1`·`2` 승인 흐름을 막지 않으며, CLI 승인도 Desktop 재시작 표식을 제거하지 않는다.
- 검증 근거: `KIT-EVD-009`, `KIT-EVD-010`, `KIT-EVD-011`, 독립 C3 실패 판정 `KIT-EVD-012`, 동일 구현 세션의 수정 부분 검증 `KIT-EVD-013`, 불변 커밋 전체 재검증 `KIT-EVD-014`, 후속 독립 검토 발견사항의 동일 구현 세션 수정·표적 검증 `KIT-EVD-015`, 후속 수정 불변 커밋의 전체 회귀·export·sample 검증 `KIT-EVD-016`, 훅 승인 오탐·pre-Git export 수정 불변 커밋의 전체 66/66·export·sample·rollback 검증 `KIT-EVD-017`, version 2 마이그레이션 승인 승격 HIGH와 ADR 모순 MEDIUM을 확인한 독립 C3 실패 판정 `KIT-EVD-018`, fail-closed 마이그레이션 수정 불변 커밋의 전체 67/67·export·sample·rollback 제약 검증 `KIT-EVD-019`, Desktop 재시작과 CLI 승인 흐름 결합 MEDIUM을 확인한 독립 closure 실패 판정 `KIT-EVD-020`, client kind 격리 수정 불변 커밋의 전체 68/68·export·sample 검증 `KIT-EVD-021`, 기존 발견사항 해소와 새 발견사항 0건을 확인한 독립 C3 PASS `KIT-EVD-022`, 실제 Windows Codex Desktop 신규 승인·재시작·PreToolUse 실행 `KIT-EVD-023`, 배포물 AIDD 테스트 적합성 위반 확인·수정과 전체 69/69·배포물 25/25·directory·ZIP 168개 동일성·sample 검증 `KIT-EVD-024`, 회귀 검사 무력화 HIGH를 확인한 독립 C3 재검토 실패 판정 `KIT-EVD-025`, 회귀 검사 수정과 결함 재주입 반증 검증 `KIT-EVD-026`, 자체 설계한 결함 재주입 A/B와 우회 탐침으로 HIGH·MEDIUM 0건을 확인한 독립 C3 재검토 PASS `KIT-EVD-027`, 그 검토의 LOW N1·N2 수정과 표적 검증 `KIT-EVD-028`.
- 현행 가이드와 reference fixture 런타임 정본·파생 문서를 Node.js 22 기준으로 통일하고 회귀 검사로 고정한다.
- 기존 Python 검증 근거 `KIT-EVD-007`, `KIT-EVD-008`은 전환 배경으로만 유지하며 Node 결과는 별도 증거로 기록한다.
- Node `generate`는 reference 기준 파생 경로 53개를 모두 재생성하고 stale 생성물을 정리한다. `migrate-module-specs`는 레거시 요구사항을 모듈 소유 조각으로 원자적으로 전환하며 반복 실행을 거부한다. `validate`는 bootstrap 분기와 인수 기준·양방향 추적성·재사용 자산·문서 템플릿·작업 보드·시스템 표면 의미 게이트를 복원한다. 2026-09-20 후속 수정 불변 커밋 `74dd1f8f36280c24ab72ae4bac80651951af3cfe`에서 `sync-providers`, Kit source/export 경계, 최신 Kit 관리 테스트 42/42와 portable 테스트 22/22, 총 64/64가 통과했다. directory·ZIP export는 각각 168개 파일의 경로와 SHA-256이 같고 관리 전용·제품 트리가 없으며, sample new-project는 AIDD validate 0 warnings와 `.ai`·`.agents`·`.claude` portable 스킬 37개 파일 동일성을 확인했다. 결과는 `KIT-EVD-016`에 기록했다. 독립 C3 재검토는 `KIT-EVD-022`, 실제 Windows Codex Desktop 검증은 `KIT-EVD-023`에 기록했다. 실제 macOS Codex·Claude provider 증거는 고객의 macOS 환경 부재로 연기했고, 환경을 확보하면 재개한다. 이 위험이 해소될 때까지 완료·출시 준비 완료로 표시하지 않는다.

## KIT-CHG-003 · Codex 대화 기록 훅 신뢰 사전 점검

상태: 검증 완료, 미출시(`verified`)

- Codex 세션 시작 계약이 `hook-trust-status`를 실행해 `UserPromptSubmit`·`Stop`의 영구 신뢰 기록 부재를 알린다.
- 미승인 상태에서는 훅 또는 Codex 전역 설정을 자동으로 바꾸지 않고, interactive Codex CLI의 `/hooks` 검토·신뢰 절차만 안내한다.
- 검증 근거: `KIT-EVD-006`.

## KIT-CHG-002 · 의도 합의 뒤 벤치마킹 필요성 판단과 근거 기반 제안

상태: 검증 완료, 미출시(`verified`)

- 제품 의도·목적·성과 기준 뒤 BEN-TRIAGE를 수행하고, 필요성이 합의된 경우에만 외부 조사·비교·추천을 수행한다.
- 조사 관측과 출처·한계·우리 환경의 차이는 research-note에 남기며 고객 결정만 제품 정본에 반영한다.
- 검증 근거: `KIT-EVD-005`.
