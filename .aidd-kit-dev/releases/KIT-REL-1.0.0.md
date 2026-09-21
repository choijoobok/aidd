# AIDD Kit 1.0.0

기준일: 2026-09-22
버전 영향도: `major`
포함 변경: `KIT-CHG-002`, `KIT-CHG-003`, `KIT-CHG-004`, `KIT-CHG-005`, `KIT-CHG-006`, `KIT-CHG-007`, `KIT-CHG-008`, `KIT-CHG-009`, `KIT-CHG-010`, `KIT-CHG-011`, `KIT-CHG-012`, `KIT-CHG-013`, `KIT-CHG-014`, `KIT-CHG-015`, `KIT-CHG-016`

## 사용자 영향

- `KIT-CHG-002` 관리자·프로젝트 팀 가이드 분리와 문서 체계 정리: 관리자와 프로젝트 팀에 각각 하나의 진입점을 제공하고, 프로젝트 생성부터 운영까지 상세 사용법과 모든 Markdown 문서군의 역할을 모순 없이 정리한다.
- `KIT-CHG-003` Codex 세션 시작 훅 신뢰 확인 안내: Codex CLI와 Windows 앱의 매 세션 시작에 CLI /hooks 확인 경고를 표시하되 Claude에는 표시하지 않는다.
- `KIT-CHG-004` 역할별 스킬 동기화 훅 안내 정합화: 작업공간 역할에 따라 Kit 원본은 sync-providers를, 프로젝트 템플릿과 제품 작업공간은 portable sync-ai를 안내한다.
- `KIT-CHG-005` PM 중심 프로젝트 용어 관리 단순화: PM 요청에 따라 AI가 영향을 브리핑하고, PM 확인 뒤 용어 추가·변경·제거와 관련 산출물 현행화·검증·변경 이력 저장을 하나의 수행 흐름으로 완료한다.
- `KIT-CHG-006` 분석·설계 용어 발견과 명확화 강화: 요구분석·설계 중 AI가 의미 확인이 필요한 용어를 식별하면 PM에게 짧은 확인 카드를 제시하고, 확인 직후 분류·범위·예시·관련 용어·혼동 구분을 포함한 용어 정본과 파생 문서를 기존 PM 중심 흐름으로 현행화한다.
- `KIT-CHG-007` 팀원 용어 확인 카드와 오프라인 PM 전달: 모든 활성 팀원은 정본을 바꾸지 않는 용어 확인 카드를 만들 수 있게 하고, 카드 복사·PM 확인·PM 전용 적용 흐름과 오프라인 HTML 용어집 위치를 프로젝트 배포 가이드에 명시한다.
- `KIT-CHG-008` 프로젝트 용어 관리 전용 스킬 분리: 용어 발견·확인 카드·PM 적용·파생 용어집 검증을 자동 선택 가능한 전용 portable 스킬로 모으고, 다른 스킬과 AGENTS.md는 간결한 라우팅과 정본 경계만 유지한다.
- `KIT-CHG-009` 인력 거버넌스 제거와 결정 이력 중심 전환: 인력·역할·일정·승인·배정은 프로젝트 운영 영역으로 돌리고, AIDD는 현재 정본과 누가 왜 결정했는지를 자유문자와 안정 ID로 연결하는 간결한 결정 이력, 실행 범위와 검증 증거에 집중한다.
- `KIT-CHG-010` Codex 세션 시작 훅 신뢰 안내 복구: Codex 새 세션의 첫 사용자 요청에 대한 final_answer에서 CLI /hooks 확인 안내를 반드시 보여 주되 AIDD 승인 상태를 저장하거나 응답을 요구하거나 작업을 차단하지 않는다. commentary 표시는 final_answer 표시를 대체하지 않는다. repo-local 훅 명령은 Git 루트를 우선하고 아직 Git 저장소가 아닌 템플릿에서는 작업공간 역할 표식을 기준으로 실행기를 찾도록 한다.
- `KIT-CHG-011` Codex 세션 안내 반복 방지: startup 첫 사용자 요청의 final_answer에는 안내를 보장하되 이전 assistant final_answer에 이미 표시된 경우 같은 세션의 이후 응답에서는 반복하지 않는다.
- `KIT-CHG-012` 요구사항·기능 상세·화면 명세 용어 분리: 요구사항이라는 명칭은 REQ/NFR 제품 계약에만 사용하고, 개발 단계 구체화 산출물은 기능 상세 명세와 화면 명세(SCR)로 구분하며 파일명·정본·생성물·스킬·가이드에서 같은 용어를 사용한다.
- `KIT-CHG-013` 훅 완전 런타임 격리와 통합 대화 로그 복구: 훅 격리를 1순위 불변 규칙으로 두고 provider·이벤트·책임마다 코드 중복을 허용한 전용 프로세스를 사용한다. Claude와 Codex의 모든 대화 원문은 provider를 표시하고 질의·응답을 한 블록으로 결합해 현재 프로젝트 루트의 일자별 append-only 파일에 기록하며, 동시 세션에서도 한 블록이 분리되지 않게 한다.
- `KIT-CHG-014` Claude 어댑터 훅 런타임 계약 불일치 수정: provider의 실제 입력·출력 계약에 맞게 Claude 런타임 파일만 수정하고 Codex 훅의 명령·실행 파일·등록 위치·승인 해시는 그대로 유지한다. Claude에서 대화 로그와 생성물 보호가 실제로 동작하는지 행위 테스트로 고정하고, 배포 프로젝트에서도 같은 테스트를 실행할 수 있게 한다.
- `KIT-CHG-015` 생애주기 전체 결정 요청 연속성과 상태 브리핑 보강: 모든 미결 결정을 단계와 무관한 프로젝트 전체 공통 OI에 먼저 저장하고 실제 전문 정본을 링크하며, 사용자에게 제시한 질문을 공통 DRQ 큐에 기록한다. 여러 미응답 묶음을 유실 없이 보존하고 차단·명시적 우선순위·대기 시각으로 권장 답변 묶음을 선택하며, 답변 뒤 대상 정본과 결정 이력을 갱신하고 OI와 DRQ를 닫는다. status는 OI와 결정 요청의 건수·묶음 수를 구분하고 bootstrap에서도 실제 기록을 보고한다.
- `KIT-CHG-016` 결정적 SemVer 릴리스 버전 자동화: 각 KIT-CHG가 none·patch·minor·major 영향도를 선언하고 미출시 검증 변경의 최고 영향도로 다음 SemVer를 계산한다. 읽기 전용 계획과 명시적 릴리스 준비 명령을 분리하고, 준비 명령이 버전 정본·변경 귀속·릴리스 노트·UNRELEASED를 일관되게 갱신하되 커밋과 태그는 만들지 않는다.

