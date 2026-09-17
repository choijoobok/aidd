# AIDD — AI 주도 개발·운영 방법론

AIDD는 사람인 고객과 여러 역할을 수행하는 AI가 제품의 의도 정의부터 운영·개선까지 함께 수행하기 위한 저장소 중심 실행 체계다.

핵심 원칙은 단순하다. `.aidd/ssot/` 아래의 구조화된 레코드가 정본이며, `docs/generated/` 아래의 문서는 정본에서 만든 파생 산출물이다. 요구사항, 아키텍처, 의사결정, 작업, 테스트, 릴리스와 유지보수 변경은 안정적인 ID로 연결되므로 CLI가 끊어진 참조와 오래된 산출물을 탐지할 수 있다.

## 시작하기

```powershell
python tools/aidd.py validate
python tools/aidd.py generate
python tools/aidd.py status --level executive
python tools/aidd.py status --level detail
```

`.ai/core/` 또는 `.ai/skills/`를 변경한 뒤에는 `python tools/aidd.py sync-ai`를 실행한다. 이 명령은 같은 정본으로부터 Codex용 `.agents/skills/`와 `AGENTS.md`, Claude Code용 `.claude/skills/`와 `CLAUDE.md`를 갱신한다.

Git을 초기화한 뒤 `python tools/aidd.py install-hooks`를 한 번 실행하면 `.githooks/post-merge`가 활성화된다. Codex에서는 `.codex/hooks.json`을 별도로 검토하고 신뢰해야 하며, Claude Code는 `.claude/settings.json`을 프로젝트 설정으로 읽는다.

## 수행 순환

1. 의도, 성과, 경계, 가정과 미결사항을 기록한다.
2. `DG-001`에서 배포 위치, DBMS, 인스턴스·확장, 워크로드, SLO·복구, 상태와 운영 제약을 확인한다.
3. 프로젝트 특성에 맞는 예측형·적응형·혼합형 수행 경로와 적용 통제를 선택한다.
4. 안정적인 ID를 부여하고 정본 레코드를 갱신한다.
5. 의미 있는 대안을 비교하고 채택한 결정을 기록한다.
6. 신규 시스템·모듈이나 핵심 기술 변경은 `TG-001`에서 기술 스택을, 기능 규모 개발 전에는 `TG-002`에서 UI·개발 공통 기반과 동시성·성능·장애 검증을 확정한다.
7. 정본에서 계획과 사람이 읽는 산출물을 생성한다.
8. 요구사항 단위의 작은 증분으로 구현하고 검증을 연결한다.
9. `validate`, 관련 테스트, 보안 검사와 릴리스 게이트를 실행한다.
10. 결과, 병합 영향, 운영 증거와 후속 작업을 기록한다.

전체 생애주기는 [방법론 청사진](docs/methodology/blueprint.md), 정본 규칙은 [산출물 모델](docs/methodology/artifact-model.md)을 참고한다. 배포 조건과 설계 위험은 [배포·운영 맥락과 설계 위험](docs/generated/deployment-and-runtime.md), 기술 선택 기준은 [기술 스택과 개발 기반 게이트](docs/generated/technology-gates.md), 방법론별 채택 근거는 [방법론 비교와 적용 지침](docs/generated/methodology-comparison.md)에서 확인한다.

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
.githooks/            선택적으로 활성화하는 Git 훅
```

자동 생성 문서에는 생성 안내가 표시된다. 해당 문서를 직접 고치지 말고 대응하는 `.aidd/ssot/*.json`을 변경한다.
