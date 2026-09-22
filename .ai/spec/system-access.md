# 선행 접속·인증·접근 정책

owned-records-v2의 [업무 분석](business-discovery.md)에 적용한다. 역할 정의 직후, 구체 요구를 확정하기 전에 시스템 진입과 권한 경계를 사용자와 확인한다. 모든 시스템에 로그인을 요구하거나 제품의 계정·자격증명 자체를 AIDD에 저장하지 않는다.

## 정본과 범위

기존 POL을 `definition.kind="system_access"`로 사용한다. 공통 정책은 `common/POL/<ID>.json`, 모듈 전용 정책은 `modules/<MOD>/POL/<ID>.json`에 둔다. 채널·소유권·독립 변경 단위로 나누고 공통 내용을 복사하지 않는다. 기존 인덱스와 ID별 파생 문서가 각 파일을 연결한다. 일반 POL의 계약은 바꾸지 않는다.

`CHG.definition.scope.discovery.access_policies`는 `{status:"known",value:["POL-ID"]}` 또는 사유 있는 비적용이다. 현재 ACT/UC가 참조하는 정책은 반드시 포함한다. 현재 주기에 시스템 접속이 없는 순수 품질 변경에는 정책·로그인 UC를 억지로 만들지 않는다.

## POL 상세 계약

아래 `known` 문자열은 `{status:"known",value:"구체적 내용"}`, 비적용은 `{status:"not_applicable",reason:"구체적 사유"}`다. unknown과 미완성 초안은 저장할 수 있지만 ready는 아니다.

| 필드 | 구조·의미 |
|---|---|
| kind | `system_access` |
| channel | `web`, `api`, `batch`, `other` |
| entry | known 문자열. 서비스 접속 주소/경로 또는 호출·실행 진입점 |
| authentication | known 객체. 아래 mode/method/login_entry/session_end |
| authorization | known 객체. 아래 basis/check/enforcement/permission_lifecycle |
| rules | 고유하고 안정적인 key를 가진 규칙 객체 배열 |

authentication.value:

- `mode`: `public`(인증 없이 사용), `required`(인증 선행), `mixed`(공개/인증 기능 공존).
- `method`: 사용자·호출 주체를 확인하는 업무상 방식. 고객 계정, 조직의 통합 인증 등 사용자에게 확인한 내용을 기록한다. 라이브러리·토큰 구조 등 구현 선택은 설계에서 결정한다.
- `login_entry`: 로그인/재인증 진입점. API·배치는 자격 확인 입력·호출 방식을 적으며 가짜 로그인 화면을 만들지 않는다.
- `session_end`: 로그아웃·만료·인증 무효화 시 결과와 복귀. 세션 없는 방식이면 그 사실과 요청별 확인 동작을 기록한다.
- mode 이외 항목은 known 문자열이다. public만 사유 있는 비적용을 허용한다.

authorization.value는 아래 항목별 known 문자열 또는 비적용 사유다. 하나라도 권한 제한 규칙이 있으면 네 항목 모두 known이어야 한다.

- `basis`: 역할, 직접 부여 권한, 조직, 소유 관계 등 허용 판단 근거. 여러 역할/권한이 충돌할 때의 우선순위도 해당하면 명시한다.
- `check`: 어떤 정보를 어떤 시점에 확인하는지.
- `enforcement`: 화면 진입·기능 실행·직접 URL/API 요청·데이터 접근에서 어떤 제한을 적용하는지. 메뉴 숨김/버튼 비활성만으로 접근을 허용하지 않도록 요구를 정한다. 구체 구현 위치는 설계에 연결한다.
- `permission_lifecycle`: 권한 부여·변경·회수 조건과 이용 중 변경 시 다음 요청/현재 작업에 미치는 영향.

rules의 각 항목:

| 필드 | 필수 결정 |
|---|---|
| key | 이름 변경에도 유지하는 규칙 식별자 |
| authentication | `public` 또는 `required` |
| initial | 접속 시 최초 화면 이름·목적·조건. 비웹은 사유 있는 비적용 가능 |
| after_auth | 이미 인증된 경우/인증 성공 후 목적지와 원래 요청 복귀 조건. required는 known 필수; 비웹은 요청/작업 재개 결과 |
| permissions | 허용 화면·업무 기능/행위 범위 또는 별도 제한이 없는 사유 |
| data_scope | 본인/조직/전체 등 데이터 범위 또는 비적용 사유 |
| unauthenticated | 미인증 진입 결과. required는 known 필수 |
| denied | 권한 부족 시 거부·숨김·비활성·안내의 구분. permissions가 known이면 known 필수 |

