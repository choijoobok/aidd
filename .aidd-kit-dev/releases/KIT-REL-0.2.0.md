# AIDD Kit 0.2.0

출시일: 2026-09-19
구현 커밋: `cf8fb0c`
포함 변경: `KIT-CHG-001`

## 변경 내용

- Kit 원본 생명주기와 제품 프로젝트 생명주기를 분리했다.
- 허용 목록 기반 directory/ZIP export와 초기화된 제품 작업공간 생성을 제공한다.
- `kit-source`, `kit-template`, `product-workspace` 역할을 명시하고 bootstrap·역할 정합화 경로를 제공한다.
- Kit 관리팀 가이드·관리 전용 스킬·변경/결정/검증/릴리스 기록을 프로젝트 배포물에서 격리했다.
- 대화 원문은 모든 역할에서 Git 무시 루트 `chat-history/`에만 로컬 기록한다.

## 사용자 영향과 호환성

- 새 제품은 Kit 원본을 복사하지 않고 export된 템플릿 또는 `new-project`로 시작한다.
- 기존 제품 정본과 `.ai/tools/aidd.py` 명령 구조는 유지된다.
- 이전 템플릿에서 정본만 만들고 역할 표식이 남은 경우 `project-reconcile-role`로 정합화한다.
- 기존 Kit 원본의 `project/` 경로에 의존한 개인 자동화는 export 또는 fixture 경로로 바꿔야 한다.

## 보안·배포 정책

- Kit 관리 전용 파일·스킬·검증 fixture는 export 허용 목록 밖에 둔다.
- `.aidd-kit-origin.json`은 provenance-only이다. 자동 업그레이드, patch/merge 적용, 프로젝트→원본 역동기화는 제공하지 않는다.

## 검증과 승인

- 작업 트리 검증: `KIT-EVD-001`, `KIT-EVD-002`, `KIT-EVD-003`
- C2 독립 검토: `KIT-EVD-004` — 승인, 차단 발견사항 없음
- 구현 커밋에서 Kit 경계 검증, harness self-test, Kit 테스트 87개, portable 테스트 26개가 통과했다.

## 알려진 제한과 롤백

- 원격 CI·브랜치 보호·push·호스팅 제공자 승인 상태는 로컬 릴리스 증거에 포함하지 않는다.
- 문제 발생 시 `cf8fb0c`을 되돌리고 `KIT-CHG-001`을 후속 변경으로 다시 열어, 배포된 프로젝트에는 변경 설명서를 통해 필요한 수정을 안내한다.
