# 조사 및 방법론 근거

이 기반 구조는 2026-09-17 기준 원저자·표준기관·공식 프로젝트의 1차 자료를 확인하여 설계했다. 방법론을 순위화하거나 하나를 그대로 도입하지 않고, 해결하려는 문제와 한계를 분석하여 AIDD 단계·게이트·증거에 연결했다. 구조화된 비교 결과는 `project/.aidd/ssot/methodologies.json`과 `project/docs/generated/methodology-comparison.md`가 정본과 생성 뷰 역할을 맡는다.

## 전통적·적응형·운영 방법론

- [PMI의 수행 접근법 스펙트럼](https://www.pmi.org/learning/thought-leadership/series/achieving-greater-agility/spectrum-of-approaches)은 예측형, 반복형, 증분형과 애자일 사이에 모든 프로젝트에 맞는 단일 방식이 없다고 설명한다. AIDD는 예측형의 기준선·승인·변경 통제를 C2·C3과 규제 작업에 적용하고, 상황별 혼합 경로를 명시한다.
- [NASA 시스템공학 핸드북](https://www.nasa.gov/reference/systems-engineering-handbook/)과 [제품 실현 지침](https://www.nasa.gov/reference/5-0-product-realization/)은 생애주기 전반의 요구 분해, 통합, 검증과 유효성 확인을 연결한다. AIDD는 요구사항마다 검증 ID를 두고 설계 시점에 테스트 방법을 정하는 통제를 채택한다.
- [IBM RUP 프로젝트 계획 지침](https://www.ibm.com/docs/en/rational-clearquest/10.0.7?topic=settings-project-planning)은 착수·정교화·구축·전환을 반복으로 나누어 점진적으로 가치를 전달한다. AIDD는 고위험 기술을 먼저 검증하고 모듈별로 실행 가능한 기준선을 만드는 관점을 채택하되 역할과 문서를 일괄 강제하지 않는다.
- [애자일 선언 원칙](https://agilemanifesto.org/principles)은 조기·지속 전달, 변경 수용, 기술적 우수성과 정기적 개선을 강조한다. AIDD는 작은 가역적 증분과 운영 피드백을 채택하면서 장기 추적성과 규제 증거를 별도 정본으로 보완한다.
- [공식 Scrum Guide](https://scrumguides.org/scrum-guide.html)는 복잡한 작업에서 투명성, 검사와 적응을 위한 최소 프레임워크를 정의한다. AIDD는 목표·우선순위·증분·완료 기준·회고를 활용하지만 스프린트나 역할을 모든 프로젝트에 강제하지 않는다.
- [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final)은 특정 SDLC와 독립적으로 통합할 수 있는 보안 개발 관행을 제공한다. AIDD는 보안·공급망·취약점 대응을 기술 스택 게이트, 설계 검토, 검증과 운영 학습에 걸쳐 적용한다.
- [Google SRE 자료](https://sre.google/books/)는 개발과 운영을 연결하고 신뢰성, 관측성, 자동화와 운영 학습을 다룬다. AIDD는 SLO·복구·사고·사후 분석을 출시 이후 정본 변경으로 환류한다.

## AI 주도 개발 방법론과 도구 확장점

- [GitHub Spec Kit](https://github.com/github/spec-kit/blob/main/docs/index.md)은 명세 중심 흐름과 여러 코딩 에이전트 통합을 제공한다. AIDD는 구현보다 의도를 먼저 확정하고 산출물 간 분석을 수행하는 원칙을 채택하고, 이를 운영 단계와 정규화된 레지스트리까지 확장한다.
- [Spec Kit 에이전트형 SDD](https://github.github.com/spec-kit/reference/agentic-sdd.html)는 명확화, 체크리스트, 분석, 구현과 수렴 단계를 제공한다. AIDD는 이를 모든 변경에 강제하는 절차가 아니라 위험에 비례하는 게이트로 사용하며 기술 스택은 요구 정의 뒤 설계에서 결정한다.
- [BMAD Method](https://docs.bmad-method.org/)는 명명된 스킬, 규모별 계획 경로, 반대 검토와 기존 프로젝트 맥락을 강조한다. AIDD는 이러한 역할·경로 장점을 유지하되 역할별 문서가 서로 다른 정본이 되지 않도록 공유 레지스트리에 증거를 연결한다.
- [OpenAI Codex 스킬](https://learn.chatgpt.com/docs/build-skills), [AGENTS.md 지침](https://learn.chatgpt.com/docs/agent-configuration/agents-md)과 [Codex 훅](https://learn.chatgpt.com/docs/hooks)은 저장소 범위 절차·정책·생애주기 검증을 지원한다.
- [Claude Code 스킬](https://code.claude.com/docs/en/skills), [메모리 파일](https://code.claude.com/docs/en/memory), [훅](https://code.claude.com/docs/en/hooks)은 이에 대응하는 저장소 범위 확장 지점을 제공한다.

## 배포·동시성·트랜잭션 설계 근거

- [Spring AOP 프록시 지침](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)은 자기 호출이 프록시를 우회하여 advice가 실행되지 않을 수 있음을 설명한다. AIDD는 프록시 경계를 설계 검토와 부정 통합 테스트 대상으로 둔다.
- [Spring 선언적 트랜잭션 구현](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-decl-explained.html)은 일반적인 명령형 트랜잭션이 현재 스레드에 결합되며 새로 시작한 스레드로 자동 전파되지 않는다고 설명한다. AIDD는 비동기·스레드 경계를 별도 트랜잭션과 컨텍스트 전달 설계 대상으로 둔다.
- [Spring 트랜잭션 전파 지침](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)은 논리·물리 트랜잭션 차이와 `REQUIRES_NEW`가 추가 연결을 요구하여 풀 고갈·교착 위험을 만들 수 있음을 설명한다. AIDD는 전파 옵션을 주석 선택이 아니라 자원 예산·실패 시나리오와 함께 검증한다.
- [Spring 비동기 실행 지침](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)은 `@Async`가 작업을 실행기에 제출하고 프록시 모드에서 프록시를 통과한 호출만 가로챈다는 점을 설명한다. AIDD는 실행기 풀·큐·거부·정상 종료와 예외 처리를 기반 준비도 증거로 요구한다.

이 프레임워크는 특정 Java·Spring 기술을 모든 프로젝트에 강제하지 않는다. 위 사례를 프록시 경계, 실행 컨텍스트, 자원 풀과 분산 동시성 같은 일반 설계 위험으로 추상화하여 `project/.aidd/ssot/deployment.json`의 DPR 패턴으로 관리한다.

공통 `SKILL.md` 규약을 이식성 경계로 사용한다. 정본 스킬은 `.ai/skills`에서 한 번만 관리하고 각 에이전트의 검색 경로에 어댑터를 생성한다. 생애주기 스키마와 신뢰 UX가 다를 수 있으므로 네이티브 훅 설정은 에이전트별로 유지하지만, 두 어댑터 모두 같은 결정적 검증기를 호출한다.
