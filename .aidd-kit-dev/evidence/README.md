# Kit 검증 증거

검증 증거는 수행자, 명령 또는 검토 방법, 시각, Git 커밋, 결과와 연결된 `KIT-CHG`를 기록한다. 현재 작업 트리에서 수행한 임시 결과는 커밋 불변 증거로 가장하지 않는다.

## 기록 규약

- `id`는 파일 이름과 같아야 하고 `change`는 존재하는 `KIT-CHG`를 가리켜야 한다. `KIT-EVD-011`부터는 `kind`, `performed_by`, `performed_at`이 필수다. `KIT-EVD-009`·`KIT-EVD-010`은 이전 형식 그대로 보존한다.
- `performed_at`은 **시스템 시계에서 읽은 값만** 쓴다. 기억이나 추정으로 근사한 시각을 적지 않는다. 쉘에서는 `date -Iseconds`로 읽는다.
- `kit.mjs validate`는 미래 시각을 거부한다. 이미 커밋된 잘못된 값은 지우지 않고 `performed_at_correction`으로 정정한다.
- 자신의 커밋 해시를 단정하지 않는다. 검토·수정의 기준이 된 커밋은 `reviewed_commit` 또는 `reviewed_implementation_commit`으로 적고, 자기 자신이 어느 커밋에 들어갈지는 기록 시점에 알 수 없다.
- 수치와 결과는 실제로 관측한 출력에서 옮긴다. 원시 로그를 보존하지 않았으면 `evidence_integrity.raw_logs_attached: false`와 그 이유를 남긴다.

## 정정과 사후 편집

- 레코드 본문은 append-only로 다룬다. 사실이 달라지면 원문을 고치지 않고 `correction` 또는 `performed_at_correction` 같은 정정 블록을 추가한다.
- 발견사항의 `status`처럼 **후속 처리를 추적하는 필드**는 사후에 갱신할 수 있다. 이때도 발견사항 본문, `severity`, `verdict`, 수치는 바꾸지 않는다.
- 독립 검토 레코드를 구현 세션이 전사한 경우에는 `record_integrity.transcribed_by`로 그 사실과 원본 보존 여부를 밝힌다. 전사본은 독립성의 증거가 아니라 독립 검토가 있었다는 기록이다.
