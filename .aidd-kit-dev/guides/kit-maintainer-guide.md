# AIDD Kit 관리 가이드

이 저장소는 `kit-source`다. portable 기능은 `.ai/`, Kit 관리 기록·export·fixture는 `.aidd-kit-dev/`에 둔다. 루트에 제품 `project/`를 만들지 않는다.

## 빠른 작업 흐름

1. 변경할 명세와 구현·가이드를 함께 확인한다.
2. 스킬 변경이면 `node .aidd-kit-dev/tools/kit.mjs sync-providers`를 실행한다.
3. `node .aidd-kit-dev/tools/kit.mjs check`와 변경한 영역의 test 파일을 실행한다.
4. export, 새 프로젝트, provider 정의를 변경했을 때만 `node .aidd-kit-dev/tools/kit.mjs smoke`를 추가한다.
5. C2·C3은 별도 시각으로 변경과 결과를 한 번 읽고 기록한다.

`check`는 JSON, 필수 파일, 용어 기준 해시, provider 스킬 동기화와 Kit 역할 경계만 확인한다. `smoke`는 허용 목록 export와 representative `new-project`를 조립한다. fixture 전체 비교와 전체 테스트는 일상 게이트가 아니며, 특정 문제를 재현하거나 generator를 크게 바꿀 때만 선택적으로 실행한다.

## 훅과 용어

provider 훅은 세션 요약, 배선 self-test, 생성물 직접 수정 보호, 용어 변경 뒤 현행화, 로컬 대화 로그를 제공한다. 훅은 승인 게이트, 재시작, Git 서명, 외부 trust-root를 요구하지 않는다.

프로젝트 용어는 `term-propose → term-impact → term-decide → term-close`로 관리한다. `TIR`과 `TAP`은 업무 이력을 남기며, 확정 전 proposed 용어는 분석 기록에만 쓴다. end-user DLP에는 고객 공개이며 `end_user` 독자인 용어집만 조립한다.

## 기록과 배포

새 작업은 `KIT-CHG`로 추적하고, 되돌리기 어려운 선택만 `KIT-ADR`로 남긴다. 실행한 검증과 잔여 위험은 간결한 release note에 기록한다. 과거 기록은 보존하지만 새 기준선의 check를 막지 않는다.

`kit.mjs export`와 `new-project`는 `.aidd-kit-dev/export-manifest.json` 허용 목록만 사용하며 기존 대상은 덮어쓰지 않는다. 변경은 문제, 의도, 구현, 검증, 위험, 롤백을 포함해 공유한다.