key/authentication 이외 규칙 필드는 known 문자열 또는 사유 있는 비적용이다. required/public 정책은 다른 인증 모드의 규칙을 포함할 수 없다. mixed 정책에는 공개와 인증 필요 규칙이 모두 있어야 한다. 초기 화면은 이 단계에서 개념과 동작을 정하며 SCR ID나 목업을 선행 작성하도록 강제하지 않는다.

## 역할·유즈케이스·요구 연결

ACT와 UC의 `definition.access`는 다음처럼 정책과 규칙을 참조한다.

```json
{"status":"known","value":[{"policy":"POL-CUSTOMER-ACCESS","rule":"customer"}]}
```

역할은 여러 정책/규칙에 참여할 수 있고 같은 규칙을 여러 역할에서 재사용할 수 있다. UC가 참조한 각 규칙은 수행 역할 중 하나에 연결되어야 하며, 각 수행 역할은 UC 규칙 중 하나 이상에 연결되어야 한다. 다른 역할의 권한을 합집합으로 자동 부여하는 의미가 아니다. 실제 호출 주체에게 해당하는 규칙만 적용한다.

비접속 수작업 역할/UC에는 access의 사유 있는 비적용을 허용한다. BPR의 system 단계가 참조하는 UC에는 접근 규칙 연결이 필수다. 공통 로그인 UC는 한 번 정의하고 참조할 수 있으며, 모든 역할/업무 UC에 로그인 절차를 복제하지 않는다. 인증 필요 규칙이 있다는 이유만으로 독립 로그인 UC 파일을 강제하지 않는다.

REQ/NFR에는 `derived_from → POL-ID, selector: rule-key`를 연결한다. 현재 ACT/UC가 사용하는 각 규칙은 요구 확정 때 최소 한 요구에 연결되어야 한다. 공통 정책의 다른 모듈 전용 규칙은 현재 주기의 요구를 강제하지 않는다. 요구의 AC에는 적용되는 정상·미인증·권한 부족·만료·회수·직접 접근·타인 데이터 사례와 결과를 명시한다. 하나의 요구가 충분한지 여러 요구로 분리할지는 업무 크기에 따라 결정한다.

FEAT는 이 요구를 satisfies로, SCR은 presents로, NAV는 화면 참조로 연결한다. 상세 설계에서 정책의 초기 화면/복귀를 SCR.entry/exit/transitions로, 권한을 applicable_permissions·기능 rules/data_access로 구체화한다. TC는 요구 AC를 verifies로 연결한다. 정책 문구와 화면·기능·메뉴·데이터 범위의 의미 일치는 설계 및 사용자 검토 대상이다.

## 판정·검토·변경

접속 POL은 intent 사용자 검토와 requirements BSL에 포함한다. discovery-check는 정책/역할/UC 연결과 필수 상세·인증 모드 모순·사용자 검토를 확인한다. requirement/design-check는 사용 규칙의 요구 연결까지 확인한다. 개발 준비도도 동일한 선행 조건을 사용한다. 미정·누락이 있으면 확정/진입을 차단하되 초안 작업은 허용한다.

도구는 비어 있지 않은 문장을 의미적으로 올바르다고 보증하지 않는다. 사용자/AI 검토에서 역할별 첫 진입·로그인 전후·권한 거부·인증 만료·직접 호출의 종단 흐름과 정책 간 모순을 확인한다. 비적용 사유도 사용자 검토 범위다.

ACT/UC.access 참조는 조회·인덱스·문서·입력 digest·영향 그래프의 depends_on 간선이다. 정책 변경 후 연결된 검토는 stale이 되고 관련 요구·기능·화면·테스트·작업을 IMP로 분류한다. 공통 정책을 나누면 독립 변경의 영향도 줄일 수 있다. 과거 RVW/BSL/REL과 ID는 보존한다.

판정기 2.3 이전 검토를 새 정책 승인으로 자동 승격하지 않는다. 부족한 정의를 보완하고 실제 사용자 검토 또는 근거 있는 현재 동등성 검토를 수행한다. 이 계약은 Kit 팀원 인증/권한 관리나 실제 제품 보안 구현을 제공하는 것이 아니다.
