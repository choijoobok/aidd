# 변경과 검증

## 변경 시작

각 Kit 변경은 `KIT-CHG`에 다음을 간결하게 남긴다.

- 해결할 실패 또는 문제와 원하는 결과
- 영향받는 명세, 구현, 테스트와 독자
- portable 여부와 export 영향
- 호환성, 마이그레이션과 롤백
- 위험에 비례한 검증 방법

되돌리기 어렵거나 장기간 유지할 선택만 `KIT-ADR`로 분리한다. 실행 명령을 기록하기 위해 별도 evidence 파일을 기본 생성하지 않으며, 상세 과거 이력은 Git에서 조회한다.

## 검증 수준

### 1. 빠른 경계 검사

```powershell
node .aidd-kit-dev/tools/kit.mjs check
```

JSON, 필수 파일과 역할 경계, 공통 용어 해시, provider 스킬 동기화와 훅 배선을 확인한다. 구조 검사가 기능의 의미적 정확성을 증명하지는 않는다.

### 2. 변경 영역 행위 테스트

영향받은 test 파일 또는 이름 패턴으로 대표 정상·실패 동작만 확인한다.

```powershell
node .ai/tests/harness.test.mjs
node .aidd-kit-dev/tests/kit.test.mjs
```

위 명령은 예시다. 실제로는 변경한 계약을 포함한 가장 작은 파일이나 테스트 패턴을 선택한다. 전체 테스트는 공유 기반을 넓게 변경했거나 사용자가 요구한 경우에만 실행한다.

### 3. Smoke

다음 경계 중 하나가 바뀌었을 때만 실행한다.

- 파생 문서 generator 또는 renderer
- reference fixture의 정본·기대 결과
- export manifest, staging 또는 ZIP 조립
- `new-project` bootstrap 경로
- provider 스킬 또는 훅 어댑터

```powershell
node .aidd-kit-dev/tools/kit.mjs smoke
```

smoke는 허용 목록 export, 대표 new-project와 reference fixture 파생 문서 전체 재생성 비교를 수행한다.

## AIDD 요건 구현 검증

사용자가 AIDD 요건·스펙 구현 검증을 요청하면 `aidd-requirement-verification` 스킬을 사용한다.

- 적용 정본과 요청 범위를 먼저 고정한다.
- 규칙·스킬·훅·도구의 관찰 가능한 동작을 연결한다.
- 빠른 구조 검사와 변경 영역 행위 테스트만 기본 수행한다.
- 파생 문서는 현재 정본에서 다시 만든 전체 결과와 비교한다.
- 결과는 통과, 실패, 검증하지 않음으로 구분한다.
- 요청 밖 보안·권한·신원 검사와 새 승인·증거 절차를 추가하지 않는다.

## 문서 일관성 검토

문서 검토는 파일 수나 동일 문구 검색만으로 끝내지 않는다. 각 문서를 명세, 제품 정본, 파생 문서, 가이드, 스킬, 템플릿, fixture로 분류한 뒤 같은 개념의 의미·상태·명령·독자를 비교한다.

파생 문서는 생성기 결과 전체 비교가 우선이다. fixture 정본을 바꿨다면 fixture의 `docs/generated/`를 직접 고치지 않고 생성 명령으로 갱신한다. 과거 fixture의 증거 레코드나 명령은 회귀 입력일 수 있으므로 현재 Kit 정책으로 오인하지 않는다.

## 완료 판단

영향받은 명세, 구현, 테스트, 두 독자용 가이드, export manifest, 변경·결정·릴리스 기록을 확인한다. 실행하지 않은 검사는 실행하지 않았다고 밝히고, 관련 없는 전체 테스트나 감사로 완료 조건을 확대하지 않는다.
