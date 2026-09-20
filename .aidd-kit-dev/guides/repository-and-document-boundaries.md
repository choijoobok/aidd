# 저장소와 문서 경계

## 세 가지 실행 역할

- `kit-source`: 이 저장소. Kit 명세·구현·테스트·관리 기록·export를 관리한다.
- `kit-template`: 제품 정본이 아직 없는 배포 스냅샷이다.
- `product-workspace`: `project/.aidd/ssot/`와 제품 소스를 가진 실제 프로젝트다.

역할은 `.aidd-role.json`에 기록되고 export와 bootstrap이 전환한다. Kit 관리자는 `kit-source`, 프로젝트 팀은 `kit-template`과 `product-workspace`만 다룬다.

## Markdown 문서군의 역할

| 위치 | 독자와 역할 | 배포 | 직접 수정 |
|---|---|---|---|
| `.ai/spec/*.md` | portable 행동의 규범적 명세 | 예 | 명세 변경 시 |
| `.ai/docs/guides/**` | 프로젝트 팀의 사람용 사용법 | 예 | 프로젝트 관점 설명 변경 시 |
| `.ai/docs/methodology/*.md` | 산출물 모델·방법론 배경 설명 | 예 | 개념 모델 변경 시 |
| `.ai/skills/**/SKILL.md`, `references/*.md` | AI의 작업별 수행 계약 | 예 | `.ai/skills` 원본만 |
| `.ai/templates/**/*.md` | 프로젝트 상세 입력 워크시트 | 예 | 템플릿 계약 변경 시 |
| `.ai/hooks/README.md` | portable 훅 계약 안내 | 예 | 훅 책임·사용법 변경 시 |
| `.ai/tests/**/*.md` | 테스트 입력 또는 fixture 설명 | 예 | 해당 portable 테스트 변경 시 |
| `.aidd-kit-dev/guides/*.md` | Kit 유지보수 관리자 절차 | 아니요 | 관리자 작업 변경 시 |
| `.aidd-kit-dev/skills/**` | 관리자 전용 AI 수행 계약 | 아니요 | 관리 스킬 변경 시 |
| `.aidd-kit-dev/changes`, `decisions`, `releases` | Kit 기준선·결정·릴리스 이력 | 아니요 | 연결된 Kit 변경 시 |
| `.aidd-kit-dev/export/*.md` | 배포 루트에 놓을 프로젝트용 파일 원본 | 결과에 포함 | staging 원본으로 수정 |
| `.aidd-kit-dev/fixtures/**/docs/generated/*.md` | 회귀 fixture의 재생성 결과 | 아니요 | 직접 수정 금지 |

## 한 정보를 어디에 둘지

- “Kit이 반드시 어떻게 동작해야 하는가”는 `.ai/spec/`에 둔다.
- “프로젝트 팀이 그 기능을 어떻게 사용하는가”는 프로젝트 수행팀 가이드에 둔다.
- “AI가 특정 요청에서 어떤 순서와 금지사항을 따르는가”는 해당 스킬에 둔다.
- “관리자가 어떻게 export하고 검증하는가”는 이 관리자 가이드 묶음에 둔다.
- “현재 제품의 사실과 상태”는 제품의 `project/.aidd/ssot/`에 둔다.
- 동일한 절차를 여러 문서에 복사하지 않고 정본 링크와 짧은 맥락만 둔다.

## 같은 이름의 루트 문서

| 배치 위치 | `AGENTS.md` | `CLAUDE.md` | `README.md` |
|---|---|---|---|
| Kit 원본 루트 | Kit 관리 AI의 수행 계약 | portable·관리 스킬을 함께 쓰는 Kit 원본용 Claude 어댑터 | Kit 관리자용 시작점과 관리 흐름 |
| `.aidd-kit-dev/export/` 원본 → 배포 루트 | 프로젝트 수행 AI의 계약 | portable 스킬만 쓰는 프로젝트용 Claude 어댑터 | 템플릿 초기화와 프로젝트 팀 시작 안내 |

두 묶음은 대상 독자와 사용 가능한 도구가 다르므로 문장을 동일하게 복사하지 않는다. 공통 행동은 `.ai/spec/`와 `.ai/` 구현에 한 번만 정의하고, 각 루트 문서는 해당 역할에서 필요한 진입점과 금지 경계만 설명한다.

## 유지되는 분리의 이유

명세, 사람 가이드, AI 스킬과 템플릿은 같은 내용을 반복하는 파일이 아니다. 변경 책임과 소비 방식이 다르므로 물리적으로 분리한다. 대신 프로젝트 팀의 탐색 시작점은 `project-team-guide.md`, 관리자 탐색 시작점은 `kit-maintainer-guide.md` 하나씩으로 고정한다.

`aidd-kit-guide.md`는 과거 링크 호환을 위한 안내 파일일 뿐 별도 정본이 아니다. fixture의 생성 문서는 출력 비교를 위한 회귀 자료이며 현재 Kit 가이드나 현재 프로젝트 상태로 읽지 않는다.

## 변경 시 문서 영향 확인

1. 행동 계약이 바뀌면 `.ai/spec/`와 구현·테스트를 함께 본다.
2. 프로젝트가 수행하는 방법이 바뀌면 프로젝트 팀 가이드와 export 루트 문서를 본다.
3. 관리자 절차가 바뀌면 `.aidd-kit-dev/guides/`, KIT-CHG와 릴리스 기록을 본다.
4. 스킬이 바뀌면 `.ai/skills` 또는 관리자 스킬 원본을 고친 뒤 provider 복사본을 동기화한다.
5. generator 또는 fixture 정본이 바뀌면 생성물을 직접 수정하지 않고 재생성한다.
6. export 포함 여부가 바뀌면 export manifest와 실제 staging 결과를 함께 확인한다.
