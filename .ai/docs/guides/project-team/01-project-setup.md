# 프로젝트 준비와 시작

## 1. 배포물 확인

프로젝트 루트에서 `.ai/`, `AGENTS.md`, `.githooks/`, `.github/`와 `.aidd-role.json`을 확인한다. `kit-template`은 아직 제품 정본이 없는 빈 템플릿이다.

```powershell
node .ai/tools/aidd_hook.mjs self-test --hook
node .ai/tools/aidd.mjs project-init-status
```

## 2. Git과 훅 준비

```powershell
node .ai/tools/aidd.mjs project-init
node .ai/tools/aidd.mjs install-hooks
```

이 단계는 저장소와 로컬 훅 경로만 준비한다. 파일을 자동 스테이징하거나 커밋하지 않는다. 사람의 Git 계정, 역할과 권한은 AIDD에 등록하지 않는다.

## 3. 제품 정본 생성

```powershell
node .ai/tools/aidd.mjs project-bootstrap --project-id PRJ-001 --name "프로젝트 이름" --mode greenfield
```

기존 시스템을 고도화하면 `--mode existing-system --source-location "기존 소스 위치"`를 사용한다. 기존 `project/`가 있으면 덮어쓰지 않고 중단한다.

새 프로젝트는 항상 `owned-records-v2`로 시작한다. 이전 AIDD 형식의 정본을 자동 변환하거나 새 v2 정본과 혼합하지 않는다. AIDD와 무관한 기존 소스·문서의 분석은 [레거시 역분석 시작](../legacy-reverse-workflow.md)의 별도 절차를 사용한다.

## 4. 첫 요구분석

AI에게 해결할 문제, 사용자, 기대 성과, 포함·제외 범위, 기존 제약을 설명한다. 모르는 내용은 사실로 채우지 말고 가정 또는 미결사항으로 둔다. 첫 분석 뒤 다음을 실행한다.

```powershell
node .ai/tools/aidd.mjs generate
node .ai/tools/aidd.mjs validate
node .ai/tools/aidd.mjs status --level executive
```

## 5. 운영 경계 확인

인력 구성, PM, 역할, 일정, 작업 배정과 승인 절차는 프로젝트가 오프라인 또는 별도 도구에서 정한다. AIDD는 이 정보가 없어도 동작한다. 그 운영 결정이 제품 범위·설계·게이트 상태를 바꾸면 결과만 관련 안정 ID와 `HIS` 결정 이력에 기록한다.

## 시작 완료 기준

- 훅 self-test가 통과한다.
- `.aidd-role.json`이 `product-workspace`다.
- `project/.aidd/ssot/project.json`의 v2 형식과 `.aidd/index/`를 확인한다. 타입 폴더는 첫 레코드 저장 때 생성된다.
- 프로젝트 목적·범위·미결사항이 사실과 가정을 구분해 기록됐다.
- `generate`와 `validate`가 통과한다.
