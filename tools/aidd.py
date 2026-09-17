#!/usr/bin/env python3
"""Deterministic AIDD registry tooling. Uses only the Python standard library."""

from __future__ import annotations

import argparse
import copy
import filecmp
import json
import re
import shutil
import stat
import subprocess
import sys
from collections import Counter
from datetime import datetime
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
TEXT_FILENAMES = {".gitattributes", ".gitignore", "AGENTS.md", "CLAUDE.md", "Dockerfile", "Makefile", "post-merge", "pre-commit"}
KO_CODES = {
    "foundation": "기반 구축", "greenfield-framework": "신규 프레임워크 구축", "balanced": "균형형",
    "must": "필수", "specified": "정의됨", "accepted": "승인됨", "implemented": "구현됨", "done": "완료",
    "in_progress": "진행 중", "planned": "계획됨", "passed": "통과", "failed": "실패", "not_run": "미실행",
    "automated": "자동", "agent-eval": "AI 평가", "scenario": "시나리오", "integration": "통합",
    "open": "미결", "mitigated": "완화됨", "current": "최신", "required": "필수", "conditional": "조건부",
    "not_applicable": "해당 없음", "generated": "자동 생성", "generated-diagram": "자동 생성 다이어그램",
    "authored-and-linked": "직접 작성·연결", "feature": "기능", "medium": "중간", "high": "높음",
    "critical": "치명적", "low": "낮음", "in_review": "검토 중", "approved": "승인됨",
    "rejected": "거절됨", "expired": "만료됨", "waived": "예외 승인", "pending": "대기 중",
    "automated-test": "자동 테스트", "manual-review": "수동 검토",
    "ready": "준비됨", "blocked": "차단됨", "todo": "할 일", "doing": "진행 중",
    "completed": "완료", "contract": "계약", "workflow": "작업 흐름", "governance": "거버넌스",
    "local_prepared": "로컬 준비 완료", "live_verified": "원격 검증 완료", "draft": "초안",
    "solo": "1인", "team": "팀", "active": "활성", "inactive": "비활성",
    "human": "사람", "bot": "봇", "unknown": "미등록", "author": "작성자", "committer": "커미터",
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
    "evidence": "evidence.json",
    "approvals": "approvals.json",
    "gate_runs": "gate-runs.json",
    "scenarios": "scenarios.json",
    "deployment": "deployment.json",
    "technology": "technology.json",
    "methodologies": "methodologies.json",
    "delivery_plan": "delivery-plan.json",
    "guides": "guides.json",
    "evaluations": "evaluations.json",
    "repository": "repository.json",
    "collaboration": "collaboration.json",
}


def read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    temporary.replace(path)


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


def release_blockers(
    data: dict[str, dict[str, Any]], release: dict[str, Any], include_runtime_identity: bool = True,
) -> list[str]:
    tests = index(data["tests"]["test_cases"])
    changes = index(data["changes"]["changes"])
    gate_runs = data["gate_runs"].get("gate_runs", [])
    deliverables = index(data["deliverables"].get("deliverables", []))
    blockers: list[str] = []
    for test_id in release.get("required_tests", []):
        test = tests.get(test_id)
        if not test or test.get("status") != "passed":
            blockers.append(f"{test_id} 상태가 {ko_code(test.get('status', '누락') if test else '누락')}입니다")
    for change_id in release.get("changes", []):
        change = changes.get(change_id)
        if not change or change.get("status") not in {"done", "verified", "released"}:
            blockers.append(f"{change_id} 상태가 {ko_code(change.get('status', '누락') if change else '누락')}입니다")
            continue
        for gate_id in change.get("required_gates", []):
            candidates = [item for item in gate_runs if item.get("change") == change_id and item.get("gate") == gate_id]
            if not candidates:
                blockers.append(f"{change_id}에 필요한 {gate_id} 실행 기록이 없습니다")
            elif not any(item.get("status") == "approved" for item in candidates):
                blockers.append(f"{change_id}의 {gate_id}가 승인되지 않았습니다")
    for item in data["open_items"]["open_items"]:
        if item.get("status") == "open" and item.get("blocking"):
            blockers.append(f"{item['id']}가 차단 중입니다")
    blocking_levels = set(release.get("risk_blocking_levels", ["critical"]))
    for risk in data["risks"]["risks"]:
        if risk.get("status") == "open" and risk.get("impact") in blocking_levels and not risk.get("accepted_by"):
            blockers.append(f"{risk['id']}는 수용되지 않은 릴리스 차단 수준 위험입니다")
    for merge in data["merges"]["merges"]:
        if merge.get("status") == "needs_assessment":
            blockers.append(f"{merge['id']} 병합 영향을 평가하지 않았습니다")
    for deliverable_id in release.get("required_deliverables", []):
        deliverable = deliverables.get(deliverable_id)
        if not deliverable or deliverable.get("status") != "current":
            blockers.append(f"{deliverable_id} 산출물이 최신 상태가 아닙니다")
    if include_runtime_identity:
        blockers.extend(identity_blockers(data, release=True))
    return blockers


def git_repository_root() -> Path | None:
    """Return the repository root when this template has been initialized."""
    try:
        return Path(git("rev-parse", "--show-toplevel")).resolve()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def current_git_branch() -> str | None:
    try:
        branch = git("branch", "--show-current")
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return branch or None


def branch_policy_blockers(
    data: dict[str, dict[str, Any]], change: dict[str, Any] | None = None,
    branch: str | None = None, repository_root: Path | None = None,
) -> list[str]:
    """Evaluate the local branch rule without inferring a remote merge actor."""
    if change and change.get("development_scope") == "governance-bootstrap":
        return []
    root = git_repository_root() if repository_root is None else repository_root
    if root is None:
        return ["Git 저장소가 초기화되지 않았습니다. python tools/aidd.py project-init를 먼저 실행하세요"]
    if root.resolve() != ROOT.resolve():
        return ["AIDD 템플릿이 다른 Git 저장소의 하위 폴더에 있습니다. 별도 프로젝트 루트에서 시작하세요"]
    active_policy = collaboration_profile(data).get("branch_policy", {})
    protected_classes = set(active_policy.get("require_non_default_branch_for", []))
    if not protected_classes:
        return []
    if change and change.get("class") not in protected_classes:
        return []
    active_branch = current_git_branch() if branch is None else branch
    default_branch = data["repository"]["default_branch"]
    if not active_branch:
        return ["분리된 HEAD에서는 변경을 진행할 수 없습니다. 작업 브랜치를 만드세요"]
    if active_branch == default_branch:
        return [
            f"{collaboration_profile(data)['name']}에서는 `{default_branch}`에 직접 커밋할 수 없습니다. "
            "작업 브랜치를 만든 뒤 변경과 테스트를 진행하세요"
        ]
    return []


def development_blockers(data: dict[str, dict[str, Any]], change: dict[str, Any]) -> list[str]:
    """Return reasons why product implementation may not start for a change."""
    if change.get("development_scope") == "governance-bootstrap":
        return []
    gate_runs = data["gate_runs"].get("gate_runs", [])
    blockers: list[str] = []
    for gate_id in change.get("required_gates", []):
        candidates = [
            item for item in gate_runs
            if item.get("change") == change.get("id") and item.get("gate") == gate_id
        ]
        if not any(item.get("status") == "approved" for item in candidates):
            blockers.append(f"{change['id']}의 {gate_id}가 승인되지 않았습니다")
    blockers.extend(identity_blockers(data, change.get("class")))
    blockers.extend(branch_policy_blockers(data, change))
    return blockers


def collaboration_profile(data: dict[str, dict[str, Any]]) -> dict[str, Any]:
    profile_id = data["collaboration"]["policy"]["current_profile"]
    profile = next((item for item in data["collaboration"]["profiles"] if item["id"] == profile_id), None)
    if not profile:
        raise ValueError(f"알 수 없는 협업 프로필: {profile_id}")
    return profile


def selected_collaboration_profile_id(data: dict[str, dict[str, Any]]) -> str:
    active_count = sum(1 for item in data["collaboration"].get("participants", []) if item.get("status") == "active")
    if active_count < 1:
        raise ValueError("활성 사람 참여자가 최소 1명 필요합니다")
    profiles = data["collaboration"].get("profiles", [])
    for profile in profiles:
        minimum = profile.get("min_active_humans", 0)
        maximum = profile.get("max_active_humans")
        if active_count >= minimum and (maximum is None or active_count <= maximum):
            return profile["id"]
    raise ValueError(f"활성 참여자 {active_count}명에 맞는 협업 프로필이 없습니다")


def normalize_git_identity(name: str, email: str) -> tuple[str, str]:
    return name.strip().casefold(), email.strip().casefold()


def scan_git_identities() -> list[dict[str, Any]]:
    """Read unique author/committer identities from every reachable Git commit."""
    try:
        output = git("log", "--all", "--format=%an%x1f%ae%x1f%cn%x1f%ce%x1f%cI%x1e")
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    observed: dict[tuple[str, str], dict[str, Any]] = {}
    for raw_record in output.split("\x1e"):
        fields = raw_record.strip("\r\n").split("\x1f")
        if len(fields) != 5:
            continue
        for role, name, email in (("author", fields[0], fields[1]), ("committer", fields[2], fields[3])):
            key = normalize_git_identity(name, email)
            if not all(key):
                continue
            item = observed.setdefault(key, {"name": name.strip(), "email": email.strip(), "roles": set(), "latest_commit_at": fields[4]})
            item["roles"].add(role)
            item["latest_commit_at"] = max(item["latest_commit_at"], fields[4])
    return [
        {"name": item["name"], "email": item["email"], "roles": sorted(item["roles"]), "latest_commit_at": item["latest_commit_at"]}
        for _key, item in sorted(observed.items())
    ]


