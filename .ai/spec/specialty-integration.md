# v2 전문 명령과 수행 계약

적용 형식은 `owned-records-v2`다. 일반 CLI의 내부 라이브러리는 공유하지만 runtime 훅에는 공유 라이브러리·dispatcher를 추가하지 않는다. 구형 정본은 v2에 혼합 저장하지 않으며 이전 AIDD 버전 전용 변환은 제공하지 않는다. AIDD와 무관한 레거시 시스템의 소스·문서 기반 분석/정본 작성은 별개 기능으로 유지한다.

## 저장과 재개

- 모든 정본은 `common/<TYPE>/<ID>.json` 또는 `modules/<MOD>/<TYPE>/<ID>.json`에서 ID로 찾는다. 모듈 한정 작업은 `record-list --module`, 공통 항목은 `--owner project`, 상세는 `record-read --id`로 조회한다. 인덱스·스냅샷과 생성물을 직접 수정하지 않는다.
- 전문 쓰기 명령은 기존 의미 옵션에 `--operation <고유-ID>`를 추가한다. 같은 요청 재시도에는 같은 operation을 쓴다. 다른 요청에 재사용하면 exit 3이다. HIS는 명시적 UTC `--occurred-at`을 요구한다. 날짜·원래 ID·supersedes·결정 주체를 보존한다.
- `term-review`는 읽기 전용이다. `term-apply`는 TRM과 append-only TCH를 한 트랜잭션으로 저장한다. 삭제는 retired이며 과거 파일을 제거하지 않는다. 공통 용어 재정의, 이름/key 중복과 현재 정본·텍스트 소스의 잔존 사용은 차단한다. 이 검사는 의미 검토를 대신하지 않는다.
- term-apply와 record-history는 커밋된 정본에서 문서를 생성한다. 생성 충돌은 `canonical_committed: true` 오류로 보고한다. 정본 저장 성공과 파생 생성 실패를 구분하고, 생성 충돌을 해결한 뒤 `generate`·`documentation-check`를 다시 실행한다. 저장 이력을 지우거나 같은 요청을 새 작업 ID로 중복 적용하지 않는다.
- 전문 명령의 전체 용어 중복·병합·평가 조회는 보수적인 프로젝트 전체 검사다. 큰 프로젝트에서 단순 내용 조회는 모듈/ID별 명령을 우선한다. 불완전한 전체 조회는 전문 쓰기를 거부하며 무관한 모듈의 초안이 자동 ready를 만들지는 않는다.

## 게이트 의미와 범위

| 게이트 | 대상 | 의미 |
|---|---|---|
| BG-001 | CHG | 선행 시스템·업무 분석과 사용자 검토 |
| RG-001 | CHG | 해당 주기의 전체 요구·분석 목록·검토·기준선 |
| DG-001 | CHG | 배포·운영 맥락 |
| TG-001 | CHG | 기술 선택과 ADR |
| TG-002 | WRK | 적용 개발 기반 |
| FG-001 | WRK | 기능·화면·목업·테스트 설계와 개발 진입 |
| RL-001 | REL | 현재 조합의 실제 실행·통합 증거와 출시 준비 |

DG/TG를 요구사항/릴리스의 별칭으로 사용하지 않는다. REL을 다른 게이트로 판정하려 하면 오류다. 판정기 `owned-readiness-2.2-integration` 이전의 검토/GTR은 역사로 보존하되 자동 재승인하지 않는다.

출시는 REL의 RL-001뿐 아니라 각 CHG의 현재 RG-001, 각 WRK의 현재 FG-001 및 적용 대상인 DG/TG 실행을 요구한다. 각 실행은 자기 범위·단계 digest로 대조하며 REL의 digest를 다른 게이트에 강제로 사용하지 않는다. 기술 판정은 배포 맥락을, 기반 판정은 기술·배포 맥락을 함께 확인한다.

