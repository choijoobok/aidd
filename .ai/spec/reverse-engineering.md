# 일반 레거시 자료에서 정본 초안 작성

owned-records-v2 전용 증분 계약이다. 이전 AIDD 형식 변환이나 제품 코드/데이터 이관 기능이 아니다. 소스 실행·패키지 설치·네트워크 접근 없이 사용자가 지정한 자료를 읽는다.

## 세 명령과 입력

- `legacy-inventory --input scope.json`: 읽기 전용 파일 목록. scope는 `{roots:[{key,path,kind,revision?}],exclude?:[],max_entries?:1000,max_bytes?:1048576}`. path는 절대 디렉터리, kind는 source/document/artifact. revision은 사용자가 제공한 설명이며 Git 확인 결과가 아니다. exclude는 루트 상대 경로 또는 디렉터리 접두어(`/` 구분자), glob은 지원하지 않는다. `.git`, `node_modules`는 항상 제외한다.
- `legacy-draft --input analysis.json --inventory inventory.json`: 구조화 관측을 검증하고 변경 예정 레코드·미정·충돌을 반환한다. inventory.json은 첫 명령 JSON 응답의 `data` 또는 그 자체다. 원본과 정본 모두 쓰지 않는다.
- `legacy-apply --input plan.json --operation ID`: 두 번째 응답의 `data` 또는 그 자체를 받는다. 미리보기 digest를 검사하고 입력에서 계획을 재구성한 뒤 출처 재조사·저장소 CAS를 확인하여 하나의 복구 가능한 transaction으로 저장한다. 임의로 편집한 레코드 목록을 적용하지 않는다.

명령은 모두 기존 v2 작업 공간에서 실행한다. CLI 표준 출력은 JSON이며 입력 파일 저장은 호출자의 책임이다. 기본 수집 상한을 넘으면 누락을 성공으로 숨기지 않고 `limit` 항목과 불완전 coverage를 남긴다. 최대 10,000 항목/16MiB 파일로 제한한다. 링크(루트 경로의 링크 포함)는 따라가지 않는다. 바이너리·PDF/Office·이미지는 해시만 남기는 unsupported이며 의미 추출하지 않는다. 읽기 실패·제외·상한·unsupported·텍스트 수집을 따로 집계한다. 텍스트 해시/행수는 의미 분석 완료나 실행 증거가 아니다.

## 분석 입력과 근거

analysis는 `{namespace,batch,title,observations:[],candidates:[]}`다. namespace/batch와 각 key는 1~80자 영문·숫자·점·밑줄·하이픈이다. 배치는 최대 관측 300개, 후보 100개이며 큰 자료는 의미 있는 범위로 분리한다.

관측: `{key,kind,status,summary,method,anchors:[],value?}`. kind는 ui_route/api/job/event/external_integration/data/document/other, status는 observed/inferred/unknown이다. method는 실제 수집 방법을 설명한다. observed/inferred에는 최소 하나의 현재 텍스트 출처가 필요하다. 앵커는 `{root,path,sha256,start_line,end_line,symbol?,section?}`이며 현재 파일 해시와 유효한 행 범위를 확인한다. 심볼/절 표시는 분석자의 설명으로 보존하며 파서가 검증한 식별자라고 주장하지 않는다. 원문은 복사하지 않는다. 의미상 참인지, 전체 시스템 동작을 증명하는지는 자동 검증하지 않는다.

후보: `{key,type,owner,title,fields:{필드:[관측key,...]},relations?:[{type,target,selector?}]}`. type은 MOD/SYS/CAP/ACT/POL/UC/BPR/REQ/NFR/FEAT/SCR/DAT/NAV/IFC. owner는 project, 기존 MOD-ID 또는 `{"$ref":"모듈후보key"}`. MOD는 자기 소유, SYS는 project 소유다. target과 필드 value 안의 `{"$ref":"후보key"}`는 안정 ID로 해석한다. 여러 관측을 한 후보에, 같은 관측을 여러 후보에 연결할 수 있다. title과 소유/관계는 초안 작성자의 제안이다.

fields의 관측들이 모두 observed이고 value가 같으면 기존 정본 필드의 known 값으로 채운다(typed raw 필드는 원래 형태). 서로 다른 값은 conflicting, 추론이 섞이면 inferred, 값이 없으면 unknown이며 후보 값과 모든 출처는 보존하되 정본 필드는 미정으로 둔다. 인증 검사를 찾지 못했다는 사실은 public의 근거가 아니다. POL은 system_access만 생성하며 channel/entry/authentication/authorization/rules 계약을 따른다. 빠진 필드는 unknown 또는 해당 raw 필드의 빈 배열/문자열로 남는다. REQ/NFR의 acceptance_criteria/applicability도 초안 형태이며 게이트가 상세·검토를 별도 판정한다.

