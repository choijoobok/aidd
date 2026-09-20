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
- provider 훅은 세션 요약과 배선 self-test, 생성물 직접 수정 보호, 용어 정본 변경 뒤의 현행화, 선택 가능한 로컬 대화 로그를 제공한다. 훅은 작업 승인·세션 재시작·Git 서명을 강제하지 않으며, 실패 시에는 해당 생성/현행화 작업만 사용자에게 알린다.
- 훅 신뢰 리비전은 Codex가 `/hooks`에서 검토·신뢰하는 provider 정의 `.codex/hooks.json`의 내용으로만 계산한다. 이 정의가 바뀔 때만 version 3 기존 세션을 stale 처리하며, 동일한 provider 정의를 유지하는 정책·실행기·계약·테스트·가이드 변경은 재승인을 요구하지 않는다. 이전의 넓은 리비전 범위를 사용한 version 2 상태에는 provider 정의 단독 해시가 없으므로 기존 `approved`를 승격하지 않고 현재 리비전의 `unconfirmed`로 한 번 마이그레이션해 fail-closed 확인한다.
- 신규 승인의 `restart_required`는 이를 만든 client kind에만 적용한다. Windows Desktop의 미완료 재시작은 같은 저장소의 새 CLI 세션이 `1` 또는 `2`로 자신을 승인하는 것을 막지 않으며, CLI 승인도 Desktop 재시작 표식을 제거하지 않는다.
- export된 Codex 훅의 모든 이벤트 명령은 Git 저장소가 아직 없어도 `codex -C "<프로젝트 루트>"`의 세션 작업 디렉터리를 기준으로 `.ai/` 실행기를 찾는다. 이때 `PreToolUse` 승인·파일·shell 보호는 실행 실패 시 허용으로 통과하지 않고 거부해야 한다.
- 승인 전 shell 읽기 예외는 합성·파이프·개행·리다이렉션·명령 치환과 따옴표 밖의 PowerShell `()`·`@()` 그룹/배열 식이 없는 단일 명령으로 제한하고, 읽기 명령의 쓰기 가능한 옵션도 차단한다. Windows package 또는 명시적인 Desktop origin은 앱으로, origin과 package가 모두 없는 실제 CLI 환경은 CLI로 식별하며 그 밖의 알 수 없는 origin에는 더 제한적인 새 세션 확인 절차를 적용한다. 최초 `unconfirmed`, 훅 리비전이 오래된 세션과 `restart_required` 상태는 모두 같은 읽기·훅 유지보수·관측 경로 close-out 예외를 사용한다.
- close-out의 `git add`는 옵션·경로 패턴·와일드카드·광범위 경로 없이 세션이 관측한 literal 경로만 명시해야 한다. 로컬 `git commit`은 메시지 인자 형식만 허용하고, 비어 있지 않은 staged 경로 전체가 관측 경로 집합 안에 있어야 한다.
- `generate`는 정본의 구조화 필드, 가이드 명령·절차와 합의된 문서 필수 항목을 의미 손실 없이 결정적으로 파생한다. 확인된 근거가 없는 필수 항목은 사실로 채우지 않고 미작성으로 표시한다. `validate`는 현재 renderer로 다시 계산한 내용과 정확히 다른 생성물과 더 이상 대상이 아닌 obsolete 생성물을 모두 거부한다.
- `.ai/manifests/terminology.json`은 배포되는 AIDD 공통 용어의 정본이며 Kit 기준 해시와 다르면 검증을 거부한다. 프로젝트는 이 ID·용어·key·별칭을 재정의하거나 변경할 수 없고, `project/.aidd/ssot/terminology.json`에는 프로젝트 전용 `TRM`, 변경 전 영향 검토 `TIR`, 사용자 승인 `TAP`, 승인 뒤 영향 반영 종료를 분리해 보존한다. TAP과 종료 이력에는 수행자와 시각을 기록하지만 Git 서명·외부 trust-root·attestation은 요구하지 않는다.
- 생성기는 공통 용어와 프로젝트 용어를 `project/docs/generated/glossary.md` 한 곳에 합쳐 사람이 읽게 하고 설계·운영 HTML에도 포함한다. 사용자 HTML과 end-user DLP 용어집에는 고객 공개 범위이면서 `end_user` 독자인 프로젝트 용어의 명칭·정의만 포함하며, source metadata·내부 추적성 ID·참여자 식별자·정본 경로를 포함하지 않는다. `glossary`를 포함하는 DLP는 `glossary.audience`를 `internal` 또는 `end_user`로 명시하고 `delivery-glossary`가 같은 필터의 용어집 전용 Markdown·오프라인 HTML·assets·manifest만 조립한다. proposed 용어는 분석 기록(open-items·assumptions·risks)에서 허용되지만 확정 계약·문서·제품 소스에서는 `validate`가 거부한다. 생성물 정합성은 프로젝트 `validate`와 변경 범위의 테스트로 확인하며 fixture 전체 비교는 `kit smoke`에서만 수행한다.
- 소스 테스트, export 테스트와 배포물의 AIDD 테스트가 통과한다.

Kit 기능 변경은 명세·구현·테스트·가이드·변경 이력·릴리스 노트 영향을 함께 검토한다. C2·C3 변경은 구현 흐름과 분리된 독립 AI 또는 사람 검토 전에는 완료로 표시하지 않는다.
