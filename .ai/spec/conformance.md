# 적합성 기준

AIDD Kit 원본은 다음을 모두 만족해야 한다.

- `.aidd-role.json`이 `kit-source`이고 루트에 제품용 `project/`가 없다.
- 휴대 가능한 명세와 프로젝트 수행팀 가이드가 존재한다.
- Kit 관리팀 가이드·관리 스킬·export 도구·변경 및 릴리스 기록이 `.aidd-kit-dev/`에 격리된다.
- export가 허용 목록으로 조립되고 폴더·ZIP에 동일한 검증을 적용한다.
- 배포물에 `.aidd-kit-dev/`나 관리 전용 스킬이 없다.
- 배포물의 provider 스킬은 `.ai/skills/`와 동일하다.
- `new-project` 출력은 `product-workspace`이며 유효한 `project/.aidd/ssot/`를 가진다.
- 소스 테스트, export 테스트와 배포물의 AIDD 테스트가 통과한다.

Kit 기능 변경은 명세·구현·테스트·가이드·변경 이력·릴리스 노트 영향을 함께 검토한다. C2·C3 변경은 구현 흐름과 분리된 독립 AI 또는 사람 검토 전에는 완료로 표시하지 않는다.
