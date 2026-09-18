---
name: aidd-legacy-reconciliation
description: 기존 또는 레거시 프로젝트의 화면 경로, API, 배치, 이벤트, 외부 연동과 마이그레이션을 조사해 AIDD 시스템 표면과 문서 현행화 계획으로 전환한다. 대량 기존 소스 고도화, 문서 없는 기능의 단계적 문서화, 기존 분석·설계 문서 변환에 사용하며 소스나 옛 문서를 자동으로 정답 취급하지 않는다.
---

# AIDD 레거시 문서 현행화

1. 조사 기준 커밋, 소스 루트, 기존 문서 위치, 제외 범위와 사용자 목표를 확인한다. 원본은 덮어쓰지 않는다.
2. [references/reconciliation-contract.md](references/reconciliation-contract.md)에 따라 모든 사용자 진입 화면 경로, 공개·내부 API, 배치·스케줄, 이벤트, 외부 연동과 데이터 마이그레이션을 모듈별 `SURF` 후보로 조사한다.
3. 발견 근거는 소스 경로·라우트 등록·API 명세·작업 설정 등 재현 가능한 위치로 남긴다. 기술 스택별 명령은 프로젝트에서 합의한 도구를 사용하고 Kit에 고정하지 않는다.
4. 기존 분석·설계 문서가 있으면 원본 경로·작성 시점·적용 범위·신뢰 수준을 기록하고 AIDD 정본 항목에 매핑한다. 소스와 문서가 다르면 `aidd-document-consistency`로 모순을 보고하고 사용자 결정을 받는다.
5. `project/.aidd/ssot/system-surfaces.json`에 `LDP` 계획을, 모듈 조각에 `SURF`를 기록한다. 문서화가 남은 표면은 대상 문서와 완료 마일스톤 또는 릴리스가 있는 `documentation-reconciliation` WRK로 나눈다.
6. 한꺼번에 전체 문서를 완성했다고 주장하지 않는다. 위험·변경 빈도·사용자 중요도를 기준으로 묶음을 정하고 각 묶음의 문서·검증 증거를 완료한 뒤 다음으로 진행한다.
7. `generate`, `validate`, 관련 테스트와 `documentation-check --staged`를 실행하고 인벤토리 누락과 문서 출처 보존 여부를 검토한다.
