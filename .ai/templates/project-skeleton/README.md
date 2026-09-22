# 프로젝트 작업공간

이 폴더는 AIDD Kit에서 `project-bootstrap` 명령으로 생성하는 제품 프로젝트의 경계다. Kit의 도구·스킬·방법론 문서는 루트에 남고, 제품의 정본·문서·소스는 모두 이 폴더 아래에 둔다.

```text
project/
├── .aidd/ssot/       제품 정본: 요구사항, 모듈, 설계, 테스트, 증거, 릴리스
├── docs/generated/   정본에서 생성한 문서·목업·매뉴얼·제출물
└── src/              제품 소스, 테스트, 설정과 제품별 운영 자산
```

처음에는 v2 정본과 초기 파생 문서만 있는 착수 지점이다. 이 상태는 사용자 승인이나 개발 준비 완료가 아니며, 기존 AIDD Kit의 제품 요구사항이나 결정 기록을 복사하지 않는다. 첫 AI 대화에서 제품 목적·범위·모듈·배포 맥락을 정의한 뒤 정본을 채우고 다음 단계로 전환한다.

기존 제품의 소스나 문서는 자동으로 이 폴더로 이동하지 않는다. 이동할 대상과 제외할 파일을 검토한 뒤, 결정된 범위만 `src/`와 필요한 제품 하위 폴더로 옮긴다.
# 모듈형 정본 v2

새 프로젝트는 `.aidd/ssot/project.json`과 `common/<TYPE>/<ID>.json`, `modules/<MOD>/<TYPE>/<ID>.json`으로 관리한다. `.aidd/index/`는 재생성 인덱스, `.aidd/work/`는 로컬 저장 저널, `.aidd/snapshots/`는 기준선 원문이다. 스냅샷은 Git 이력과 함께 보존하고 index/work는 Git에서 제외한다. `.ai/docs/guides/owned-records-workflow.md`를 먼저 읽는다. 이전 AIDD 형식의 전역 JSON 파일을 이 구조에 섞거나 자동 변환하지 않는다.
