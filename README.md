# AIDD Kit

> AI-Driven Development Kit — AI 주도 개발·운영 키트

AIDD Kit은 사람인 고객과 여러 역할을 수행하는 AI가 제품의 의도 정의부터 운영·개선까지 함께 수행하기 위한 저장소 중심 실행 키트다. 새 프로젝트를 시작하는 템플릿 역할과, AI가 일관된 방식으로 수행하도록 돕는 운영 도구·규칙 역할을 함께 제공한다.

핵심 원칙은 단순하다. `project/.aidd/ssot/` 아래의 구조화된 레코드가 제품 정본이며, `project/docs/generated/` 아래의 문서는 정본에서 만든 파생 산출물이다. 제품 소스는 `project/src/` 아래에 둔다. 요구사항, 아키텍처, 의사결정, 작업, 테스트, 릴리스와 유지보수 변경은 안정적인 ID로 연결되므로 CLI가 끊어진 참조와 오래된 산출물을 탐지할 수 있다.

이 저장소의 `project/`는 현재 AIDD Kit 제품 자체의 산출물이다. 다른 제품을 시작할 때는 `project/`를 제외하고 Kit을 복사한 뒤 `.ai/templates/project-skeleton/`에서 `project-bootstrap` 명령으로 새 제품 정본을 만든다. 기존 제품의 정본·소스·문서는 복사하거나 자동 덮어쓰지 않는다.

## 시작하기

처음에는 명령어를 외울 필요가 없다. Codex 또는 Claude에서 이 저장소를 열고, 아래처럼 프로젝트를 자기 말로 설명하면 된다.

> AIDD 방식으로 프로젝트를 시작하고 싶어. 아직 구현하지 말고, 내가 해결하려는 문제와 목표를 이해하기 위한 인터뷰부터 해줘. 확정되지 않은 내용은 가정이나 미결사항으로 구분하고, 중요한 선택은 대안과 추천 이유를 보여준 뒤 내 결정을 받아 기록해줘.

AI는 현재 상태를 확인하고, 필요한 질문·선택지·다음 단계를 제안하며, 합의된 결과를 정본과 작업 계획에 연결한다. 사람은 방향·범위·우선순위·위험 수용을 결정하고 AI는 질문·정리·구현·검증을 돕는다.

AI는 매 세션을 시작할 때 현재 진행 상황을 짧게 브리핑해야 한다. 평가 대기 병합(`MRG`)이나 미완료 병합 후 재검토(`MRC`)가 있으면 진척과 분리해 먼저 알린다. 재검토는 담당자를 미리 배정하지 않으며 PM·관리자가 오프라인으로 조율한다. 실제 수행 뒤에는 누가 언제 무엇을 검토했고 결과를 어떻게 처리했는지를 기록하고, 릴리스를 차단하는 재검토가 끝나기 전에는 출시 준비 완료로 표시하지 않는다.

단계별로 무엇을 AI와 함께 생각하고 어떤 식으로 말하면 좋은지는 **[AI와 대화하며 시작하는 AIDD 프로젝트 가이드](.ai/docs/guides/ai-conversation-project-guide.md)**에서 확인한다. 이 문서는 의도 찾기, 모듈 분리, 운영 맥락, 기술 선택, UI·공통 기반 합의, 작은 단위 구현, 출시·운영까지의 대화 예시를 제공한다.

