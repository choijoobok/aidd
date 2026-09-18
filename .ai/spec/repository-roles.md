# 저장소 역할

저장소 역할은 `.aidd-role.json`으로 식별하며 사용자가 임의로 전환하는 실행 모드가 아니다. export와 bootstrap 도구가 역할을 결정한다.

## `kit-source`

AIDD Kit 자체를 개발·검증·출시하는 원본 저장소다. `.aidd-kit-dev/`의 관리 규칙, 변경 이력, export 도구와 관리 전용 스킬을 포함한다. 루트에 제품용 `project/`를 두지 않는다.

## `kit-template`

프로젝트를 아직 bootstrap하지 않은 배포 스냅샷이다. 이식 가능한 `.ai/`와 프로젝트 수행 규칙만 포함한다. Kit 관리 전용 파일은 포함하지 않는다.

## `product-workspace`

`project/`에 제품 정본·문서·소스를 가진 실제 업무 프로젝트다. 이 프로젝트는 export 시점의 Kit 사본을 자유롭게 수정할 수 있고 원본 Kit과 자동 동기화되지 않는다.
