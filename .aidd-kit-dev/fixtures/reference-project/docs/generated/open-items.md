<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 미결 항목

## 미결 항목

### OI-001 — 첫 파일럿 제품 선정

- **id:** OI-001
- **title:** 첫 파일럿 제품 선정
- **status:** open
- **blocking:** false
- **question:** 어떤 실제 신규 구축 또는 기존 시스템 모듈로 방법론을 먼저 검증할 것인가?
- **resolution:** -
- **links:** REQ-004

### OI-002 — CI 호스팅 어댑터 선택

- **id:** OI-002
- **title:** CI 호스팅 어댑터 선택
- **status:** closed
- **blocking:** false
- **question:** 어떤 Git·CI 플랫폼에서 검증, 생성, 테스트와 어댑터 동등성을 강제할 것인가?
- **resolution:** 현재 원격 저장소에 맞춰 GitHub Actions를 사용한다. 브랜치 보호의 원격 활성화는 저장소 운영 권한으로 별도 수행한다.
- **links:** REQ-012, REQ-018, REQ-023

### OI-003 — 운영 거버넌스 프로필 정의

- **id:** OI-003
- **title:** 운영 거버넌스 프로필 정의
- **status:** open
- **blocking:** false
- **question:** 첫 운영 프로젝트에 어떤 규제, 개인정보, 보안과 승인 제약이 적용되는가?
- **resolution:** -
- **links:** REQ-016, REQ-017

### OI-004 — 비공개 저장소 브랜치 보호 제공 방식

- **id:** OI-004
- **title:** 비공개 저장소 브랜치 보호 제공 방식
- **status:** open
- **blocking:** false
- **question:** GitHub Pro로 업그레이드할지, 저장소를 공개할지, 또는 다른 호스팅·보호 정책을 사용할지 결정해야 한다.
- **resolution:** -
- **links:** REQ-027, TC-020, WRK-009

### OI-006 — 커밋 메시지 형식 결정

- **id:** OI-006
- **title:** 커밋 메시지 형식 결정
- **status:** open
- **blocking:** false
- **question:** 프로젝트에서 사용할 커밋 메시지 형식(예: Conventional Commits의 type·scope, 한글/영문 제목, 변경 ID 표기, 본문·breaking change 규칙)을 정하고 Git 훅·PR·릴리스 추적에 적용할 것인가?
- **resolution:** -
- **links:** -