def audit_git_identities(
    data: dict[str, dict[str, Any]], observations: list[dict[str, Any]] | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    collaboration = data["collaboration"]
    mappings = collaboration.get("identity_mappings", [])
    participants = {item["id"]: item for item in collaboration.get("participants", [])}
    registered: list[dict[str, Any]] = []
    unknown: list[dict[str, Any]] = []
    for observation in observations if observations is not None else scan_git_identities():
        key = normalize_git_identity(observation.get("name", ""), observation.get("email", ""))
        mapping = next((
            item for item in mappings
            if any(normalize_git_identity(alias.get("name", ""), alias.get("email", "")) == key for alias in item.get("git_identities", []))
        ), None)
        result = dict(observation)
        if mapping is None:
            result["mapping"] = None
            result["principal_type"] = "unknown"
            result["participant"] = None
            unknown.append(result)
        else:
            result["mapping"] = mapping["id"]
            result["principal_type"] = mapping["principal_type"]
            result["participant"] = mapping.get("participant")
            participant = participants.get(mapping.get("participant"))
            if (
                mapping["principal_type"] == "human" and participant
                and participant.get("status") == "inactive" and participant.get("left_at")
                and result.get("latest_commit_at", "") > participant["left_at"]
            ):
                result["issue"] = "inactive_participant_activity"
                unknown.append(result)
            else:
                result["issue"] = None
                registered.append(result)
    return registered, unknown


def identity_issue_text(identity: dict[str, Any]) -> str:
    if identity.get("issue") == "inactive_participant_activity":
        return f"비활성 참여자 {identity['participant']}의 신원 {identity['name']} <{identity['email']}>에서 이탈 후 커밋이 발견되었습니다"
    return f"미등록 Git 신원 {identity['name']} <{identity['email']}>을 실제 사람·기존 별칭·봇 중 하나로 확인해야 합니다"


def identity_blockers(
    data: dict[str, dict[str, Any]], change_class: str | None = None, release: bool = False,
) -> list[str]:
    _registered, unknown = audit_git_identities(data)
    if not unknown or (not release and change_class not in {"C2", "C3"}):
        return []
    return [identity_issue_text(item) for item in unknown]


def build_github_ruleset(data: dict[str, dict[str, Any]]) -> dict[str, Any]:
    repository = data["repository"]
    controls = collaboration_profile(data)["repository_controls"]
    rules: list[dict[str, Any]] = []
    if controls["block_deletion"]:
        rules.append({"type": "deletion"})
    if controls["block_force_push"]:
        rules.append({"type": "non_fast_forward"})
    if controls["require_pull_request"]:
        rules.append({
            "type": "pull_request",
            "parameters": {
                "allowed_merge_methods": ["merge", "squash", "rebase"],
                "required_approving_review_count": controls["required_approving_review_count"],
                "dismiss_stale_reviews_on_push": controls["dismiss_stale_reviews_on_push"],
                "require_code_owner_review": False,
                "require_last_push_approval": controls["require_last_push_approval"],
                "required_review_thread_resolution": controls["required_review_thread_resolution"],
            },
        })
    rules.append({
        "type": "required_status_checks",
        "parameters": {
            "strict_required_status_checks_policy": True,
            "do_not_enforce_on_create": False,
            "required_status_checks": [{"context": item} for item in repository["required_checks"]],
        },
    })
    return {
        "name": "main 브랜치 보호",
        "target": "branch",
        "enforcement": "active",
        "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
        "rules": rules,
        "bypass_actors": [],
    }


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
    rows = [[t["id"], t["title"], ko_code(t["type"]), ko_code(t["status"]), "예" if t["required"] else "아니요", ", ".join(t["requirements"]), ", ".join(t.get("evidence", [])) or "-"] for t in tests]
    return NOTICE + f"# 테스트 계획 및 결과서\n\n상태 요약: {summary}.\n\n" + table(["ID", "테스트", "유형", "상태", "필수 여부", "요구사항", "증거"], rows) + "\n"


def render_release(data: dict[str, dict[str, Any]]) -> str:
    parts = []
    for release in data["releases"]["releases"]:
        blockers = release_blockers(data, release, include_runtime_identity=False)
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


def render_governance_evidence(data: dict[str, dict[str, Any]]) -> str:
    gate_rows = []
    for run in data["gate_runs"].get("gate_runs", []):
        passed = sum(1 for item in run.get("criteria", []) if item.get("status") == "passed")
        total = len(run.get("criteria", []))
        gate_rows.append([
            run["id"], run["gate"], run["change"], ko_code(run["status"]),
            ", ".join(run.get("modules", [])), f"{passed}/{total}",
            ", ".join(run.get("approvals", [])) or "-", run.get("evaluated_at") or "-",
        ])
    evidence_rows = [[
        item["id"], item["title"], ko_code(item["type"]), ko_code(item["status"]),
        ", ".join(item.get("tests", [])) or "-", ", ".join(item.get("changes", [])) or "-",
        item["producer"], item["executed_at"], item["commit"], item["result"],
    ] for item in data["evidence"].get("evidence", [])]
    approval_rows = [[
        item["id"], item["subject_type"], item["subject"], ko_code(item["decision"]),
        item["approver"], item["role"], item["decided_at"], item.get("comment") or "-",
    ] for item in data["approvals"].get("approvals", [])]
    approvals = table(["ID", "대상 유형", "대상", "결정", "승인자", "역할", "일시", "의견"], approval_rows) if approval_rows else "승인 기록이 아직 없습니다."
    return (
        NOTICE + "# 게이트 실행과 검증 증거\n\n"
        "## 게이트 실행\n\n" + table(["ID", "게이트", "변경", "상태", "모듈", "통과 기준", "승인", "평가 시각"], gate_rows) +
        "\n\n## 검증 증거\n\n" + table(["ID", "제목", "유형", "상태", "테스트", "변경", "생성자", "실행 시각", "커밋", "결과"], evidence_rows) +
        "\n\n## 승인\n\n" + approvals + "\n"
    )


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


def render_delivery_plan(data: dict[str, dict[str, Any]]) -> str:
    plan = data["delivery_plan"]
    milestones = table(
        ["ID", "마일스톤", "상태", "모듈", "목표일", "작업"],
        [[item["id"], item["title"], ko_code(item["status"]), ", ".join(item["modules"]), item.get("target_date") or "-", ", ".join(item["work_items"])] for item in plan["milestones"]],
    )
    work_items = table(
        ["ID", "작업", "상태", "모듈", "변경", "선행 작업", "증거"],
        [[item["id"], item["title"], ko_code(item["status"]), item["module"], item["change"], ", ".join(item.get("depends_on", [])) or "-", ", ".join(item.get("evidence", [])) or "-"] for item in plan["work_items"]],
    )
    interfaces = table(
        ["ID", "인터페이스", "상태", "제공 모듈", "소비 모듈", "계약", "호환성"],
        [[item["id"], item["name"], ko_code(item["status"]), item["provider"], ", ".join(item["consumers"]), item["contract"], item["compatibility"]] for item in plan["interfaces"]],
    )
    dependencies = table(
        ["ID", "출발", "도착", "유형", "상태", "설명", "검증"],
        [[item["id"], item["from"], item["to"], ko_code(item["type"]), ko_code(item["status"]), item["description"], item["verification"]] for item in plan["dependencies"]],
    )
    return NOTICE + f"# 모듈 전달 계획\n\n## 마일스톤\n\n{milestones}\n\n## 작업 항목\n\n{work_items}\n\n## 모듈 인터페이스\n\n{interfaces}\n\n## 전달 의존성\n\n{dependencies}\n"


def render_guide(data: dict[str, dict[str, Any]], guide_id: str) -> str:
    guide = next(item for item in data["guides"]["guides"] if item["id"] == guide_id)
    sections: list[str] = []
    for section in guide["sections"]:
        content = f"{section['content']}\n"
        if section.get("steps"):
            content += "\n" + "\n".join(f"{number}. {step}" for number, step in enumerate(section["steps"], 1)) + "\n"
        if section.get("commands"):
            content += "\n```powershell\n" + "\n".join(section["commands"]) + "\n```\n"
        sections.append(f"## {section['title']}\n\n{content.rstrip()}")
    return NOTICE + f"# {guide['title']}\n\n- 대상: {guide['audience']}\n- 상태: `{ko_code(guide['status'])}`\n- 적용 범위: {guide['scope']}\n- 관련 요구사항: {', '.join(guide['requirements'])}\n\n" + "\n\n".join(sections) + "\n"


def evaluation_coverage(data: dict[str, dict[str, Any]]) -> list[list[str]]:
    evaluation = data["evaluations"]
    runs = evaluation.get("runs", [])
    rows: list[list[str]] = []
    for scenario in evaluation.get("scenarios", []):
        for platform in evaluation["policy"]["platforms"]:
            matching = [item for item in runs if item.get("scenario") == scenario["id"] and item.get("platform") == platform]
            status = "not_run"
            if matching:
                status = matching[-1].get("status", "not_run")
            rows.append([scenario["id"], scenario["title"], platform, ko_code(status)])
    return rows


def evaluation_prompt(data: dict[str, dict[str, Any]], scenario_id: str) -> str:
    scenario = next((item for item in data["evaluations"].get("scenarios", []) if item["id"] == scenario_id), None)
    if not scenario:
        raise ValueError(f"알 수 없는 평가 시나리오: {scenario_id}")
    fixture = (ROOT / scenario["fixture"]).read_text(encoding="utf-8")
    expected = "\n".join(f"- {item}" for item in scenario["expected_behaviors"])
    forbidden = "\n".join(f"- {item}" for item in scenario["forbidden_behaviors"])
    rubric = "\n".join(f"- {item}" for item in scenario["rubric"])
    return (
        f"# {scenario['id']} — {scenario['title']}\n\n{fixture.strip()}\n\n"
        f"## 기대 행동\n\n{expected}\n\n## 금지 행동\n\n{forbidden}\n\n"
        f"## 평가 루브릭\n\n{rubric}\n\n정본 규칙을 따라 요청을 처리하고, 최종 응답과 생성·수정한 산출물을 평가자가 검토할 수 있게 남기세요.\n"
    )


def record_evaluation(
    scenario_id: str,
    platform: str,
    status: str,
    evidence_id: str,
    scores: list[int],
    critical_violations: list[str],
    summary: str,
) -> str:
    evaluation_path = SSOT / FILES["evaluations"]
    payload = read_json(evaluation_path)
    scenario = next((item for item in payload.get("scenarios", []) if item["id"] == scenario_id), None)
    if not scenario:
        raise ValueError(f"알 수 없는 평가 시나리오: {scenario_id}")
    if platform not in payload.get("policy", {}).get("platforms", []):
        raise ValueError(f"지원하지 않는 평가 플랫폼: {platform}")
    if status not in {"passed", "failed"}:
        raise ValueError(f"지원하지 않는 평가 상태: {status}")
    if len(scores) != len(scenario["rubric"]) or any(score < 0 or score > 2 for score in scores):
        raise ValueError("루브릭 항목마다 0~2점의 점수가 필요합니다")
    if status == "passed" and critical_violations:
        raise ValueError("중대 금지 행동이 있으면 통과로 기록할 수 없습니다")
    evidence_payload = read_json(SSOT / FILES["evidence"])
    linked_evidence = next((item for item in evidence_payload.get("evidence", []) if item["id"] == evidence_id), None)
    if not linked_evidence or linked_evidence.get("status") != status:
        raise ValueError("평가 상태와 같은 상태의 유효한 EVD 증거가 필요합니다")
    runs = payload.setdefault("runs", [])
    next_number = max((int(item["id"].split("-")[-1]) for item in runs), default=0) + 1
    run_id = f"EVR-{next_number:03d}"
    runs.append({
        "id": run_id,
        "scenario": scenario_id,
        "platform": platform,
        "status": status,
        "rubric_results": [
            {"criterion": criterion, "score": score}
            for criterion, score in zip(scenario["rubric"], scores)
        ],
        "critical_violations": critical_violations,
        "summary": summary,
        "evidence": evidence_id,
        "executed_at": linked_evidence["executed_at"],
    })
    write_json_atomic(evaluation_path, payload)
    return f"{run_id}에 {scenario_id}의 {platform} 평가 결과를 기록했습니다."


def render_evaluations(data: dict[str, dict[str, Any]]) -> str:
    evaluation = data["evaluations"]
    policy = evaluation["policy"]
    scenario_sections = []
    for item in evaluation["scenarios"]:
        scenario_sections.append(
            f"## {item['id']} — {item['title']}\n\n- 목적: {item['purpose']}\n- 요구사항: {', '.join(item['requirements'])}\n"
            f"- 입력 픽스처: {item['fixture']}\n\n### 기대 행동\n\n" + "\n".join(f"- {value}" for value in item["expected_behaviors"]) +
            "\n\n### 금지 행동\n\n" + "\n".join(f"- {value}" for value in item["forbidden_behaviors"]) +
            "\n\n### 평가 루브릭\n\n" + "\n".join(f"- {value}" for value in item["rubric"])
        )
    coverage = table(["시나리오", "제목", "플랫폼", "실행 상태"], evaluation_coverage(data))
    return NOTICE + f"# AI 교차 플랫폼 행동 평가\n\n## {policy['id']} — {policy['title']}\n\n{policy['rule']}\n\n- 플랫폼: {', '.join(policy['platforms'])}\n- 통과 규칙: {policy['pass_rule']}\n- 재평가 조건: {', '.join(policy['reassessment_triggers'])}\n\n## 실행 현황\n\n{coverage}\n\n" + "\n\n".join(scenario_sections) + "\n"


def render_repository_governance(data: dict[str, dict[str, Any]]) -> str:
    repository = data["repository"]
    active_profile = collaboration_profile(data)
    protections = "\n".join(f"- {item}" for item in repository["protections"])
    remote = repository.get("remote_verification")
    remote_text = "아직 확인하지 않음"
    if remote:
        remote_text = f"{remote['checked_at']} · {ko_code(remote['status'])} · {remote['result']} · 증거 {remote['evidence']}"
    option_rows = table(
        ["선택지", "장점", "단점"],
        [[item["name"], " / ".join(item["advantages"]), " / ".join(item["disadvantages"])] for item in repository.get("options", [])],
    )
    return NOTICE + (
        f"# 저장소 보호와 CI 정책\n\n- 플랫폼: {repository['platform']}\n- 기본 브랜치: `{repository['default_branch']}`\n"
        f"- 상태: `{ko_code(repository['status'])}`\n- 협업 프로필: `{active_profile['id']} {active_profile['name']}`\n- 워크플로: `{repository['workflow']}`\n- 규칙 구성: `{repository['ruleset']}`\n"
        f"- 필수 상태 검사: {', '.join(repository['required_checks'])}\n- 원격 확인: {remote_text}\n\n## 보호 규칙\n\n{protections}\n\n"
        f"## 선택지\n\n{option_rows}\n\n## 활성화 절차\n\n규칙 파일을 GitHub Rulesets API 또는 저장소 설정에 적용한 뒤 원격 조회 결과를 EVD 증거로 기록한다. 로컬 파일 존재만으로 원격 보호가 활성화되었다고 판정하지 않는다.\n"
    )


def render_collaboration_governance(data: dict[str, dict[str, Any]], include_runtime_identity: bool = False) -> str:
    collaboration = data["collaboration"]
    policy = collaboration["policy"]
    identity_policy = collaboration["identity_policy"]
    current = collaboration_profile(data)
    _registered_identities, unknown_identities = audit_git_identities(data) if include_runtime_identity else ([], [])
    participant_rows = [
        [item["id"], item["name"], ", ".join(item["roles"]), ko_code(item["status"]), item["joined_at"], item.get("left_at") or "-"]
        for item in collaboration["participants"]
    ]
    profile_rows = [
        [item["id"], item["name"], f"{item['min_active_humans']}~{item.get('max_active_humans') or '무제한'}", item["human_review"], item["independent_assurance"]]
        for item in collaboration["profiles"]
    ]
    transition_rows = [
        [item["id"], item.get("from") or "최초", item["to"], item["participant"], ko_code(item["participant_status"]), item["changed_at"], item["reason"]]
        for item in collaboration["transitions"]
    ]
    identity_rows = [
        [
            item["id"], ko_code(item["principal_type"]), item.get("participant") or "-",
            "; ".join(f"{alias['name']} <{alias['email']}>" for alias in item.get("git_identities", [])) or "-",
            ", ".join(item.get("hosting_accounts", [])) or "-", item["reason"],
        ]
        for item in collaboration.get("identity_mappings", [])
    ]
    unknown_rows = [
        [item["name"], item["email"], ", ".join(ko_code(role) for role in item["roles"]), identity_issue_text(item)]
        for item in unknown_identities
    ]
    controls = current["repository_controls"]
    control_rows = [
        ["Pull Request 필수", "예" if controls["require_pull_request"] else "아니요"],
        ["필수 사람 승인", controls["required_approving_review_count"]],
        ["새 푸시 때 승인 무효화", "예" if controls["dismiss_stale_reviews_on_push"] else "아니요"],
        ["마지막 푸시 작성자 외 승인", "예" if controls["require_last_push_approval"] else "아니요"],
        ["검토 대화 해결", "예" if controls["required_review_thread_resolution"] else "아니요"],
        ["강제 푸시·삭제 차단", "예" if controls["block_force_push"] and controls["block_deletion"] else "아니요"],
        ["기본 브랜치 직접 커밋", current.get("branch_policy", {}).get("default_branch_direct_commit", "정의되지 않음")],
        ["기본 브랜치 직접 커밋", current.get("branch_policy", {}).get("default_branch_direct_commit", "정의되지 않음")],
    ]
    return NOTICE + (
        f"# 협업 운영 프로필\n\n## {policy['id']} — {policy['title']}\n\n{policy['rule']}\n\n"
        f"- 현재 프로필: `{current['id']} {current['name']}`\n"
        f"- 활성 사람 참여자: {sum(1 for item in collaboration['participants'] if item['status'] == 'active')}명\n"
        f"- 사람 검토: {current['human_review']}\n- 독립 검증: {current['independent_assurance']}\n\n"
        f"## 현재 저장소 통제\n\n{table(['통제', '값'], control_rows)}\n\n"
        f"## 프로필\n\n{table(['ID', '프로필', '활성 인원', '사람 검토', '독립 검증'], profile_rows)}\n\n"
        f"## 참여자\n\n{table(['ID', '이름', '역할', '상태', '참여일', '이탈일'], participant_rows)}\n\n"
        f"## {identity_policy['id']} — {identity_policy['title']}\n\n"
        f"- 자동 참여자 등록: {'예' if identity_policy['automatic_membership'] else '아니요'}\n"
        f"- Git 검사 범위: {identity_policy['git_scope']}\n"
        f"- 미등록 신원 처리: {identity_policy['unknown_identity_action']}\n"
        f"- 원격 행위자 처리: {identity_policy['hosting_actor_action']}\n\n"
        f"### 등록된 신원\n\n{table(['ID', '유형', '참여자', 'Git 이름·이메일', '호스팅 계정', '근거'], identity_rows)}\n\n"
        f"### 현재 미등록 Git 신원\n\n"
        + (table(['이름', '이메일', '관찰 위치', '상태'], unknown_rows) if include_runtime_identity else "실시간 결과는 `python tools/aidd.py identity-check`로 확인한다.") + "\n\n"
        + f"## 전환 이력\n\n{table(['ID', '이전', '이후', '참여자', '참여 상태', '변경 시각', '사유'], transition_rows)}\n"
    )


def status_text(
    data: dict[str, dict[str, Any]], level: str, module_id: str | None = None,
    include_runtime_identity: bool = True,
) -> str:
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
    gate_runs = data["gate_runs"].get("gate_runs", [])
    evidence = data["evidence"].get("evidence", [])
    work_items = data["delivery_plan"].get("work_items", [])
    milestones = data["delivery_plan"].get("milestones", [])
    evaluation_rows = evaluation_coverage(data)
    active_profile = collaboration_profile(data)
    active_humans = sum(1 for item in data["collaboration"].get("participants", []) if item.get("status") == "active")
    _registered_identities, unknown_identities = audit_git_identities(data) if include_runtime_identity else ([], [])
    identity_summary = f"{len(unknown_identities)}개" if include_runtime_identity else "실시간 검사 필요"
    if level == "module":
        selected = next((m for m in modules if m["id"] == module_id), None)
        if not selected:
            raise ValueError(f"알 수 없는 모듈: {module_id}")
        req_index = index(reqs)
        rows = [[rid, req_index[rid]["title"], ko_code(req_index[rid]["status"]), ", ".join(req_index[rid]["verification"])] for rid in selected["requirements"]]
        module_work = [item for item in work_items if item.get("module") == selected["id"]]
        relevant_nodes = {selected["id"]} | {item["id"] for item in module_work}
        work_rows = [[item["id"], item["title"], ko_code(item["status"]), item["change"], ", ".join(item.get("depends_on", [])) or "-", ", ".join(item.get("evidence", [])) or "-"] for item in module_work]
        interface_rows = [
            [item["id"], item["name"], ko_code(item["status"]), item["provider"], ", ".join(item["consumers"]), item["compatibility"]]
            for item in data["delivery_plan"].get("interfaces", [])
            if selected["id"] == item.get("provider") or selected["id"] in item.get("consumers", [])
        ]
        dependency_rows = [
            [item["id"], item["from"], item["to"], ko_code(item["status"]), item["description"]]
            for item in data["delivery_plan"].get("dependencies", [])
            if relevant_nodes.intersection({item.get("from"), item.get("to")})
        ]
        return (
            f"# {selected['id']} — {selected['name']}\n\n- 상태: `{ko_code(selected['status'])}`\n- 목적: {selected['purpose']}\n"
            f"- 의존 모듈: {', '.join(selected['dependencies']) or '없음'}\n- 작업 상태: "
            + (", ".join(f"{ko_code(key)} {value}개" for key, value in sorted(Counter(item['status'] for item in module_work).items())) or "등록된 작업 없음")
            + "\n\n## 요구사항\n\n" + table(["요구사항", "제목", "상태", "검증"], rows)
            + "\n\n## 작업 항목\n\n" + table(["작업", "제목", "상태", "변경", "선행 작업", "증거"], work_rows)
            + "\n\n## 인터페이스\n\n" + table(["ID", "이름", "상태", "제공", "소비", "호환성"], interface_rows)
            + "\n\n## 모듈 의존성\n\n" + table(["ID", "출발", "도착", "상태", "설명"], dependency_rows)
        )
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
        f"- 게이트 실행: {len(gate_runs)}개; 승인됨: {sum(1 for item in gate_runs if item['status'] == 'approved')}개; 검토 중: {sum(1 for item in gate_runs if item['status'] == 'in_review')}개\n"
        f"- 구조화된 증거: {len(evidence)}개; 통과: {sum(1 for item in evidence if item['status'] == 'passed')}개\n"
        f"- 협업 프로필: {active_profile['id']} {active_profile['name']}; 활성 사람 참여자: {active_humans}명; 미등록 Git 신원: {identity_summary}\n"
        f"- 마일스톤: {len(milestones)}개; 작업 항목: {len(work_items)}개; 완료: {sum(1 for item in work_items if item['status'] == 'completed')}개\n"
        f"- AI 행동 평가: {len(evaluation_rows)}개 플랫폼 실행 슬롯; 미실행: {sum(1 for row in evaluation_rows if row[3] == ko_code('not_run'))}개\n"
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
        "governance-evidence.md": render_governance_evidence(data),
        "technology-gates.md": render_technology(data),
        "methodology-comparison.md": render_methodologies(data),
        "delivery-plan.md": render_delivery_plan(data),
        "operator-guide.md": render_guide(data, "OPS-001"),
        "user-manual.md": render_guide(data, "USR-001"),
        "security-guide.md": render_guide(data, "SEC-001"),
        "ai-evaluation.md": render_evaluations(data),
        "repository-governance.md": render_repository_governance(data),
        "collaboration-governance.md": render_collaboration_governance(data),
        "status.md": NOTICE + status_text(data, "detail", include_runtime_identity=False),
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
    evidence = index(data["evidence"].get("evidence", []))
    approvals = index(data["approvals"].get("approvals", []))
    gate_runs = index(data["gate_runs"].get("gate_runs", []))
    deliverables = index(data["deliverables"].get("deliverables", []))
    work_items = index(data["delivery_plan"].get("work_items", []))
    all_items: list[dict[str, Any]] = []
    for key in ("requirements", "modules", "decisions", "open_items", "risks", "changes", "tests", "releases", "merges", "deliverables", "evidence", "approvals", "gate_runs"):
        collection_name = {"requirements": "requirements", "modules": "modules", "decisions": "decisions", "open_items": "open_items", "risks": "risks", "changes": "changes", "tests": "test_cases", "releases": "releases", "merges": "merges", "deliverables": "deliverables", "evidence": "evidence", "approvals": "approvals", "gate_runs": "gate_runs"}[key]
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
    architecture = data["architecture"]
    architecture_items = (
        architecture.get("principles", [])
        + architecture.get("components", [])
        + architecture.get("flows", [])
        + architecture.get("role_lenses", [])
        + architecture.get("quality_attributes", [])
    )
    architecture_ids = [item.get("id") for item in architecture_items]
    if len(architecture_ids) != len(set(architecture_ids)):
        errors.append("duplicate IDs in architecture.json")
    all_items.extend(architecture_items)
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
    delivery_items = (
        data["delivery_plan"].get("milestones", [])
        + data["delivery_plan"].get("work_items", [])
        + data["delivery_plan"].get("interfaces", [])
        + data["delivery_plan"].get("dependencies", [])
    )
    delivery_ids = [item.get("id") for item in delivery_items]
    if len(delivery_ids) != len(set(delivery_ids)):
        errors.append("duplicate IDs in delivery-plan.json")
    all_items.extend(delivery_items)
    guide_items = data["guides"].get("guides", [])
    guide_ids = [item.get("id") for item in guide_items]
    if len(guide_ids) != len(set(guide_ids)):
        errors.append("duplicate IDs in guides.json")
    all_items.extend(guide_items)
    evaluation_items = (
        [data["evaluations"].get("policy", {})]
        + data["evaluations"].get("scenarios", [])
        + data["evaluations"].get("runs", [])
    )
    evaluation_ids = [item.get("id") for item in evaluation_items]
    if len(evaluation_ids) != len(set(evaluation_ids)):
        errors.append("duplicate IDs in evaluations.json")
    all_items.extend(evaluation_items)
    collaboration_items = (
        [data["collaboration"].get("policy", {}), data["collaboration"].get("identity_policy", {})]
        + data["collaboration"].get("profiles", [])
        + data["collaboration"].get("participants", [])
        + data["collaboration"].get("identity_mappings", [])
        + data["collaboration"].get("identity_events", [])
        + data["collaboration"].get("transitions", [])
    )
    collaboration_ids = [item.get("id") for item in collaboration_items]
    if len(collaboration_ids) != len(set(collaboration_ids)):
        errors.append("duplicate IDs in collaboration.json")
    all_items.extend(collaboration_items)
    all_items.append(data["repository"])
    all_ids = [item.get("id") for item in all_items]
    duplicate_global_ids = sorted(item_id for item_id, count in Counter(all_ids).items() if item_id and count > 1)
    if duplicate_global_ids:
        errors.append("duplicate stable IDs across canonical records: " + ", ".join(duplicate_global_ids))
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
    for component in architecture.get("components", []):
        for module_id in component.get("modules", []):
            if module_id not in modules:
                errors.append(f"{component['id']} references unknown module {module_id}")
    for test in tests.values():
        for req_id in test.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{test['id']} references unknown requirement {req_id}")
        evidence_ids = test.get("evidence", [])
        if not isinstance(evidence_ids, list):
            errors.append(f"{test['id']} evidence must be a list of evidence IDs")
            evidence_ids = []
        if test.get("status") in {"passed", "failed"} and not evidence_ids:
            errors.append(f"{test['id']} {test.get('status')} without structured evidence")
        if test.get("status") == "not_run" and evidence_ids:
            errors.append(f"{test['id']} has evidence while status is not_run")
        for evidence_id in evidence_ids:
            linked = evidence.get(evidence_id)
            if not linked:
                errors.append(f"{test['id']} references unknown evidence {evidence_id}")
            elif linked.get("status") != test.get("status") or test["id"] not in linked.get("tests", []):
                errors.append(f"{test['id']} references invalid or non-bidirectional evidence {evidence_id}")
    for decision in decisions.values():
        for req_id in decision.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{decision['id']} references unknown requirement {req_id}")
        if decision.get("status") == "accepted" and (not decision.get("consequences") or not decision.get("rollback")):
            errors.append(f"{decision['id']} is accepted without consequences/rollback")
        supersedes = decision.get("supersedes")
        if supersedes and supersedes not in decisions:
            errors.append(f"{decision['id']} supersedes unknown decision {supersedes}")
    for decision in decisions.values():
        visited: set[str] = set()
        current = decision
        while current.get("supersedes"):
            target = current["supersedes"]
            if target in visited or target == decision["id"]:
                errors.append(f"{decision['id']} has a supersession cycle")
                break
            visited.add(target)
            current = decisions.get(target, {})
    for item in data["open_items"]["open_items"]:
        if item.get("status") == "closed" and not item.get("resolution"):
            errors.append(f"{item['id']} is closed without a resolution")
        if item.get("status") == "open" and item.get("blocking") and not item.get("due"):
            errors.append(f"{item['id']} is blocking without a due date")
    for change in changes.values():
        if change.get("class") not in {"C0", "C1", "C2", "C3"}:
            errors.append(f"{change['id']} has invalid change class")
        for req_id in change.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{change['id']} references unknown requirement {req_id}")
        for module_id in change.get("modules", []):
            if module_id not in modules:
                errors.append(f"{change['id']} references unknown module {module_id}")
        if change.get("class") in {"C2", "C3"} and not change.get("required_gates"):
            errors.append(f"{change['id']} has no required gates for {change.get('class')}")
    for release in data["releases"]["releases"]:
        for change_id in release.get("changes", []):
            if change_id not in changes:
                errors.append(f"{release['id']} references unknown change {change_id}")
        for test_id in release.get("required_tests", []):
            if test_id not in tests:
                errors.append(f"{release['id']} references unknown test {test_id}")
        for deliverable_id in release.get("required_deliverables", []):
            if deliverable_id not in deliverables:
                errors.append(f"{release['id']} references unknown deliverable {deliverable_id}")
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
    known_gates = {deployment_gate.get("id")} | {item.get("id") for item in technology.get("gates", [])}
    for change in changes.values():
        for gate_id in change.get("required_gates", []):
            if gate_id not in known_gates:
                errors.append(f"{change['id']} references unknown required gate {gate_id}")
        for gate_id in change.get("required_gates", []):
            if not any(item.get("change") == change["id"] and item.get("gate") == gate_id for item in gate_runs.values()):
                errors.append(f"{change['id']} has no gate run for required gate {gate_id}")
            elif change.get("status") in {"done", "verified", "released"} and not any(
                item.get("change") == change["id"] and item.get("gate") == gate_id and item.get("status") == "approved"
                for item in gate_runs.values()
            ):
                errors.append(f"{change['id']} is {change.get('status')} without approved gate {gate_id}")
    evidence_required_fields = ("title", "type", "status", "producer", "executed_at", "commit", "result")
    for item in evidence.values():
        for field in evidence_required_fields:
            if not item.get(field):
                errors.append(f"{item['id']} has no {field}")
        if item.get("status") == "passed" and not item.get("command") and not item.get("review_method"):
            errors.append(f"{item['id']} passed without a command or review method")
        if item.get("commit") and item.get("commit") != "working-tree" and not re.fullmatch(r"[0-9a-fA-F]{7,40}", item["commit"]):
            errors.append(f"{item['id']} has an invalid commit hash")
        for req_id in item.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{item['id']} references unknown requirement {req_id}")
        for test_id in item.get("tests", []):
            if test_id not in tests:
                errors.append(f"{item['id']} references unknown test {test_id}")
        for change_id in item.get("changes", []):
            if change_id not in changes:
                errors.append(f"{item['id']} references unknown change {change_id}")
        for gate_id in item.get("gates", []):
            if gate_id not in known_gates:
                errors.append(f"{item['id']} references unknown gate {gate_id}")
        for artifact in item.get("artifacts", []):
            if not (ROOT / artifact).exists():
                errors.append(f"{item['id']} references missing artifact {artifact}")
    approval_subjects = {**requirements, **decisions, **changes, **gate_runs}
    for item in approvals.values():
        for field in ("subject_type", "subject", "decision", "approver", "role", "decided_at"):
            if not item.get(field):
                errors.append(f"{item['id']} has no {field}")
        if item.get("subject") not in approval_subjects:
            errors.append(f"{item['id']} references unknown approval subject {item.get('subject')}")
        if item.get("decision") not in {"approved", "rejected"}:
            errors.append(f"{item['id']} has invalid approval decision")
    gate_pairs: list[tuple[str | None, str | None]] = []
    criterion_ids: list[str] = []
    for run in gate_runs.values():
        gate_pairs.append((run.get("gate"), run.get("change")))
        if run.get("gate") not in known_gates:
            errors.append(f"{run['id']} references unknown gate {run.get('gate')}")
        if run.get("change") not in changes:
            errors.append(f"{run['id']} references unknown change {run.get('change')}")
        for module_id in run.get("modules", []):
            if module_id not in modules:
                errors.append(f"{run['id']} references unknown module {module_id}")
        if run.get("status") not in {"in_review", "approved", "rejected", "expired"}:
            errors.append(f"{run['id']} has invalid gate-run status")
        if not run.get("criteria"):
            errors.append(f"{run['id']} has no gate criteria")
        for criterion in run.get("criteria", []):
            criterion_ids.append(criterion.get("id", ""))
            if not ID_PATTERN.match(criterion.get("id", "")):
                errors.append(f"invalid stable ID: {criterion.get('id', '')!r}")
            if criterion.get("status") not in {"pending", "passed", "failed", "waived"}:
                errors.append(f"{run['id']} criterion {criterion.get('id')} has invalid status")
            for evidence_id in criterion.get("evidence", []):
                if evidence_id not in evidence:
                    errors.append(f"{run['id']} criterion {criterion.get('id')} references unknown evidence {evidence_id}")
            if criterion.get("status") == "passed" and not criterion.get("evidence"):
                errors.append(f"{run['id']} criterion {criterion.get('id')} passed without evidence")
        for evidence_id in {value for criterion in run.get("criteria", []) for value in criterion.get("evidence", [])}:
            if evidence_id in evidence:
                if run.get("gate") not in evidence[evidence_id].get("gates", []):
                    errors.append(f"{run['id']} has non-bidirectional gate evidence {evidence_id}")
                if run.get("change") not in evidence[evidence_id].get("changes", []):
                    errors.append(f"{run['id']} has evidence {evidence_id} from another change")
        for approval_id in run.get("approvals", []):
            approval = approvals.get(approval_id)
            if not approval or approval.get("subject") != run["id"] or approval.get("decision") != "approved":
                errors.append(f"{run['id']} references invalid approval {approval_id}")
        for exception in run.get("exceptions", []):
            for field in ("id", "owner", "expires", "compensating_control", "approved_by"):
                if not exception.get(field):
                    errors.append(f"{run['id']} has an incomplete gate exception")
            if exception.get("approved_by") and exception["approved_by"] not in approvals:
                errors.append(f"{run['id']} exception references unknown approval {exception['approved_by']}")
        if run.get("status") == "approved":
            if not run.get("evaluated_at") or not run.get("commit") or not run.get("approvals"):
                errors.append(f"{run['id']} is approved without evaluation, commit, or approval")
            elif not re.fullmatch(r"[0-9a-fA-F]{7,40}", run["commit"]):
                errors.append(f"{run['id']} is approved without an immutable commit hash")
            if any(item.get("status") not in {"passed", "waived"} for item in run.get("criteria", [])):
                errors.append(f"{run['id']} is approved with incomplete criteria")
    if len(gate_pairs) != len(set(gate_pairs)):
        errors.append("duplicate active gate runs for the same gate and change")
    if len(criterion_ids) != len(set(criterion_ids)):
        errors.append("duplicate gate criterion IDs")
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
    milestones = index(data["delivery_plan"].get("milestones", []))
    interfaces = index(data["delivery_plan"].get("interfaces", []))
    for milestone in milestones.values():
        for module_id in milestone.get("modules", []):
            if module_id not in modules:
                errors.append(f"{milestone['id']} references unknown module {module_id}")
        for work_id in milestone.get("work_items", []):
            if work_id not in work_items:
                errors.append(f"{milestone['id']} references unknown work item {work_id}")
        if not milestone.get("exit_criteria"):
            errors.append(f"{milestone['id']} has no exit criteria")
    for work in work_items.values():
        if work.get("module") not in modules:
            errors.append(f"{work['id']} references unknown module {work.get('module')}")
        if work.get("change") not in changes:
            errors.append(f"{work['id']} references unknown change {work.get('change')}")
        for req_id in work.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{work['id']} references unknown requirement {req_id}")
        for dependency_id in work.get("depends_on", []):
            if dependency_id not in work_items:
                errors.append(f"{work['id']} references unknown work dependency {dependency_id}")
        for evidence_id in work.get("evidence", []):
            if evidence_id not in evidence:
                errors.append(f"{work['id']} references unknown evidence {evidence_id}")
        if work.get("status") == "completed" and not work.get("evidence"):
            errors.append(f"{work['id']} is completed without evidence")
        if not work.get("acceptance_criteria"):
            errors.append(f"{work['id']} has no acceptance criteria")
    for interface in interfaces.values():
        for module_id in [interface.get("provider")] + interface.get("consumers", []):
            if module_id not in modules:
                errors.append(f"{interface['id']} references unknown module {module_id}")
        for req_id in interface.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{interface['id']} references unknown requirement {req_id}")
        if not interface.get("contract") or not interface.get("compatibility"):
            errors.append(f"{interface['id']} has no contract or compatibility rule")
    dependency_nodes = set(modules) | set(work_items) | set(interfaces) | set(milestones)
    for dependency in data["delivery_plan"].get("dependencies", []):
        for field in ("from", "to"):
            if dependency.get(field) not in dependency_nodes:
                errors.append(f"{dependency['id']} references unknown {field} node {dependency.get(field)}")
        if not dependency.get("description") or not dependency.get("verification"):
            errors.append(f"{dependency['id']} has incomplete dependency details")
    for guide in data["guides"].get("guides", []):
        for req_id in guide.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{guide['id']} references unknown requirement {req_id}")
        if not guide.get("audience") or not guide.get("scope") or not guide.get("sections"):
            errors.append(f"{guide['id']} has incomplete guide metadata")
        for section in guide.get("sections", []):
            if not section.get("title") or not section.get("content"):
                errors.append(f"{guide['id']} contains an incomplete section")
    evaluation = data["evaluations"]
    evaluation_policy = evaluation.get("policy", {})
    evaluation_scenarios = index(evaluation.get("scenarios", []))
    if set(evaluation_policy.get("platforms", [])) != {"codex", "claude"}:
        errors.append(f"{evaluation_policy.get('id', 'evaluation policy')} must cover codex and claude")
    for scenario in evaluation_scenarios.values():
        for req_id in scenario.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{scenario['id']} references unknown requirement {req_id}")
        for field in ("fixture", "expected_behaviors", "forbidden_behaviors", "rubric"):
            if not scenario.get(field):
                errors.append(f"{scenario['id']} has no {field}")
        fixture = scenario.get("fixture")
        if fixture and not (ROOT / fixture).is_file():
            errors.append(f"{scenario['id']} references missing fixture {fixture}")
    for run in evaluation.get("runs", []):
        scenario = evaluation_scenarios.get(run.get("scenario"))
        if not scenario:
            errors.append(f"{run['id']} references unknown evaluation scenario {run.get('scenario')}")
        if run.get("platform") not in evaluation_policy.get("platforms", []):
            errors.append(f"{run['id']} references unsupported platform {run.get('platform')}")
        evidence_id = run.get("evidence")
        if run.get("status") == "passed" and (not evidence_id or evidence_id not in evidence):
            errors.append(f"{run['id']} passed without valid evidence")
        if not run.get("rubric_results"):
            errors.append(f"{run['id']} has no rubric results")
        elif scenario:
            results = run["rubric_results"]
            if len(results) != len(scenario["rubric"]):
                errors.append(f"{run['id']} has incomplete rubric results")
            for result in results:
                if result.get("score") not in {0, 1, 2} or not result.get("criterion"):
                    errors.append(f"{run['id']} has an invalid rubric score")
        if run.get("status") == "passed" and run.get("critical_violations"):
            errors.append(f"{run['id']} passed with critical violations")
        if not run.get("summary") or not run.get("executed_at"):
            errors.append(f"{run['id']} has incomplete execution details")
    repository = data["repository"]
    workflow_path = ROOT / repository.get("workflow", "")
    ruleset_path = ROOT / repository.get("ruleset", "")
    if not workflow_path.is_file():
        errors.append("repository workflow file is missing")
    if not ruleset_path.is_file():
        errors.append("repository ruleset file is missing")
    else:
        try:
            ruleset = read_json(ruleset_path)
            configured = {
                item.get("context")
                for rule in ruleset.get("rules", []) if rule.get("type") == "required_status_checks"
                for item in rule.get("parameters", {}).get("required_status_checks", [])
            }
            missing_checks = set(repository.get("required_checks", [])) - configured
            if missing_checks:
                errors.append("repository ruleset is missing required checks: " + ", ".join(sorted(missing_checks)))
            pull_request_rules = [rule for rule in ruleset.get("rules", []) if rule.get("type") == "pull_request"]
            if not pull_request_rules or not pull_request_rules[0].get("parameters", {}).get("allowed_merge_methods"):
                errors.append("repository ruleset has no allowed pull-request merge method")
            if ruleset != build_github_ruleset(data):
                errors.append("repository ruleset has drifted from the active collaboration profile")
        except (OSError, json.JSONDecodeError):
            errors.append("repository ruleset is not valid UTF-8 JSON")
    remote_verification = repository.get("remote_verification")
    if remote_verification:
        remote_evidence = evidence.get(remote_verification.get("evidence"))
        if not remote_evidence or remote_evidence.get("status") != remote_verification.get("status"):
            errors.append("repository remote verification has no matching evidence")
    for option in repository.get("options", []):
        if not option.get("name") or not option.get("advantages") or not option.get("disadvantages"):
            errors.append("repository protection option has incomplete trade-off details")
    collaboration = data["collaboration"]
    profiles = index(collaboration.get("profiles", []))
    participants = index(collaboration.get("participants", []))
    identity_mappings = index(collaboration.get("identity_mappings", []))
    active_participants = [item for item in participants.values() if item.get("status") == "active"]
    try:
        expected_profile_id = selected_collaboration_profile_id(data)
    except ValueError as exc:
        errors.append(str(exc))
        expected_profile_id = None
    current_profile_id = collaboration.get("policy", {}).get("current_profile")
    if current_profile_id not in profiles:
        errors.append(f"collaboration policy references unknown profile {current_profile_id}")
    elif expected_profile_id and current_profile_id != expected_profile_id:
        errors.append(f"collaboration profile {current_profile_id} does not match active participants; expected {expected_profile_id}")
    for profile in profiles.values():
        controls = profile.get("repository_controls", {})
        required_control_fields = {
            "require_pull_request", "required_approving_review_count", "dismiss_stale_reviews_on_push",
            "require_last_push_approval", "required_review_thread_resolution", "block_deletion", "block_force_push",
        }
        if not required_control_fields.issubset(controls):
            errors.append(f"{profile['id']} has incomplete repository controls")
        if profile.get("mode") == "solo" and controls.get("required_approving_review_count") != 0:
            errors.append(f"{profile['id']} solo profile must not require another human approval")
        if profile.get("mode") == "solo" and controls.get("require_last_push_approval"):
            errors.append(f"{profile['id']} solo profile cannot require another last-push approval")
        if profile.get("mode") == "team" and controls.get("required_approving_review_count", 0) < 1:
            errors.append(f"{profile['id']} team profile must require human approval")
        branch_policy = profile.get("branch_policy", {})
        if not {"default_branch_direct_commit", "require_non_default_branch_for"}.issubset(branch_policy):
            errors.append(f"{profile['id']} has incomplete branch policy")
        if not isinstance(branch_policy.get("require_non_default_branch_for", []), list):
            errors.append(f"{profile['id']} has invalid branch policy classes")
        branch_policy = profile.get("branch_policy", {})
        if not {"default_branch_direct_commit", "require_non_default_branch_for"}.issubset(branch_policy):
            errors.append(f"{profile['id']} has incomplete branch policy")
        if not isinstance(branch_policy.get("require_non_default_branch_for", []), list):
            errors.append(f"{profile['id']} has invalid branch policy classes")
    for participant in participants.values():
        if participant.get("status") not in {"active", "inactive"}:
            errors.append(f"{participant['id']} has invalid participant status")
        if not participant.get("name") or not participant.get("roles") or not participant.get("joined_at"):
            errors.append(f"{participant['id']} has incomplete participant details")
        if participant.get("status") == "inactive" and not participant.get("left_at"):
            errors.append(f"{participant['id']} is inactive without a left date")
    if active_participants and not any("소유자" in item.get("roles", []) for item in active_participants):
        errors.append("collaboration has no active owner")
    identity_policy = collaboration.get("identity_policy", {})
    if identity_policy.get("automatic_membership") is not False:
        errors.append("identity policy must not automatically create human participants")
    git_alias_owners: dict[tuple[str, str], str] = {}
    hosting_owners: dict[str, str] = {}
    mapped_participants: set[str] = set()
    for mapping in identity_mappings.values():
        principal_type = mapping.get("principal_type")
        participant_id = mapping.get("participant")
        if principal_type not in {"human", "bot"}:
            errors.append(f"{mapping['id']} has invalid principal type")
        if principal_type == "human":
            if participant_id not in participants:
                errors.append(f"{mapping['id']} references unknown participant {participant_id}")
            else:
                mapped_participants.add(participant_id)
        elif participant_id:
            errors.append(f"{mapping['id']} bot identity must not reference a human participant")
        if not mapping.get("git_identities") and not mapping.get("hosting_accounts"):
            errors.append(f"{mapping['id']} has no Git identity or hosting account")
        if not mapping.get("verified_at") or not mapping.get("verified_by") or not mapping.get("reason"):
            errors.append(f"{mapping['id']} has incomplete verification details")
        for alias in mapping.get("git_identities", []):
            key = normalize_git_identity(alias.get("name", ""), alias.get("email", ""))
            if not all(key):
                errors.append(f"{mapping['id']} has an incomplete Git identity")
            elif key in git_alias_owners:
                errors.append(f"Git identity {alias['name']} <{alias['email']}> is mapped by both {git_alias_owners[key]} and {mapping['id']}")
            else:
                git_alias_owners[key] = mapping["id"]
        for account in mapping.get("hosting_accounts", []):
            key = account.strip().casefold()
            if not key:
                errors.append(f"{mapping['id']} has an empty hosting account")
            elif key in hosting_owners:
                errors.append(f"hosting account {account} is mapped by both {hosting_owners[key]} and {mapping['id']}")
            else:
                hosting_owners[key] = mapping["id"]
    for participant in active_participants:
        if participant["id"] not in mapped_participants:
            warnings.append(f"{participant['id']} has no registered Git or hosting identity")
    for event in collaboration.get("identity_events", []):
        if event.get("mapping") not in identity_mappings:
            errors.append(f"{event['id']} references unknown identity mapping {event.get('mapping')}")
        for field in ("action", "changed_at", "changed_by", "reason"):
            if not event.get(field):
                errors.append(f"{event['id']} has no {field}")
    _registered_git_identities, unknown_git_identities = audit_git_identities(data)
    for identity in unknown_git_identities:
        warnings.append(identity_issue_text(identity))
    if unknown_git_identities and any(
        item.get("class") in {"C2", "C3"} and item.get("status") in {"done", "verified", "released"}
        for item in changes.values()
    ):
        errors.append("C2 or C3 change is complete while Git identities remain unregistered")
    for transition in collaboration.get("transitions", []):
        if transition.get("from") and transition["from"] not in profiles:
            errors.append(f"{transition['id']} references unknown source profile {transition['from']}")
        if transition.get("to") not in profiles:
            errors.append(f"{transition['id']} references unknown target profile {transition.get('to')}")
        if transition.get("participant") not in participants:
            errors.append(f"{transition['id']} references unknown participant {transition.get('participant')}")
        for field in ("reason", "changed_at", "changed_by", "participant_status"):
            if not transition.get(field):
                errors.append(f"{transition['id']} has no {field}")
        if transition.get("participant_status") not in {"active", "inactive"}:
            errors.append(f"{transition['id']} has invalid participant status")
    if collaboration.get("transitions") and collaboration["transitions"][-1].get("to") != current_profile_id:
        errors.append("latest collaboration transition does not match the current profile")
    for sequence in data["scenarios"].get("sequences", []):
        participants = {item["id"] for item in sequence.get("participants", [])}
        for message in sequence.get("messages", []):
            if message.get("from") not in participants or message.get("to") not in participants:
                errors.append(f"{sequence['id']} contains a message with an unknown participant")
    for merge in data["merges"]["merges"]:
        if merge.get("status") == "needs_assessment":
            warnings.append(f"{merge['id']} needs merge-impact assessment")
        for module_id in merge.get("affected_modules", []):
            if module_id not in modules:
                errors.append(f"{merge['id']} references unknown affected module {module_id}")
        if merge.get("status") == "assessed" and (
            not merge.get("conflict_resolution_notes") or not merge.get("additional_testing")
            or merge.get("conflict_resolution_notes") == "pending" or merge.get("additional_testing") == "pending"
        ):
            errors.append(f"{merge['id']} is assessed without impact notes and a testing decision")
    known_link_ids = set(all_ids) | set(criterion_ids)
    for item in data["open_items"]["open_items"]:
        for linked_id in item.get("links", []):
            if linked_id not in known_link_ids:
                errors.append(f"{item['id']} references unknown linked item {linked_id}")
    canonical_sources = set(FILES.values()) | {"AGENTS.md", "CLAUDE.md", "README.md"}
    for deliverable in data["deliverables"]["deliverables"]:
        for source in deliverable.get("source", []):
            if source not in canonical_sources:
                errors.append(f"{deliverable['id']} references unknown canonical source {source}")
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
    ruleset_path = ROOT / data["repository"]["ruleset"]
    write_json_atomic(ruleset_path, build_github_ruleset(data))


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
    result = subprocess.run(
        ["git", *args], cwd=ROOT, check=True, capture_output=True, text=True,
        encoding="utf-8", errors="replace",
    )
    return result.stdout.strip()


def record_merge(squash_flag: str | None = None) -> str:
    try:
        head = git("rev-parse", "HEAD")
        parents = git("rev-list", "--parents", "-n", "1", "HEAD").split()[1:]
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "No Git repository; no merge recorded."
    if len(parents) < 2:
        if squash_flag == "1":
            return "Squash merge completed; HEAD has no merge parents, so no merge record was created."
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
    write_json_atomic(path, payload)
    return f"Recorded {merge_id} for merge {head[:12]}; impact assessment is required."


def assess_merge(merge_id: str, module_ids: list[str], notes: str, additional_testing: str) -> str:
    merge_path = SSOT / FILES["merges"]
    module_path = SSOT / FILES["modules"]
    payload = read_json(merge_path)
    known_modules = {item["id"] for item in read_json(module_path).get("modules", [])}
    unknown_modules = sorted(set(module_ids) - known_modules)
    if unknown_modules:
        raise ValueError("알 수 없는 모듈: " + ", ".join(unknown_modules))
    merge = next((item for item in payload.get("merges", []) if item["id"] == merge_id), None)
    if not merge:
        raise ValueError(f"알 수 없는 병합 레코드: {merge_id}")
    merge["affected_modules"] = sorted(set(module_ids))
    merge["conflict_resolution_notes"] = notes
    merge["additional_testing"] = additional_testing
    merge["status"] = "assessed"
    write_json_atomic(merge_path, payload)
    return f"Assessed {merge_id}; affected modules and additional testing decision were recorded."


def apply_collaboration_member(
    payload: dict[str, Any],
    participant_id: str,
    name: str | None,
    roles: list[str],
    status: str,
    reason: str,
    changed_by: str,
    timestamp: str,
) -> str:
    if not participant_id.startswith("HUM-"):
        raise ValueError("참여자 ID는 HUM- 접두사를 사용해야 합니다")
    if status not in {"active", "inactive"}:
        raise ValueError("참여자 상태는 active 또는 inactive여야 합니다")
    if not reason.strip() or not changed_by.strip():
        raise ValueError("참여자 변경 사유와 기록자는 필수입니다")
    working = copy.deepcopy(payload)
    current_profile_id = working["policy"]["current_profile"]
    participant = next((item for item in working.get("participants", []) if item["id"] == participant_id), None)
    if participant is None:
        if status != "active" or not name or not roles:
            raise ValueError("새 참여자는 이름·역할과 active 상태가 필요합니다")
        participant = {
            "id": participant_id,
            "name": name,
            "roles": roles,
            "status": "active",
            "joined_at": timestamp,
            "left_at": None,
        }
        working.setdefault("participants", []).append(participant)
    else:
        if name:
            participant["name"] = name
        if roles:
            participant["roles"] = roles
        participant["status"] = status
        participant["left_at"] = timestamp if status == "inactive" else None
        if status == "active" and not participant.get("joined_at"):
            participant["joined_at"] = timestamp
    active_people = [item for item in working["participants"] if item.get("status") == "active"]
    if not active_people:
        raise ValueError("프로젝트 책임자를 포함한 활성 참여자가 최소 1명 필요합니다")
    if not any("소유자" in item.get("roles", []) for item in active_people):
        raise ValueError("활성 참여자 중 최소 1명은 소유자 역할이어야 합니다")
    temporary_data = {"collaboration": working}
    selected_profile_id = selected_collaboration_profile_id(temporary_data)
    working["policy"]["current_profile"] = selected_profile_id
    transitions = working.setdefault("transitions", [])
    next_number = max((int(item["id"].split("-")[-1]) for item in transitions), default=0) + 1
    transitions.append({
        "id": f"CBT-{next_number:03d}",
        "from": current_profile_id,
        "to": selected_profile_id,
        "reason": reason,
        "changed_at": timestamp,
        "changed_by": changed_by,
        "participant": participant_id,
        "participant_status": status,
    })
    payload.clear()
    payload.update(working)
    return selected_profile_id


def apply_collaboration_identity(
    payload: dict[str, Any],
    mapping_id: str,
    principal_type: str,
    participant_id: str | None,
    git_name: str | None,
    git_email: str | None,
    hosting_accounts: list[str],
    reason: str,
    changed_by: str,
    timestamp: str,
) -> str:
    if not mapping_id.startswith("IDM-"):
        raise ValueError("신원 매핑 ID는 IDM- 접두사를 사용해야 합니다")
    if principal_type not in {"human", "bot"}:
        raise ValueError("신원 유형은 human 또는 bot이어야 합니다")
    if bool(git_name) != bool(git_email):
        raise ValueError("Git 이름과 이메일은 함께 제공해야 합니다")
    if not reason.strip() or not changed_by.strip():
        raise ValueError("신원 매핑 사유와 기록자는 필수입니다")
    working = copy.deepcopy(payload)
    participants = {item["id"]: item for item in working.get("participants", [])}
    if principal_type == "human" and participant_id not in participants:
        raise ValueError(f"사람 신원은 기존 참여자와 연결해야 합니다: {participant_id}")
    if principal_type == "bot" and participant_id:
        raise ValueError("봇 신원은 사람 참여자와 연결할 수 없습니다")
    mapping = next((item for item in working.get("identity_mappings", []) if item["id"] == mapping_id), None)
    if mapping is None:
        mapping = {
            "id": mapping_id,
            "principal_type": principal_type,
            "participant": participant_id,
            "git_identities": [],
            "hosting_accounts": [],
            "verified_at": timestamp,
            "verified_by": changed_by,
            "reason": reason,
        }
        working.setdefault("identity_mappings", []).append(mapping)
        action = "created"
    else:
        if mapping.get("principal_type") != principal_type or mapping.get("participant") != participant_id:
            raise ValueError("기존 신원 매핑의 유형이나 참여자 연결은 변경할 수 없습니다")
        action = "alias_added"
    if git_name and git_email:
        key = normalize_git_identity(git_name, git_email)
        for candidate in working.get("identity_mappings", []):
            for alias in candidate.get("git_identities", []):
                if normalize_git_identity(alias.get("name", ""), alias.get("email", "")) == key:
                    if candidate["id"] != mapping_id:
                        raise ValueError(f"Git 신원이 이미 {candidate['id']}에 연결되어 있습니다")
                    break
            else:
                continue
            break
        if not any(normalize_git_identity(item["name"], item["email"]) == key for item in mapping["git_identities"]):
            mapping["git_identities"].append({"name": git_name.strip(), "email": git_email.strip()})
    known_hosting = {
        account.casefold(): candidate["id"]
        for candidate in working.get("identity_mappings", [])
        for account in candidate.get("hosting_accounts", [])
    }
    for account in hosting_accounts:
        normalized = account.strip().casefold()
        if not normalized:
            raise ValueError("빈 호스팅 계정은 등록할 수 없습니다")
        if normalized in known_hosting and known_hosting[normalized] != mapping_id:
            raise ValueError(f"호스팅 계정 {account}은(는) 이미 {known_hosting[normalized]}에 연결되어 있습니다")
        if normalized not in {item.casefold() for item in mapping["hosting_accounts"]}:
            mapping["hosting_accounts"].append(account.strip())
            known_hosting[normalized] = mapping_id
    if not mapping["git_identities"] and not mapping["hosting_accounts"]:
        raise ValueError("Git 신원이나 호스팅 계정을 하나 이상 제공해야 합니다")
    mapping["verified_at"] = timestamp
    mapping["verified_by"] = changed_by
    mapping["reason"] = reason
    events = working.setdefault("identity_events", [])
    next_number = max((int(item["id"].split("-")[-1]) for item in events), default=0) + 1
    events.append({
        "id": f"IDE-{next_number:03d}", "mapping": mapping_id, "action": action,
        "changed_at": timestamp, "changed_by": changed_by, "reason": reason,
    })
    payload.clear()
    payload.update(working)
    return mapping_id


def update_collaboration_member(
    participant_id: str,
    name: str | None,
    roles: list[str],
    status: str,
    reason: str,
    changed_by: str,
) -> str:
    path = SSOT / FILES["collaboration"]
    payload = read_json(path)
    timestamp = datetime.now().astimezone().isoformat(timespec="seconds")
    selected_profile_id = apply_collaboration_member(
        payload, participant_id, name, roles, status, reason, changed_by, timestamp,
    )
    write_json_atomic(path, payload)
    data = load_records()
    generate(data)
    return f"{participant_id}을(를) {status} 상태로 기록하고 협업 프로필을 {selected_profile_id}(으)로 적용했습니다."


def update_collaboration_identity(
    mapping_id: str,
    principal_type: str,
    participant_id: str | None,
    git_name: str | None,
    git_email: str | None,
    hosting_accounts: list[str],
    reason: str,
    changed_by: str,
) -> str:
    path = SSOT / FILES["collaboration"]
    payload = read_json(path)
    timestamp = datetime.now().astimezone().isoformat(timespec="seconds")
    apply_collaboration_identity(
        payload, mapping_id, principal_type, participant_id, git_name, git_email,
        hosting_accounts, reason, changed_by, timestamp,
    )
    write_json_atomic(path, payload)
    data = load_records()
    generate(data)
    return f"{mapping_id} 신원 매핑을 기록하고 협업 문서를 재생성했습니다."


def identity_check_text(data: dict[str, dict[str, Any]]) -> str:
    registered, unknown = audit_git_identities(data)
    registered_rows = [
        [item["name"], item["email"], ", ".join(ko_code(role) for role in item["roles"]), item["mapping"], ko_code(item["principal_type"]), item.get("participant") or "-"]
        for item in registered
    ]
    unknown_rows = [
        [item["name"], item["email"], ", ".join(ko_code(role) for role in item["roles"]), identity_issue_text(item)]
        for item in unknown
    ]
    return (
        "# Git 신원 대조 결과\n\n"
        + f"- 등록 신원: {len(registered)}개\n- 미등록 신원: {len(unknown)}개\n\n"
        + "## 등록 신원\n\n" + table(["이름", "이메일", "관찰 위치", "매핑", "유형", "참여자"], registered_rows)
        + "\n\n## 미등록 신원\n\n" + table(["이름", "이메일", "관찰 위치", "필요 조치"], unknown_rows) + "\n"
    )


def install_git_hooks() -> str:
    try:
        git("rev-parse", "--show-toplevel")
    except FileNotFoundError:
        raise RuntimeError("Git is not installed or not available on PATH.")
    except subprocess.CalledProcessError as exc:
        raise RuntimeError("Initialize a Git repository before installing hooks.") from exc
    try:
        for hook in (ROOT / ".githooks" / "post-merge", ROOT / ".githooks" / "pre-commit"):
            hook.chmod(hook.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
        git("config", "core.hooksPath", ".githooks")
    except (OSError, subprocess.CalledProcessError) as exc:
        raise RuntimeError("Unable to configure the repository hook path or executable permission.") from exc
    return "Configured Git to use .githooks; branch policy and merge-impact recording are active."


def project_init(quiet: bool = False) -> str:
    """Create only the safe local Git foundation for a copied AIDD template."""
    created = False
    existing_root = git_repository_root()
    if existing_root is not None and existing_root != ROOT.resolve():
        raise RuntimeError("AIDD 템플릿이 다른 Git 저장소의 하위 폴더에 있습니다. 별도 프로젝트 루트에서 시작하세요.")
    if existing_root is None:
        try:
            subprocess.run(
                ["git", "init", "-b", "main"], cwd=ROOT, check=True, capture_output=True,
                text=True, encoding="utf-8", errors="replace",
            )
        except FileNotFoundError as exc:
            raise RuntimeError("Git is not installed or not available on PATH.") from exc
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(f"로컬 Git 저장소를 초기화하지 못했습니다: {exc.stderr.strip()}") from exc
        created = True
    install_git_hooks()
    branch = current_git_branch() or "아직 커밋 전"
    if quiet:
        return "initialized" if created else "ready"
    action = "로컬 Git 저장소를 만들고" if created else "기존 로컬 Git 저장소를 확인하고"
    return (
        f"{action} `.githooks`를 활성화했습니다. 현재 브랜치: `{branch}`.\n"
        "파일을 자동 스테이징하거나 커밋하지 않았고, Git 신원을 자동 등록하지 않았습니다. "
        "`.gitignore`와 비밀정보를 검토한 뒤 고객이 확인한 Git 이름·이메일을 HUM/IDM에 연결하고 최초 기준선 커밋을 만드세요."
    )


def project_init_status() -> str:
    root = git_repository_root()
    if root is None:
        return (
            "# 프로젝트 초기화 상태\n\n- Git 저장소: 미초기화\n"
            "- 다음 명령: `python tools/aidd.py project-init`\n"
            "- 자동화 범위: 로컬 `main` 저장소와 `.githooks`만 만들며, 파일 스테이징·커밋·신원 등록은 하지 않습니다.\n"
        )
    if root != ROOT.resolve():
        return (
            "# 프로젝트 초기화 상태\n\n"
            f"- Git 저장소: 상위 저장소 감지 (`{root}`)\n"
            "- 조치: 이 템플릿을 별도 프로젝트 루트로 복사한 뒤 `project-init`을 실행하세요. 상위 저장소의 훅 설정은 변경하지 않습니다.\n"
        )
    try:
        hook_path = git("config", "--get", "core.hooksPath")
    except subprocess.CalledProcessError:
        hook_path = "미설정"
    return (
        "# 프로젝트 초기화 상태\n\n"
        f"- Git 저장소: 준비됨 (`{root}`)\n- 현재 브랜치: `{current_git_branch() or '분리된 HEAD 또는 커밋 전'}`\n"
        f"- Git 훅 경로: `{hook_path or '미설정'}`\n"
        "- 다음 단계: `.gitignore`·비밀정보 검토, Git 신원 확인·IDM 등록, 최초 기준선 커밋\n"
    )


def run_hook(platform: str, event: str) -> int:
    if event.lower() == "stop":
        try:
            project_init(quiet=True)
        except RuntimeError:
            # Validation below returns the actionable error without breaking the host hook protocol.
            pass
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
    merge_parser = sub.add_parser("record-merge", help="record HEAD when it is a merge commit")
    merge_parser.add_argument("squash", nargs="?", choices=("0", "1"), help="Git post-merge squash flag")
    assess_parser = sub.add_parser("assess-merge", help="complete impact assessment for a recorded merge")
    assess_parser.add_argument("--merge", required=True, help="merge record ID")
    assess_parser.add_argument("--modules", nargs="*", default=[], help="affected module IDs")
    assess_parser.add_argument("--notes", required=True, help="conflict-resolution and interaction notes")
    assess_parser.add_argument("--additional-testing", required=True, help="additional regression-test decision")
    sub.add_parser("install-hooks", help="configure this Git repository to use .githooks")
    sub.add_parser("project-init", help="initialize a safe local Git foundation without staging or committing files")
    sub.add_parser("project-init-status", help="show local Git initialization and hook status")
    branch_parser = sub.add_parser("branch-check", help="check the active collaboration profile's local branch rule")
    branch_parser.add_argument("--change", help="optional change ID for a risk-class-specific decision")
    release_parser = sub.add_parser("release-check", help="fail when a release has unresolved blockers")
    release_parser.add_argument("--release", required=True, help="release ID")
    development_parser = sub.add_parser("development-check", help="check whether implementation may start")
    development_parser.add_argument("--change", required=True, help="change ID")
    sub.add_parser("evaluation-status", help="show Codex and Claude evaluation coverage")
    sub.add_parser("collaboration-status", help="show active collaboration profile and participants")
    member_parser = sub.add_parser("collaboration-member", help="add, activate, or deactivate a human participant")
    member_parser.add_argument("--id", required=True, help="participant ID such as HUM-002")
    member_parser.add_argument("--name", help="participant name; required for a new participant")
    member_parser.add_argument("--role", action="append", default=[], help="participant role; repeat when needed")
    member_parser.add_argument("--status", choices=("active", "inactive"), required=True)
    member_parser.add_argument("--reason", required=True, help="membership-change reason")
    member_parser.add_argument("--changed-by", default="프로젝트 책임자", help="person recording the change")
    identity_parser = sub.add_parser("collaboration-identity", help="map a Git or hosting identity to a human participant or bot")
    identity_parser.add_argument("--id", required=True, help="identity mapping ID such as IDM-002")
    identity_parser.add_argument("--type", choices=("human", "bot"), required=True, dest="principal_type")
    identity_parser.add_argument("--participant", help="existing HUM ID; required for a human identity")
    identity_parser.add_argument("--git-name", help="Git author or committer name")
    identity_parser.add_argument("--git-email", help="Git author or committer email")
    identity_parser.add_argument("--hosting-account", action="append", default=[], help="hosting account alias; repeat when needed")
    identity_parser.add_argument("--reason", required=True, help="identity-verification reason")
    identity_parser.add_argument("--changed-by", default="프로젝트 책임자", help="person recording the mapping")
    identity_check_parser = sub.add_parser("identity-check", help="compare reachable Git identities with registered mappings")
    identity_check_parser.add_argument("--warning-only", action="store_true", help="report unknown identities without a nonzero exit")
    prompt_parser = sub.add_parser("evaluation-prompt", help="render one common agent-evaluation prompt")
    prompt_parser.add_argument("--scenario", required=True, help="evaluation scenario ID")
    record_evaluation_parser = sub.add_parser("record-evaluation", help="record one platform evaluation result")
    record_evaluation_parser.add_argument("--scenario", required=True, help="evaluation scenario ID")
    record_evaluation_parser.add_argument("--platform", choices=("codex", "claude"), required=True)
    record_evaluation_parser.add_argument("--status", choices=("passed", "failed"), required=True)
    record_evaluation_parser.add_argument("--evidence", required=True, help="matching EVD evidence ID")
    record_evaluation_parser.add_argument("--scores", nargs="+", type=int, required=True, help="0~2 score for every rubric item")
    record_evaluation_parser.add_argument("--critical-violation", action="append", default=[], help="critical forbidden behavior; repeat when needed")
    record_evaluation_parser.add_argument("--summary", required=True, help="evaluation summary")
    hook_parser = sub.add_parser("hook", help="run a lifecycle gate for an agent adapter")
    hook_parser.add_argument("--platform", choices=("codex", "claude"), required=True)
    hook_parser.add_argument("--event", required=True)
    args = parser.parse_args()

    if args.command == "sync-ai":
        sync_ai()
        print("Synchronized agent instructions and skills.")
        return 0
    if args.command == "record-merge":
        print(record_merge(args.squash))
        return 0
    if args.command == "assess-merge":
        try:
            print(assess_merge(args.merge, args.modules, args.notes, args.additional_testing))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "record-evaluation":
        try:
            print(record_evaluation(
                args.scenario, args.platform, args.status, args.evidence,
                args.scores, args.critical_violation, args.summary,
            ))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "collaboration-member":
        try:
            print(update_collaboration_member(args.id, args.name, args.role, args.status, args.reason, args.changed_by))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "collaboration-identity":
        try:
            print(update_collaboration_identity(
                args.id, args.principal_type, args.participant, args.git_name, args.git_email,
                args.hosting_account, args.reason, args.changed_by,
            ))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "install-hooks":
        try:
            print(install_git_hooks())
        except RuntimeError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "project-init":
        try:
            print(project_init())
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
    if args.command == "release-check":
        release = next((item for item in data["releases"].get("releases", []) if item["id"] == args.release), None)
        if not release:
            print(f"ERROR: 알 수 없는 릴리스: {args.release}", file=sys.stderr)
            return 2
        blockers = release_blockers(data, release)
        for blocker in blockers:
            print(f"BLOCKER: {blocker}")
        if blockers:
            print(f"Release {args.release} is blocked by {len(blockers)} item(s).")
            return 1
        print(f"Release {args.release} is ready.")
        return 0
    if args.command == "development-check":
        change = next((item for item in data["changes"].get("changes", []) if item["id"] == args.change), None)
        if not change:
            print(f"ERROR: 알 수 없는 변경: {args.change}", file=sys.stderr)
            return 2
        blockers = development_blockers(data, change)
        for blocker in blockers:
            print(f"BLOCKER: {blocker}")
        if blockers:
            print(f"변경 {args.change}의 구현 시작이 {len(blockers)}개 항목으로 차단되었습니다.")
            return 1
        print(f"변경 {args.change}의 구현을 시작할 수 있습니다.")
        return 0
    if args.command == "branch-check":
        change = None
        if args.change:
            change = next((item for item in data["changes"].get("changes", []) if item["id"] == args.change), None)
            if not change:
                print(f"ERROR: 알 수 없는 변경: {args.change}", file=sys.stderr)
                return 2
        blockers = branch_policy_blockers(data, change)
        for blocker in blockers:
            print(f"BLOCKER: {blocker}")
        if blockers:
            return 1
        print("현재 협업 프로필의 로컬 브랜치 정책을 충족합니다.")
        return 0
    if args.command == "project-init-status":
        print(project_init_status())
        return 0
    if args.command == "evaluation-status":
        print(table(["시나리오", "제목", "플랫폼", "실행 상태"], evaluation_coverage(data)))
        return 0
    if args.command == "collaboration-status":
        print(render_collaboration_governance(data, include_runtime_identity=True).removeprefix(NOTICE))
        return 0
    if args.command == "identity-check":
        print(identity_check_text(data))
        _registered, unknown = audit_git_identities(data)
        return 1 if unknown and not args.warning_only else 0
    if args.command == "evaluation-prompt":
        try:
            print(evaluation_prompt(data, args.scenario))
        except (OSError, ValueError) as exc:
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
