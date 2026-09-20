---
name: aidd-kit-release
description: AIDD Kit 원본의 명세, export 허용 목록, 관리 전용 격리, 회귀 테스트와 릴리스 기록을 검증한다. kit-source를 변경·배포할 때만 사용하며 프로젝트 수행에는 사용하지 않는다.
---

# AIDD Kit Release

이 스킬은 `.aidd-role.json`의 role이 `kit-source`일 때만 사용한다. 다른 역할에서는 중단하고 프로젝트 수행 스킬을 사용한다.

1. `.aidd-kit-dev/guides/kit-maintainer-guide.md`와 연결된 `KIT-CHG`, `KIT-ADR`을 읽는다.
2. 변경이 해결할 실패, portable 명세, 구현, 테스트, 두 독자별 가이드와 export 경계에 미치는 영향을 확인한다.
3. 스킬이 바뀌었으면 `node .aidd-kit-dev/tools/kit.mjs sync-providers`를 실행하고 `node .aidd-kit-dev/tools/kit.mjs check`로 빠른 경계를 확인한다.
4. 폴더 export와 ZIP export가 같은 허용 목록을 쓰며 관리 전용 파일을 포함하지 않는지 확인한다.
5. 생성기·fixture·export·new-project·provider 경계가 바뀐 경우에만 `smoke`로 representative 프로젝트와 파생 문서 전체 비교를 확인한다.
6. 보안·권한·신원·서명 검사는 정본 요건 또는 사용자의 명시 요청이 있을 때만 범위에 포함한다.
7. 별도 evidence 파일이나 독립 재검토를 자동으로 만들지 않는다. 자동 업그레이드나 프로젝트→원본 역동기화도 추가하지 않는다.