## 정본 배치와 안정 ID

ID는 type + RE + namespace/key SHA256 앞 24자리로 결정한다. batch는 실행 묶음의 LDP/CHG ID에 사용한다. 후보 key는 내용·파일명보다 업무 동일성을 나타내게 정하고 이름 변경 시 임의로 바꾸지 않는다. 다른 배치에서 같은 key의 기존 후보를 바꾸려 하면 안전하게 거부한다. 이동·이름 매핑과 3-way 병합은 후속 기능이다.

- LDP(kind=reverse_engineering): 배치·출처 요약·수집 coverage·관측/추정/충돌 통계. source archive나 실행 증거가 아니다.
- DOC(kind=legacy_inventory): 파일 목록을 최대 25항목씩 나눈 출처 장부.
- SURF(kind=legacy_observation): 관측 하나와 앵커/값. 범용 관측이며 기존 시스템 표면 문서화 완료로 표시하지 않는다.
- DOC(kind=legacy_mapping): 후보별 필드→관측/판정 대응. 후보는 이 매핑에 depends_on, 매핑은 관측에 depends_on, 관측은 LDP에 depends_on으로 연결한다.
- 실제 후보 정본과 CHG: 요구/업무/분석 목록에 연결한다. 기존 MOD를 참조하거나 새 MOD 초안을 함께 생성할 수 있다. 기존 CHG를 수정하지 않고 배치별 문서 도입 CHG 초안을 만든다.
- OI: 후보별 사용자 검토 필요 항목과 미정·추정·충돌 필드. open/blocking 상태이며 해당 CHG/후보에만 적용한다. DRQ/RVW/BSL/EVD/REL이나 실제 완료는 생성하지 않는다.

생성 정본은 모두 draft/revision 1이며 실행 결과와 승인 이력은 빈 상태다. 각 레코드 32KiB를 넘으면 배치를 분할하도록 거부한다. 기존 인덱스·문서 생성·게이트를 사용하며 별도 정본 체계를 만들지 않는다.

## 적용·재실행·복구

초안 미리보기에서 저장소 전체 구조를 확인하고 모든 관련 기존 정본의 해시와 새 파일 expected=null을 고정한다. 쓰기 직전 현재 인벤토리를 다시 계산한다. 출처 변경·참조 부재·소유자 불일치·기존 레코드와의 차이가 하나라도 있으면 전체 적용을 거부한다. 기존 정본을 수정/삭제/폐기하지 않는다. 바이트 서식만 다른 동일 JSON은 no-op이며 사람이 수정한 의미 값·revision·관계는 충돌이다.

동일 operation 재시도는 저장된 결과를 반환한다. 이 반환은 과거 적용 결과이지 현재 출처 유효성 보증이 아니다. 새 operation이면 다시 출처를 확인한다. prepared 실패는 기존 transaction-recover resume/rollback으로 처리하며 후속 편집을 보존한다. 로컬 협력 writer 기준이고 원본 외부 편집기·분산 FS까지 원자적 잠금을 보장하지 않는다.

중지/롤백: 명령을 실행하지 않으면 자동 동작은 없다. 미완료 transaction만 명시적으로 복구한다. 이미 적용한 초안은 해당 operation의 경로와 snapshot을 확인하고 기존 편집·검토를 보존하는 정상 변경으로 정리한다. 일괄 삭제 초기화는 제공하지 않는다.

## 현재 지원 경계

자동화는 범용 파일 수집 + AI/도구의 구조화 관측 검증 + 정본 뼈대 생성이다. 소스에서 업무 의미를 단독 추출하는 만능 파서가 아니다. 검토 순서는 SYS/CAP → ACT/POL → UC/BPR → REQ/인수 기준 → 상세 설계다. 후속 [검토·재분석 계약](legacy-review-reanalysis.md)은 질문 묶음/부분 응답·명시적 세 버전 채택·선택적 재검토와 선언 루트의 출처 검사를 제공한다. 이 문서의 legacy-apply는 계속 생성 전용이다. [모듈별 도입 계약](legacy-adoption.md)은 문서 관리 채택과 실제 실행 검증을 분리한다. 실제 제품 실행·운영 데이터 이관을 자동 수행하지 않으며 문서 수집률을 프로젝트 완료율로 표현하지 않는다.
