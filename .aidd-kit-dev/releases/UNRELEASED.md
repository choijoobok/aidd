# 미출시 변경

## KIT-CHG-001 · Kit 생명주기와 제품 프로젝트 생명주기 분리

상태: 독립 검토 대기(`in_review`)

### 변경 내용

- 루트 `project/`를 제거하고 기존 정본·문서·작업 이력을 관리 전용 회귀 fixture로 보존했다.
- `kit-source`, `kit-template`, `product-workspace` 역할과 packaging-controlled 역할 표식을 도입했다.
- Kit 관리팀 가이드와 프로젝트 수행팀 가이드를 분리했다.
- 허용 목록 기반 directory/ZIP export와 초기화 프로젝트 생성 기능을 추가했다.
- Kit 관리 전용 export 도구·스킬·이력 전체를 프로젝트 배포에서 제외했다.
- 자동 업그레이드와 프로젝트→원본 역동기화를 제공하지 않고 변경 설명서를 통한 독립 구현 원칙을 명시했다.
- 모든 역할의 로컬 대화 원문을 Git 무시 루트 `chat-history/`에 기록하도록 통일해, 빈 `kit-template`이 대화 기록만으로 `project/`를 만들지 않게 했다.
- `project-bootstrap`이 성공하면 역할 표식을 `kit-template`에서 `product-workspace`로 전환하고, `kit-source` 내부에서 제품 `project/`를 만드는 실행은 차단했다.
- 이전 템플릿에서 정본은 만들었지만 역할 표식이 남은 경우에는 `project-reconcile-role`이 정본 검증 후에만 역할을 정합화하도록 했다.

### 호환성과 주의

- Kit 원본 관리 명령은 `.aidd-kit-dev/tools/kit.py`를 사용한다.
- 실제 프로젝트의 `.ai/tools/aidd.py` 명령과 제품 정본 구조는 유지된다.
- `.aidd-kit-origin.json`은 provenance-only이며 업데이트 호환성을 보장하지 않는다.
- 기존 Kit 소스 체크아웃의 `project/` 경로를 직접 참조한 개인 자동화는 새 export 또는 fixture 경로에 맞춰 수정해야 한다.

### 검증

- 작업 트리 기준 검증은 `KIT-EVD-001`에 기록했다.
- 역할 독립 대화 이력과 export 템플릿 bootstrap 회귀 검증은 `KIT-EVD-002`에 기록했다.
- bootstrap 역할 전환과 기존 `PERSONAL-BLOG` 작업공간 정합성 검증은 `KIT-EVD-003`에 기록했다.
- C2 독립 검토가 남아 있으므로 아직 릴리스 또는 완료로 선언하지 않는다.
