<!-- .ai/tools/aidd.mjs가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->

# 시퀀스

## 시퀀스

### SEQ-001 — 정본 변경 순환

- **id:** SEQ-001
- **name:** 정본 변경 순환
- **participants:**

```json
[
  {
    "id": "CUSTOMER",
    "label": "고객"
  },
  {
    "id": "AGENT",
    "label": "AI 역할 관점"
  },
  {
    "id": "SSOT",
    "label": "정본 레지스트리"
  },
  {
    "id": "CLI",
    "label": "AIDD 검증·생성기"
  },
  {
    "id": "GATE",
    "label": "품질·릴리스 게이트"
  }
]
```
- **messages:**

```json
[
  {
    "from": "CUSTOMER",
    "to": "AGENT",
    "text": "의도 또는 요청 변경 제시"
  },
  {
    "from": "AGENT",
    "to": "CUSTOMER",
    "text": "성과, 경계와 트레이드오프 명확화"
  },
  {
    "from": "AGENT",
    "to": "SSOT",
    "text": "요구사항, 결정, 위험과 변경 기록"
  },
  {
    "from": "AGENT",
    "to": "CLI",
    "text": "생성·검증 실행"
  },
  {
    "from": "CLI",
    "to": "AGENT",
    "text": "불일치, 차단사항과 최신 뷰 반환"
  },
  {
    "from": "AGENT",
    "to": "GATE",
    "text": "구현과 증거 제출"
  },
  {
    "from": "GATE",
    "to": "CUSTOMER",
    "text": "준비도와 잔여 위험 제시"
  },
  {
    "from": "CUSTOMER",
    "to": "SSOT",
    "text": "출시 여부 결정 기록"
  }
]
```
- **requirements:** REQ-001, REQ-002, REQ-003, REQ-005, REQ-018