CHG.definition.gate_applicability의 `deployment`, `technology`는 `{status:known,value:[ID...]}` 또는 이유가 있는 `not_applicable`이다. 적용성은 사용자 scope 검토에 포함된다. 기존 환경을 재사용할 때는 해당 DEP/ARC를 참조하며 복제하지 않는다. 값이 미정이면 unknown이다.

DEP의 location/dbms/instances/workload/slo/recovery/state/operating_constraints, ARC의 choices/alternatives/tradeoffs/compatibility/decision_refs는 known/unknown/not_applicable 필드다. ARC decision_refs는 ADR ID 목록이고 관계로도 추적한다. 현재 design RVW가 필요하다. 개발 기반은 WRK.foundation_applicability/foundations의 BSL 참조이며 STD/GPH의 test/observability/deploy/rollback 및 현재 design 검토를 확인한다. 분야별 깊이·위험별 실험은 프로젝트가 정한 STD/TC/EVD로 추가한다. 자동 검사만으로 문서 내용의 충분성을 보증하지 않는다.

## 병합·가정·실제 평가

- integration-status/record-merge는 Git을 읽을 뿐 fetch/pull/merge/reset하지 않는다. HEAD가 실제 병합 커밋이 아니면 병합 기록을 발명하지 않는다. Git 훅의 자동 record-merge도 고유 operation이 필요하다.
- assess-merge의 영향 모듈과 MRC.applies_to를 연결한다. `--blocking`인 미완료 MRC는 관련 범위를 차단하며 다른 모듈의 독립 작업은 허용한다. 완료 시 실제 수행 주체·passed/failed·시각을 기록하고 테스트 재검토에는 현재 TC 해시에 맞는 EVD가 필요하다.
- add-assumption은 ASM과 due-gate/적용 범위를 기록한다. resolve-assumption은 결정·해결 사유와 HIS를 남긴다. 가정을 사용자 결정이나 증거로 대신하지 않는다.
- EVS는 평가 입력·fixture·루브릭이다. record-evaluation의 EVR은 플랫폼별 실행 이력이며 현재 EVS 해시에 맞는 `kind: provider_evaluation`, `mode: actual`, `environment: codex|claude`의 EVD를 요구한다. scores는 루브릭 개수와 같은 0~2 정수 목록이다. critical-violation이 있으면 passed를 기록할 수 없다. EVS 변경 뒤 이전 EVR은 stale다. 자동 테스트 fixture는 실제 provider 실행의 증거가 아니다.

## 문서·질문·초기화

documentation-check는 생성 파일 집합/전체 내용을 대조하고, --staged이면 SURF.source_patterns와 CHG.delivery_path를 연결한다. 기존 문서는 documentation_sources의 staged 정본 변경이 필요하다. 미문서 표면의 연기는 대상 문서와 due_milestone/due_release를 갖춘 documentation WRK에 연결해야 한다. 빈 후속 작업 목록은 통과하지 않는다.

DRQ.definition.status는 draft/awaiting_decision/deferred/resolved/withdrawn, execution.status는 planned/in_progress/blocked/completed/cancelled로 분리한다. OI/DRQ.applies_to는 실제 영향 ID다. 수용된 현재 검토는 review-record로 RVW/HIS와 명시적 resolve 대상만 함께 종료한다. 보류는 완료가 아니다. status는 답변 대기 건수·묶음 수와 우선 질문 묶음을 따로 반환한다.

init-module-ui/init-module-surfaces는 v2에 빈 전역 파일이 필요 없음을 명시하고 현재 ID와 작성 절차를 반환한다. 실제로 확인한 화면/표면만 CHG와 함께 record-put으로 작성한다. `add-module --with-ui`도 가짜 화면이나 승인 레코드를 생성하지 않는다. `delivery-glossary`는 glossary만 포함하는 DLP와 미존재 출력 경로를 요구한다. 여러 산출물 제출은 delivery-build를 쓴다.
