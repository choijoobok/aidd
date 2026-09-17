<!-- tools/aidd.py가 .aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# AIDD 운영자 가이드와 런북

- 대상: 저장소 관리자, DevOps, 운영자
- 상태: `최신`
- 적용 범위: AIDD 정본·생성기·훅·CI 운영
- 관련 요구사항: REQ-015, REQ-018, REQ-023, REQ-025, REQ-027

## 정상 운영 점검

정본 변경 후 생성, 동기화, 검증, 테스트 순서로 실행한다. 생성 문서를 직접 수정하지 않는다.

```powershell
python tools/aidd.py generate
python tools/aidd.py sync-ai
python tools/aidd.py validate
python -m unittest discover -s tests -v
```

## 릴리스와 개발 시작 점검

개발 시작과 릴리스는 서로 다른 게이트다. 차단 메시지를 해소하거나 승인된 예외를 기록하기 전에는 상태를 올리지 않는다.

```powershell
python tools/aidd.py development-check --change CHG-001
python tools/aidd.py release-check --release REL-001
```

## 병합 영향 대응

병합 후 생성된 MRG 레코드의 영향 모듈, 충돌 해결 근거와 추가 테스트 결정을 기록한다.

1. post-merge 훅이 만든 MRG ID를 확인한다.
2. 양쪽 부모와 결과를 비교한다.
3. assess-merge로 모듈·메모·추가 테스트를 기록한다.
4. 필요한 회귀 테스트를 실행하고 증거를 연결한다.

## 장애 복구

검증 실패 시 오류가 가리키는 정본을 수정하고 재생성한다. 정본 JSON이 손상되면 Git의 마지막 정상 커밋과 변경 기록을 비교해 복구하며 생성 문서에서 역으로 덮어쓰지 않는다.

1. 현재 변경과 오류를 보존한다.
2. UTF-8 BOM·JSON 구문·끊어진 ID·오래된 생성 문서 순으로 확인한다.
3. 가장 작은 정본 수정을 적용한다.
4. 전체 검증과 관련 회귀 테스트를 다시 실행한다.
