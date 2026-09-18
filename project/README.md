# 프로젝트 작업공간

이 폴더는 AIDD Kit으로 수행하는 **한 개의 제품 프로젝트**의 모든 정본, 문서 산출물과 애플리케이션 소스를 모으는 경계다. 루트의 `tools/`, `.ai/`, `.agents/`, `.claude/`, `tests/`, `docs/methodology/`는 재사용 가능한 AIDD Kit 자체이며 제품 코드나 제품 산출물을 두지 않는다.

```text
project/
├── .aidd/ssot/       프로젝트 정본: 요구사항, 모듈, ADR, 테스트, 증거, 릴리스
├── docs/generated/   정본에서 자동 생성된 프로젝트 문서·목업·매뉴얼·제출 manifest
├── work-log/          Git으로 추적하는 일자·참여자별 작업 이력(YYYY-MM/YYYY-MM-DD/HUM-001.md)
├── chat-history/      AI 대화 원문(로컬 전용·Git 무시, YYYY-MM/YYYY-MM-DD.md)
└── src/              애플리케이션 소스와 제품별 테스트·설정의 최상위 경계
```

`docs/generated/`는 파생물이라 직접 수정하지 않는다. 변경은 `.aidd/ssot/`에서 한 뒤 저장소 루트에서 `python tools/aidd.py generate`와 `validate`를 실행한다.

`src/`의 내부 구조는 기술 스택·아키텍처를 확정한 뒤에만 만든다. 예를 들어 모듈형 단일 애플리케이션은 `src/app/` 또는 `src/modules/`를, 분리 배포하는 구조는 `src/frontend/`, `src/backend/`, `src/services/<service>/`를 사용한다. 인프라·데이터베이스·계약·운영 파일도 제품에 속하면 해당 제품 경계(`src/` 또는 별도 제품 하위 폴더)에 두고 정본의 ADR·모듈·인터페이스 ID와 연결한다.

현재 진행 중인 초점·다음 작업·관찰 항목은 `.aidd/ssot/workboard.json` 한 파일에서 관리한다. 장기 책임은 `.aidd/ssot/delivery-plan.json`의 `assignee`로 기록한다. 배정 단위는 여러 요구사항과 CHG별 필수 작업 영역을 묶는 작업 패키지(WRK)이며, 개발 슬라이스는 그 내부 실행 단위다. 기본 작업 영역은 설계·구현·시험·문서이고 프로젝트 맥락에 따라 보안·데이터·마이그레이션·배포·운영·교육을 추가한다. 팀 전환 전 활성 PM을 지정해야 하며, 팀 프로필은 PM 배정, PM 위임 배정 또는 오프라인 협의 기반 자율 배정을 선택할 수 있다. 오프라인 협의 필수는 자율 배정에만 적용된다. 팀원은 `work-check --work WRK-ID`로 자기 배정을 확인한 뒤 수행하며, 1인 프로필에는 배정 제한이 없다. 개발 중 파생된 요구가 현재 배정 범위 안이면 담당자가 현재 CHG의 REQ 및 WRK의 requirements·coverage에 반영해 같은 패키지에서 처리한다. 다른 모듈·다른 패키지·승인 범위를 넘으면 PM 또는 위임자가 새 WRK나 범위 변경을 결정한다. `workload-coverage --change CHG-ID`는 개발 배분 전 요구사항·책임자·필수 작업 영역 누락을 검사한다. 정책·책임자 변경은 이전 값·변경자·시각·사유를 보존하며, 어떤 모드에도 점유·잠금·자동 pull 검사는 사용하지 않는다. 완료된 업무를 계속 쌓지 말고, 하루 동안 수행한 이유·결과·다음 작업은 `work-log/YYYY-MM/YYYY-MM-DD/HUM-001.md`처럼 참여자별 기록으로 남긴다. `HUM-001`은 현재 Git 신원을 검증해 연결한 AIDD 참여자 ID이므로, 팀원끼리 같은 작업 기록 파일을 수정하지 않는다. AI 대화 원문은 `chat-history/`에 자동 저장되며 저장소에는 포함하지 않는다.
