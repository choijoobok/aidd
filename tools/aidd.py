#!/usr/bin/env python3
"""Deterministic AIDD registry tooling. Uses only the Python standard library."""

from __future__ import annotations

import argparse
import filecmp
import json
import re
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


ROOT = Path(__file__).resolve().parents[1]
SSOT = ROOT / ".aidd" / "ssot"
GENERATED = ROOT / "docs" / "generated"
CANONICAL_SKILLS = ROOT / ".ai" / "skills"
SKILL_TARGETS = (ROOT / ".agents" / "skills", ROOT / ".claude" / "skills")
NOTICE = "<!-- tools/aidd.py가 .aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->\n\n"
ID_PATTERN = re.compile(r"^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$")
TEXT_EXTENSIONS = {
    ".c", ".cc", ".conf", ".cpp", ".css", ".csv", ".go", ".h", ".hpp",
    ".html", ".ini", ".java", ".js", ".json", ".jsx", ".kt", ".kts", ".md",
    ".mjs", ".properties", ".ps1", ".py", ".rs", ".sh", ".sql", ".svg", ".toml",
    ".ts", ".tsx", ".txt", ".xml", ".yaml", ".yml",
}
TEXT_FILENAMES = {"AGENTS.md", "CLAUDE.md", "Dockerfile", "Makefile"}
KO_CODES = {
    "foundation": "기반 구축", "greenfield-framework": "신규 프레임워크 구축", "balanced": "균형형",
    "must": "필수", "specified": "정의됨", "accepted": "승인됨", "implemented": "구현됨", "done": "완료",
    "in_progress": "진행 중", "planned": "계획됨", "passed": "통과", "not_run": "미실행",
    "automated": "자동", "agent-eval": "AI 평가", "scenario": "시나리오", "integration": "통합",
    "open": "미결", "mitigated": "완화됨", "current": "최신", "required": "필수", "conditional": "조건부",
    "not_applicable": "해당 없음", "generated": "자동 생성", "generated-diagram": "자동 생성 다이어그램",
    "authored-and-linked": "직접 작성·연결", "feature": "기능", "medium": "중간", "high": "높음",
}

FILES = {
    "project": "project.json",
    "requirements": "requirements.json",
    "modules": "modules.json",
    "architecture": "architecture.json",
    "decisions": "decisions.json",
    "open_items": "open-items.json",
    "risks": "risks.json",
    "changes": "changes.json",
    "tests": "tests.json",
    "releases": "releases.json",
    "merges": "merges.json",
    "deliverables": "deliverables.json",
    "scenarios": "scenarios.json",
    "deployment": "deployment.json",
    "technology": "technology.json",
    "methodologies": "methodologies.json",
}


def read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def load_records() -> dict[str, dict[str, Any]]:
    return {name: read_json(SSOT / filename) for name, filename in FILES.items()}


