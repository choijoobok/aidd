# 배포 구조

모든 배포물은 `.aidd-kit-dev/export-manifest.json`의 허용 목록에서 조립한다. 폴더와 ZIP 출력은 동일한 임시 조립 디렉터리와 검증기를 사용한다.

배포물에는 다음이 포함된다.

- 프로젝트 수행 계약인 `AGENTS.md`와 provider 연결 설정
- 이식 가능한 `.ai/` 명세·스킬·훅·도구·템플릿·테스트
- `.ai/skills/`에서 생성한 `.agents/skills/`와 `.claude/skills/`
- 프로젝트용 Git 훅·CI·규칙 템플릿
- 출처만 기록하는 `.aidd-kit-origin.json`

다음은 포함하지 않는다.

- `.aidd-kit-dev/` 전체
- Kit 관리팀 가이드와 관리 전용 스킬·도구·변경·릴리스 기록
- 원본 저장소의 테스트용 제품 fixture
- 원본 저장소의 작업 로그·로컬 대화·IDE 설정·Git 이력

`.aidd-kit-origin.json`은 버전·원본 커밋·manifest·payload 해시를 기록하는 출처 표식이며 업그레이드 잠금이나 호환성 보증이 아니다.