시작하려면 Git, `python` 명령, 프로젝트 폴더의 읽기·쓰기 권한, 그리고 Codex 또는 Claude Code 중 하나가 필요하다. 둘 다 설치할 필요는 없으며, GitHub·CI·클라우드·DBMS·Node·Docker·외부 API 계정은 AIDD의 필수 조건이 아니라 프로젝트별 선택 사항이다. 원격 저장소나 인터넷 없이도 로컬 기록·생성·검증은 가능하지만, 원격 협업·배포에는 해당 서비스의 계정·권한·승인이 필요하다. 전체 제약과 환경 점검 대화 예시는 [가이드의 시작 전 준비와 제약](.ai/docs/guides/ai-conversation-project-guide.md#시작-전-준비와-제약)을 참고한다.

명령어는 AI에게 맡기거나, 상태를 직접 보고 싶을 때만 사용하면 된다.

```powershell
python .ai/tools/aidd.py status --level executive
python .ai/tools/aidd.py generate
python .ai/tools/aidd.py validate
```

`.ai/core/` 또는 `.ai/skills/`를 변경한 뒤에는 `python .ai/tools/aidd.py sync-ai`를 실행한다. 이 명령은 같은 정본으로부터 Codex용 `.agents/skills/`와 `AGENTS.md`, Claude Code용 `.claude/skills/`와 `CLAUDE.md`를 갱신한다.

AI 행동 평가에서는 먼저 `evaluation-prompt`의 동일한 출력을 두 플랫폼에 제공한다. 응답·산출물과 판정 근거를 `EVD`로 기록한 뒤 `record-evaluation`으로 각 루브릭 점수와 중대 금지 행동을 플랫폼별 `EVR`에 남긴다. 한 플랫폼의 결과를 다른 플랫폼 결과로 복사하지 않는다.

복사한 AIDD Kit은 첫 AI 세션에서 `project-init`으로 로컬 `main` 저장소와 `.githooks`를 안전하게 준비한 뒤, `project-bootstrap --project-id <ID> --name <이름>`으로 새 `project/` 정본 골격을 만든다. 두 명령 모두 파일을 자동 스테이징·커밋하거나 신원을 등록·기존 소스를 이동하지 않는다. 사람의 확인 후에만 최초 기준선 커밋을 만든다. `.githooks/pre-commit`은 팀 프로필에서 기본 브랜치 직접 커밋을 막고, `post-merge`는 병합 영향을 기록한다. GitHub에서는 `.github/workflows/aidd.yml`이 파생 문서·AI 어댑터 재생성, 드리프트, 정본과 테스트를 검사한다. `.github/rulesets/main.json`은 기본 브랜치 보호 기준이지만 원격 적용 여부는 별도 조회 증거로 확인해야 한다. Codex에서는 `.codex/hooks.json`을 별도로 검토하고 신뢰해야 하며, Claude Code는 `.claude/settings.json`을 프로젝트 설정으로 읽는다.

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
8. `STD` 개발 표준, `GPH` 골든 패스와 `EXC` 예외를 프로젝트 기술 기준선에 맞게 작성한다. UI가 적용되면 `UXB` 기준선, `UIP` 패턴, `CMP` 컴포넌트와 모듈별 `SCR` 화면·`MAN` 매뉴얼을 사용자와 합의한다.
9. 모듈별 `MLS` 마일스톤, `WRK` 작업, `IFC` 인터페이스와 `DPN` 의존성을 정하고 정본에서 계획과 사람이 읽는 산출물을 생성한다.
10. `development-check`로 필수 게이트 승인을 확인한 뒤 요구사항 단위의 작은 증분으로 구현하고 수행자·명령·시각·커밋·결과가 있는 `EVD` 검증 증거를 연결한다.
11. 변경별 필수 `GTR` 게이트 실행의 모든 기준과 현재 협업 프로필에 맞는 승인·검토·예외를 확인하고 `validate`, 관련 테스트, 보안 검사와 릴리스 게이트를 실행한다.
12. 결과, 병합 영향, 운영 증거와 후속 작업을 기록한다. 공통 AI 규칙을 바꾸면 같은 평가 픽스처와 루브릭으로 Codex·Claude 결과를 각각 남긴다.

전체 생애주기는 [방법론 청사진](.ai/docs/methodology/blueprint.md), 정본 규칙은 [산출물 모델](.ai/docs/methodology/artifact-model.md), 처음 사용하는 사람을 위한 절차는 [AIDD Kit 사용 가이드](.ai/docs/guides/aidd-kit-guide.md)를 참고한다. 제품별 배포 조건과 설계 위험은 [배포·운영 맥락과 설계 위험](project/docs/generated/deployment-and-runtime.md), 기술 선택 기준은 [기술 스택과 개발 기반 게이트](project/docs/generated/technology-gates.md), 방법론별 채택 근거는 [방법론 비교와 적용 지침](project/docs/generated/methodology-comparison.md)에서 확인한다.

## 저장소 구조

```text
.ai/core/             AI 공통 수행 계약 정본
.ai/skills/           이식 가능한 공통 스킬 정본
.agents/skills/       자동 생성된 Codex 스킬 어댑터
.claude/skills/       자동 생성된 Claude Code 스킬 어댑터
.codex/hooks.json     Codex 생애주기 훅
.claude/settings.json Claude Code 생애주기 훅
.ai/docs/methodology/     안정적으로 유지하는 방법론·거버넌스 설명
project/.aidd/ssot/   기계 판독 가능한 제품 정본과 전역 카탈로그
project/.aidd/ssot/modules/ 모듈별 요구사항 정본 조각(MOD-ID.json)
project/.aidd/ssot/ui-modules/ 선택적 모듈별 화면·매뉴얼 정본 조각(MOD-ID.json)
project/docs/generated/ 자동 생성된 제품 문서
project/src/          아키텍처에 맞춰 구성하는 애플리케이션 소스
.ai/tools/aidd.py         생성, 검증, 동기화, 브리핑, 병합 기록 CLI
.ai/tests/                프레임워크 테스트
.ai/tests/fixtures/       AI 행동 평가를 포함한 합성 입력
.githooks/            선택적으로 활성화하는 Git 훅
.github/rulesets/     원격 적용 전 검증하는 브랜치 보호 기준
.ai/templates/project-skeleton/ 새 제품을 위한 빈 프로젝트 작업공간 골격
```

자동 생성 문서에는 생성 안내가 표시된다. 해당 문서를 직접 고치지 말고 대응하는 `project/.aidd/ssot/*.json`을 변경한다.

모듈별 요구사항은 `project/.aidd/ssot/modules/MOD-ID.json`에 한 번만 저장하고, 여러 모듈에 걸치는 경우에도 기존 `modules` ID 링크로 영향 범위를 표시한다. `project/docs/generated/modules/MOD-ID.md`는 해당 모듈의 요구사항·작업·인터페이스·변경·결정·테스트만 모아 생성하므로, 대형 프로젝트에서도 전체 문서를 읽지 않고 분석할 수 있다. 신규 모듈은 `python .ai/tools/aidd.py add-module --id MOD-XXX --name "이름" --purpose "책임"`으로 추가한 뒤 조각 파일에 요구사항을 작성하고 `generate`, `validate`를 실행한다.

개발 기반은 `project/.aidd/ssot/foundation.json`, UI 공통 기반은 `ui-system.json`, 운영 런북은 `operations.json`, 제출 정책은 `delivery-profiles.json`에서 관리한다. UI가 없는 모듈은 UI 조각이 없어도 정상이다. UI가 필요하면 `init-module-ui` 또는 `add-module --with-ui`로 `project/.aidd/ssot/ui-modules/MOD-ID.json`을 만들고 `SCR`·`MAN`을 작성한다. 생성기는 `project/docs/generated/foundation/`, `ui/`, `manuals/`, `operations/`, `deliverables/`에 읽기 전용 뷰·목업·manifest를 만든다. 검토용 HTML 목업은 실제 화면 캡처나 출시 증거가 아니다. `REL.delivery_profile`은 제출 정책을 실제 출시 판정에 연결하며, 검증 캡처가 필요한 프로필은 `ui-capture` 증거에 화면 ID·환경·불변 커밋·생성 폴더 밖의 이미지 또는 영상·SHA-256 해시가 모두 있어야 한다.

가정은 `project/.aidd/ssot/assumptions.json`에서 `ASM` ID·영향·확인 게이트와 함께 관리한다. 중요한 게이트에는 레드팀 발견사항·결정 카드·역질문을, 작업에는 선택적 검증 부담 지표와 업무 규칙 뒤집기 검사 증거를 연결한다. 변경은 `CHG`의 지금·나중·반영하지 않음 선택지와 범위 증감으로 통제한다. 제품 소스의 세부 폴더 규칙은 [프로젝트 작업공간](project/README.md)에서 확인한다.
