# 애플리케이션 소스

이 폴더 아래에 프로젝트의 실제 구현을 둔다. AIDD Kit은 특정 기술 스택이나 `frontend`·`backend` 분리를 미리 강제하지 않는다.

- 모듈형 단일 애플리케이션: `app/` 또는 `modules/<module>/`
- 웹·API 분리: `frontend/`, `backend/`
- 독립 서비스: `services/<service>/`

구조를 만들기 전에 `project/.aidd/ssot/architecture.json`, 기술 기준선, 모듈·인터페이스 정본을 승인하고, 소스 경로와 모듈 ID의 대응을 기록한다.
