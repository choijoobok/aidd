# 레거시 초안 검토와 재분석

[초안 생성 계약](reverse-engineering.md)의 후속 계약이다. 새 훅·DB·별도 업무 정본을 만들지 않고 기존 RVW/HIS/OI/DRQ/IMP와 transaction을 사용한다. 제품 실행·배포나 기존 AIDD 버전 변환은 포함하지 않는다.

## 순차 검토

`legacy-review --change CHG-ID [--limit 1..3]`는 현재 정본에서 시스템/핵심 업무·모듈 → 역할/접속 → UC/프로세스 → 요구 → 설계 순으로 검토 현황과 다음 묶음을 만든다. 앞 단계의 상세 누락이나 현재 사용자 수용이 남으면 뒤 단계 질문으로 건너뛰지 않는다. 누락 유형은 별도 표시하며 없는 유형을 비적용으로 결정하지 않는다. 실제 설계/개발 진입은 기존 게이트가 최종 판정한다.

각 항목은 현재 정의·definition hash·항목별 review input digest·출처/매핑·미정·상세 오류·현재 검토 상태를 포함한다. 최초 관측의 불확실성과 사용자가 보완한 현재 내용을 구별한다. SYS/CAP/ACT/POL/MOD는 intent, UC/BPR은 business_flow, REQ/NFR는 requirement, 설계 후보는 design 검토다. 묶음마다 모든 대상을 한 digest로 묶지 않아 부분 응답과 개별 stale을 구분한다.

`legacy-review-request --input FILE --operation ID` 입력은 `{packet,asked_at}`. 최신 packet의 최대 3개 항목에 OI가 먼저 존재하는지 확인하고 DRQ를 기록한다. asked_at은 실제 제시 시각이다. 이 명령을 실행한 AI는 해당 질문을 사용자에게 실제 제시해야 한다. 기존 같은 제시 해시의 미응답 질문을 중복 만들지 않는다.

`legacy-review-answer --input FILE --operation ID` 입력은 `{answers:[{request,result,note}],reviewer,occurred_at,decision_source:{kind:"user",reference}}`. result는 accepted/changes_requested/deferred/rejected, note는 현행 동작을 유지/개선/폐기할지 등 실제 사용자 판단 요약이다. 답한 대상만 RVW/HIS로 기록한다. 오래된 제시본의 답은 이력만 남기고 질문/OI를 종료하지 않는다. accepted라도 필수 상세가 미완성이면 OI는 열린 상태이고 다음 단계로 넘어가지 않는다. 보류/보완 요청은 완료가 아니다. 원문 대화를 정본에 복사하지 않는다.

OI는 영향 범위(applies_to)에 CHG를 포함할 수 있지만 초안의 사용자 검토 종료는 정확한 항목별 대상에만 적용한다. 이 전문 명령은 해당 subject의 legacy 검토 OI만 종료한다. 일반 CHG 범위 검토·요구 일관성·기준선·화면 목업 승인을 대신하지 않는다. 답변은 정본 내용을 자동 수정하지 않는다. 보완은 정상 record-put 후 새 제시본으로 검토한다.

## 세 버전 비교와 명시적 채택

`legacy-reanalyze --input analysis.json --inventory inventory.json --previous OPERATION`은 마지막 자동 생성본·현재 정본·같은 namespace/batch의 새 관측 초안을 비교한다. 최초 previous는 실제 레코드를 생성한 legacy-apply operation이며 no-op journal은 기준으로 쓸 수 없다. 이후에는 마지막 legacy-reconcile operation을 사용한다. 완료된 journal과 최초/후속 생성 기준 이미지에서 기계 생성본을 복원하므로 사용자 수정본을 새 자동 기준으로 오인하지 않는다.

비교 단위는 title·관계·definition의 최상위 필드다. 배열과 중첩 값은 한 필드로 취급한다. unchanged/source_only/user_only/converged/conflict 및 새 항목·현재 정본 부재·새 분석에서 누락을 구별한다. user_only는 보존하고, 양쪽이 다른 값을 바꾸면 conflict다. 실행 상태·승인 이력·lifecycle은 재분석으로 덮어쓰지 않는다. 소유자 이동은 정상 record-move로 별도 처리한다.

