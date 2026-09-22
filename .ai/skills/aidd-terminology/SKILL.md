---
name: aidd-terminology
description: 요구분석·설계·구현 중 새롭거나 모호한 프로젝트 용어를 발견하거나 사용자가 용어집 추가·변경·제거, 유사 용어 구분 또는 결정용 용어 카드를 요청할 때 사용한다. 일상적인 문장 교정이나 AIDD 공통 용어 수정에는 사용하지 않는다.
---

# AIDD 용어 관리

모듈별 정본 조회·전문 명령·게이트는 [v2 통합 계약](../../../.ai/spec/specialty-integration.md)을 적용한다. 현재 owner/CHG 범위를 먼저 고르고 공통 정의를 참조한다. 쓰기 명령에는 고유 operation을 사용하며 사용자 결정·현재 유효성·실제 실행을 구분한다.

1. `.ai/manifests/terminology.json`의 공통 용어와 `project/.aidd/ssot/common/TRM/ 및 modules/<MOD>/TRM/`의 프로젝트 용어를 먼저 검색한다. 공통 용어를 프로젝트에서 재정의하지 않는다.
2. 요구·설계·데이터·API·화면·소스에 반복되거나, 해석에 따라 계약과 인수 기준이 달라지는 표현만 관리한다. 일회성 표현과 일반어는 등록하지 않는다.
3. 같은 뜻이면 별칭을 검토한다. 범위·책임·상태가 다르면 별도 용어와 판단 규칙을 정의한다. 외부 어휘는 `external`과 출처를 기록한다.
4. 용어·key, 개념 유형, 분류, 정의, 범위, 별칭, 예, 관련·혼동 용어, 독자, 공개 범위와 영향 후보를 정리한다.
5. `term-review`로 읽기 전용 영향 카드를 만든다. 이 단계는 용어 정본을 바꾸지 않는다. 사용자에게 용어 결정을 요청할 때는 `aidd-decision-management`로 OI를 만들고 영향 대상과 확인 카드 맥락에 연결된 DRQ를 먼저 저장한다.
6. 프로젝트가 회의나 자체 절차로 정의·범위·영향을 결정한다. AIDD는 결정자의 PM 역할이나 Git 신원을 확인하지 않는다. 결정 뒤 용어 정본·TCH를 적용하고 OI와 DRQ를 종료한다.
7. 영향받는 정본·문서·소스 주석을 현행화하고 `term-apply --decided-by "결정 주체" --summary "이유와 요약"`를 실행한다. 현재 `TRM`, 전후 값·영향·결정 주체·적용·검증을 담은 `TCH`, Markdown과 독자별 HTML 용어집 생성 및 `validate`를 한 흐름으로 완료한다.
8. 적용이 실패하면 완료를 선언하지 않는다. 충돌·잔존 표현·누락된 영향 위치를 해결하고 다시 적용한다.
9. 최종 사용자 용어집에는 `visibility: customer`이고 `end_user` 독자가 포함된 용어만 공개한다. 생성물은 직접 수정하지 않는다.

카드 항목은 [용어 확인 카드](../../../.ai/templates/artifact/terminology-workbook.md), 명령 예시는 [문서 관리 가이드](../../../.ai/docs/guides/project-team/03-document-management.md)를 따른다.
