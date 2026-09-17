# AIDD — AI 주도 개발·운영 방법론

AIDD는 사람인 고객과 여러 역할을 수행하는 AI가 제품의 의도 정의부터 운영·개선까지 함께 수행하기 위한 저장소 중심 실행 체계다.

핵심 원칙은 단순하다. `.aidd/ssot/` 아래의 구조화된 레코드가 정본이며, `docs/generated/` 아래의 문서는 정본에서 만든 파생 산출물이다. 요구사항, 아키텍처, 의사결정, 작업, 테스트, 릴리스와 유지보수 변경은 안정적인 ID로 연결되므로 CLI가 끊어진 참조와 오래된 산출물을 탐지할 수 있다.

## 시작하기

```powershell
python tools/aidd.py validate
python tools/aidd.py project-init
python tools/aidd.py project-init-status
python tools/aidd.py generate
python tools/aidd.py status --level executive
python tools/aidd.py status --level detail
python tools/aidd.py status --level module --module MOD-AI
python tools/aidd.py development-check --change CHG-001
python tools/aidd.py branch-check --change CHG-001
python tools/aidd.py evaluation-status
python tools/aidd.py evaluation-prompt --scenario EVS-001
python tools/aidd.py record-evaluation --scenario EVS-001 --platform codex --status passed --evidence EVD-ID --scores 2 2 2 2 --summary "평가 요약"
python tools/aidd.py collaboration-status
python tools/aidd.py identity-check
python tools/aidd.py collaboration-member --id HUM-002 --name "팀원 이름" --role 개발자 --status active --reason "팀원 합류"
python tools/aidd.py collaboration-identity --id IDM-002 --type human --participant HUM-002 --git-name "팀원 Git 이름" --git-email "team@example.com" --hosting-account "github-id" --reason "팀원 신원 확인"
python tools/aidd.py collaboration-identity --id IDM-003 --type bot --git-name "CI Bot" --git-email "bot@example.com" --hosting-account "ci-bot" --reason "CI 서비스 계정"
python tools/aidd.py collaboration-member --id HUM-002 --status inactive --reason "팀원 이탈"
python tools/aidd.py release-check --release REL-001
python tools/aidd.py assess-merge --merge MRG-001 --modules MOD-CHG --notes "상호작용 검토" --additional-testing "회귀 테스트 필요"
```

`.ai/core/` 또는 `.ai/skills/`를 변경한 뒤에는 `python tools/aidd.py sync-ai`를 실행한다. 이 명령은 같은 정본으로부터 Codex용 `.agents/skills/`와 `AGENTS.md`, Claude Code용 `.claude/skills/`와 `CLAUDE.md`를 갱신한다.

AI 행동 평가에서는 먼저 `evaluation-prompt`의 동일한 출력을 두 플랫폼에 제공한다. 응답·산출물과 판정 근거를 `EVD`로 기록한 뒤 `record-evaluation`으로 각 루브릭 점수와 중대 금지 행동을 플랫폼별 `EVR`에 남긴다. 한 플랫폼의 결과를 다른 플랫폼 결과로 복사하지 않는다.

복사한 템플릿은 첫 AI 세션에서 `project-init`으로 로컬 `main` 저장소와 `.githooks`를 안전하게 준비한다. 이 과정은 파일을 자동 스테이징·커밋하거나 신원을 등록하지 않는다. 사람의 확인 후에만 최초 기준선 커밋을 만든다. `.githooks/pre-commit`은 팀 프로필에서 기본 브랜치 직접 커밋을 막고, `post-merge`는 병합 영향을 기록한다. GitHub에서는 `.github/workflows/aidd.yml`이 파생 문서·AI 어댑터 재생성, 드리프트, 정본과 테스트를 검사한다. `.github/rulesets/main.json`은 기본 브랜치 보호 기준이지만 원격 적용 여부는 별도 조회 증거로 확인해야 한다. Codex에서는 `.codex/hooks.json`을 별도로 검토하고 신뢰해야 하며, Claude Code는 `.claude/settings.json`을 프로젝트 설정으로 읽는다.

협업 방식은 활성 사람 참여자 수에 따라 가역적으로 바뀐다. 활성 인원이 1명이면 `CBP-SOLO`, 2명 이상이면 `CBP-TEAM`을 선택하고 `.github/rulesets/main.json`을 다시 만든다. 1인 프로필은 다른 사람의 승인을 요구하지 않으며 `main`에서 C0 직접 커밋을 할 수 있고 C1~C3에는 작업 브랜치를 권장한다. 팀 프로필은 작성자 외 최소 1명의 사람 승인을 요구하며 모든 새 변경은 작업 브랜치에서 시작해야 한다. 팀원이 모두 이탈해 책임자 1명만 남으면 다시 1인 프로필로 돌아가며 참여·이탈과 프로필 전환 이력은 삭제하지 않는다. 실제 원격 보호 규칙은 생성된 파일과 별도로 GitHub에 적용·검증해야 한다.

