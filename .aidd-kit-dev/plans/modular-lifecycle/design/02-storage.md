# 02 — 저장·조회·인덱스·복구

요구 연결: 007~010, 014, 017, 020. 결정 제안: KIT-ADR-006, 008.

## 1. 목표 디렉터리

```text
project/
  .aidd/
    ssot/
      project.json                         # v2 저장 형식 표시·프로젝트 정의
      common/<TYPE>/<ID>.json               # 공통 소유의 현재 정본
      modules/<MOD-ID>/module.json          # MOD 정의
      modules/<MOD-ID>/<TYPE>/<ID>.json      # 모듈 소유의 현재 정본
    index/
      index.json                           # 모듈/공통별 인덱스 진입점
      owners/<owner-key>/index.json         # 유형별 진입점
      owners/<owner-key>/<TYPE>.json        # ID·경로·요약·관계 메타데이터
      README.md                            # 사람이 읽는 계층 탐색
    snapshots/records/<ID>/<blob-hash>.json  # 검토/기준선의 불변 원문
    work/transactions/<operation-id>/       # 작업 저널·전후 임시본, 정본 아님
    work/write.lock/                       # 일반 CLI의 협력 쓰기 잠금
  docs/generated/
    index.md
    modules/<MOD-ID>/index.md
    modules/<MOD-ID>/<TYPE>/<ID>.md
    common/<TYPE>/<ID>.md
    ui/modules/<MOD-ID>/<SCR-ID>/...
    manifests/<scope-key>.json
```

- 현재 정본 검색 루트는 ssot 두 소유 영역과 project.json만이다. index/snapshots/work/generated는 현재 레코드 로더의 재귀 검색 대상이 아니다.
- project.json은 storage_format=`owned-records-v2`와 schema_version=2를 명시한다. 구형 혼합 파일을 발견하면 v2로 추측해서 합치지 않는다.
- MOD 자체는 module.json, 다른 모든 최상위 레코드는 TYPE/ID.json 규칙을 따른다. 파일명과 내부 ID/type/owner 불일치는 오류다. ID는 프로젝트 전체에서 유일하며 대소문자 차이에 기대어 중복을 허용하지 않는다.
- project 소유 key는 `project`, 모듈 소유 key는 MOD ID다. 루트 이탈·상위 이동·symlink/junction 경로는 쓰기 전에 정규화/실경로로 확인하고 의도한 작업공간 밖으로 따라가지 않는다.
- HIS/TCH도 소유 경계의 ID 파일로 옮긴다. 시간 정렬은 인덱스가 제공한다. 기록의 기존 ID·발생 시각은 보존한다.
- 큰 JSON에 여러 레코드를 담는 구형 배열은 신규 작성 형식에서 사용하지 않는다. 함께 검토하는 하위 속성은 동일 파일의 안정 key로 둘 수 있다.

## 2. 인덱스 계약

인덱스는 검색을 빠르게 하는 파생물이며 정본이 아니다. 각 항목은 id/type/title/owner/path/revision/definition_hash/blob_hash, 정의 관계, lifecycle, 요약 상태와 그 계산 입력을 담는다. 현재 준비도는 stale한 요약을 정답으로 사용하지 않는다.

- project index → owner index → type shard → item 순으로 찾는다. 한 shard가 권고 크기를 넘으면 ID 사전순 범위 페이지로 나누고 owner index가 목록을 안내한다. 수동 링크 중복 작성은 없다.
- 인덱스 갱신은 일반 저장 완료 시 영향을 받은 소유/type shard를 갱신한다. 관계의 역방향 조회는 원본 정방향 관계에서 계산한다.
- 알려진 파일의 mtime/size는 빠른 탐색 힌트일 뿐 내용 무변경의 증거가 아니다. 엄격한 게이트는 해당 범위 실제 바이트를 읽고 hash를 대조한다. 동일 mtime/size 위장·직접 편집도 대상 범위 검사에서 검출한다.
- 새/삭제/이동 파일을 찾기 위해 전체 현재 정본의 경로·메타데이터 목록은 확인할 수 있다. 무관한 모듈의 본문을 전부 파싱하는 것과 구분한다. 파일명 ID 중복은 이 단계에서 검출한다.
- `index-check`는 읽기 전용으로 누락/낡음/오류 범위를 보고한다. `index-rebuild`는 명시적 쓰기이며 정본 오류를 수정하지 않는다. 일반 status/record-read가 인덱스를 조용히 저장하지 않는다.
- 인덱스가 없는 범위는 제한적인 파일 탐색으로 본문을 찾아 조회할 수 있지만 `index_stale`을 표시한다. 진입 검사는 임시 메모리 인덱스로 범위를 완전히 검증하거나 갱신 필요로 실패하며 빈 범위로 통과하지 않는다.
- 한 owner의 파싱 실패는 그 shard의 오류로 남긴다. A의 비의존 B 오류는 A 상세 열람을 막지 않는다. 전역 validate는 B 오류를 보고하며 B를 실제 소비하는 A의 게이트는 unknown/blocked다.
- 전역 incoming 영향 탐색은 모든 소비 후보 shard의 최신 관계 메타데이터가 필요하다. 갱신되지 않은 소비 영역이 있으면 후보 탐색의 coverage를 incomplete로 보고하고 영향 없음으로 확정하지 않는다.

