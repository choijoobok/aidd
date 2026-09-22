# Unreleased changes

- `KIT-CHG-018 / S09~S10` — 신규 프로젝트를 v2-only 정본·index·초기 파생 문서로 생성하고 mixed legacy SSOT와 기존 출력 덮어쓰기를 거부한다. directory/ZIP payload 동등성, 프로젝트/Kit CI, S08 잔여 59개와 요구 21개·인수 기준 63개·시나리오 22개의 최종 연결을 확인했다. 현재 적용 요구 20개/기준 60개는 verified, 이전 AIDD 전용 변환 요구 1개/기준 3개는 KIT-ADR-011로 superseded다. 전체 회귀 150/150과 Kit/provider 검사가 통과했고 실제 릴리스 준비·태그·배포는 미수행이다. [S10 기록](../plans/modular-lifecycle/checkpoints/S10.md)

- `KIT-CHG-018 / S08B-3` — 한 모듈 CHG의 문서 준비·명시 채택과 기존 구현의 실제 검증 결과를 분리했다. DOC/HIS만 채택 기록하고 기존 정본/운영 이력·정상 개발 게이트를 보존한다. 신규 15건 포함 전체 회귀 146/146 및 Kit/provider 생성 검사 통과. 실제 고객 시스템 실행/도입·릴리스는 미수행이다. [S08B-3 기록](../plans/modular-lifecycle/checkpoints/S08B-3.md)
- `KIT-CHG-018 / S08B-2` — 앞단부터 항목별 순차 검토·부분 응답·오래된 승인 방지와 생성 기준/사용자 수정/새 제안의 세 버전 비교·명시 채택을 추가했다. 재검토 OI/영향 IMP, 선언된 레거시 소스 루트와 staged 검사, 브리핑/파생 문서를 연결했다. 신규 14건 포함 전체 회귀 131/131 및 Kit/provider 검사 통과. 모듈 도입 준비·실행 검증 연결은 S08B-3에 남는다. [S08B-2 기록](../plans/modular-lifecycle/checkpoints/S08B-2.md)
- `KIT-CHG-018 / S08B-1` — 일반 레거시 파일 인벤토리·출처/관측 기반 정본 초안·안전한 생성 전용 적용을 추가했다. 추정/충돌·사용자 편집·미승인 상태를 보존하며 기존 인덱스/문서/게이트와 연결한다. 당시 신규 14건 포함 전체 회귀 117/117 및 Kit/provider 검사 통과. 후속 검토·재분석은 S08B-2에 연결된다. [S08B-1 기록](../plans/modular-lifecycle/checkpoints/S08B-1.md)

- `KIT-CHG-018 / KIT-ADR-011` — 사용자 결정으로 이전 AIDD 버전 전용 후보 변환 구현을 제외했다. 신규 v2 프로젝트·배포 검증과 일반 레거시 소스/문서 분석은 유지한다. S09 범위를 축소했으며 실제 도구·제품 원본을 삭제하거나 변환하지 않았다.

- `KIT-CHG-018 / S08A` — 접속·초기 화면·인증·인가를 선행 정책으로 정의하고 역할/UC 규칙·요구 출처·검토/기준선·영향·문서에 연결했다. 공개형·혼합형과 비웹을 지원하며 로그인 자체를 강제하지 않는다. 신규 11건 포함 전체 회귀 103/103 및 Kit/provider 검사 통과. 이전 검토의 자동 승격 없이 ID/이력을 보존한다. [S08A 기록](../plans/modular-lifecycle/checkpoints/S08A.md)

- `KIT-CHG-018 / S08` — 전문 CLI·17개 스킬·참조/가이드·provider 연결, DG/TG 의미 복원과 RL-001, DRQ 묶음·병합·가정·문서 staged·명시적 의존 영향 연결을 보완했다. 회귀 92/92 및 check/smoke/self-test 통과. 기존 367개를 유지 208/수정·재생성 100/S09 잔여 59로 대응. 실제 provider 행동은 not_run, S09 승인 대기. [S08 기록](../plans/modular-lifecycle/checkpoints/S08.md)

- `KIT-CHG-018 / S07A` — 시스템·핵심 업무·업무 역할·UC·프로세스 정본과 현재 사용자 검토, 요구 출처·흐름 포괄성, 변경 영향·오프라인 흐름도·공통 문서·내부 제출을 추가했다. 기존 승인본/ID/이력은 유지한다. 새 준비 조건은 기존 v2 검토의 자동 승격을 허용하지 않는다. 전체 회귀 78/78 및 Kit 경계 검사 통과. [S07A 기록](../plans/modular-lifecycle/checkpoints/S07A.md)

- `KIT-CHG-018` — APR-004에 따라 S04~S07의 소유 정본·인덱스/복구·요구 검토/기준선·기능/화면/목업/개발·영향·브리핑/산출물 핵심 경로를 구현·검증했다. S08 전문 명령/provider 전수 통합, S09 명시적 전환, S10 최종 인수는 미완료다. major/in_progress와 버전 1.0.0을 유지하며 실제 출시하지 않았다. [계획과 재개 안내](../plans/modular-lifecycle/README.md)