`identity-check`는 모든 도달 가능한 커밋의 작성자·커미터 이름과 이메일을 등록된 `IDM` 신원과 대조한다. 미등록 신원은 사람으로 자동 등록하지 않는다. 고객 확인을 받아 기존 `HUM`의 별칭, 새 팀원 또는 봇으로 분류한다. 봇과 기존 참여자의 추가 이메일은 활성 사람 수를 늘리지 않는다. 미등록 신원과 참여자 이탈 시점 뒤의 새 커밋은 경고되고 C2·C3 개발 진입과 모든 릴리스를 차단한다. Git에는 실제 push 계정이 기록되지 않으므로 PR 작성자·승인자·push 행위자는 등록된 호스팅 계정과 GitHub API 또는 감사 로그 증거를 별도로 대조해야 한다.

## 수행 순환

1. 의도, 성과, 경계, 가정과 미결사항을 기록한다.
2. 활성 참여자와 협업 프로필을 확인하고 사람 승인·독립 검토 방식을 정한다.
3. `DG-001`에서 배포 위치, DBMS, 인스턴스·확장, 워크로드, SLO·복구, 상태와 운영 제약을 확인한다.
4. 프로젝트 특성에 맞는 예측형·적응형·혼합형 수행 경로와 적용 통제를 선택한다.
5. 안정적인 ID를 부여하고 정본 레코드를 갱신한다.
6. 의미 있는 대안을 비교하고 채택한 결정을 기록한다.
7. 신규 시스템·모듈이나 핵심 기술 변경은 `TG-001`에서 기술 스택을, 기능 규모 개발 전에는 `TG-002`에서 UI·개발 공통 기반과 동시성·성능·장애 검증을 확정한다.
8. 모듈별 `MLS` 마일스톤, `WRK` 작업, `IFC` 인터페이스와 `DPN` 의존성을 정하고 정본에서 계획과 사람이 읽는 산출물을 생성한다.
9. `development-check`로 필수 게이트 승인을 확인한 뒤 요구사항 단위의 작은 증분으로 구현하고 수행자·명령·시각·커밋·결과가 있는 `EVD` 검증 증거를 연결한다.
10. 변경별 필수 `GTR` 게이트 실행의 모든 기준과 현재 협업 프로필에 맞는 승인·검토·예외를 확인하고 `validate`, 관련 테스트, 보안 검사와 릴리스 게이트를 실행한다.
11. 결과, 병합 영향, 운영 증거와 후속 작업을 기록한다. 공통 AI 규칙을 바꾸면 같은 평가 픽스처와 루브릭으로 Codex·Claude 결과를 각각 남긴다.

전체 생애주기는 [방법론 청사진](docs/methodology/blueprint.md), 정본 규칙은 [산출물 모델](docs/methodology/artifact-model.md), 처음 사용하는 사람을 위한 절차는 [AIDD 템플릿 사용 가이드](docs/guides/aidd-template-guide.md)를 참고한다. 배포 조건과 설계 위험은 [배포·운영 맥락과 설계 위험](docs/generated/deployment-and-runtime.md), 기술 선택 기준은 [기술 스택과 개발 기반 게이트](docs/generated/technology-gates.md), 방법론별 채택 근거는 [방법론 비교와 적용 지침](docs/generated/methodology-comparison.md)에서 확인한다.

## 저장소 구조

```text
.aidd/ssot/           기계 판독 가능한 프로젝트 정본
.ai/core/             AI 공통 수행 계약 정본
.ai/skills/           이식 가능한 공통 스킬 정본
.agents/skills/       자동 생성된 Codex 스킬 어댑터
.claude/skills/       자동 생성된 Claude Code 스킬 어댑터
.codex/hooks.json     Codex 생애주기 훅
.claude/settings.json Claude Code 생애주기 훅
docs/generated/       자동 생성된 프로젝트 문서
docs/methodology/     안정적으로 유지하는 방법론·거버넌스 설명
tools/aidd.py         생성, 검증, 동기화, 브리핑, 병합 기록 CLI
tests/                프레임워크 테스트
tests/fixtures/       AI 행동 평가를 포함한 합성 입력
.githooks/            선택적으로 활성화하는 Git 훅
.github/rulesets/     원격 적용 전 검증하는 브랜치 보호 기준
```

자동 생성 문서에는 생성 안내가 표시된다. 해당 문서를 직접 고치지 말고 대응하는 `.aidd/ssot/*.json`을 변경한다.
