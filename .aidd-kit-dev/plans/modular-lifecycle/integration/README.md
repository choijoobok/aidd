# S08 현재 통합 지도

승인된 S03 자산 목록 367개는 수정하지 않았다. 현재 처리 지도는 아래의 10개 조각이며 경로별 처리·검증과 점검 당시 해시를 기록한다. 해시는 점검 시점의 스냅샷이고 이후 단계의 편집 잠금이 아니다. 범주별 계약 검토·기계 검사·관련 행위 회귀를 조합했으며 367개 파일 각각의 독립 행동 검증이나 실제 provider 평가를 뜻하지 않는다.

| 조각 | 범위 |
|---|---|
| [skills](assets/skills.json) | portable 17개·관리 스킬 및 참조/메타데이터 |
| [hooks](assets/hooks.json) | 독립 실행 파일·정책·계약 |
| [provider-copies](assets/provider-copies.json) | 원본에서 재생성한 두 provider 어댑터 |
| [public-contracts](assets/public-contracts.json) | 명세·방법론·독자별 가이드·manifest |
| [templates](assets/templates.json) | 입력 워크시트·스키마·사이트 |
| [runtime-tests](assets/runtime-tests.json) | 기존 도구와 회귀 |
| [root-and-export](assets/root-and-export.json) | 역할별 루트·export·CI/Git 연결 |
| [management](assets/management.json) | 관리자 기록·변경·릴리스 경계 |
| [fixture-source](assets/fixture-source.json) | legacy 회귀 입력, S09 새 기준 fixture 남음 |
| [fixture-generated](assets/fixture-generated.json) | 현재 공통 용어를 반영해 재생성·전체 비교 |

## 추가·보완 구현

- `.ai/tools/lib/specialty-operations.mjs`: 용어/이력/가정/병합/평가/문서 영향 전문 명령. 작업 ID·CAS·불변 기록을 사용한다.
- `source-documentation.mjs`: staged 제품 소스와 SURF/CHG/기한 있는 문서 WRK 연결. 빈 후속 작업·중복 CHG는 차단한다.
- readiness/lifecycle-operations: DG=배포, TG-001=기술, TG-002=기반 의미 복원, RL-001 분리, 범위별 실제 GTR 대조, 가정·병합 적용 범위.
- record-views: DRQ 의미 상태/실행 상태, 모든 답변 대기 묶음과 우선 묶음, 관련 공통 질문과 병합 재검토 분리.
- dependency-graph: CHG/WRK/REL/ARC의 명시적 ID 필드도 전파 관계로 포함. 공통 정의 변경 → 주기 → 작업 경로를 놓치지 않는다.
- `specialty-integration.test.mjs`: 정상/실패/중복 재시도·불변 이력·모듈 범위·실제 평가 계약·staged 문서·두 provider Windows 경로·질문 연속성.
- `s08-assets.test.mjs`: 기존 367개 전수 대응, 승인된 요구/설계 해시, 17개 스킬 공통 진입점 검사.

## 보존·후속 경계

runtime 훅의 수·이벤트·명령·등록 순서는 유지했다. Codex 후처리의 Windows 경로 정규화만 해당 독립 파일에서 보완했다. Git post-merge는 제품 v2 전문 명령의 operation을 전달하며 Git 통합 자체를 실행하지 않는다. 공통 용어 AIDD-TERM-042와 해시 잠금은 채택된 FEAT 정본 구조에 맞췄다.

S09_remaining은 S08 당시의 미처리 자산 표시다. APR-013의 S09에서 [S09 처리 기록](S09-disposition.json)으로 59/59 대응했다. KIT-ADR-011로 이전 AIDD 전용 후보 변환은 취소했고, 구형 공개 writer 격리와 v2 기준 fixture/스켈레톤/CI·배포 정리를 완료했다. 과거 자산 스냅샷은 현재 변환 구현 지시가 아니다. 일반 레거시 소스·문서 분석은 별개로 유지한다.

실제 Codex·Claude 프로젝트 수행과 브라우저 시각/접근성 평가는 not_run이다. fixture의 실제 모드 EVD는 검증기 입력 시험일 뿐 운영 증거가 아니다. 전문 명령 중 전체 중복/영향을 확인하는 경로는 scanAll을 사용하므로 모든 명령이 작은 범위만 읽는다고 주장하지 않는다.
