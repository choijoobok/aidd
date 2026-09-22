# 모듈형 정본 작업 안내

새 프로젝트는 owned-records-v2를 사용한다. [실행 계약](../../spec/owned-records-v2.md)을 먼저 확인한다. 이전 프로젝트의 전역 파일을 새 경로에 복사해 혼합하지 않는다.

AIDD와 무관한 기존 시스템은 [레거시 역분석 안내](legacy-reverse-workflow.md)로 자료 인벤토리와 출처 있는 초안을 생성할 수 있다. 초안 생성 뒤에도 아래의 선행 분석·사용자 검토·게이트를 적용한다.

1. `add-module --id MOD-X --name 이름 --purpose 목적`으로 경계를 만든다. 운영 모듈과 새 모듈은 별도 CHG 주기로 진행한다.
2. CHG를 `record-put`으로 만들고 요구/설계 레코드는 `--change`로 연결한다. 신규 파일은 `--create`, 변경은 `record-read`의 hashes에서 읽은 원본 SHA256을 `--expected-hash`로 전달한다. revision은 이전 값 + 1이다.
3. 직접 JSON 편집도 가능하지만 검토·준비도를 생략하지 않는다. 인덱스·스냅샷·생성 문서는 직접 수정하지 않는다.
4. `validate --module MOD-X`, `index-check`로 범위 오류/전체 최신성을 구분한다. 명시적 갱신은 `index-rebuild`다.
5. 저장 실패 시 operation ID로 상태를 확인한다. committed/index stale이면 정본을 재작성하지 말고 인덱스를 갱신한다. prepared이면 후속 수정 여부를 확인하고 resume/rollback을 명시한다.

명령 결과의 diagnostics와 coverage를 함께 읽는다. scope_complete가 project_complete를 뜻하지 않으며, unknown은 ready가 아니다. 기록·조회·생성 명령은 배포나 Git 커밋을 수행하지 않는다.

## 요구에서 전달까지

요구를 나열하기 전에 [시스템·업무 분석 계약](../../spec/business-discovery.md)에 따라 다음을 진행한다.

- 시스템 개요 SYS: 해결할 문제·목적·성과·범위와 외부 경계.
- 핵심 업무 CAP와 업무 역할 ACT: 무엇을 지원하고 누가 어떤 목표로 사용하는지. ACT는 개발팀 배정이나 인증 계정이 아니다.
- [접속·인증·접근 정책](../../spec/system-access.md): POL(kind=system_access)에 최초 진입·인증 후 화면, 로그인 필요 여부, 권한 판정/강제와 거부·만료·회수 동작을 정의한다. ACT/UC.access로 정책 규칙을 연결하고 scope.discovery.access_policies에 등록한다. 공통 정책은 재사용하며 API/배치에 화면을 강제하지 않는다. 정책의 intent 검토와 사용 규칙별 REQ/NFR 출처 연결이 필요하다.
- UC와 BPR: 역할의 목표 달성 시나리오와 전체 업무 인계·분기·예외·데이터 상태. 둘을 반복해서 정교화한다.
- REQ/NFR: UC/프로세스 단계 또는 품질·정책·외부 계약에서 도출하고 derived_from으로 연결한다.

각 정의는 기존 record-put --change로 저장하며 discovery 범위에 자동 등록된다. 공통 정의 재사용은 CHG.scope.discovery에 기존 ID를 참조한다. 시스템/역할과 업무 흐름을 의미 있는 묶음으로 사용자에게 보여주고 intent/business_flow 검토를 남긴다. 개별 record-read의 review_inputs를 이용해 여러 항목의 RVW를 같은 사용자 검토 결과에 연결할 수 있다. 검토 기록은 실제 사용자 답변 이후 작성한다.

`discovery-check --change CHG-ID`로 앞단 분석을 확인한 뒤 아래 절차로 요구를 확정한다. 초안의 선행 작성은 가능하지만 불완전한 앞단을 건너뛰어 설계로 진행하지 않는다. 새 모듈은 기존 공통 개요·역할을 재사용한다. 발견된 변경은 관련 정본으로 돌아가 영향 범위만 재검토한다.

1. REQ/NFR의 업무 의미·예외·부정 결과·데이터·AC를 상세화하고 분석 목록을 연결한다. unknown은 저장할 수 있지만 다음 단계의 준비 완료는 아니다.
2. 기준선 입력 `{id,kind:"requirements",scope_ref:"CHG-ID"}`를 baseline-create에 전달한다. 선행 업무 정의도 자동 포함한다. CHG와 모든 요구/분석 목록의 고정 개정을 검토한다.
3. RVW에 실제 검토 대상 hash·input_digest·항목별 결과·결정 출처를 기록한다. scope/requirement는 사용자 결정, consistency는 개별·관련 규칙·종단 간 의미 검토를 기록한다. 도구가 검토 내용을 대신 판단했다고 표현하지 않는다.
4. `design-check --change CHG-ID`가 ready이면 FEAT/SCR 상세와 목업을 작성한다. `generate --module MOD-ID`로 검토 화면을 만들고 현재 출력 해시에 대한 사용자 검토를 남긴다.
5. `development-check --work WRK-ID`가 ready인 작업부터 개발한다. 구현 전에는 TC 계획, 구현 뒤에는 실제 test/implementation EVD, 릴리스에는 실제 integration EVD를 연결한다.
6. 새 발견은 관련 요구/설계 정본으로 돌아가 수정한다. `impact --id ID`의 경로·coverage를 검토하고 IMP로 영향 있음/없음/미정을 이유와 함께 분류한다. 명시한 작업만 재개하고 운영 기록은 유지한다.
7. `status --module MOD-ID --format text`, `generate --module MOD-ID`, `documentation-check --module MOD-ID`로 상태와 문서를 함께 확인한다. 제출은 DLP와 delivery-build를 사용한다.

ready는 현재 입력에 대한 판정이다. 입력이 달라졌으면 새 검토/게이트를 기록한다. 사람이 잠정적으로 기록한 completed를 실제 증거가 있는 완료와 혼동하지 않는다. 일부 전문 명령의 v2 연결은 S08 통합 범위이며 not_implemented가 나오면 전역 파일 writer로 대신 저장하지 않는다.