### 읽기 API

`readRecord(id)`는 대상 1건, `readScope({module|change|work|release}, {strict})`는 대상과 필요한 정의/증거 closure, `scanAll()`은 전체 검사다. 기본 내보내기 반환값은 `{records, diagnostics, coverage, snapshot_token, read_stats}`이다. unknown은 빈 배열로 대체하지 않는다. owner 이동도 ID로 찾는다.

## 3. 검토 당시 내용의 보존

- BSL/RVW/GTR/EVD가 참조하는 레코드 원문은 snapshots/records에 content-addressed 방식으로 보존한다. 해시 동일이면 재사용한다. 현재 정본 복제본이 아니라 역사적 입력이다.
- snapshot manifest는 snapshot 바이트 해시를 검사하고 참조가 없거나 손상되면 역사적 검토 내용을 복원할 수 없다고 보고한다. 현재 파일에서 과거 내용을 추측하지 않는다.
- 처음에는 자동 삭제/압축/보관 주기 정책을 도입하지 않는다. 저장량을 보고하고 정리 정책은 실제 규모가 필요해질 때 별도 변경으로 결정한다.
- 승인 저장 시 원문·입력 digest를 먼저 고정하고 검토 기록을 연결한다. 현재 정본은 계속 바뀔 수 있고 이전 REL/BSL은 원문을 계속 찾을 수 있다.

## 4. 협력 쓰기 트랜잭션

로컬 파일 환경을 유지한다. 모든 공식 쓰기 경로는 동일 일반 CLI 저장 API를 사용한다. **훅 런타임은 이 API를 import하지 않는다.**

1. operation_id와 대상 파일, expected_blob_hash(생성은 absent), 새 내용, 관련 현재 read-set의 기대 해시를 준비한다. 인덱스·스냅샷·HIS 등 파생/부수 쓰기도 명시한다.
2. mkdir의 배타성으로 짧은 저장소 쓰기 잠금을 잡는다. 경쟁 시 제한 시간 후 retryable conflict로 반환한다. 살아 있는 잠금을 임의 삭제하지 않는다.
3. 잠금 아래 read-set과 대상 원본 해시를 다시 확인하고 구조·소유·중복·적용 불변 조건을 검사한다. 다르면 아무 정본도 덮어쓰지 않고 충돌 대상과 현재 개정을 돌려준다.
4. 임시 전후 파일과 경로별 hash·phase가 있는 저널을 완성하고 flush한다. `prepared` 저널을 원자적으로 공개한 뒤 대상 파일을 교체한다. 같은 filesystem 안의 임시 파일/rename을 사용하고 Windows 교체·실패 의미는 실제 시험으로 확인한다.
5. 모두 기록되면 `committed`를 남기고 인덱스를 갱신한다. 인덱스 실패만 있으면 `canonical_committed/index_stale`로 구분한다. 성공 사실을 취소해 같은 승인/이력을 중복 생성하지 않는다.
6. 저장 중 오류는 해당 operation의 before 이미지로 원복하거나 `recovery_required`를 남긴다. 단순 프로세스 종료 후 미완료 저널은 다음 쓰기 전에 복구 대상으로 확인한다.
7. 같은 operation_id 재시도는 대상 요청 해시까지 같으면 이미 완료한 결과를 반환한다. 다른 요청이면 충돌이다. 실패 작업의 중복 HIS/RVW ID를 만들지 않는다.

- readers는 시작/종료 generation과 활성 저널의 touched 범위를 비교한다. 교차 범위를 읽었으면 재시도하거나 `incomplete_write`를 보고하고 게이트 통과를 금지한다. 무관한 확정 범위는 열람 가능하다. 저널 자체가 손상되어 범위를 모르면 안전하게 unknown을 보고한다.
- 복구 명령은 operation 및 예상 현재 hash를 요구한다. 이후 사용자 수정이 있으면 자동 원복하지 않고 충돌을 보고한다. stale lock 해제는 명시적 복구 흐름에서 소유 프로세스/저널 상태를 확인한 뒤 수행한다.
- 보장 범위는 같은 로컬 작업공간에서 공식 쓰기 명령을 사용하는 프로세스다. 일반 편집기의 비협력 동시 쓰기·네트워크 파일시스템·전원 장애의 완전 원자성을 약속하지 않는다. 직접 편집은 가능하되 이후 검사에서 드리프트를 확인하며, 승인/전환/다중 파일 결정 반영은 공식 트랜잭션을 권장한다.
- 잠금 직렬화는 성능 병목 후보지만 먼저 단순한 불변 조건을 지킨다. 독립 모듈 편집은 준비 단계에서 병렬 가능하며 짧은 저장만 직렬화한다. 필요 증거 없이 분산 DB·복잡한 모듈 간 잠금을 추가하지 않는다.

## 5. 회귀와 실패 주입

S04에서는 중복 ID, owner 이동, 누락 index, 새 파일, 동일 크기/시간의 본문 변경, 비의존 JSON 오류, optimistic conflict, prepared 직후/첫 파일 교체 뒤 종료, index 갱신 실패, 동일 operation 재시도, 복구 전 사용자 수정 사례를 시험한다. 무관한 모듈 본문 read 수가 0인지 계측한다. 파일 크기 경고는 분할 강제가 아닌 경고인지 별도로 확인한다.