## 호환성·마이그레이션

- `KIT-CHG-002`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-003`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-004`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-005`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-006`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-007`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-008`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-009`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-010`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-011`: 별도 호환성 주의 사항 없음.
- `KIT-CHG-012`: 화면 파생 문서 경로 project/docs/generated/ui/modules/<MOD>/<SCR>/requirements.md는 specification.md로 바뀐다. generate는 이전 파일을 obsolete 파생물로 제거하므로 외부 링크와 제출 목록은 새 경로로 갱신해야 한다.
- `KIT-CHG-013`: 훅 명령 정의가 한 번 변경되므로 Codex에서 새 정의를 다시 신뢰하고 새 세션을 열어야 한다. 이후 런타임 구현 변경은 다른 훅 정의를 바꾸지 않는다. 새 대화는 raw 하위 경로와 provider 표시 형식을 사용하며 기존 chat-history/YYYY-MM/YYYY-MM-DD.md 파일은 이동하거나 다시 쓰지 않는다. 전환 중 UserPromptSubmit과 Stop이 서로 다른 런타임 버전에서 실행된 턴은 반쪽 로그를 만들지 않고 기록하지 않는다.
- `KIT-CHG-014`: 훅 등록 정의와 Codex 런타임, .codex/hooks.json, .claude/settings.json은 변경하지 않으므로 Codex 재승인이 필요 없다. Claude 훅 파일만 교체된다. 고장 기간의 Claude 턴은 소급 기록하지 않는다. 생성물 경로를 본문에 언급하는 문서 편집은 더 이상 차단되지 않고, 대상 경로가 생성물 루트인 쓰기는 파일 내용과 무관하게 차단된다.
- `KIT-CHG-015`: 기존 workboard.json에 decision_requests가 없어도 빈 배열로 취급해 검증과 상태 조회가 계속 동작한다. 기존 OI·ADR·CHG·HIS 구조와 ID는 유지한다. 새 프로젝트에는 빈 decision_requests 배열이 생성된다. 기존 프로젝트는 자동 업그레이드하지 않으며 다음 결정 질문 전에 배열을 추가해 점진적으로 채택한다.
- `KIT-CHG-016`: 기존 export와 프로젝트 배포물의 구조·명령은 바뀌지 않는다. 자동화는 Kit 관리 전용이며 기존 0.2.0과 KIT-CHG 이력을 명시적으로 마이그레이션한다. prepare-release는 릴리스 준비 정본만 수정하고 커밋·태그·프로젝트 자동 업그레이드를 수행하지 않는다.

## 검증

- `KIT-CHG-002`: node .ai/tools/aidd_hook.mjs self-test --hook, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tests/aidd.test.mjs, node .aidd-kit-dev/tools/kit.mjs smoke, Markdown 상대 링크와 UTF-8 BOM/LF 검사, 문서에 기재한 AIDD CLI 명령·옵션 정적 대조
- `KIT-CHG-003`: node .aidd-kit-dev/tools/kit.mjs sync-providers, node .ai/tools/aidd_hook.mjs self-test --hook, node .ai/tests/harness.test.mjs, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke
- `KIT-CHG-004`: node .ai/tools/aidd_hook.mjs self-test --hook, node --test --test-name-pattern="skill sync guidance" .ai/tests/harness.test.mjs, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke
- `KIT-CHG-005`: node .aidd-kit-dev/tools/kit.mjs sync-providers, node .ai/tools/aidd_hook.mjs self-test --hook, node .aidd-kit-dev/tests/terminology.test.mjs, node .aidd-kit-dev/tests/aidd.test.mjs, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke
- `KIT-CHG-006`: node .aidd-kit-dev/tools/kit.mjs sync-providers, node .aidd-kit-dev/tests/terminology.test.mjs, node .aidd-kit-dev/tests/aidd.test.mjs, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke
- `KIT-CHG-007`: node .aidd-kit-dev/tools/kit.mjs sync-providers, node --test .aidd-kit-dev/tests/terminology.test.mjs, node .aidd-kit-dev/tests/aidd.test.mjs, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke
- `KIT-CHG-008`: Node 기반 스킬 frontmatter·이름·설명·미완성 placeholder 구조 검사 통과, node .aidd-kit-dev/tools/kit.mjs sync-providers, node --test .aidd-kit-dev/tests/terminology.test.mjs, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke
- `KIT-CHG-009`: node .aidd-kit-dev/tools/kit.mjs sync-providers, node --test .aidd-kit-dev/tests/terminology.test.mjs, node --test .aidd-kit-dev/tests/history.test.mjs, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke, 변경 후 aidd-document-consistency 기준의 의미 정합성 검토
- `KIT-CHG-010`: node .ai/tools/aidd_hook.mjs self-test --hook, node --test .ai/tests/harness.test.mjs, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke, exported aidd-template에서 Git 미초기화 상태의 node --test .ai/tests/harness.test.mjs, 변경 후 aidd-document-consistency 기준의 의미 정합성 검토
- `KIT-CHG-011`: node .ai/tools/aidd_hook.mjs self-test --hook, node --test .ai/tests/harness.test.mjs, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke, exported aidd-template에서 node --test .ai/tests/harness.test.mjs, ai-agent의 Codex self-test와 harness-check
- `KIT-CHG-012`: node .aidd-kit-dev/tools/kit.mjs sync-providers, skill-creator quick_validate로 aidd-ui-spec 검증, 변경 영역 Node 테스트와 reference fixture 전체 파생물 비교, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke, 구 명칭·파일명·FEAT·USE 잔존 검색과 문서 정합성 검토, exported aidd-template 검증
- `KIT-CHG-013`: node .aidd-kit-dev/tools/kit.mjs sync-providers, node .ai/tools/aidd_hook.mjs self-test --hook, node --test .ai/tests/harness.test.mjs, Codex·Claude UserPromptSubmit만으로 최종 파일이 생기지 않고 Stop 뒤 정확한 provider 표시 질의·응답 블록이 생기는 행위 테스트, 8개 동시 세션의 Stop을 같은 파일에 실행해 각 질의와 응답이 하나의 잠긴 블록으로 유지되는 회귀 테스트, node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke
- `KIT-CHG-014`: node .ai/tools/aidd_hook.mjs self-test --hook, node .ai/tests/harness.test.mjs (kit-source와 배포 프로젝트 양쪽), node .aidd-kit-dev/tools/kit.mjs check, node .aidd-kit-dev/tools/kit.mjs smoke, 실제 Claude Code 세션에서 Stop 뒤 chat-history 일자 파일에 Claude 질의·응답 블록이 생성되는지 확인, 실제 Claude Code 세션에서 PostToolUse 안내가 모델 입력으로 전달되는지 확인, Windows 역슬래시 경로와 생성기 문구를 포함한 내용으로 생성물 쓰기 차단 확인, Claude 셸 보호 20개 명령 회귀 확인: 읽기·문서화 허용, 리다이렉션·rm·mv·tee·sed -i·git checkout·PowerShell 변경 cmdlet 차단, 생성기 문구 우회 차단
- `KIT-CHG-015`: 결정 연속성 4개 시나리오와 전체 Kit 9개 테스트, provider 동기화, 훅 self-test, quick check, reference fixture 재생성 비교, export·new-project smoke와 git diff 검사가 통과했다.
- `KIT-CHG-016`: SemVer 계산·최고 영향도 집계·미검증 차단·릴리스 정본 동시 갱신·버전 불일치와 영향도 누락 거부의 자동 테스트 5건, 기존 전체 테스트 24건, provider 동기화, quick check, export·new-project smoke와 git diff 검사가 통과했다.

## 알려진 제한

- `KIT-CHG-002`: 기록된 알려진 제한 없음.
- `KIT-CHG-003`: 기록된 알려진 제한 없음.
- `KIT-CHG-004`: 기록된 알려진 제한 없음.
- `KIT-CHG-005`: 기록된 알려진 제한 없음.
- `KIT-CHG-006`: 기록된 알려진 제한 없음.
- `KIT-CHG-007`: 기록된 알려진 제한 없음.
- `KIT-CHG-008`: 기록된 알려진 제한 없음.
- `KIT-CHG-009`: 기록된 알려진 제한 없음.
- `KIT-CHG-010`: 기록된 알려진 제한 없음.
- `KIT-CHG-011`: 기록된 알려진 제한 없음.
- `KIT-CHG-012`: 기록된 알려진 제한 없음.
- `KIT-CHG-013`: 기록된 알려진 제한 없음.
- `KIT-CHG-014`: 기록된 알려진 제한 없음.
- `KIT-CHG-015`: EVS-004의 Codex·Claude 실제 행동 실행은 아직 기록되지 않았다. 동일 입력·기대·금지 행동·루브릭 계약만 준비했으며 행동 동등성을 주장하지 않는다.
- `KIT-CHG-016`: prepare-release는 커밋과 Git 태그를 의도적으로 생성하지 않으며 프로젝트 배포본을 자동 업그레이드하지 않는다. 여러 파일 쓰기는 실패 시 원본을 복원하지만 운영체제나 프로세스가 쓰기 도중 강제 종료되는 상황의 파일시스템 전체 원자성까지 보장하지 않는다.

## 롤백

- `KIT-CHG-002`: KIT-CHG-002의 가이드 분할과 연결 변경을 되돌리고 기존 두 프로젝트 가이드를 복원한다.
- `KIT-CHG-003`: Codex 어댑터의 codex-hook-review-reminder 연결과 계약·테스트·가이드 추가분을 제거한 뒤 sync-providers를 실행한다.
- `KIT-CHG-004`: skill_sync_guidance 계약과 역할별 안내 함수를 제거하고 기존 단일 Kit 관리자 안내로 되돌린다.
- `KIT-CHG-005`: term-review·term-apply와 TCH 구조를 제거하고 종전 term-propose·term-impact·term-decide·term-close 및 TIR·TAP 정본 구조를 복원한다.
- `KIT-CHG-006`: 개념 유형·범위·예시·관련 용어·혼동 구분 필드와 자동 확인 지침을 제거하고 KIT-CHG-005의 용어 구조와 PM 직접 요청 흐름으로 되돌린다.
- `KIT-CHG-007`: 팀원용 term-review 권한과 오프라인 전달 안내를 제거하고 term-review·term-apply 모두 PM 신원을 요구하는 KIT-CHG-006 흐름으로 되돌린다.
- `KIT-CHG-008`: aidd-terminology 스킬을 제거하고 KIT-CHG-007의 용어 절차를 요구발굴·아키텍처·전달·문서 정합성 스킬과 AGENTS.md에 다시 인라인으로 복원한다.
- `KIT-CHG-009`: HIS 조각과 관련 CLI·생성 뷰를 제거하고 KIT-CHG-008의 collaboration·PM 승인·작업 배정 모델을 portable 명세와 fixture에서 복원한다.
- `KIT-CHG-010`: additionalContext와 final_answer 표시 계약을 제거하고 Codex 어댑터를 systemMessage 전용 상대 경로 구성으로 되돌린다.
- `KIT-CHG-011`: 반복 금지 조건과 회귀 검사를 제거하고 KIT-CHG-010의 첫 final_answer 표시 계약으로 되돌린다.
- `KIT-CHG-012`: 세 워크시트와 문서 정책 분리를 되돌리고 화면 생성 경로를 requirements.md로 복원한 뒤 공통 용어 baseline과 fixture를 KIT-CHG-011 상태로 재생성한다.
- `KIT-CHG-013`: provider 어댑터와 .ai/tools/aidd_hook.mjs를 KIT-CHG-012 기준선으로 되돌리고 독립 .ai/hooks/*.mjs 및 격리 계약을 제거한다.
- `KIT-CHG-014`: .ai/hooks/claude-log-assistant.mjs, claude-post-check.mjs, claude-protect-file.mjs, claude-protect-shell.mjs와 .ai/tests/harness.test.mjs, .ai/spec/conformance.md, .ai/hooks/README.md를 KIT-CHG-013 기준선으로 되돌린다. provider 배선과 Codex 런타임은 되돌릴 대상이 없다.
- `KIT-CHG-015`: DRQ 공통 용어와 workboard.decision_requests 검증·출력·게이트 연결, aidd-decision-management 스킬과 관련 수행 계약을 제거한다. 기존 프로젝트의 decision_requests 데이터는 별도 JSON으로 내보내 보존하고 OI·ADR·CHG·HIS는 변경 없이 유지한다.
- `KIT-CHG-016`: release-plan·prepare-release와 릴리스 메타데이터 검증을 제거하고 repository.json과 export-manifest.json의 버전을 수동 관리하던 KIT-CHG-015 상태로 되돌린다.
