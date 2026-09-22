---
name: aidd-status
description: 정본 레코드에서 정확한 경영진·모듈·항목 수준 AIDD 프로젝트 브리핑을 만든다. 진척, 차단사항, 위험, 미결 결정, 다음 작업, 릴리스 준비도 또는 모듈 상세 현황 요청에 사용하며 대화만으로 완료를 추정하지 않는다.
---

# AIDD 상태 브리핑

모듈별 정본 조회·전문 명령·게이트는 [v2 통합 계약](../../../.ai/spec/specialty-integration.md)을 적용한다. 현재 owner/CHG 범위를 먼저 고르고 공통 정의를 참조한다. 쓰기 명령에는 고유 operation을 사용하며 사용자 결정·현재 유효성·실제 실행을 구분한다.

v2의 status.discovery는 선행 시스템·업무 분석 준비도이고 evaluations는 요구·개발·출시 준비도다. 두 상태를 구분하여 SYS/CAP/ACT/UC/BPR의 누락·미검토·stale와 다음 보완 대상을 먼저 알린다. 요구가 아직 없다는 이유로 업무 분석의 진척을 숨기거나, 업무 분석 ready를 설계/개발 ready로 표현하지 않는다.

레거시 분석 CHG는 status.legacy_reviews의 현재 수용·미완료·stale·다음 검토 단계와 coverage_gaps를 함께 표시한다. 상세 내용/출처는 legacy-review, 현재 자료 차이는 legacy-source-check로 확인한다. 읽기 전용 브리핑 요청만으로 질문/승인/재분석 채택을 저장하지 않는다. 수집률·문서 생성·검토 수용을 실제 제품 검증이나 운영 완료로 합치지 않는다.

status.legacy_adoptions는 모듈별 문서 준비·채택 current/stale·실제 테스트 not_run/passed/failed/stale을 분리한다. 이 출력은 저장된 자료 기준이며 source_check.checked=false를 숨기지 않는다. 현재 자료까지 확인하려면 legacy-adoption-check를 읽기 전용으로 실행한다. 운영 REL은 별개이며 문서 채택을 테스트·출시 완료나 개발 게이트 면제로 표현하지 않는다.

owned-records-v2에서는 `.ai/spec/owned-records-v2.md`의 브리핑·문서·제출 계약을 먼저 읽는다. `status`와 생성 문서는 같은 evaluator 결과를 쓰며 운영 이력/주기/작업 실행과 현재 준비도를 구분한다. `generate --module`과 소유 output manifest로 다른 모듈을 보존하고 `documentation-check`로 대상 전체 파일/내용을 비교한다. 제출은 DLP와 `delivery-build`를 사용하며 실제 화면 증거/목업, 내부/최종 사용자 경계를 검증한다. 미구현 전문 명령을 통과로 표시하거나 구형 전역 writer로 우회하지 않는다.

1. 세션 시작에는 `node .ai/tools/aidd.mjs validate`와 `node .ai/tools/aidd.mjs status --level executive`를 확인해 짧은 현황 브리핑부터 제공한다. `MRG` 영향 평가 또는 `MRC` 재검토 대기가 있으면 병합 알림을 진척과 분리해 먼저 알린다. Git 상태는 `integration-status`, 모듈 상세는 `--level module --module MOD-ID`, AI 평가 슬롯은 `evaluation-status`를 사용한다.
2. 검증 불일치를 숨은 도구 세부사항이 아니라 프로젝트 상태 문제로 보고한다. 상태 명령의 결정론적 개수와 목록을 다시 추측하지 않는다.
3. 현재 단계, 배포 프로필, 게이트 정책과 변경별 `GTR` 통과 현황, 최신 HIS·ADR·CHG 결정, 구조화된 증거, 차단사항, 주요 위험과 다음 결정을 먼저 제시한다. OI와 DRQ의 `draft`·`awaiting_decision`·`deferred`를 별도 개수로 보고한다. 배포 위치·DBMS·인스턴스·확장·SLO·RTO·RPO가 미정이면 설계 영향과 결정 기한을 표시한다.
4. 증거로 완료된 작업, 진행 중인 작업, 계획된 작업과 알 수 없거나 논쟁 중인 상태를 구분한다.
5. 진척률을 제시한다면 산정 규칙을 밝힌다. 오해를 부르는 단일 백분율보다 상태·위험별 개수를 선호한다.
6. 기록된 배포·기술 기준선이 있으면 이후 변경을 포함하고, 적용 설계 위험과 검증 증거, `MLS`·`WRK`·`IFC`·`DPN` 기준의 다음 실행 범위와 의존성을 제시한다. 담당자와 일정은 AIDD 밖의 프로젝트 운영 정보로 취급한다.
7. 대기 `MRC`에 사전 담당자를 요구하지 않는다. 완료된 `MRC`만 자유문자로 기록한 실제 수행 주체·시각·결과·증거를 표시한다. 파일 동등성 검증을 AI 행동 동등성으로, 로컬 ruleset을 원격 보호 활성화로 표현하지 않는다.
8. 기록된 다음 작업을 바탕으로 권장 흐름을 제안하고, 모든 미응답 DRQ의 건수·묶음 수를 보고한다. 브리핑 마지막에는 `aidd-decision-management`의 차단·명시적 우선순위·대기 시각 기준으로 선택한 권장 질문 묶음을 표시한다. 상태만 요청했다면 답변을 강요하지 않으며 상세 뷰에서 나머지 큐도 확인할 수 있게 한다.
9. 포트폴리오에서 모듈, 요구사항·테스트 증거까지 추적할 수 있도록 안정적인 ID를 사용한다.

대상별 내용은 [references/briefing-views.md](references/briefing-views.md)를 읽는다. 보류·예외·병합 후 재검증은 [references/pending-work.md](references/pending-work.md)의 별도 상태로 보고하며 완료 상태에 숨기지 않는다.
