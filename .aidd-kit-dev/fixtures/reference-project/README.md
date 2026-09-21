# Reference Project Fixture

이 폴더는 AIDD Kit 생성기·검증기 회귀 테스트용 제품 fixture다. 현재 Kit의 실제 프로젝트 상태나 고객 산출물이 아니다.

```text
.aidd/ssot/        현재 구조화 정본
.aidd/ssot/history 월별 append-only 결정 이력
docs/generated/    정본에서 다시 만드는 파생 문서
src/               대표 제품 소스 표면
```

`WRK`는 담당자 배정표가 아니라 요구사항·CHG·필수 수행 영역·완료 조건·증거를 묶는 실행 패키지다. 인력, 역할, PM 위임, 일정과 작업 배정은 AIDD 밖에서 관리한다.

현재 초점과 다음 행동은 `.aidd/ssot/workboard.json`에 둔다. 제품 동작·범위·설계·용어·운영 방식을 바꾸는 중요한 결정은 관련 안정 ID와 함께 `.aidd/ssot/history/YYYY-MM/HIS-YYYYMMDD-NNN.json`에 결정 주체·결정·이유·영향을 기록한다. 정확한 파일 차이는 Git에서 확인한다. AI 대화 원문은 제품 정본이나 증거에 포함하지 않는다.