자료 경로 변경·파일 해시/선언 revision 변경·미지원/부분 스캔·삭제 가능성을 별도 목록으로 보여준다. 해시가 같아도 파일 이동의 업무 동일성을 자동 확정하지 않는다. 안정 key 매핑은 분석자가 보존/확인한다. 누락 정본은 자동 삭제/retired하지 않고 CHG의 기존 요구·업무·분석 목록도 자동 축소하지 않는다.

`legacy-reconcile --input FILE --operation ID` 입력은 `{plan,decisions:{ID:{choice,reason}},reviewer,occurred_at,decision_source:{kind:"user",reference}}`다. 생성/갱신 후보마다 current/proposed/merged 중 하나를 명시한다. merged는 충돌 없는 서로 다른 필드 변경을 결합하며 충돌이 남으면 거부한다. proposed는 해당 정의의 새 생성안을 선택한다는 명시적인 판단이므로 사용자 수정과의 차이를 먼저 보여준다. 삭제/누락은 current만 허용한다. 입력 plan/digest·current read set·출처를 다시 검사하며 한 transaction으로 적용한다.

적용 시 다음 재분석용 기계 생성본을 후보별 DOC(kind=legacy_generation)에 보존하고 DOC(kind=legacy_reconciliation) 영수증으로 연결한다. HIS에 사용자 채택·영수증 해시·대상을 불변 이력으로 기록한다. 이는 편집할 업무 정본이 아닌 재분석 기준 이미지이며 generated 필드에 원문 소스/사용자 승인/실제 증거를 넣지 않는다. 레코드별 32KiB를 넘으면 배치를 분할한다. 원래 정본·snapshot·RVW/BSL/REL은 보존한다.

현재 정의나 근거 입력이 달라진 업무 항목에 검토 OI와 pending IMP를 생성한다. IMP의 직접/간접 경로는 기존 impactGraph와 같으며 영향을 자동 없음으로 판정하지 않는다. 필요한 WRK만 기존 impact-apply로 명시 재개한다. 과거 운영 REL이나 다른 모듈의 독립 주기를 초기화하지 않는다. 정의가 같은 항목도 근거가 바뀌면 재검토가 필요할 수 있다.

## 문서·상태와 외부 소스 루트

status/파생 status와 `legacy-review`는 같은 검토 모델을 사용한다. 수집 건수·미정·미검토·stale·충돌/누락 확인과 실제 테스트는 별도이며 프로젝트 완료율로 합치지 않는다. 사용자 가이드/정본 문서는 기존 generate/documentation-check로 재생성한다.

documentation-check --staged는 프로젝트 저장소 안에 선언된 레거시 루트도 포함한다. 저장소 밖의 독립 루트는 Git staged 목록에 나타나지 않으므로 읽기 전용 `legacy-source-check --change CHG-ID`가 현재 인벤토리와 마지막 LDP를 비교한다. 새/수정/삭제 파일을 의미 변경으로 확정하지 않고 관련 관측·매핑·정본·작업의 영향 경로와 재분석 필요를 표시한다. 재수집은 어떠한 소스도 실행하지 않는다. Git 밖 루트가 있는 staged 결과에는 미검사 경계를 명시한다.

## 호환성과 복구

초기 legacy-apply의 생성 전용 계약은 바꾸지 않는다. 기존 v2 정본은 그대로 읽고 review/reanalysis 명령을 선택해서 사용한다. 기계 비교는 의미적 일관성 검토를 대체하지 않으며 불완전한 정본은 저장할 수 있어도 게이트를 통과하지 않는다. 쓰기 실패는 기존 transaction-status/recover를 사용하고, 같은 operation 재실행은 과거 결과를 반환한다. 완료된 적용을 되돌릴 때는 snapshot과 변경 경로를 확인하고 후속 사용자 편집·검토를 보존하는 정상 변경을 사용한다.