def index(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {item["id"]: item for item in items}


def table(headers: list[str], rows: list[list[Any]]) -> str:
    def cell(value: Any) -> str:
        text = str(value if value is not None else "-")
        return text.replace("|", "\\|").replace("\n", " ")

    rendered = ["| " + " | ".join(map(cell, headers)) + " |"]
    rendered.append("|" + "|".join("---" for _ in headers) + "|")
    rendered.extend("| " + " | ".join(cell(value) for value in row) + " |" for row in rows)
    return "\n".join(rendered)


def ko_code(value: Any) -> Any:
    return KO_CODES.get(value, value)


def release_blockers(data: dict[str, dict[str, Any]], release: dict[str, Any]) -> list[str]:
    tests = index(data["tests"]["test_cases"])
    changes = index(data["changes"]["changes"])
    blockers: list[str] = []
    for test_id in release.get("required_tests", []):
        test = tests.get(test_id)
        if not test or test.get("status") != "passed":
            blockers.append(f"{test_id} 상태가 {ko_code(test.get('status', '누락') if test else '누락')}입니다")
    for change_id in release.get("changes", []):
        change = changes.get(change_id)
        if not change or change.get("status") not in {"done", "verified", "released"}:
            blockers.append(f"{change_id} 상태가 {ko_code(change.get('status', '누락') if change else '누락')}입니다")
    for item in data["open_items"]["open_items"]:
        if item.get("status") == "open" and item.get("blocking"):
            blockers.append(f"{item['id']}가 차단 중입니다")
    for risk in data["risks"]["risks"]:
        if risk.get("status") == "open" and risk.get("impact") == "critical" and not risk.get("accepted_by"):
            blockers.append(f"{risk['id']}는 수용되지 않은 치명적 위험입니다")
    for merge in data["merges"]["merges"]:
        if merge.get("status") == "needs_assessment":
            blockers.append(f"{merge['id']} 병합 영향을 평가하지 않았습니다")
    return blockers


def render_project(data: dict[str, dict[str, Any]]) -> str:
    project = data["project"]
    outcomes = "\n".join(
        f"- **{item['id']}** {item['statement']}  \n  측정: {item['measure']} · 목표: {item['target']}"
        for item in project["outcomes"]
    )
    inside = "\n".join(f"- {item}" for item in project["scope"]["in"])
    outside = "\n".join(f"- {item}" for item in project["scope"]["out"])
    return NOTICE + f"# {project['name']} — 프로젝트 개요\n\n## 비전\n\n{project['vision']}\n\n## 해결할 문제\n\n{project['problem']}\n\n## 현재 수행 조건\n\n- 단계: `{ko_code(project['phase'])}`\n- 수행 방식: `{ko_code(project['delivery_mode'])}`\n- 품질 프로필: `{ko_code(project['quality_profile'])}`\n- 고객 의사결정 책임자: {project['customer_decision_owner']}\n\n## 기대 성과\n\n{outcomes}\n\n## 포함 범위\n\n{inside}\n\n## 제외 범위\n\n{outside}\n"


def render_requirements(data: dict[str, dict[str, Any]]) -> str:
    sections = []
    for req in data["requirements"]["requirements"]:
        criteria = "\n".join(f"- {item}" for item in req["acceptance_criteria"])
        sections.append(
            f"## {req['id']} — {req['title']}\n\n{req['statement']}\n\n"
            f"- 우선순위/상태: `{ko_code(req['priority'])}` / `{ko_code(req['status'])}`\n"
            f"- 담당: {req['owner']}\n- 모듈: {', '.join(req['modules'])}\n"
            f"- 검증: {', '.join(req['verification'])}\n- 출처: {req['source']}\n\n"
            f"인수 기준:\n\n{criteria}"
        )
    return NOTICE + "# 요구사항 정의서\n\n" + "\n\n".join(sections) + "\n"


def render_architecture(data: dict[str, dict[str, Any]]) -> str:
    architecture = data["architecture"]
    modules = data["modules"]["modules"]
    principles = table(["ID", "원칙", "규칙"], [[p["id"], p["name"], p["rule"]] for p in architecture["principles"]])
    components = table(["ID", "컴포넌트", "유형", "책임", "모듈"], [[c["id"], c["name"], c["type"], c["responsibility"], ", ".join(c["modules"])] for c in architecture["components"]])
    roles = table(["ID", "역할 관점", "필수 증거"], [[r["id"], r["name"], ", ".join(r["evidence"])] for r in architecture["role_lenses"]])
    graph = ["```mermaid", "flowchart LR"]
    for module in modules:
        graph.append(f"  {module['id'].replace('-', '_')}[\"{module['id']} {module['name']}\"]")
    for module in modules:
        for dependency in module["dependencies"]:
            graph.append(f"  {dependency.replace('-', '_')} --> {module['id'].replace('-', '_')}")
    graph.append("```")
    flows = "\n".join(f"- **{f['id']} {f['name']}:** " + " → ".join(f["steps"]) for f in architecture["flows"])
    return NOTICE + f"# 아키텍처 정의서\n\n## 원칙\n\n{principles}\n\n## 모듈 의존성 뷰\n\n" + "\n".join(graph) + f"\n\n## 컴포넌트\n\n{components}\n\n## 생애주기 흐름\n\n{flows}\n\n## 역할 관점\n\n{roles}\n"


def render_traceability(data: dict[str, dict[str, Any]]) -> str:
    rows = [[r["id"], r["title"], ko_code(r["status"]), ", ".join(r["modules"]), ", ".join(r["verification"]), r["source"]] for r in data["requirements"]["requirements"]]
    return NOTICE + "# 추적성 매트릭스\n\n" + table(["요구사항", "제목", "상태", "모듈", "검증", "출처"], rows) + "\n"


def render_decisions(data: dict[str, dict[str, Any]]) -> str:
    parts = []
    for item in data["decisions"]["decisions"]:
        parts.append(
            f"## {item['id']} — {item['title']}\n\n- 상태/일자: `{ko_code(item['status'])}` / {item['date']}\n"
            f"- 요구사항: {', '.join(item['requirements'])}\n- 대체 대상: {item['supersedes'] or '-'}\n\n"
            f"**맥락:** {item['context']}\n\n**선택지:** " + "; ".join(item["options"]) +
            f"\n\n**결정:** {item['decision']}\n\n**결과:** " + "; ".join(item["consequences"]) +
            f"\n\n**롤백·대체 경로:** {item['rollback']}"
        )
    return NOTICE + "# 의사결정 기록\n\n" + "\n\n".join(parts) + "\n"


def render_open_items(data: dict[str, dict[str, Any]]) -> str:
    rows = [[i["id"], i["title"], ko_code(i["status"]), "예" if i["blocking"] else "아니요", i["owner"], i["due"], i["question"], i["resolution"]] for i in data["open_items"]["open_items"]]
    return NOTICE + "# 미결 사항\n\n" + table(["ID", "제목", "상태", "차단 여부", "담당", "기한", "질문", "해결 내용"], rows) + "\n"


def render_tests(data: dict[str, dict[str, Any]]) -> str:
    tests = data["tests"]["test_cases"]
    counts = Counter(test["status"] for test in tests)
    summary = ", ".join(f"{ko_code(key)}: {value}" for key, value in sorted(counts.items())) or "없음"
    rows = [[t["id"], t["title"], ko_code(t["type"]), ko_code(t["status"]), "예" if t["required"] else "아니요", ", ".join(t["requirements"]), t["evidence"]] for t in tests]
    return NOTICE + f"# 테스트 계획 및 결과서\n\n상태 요약: {summary}.\n\n" + table(["ID", "테스트", "유형", "상태", "필수 여부", "요구사항", "증거"], rows) + "\n"


def render_release(data: dict[str, dict[str, Any]]) -> str:
    parts = []
    for release in data["releases"]["releases"]:
        blockers = release_blockers(data, release)
        blocker_text = "\n".join(f"- {item}" for item in blockers) if blockers else "- 없음"
        parts.append(
            f"## {release['id']} — {release['name']}\n\n- 기록된 상태: `{ko_code(release['status'])}`\n"
            f"- 계산된 출시 준비도: `{'차단됨' if blockers else '준비됨'}`\n- 목표일: {release['target_date'] or '-'}\n"
            f"- 변경 사항: {', '.join(release['changes'])}\n- 필수 테스트: {', '.join(release['required_tests'])}\n"
            f"- 출시 여부 결정: {release['decision'] or '-'}\n- 롤백: {release['rollback']}\n\n### 차단 요소\n\n{blocker_text}"
        )
    return NOTICE + "# 출시 준비도\n\n" + "\n\n".join(parts) + "\n"


def render_deliverables(data: dict[str, dict[str, Any]]) -> str:
    rows = [
        [item["id"], item["name"], ko_code(item["mode"]), ko_code(item["applicability"]), ko_code(item["status"]), item.get("path"), ", ".join(item.get("source", [])), item.get("note")]
        for item in data["deliverables"]["deliverables"]
    ]
    return NOTICE + "# 산출물 목록\n\n" + table(["ID", "산출물", "생성 방식", "적용 조건", "상태", "경로", "정본 출처", "비고"], rows) + "\n"


def render_use_cases(data: dict[str, dict[str, Any]]) -> str:
    sections = []
    for item in data["scenarios"]["use_cases"]:
        numbered = "\n".join(f"{number}. {step}" for number, step in enumerate(item["main_flow"], 1))
        alternatives = "\n".join(f"- {step}" for step in item["alternatives"])
        sections.append(
            f"## {item['id']} — {item['name']}\n\n- 주 행위자: {item['primary_actor']}\n"
            f"- 보조 행위자: {', '.join(item['supporting_actors'])}\n- 시작 조건: {item['trigger']}\n"
            f"- 요구사항: {', '.join(item['requirements'])}\n\n### 기본 흐름\n\n{numbered}\n\n"
            f"### 대안 및 예외 흐름\n\n{alternatives}\n\n### 사후 조건\n\n" +
            "\n".join(f"- {value}" for value in item["postconditions"])
        )
    return NOTICE + "# 유즈 케이스 목록\n\n" + "\n\n".join(sections) + "\n"


def render_sequences(data: dict[str, dict[str, Any]]) -> str:
    sections = []
    for sequence in data["scenarios"]["sequences"]:
        diagram = ["```mermaid", "sequenceDiagram"]
        for participant in sequence["participants"]:
            diagram.append(f"  participant {participant['id']} as {participant['label']}")
        for message in sequence["messages"]:
            diagram.append(f"  {message['from']}->>{message['to']}: {message['text']}")
        diagram.append("```")
        sections.append(f"## {sequence['id']} — {sequence['name']}\n\n요구사항: {', '.join(sequence['requirements'])}\n\n" + "\n".join(diagram))
    return NOTICE + "# 시퀀스 다이어그램\n\n" + "\n\n".join(sections) + "\n"


def render_technology(data: dict[str, dict[str, Any]]) -> str:
    technology = data["technology"]
    policy = technology["policy"]
    sequence = "\n".join(f"{number}. {step}" for number, step in enumerate(policy["sequence"], 1))
    sections = [
        f"# 기술 스택과 개발 기반 게이트\n\n"
        f"## {policy['id']} — {policy['title']}\n\n"
        f"- 상태: `{ko_code(policy['status'])}`\n- 요구사항: {', '.join(policy['requirements'])}\n\n"
        f"### 필수 순서\n\n{sequence}\n\n**테일러링 규칙:** {policy['tailoring']}"
    ]
    for gate in technology["gates"]:
        applies = "\n".join(f"- {item}" for item in gate["applies_when"])
        entries = "\n".join(f"- {item}" for item in gate["entry_criteria"])
        dimensions = "\n".join(f"- {item}" for item in gate.get("decision_dimensions", [])) or "- 해당 없음"
        evidence = "\n".join(f"- {item}" for item in gate["required_evidence"])
        exits = "\n".join(f"- {item}" for item in gate["exit_criteria"])
        reopen = "\n".join(f"- {item}" for item in gate["reopen_triggers"])
        sections.append(
            f"## {gate['id']} — {gate['title']}\n\n- 상태: `{ko_code(gate['status'])}`\n"
            f"- 담당: {gate['owner']}\n- 요구사항: {', '.join(gate['requirements'])}\n\n"
            f"### 적용 조건\n\n{applies}\n\n### 진입 기준\n\n{entries}\n\n"
            f"### 평가 차원\n\n{dimensions}\n\n### 필수 증거\n\n{evidence}\n\n"
            f"### 종료 기준\n\n{exits}\n\n### 재평가 조건\n\n{reopen}"
        )
    for baseline in technology["baselines"]:
        choices = table(
            ["영역", "선택", "근거"],
            [[item["area"], item["selection"], item["reason"]] for item in baseline["choices"]],
        )
        not_applicable = "\n".join(f"- {item}" for item in baseline.get("not_applicable", [])) or "- 없음"
        sections.append(
            f"## {baseline['id']} — {baseline['name']}\n\n- 범위: {baseline['scope']}\n"
            f"- 상태: `{ko_code(baseline['status'])}`\n- 요구사항: {', '.join(baseline['requirements'])}\n\n"
            f"**결정:** {baseline['decision']}\n\n### 기술 선택\n\n{choices}\n\n"
            f"### 적용 대상 아님\n\n{not_applicable}"
        )
    return NOTICE + "\n\n".join(sections) + "\n"


def render_deployment(data: dict[str, dict[str, Any]]) -> str:
    deployment = data["deployment"]
    policy = deployment["policy"]
    gate = deployment["gate"]
    sequence = "\n".join(f"{number}. {step}" for number, step in enumerate(policy["sequence"], 1))
    early_required = "\n".join(f"- {item}" for item in policy["early_required"])
    deferable = "\n".join(f"- {item}" for item in policy["deferable_details"])
    sections = [
        f"# 배포·운영 맥락과 설계 위험 예방\n\n"
        f"## {policy['id']} — {policy['title']}\n\n"
        f"- 상태: `{ko_code(policy['status'])}`\n- 요구사항: {', '.join(policy['requirements'])}\n\n"
        f"{policy['rule']}\n\n### 필수 순서\n\n{sequence}\n\n"
        f"### 조기에 확인할 환경 범주\n\n{early_required}\n\n"
        f"### 상세 설계까지 미룰 수 있는 값\n\n{deferable}"
    ]
    for heading, field in (
        ("적용 조건", "applies_when"),
        ("진입 기준", "entry_criteria"),
        ("필수 증거", "required_evidence"),
        ("종료 기준", "exit_criteria"),
        ("재평가 조건", "reopen_triggers"),
    ):
        if field == "applies_when":
            gate_intro = (
                f"## {gate['id']} — {gate['title']}\n\n- 상태: `{ko_code(gate['status'])}`\n"
                f"- 담당: {gate['owner']}\n- 요구사항: {', '.join(gate['requirements'])}"
            )
            sections.append(gate_intro)
        sections.append(f"### {heading}\n\n" + "\n".join(f"- {item}" for item in gate[field]))
    for profile in deployment["profiles"]:
        profile_rows = [
            ["환경", profile["environment"]],
            ["호스팅", profile["hosting"]],
            ["런타임", profile["runtime"]],
            ["토폴로지", profile["topology"]],
            ["확장", profile["scaling"]],
            ["DBMS", profile["dbms"]],
            ["상태", profile["state"]],
            ["워크로드", profile["workload"]],
            ["가용성·복구", profile["availability"]],
            ["보안·운영", profile["security_operations"]],
        ]
        assumptions = "\n".join(f"- {item}" for item in profile.get("open_assumptions", [])) or "- 없음"
        sections.append(
            f"## {profile['id']} — {profile['name']}\n\n- 범위: {profile['scope']}\n"
            f"- 상태: `{ko_code(profile['status'])}`\n- 요구사항: {', '.join(profile['requirements'])}\n\n"
            f"{table(['항목', '기준'], profile_rows)}\n\n### 남은 가정\n\n{assumptions}"
        )
    interview_rows = [
        [item["id"], item["topic"], "<br>".join(item["questions"])]
        for item in deployment["interview_dimensions"]
    ]
    sections.append("## 환경 인터뷰 차원\n\n" + table(["ID", "주제", "확인 질문"], interview_rows))
    for pattern in deployment["risk_patterns"]:
        questions = "\n".join(f"- {item}" for item in pattern["design_questions"])
        failures = "\n".join(f"- {item}" for item in pattern["failure_modes"])
        controls = "\n".join(f"- {item}" for item in pattern["candidate_controls"])
        verification = "\n".join(f"- {item}" for item in pattern["verification"])
        sections.append(
            f"## {pattern['id']} — {pattern['name']}\n\n### 설계 질문\n\n{questions}\n\n"
            f"### 실패 형태\n\n{failures}\n\n### 후보 통제\n\n{controls}\n\n"
            f"### 검증 증거\n\n{verification}"
        )
    return NOTICE + "\n\n".join(sections) + "\n"


def render_methodologies(data: dict[str, dict[str, Any]]) -> str:
    methodologies = data["methodologies"]
    policy = methodologies["selection_policy"]
    routing = "\n".join(f"- {item}" for item in policy["routing"])
    method_index = index(methodologies["methods"])
    profile_sections = []
    for profile in methodologies.get("profiles", []):
        selected = "\n".join(f"- {method_id} {method_index[method_id]['name']}" for method_id in profile["selected_methods"])
        controls = "\n".join(f"- {item}" for item in profile["mandatory_controls"])
        triggers = "\n".join(f"- {item}" for item in profile["reassessment_triggers"])
        profile_sections.append(
            f"### {profile['id']} — {profile['name']}\n\n- 범위: {profile['scope']}\n"
            f"- 상태: `{ko_code(profile['status'])}`\n- 요구사항: {', '.join(profile['requirements'])}\n\n"
            f"**선택 근거:** {profile['rationale']}\n\n#### 채택 방법론\n\n{selected}\n\n"
            f"#### 필수 통제\n\n{controls}\n\n#### 재평가 조건\n\n{triggers}"
        )
    rows = []
    for method in methodologies["methods"]:
        sources = "<br>".join(f"[출처 {number}]({url})" for number, url in enumerate(method["sources"], 1))
        rows.append([
            method["id"], method["name"], method["category"], method["best_fit"],
            " · ".join(method["strengths"]), " · ".join(method["limitations"]),
            " · ".join(method["adopted_controls"]), " · ".join(method["aidd_mapping"]), sources,
        ])
    comparison = table(
        ["ID", "방법론", "분류", "적합한 상황", "강점", "한계", "채택 통제", "AIDD 연결", "근거"],
        rows,
    )
    profiles_text = "\n\n".join(profile_sections) or "적용 프로필이 아직 없습니다."
    return (
        NOTICE + f"# 방법론 비교와 적용 지침\n\n## {policy['id']} — {policy['title']}\n\n"
        f"- 상태: `{ko_code(policy['status'])}`\n- 요구사항: {', '.join(policy['requirements'])}\n\n"
        f"{policy['rule']}\n\n### 수행 경로 선택 규칙\n\n{routing}\n\n"
        f"## 적용 프로필\n\n{profiles_text}\n\n## 비교표\n\n{comparison}\n"
    )


def status_text(data: dict[str, dict[str, Any]], level: str, module_id: str | None = None) -> str:
    project = data["project"]
    reqs = data["requirements"]["requirements"]
    modules = data["modules"]["modules"]
    tests = data["tests"]["test_cases"]
    open_items = data["open_items"]["open_items"]
    risks = data["risks"]["risks"]
    changes = data["changes"]["changes"]
    releases = data["releases"]["releases"]
    technology_gates = data["technology"]["gates"]
    technology_baselines = data["technology"]["baselines"]
    deployment_profiles = data["deployment"].get("profiles", [])
    design_risks = data["deployment"].get("risk_patterns", [])
    methodology_profiles = data["methodologies"].get("profiles", [])
    if level == "module":
        selected = next((m for m in modules if m["id"] == module_id), None)
        if not selected:
            raise ValueError(f"알 수 없는 모듈: {module_id}")
        req_index = index(reqs)
        rows = [[rid, req_index[rid]["title"], ko_code(req_index[rid]["status"]), ", ".join(req_index[rid]["verification"])] for rid in selected["requirements"]]
        return f"# {selected['id']} — {selected['name']}\n\n- 상태: `{ko_code(selected['status'])}`\n- 목적: {selected['purpose']}\n- 의존 모듈: {', '.join(selected['dependencies']) or '없음'}\n\n" + table(["요구사항", "제목", "상태", "검증"], rows)
    req_counts = Counter(r["status"] for r in reqs)
    test_counts = Counter(t["status"] for t in tests)
    module_counts = Counter(m["status"] for m in modules)
    next_decisions = [i for i in open_items if i["status"] == "open"]
    release_lines = []
    for release in releases:
        blockers = release_blockers(data, release)
        release_lines.append(f"- {release['id']} {release['name']}: {'차단됨' if blockers else '준비됨'} (차단 요소 {len(blockers)}개)")
    req_summary = ", ".join(f"{ko_code(key)} {value}개" for key, value in sorted(req_counts.items())) or "없음"
    module_summary = ", ".join(f"{ko_code(key)} {value}개" for key, value in sorted(module_counts.items())) or "없음"
    test_summary = ", ".join(f"{ko_code(key)} {value}개" for key, value in sorted(test_counts.items())) or "없음"
    text = (
        f"# {project['name']} 현황\n\n- 단계: `{ko_code(project['phase'])}`\n"
        f"- 요구사항 상태: {req_summary}\n"
        f"- 모듈 상태: {module_summary}\n"
        f"- 테스트 상태: {test_summary}\n"
        f"- 적용 방법론 프로필: {', '.join(item['id'] + ' ' + item['name'] for item in methodology_profiles) or '없음'}\n"
        f"- 배포 프로필: {', '.join(item['id'] + ' ' + item['name'] for item in deployment_profiles) or '없음'}; 설계 위험 패턴: {len(design_risks)}개\n"
        f"- 기술 게이트: {len(technology_gates)}개; 승인된 기술 기준선: {sum(1 for item in technology_baselines if item['status'] == 'accepted')}개\n"
        f"- 미결 사항: {len(next_decisions)}개; 차단 중: {sum(1 for i in next_decisions if i['blocking'])}개\n"
        f"- 미결 위험: {sum(1 for r in risks if r['status'] == 'open')}개\n\n## 출시 준비 상태\n\n" + "\n".join(release_lines)
    )
    if level == "executive":
        decisions = "\n".join(f"- {i['id']} ({i['owner']}): {i['question']}" for i in next_decisions) or "- 없음"
        return text + f"\n\n## 필요한 의사결정 및 확인\n\n{decisions}\n"
    detail_rows = [[c["id"], ko_code(c["type"]), ko_code(c["class"]), ko_code(c["status"]), ", ".join(c["modules"]), c["title"]] for c in changes]
    item_rows = [[i["id"], ko_code(i["status"]), "예" if i["blocking"] else "아니요", i["owner"], i["title"]] for i in open_items]
    risk_rows = [[r["id"], ko_code(r["likelihood"]), ko_code(r["impact"]), ko_code(r["status"]), r["owner"], r["title"]] for r in risks]
    return text + "\n\n## 변경 사항\n\n" + table(["ID", "유형", "등급", "상태", "모듈", "제목"], detail_rows) + "\n\n## 미결 사항\n\n" + table(["ID", "상태", "차단 여부", "담당", "제목"], item_rows) + "\n\n## 위험\n\n" + table(["ID", "가능성", "영향", "상태", "담당", "제목"], risk_rows) + "\n"


def render_documents(data: dict[str, dict[str, Any]]) -> dict[str, str]:
    return {
        "project-brief.md": render_project(data),
        "requirements.md": render_requirements(data),
        "architecture.md": render_architecture(data),
        "traceability.md": render_traceability(data),
        "decisions.md": render_decisions(data),
        "open-items.md": render_open_items(data),
        "test-report.md": render_tests(data),
        "release-readiness.md": render_release(data),
        "deliverable-catalog.md": render_deliverables(data),
        "use-cases.md": render_use_cases(data),
        "sequences.md": render_sequences(data),
        "deployment-and-runtime.md": render_deployment(data),
        "technology-gates.md": render_technology(data),
        "methodology-comparison.md": render_methodologies(data),
        "status.md": NOTICE + status_text(data, "detail"),
    }


def compare_trees(left: Path, right: Path) -> list[str]:
    if not right.exists():
        return [f"missing adapter tree {right.relative_to(ROOT)}"]
    differences: list[str] = []
    comparison = filecmp.dircmp(left, right, ignore=["__pycache__"])

    def walk(node: filecmp.dircmp, prefix: Path) -> None:
        for name in node.left_only:
            differences.append(f"missing {prefix / name}")
        for name in node.right_only:
            differences.append(f"unexpected {prefix / name}")
        for name in node.diff_files + node.funny_files:
            differences.append(f"different {prefix / name}")
        for name, child in node.subdirs.items():
            walk(child, prefix / name)

    walk(comparison, Path(right.name))
    return differences


def validate_utf8_no_bom() -> list[str]:
    errors: list[str] = []
    excluded_parts = {".git", "__pycache__", ".pytest_cache"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in excluded_parts for part in path.parts):
            continue
        if path.suffix.lower() not in TEXT_EXTENSIONS and path.name not in TEXT_FILENAMES:
            continue
        raw = path.read_bytes()
        relative = path.relative_to(ROOT)
        if raw.startswith(b"\xef\xbb\xbf"):
            errors.append(f"{relative} 파일에 UTF-8 BOM이 있습니다")
            continue
        try:
            raw.decode("utf-8")
        except UnicodeDecodeError:
            errors.append(f"{relative} 파일이 올바른 UTF-8이 아닙니다")
    return errors


def validate(data: dict[str, dict[str, Any]], check_generated: bool = True, check_adapters: bool = True) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    errors.extend(validate_utf8_no_bom())
    requirements = index(data["requirements"].get("requirements", []))
    modules = index(data["modules"].get("modules", []))
    tests = index(data["tests"].get("test_cases", []))
    decisions = index(data["decisions"].get("decisions", []))
    changes = index(data["changes"].get("changes", []))
    all_items: list[dict[str, Any]] = []
    for key in ("requirements", "modules", "decisions", "open_items", "risks", "changes", "tests", "releases", "merges", "deliverables"):
        collection_name = {"requirements": "requirements", "modules": "modules", "decisions": "decisions", "open_items": "open_items", "risks": "risks", "changes": "changes", "tests": "test_cases", "releases": "releases", "merges": "merges", "deliverables": "deliverables"}[key]
        items = data[key].get(collection_name, [])
        all_items.extend(items)
        ids = [item.get("id") for item in items]
        if len(ids) != len(set(ids)):
            errors.append(f"duplicate IDs in {FILES[key]}")
    scenario_items = data["scenarios"].get("use_cases", []) + data["scenarios"].get("sequences", [])
    scenario_ids = [item.get("id") for item in scenario_items]
    if len(scenario_ids) != len(set(scenario_ids)):
        errors.append("duplicate IDs in scenarios.json")
    all_items.extend(scenario_items)
    deployment = data["deployment"]
    deployment_items = (
        [deployment.get("policy", {}), deployment.get("gate", {})]
        + deployment.get("profiles", [])
        + deployment.get("interview_dimensions", [])
        + deployment.get("risk_patterns", [])
    )
    deployment_ids = [item.get("id") for item in deployment_items]
    if len(deployment_ids) != len(set(deployment_ids)):
        errors.append("duplicate IDs in deployment.json")
    all_items.extend(deployment_items)
    technology_items = [data["technology"].get("policy", {})] + data["technology"].get("gates", []) + data["technology"].get("baselines", [])
    technology_ids = [item.get("id") for item in technology_items]
    if len(technology_ids) != len(set(technology_ids)):
        errors.append("duplicate IDs in technology.json")
    all_items.extend(technology_items)
    methodology_items = [data["methodologies"].get("selection_policy", {})] + data["methodologies"].get("profiles", []) + data["methodologies"].get("methods", [])
    methodology_ids = [item.get("id") for item in methodology_items]
    if len(methodology_ids) != len(set(methodology_ids)):
        errors.append("duplicate IDs in methodologies.json")
    all_items.extend(methodology_items)
    for item in all_items:
        artifact_id = item.get("id", "")
        if not ID_PATTERN.match(artifact_id):
            errors.append(f"invalid stable ID: {artifact_id!r}")
    for req in requirements.values():
        if not req.get("acceptance_criteria"):
            errors.append(f"{req['id']} has no acceptance criteria")
        for module_id in req.get("modules", []):
            if module_id not in modules:
                errors.append(f"{req['id']} references unknown module {module_id}")
            elif req["id"] not in modules[module_id].get("requirements", []):
                errors.append(f"{req['id']} / {module_id} link is not bidirectional")
        for test_id in req.get("verification", []):
            if test_id not in tests:
                errors.append(f"{req['id']} references unknown test {test_id}")
            elif req["id"] not in tests[test_id].get("requirements", []):
                errors.append(f"{req['id']} / {test_id} link is not bidirectional")
        if req.get("status") in {"accepted", "implemented", "done"}:
            for test_id in req.get("verification", []):
                if tests[test_id].get("status") != "passed":
                    errors.append(f"{req['id']} is {req['status']} but {test_id} has not passed")
    for module in modules.values():
        for req_id in module.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{module['id']} references unknown requirement {req_id}")
        for dependency in module.get("dependencies", []):
            if dependency not in modules:
                errors.append(f"{module['id']} references unknown dependency {dependency}")
    for test in tests.values():
        for req_id in test.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{test['id']} references unknown requirement {req_id}")
    for decision in decisions.values():
        for req_id in decision.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{decision['id']} references unknown requirement {req_id}")
        if decision.get("status") == "accepted" and (not decision.get("consequences") or not decision.get("rollback")):
            errors.append(f"{decision['id']} is accepted without consequences/rollback")
        supersedes = decision.get("supersedes")
        if supersedes and supersedes not in decisions:
            errors.append(f"{decision['id']} supersedes unknown decision {supersedes}")
    for item in data["open_items"]["open_items"]:
        if item.get("status") == "closed" and not item.get("resolution"):
            errors.append(f"{item['id']} is closed without a resolution")
    for change in changes.values():
        if change.get("class") not in {"C0", "C1", "C2", "C3"}:
            errors.append(f"{change['id']} has invalid change class")
        for req_id in change.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{change['id']} references unknown requirement {req_id}")
        for module_id in change.get("modules", []):
            if module_id not in modules:
                errors.append(f"{change['id']} references unknown module {module_id}")
    for release in data["releases"]["releases"]:
        for change_id in release.get("changes", []):
            if change_id not in changes:
                errors.append(f"{release['id']} references unknown change {change_id}")
        for test_id in release.get("required_tests", []):
            if test_id not in tests:
                errors.append(f"{release['id']} references unknown test {test_id}")
        if release.get("status") == "ready" and release_blockers(data, release):
            errors.append(f"{release['id']} is marked ready while blockers remain")
    for risk in data["risks"]["risks"]:
        for req_id in risk.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{risk['id']} references unknown requirement {req_id}")
    for scenario in scenario_items:
        for req_id in scenario.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{scenario['id']} references unknown requirement {req_id}")
    deployment_policy = deployment.get("policy", {})
    deployment_gate = deployment.get("gate", {})
    deployment_sequence = " ".join(deployment_policy.get("sequence", []))
    for gate_id in ("DG-001", "TG-001", "TG-002"):
        if gate_id not in deployment_sequence:
            errors.append(f"{deployment_policy.get('id', 'deployment policy')} sequence does not include {gate_id}")
    if all(gate_id in deployment_sequence for gate_id in ("DG-001", "TG-001", "TG-002")):
        if not deployment_sequence.index("DG-001") < deployment_sequence.index("TG-001") < deployment_sequence.index("TG-002"):
            errors.append(f"{deployment_policy.get('id', 'deployment policy')} gate order is invalid")
    for field in ("early_required", "deferable_details"):
        if not deployment_policy.get(field):
            errors.append(f"{deployment_policy.get('id', 'deployment policy')} has no {field}")
    for item in [deployment_policy, deployment_gate] + deployment.get("profiles", []):
        for req_id in item.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{item.get('id')} references unknown requirement {req_id}")
    for field in ("applies_when", "entry_criteria", "required_evidence", "exit_criteria", "reopen_triggers"):
        if not deployment_gate.get(field):
            errors.append(f"{deployment_gate.get('id', 'deployment gate')} has no {field}")
    profile_fields = ("environment", "hosting", "runtime", "topology", "scaling", "dbms", "state", "workload", "availability", "security_operations")
    for profile in deployment.get("profiles", []):
        for field in profile_fields:
            if not profile.get(field):
                errors.append(f"{profile['id']} has no {field}")
    for dimension in deployment.get("interview_dimensions", []):
        if not dimension.get("topic") or not dimension.get("questions"):
            errors.append(f"{dimension['id']} has incomplete interview content")
    required_risk_patterns = {f"DPR-{number:03d}" for number in range(1, 9)}
    actual_risk_patterns = {item.get("id") for item in deployment.get("risk_patterns", [])}
    if not required_risk_patterns.issubset(actual_risk_patterns):
        errors.append("deployment.json does not cover all required design risk patterns")
    for pattern in deployment.get("risk_patterns", []):
        for field in ("design_questions", "failure_modes", "candidate_controls", "verification"):
            if not pattern.get(field):
                errors.append(f"{pattern['id']} has no {field}")
    technology = data["technology"]
    policy = technology.get("policy", {})
    sequence_text = " ".join(policy.get("sequence", []))
    for gate_id in ("TG-001", "TG-002"):
        if gate_id not in sequence_text:
            errors.append(f"{policy.get('id', 'technology policy')} sequence does not include {gate_id}")
    if all(gate_id in sequence_text for gate_id in ("DG-001", "TG-001", "TG-002")):
        if not sequence_text.index("DG-001") < sequence_text.index("TG-001") < sequence_text.index("TG-002"):
            errors.append(f"{policy.get('id', 'technology policy')} gate order is invalid")
    for item in technology_items:
        for req_id in item.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{item.get('id')} references unknown requirement {req_id}")
    for gate in technology.get("gates", []):
        for field in ("applies_when", "entry_criteria", "required_evidence", "exit_criteria", "reopen_triggers"):
            if not gate.get(field):
                errors.append(f"{gate['id']} has no {field}")
    for baseline in technology.get("baselines", []):
        if not baseline.get("choices"):
            errors.append(f"{baseline['id']} has no technology choices")
    methodologies = data["methodologies"]
    selection_policy = methodologies.get("selection_policy", {})
    for req_id in selection_policy.get("requirements", []):
        if req_id not in requirements:
            errors.append(f"{selection_policy.get('id')} references unknown requirement {req_id}")
    if not selection_policy.get("routing"):
        errors.append(f"{selection_policy.get('id', 'methodology policy')} has no routing rules")
    method_categories = {method.get("category") for method in methodologies.get("methods", [])}
    required_categories = {"전통적 프로젝트 관리", "전통적 시스템공학", "AI 주도 명세 개발"}
    if not required_categories.issubset(method_categories):
        errors.append("methodologies.json does not cover required traditional and AI-driven categories")
    for method in methodologies.get("methods", []):
        for field in ("best_fit", "strengths", "limitations", "adopted_controls", "aidd_mapping", "sources"):
            if not method.get(field):
                errors.append(f"{method['id']} has no {field}")
        for source in method.get("sources", []):
            if not source.startswith("https://"):
                errors.append(f"{method['id']} has a non-HTTPS source")
    methods = index(methodologies.get("methods", []))
    for profile in methodologies.get("profiles", []):
        for req_id in profile.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{profile['id']} references unknown requirement {req_id}")
        for method_id in profile.get("selected_methods", []):
            if method_id not in methods:
                errors.append(f"{profile['id']} references unknown methodology {method_id}")
        for field in ("selected_methods", "rationale", "mandatory_controls", "reassessment_triggers"):
            if not profile.get(field):
                errors.append(f"{profile['id']} has no {field}")
    for sequence in data["scenarios"].get("sequences", []):
        participants = {item["id"] for item in sequence.get("participants", [])}
        for message in sequence.get("messages", []):
            if message.get("from") not in participants or message.get("to") not in participants:
                errors.append(f"{sequence['id']} contains a message with an unknown participant")
    for merge in data["merges"]["merges"]:
        if merge.get("status") == "needs_assessment":
            warnings.append(f"{merge['id']} needs merge-impact assessment")
    for deliverable in data["deliverables"]["deliverables"]:
        path_value = deliverable.get("path")
        if deliverable.get("applicability") == "required" and deliverable.get("status") == "current":
            if not path_value or not (ROOT / path_value).exists():
                errors.append(f"{deliverable['id']} is current but its path is missing")
    contract = (ROOT / ".ai" / "core" / "agent-contract.md").read_text(encoding="utf-8")
    for filename in ("AGENTS.md", "CLAUDE.md"):
        path = ROOT / filename
        if not path.exists() or path.read_text(encoding="utf-8") != contract:
            errors.append(f"{filename} has drifted from .ai/core/agent-contract.md")
    if check_adapters:
        for target in SKILL_TARGETS:
            errors.extend(compare_trees(CANONICAL_SKILLS, target))
    if check_generated:
        for filename, expected in render_documents(data).items():
            path = GENERATED / filename
            if not path.exists():
                errors.append(f"missing generated document docs/generated/{filename}")
            elif path.read_text(encoding="utf-8") != expected:
                errors.append(f"stale generated document docs/generated/{filename}")
    return errors, warnings


def generate(data: dict[str, dict[str, Any]]) -> None:
    GENERATED.mkdir(parents=True, exist_ok=True)
    for filename, content in render_documents(data).items():
        (GENERATED / filename).write_text(content, encoding="utf-8", newline="\n")


def safe_replace_tree(source: Path, destination: Path) -> None:
    resolved_root = ROOT.resolve()
    resolved_destination = destination.resolve()
    if resolved_root not in resolved_destination.parents or destination not in SKILL_TARGETS:
        raise RuntimeError(f"Refusing to replace unsafe destination: {destination}")
    if destination.exists():
        shutil.rmtree(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, destination)


def sync_ai() -> None:
    contract = (ROOT / ".ai" / "core" / "agent-contract.md").read_text(encoding="utf-8")
    (ROOT / "AGENTS.md").write_text(contract, encoding="utf-8", newline="\n")
    (ROOT / "CLAUDE.md").write_text(contract, encoding="utf-8", newline="\n")
    for target in SKILL_TARGETS:
        safe_replace_tree(CANONICAL_SKILLS, target)


def git(*args: str) -> str:
    result = subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def record_merge() -> str:
    try:
        head = git("rev-parse", "HEAD")
        parents = git("rev-list", "--parents", "-n", "1", "HEAD").split()[1:]
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "No Git repository; no merge recorded."
    if len(parents) < 2:
        return "HEAD is not a merge commit; no merge recorded."
    path = SSOT / FILES["merges"]
    payload = read_json(path)
    if any(item.get("commit") == head for item in payload["merges"]):
        return f"Merge {head[:12]} is already recorded."
    changed = git("diff", "--name-only", f"{parents[0]}..{head}").splitlines()
    next_number = max([int(item["id"].split("-")[1]) for item in payload["merges"]] or [0]) + 1
    merge_id = f"MRG-{next_number:03d}"
    payload["merges"].append({
        "id": merge_id,
        "commit": head,
        "parents": parents,
        "changed_files": changed,
        "affected_modules": [],
        "conflict_resolution_notes": "pending",
        "additional_testing": "pending",
        "status": "needs_assessment",
    })
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return f"Recorded {merge_id} for merge {head[:12]}; impact assessment is required."


def install_git_hooks() -> str:
    try:
        git("rev-parse", "--show-toplevel")
        git("config", "core.hooksPath", ".githooks")
    except FileNotFoundError:
        raise RuntimeError("Git is not installed or not available on PATH.")
    except subprocess.CalledProcessError as exc:
        raise RuntimeError("Initialize a Git repository before installing hooks.") from exc
    return "Configured Git to use .githooks; merge-impact recording is active."


def run_hook(platform: str, event: str) -> int:
    try:
        hook_input = json.load(sys.stdin)
    except json.JSONDecodeError:
        hook_input = {}
    if event.lower() == "stop" and hook_input.get("stop_hook_active"):
        print("{}")
        return 0
    try:
        data = load_records()
        errors, _ = validate(data)
    except Exception as exc:  # Hook must turn failures into actionable model feedback.
        errors = [f"AIDD validation could not run: {exc}"]
    if errors:
        reason = "AIDD consistency gate failed. Fix these before stopping:\n- " + "\n- ".join(errors[:20])
        print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
    else:
        print("{}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="AIDD canonical-registry tooling")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("generate", help="regenerate human-readable artifacts")
    sub.add_parser("validate", help="validate canonical links and generated/adapted drift")
    sub.add_parser("sync-ai", help="synchronize canonical instructions and skills to both agents")
    status_parser = sub.add_parser("status", help="render current project status")
    status_parser.add_argument("--level", choices=("executive", "detail", "module"), default="executive")
    status_parser.add_argument("--module", help="module ID for --level module")
    sub.add_parser("record-merge", help="record HEAD when it is a merge commit")
    sub.add_parser("install-hooks", help="configure this Git repository to use .githooks")
    hook_parser = sub.add_parser("hook", help="run a lifecycle gate for an agent adapter")
    hook_parser.add_argument("--platform", choices=("codex", "claude"), required=True)
    hook_parser.add_argument("--event", required=True)
    args = parser.parse_args()

    if args.command == "sync-ai":
        sync_ai()
        print("Synchronized agent instructions and skills.")
        return 0
    if args.command == "record-merge":
        print(record_merge())
        return 0
    if args.command == "install-hooks":
        try:
            print(install_git_hooks())
        except RuntimeError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "hook":
        return run_hook(args.platform, args.event)
    try:
        data = load_records()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: unable to load canonical records: {exc}", file=sys.stderr)
        return 2
    if args.command == "generate":
        generate(data)
        print(f"Generated {len(render_documents(data))} documents in {GENERATED.relative_to(ROOT)}.")
        return 0
    if args.command == "status":
        if args.level == "module" and not args.module:
            parser.error("--module is required with --level module")
        try:
            print(status_text(data, args.level, args.module))
        except ValueError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    errors, warnings = validate(data)
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"Validation failed with {len(errors)} error(s).")
        return 1
    print(f"Validation passed with {len(warnings)} warning(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
