# Kit 릴리스 기록

각 릴리스는 `KIT-REL-<버전>.md`로 기록한다. 버전, 포함 `KIT-CHG`, 사용자 영향, 호환성, 알려진 제한과 롤백 방법을 간결하게 포함한다. 상세 실행 evidence는 기본 생성하지 않으며 실제 명령 결과는 작업 응답과 Git 이력으로 확인한다.

각 `KIT-CHG.version_impact`는 `none | patch | minor | major`이고, 미출시 변경의 최고 영향도가 다음 SemVer를 결정한다. `kit-release-plan`으로 결과를 검토하고 `prepare-kit-release`로 두 버전 정본, `released_in`, 릴리스 노트와 UNRELEASED를 함께 갱신한다. 커밋과 Git 태그는 자동 생성하지 않는다.
