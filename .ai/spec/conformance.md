# 적합성 기준

AIDD Kit 원본은 다음을 모두 만족해야 한다.

- `.aidd-role.json`이 `kit-source`이고 루트에 제품용 `project/`가 없다.
- 휴대 가능한 명세와 프로젝트 수행팀 가이드가 존재한다.
- Kit 관리팀 가이드·관리 스킬·export 도구·변경 및 릴리스 기록이 `.aidd-kit-dev/`에 격리된다.
- export가 허용 목록으로 조립되고 폴더·ZIP에 동일한 검증을 적용한다.
- 배포물에 `.aidd-kit-dev/`나 관리 전용 스킬이 없다.
- 배포물의 provider 스킬은 `.ai/skills/`와 동일하다.
- `new-project` 출력은 `product-workspace`이며 유효한 `project/.aidd/ssot/`를 가진다.
- portable·Kit 관리 실행 도구는 Node.js 22 이상과 Node 표준 라이브러리만 사용하고 별도 패키지 설치를 요구하지 않는다. provider 훅 입력은 원본 바이트를 UTF-8로 해석한다.
- provider 설정은 `.ai/tools/` 아래의 `.mjs` 실행 진입점만 참조하며 비-Node 실행기나 다른 확장자의 실행 경로를 포함하지 않는다.
- Windows provider 실제 명령과 레거시 코드페이지 조건에서 비 ASCII 훅 입력이 손실 없이 처리되는 회귀 검사가 통과한다.
- 소스 테스트, export 테스트와 배포물의 AIDD 테스트가 통과한다.

Kit 기능 변경은 명세·구현·테스트·가이드·변경 이력·릴리스 노트 영향을 함께 검토한다. C2·C3 변경은 구현 흐름과 분리된 독립 AI 또는 사람 검토 전에는 완료로 표시하지 않는다.
