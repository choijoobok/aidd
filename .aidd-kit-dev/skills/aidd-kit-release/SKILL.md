---
name: aidd-kit-release
description: AIDD Kit 원본의 명세, export 허용 목록, 관리 전용 격리, 회귀 테스트와 릴리스 기록을 검증한다. kit-source를 변경·배포할 때만 사용하며 프로젝트 수행에는 사용하지 않는다.
---

# AIDD Kit Release

이 스킬은 `.aidd-role.json`의 role이 `kit-source`일 때만 사용한다. 다른 역할에서는 중단하고 프로젝트 수행 스킬을 사용한다.

1. `.aidd-kit-dev/guides/kit-maintainer-guide.md`와 연결된 `KIT-CHG`, `KIT-ADR`을 읽는다.
2. 변경이 해결할 실패, portable 명세, 구현, 테스트, 두 독자별 가이드와 export 경계에 미치는 영향을 확인한다.
3. `node .aidd-kit-dev/tools/kit.mjs sync-providers` 후 `validate`를 실행한다.
4. 폴더 export와 ZIP export가 같은 허용 목록을 쓰며 관리 전용 파일을 포함하지 않는지 확인한다.
5. `new-project` 샘플의 role, 제품 정본, provider 스킬과 AIDD 검증을 확인한다.
6. C2·C3는 별도 세션의 독립 검토 전에는 완료나 출시 준비 완료로 표시하지 않는다.
7. 자동 업그레이드나 프로젝트→원본 역동기화를 추가하지 않는다. 개선은 변경 설명서로 공유한다.
