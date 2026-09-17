# AIDD 프로젝트 템플릿 사용 가이드

이 문서는 AIDD 템플릿을 처음 사용하는 고객·프로젝트 책임자를 위한 학습용 안내서다. AI가 일을 대신 결정하는 도구가 아니라, 고객의 의도와 승인 아래에서 정본·증거·산출물을 일관되게 관리하는 작업 체계를 만드는 것이 목표다.

## 1. 새 프로젝트 만들기

1. 이 템플릿의 `.git` 폴더를 제외한 내용을 새 프로젝트 폴더로 복사한다.
2. `.gitignore`를 먼저 검토해 비밀키, 환경 변수 파일, 운영 데이터, 개인 설정이 포함되지 않았는지 확인한다.
3. Codex 또는 Claude Code로 새 폴더를 연다. Claude Code는 세션 시작 훅이, Codex는 공통 수행 계약이 `python tools/aidd.py project-init`을 실행한다.
4. 이 명령은 Git이 없는 경우 로컬 `main` 브랜치와 `.githooks`만 만든다. 파일을 자동으로 `git add`하거나 커밋하지 않고, 사람의 Git 이름·이메일도 자동으로 정본에 등록하지 않는다.
5. `python tools/aidd.py project-init-status`로 결과를 확인한 뒤, Git 사용자 신원과 최초 커밋에 포함할 파일을 검토한다.

Git이 설치되어 있지 않다면 먼저 설치해야 한다. 템플릿 관리 도구는 Python 표준 라이브러리만 사용한다. Node.js는 이 템플릿의 필수 조건이 아니라, React 등 선택한 제품 기술 스택의 요구사항일 때 추가한다.

## 2. 최초 기준선 커밋

초기화 자동화는 의도적으로 최초 커밋을 만들지 않는다. 다음을 고객이 확인한 뒤에만 기준선을 만든다.

```powershell
git config user.name
git config user.email
git status
git add <검토한 파일>
git commit -m "chore: AIDD 프로젝트 기준선"
```

Git 이름·이메일이 확인되면 AI에게 “이 Git 신원을 프로젝트 책임자(HUM-001)에 등록해줘”라고 요청한다. AI는 `collaboration-identity`로 `IDM` 매핑과 이력을 남긴다. 다른 사람의 이메일이나 CI 봇 계정은 사람을 자동 생성하지 않으므로, 기존 사람의 별칭·새 팀원·봇 중 무엇인지 먼저 확인한다.

## 3. 1인과 팀의 브랜치 흐름

| 상황 | `main` 직접 커밋 | 작업 브랜치 | 검토 |
|---|---|---|---|
| 1인 프로젝트 C0 | 허용 | 선택 | 보통의 자체 점검 |
| 1인 프로젝트 C1~C3 | 권장하지 않음 | 권장 | C2·C3은 분리된 AI 검토 또는 Codex·Claude 교차 검토 |
| 팀 프로젝트 | 금지 | 필수 | 작성자 외 활성 사람 최소 1명 승인 |

팀원이 합류할 예정이면 먼저 다음 변경용 작업 브랜치를 만든 뒤 `collaboration-member`로 합류를 기록한다.

```powershell
git switch -c feature/CHG-001-설명
python tools/aidd.py collaboration-member --id HUM-002 --name "팀원 이름" --role 개발자 --status active --reason "팀원 합류"
python tools/aidd.py branch-check --change CHG-001
```

활성 사람이 다시 한 명이 되면 1인 프로필로 자동 전환된다. 과거 참여·승인·전환 이력은 남고, 이후 변경부터 1인 통제가 적용된다. 로컬 pre-commit 훅은 팀 프로필에서 `main` 직접 커밋을 차단한다. 원격 PR·승인·병합 강제는 GitHub 규칙과 CI를 별도로 활성화·검증해야 한다.

## 4. 프로젝트를 AI와 시작하는 대화

처음에는 구현을 요청하기보다 목적과 맥락을 말한다. 예시는 다음과 같다.

> 신규 서비스로 시작할게. 대상 사용자는 누구이고 어떤 문제를 해결하며, 성공을 어떻게 측정할지 인터뷰해줘. 배포 환경과 DBMS는 아직 미정이니 미결사항으로 관리해줘.

AI는 요구 발굴, 대안 비교, 미결사항, 의사결정, 모듈·작업 분해, 배포·기술 스택 게이트를 정본에 연결해야 한다. 중요한 선택에서는 선택지별 장점·비용·위험·가역성과 추천 근거를 제시하고, 고객이 선택한 결과를 기록한다.

기존 시스템이라면 현재 기준선, 영향 모듈, 호환성 제약, 데이터·운영 환경을 먼저 제공한다. 새 기능·결함·마이그레이션을 각각 `CHG`로 추적하고, 기존 기능을 코드만 보고 추측하여 요구사항을 바꾸지 않게 한다.

## 5. 일상적인 확인 명령

```powershell
python tools/aidd.py status --level executive
python tools/aidd.py status --level module --module MOD-ID
python tools/aidd.py collaboration-status
python tools/aidd.py identity-check
python tools/aidd.py development-check --change CHG-ID
python tools/aidd.py branch-check --change CHG-ID
python tools/aidd.py generate
python tools/aidd.py validate
```

`docs/generated/`는 정본에서 파생되므로 직접 수정하지 않는다. 원하는 문서가 바뀌어야 한다면 AI에게 관련 `.aidd/ssot` 레코드를 먼저 갱신하도록 요청하고 생성한다. 반대로 제품별 UI·데이터 모델·인프라 문서는 해당 제품에서 적용 대상이 되면 정본과 링크해 추가한다.

## 6. AI 규칙은 별도 가이드가 필요한가?

별도의 중복 AI 가이드는 만들 필요가 없다. `.ai/core/agent-contract.md`와 `.ai/skills/`가 AI용 정본이며, `python tools/aidd.py sync-ai`가 이를 Codex의 `AGENTS.md`·`.agents/skills/`와 Claude Code의 `CLAUDE.md`·`.claude/skills/`로 동기화한다. 두 플랫폼용 파일을 따로 고치면 다음 동기화에서 덮어써지거나 검증에서 불일치가 난다.

AI 공통 규칙을 바꿀 때만 `.ai` 정본을 수정하고 `sync-ai`, `generate`, `validate`를 순서대로 실행한다. 이 문서는 사람의 학습과 프로젝트 시작을 위한 안내서이므로 AI 규칙의 또 다른 정본이 아니다.

## 7. 안전한 되돌리기와 문제 해결

- 잘못된 결정을 발견하면 기존 기록을 삭제하지 말고, 대체 결정과 롤백 경로를 연결한다.
- 미등록 Git 신원이 나오면 사람·기존 별칭·봇 중 무엇인지 확인한 뒤 매핑한다. 확인 전에는 C2·C3 개발 진입과 릴리스가 차단될 수 있다.
- 팀 전환 직후 `main` 커밋이 차단되면 오류가 아니라 정책 작동이다. `git switch -c feature/CHG-ID-설명`으로 작업 브랜치를 만들고 진행한다.
- 생성 문서가 오래되었다는 오류는 정본을 수정한 뒤 `python tools/aidd.py generate`를 실행해 해결한다.
- 원격 브랜치 보호가 실제로 활성화되었는지는 로컬 JSON 파일이 아니라 호스팅 제공자의 조회 결과와 증거로 확인한다.
