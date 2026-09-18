#!/usr/bin/env python3
"""Deterministic AIDD registry tooling. Uses only the Python standard library."""

from __future__ import annotations

import argparse
import copy
import filecmp
import fnmatch
import hashlib
import html
import json
import os
import re
import secrets
import shutil
import stat
import subprocess
import sys
from collections import Counter
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / "project"
SSOT = PROJECT / ".aidd" / "ssot"
GENERATED = PROJECT / "docs" / "generated"
PROJECT_SKELETON = ROOT / ".ai" / "templates" / "project-skeleton"
PROJECT_HOME_TEMPLATE = ROOT / ".ai" / "templates" / "site-kit" / "project-home.html"
DOCUMENT_SITE_TEMPLATE = ROOT / ".ai" / "templates" / "site-kit" / "document-site.html"
SITE_KIT_ASSETS = ROOT / ".ai" / "templates" / "site-kit" / "assets"
CANONICAL_SKILLS = ROOT / ".ai" / "skills"
SKILL_TARGETS = (ROOT / ".agents" / "skills", ROOT / ".claude" / "skills")
NOTICE = "<!-- .ai/tools/aidd.py가 project/.aidd/ssot 정본에서 자동 생성했습니다. 직접 수정하지 마세요. -->\n\n"
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
    "not_applicable": "해당 없음", "superseded": "통합됨", "generated": "자동 생성", "generated-diagram": "자동 생성 다이어그램",
    "authored-and-linked": "직접 작성·연결", "feature": "기능", "refactoring": "리팩터링", "medium": "중간", "high": "높음",
    "critical": "치명적", "low": "낮음", "in_review": "검토 중", "approved": "승인됨",
    "rejected": "거절됨", "expired": "만료됨", "waived": "예외 승인", "pending": "대기 중",
    "review": "재검토", "test": "재테스트",
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
    "assumptions": "assumptions.json",
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
    "foundation": "foundation.json",
    "ui_system": "ui-system.json",
    "operations": "operations.json",
    "delivery_profiles": "delivery-profiles.json",
    "documentation": "documentation.json",
    "system_surfaces": "system-surfaces.json",
    "workboard": "workboard.json",
}
MODULE_SPEC_DIR = SSOT / "modules"
MODULE_DOCUMENT_DIR = GENERATED / "modules"
UI_MODULE_SPEC_DIR = SSOT / "ui-modules"
UI_MODULE_DOCUMENT_DIR = GENERATED / "ui" / "modules"
MANUAL_MODULE_DOCUMENT_DIR = GENERATED / "manuals" / "modules"
SYSTEM_SURFACE_SPEC_DIR = SSOT / "system-surfaces"


def read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    temporary = path.with_name(f"{path.name}.{os.getpid()}.{secrets.token_hex(4)}.tmp")
    try:
        temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
        temporary.replace(path)
    finally:
        if temporary.exists():
            temporary.unlink()


@contextmanager
def repository_write_lock():
    """Serialize multi-file SSOT mutations made by concurrent AI processes."""
    lock_path = SSOT / ".write.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+b") as handle:
        handle.seek(0, 2)
        if handle.tell() == 0:
            handle.write(b"0")
            handle.flush()
        handle.seek(0)
        if os.name == "nt":
            import msvcrt

            msvcrt.locking(handle.fileno(), msvcrt.LK_LOCK, 1)
        else:
            import fcntl

            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            handle.seek(0)
            if os.name == "nt":
                import msvcrt

                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl

                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def module_spec_paths() -> list[Path]:
    """Return module-owned specification fragments in a stable order."""
    if not MODULE_SPEC_DIR.exists():
        return []
    return sorted(path for path in MODULE_SPEC_DIR.glob("*.json") if path.is_file())


def ui_module_spec_paths() -> list[Path]:
    """Return optional module-owned UI specification fragments in a stable order."""
    if not UI_MODULE_SPEC_DIR.exists():
        return []
    return sorted(path for path in UI_MODULE_SPEC_DIR.glob("*.json") if path.is_file())


def system_surface_spec_paths() -> list[Path]:
    """Return module-owned executable surface inventory fragments."""
    if not SYSTEM_SURFACE_SPEC_DIR.exists():
        return []
    return sorted(path for path in SYSTEM_SURFACE_SPEC_DIR.glob("*.json") if path.is_file())


def load_records() -> dict[str, dict[str, Any]]:
    """Load the legacy registry plus optional module-owned requirement fragments.

    The in-memory shape intentionally remains unchanged so all existing renderers,
    validators, and integrations see one normalized graph.  A module fragment owns
    storage of a requirement; its ``modules`` links still express every affected
    module, including cross-module requirements.
    """
    data = {name: read_json(SSOT / filename) for name, filename in FILES.items()}
    data["requirements"]["_root_requirements"] = list(data["requirements"].get("requirements", []))
    fragments: list[tuple[Path, dict[str, Any]]] = []
    for path in module_spec_paths():
        fragment = read_json(path)
        fragments.append((path, fragment))
        requirements = fragment.get("requirements", [])
        if isinstance(requirements, list):
            data["requirements"].setdefault("requirements", []).extend(requirements)
    data["requirements"].get("requirements", []).sort(key=lambda item: item.get("id", ""))
    data["requirements"]["_module_fragments"] = fragments
    ui_fragments: list[tuple[Path, dict[str, Any]]] = []
    screens: list[dict[str, Any]] = []
    manuals: list[dict[str, Any]] = []
    for path in ui_module_spec_paths():
        fragment = read_json(path)
        ui_fragments.append((path, fragment))
        if isinstance(fragment.get("screens"), list):
            screens.extend(fragment["screens"])
        if isinstance(fragment.get("manuals"), list):
            manuals.extend(fragment["manuals"])
    data["ui_modules"] = {
        "fragments": ui_fragments,
        "screens": sorted(screens, key=lambda item: item.get("id", "")),
        "manuals": sorted(manuals, key=lambda item: item.get("id", "")),
    }
    surface_fragments: list[tuple[Path, dict[str, Any]]] = []
    surfaces = list(data["system_surfaces"].get("surfaces", []))
    data["system_surfaces"]["_root_surfaces"] = list(surfaces)
    for path in system_surface_spec_paths():
        fragment = read_json(path)
        surface_fragments.append((path, fragment))
        if isinstance(fragment.get("surfaces"), list):
            surfaces.extend(fragment["surfaces"])
    data["system_surfaces"]["_module_fragments"] = surface_fragments
    data["system_surfaces"]["surfaces"] = sorted(surfaces, key=lambda item: item.get("id", ""))
    return data


def is_bootstrap_project(data: dict[str, dict[str, Any]]) -> bool:
    """Return whether records intentionally represent a not-yet-scoped product."""
    return data.get("project", {}).get("phase") == "bootstrap"


def bootstrap_status_text(data: dict[str, dict[str, Any]]) -> str:
    project = data["project"]
    source = project.get("existing_source") or "없음(새 구축)"
    return (
        "# 프로젝트 착수 대기 상태\n\n"
        f"- 프로젝트: `{project.get('project_id', '미정')}` · {project.get('name', '미정')}\n"
        f"- 기존 소스 위치: {source}\n"
        "- 상태: 제품 정본의 골격만 생성되었습니다. 아직 요구사항·모듈·배포 맥락·기술 기준선은 작성되지 않았습니다.\n\n"
        "## 다음 AI 대화\n\n"
        "1. 제품의 목적, 사용자, 성과, 범위와 제외 범위를 함께 정의합니다.\n"
        "2. 기존 소스가 있으면 `project/src/`로 옮길 범위와 현재 구조를 먼저 분석합니다. 자동 이동하지 않습니다.\n"
        "3. 모듈 후보와 배포·운영 맥락을 정한 뒤 정본을 채우고 `phase`를 `discovery` 이상으로 변경합니다.\n"
        "4. 그때부터 일반 `validate`, 문서 생성, 개발 게이트를 사용합니다.\n"
    )


def validate_bootstrap_project(data: dict[str, dict[str, Any]]) -> tuple[list[str], list[str]]:
    """Keep an unscoped project usable without pretending it is delivery-ready."""
    errors: list[str] = []
    project = data.get("project", {})
    for field in ("project_id", "name", "introduction", "overview", "intent", "vision", "problem", "phase", "delivery_mode"):
        if not project.get(field):
            errors.append(f"bootstrap project.json has no {field}")
    if project.get("phase") != "bootstrap":
        errors.append("bootstrap project must use phase 'bootstrap'")
    for name, filename in FILES.items():
        path = SSOT / filename
        if not path.is_file():
            errors.append(f"bootstrap is missing canonical record {filename}")
        elif not isinstance(data.get(name), dict):
            errors.append(f"bootstrap canonical record {filename} must be an object")
    if not (PROJECT / "src").is_dir():
        errors.append("bootstrap is missing project/src")
    return errors, [
        "프로젝트가 착수 상태입니다. 요구사항·모듈·배포 맥락·기술 기준선을 합의한 뒤 phase를 bootstrap 이외 값으로 변경하세요."
    ]


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


def approval_matches(approvals: dict[str, dict[str, Any]], approval_id: Any, subject: str) -> bool:
    approval = approvals.get(approval_id) if isinstance(approval_id, str) else None
    return bool(approval and approval.get("subject") == subject and approval.get("decision") == "approved")


CAPTURE_EXTENSIONS = {".gif", ".jpeg", ".jpg", ".mp4", ".png", ".webm", ".webp"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def repository_path(value: str) -> Path:
    """Resolve logical project/... paths against the active product workspace.

    In normal distributions PROJECT is ROOT/project. Kit-source regression tests may
    explicitly point PROJECT at an isolated fixture without changing canonical IDs.
    """
    normalized = str(value).replace("\\", "/")
    # The reference project predates the Kit/product lifecycle split. Preserve
    # its immutable evidence paths while resolving the one relocated source-only
    # regression suite in kit-source repositories.
    if normalized == ".ai/tests/test_aidd.py":
        relocated = ROOT / ".aidd-kit-dev" / "tests" / "test_aidd.py"
        if relocated.is_file():
            return relocated
    if normalized == "project":
        return PROJECT
    if normalized.startswith("project/"):
        return PROJECT / normalized.removeprefix("project/")
    return ROOT / normalized


def is_kit_source() -> bool:
    try:
        return json.loads((ROOT / ".aidd-role.json").read_text(encoding="utf-8")).get("role") == "kit-source"
    except (OSError, json.JSONDecodeError):
        return False


def product_workspace_role_record() -> dict[str, Any]:
    """Return the managed role marker written after a successful bootstrap."""
    return {
        "schema_version": 1,
        "role": "product-workspace",
        "managed_by": "AIDD Kit export/bootstrap",
        "mutable_by_user": False,
    }


def project_distribution_path(value: str) -> Path:
    """Resolve repository-level product adapters in a kit-source regression run."""
    normalized = str(value).replace("\\", "/")
    exported = ROOT / ".aidd-kit-dev" / "export" / normalized
    if is_kit_source() and exported.exists():
        return exported
    return ROOT / normalized


def is_verified_actual_capture(item: dict[str, Any], screen_id: str | None = None) -> bool:
    artifacts = item.get("artifacts", [])
    hashes = item.get("artifact_hashes", {})
    return bool(
        item.get("type") == "ui-capture"
        and item.get("status") == "passed"
        and item.get("capture_kind") == "actual"
        and (screen_id is None or screen_id in item.get("screens", []))
        and item.get("environment")
        and re.fullmatch(r"[0-9a-fA-F]{7,40}", str(item.get("commit", "")))
        and artifacts
        and isinstance(hashes, dict)
        and all(
            Path(artifact).suffix.lower() in CAPTURE_EXTENSIONS
            and not str(artifact).replace("\\", "/").casefold().startswith("project/docs/generated/")
            and repository_path(artifact).is_file()
            and re.fullmatch(r"[0-9a-fA-F]{64}", str(hashes.get(artifact, "")))
            and sha256_file(repository_path(artifact)).casefold() == str(hashes[artifact]).casefold()
            for artifact in artifacts
        )
    )


def release_blockers(
    data: dict[str, dict[str, Any]], release: dict[str, Any], include_runtime_identity: bool = True,
) -> list[str]:
    tests = index(data["tests"]["test_cases"])
    changes = index(data["changes"]["changes"])
    gate_runs = data["gate_runs"].get("gate_runs", [])
    deliverables = index(data["deliverables"].get("deliverables", []))
    delivery_profiles = index(data["delivery_profiles"].get("delivery_profiles", []))
    screens = index(data["ui_modules"].get("screens", []))
    manuals = index(data["ui_modules"].get("manuals", []))
    evidence = data["evidence"].get("evidence", [])
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
        for recheck in merge.get("rechecks", []):
            if recheck.get("status") == "pending" and recheck.get("blocking"):
                blockers.append(f"{merge['id']}의 {recheck['id']} 병합 후 재검토가 완료되지 않았습니다")
    for deliverable_id in release.get("required_deliverables", []):
        deliverable = deliverables.get(deliverable_id)
        if not deliverable or deliverable.get("status") != "current":
            blockers.append(f"{deliverable_id} 산출물이 최신 상태가 아닙니다")
    for work in data["delivery_plan"].get("work_items", []):
        if (
            work.get("type") == "documentation-reconciliation"
            and work.get("due_release") == release.get("id")
            and work.get("status") != "completed"
        ):
            blockers.append(f"{work['id']} 문서 현행화 작업이 완료되지 않았습니다")
    for plan in data["system_surfaces"].get("legacy_plans", []):
        if plan.get("due_release") == release.get("id") and plan.get("status") != "completed":
            blockers.append(f"{plan['id']} 레거시 인벤토리·문서 전환 계획이 완료되지 않았습니다")
    profile = delivery_profiles.get(release.get("delivery_profile"))
    if not profile:
        blockers.append(f"{release.get('delivery_profile', 'DLP 누락')} 전달 프로필이 없습니다")
    else:
        rules = profile.get("release_rules", {})
        required_screens = release.get("screens", [])
        required_manuals = release.get("manuals", [])
        if rules.get("require_verified_capture") and not required_screens:
            blockers.append(f"{profile['id']}는 검증된 실제 화면 캡처를 요구하지만 릴리스 화면이 없습니다")
        for screen_id in required_screens:
            screen = screens.get(screen_id)
            if not screen or screen.get("status") not in {"verified", "released"}:
                blockers.append(f"{screen_id} 화면이 검증 또는 출시 상태가 아닙니다")
                continue
            captures = [item for item in evidence if is_verified_actual_capture(item, screen_id)]
            if rules.get("require_verified_capture") and not captures:
                blockers.append(f"{screen_id}에 커밋·환경이 연결된 실제 화면 캡처 증거가 없습니다")
        for manual_id in required_manuals:
            manual = manuals.get(manual_id)
            if not manual or manual.get("status") not in {"verified", "released"}:
                blockers.append(f"{manual_id} 매뉴얼이 검증 또는 출시 상태가 아닙니다")
        if not rules.get("allow_mockups"):
            linked_ids = set(required_screens) | set(required_manuals)
            if any(
                item.get("capture_kind") == "mockup"
                and (linked_ids & (set(item.get("screens", [])) | set(item.get("manuals", []))))
                for item in evidence
            ):
                blockers.append(f"{profile['id']} 출시 범위에 목업 증거가 연결되어 있습니다")
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
        return ["Git 저장소가 초기화되지 않았습니다. python .ai/tools/aidd.py project-init를 먼저 실행하세요"]
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


def documentation_work_blockers(
    data: dict[str, dict[str, Any]], change: dict[str, Any], path: dict[str, Any],
) -> list[str]:
    """Validate a customer's explicit decision to defer missing legacy documentation."""
    if path.get("documentation") != "deferred":
        return []
    blockers: list[str] = []
    work_index = index(data["delivery_plan"].get("work_items", []))
    work_ids = path.get("documentation_work", [])
    if not work_ids:
        return [f"{change['id']}의 문서 후속 작성 결정에 연결된 WRK가 없습니다"]
    surfaces = set(path.get("surfaces", []))
    for work_id in work_ids:
        work = work_index.get(work_id)
        if not work:
            blockers.append(f"{change['id']}의 문서 후속 작업 {work_id}가 없습니다")
            continue
        if work.get("type") != "documentation-reconciliation":
            blockers.append(f"{work_id}는 문서 현행화 작업 유형이 아닙니다")
        if work.get("status") == "completed":
            blockers.append(f"{work_id}가 완료되어 미해결 문서 부채를 추적할 수 없습니다")
        if work.get("change") != change.get("id"):
            blockers.append(f"{work_id}가 {change['id']}에 연결되지 않았습니다")
        if not surfaces.issubset(set(work.get("surfaces", []))):
            blockers.append(f"{work_id}가 {change['id']}의 영향 표면을 모두 포함하지 않습니다")
        if not work.get("target_docs"):
            blockers.append(f"{work_id}에 작성할 문서 종류가 없습니다")
        if not work.get("due_milestone") and not work.get("due_release"):
            blockers.append(f"{work_id}에 완료할 마일스톤 또는 릴리스가 없습니다")
    return blockers


def delivery_path_blockers(data: dict[str, dict[str, Any]], change: dict[str, Any]) -> list[str]:
    """Check analysis, design, and documentation readiness for implementation."""
    path = change.get("delivery_path")
    if not isinstance(path, dict):
        return [f"{change['id']}에 분석·설계·문서화 delivery_path가 없습니다"]
    kind = path.get("kind")
    blockers: list[str] = []
    if kind not in DELIVERY_PATH_KINDS:
        return [f"{change['id']}의 변경 경로 유형이 올바르지 않습니다"]
    if path.get("analysis") not in READINESS_STATES:
        blockers.append(f"{change['id']}의 요구분석 준비 상태가 확정되지 않았습니다")
    if path.get("design") not in READINESS_STATES:
        blockers.append(f"{change['id']}의 설계 준비 상태가 확정되지 않았습니다")
    action = path.get("documentation")
    if action not in DOCUMENTATION_ACTIONS:
        blockers.append(f"{change['id']}의 문서 현행화 방식이 확정되지 않았습니다")
    surfaces = index(data["system_surfaces"].get("surfaces", []))
    surface_ids = path.get("surfaces", [])
    for surface_id in surface_ids:
        if surface_id not in surfaces:
            blockers.append(f"{change['id']}가 알 수 없는 시스템 표면 {surface_id}를 참조합니다")
    if kind == "new_capability":
        if path.get("analysis") not in {"complete", "reused"}:
            blockers.append(f"{change['id']} 신규 기능은 요구분석 완료 또는 승인된 기준선 재사용이 필요합니다")
        if path.get("design") not in {"complete", "reused"}:
            blockers.append(f"{change['id']} 신규 기능은 설계 완료 또는 승인된 기준선 재사용이 필요합니다")
        if action not in {"create_now", "update_now"}:
            blockers.append(f"{change['id']} 신규 기능은 문서 작성을 나중으로 미룰 수 없습니다")
        if not change.get("requirements"):
            blockers.append(f"{change['id']} 신규 기능에 연결된 요구사항이 없습니다")
        if not surface_ids:
            blockers.append(f"{change['id']} 신규 기능에 화면·API·작업 등 구현 표면이 정의되지 않았습니다")
        for requirement_id in change.get("requirements", []):
            requirement = next((item for item in data["requirements"].get("requirements", []) if item.get("id") == requirement_id), None)
            if not requirement or not requirement.get("acceptance_criteria"):
                blockers.append(f"{change['id']}의 {requirement_id}에 인수 기준이 없습니다")
        for surface_id in surface_ids:
            surface = surfaces.get(surface_id, {})
            if surface.get("documentation_status") != "current" or not surface.get("documentation_sources"):
                blockers.append(f"{change['id']} 신규 기능의 {surface_id} 분석·설계 문서가 최신 상태가 아닙니다")
    elif kind in {"existing_change", "defect", "legacy_modernization"}:
        if path.get("analysis") not in {"complete", "reused"}:
            blockers.append(f"{change['id']}의 변경 영향 분석이 완료되지 않았습니다")
        if path.get("design") not in {"complete", "reused"}:
            blockers.append(f"{change['id']}의 설계 영향 검토가 완료되지 않았습니다")
        documented = [
            surface_id for surface_id in surface_ids
            if surfaces.get(surface_id, {}).get("documentation_status") in {"current", "stale"}
        ]
        if documented and action != "update_now":
            blockers.append(
                f"{change['id']}의 기존 문서가 있는 표면은 같은 변경에서 현행화해야 합니다: "
                + ", ".join(documented)
            )
        if action == "deferred":
            blockers.extend(documentation_work_blockers(data, change, path))
        if kind == "legacy_modernization":
            active_plans = [
                item for item in data["system_surfaces"].get("legacy_plans", [])
                if item.get("status") in {"planned", "in_progress"}
            ]
            if not active_plans:
                blockers.append(f"{change['id']} 레거시 고도화에 승인된 인벤토리·문서 전환 계획이 없습니다")
    elif kind == "internal_refactor":
        if action != "not_applicable" or not path.get("reason"):
            blockers.append(f"{change['id']} 내부 변경은 문서 영향 없음의 근거가 필요합니다")
    elif kind == "governance" and action == "not_applicable" and not path.get("reason"):
        blockers.append(f"{change['id']} 거버넌스 변경의 문서 영향 없음 근거가 없습니다")
    if action in {"deferred", "not_applicable"} and not path.get("decided_by"):
        blockers.append(f"{change['id']}의 문서화 결정자가 기록되지 않았습니다")
    return blockers


def development_blockers(data: dict[str, dict[str, Any]], change: dict[str, Any]) -> list[str]:
    """Return reasons why product implementation may not start for a change."""
    if change.get("development_scope") == "governance-bootstrap":
        return []
    gate_runs = data["gate_runs"].get("gate_runs", [])
    blockers: list[str] = []
    if is_bootstrap_project(data):
        blockers.append("프로젝트가 bootstrap 상태이므로 제품 구현을 시작할 수 없습니다")
    blockers.extend(delivery_path_blockers(data, change))
    for gate_id in change.get("required_gates", []):
        candidates = [
            item for item in gate_runs
            if item.get("change") == change.get("id") and item.get("gate") == gate_id
        ]
        if not any(item.get("status") == "approved" for item in candidates):
            blockers.append(f"{change['id']}의 {gate_id}가 승인되지 않았습니다")
    blockers.extend(identity_blockers(data, change.get("class")))
    blockers.extend(branch_policy_blockers(data, change))
    _coverage_report, coverage_blockers = workload_coverage_text(data, change["id"])
    blockers.extend(coverage_blockers)
    return blockers


def collaboration_profile(data: dict[str, dict[str, Any]]) -> dict[str, Any]:
    profile_id = data["collaboration"]["policy"]["current_profile"]
    profile = next((item for item in data["collaboration"]["profiles"] if item["id"] == profile_id), None)
    if not profile:
        raise ValueError(f"알 수 없는 협업 프로필: {profile_id}")
    return profile


ASSIGNMENT_MODES = {"pm_controlled", "delegated", "self_assignment"}
WORK_COVERAGE_AREAS = {
    "design", "implementation", "test", "documentation", "security",
    "data", "migration", "deployment", "operations", "training",
}
DELIVERY_PATH_KINDS = {
    "new_capability", "existing_change", "defect", "legacy_modernization",
    "internal_refactor", "governance",
}
READINESS_STATES = {"complete", "reused", "not_applicable"}
DOCUMENTATION_ACTIONS = {"update_now", "create_now", "deferred", "not_applicable"}
SURFACE_TYPES = {"ui_route", "api", "job", "event", "external_integration", "migration"}
SURFACE_DOCUMENTATION_STATES = {"current", "stale", "undocumented", "not_applicable"}


def work_assignment_policy(data: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """Return the explicit team allocation rule; old registries get the safe default."""
    policy = data["collaboration"].get("work_assignment_policy", {})
    return {
        "mode": policy.get("mode", "pm_controlled"),
        "delegates": policy.get("delegates", []),
        "offline_coordination_required": policy.get("offline_coordination_required", True),
        "changed_at": policy.get("changed_at", "미정"),
        "changed_by": policy.get("changed_by", "미정"),
        "reason": policy.get("reason", "미정"),
    }


def active_participant(data: dict[str, dict[str, Any]], participant_id: str) -> dict[str, Any] | None:
    participant = next(
        (item for item in data["collaboration"].get("participants", []) if item.get("id") == participant_id),
        None,
    )
    return participant if participant and participant.get("status") == "active" else None


def may_allocate_work(data: dict[str, dict[str, Any]], actor_id: str, assignee_id: str) -> str | None:
    """Return an allocation denial reason, if the selected team policy denies it."""
    if collaboration_profile(data).get("mode") != "team":
        return None
    actor = active_participant(data, actor_id)
    allocation = work_assignment_policy(data)
    if allocation["mode"] == "pm_controlled":
        return None if actor and "PM" in actor.get("roles", []) else "팀의 PM 배정 모드에서는 PM 역할 참여자만 작업을 배정할 수 있습니다."
    if allocation["mode"] == "delegated":
        if actor and ("PM" in actor.get("roles", []) or actor_id in allocation["delegates"]):
            return None
        return "위임 배정 모드에서는 PM 또는 PM이 지정한 활성 위임자만 작업을 배정할 수 있습니다."
    if allocation["mode"] == "self_assignment":
        if actor_id == assignee_id:
            return None
        return "자율 배정 모드에서는 각 참여자가 자신에게만 작업을 배정할 수 있습니다."
    return "유효하지 않은 작업 배정 모드입니다."


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
    features = "\n".join(f"- {item}" for item in project.get("key_features", [])) or "- 정의 중"
    return NOTICE + f"# {project['name']} — 프로젝트 개요\n\n## 프로젝트 소개\n\n{project.get('introduction', project['vision'])}\n\n## 개요\n\n{project.get('overview', project['problem'])}\n\n## 목적과 의도\n\n{project.get('intent', project['vision'])}\n\n## 주요 기능\n\n{features}\n\n## 비전\n\n{project['vision']}\n\n## 해결할 문제\n\n{project['problem']}\n\n## 현재 수행 조건\n\n- 단계: `{ko_code(project['phase'])}`\n- 수행 방식: `{ko_code(project['delivery_mode'])}`\n- 품질 프로필: `{ko_code(project['quality_profile'])}`\n- 고객 의사결정 책임자: {project['customer_decision_owner']}\n\n## 기대 성과\n\n{outcomes}\n\n## 포함 범위\n\n{inside}\n\n## 제외 범위\n\n{outside}\n"


def render_workboard(data: dict[str, dict[str, Any]]) -> str:
    board = data["workboard"]
    focus_rows = [[
        item["id"], item["title"], item.get("change", "-"), item.get("assignee", "-"), ", ".join(item.get("modules", [])) or "-",
        item["why_now"], item["completion_condition"],
    ] for item in board.get("current_focus", [])]
    action_rows = [[item["id"], item["title"], ", ".join(item.get("links", [])) or "-", item["completion_condition"]]
                   for item in board.get("next_actions", [])]
    watch_rows = [[item["id"], item["title"], ", ".join(item.get("links", [])) or "-", item["reason"]]
                  for item in board.get("watch_items", [])]
    return NOTICE + f"# {board['title']}\n\n- 마지막 갱신: {board['updated_at']}\n\n## 현재 집중\n\n" + table(
        ["ID", "항목", "변경", "책임 참여자", "모듈", "지금 하는 이유", "완료 조건"], focus_rows,
    ) + "\n\n## 다음 작업\n\n" + table(
        ["ID", "할 일", "연결", "완료 조건"], action_rows,
    ) + "\n\n## 주시·미결 항목\n\n" + table(
        ["ID", "항목", "연결", "이유"], watch_rows,
    ) + "\n\n완료·진행 상태의 세부 근거는 CHG·WRK·OI·ASM·RSK·EVD 정본에서, 날짜별 수행 맥락은 project/work-log/YYYY-MM/YYYY-MM-DD/HUM-001.md처럼 일자·참여자별 파일에서 확인한다.\n"


def render_project_home(data: dict[str, dict[str, Any]]) -> str:
    """Render the portable HTML landing page from the project introduction record."""
    if not PROJECT_HOME_TEMPLATE.is_file():
        raise RuntimeError(f"missing project home template {PROJECT_HOME_TEMPLATE.relative_to(ROOT)}")
    project = data["project"]
    feature_items = "".join(f"<li>{html.escape(str(item))}</li>" for item in project.get("key_features", []))
    document_links = [
        ("설계·검증 문서", "design/index.html"),
        ("사용자 가이드", "user/index.html"),
        ("운영·개발 가이드", "operations/index.html"),
    ]
    links = "".join(f'<li><a href="{href}">{html.escape(label)}</a></li>' for label, href in document_links)
    values = {
        "{{PROJECT_NAME}}": html.escape(str(project["name"])),
        "{{INTRODUCTION}}": html.escape(str(project.get("introduction", project["vision"]))),
        "{{OVERVIEW}}": html.escape(str(project.get("overview", project["problem"]))),
        "{{INTENT}}": html.escape(str(project.get("intent", project["vision"]))),
        "{{KEY_FEATURES}}": feature_items or "<li>주요 기능을 정의 중입니다.</li>",
        "{{DOCUMENTS}}": links,
    }
    rendered = PROJECT_HOME_TEMPLATE.read_text(encoding="utf-8")
    for token, value in values.items():
        rendered = rendered.replace(token, value)
    return rendered


def portal_title(path: str, source: str) -> str:
    """Use the first document heading as a stable, readable portal label."""
    match = re.search(r"^#\s+(.+?)\s*$", source, flags=re.MULTILINE)
    heading = match.group(1) if match else Path(path).stem.replace("-", " ")
    return re.sub(r"[*_]", "", heading).strip()


def portal_id(path: str) -> str:
    return "doc-" + re.sub(r"[^a-z0-9]+", "-", path.lower()).strip("-")


def portal_inline(value: str) -> str:
    escaped = html.escape(value, quote=False)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', escaped)
    return escaped


def portal_markdown(source: str) -> str:
    """Small deterministic Markdown renderer for the generated, offline portal."""
    source = re.sub(r"<!--.*?-->\s*", "", source, flags=re.DOTALL)
    lines = source.splitlines()
    output: list[str] = []
    index_line = 0

    def paragraph(items: list[str]) -> None:
        if items:
            output.append("<p>" + portal_inline(" ".join(item.strip() for item in items)) + "</p>")

    while index_line < len(lines):
        line = lines[index_line]
        if not line.strip():
            index_line += 1
            continue
        heading = re.match(r"^(#{1,6})\s+(.+)$", line)
        if heading:
            level = len(heading.group(1))
            title = portal_inline(heading.group(2))
            anchor = re.sub(r"[^a-z0-9가-힣]+", "-", re.sub(r"<.*?>", "", title).lower()).strip("-")
            output.append(f"<h{level} id=\"{anchor}\">{title}</h{level}>")
            index_line += 1
            continue
        if line.startswith(">"):
            quoted: list[str] = []
            while index_line < len(lines) and lines[index_line].startswith(">"):
                quoted.append(lines[index_line][1:].strip())
                index_line += 1
            output.append("<blockquote><p>" + portal_inline(" ".join(quoted)) + "</p></blockquote>")
            continue
        if line.startswith("|"):
            table_lines: list[str] = []
            while index_line < len(lines) and lines[index_line].startswith("|"):
                table_lines.append(lines[index_line])
                index_line += 1
            rows = [[cell.strip() for cell in entry.strip().strip("|").split("|")] for entry in table_lines]
            if len(rows) >= 2:
                header = rows[0]
                body = [row for row in rows[2:] if any(row)]
                head_html = "".join("<th>" + portal_inline(cell) + "</th>" for cell in header)
                body_html = "".join(
                    "<tr>" + "".join("<td>" + portal_inline(cell) + "</td>" for cell in row) + "</tr>"
                    for row in body
                )
                output.append("<div class=\"table-wrap\"><table><thead><tr>" + head_html + "</tr></thead><tbody>" + body_html + "</tbody></table></div>")
            continue
        unordered = re.match(r"^[-*]\s+(.+)$", line)
        ordered = re.match(r"^\d+\.\s+(.+)$", line)
        if unordered or ordered:
            tag = "ul" if unordered else "ol"
            items: list[str] = []
            expression = r"^[-*]\s+(.+)$" if unordered else r"^\d+\.\s+(.+)$"
            while index_line < len(lines):
                item = re.match(expression, lines[index_line])
                if not item:
                    break
                items.append("<li>" + portal_inline(item.group(1)) + "</li>")
                index_line += 1
            output.append(f"<{tag}>" + "".join(items) + f"</{tag}>")
            continue
        body: list[str] = []
        while index_line < len(lines):
            candidate = lines[index_line]
            if not candidate.strip() or re.match(r"^(#{1,6})\s+|^>|^\||^[-*]\s+|^\d+\.\s+", candidate):
                break
            body.append(candidate)
            index_line += 1
        paragraph(body)
    return "\n".join(output) or "<p>등록된 내용이 없습니다.</p>"


def render_document_portal(
    data: dict[str, dict[str, Any]], site_title: str, group_title: str, documents: list[tuple[str, str]],
) -> str:
    if not DOCUMENT_SITE_TEMPLATE.is_file():
        raise RuntimeError(f"missing document site template {DOCUMENT_SITE_TEMPLATE.relative_to(ROOT)}")
    project_name = html.escape(str(data["project"]["name"]))
    links: list[str] = []
    pages: list[str] = []
    for path, content in documents:
        title = portal_title(path, content)
        page_id = portal_id(path)
        label = html.escape(title)
        tree_path = html.escape(f"{site_title} › {group_title} › {title}")
        links.append(
            f'<li><button class="tnode empty-chev" data-page-link="{page_id}" '
            f'data-page-path="{tree_path}" type="button"><span class="label">{label}</span></button></li>'
        )
        pages.append(
            f'<section class="delivery-page" data-page id="{page_id}" hidden><article>'
            f'<div class="source-meta review-only"><span>원본 project/docs/generated/{html.escape(path)}</span></div>'
            f'{portal_markdown(content)}</article></section>'
        )
    tree = (
        '<li class="tree-branch" data-tree-depth="0"><button class="tnode group" data-tree-group '
        f'type="button" aria-expanded="true"><svg class="icon chev"><use href="#i-chevron-down"/></svg>'
        f'<span class="label">{html.escape(group_title)}</span></button><ul>{"".join(links)}</ul></li>'
    )
    rendered = DOCUMENT_SITE_TEMPLATE.read_text(encoding="utf-8")
    for token, value in {
        "{{SITE_TITLE}}": html.escape(site_title),
        "{{PROJECT_NAME}}": project_name,
        "{{TREE}}": tree,
        "{{PAGES}}": "".join(pages),
    }.items():
        rendered = rendered.replace(token, value)
    return rendered


def render_document_sites(data: dict[str, dict[str, Any]], documents: dict[str, str]) -> dict[str, str]:
    markdown_documents = {path: content for path, content in documents.items() if path.endswith(".md")}
    user_paths = {path for path in markdown_documents if path == "user-manual.md" or path.startswith("manuals/")}
    operations_paths = {
        path for path in markdown_documents
        if path in {"operator-guide.md", "security-guide.md", "deployment-and-runtime.md", "release-readiness.md"}
        or path.startswith("operations/")
    }
    groups = {
        "design": ("설계·검증 문서", "설계·검증 문서", set(markdown_documents) - user_paths - operations_paths),
        "user": ("사용자 가이드", "업무·화면 안내", user_paths),
        "operations": ("운영·개발 가이드", "운영·보안·출시", operations_paths),
    }
    output: dict[str, str] = {}
    for site, (title, group_title, paths) in groups.items():
        selected = [(path, markdown_documents[path]) for path in sorted(paths)]
        output[f"site/{site}/index.html"] = render_document_portal(data, title, group_title, selected)
    for asset_name in ("guide.css", "delivery.css", "delivery.js", "icons.js"):
        asset_path = SITE_KIT_ASSETS / asset_name
        if not asset_path.is_file():
            raise RuntimeError(f"missing site kit asset {asset_path.relative_to(ROOT)}")
        output[f"site/assets/{asset_name}"] = asset_path.read_text(encoding="utf-8")
    return output


def documentation_value(data: dict[str, dict[str, Any]], path: str | None) -> str | None:
    if not path:
        return None
    current: Any = data
    for part in path.split("."):
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return str(current).strip() if isinstance(current, (str, int, float)) else None


def document_template_appendix(data: dict[str, dict[str, Any]], document_path: str) -> str:
    """Apply project-agreed sections to every matching generated document."""
    blocks: list[str] = []
    for template in data["documentation"].get("templates", []):
        patterns = template.get("target_patterns", [])
        if not any(fnmatch.fnmatchcase(document_path, pattern) for pattern in patterns):
            continue
        sections = template.get("required_sections", [])
        if not sections:
            continue
        rows: list[str] = []
        for section in sections:
            value = documentation_value(data, section.get("fill_from"))
            text = value or "미작성 — 이 항목은 프로젝트 문서 포맷에 합의되었으나 확인된 정본 근거가 없습니다. OI로 확인하고 현행화하세요."
            rows.append(f"### {section['title']}\n\n{text}")
        blocks.append(f"## {template['name']} 공통 항목\n\n" + "\n\n".join(rows))
    return ("\n\n" + "\n\n".join(blocks)) if blocks else ""


def render_documentation_standard(data: dict[str, dict[str, Any]]) -> str:
    documentation = data["documentation"]
    policy = documentation["policy"]
    principles = "\n".join(f"- {item}" for item in policy["principles"])
    rows = []
    for template in documentation["templates"]:
        sections = ", ".join(section["title"] for section in template["required_sections"])
        rows.append([
            template["id"], template["name"], template["audience"], template["status"],
            ", ".join(template["target_patterns"]), sections, template["seed"],
        ])
    return NOTICE + f"# 프로젝트 문서 포맷 기준\n\n- 상태: {policy['status']}\n- 책임자: {policy['owner']}\n- 합의 시점: {policy['agreement_gate']}\n\n## 운영 원칙\n\n{principles}\n\n## 문서 유형별 합의 현황\n\n" + table(
        ["ID", "문서 유형", "독자", "상태", "적용 생성물", "필수 항목", "Kit 예시 서식"], rows,
    ) + "\n\n새 항목은 documentation.json의 해당 문서 유형에 추가한다. 생성기는 같은 유형의 기존 문서 전체에 항목을 소급 표시하고, 확인된 자동 근거가 없으면 미작성으로 표시한다.\n"


def render_system_surface_coverage(data: dict[str, dict[str, Any]]) -> str:
    registry = data["system_surfaces"]
    policy = registry["policy"]
    surfaces = table(
        ["ID", "모듈", "유형", "식별 키", "문서 상태", "소스 패턴", "문서 정본"],
        [[
            item["id"], item["module"], item["type"], item["key"], item["documentation_status"],
            ", ".join(item.get("source_patterns", [])), ", ".join(item.get("documentation_sources", [])) or "-",
        ] for item in registry.get("surfaces", [])],
    )
    plans = table(
        ["ID", "상태", "소스 루트", "기존 문서", "인벤토리", "후속 작업", "목표"],
        [[
            item["id"], item["status"], ", ".join(item.get("source_roots", [])),
            ", ".join(item.get("source_documents", [])) or "-", item["inventory_status"],
            ", ".join(item.get("work_items", [])), item.get("due_milestone") or item.get("due_release") or "-",
        ] for item in registry.get("legacy_plans", [])],
    )
    return NOTICE + (
        f"# 시스템 표면과 문서 현행화\n\n## {policy['id']} — {policy['title']}\n\n{policy['rule']}\n\n"
        f"## 화면·API·배치·이벤트 표면\n\n{surfaces}\n\n## 레거시 인벤토리·문서 전환 계획\n\n{plans}\n"
    )


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


def render_assumptions(data: dict[str, dict[str, Any]]) -> str:
    rows = [[
        item["id"], ko_code(item["status"]), item["statement"], ", ".join(item.get("modules", [])) or "-",
        item["due_gate"], ", ".join(item.get("links", [])) or "-", item.get("resolution") or "-",
    ] for item in data["assumptions"].get("assumptions", [])]
    return NOTICE + "# 가정 원장\n\n" + table(
        ["ID", "상태", "가정", "영향 모듈", "확인 게이트", "연결", "확인·해결"], rows,
    ) + "\n"


def render_development_standards(data: dict[str, dict[str, Any]]) -> str:
    sections = []
    for item in data["foundation"].get("standards", []):
        rules = "\n".join(f"- {rule}" for rule in item.get("rules", [])) or "- 없음"
        guarantees = "\n".join(f"- {value}" for value in item.get("guarantees", [])) or "- 없음"
        non_guarantees = "\n".join(f"- {value}" for value in item.get("non_guarantees", [])) or "- 없음"
        sections.append(
            f"## {item['id']} — {item['title']}\n\n- 상태/유형: `{ko_code(item['status'])}` / `{ko_code(item['kind'])}`\n"
            f"- 범위: {item['scope']}\n- 기술 기준선: {item.get('technology_baseline') or '-'}\n"
            f"- 모듈: {', '.join(item.get('modules', [])) or '-'}\n- 요구사항: {', '.join(item.get('requirements', [])) or '-'}\n"
            f"- 검증: {', '.join(item.get('verification', [])) or '-'}\n\n### 규칙\n\n{rules}\n\n"
            f"### 보장\n\n{guarantees}\n\n### 보장하지 않는 것\n\n{non_guarantees}"
        )
    return NOTICE + "# 프로젝트 개발 표준\n\n" + ("\n\n".join(sections) or "등록된 표준이 없습니다.") + "\n"


def render_golden_paths(data: dict[str, dict[str, Any]]) -> str:
    sections = []
    for item in data["foundation"].get("golden_paths", []):
        steps = "\n".join(f"{number}. {step}" for number, step in enumerate(item.get("steps", []), 1))
        sections.append(
            f"## {item['id']} — {item['title']}\n\n- 상태: `{ko_code(item['status'])}`\n- 범위: {item['scope']}\n"
            f"- 적용 표준: {', '.join(item.get('standards', [])) or '-'}\n- 모듈: {', '.join(item.get('modules', [])) or '-'}\n"
            f"- 구현 경로: {', '.join(item.get('implementation_paths', [])) or '-'}\n- 테스트: {', '.join(item.get('tests', [])) or '-'}\n\n{steps}"
        )
    return NOTICE + "# 골든 패스와 참조 구현\n\n" + ("\n\n".join(sections) or "등록된 골든 패스가 없습니다.") + "\n"


def render_standard_exceptions(data: dict[str, dict[str, Any]]) -> str:
    rows = [[
        item["id"], ko_code(item["status"]), item["standard"], item["scope"], item["reason"],
        item["owner"], item["expires_at"], item["approval"], "; ".join(item.get("compensating_controls", [])),
    ] for item in data["foundation"].get("exceptions", [])]
    body = table(["ID", "상태", "표준", "범위", "사유", "담당", "만료", "승인", "보완 통제"], rows) if rows else "등록된 표준 예외가 없습니다."
    return NOTICE + "# 개발 표준 예외 원장\n\n" + body + "\n"


def render_ui_foundation(data: dict[str, dict[str, Any]]) -> str:
    sections = []
    for item in data["ui_system"].get("baselines", []):
        sections.append(
            f"## {item['id']} — {item['title']}\n\n- 상태: `{ko_code(item['status'])}`\n- 범위: {item['scope']}\n"
            f"- 기술 기준선: {item.get('technology_baseline') or '-'}\n- 요구사항: {', '.join(item.get('requirements', [])) or '-'}\n"
            f"- 앱 셸: {item.get('application_shell') or '-'}\n- 내비게이션: {item.get('navigation') or '-'}\n"
            f"- 사유: {item.get('reason') or '-'}\n- 접근성: {'; '.join(item.get('accessibility', [])) or '-'}"
        )
    pattern_rows = [[
        item["id"], item["title"], ko_code(item["status"]), item["baseline"], item["purpose"],
        ", ".join(item.get("components", [])) or "-",
    ] for item in data["ui_system"].get("patterns", [])]
    patterns = table(["ID", "패턴", "상태", "기준선", "목적", "컴포넌트"], pattern_rows) if pattern_rows else "등록된 UI 패턴이 없습니다."
    return NOTICE + "# UI 기준선과 패턴\n\n" + ("\n\n".join(sections) or "등록된 UI 기준선이 없습니다.") + "\n\n## UI 패턴\n\n" + patterns + "\n"


def render_component_registry(data: dict[str, dict[str, Any]]) -> str:
    rows = [[
        item["id"], item["title"], ko_code(item["status"]), item["responsibility"],
        item.get("implementation_path") or "-", ", ".join(item.get("standards", [])) or "-",
        ", ".join(item.get("tests", [])) or "-", ", ".join(item.get("modules", [])) or "-",
    ] for item in data["ui_system"].get("components", [])]
    body = table(["ID", "컴포넌트", "상태", "책임", "구현", "표준", "테스트", "모듈"], rows) if rows else "등록된 UI 공통 컴포넌트가 없습니다."
    return NOTICE + "# UI 공통 컴포넌트 레지스트리\n\n" + body + "\n"


def render_screen_catalog(data: dict[str, dict[str, Any]]) -> str:
    rows = [[
        item["id"], item["title"], item["module"], ko_code(item["status"]), item["baseline"], item["pattern"],
        ", ".join(item.get("components", [])) or "-", item.get("approval") or "-",
    ] for item in data["ui_modules"].get("screens", [])]
    body = table(["ID", "화면", "모듈", "상태", "기준선", "패턴", "컴포넌트", "승인"], rows) if rows else "등록된 모듈 화면이 없습니다. UI가 없는 모듈은 조각을 만들지 않아도 됩니다."
    return NOTICE + "# 모듈별 화면 카탈로그\n\n" + body + "\n"


def render_manual_catalog(data: dict[str, dict[str, Any]]) -> str:
    screens = index(data["ui_modules"].get("screens", []))
    rows = [[
        item["id"], item["title"], item["screen"], screens.get(item["screen"], {}).get("module", "-"),
        ko_code(item["status"]), item["audience"], ", ".join(item.get("evidence", [])) or "-",
    ] for item in data["ui_modules"].get("manuals", [])]
    body = table(["ID", "매뉴얼", "화면", "모듈", "상태", "대상", "증거"], rows) if rows else "등록된 모듈별 사용자 매뉴얼이 없습니다."
    return NOTICE + "# 모듈별 사용자 매뉴얼 카탈로그\n\n" + body + "\n"


def render_screen_specification(data: dict[str, dict[str, Any]], screen: dict[str, Any]) -> str:
    state_rows = [[name, value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)] for name, value in screen.get("states", {}).items()]
    actions = "\n".join(f"- {item}" for item in screen.get("actions", [])) or "- 없음"
    return (
        NOTICE + f"# {screen['id']} — {screen['title']}\n\n- 모듈: {screen['module']}\n- 상태: `{ko_code(screen['status'])}`\n"
        f"- 경로: {screen.get('route') or '-'}\n- 기준선/패턴: {screen['baseline']} / {screen['pattern']}\n"
        f"- 요구사항: {', '.join(screen.get('requirements', []))}\n- 공통 컴포넌트: {', '.join(screen.get('components', [])) or '-'}\n"
        f"- 인수 테스트: {', '.join(screen.get('acceptance_tests', [])) or '-'}\n- 승인: {screen.get('approval') or '-'}\n\n"
        f"## 레이아웃\n\n{screen.get('layout') or '-'}\n\n## 동작\n\n{actions}\n\n## 화면 상태\n\n"
        + (table(["상태", "정의"], state_rows) if state_rows else "정의된 화면 상태가 없습니다.")
        + f"\n\n## 접근성\n\n{'; '.join(screen.get('accessibility', [])) or '-'}\n"
    )


def render_screen_mockup(screen: dict[str, Any]) -> str:
    title = html.escape(screen["title"])
    states = "".join(f"<li><strong>{html.escape(name)}</strong>: {html.escape(str(value))}</li>" for name, value in screen.get("states", {}).items())
    actions = "".join(f"<button type=\"button\" disabled>{html.escape(str(action))}</button>" for action in screen.get("actions", []))
    return (
        "<!doctype html>\n<html lang=\"ko\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
        f"<title>{html.escape(screen['id'])} {title} 목업</title><style>body{{font-family:system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem}}"
        "main{border:1px solid #bbb;border-radius:.5rem;padding:1.5rem}button{margin:.25rem;padding:.5rem 1rem}</style></head><body>"
        f"<p>검토용 목업 · 실제 화면 증거가 아님</p><main><h1>{title}</h1><p>{html.escape(str(screen.get('layout') or '레이아웃 미정'))}</p>"
        f"<section aria-labelledby=\"actions\"><h2 id=\"actions\">동작</h2>{actions or '<p>정의된 동작 없음</p>'}</section>"
        f"<section aria-labelledby=\"states\"><h2 id=\"states\">화면 상태</h2><ul>{states}</ul></section></main></body></html>\n"
    )


def render_manual(data: dict[str, dict[str, Any]], manual: dict[str, Any]) -> str:
    steps = "\n".join(f"{number}. {step}" for number, step in enumerate(manual.get("steps", []), 1)) or "정의된 절차가 없습니다."
    return (
        NOTICE + f"# {manual['id']} — {manual['title']}\n\n- 화면: {manual['screen']}\n- 상태: `{ko_code(manual['status'])}`\n"
        f"- 대상: {manual['audience']}\n- 검증 증거: {', '.join(manual.get('evidence', [])) or '-'}\n\n"
        f"## 선행 조건\n\n" + ("\n".join(f"- {item}" for item in manual.get("prerequisites", [])) or "- 없음")
        + f"\n\n## 절차\n\n{steps}\n\n## 기대 결과\n\n"
        + ("\n".join(f"- {item}" for item in manual.get("expected_results", [])) or "- 없음")
        + "\n\n## 오류 복구\n\n" + ("\n".join(f"- {item}" for item in manual.get("error_recovery", [])) or "- 없음") + "\n"
    )


def render_runbooks(data: dict[str, dict[str, Any]]) -> str:
    sections = []
    for item in data["operations"].get("runbooks", []):
        steps = "\n".join(f"{number}. {step}" for number, step in enumerate(item.get("steps", []), 1))
        sections.append(
            f"## {item['id']} — {item['title']}\n\n- 상태: `{ko_code(item['status'])}`\n- 범위: {item['scope']}\n"
            f"- 모듈: {', '.join(item.get('modules', []))}\n- 요구사항: {', '.join(item.get('requirements', []))}\n"
            f"- 트리거: {'; '.join(item.get('triggers', []))}\n\n### 절차\n\n{steps}\n\n"
            f"### 검증\n\n" + "\n".join(f"- {value}" for value in item.get("verification", []))
            + f"\n\n### 롤백\n\n{item['rollback']}\n\n### 에스컬레이션\n\n{item['escalation']}"
        )
    return NOTICE + "# 운영 런북\n\n" + ("\n\n".join(sections) or "등록된 런북이 없습니다.") + "\n"


def render_delivery_manifest(data: dict[str, dict[str, Any]]) -> str:
    rows = []
    for item in data["delivery_profiles"].get("delivery_profiles", []):
        rules = item.get("release_rules", {})
        rows.append([
            item["id"], item["title"], ko_code(item["status"]), item["audience"],
            ", ".join(item.get("includes", [])), ", ".join(item.get("excludes", [])),
            "허용" if rules.get("allow_mockups") else "금지",
            "필수" if rules.get("require_verified_capture") else "선택",
        ])
    return NOTICE + "# 제출 패키지 manifest\n\n" + table(
        ["ID", "패키지", "상태", "대상", "포함", "제외", "목업", "검증 캡처"], rows,
    ) + "\n\n이 문서는 패키지 조립 정책을 보여주는 결정적 manifest이며 실제 출시 승인이나 ZIP 산출물이 아닙니다.\n"


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
            f"- 전달 프로필: {release.get('delivery_profile') or '-'}\n"
            f"- 출시 화면: {', '.join(release.get('screens', [])) or '-'}\n"
            f"- 출시 매뉴얼: {', '.join(release.get('manuals', [])) or '-'}\n"
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
    review_sections = []
    for run in data["gate_runs"].get("gate_runs", []):
        review = run.get("review")
        if not review:
            continue
        decisions = "\n".join(f"- {item['decision']} (되돌리기 비용: {ko_code(item['reversal_cost'])})" for item in review["decision_card"])
        questions = "\n".join(f"- {item['question']} (`{ko_code(item['status'])}`)" for item in review["reverse_questions"])
        findings = "\n".join(f"- {item}" for item in review["redteam_findings"])
        review_sections.append(f"### {run['id']} 검토\n\n#### 레드팀\n\n{findings}\n\n#### 결정 카드\n\n{decisions}\n\n#### 역질문\n\n{questions}")
    return (
        NOTICE + "# 게이트 실행과 검증 증거\n\n"
        "## 게이트 실행\n\n" + table(["ID", "게이트", "변경", "상태", "모듈", "통과 기준", "승인", "평가 시각"], gate_rows) +
        "\n\n## 검증 증거\n\n" + table(["ID", "제목", "유형", "상태", "테스트", "변경", "생성자", "실행 시각", "커밋", "결과"], evidence_rows) +
        "\n\n## 승인\n\n" + approvals + "\n\n## 게이트 검토\n\n" + ("\n\n".join(review_sections) or "기록된 게이트 검토가 아직 없습니다.") + "\n"
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
        ["ID", "작업", "상태", "책임 참여자", "모듈", "변경", "요구사항", "포괄 범위", "선행 작업", "증거", "검증 부담"],
        [[item["id"], item["title"], ko_code(item["status"]), item.get("assignee", "-"), item["module"], item["change"], ", ".join(item.get("requirements", [])) or "-", ", ".join(item.get("coverage", [])) or "-", ", ".join(item.get("depends_on", [])) or "-", ", ".join(item.get("evidence", [])) or "-", ", ".join(f"{key}={value}" for key, value in item.get("verification_load", {}).items()) or "-"] for item in plan["work_items"]],
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
    assignment_policy = work_assignment_policy(data)
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
    assignment_policy_rows = [
        [
            item["id"], item.get("from_mode") or "최초", item["to_mode"],
            ", ".join(item.get("delegates", [])) or "-", item["changed_by"], item["changed_at"], item["reason"],
        ]
        for item in collaboration.get("assignment_policy_events", [])
    ]
    work_assignment_rows = [
        [
            item["id"], item["work"], item.get("from_assignee") or "-", item["to_assignee"],
            item["assigned_by"], item["assigned_at"], item["reason"],
        ]
        for item in collaboration.get("work_assignment_events", [])
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
    ]
    assignment_modes = {
        "pm_controlled": "PM 배정",
        "delegated": "PM 위임 배정",
        "self_assignment": "자율 배정(오프라인 협의)",
    }
    delegate_text = ", ".join(assignment_policy["delegates"]) or "-"
    return NOTICE + (
        f"# 협업 운영 프로필\n\n## {policy['id']} — {policy['title']}\n\n{policy['rule']}\n\n"
        f"- 현재 프로필: `{current['id']} {current['name']}`\n"
        f"- 활성 사람 참여자: {sum(1 for item in collaboration['participants'] if item['status'] == 'active')}명\n"
        f"- 사람 검토: {current['human_review']}\n- 독립 검증: {current['independent_assurance']}\n\n"
        f"## 현재 저장소 통제\n\n{table(['통제', '값'], control_rows)}\n\n"
        f"## 작업 패키지 배정\n\n"
        f"- 현재 방식: {assignment_policy['mode']} — {assignment_modes.get(assignment_policy['mode'], '정의되지 않음')}\n"
        f"- 위임자: {delegate_text}\n"
        f"- 오프라인 협의: {'필수' if assignment_policy['offline_coordination_required'] else '해당 없음'}\n"
        f"- 마지막 변경: {assignment_policy['changed_at']} / {assignment_policy['changed_by']}\n"
        f"- 변경 사유: {assignment_policy['reason']}\n\n"
        "배정 단위는 여러 REQ와 CHG별 필수 작업 영역을 묶는 작업 패키지(WRK)다. 기본 영역은 설계·구현·시험·문서이며 프로젝트 맥락에 따라 보안·데이터·마이그레이션·배포·운영·교육을 추가한다. 개발 슬라이스는 WRK 내부 실행 단위로 관리한다. "
        "기존 요건에서 파생된 요구는 먼저 CHG·REQ로 영향과 수용 범위를 기록한 뒤, 기존 WRK의 범위 확장 또는 새 WRK로 결정한다. "
        "자율 배정은 팀원의 오프라인 협의를 전제로 하며 점유·잠금·자동 pull 검사는 사용하지 않는다.\n\n"
        f"### 배정 정책 변경 이력\n\n{table(['ID', '이전 방식', '새 방식', '위임자', '변경자', '변경 시각', '사유'], assignment_policy_rows)}\n\n"
        f"### 작업 패키지 배정 이력\n\n{table(['ID', 'WRK', '이전 책임자', '새 책임자', '배정자', '배정 시각', '사유'], work_assignment_rows)}\n\n"
        f"## 프로필\n\n{table(['ID', '프로필', '활성 인원', '사람 검토', '독립 검증'], profile_rows)}\n\n"
        f"## 참여자\n\n{table(['ID', '이름', '역할', '상태', '참여일', '이탈일'], participant_rows)}\n\n"
        f"## {identity_policy['id']} — {identity_policy['title']}\n\n"
        f"- 자동 참여자 등록: {'예' if identity_policy['automatic_membership'] else '아니요'}\n"
        f"- Git 검사 범위: {identity_policy['git_scope']}\n"
        f"- 미등록 신원 처리: {identity_policy['unknown_identity_action']}\n"
        f"- 원격 행위자 처리: {identity_policy['hosting_actor_action']}\n\n"
        f"### 등록된 신원\n\n{table(['ID', '유형', '참여자', 'Git 이름·이메일', '호스팅 계정', '근거'], identity_rows)}\n\n"
        f"### 현재 미등록 Git 신원\n\n"
        + (table(['이름', '이메일', '관찰 위치', '상태'], unknown_rows) if include_runtime_identity else "실시간 결과는 `python .ai/tools/aidd.py identity-check`로 확인한다.") + "\n\n"
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
    assumptions = data["assumptions"].get("assumptions", [])
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
    merges = data["merges"].get("merges", [])
    pending_merge_assessments = [item for item in merges if item.get("status") == "needs_assessment"]
    pending_rechecks = [
        (merge, recheck) for merge in merges for recheck in merge.get("rechecks", [])
        if recheck.get("status") == "pending"
    ]
    deferred_without_due = [item for item in open_items if item.get("status") == "open" and not item.get("due")]
    deferred_assumptions = [item for item in assumptions if item.get("status") == "open"]
    if level == "module":
        selected = next((m for m in modules if m["id"] == module_id), None)
        if not selected:
            raise ValueError(f"알 수 없는 모듈: {module_id}")
        req_index = index(reqs)
        rows = [[rid, req_index[rid]["title"], ko_code(req_index[rid]["status"]), ", ".join(req_index[rid]["verification"])] for rid in selected["requirements"]]
        module_work = [item for item in work_items if item.get("module") == selected["id"]]
        relevant_nodes = {selected["id"]} | {item["id"] for item in module_work}
        work_rows = [[item["id"], item["title"], ko_code(item["status"]), item.get("assignee", "-"), item["change"], ", ".join(item.get("requirements", [])) or "-", ", ".join(item.get("coverage", [])) or "-", ", ".join(item.get("depends_on", [])) or "-", ", ".join(item.get("evidence", [])) or "-"] for item in module_work]
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
        module_screens = [item for item in data["ui_modules"].get("screens", []) if item.get("module") == selected["id"]]
        module_manuals = [
            item for item in data["ui_modules"].get("manuals", [])
            if any(screen.get("id") == item.get("screen") for screen in module_screens)
        ]
        return (
            f"# {selected['id']} — {selected['name']}\n\n- 상태: `{ko_code(selected['status'])}`\n- 목적: {selected['purpose']}\n"
            f"- 의존 모듈: {', '.join(selected['dependencies']) or '없음'}\n- 작업 상태: "
            + (", ".join(f"{ko_code(key)} {value}개" for key, value in sorted(Counter(item['status'] for item in module_work).items())) or "등록된 작업 없음")
            + "\n\n## 요구사항\n\n" + table(["요구사항", "제목", "상태", "검증"], rows)
            + "\n\n## 작업 항목\n\n" + table(["작업", "제목", "상태", "책임 참여자", "변경", "요구사항", "포괄 범위", "선행 작업", "증거"], work_rows)
            + "\n\n## 인터페이스\n\n" + table(["ID", "이름", "상태", "제공", "소비", "호환성"], interface_rows)
            + "\n\n## 모듈 의존성\n\n" + table(["ID", "출발", "도착", "상태", "설명"], dependency_rows)
            + f"\n\n## UI 정본\n\n- 화면: {len(module_screens)}개\n- 매뉴얼: {len(module_manuals)}개\n"
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
        f"- 개발 기반: 표준 {len(data['foundation'].get('standards', []))}개; 골든 패스 {len(data['foundation'].get('golden_paths', []))}개; 예외 {len(data['foundation'].get('exceptions', []))}개\n"
        f"- UI 정본: 기준선 {len(data['ui_system'].get('baselines', []))}개; 패턴 {len(data['ui_system'].get('patterns', []))}개; 컴포넌트 {len(data['ui_system'].get('components', []))}개; 화면 {len(data['ui_modules'].get('screens', []))}개\n"
        f"- 운영·제출: 런북 {len(data['operations'].get('runbooks', []))}개; 제출 프로필 {len(data['delivery_profiles'].get('delivery_profiles', []))}개\n"
        f"- 게이트 실행: {len(gate_runs)}개; 승인됨: {sum(1 for item in gate_runs if item['status'] == 'approved')}개; 검토 중: {sum(1 for item in gate_runs if item['status'] == 'in_review')}개\n"
        f"- 구조화된 증거: {len(evidence)}개; 통과: {sum(1 for item in evidence if item['status'] == 'passed')}개\n"
        f"- 협업 프로필: {active_profile['id']} {active_profile['name']}; 활성 사람 참여자: {active_humans}명; 미등록 Git 신원: {identity_summary}\n"
        f"- 마일스톤: {len(milestones)}개; 작업 항목: {len(work_items)}개; 완료: {sum(1 for item in work_items if item['status'] == 'completed')}개\n"
        f"- AI 행동 평가: {len(evaluation_rows)}개 플랫폼 실행 슬롯; 미실행: {sum(1 for row in evaluation_rows if row[3] == ko_code('not_run'))}개\n"
        f"- 미결 사항: {len(next_decisions)}개; 차단 중: {sum(1 for i in next_decisions if i['blocking'])}개\n"
        f"- 미룬 결정: 미결 {len(next_decisions)}개(기한 미정 {len(deferred_without_due)}개); 미확인 가정 {len(deferred_assumptions)}개; 병합 재검토 {len(pending_rechecks)}건\n"
        f"- 미결 위험: {sum(1 for r in risks if r['status'] == 'open')}개\n"
        f"- 병합 알림: 평가 대기 {len(pending_merge_assessments)}건, 재검토 대기 {len(pending_rechecks)}건\n\n## 출시 준비 상태\n\n" + "\n".join(release_lines)
    )
    if level == "executive":
        decisions = "\n".join(f"- {i['id']} ({i['owner']}): {i['question']}" for i in next_decisions) or "- 없음"
        deferred_lines = [
            f"- {item['id']} (미결·{'차단' if item['blocking'] else '비차단'}·기한 {item.get('due') or '미정'}): {item['title']}"
            for item in next_decisions
        ]
        deferred_lines.extend(
            f"- {item['id']} (가정·확인 게이트 {item['due_gate']}): {item['statement']}"
            for item in deferred_assumptions
        )
        deferred_lines.extend(
            f"- {merge['id']}/{recheck['id']} (병합 {ko_code(recheck['type'])}): {recheck['title']}"
            for merge, recheck in pending_rechecks
        )
        deferred_text = "\n".join(deferred_lines) or "- 없음"
        merge_alerts = []
        if pending_merge_assessments:
            merge_alerts.append("- 영향 평가 필요: " + ", ".join(item["id"] for item in pending_merge_assessments))
        if pending_rechecks:
            merge_alerts.append("- 재검토·재테스트 필요: " + ", ".join(f"{merge['id']}/{recheck['id']}" for merge, recheck in pending_rechecks))
        merge_text = "\n".join(merge_alerts) or "- 없음"
        return text + f"\n\n## 병합 알림\n\n{merge_text}\n\n## 미룬 결정과 재검토\n\n{deferred_text}\n\n## 필요한 의사결정 및 확인\n\n{decisions}\n"
    detail_rows = [[c["id"], ko_code(c["type"]), ko_code(c["class"]), ko_code(c["status"]), ", ".join(c["modules"]), c["title"]] for c in changes]
    item_rows = [[i["id"], ko_code(i["status"]), "예" if i["blocking"] else "아니요", i["owner"], i["title"]] for i in open_items]
    risk_rows = [[r["id"], ko_code(r["likelihood"]), ko_code(r["impact"]), ko_code(r["status"]), r["owner"], r["title"]] for r in risks]
    recheck_rows = [
        [merge["id"], recheck["id"], ko_code(recheck["type"]), ko_code(recheck["status"]), "예" if recheck["blocking"] else "아니요", recheck["title"], recheck.get("reviewed_by") or "-"]
        for merge in merges for recheck in merge.get("rechecks", [])
    ]
    return text + "\n\n## 변경 사항\n\n" + table(["ID", "유형", "등급", "상태", "모듈", "제목"], detail_rows) + "\n\n## 병합 후 재검토\n\n" + table(["병합", "ID", "유형", "상태", "릴리스 차단", "제목", "수행자"], recheck_rows) + "\n\n## 미결 사항\n\n" + table(["ID", "상태", "차단 여부", "담당", "제목"], item_rows) + "\n\n## 위험\n\n" + table(["ID", "가능성", "영향", "상태", "담당", "제목"], risk_rows) + "\n"


def render_module_specification(data: dict[str, dict[str, Any]], module_id: str) -> str:
    """Render a focused, self-contained view without duplicating canonical facts."""
    requirements = [
        item for item in data["requirements"].get("requirements", [])
        if module_id in item.get("modules", [])
    ]
    requirement_ids = {item["id"] for item in requirements}
    changes = [item for item in data["changes"].get("changes", []) if module_id in item.get("modules", [])]
    decisions = [
        item for item in data["decisions"].get("decisions", [])
        if requirement_ids.intersection(item.get("requirements", []))
    ]
    tests = [
        item for item in data["tests"].get("test_cases", [])
        if requirement_ids.intersection(item.get("requirements", []))
    ]
    assumptions = [item for item in data["assumptions"].get("assumptions", []) if module_id in item.get("modules", [])]
    work_items = [item for item in data["delivery_plan"].get("work_items", []) if item.get("module") == module_id]
    verification_rows = [[
        item["id"], *[str(item.get("verification_load", {}).get(key, 0)) for key in (
            "fix_rounds", "unverified_rules", "quality_fails", "spec_defects", "redteam_fixes",
        )]
    ] for item in work_items if item.get("verification_load")]
    requirement_sections = []
    for item in requirements:
        criteria = "\n".join(f"- {criterion}" for criterion in item.get("acceptance_criteria", [])) or "- 없음"
        requirement_sections.append(
            f"### {item['id']} — {item['title']}\n\n{item['statement']}\n\n"
            f"- 우선순위/상태: `{ko_code(item['priority'])}` / `{ko_code(item['status'])}`\n"
            f"- 담당: {item['owner']}\n- 연결 모듈: {', '.join(item['modules'])}\n"
            f"- 검증: {', '.join(item['verification'])}\n- 출처: {item['source']}\n\n"
            f"인수 기준:\n\n{criteria}"
        )
    change_rows = [[item["id"], ko_code(item["class"]), ko_code(item["status"]), item["title"]] for item in changes]
    decision_rows = [[item["id"], ko_code(item["status"]), item["title"]] for item in decisions]
    test_rows = [[item["id"], ko_code(item["status"]), item["title"]] for item in tests]
    assumption_rows = [[item["id"], ko_code(item["status"]), item["statement"], item["due_gate"]] for item in assumptions]
    return (
        NOTICE + status_text(data, "module", module_id, include_runtime_identity=False)
        + "\n\n## 요구사항 상세\n\n"
        + ("\n\n".join(requirement_sections) or "등록된 요구사항 없음")
        + "\n\n## 관련 변경\n\n" + table(["ID", "등급", "상태", "제목"], change_rows)
        + "\n\n## 관련 결정\n\n" + table(["ID", "상태", "제목"], decision_rows)
        + "\n\n## 관련 테스트\n\n" + table(["ID", "상태", "제목"], test_rows) + "\n"
        + "\n## 가정\n\n" + table(["ID", "상태", "가정", "확인 게이트"], assumption_rows)
        + "\n\n## 작업별 검증 부담\n\n" + table(
            ["작업", "수정 라운드", "미검증 규칙", "품질 실패", "명세 결함", "레드팀 수정"], verification_rows,
        ) + "\n"
    )


def render_documents(data: dict[str, dict[str, Any]]) -> dict[str, str]:
    documents = {
        "project-brief.md": render_project(data),
        "workboard.md": render_workboard(data),
        "site/index.html": render_project_home(data),
        "requirements.md": render_requirements(data),
        "architecture.md": render_architecture(data),
        "traceability.md": render_traceability(data),
        "decisions.md": render_decisions(data),
        "open-items.md": render_open_items(data),
        "assumptions.md": render_assumptions(data),
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
        "foundation/development-standards.md": render_development_standards(data),
        "foundation/golden-paths.md": render_golden_paths(data),
        "foundation/exceptions.md": render_standard_exceptions(data),
        "ui/baseline-and-patterns.md": render_ui_foundation(data),
        "ui/component-registry.md": render_component_registry(data),
        "ui/index.md": render_screen_catalog(data),
        "manuals/index.md": render_manual_catalog(data),
        "operations/runbooks.md": render_runbooks(data),
        "deliverables/manifest.md": render_delivery_manifest(data),
        "status.md": NOTICE + status_text(data, "detail", include_runtime_identity=False),
    }
    for module in data["modules"].get("modules", []):
        documents[f"modules/{module['id']}.md"] = render_module_specification(data, module["id"])
    for screen in data["ui_modules"].get("screens", []):
        prefix = f"ui/modules/{screen['module']}/{screen['id']}"
        documents[f"{prefix}/requirements.md"] = render_screen_specification(data, screen)
        documents[f"{prefix}/mockup.html"] = render_screen_mockup(screen)
    screen_index = index(data["ui_modules"].get("screens", []))
    for manual in data["ui_modules"].get("manuals", []):
        screen = screen_index.get(manual.get("screen"), {})
        module_id = screen.get("module", "unknown")
        documents[f"manuals/modules/{module_id}/{manual['id']}.md"] = render_manual(data, manual)
    documents["foundation/documentation-standard.md"] = render_documentation_standard(data)
    documents["system-surface-coverage.md"] = render_system_surface_coverage(data)
    for path, content in list(documents.items()):
        if path.endswith(".md"):
            documents[path] = content.rstrip() + document_template_appendix(data, path) + "\n"
    documents.update(render_document_sites(data, documents))
    return documents


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
    if is_bootstrap_project(data):
        bootstrap_errors, bootstrap_warnings = validate_bootstrap_project(data)
        return errors + bootstrap_errors, warnings + bootstrap_warnings
    project = data["project"]
    for field in ("introduction", "overview", "intent"):
        if not isinstance(project.get(field), str) or not project[field].strip():
            errors.append(f"project.json has no {field}")
    if not isinstance(project.get("key_features"), list) or not project["key_features"]:
        errors.append("project.json has no key_features")
    documentation = data["documentation"]
    policy = documentation.get("policy", {})
    if policy.get("status") not in {"draft", "pilot", "agreed"}:
        errors.append("documentation.json has an invalid policy status")
    for field in ("id", "owner", "agreement_gate", "principles"):
        if not policy.get(field):
            errors.append(f"documentation policy has no {field}")
    templates = documentation.get("templates")
    if not isinstance(templates, list) or not templates:
        errors.append("documentation.json has no document templates")
    else:
        template_ids = [item.get("id") for item in templates]
        if len(template_ids) != len(set(template_ids)):
            errors.append("documentation.json has duplicate template IDs")
        for template in templates:
            for field in ("id", "name", "seed", "target_patterns", "audience", "status", "required_sections"):
                if not template.get(field):
                    errors.append(f"{template.get('id', 'documentation template')} has no {field}")
            if template.get("status") not in {"draft", "pilot", "agreed"}:
                errors.append(f"{template.get('id', 'documentation template')} has an invalid status")
            if template.get("seed") and not (ROOT / template["seed"]).is_file():
                errors.append(f"{template.get('id', 'documentation template')} references a missing seed template")
            section_ids = [section.get("id") for section in template.get("required_sections", [])]
            if len(section_ids) != len(set(section_ids)) or not all(
                section.get("id") and section.get("title") for section in template.get("required_sections", [])
            ):
                errors.append(f"{template.get('id', 'documentation template')} has invalid required sections")
    workboard = data["workboard"]
    if not workboard.get("id") or not workboard.get("title") or not workboard.get("updated_at"):
        errors.append("workboard.json has incomplete board metadata")
    for collection, fields in (
        ("current_focus", ("id", "title", "why_now", "completion_condition")),
        ("next_actions", ("id", "title", "completion_condition")),
        ("watch_items", ("id", "title", "reason")),
    ):
        items = workboard.get(collection)
        if not isinstance(items, list) or any(not all(item.get(field) for field in fields) for item in items):
            errors.append(f"workboard.json has invalid {collection}")
    requirements = index(data["requirements"].get("requirements", []))
    modules = index(data["modules"].get("modules", []))
    fragments = data["requirements"].get("_module_fragments", [])
    if fragments:
        fragment_modules: set[str] = set()
        for path, fragment in fragments:
            module_id = fragment.get("module")
            label = path.relative_to(SSOT).as_posix() if path.is_relative_to(SSOT) else str(path)
            if not isinstance(module_id, str) or module_id not in modules:
                errors.append(f"{label} has an unknown module")
                continue
            if path.stem != module_id:
                errors.append(f"{label} filename does not match module {module_id}")
            if module_id in fragment_modules:
                errors.append(f"duplicate module specification fragment for {module_id}")
            fragment_modules.add(module_id)
            entries = fragment.get("requirements")
            if not isinstance(entries, list):
                errors.append(f"{label} requirements must be a list")
                continue
            for requirement in entries:
                if module_id not in requirement.get("modules", []):
                    errors.append(f"{requirement.get('id', label)} is stored in {module_id} but does not link to it")
        if data["requirements"].get("storage") == "module-sharded":
            if data["requirements"].get("_root_requirements"):
                errors.append("requirements.json has records while module-sharded storage is enabled")
            missing_fragments = set(modules) - fragment_modules
            if missing_fragments:
                errors.append("missing module specification fragments: " + ", ".join(sorted(missing_fragments)))
    ui_fragment_modules: set[str] = set()
    for path, fragment in data.get("ui_modules", {}).get("fragments", []):
        module_id = fragment.get("module")
        label = path.relative_to(SSOT).as_posix() if path.is_relative_to(SSOT) else str(path)
        if module_id not in modules:
            errors.append(f"{label} has an unknown module")
            continue
        if path.stem != module_id:
            errors.append(f"{label} filename does not match module {module_id}")
        if module_id in ui_fragment_modules:
            errors.append(f"duplicate UI specification fragment for {module_id}")
        ui_fragment_modules.add(module_id)
        for collection in ("screens", "manuals"):
            if not isinstance(fragment.get(collection), list):
                errors.append(f"{label} {collection} must be a list")
        for screen in fragment.get("screens", []):
            if screen.get("module") != module_id:
                errors.append(f"{screen.get('id', label)} is stored in {module_id} but links to {screen.get('module')}")
        local_screen_ids = {screen.get("id") for screen in fragment.get("screens", [])}
        for manual in fragment.get("manuals", []):
            if manual.get("screen") not in local_screen_ids:
                errors.append(
                    f"{manual.get('id', label)} is stored in {module_id} but references a screen outside its UI fragment"
                )
    surface_registry = data["system_surfaces"]
    surface_policy = surface_registry.get("policy", {})
    for field in ("id", "title", "rule", "source_exclusions"):
        if not surface_policy.get(field):
            errors.append(f"system-surface policy has no {field}")
    surface_fragment_modules: set[str] = set()
    for path, fragment in surface_registry.get("_module_fragments", []):
        module_id = fragment.get("module")
        label = path.relative_to(SSOT).as_posix() if path.is_relative_to(SSOT) else str(path)
        if module_id not in modules:
            errors.append(f"{label} has an unknown module")
            continue
        if path.stem != module_id:
            errors.append(f"{label} filename does not match module {module_id}")
        if module_id in surface_fragment_modules:
            errors.append(f"duplicate system-surface fragment for {module_id}")
        surface_fragment_modules.add(module_id)
        if not isinstance(fragment.get("surfaces"), list):
            errors.append(f"{label} surfaces must be a list")
        for surface in fragment.get("surfaces", []):
            if surface.get("module") != module_id:
                errors.append(f"{surface.get('id', label)} is stored in {module_id} but links to {surface.get('module')}")
    if surface_registry.get("storage") == "module-sharded":
        if surface_registry.get("_root_surfaces"):
            errors.append("system-surfaces.json has records while module-sharded storage is enabled")
        missing_surface_fragments = set(modules) - surface_fragment_modules
        if missing_surface_fragments:
            errors.append("missing system-surface fragments: " + ", ".join(sorted(missing_surface_fragments)))
    tests = index(data["tests"].get("test_cases", []))
    decisions = index(data["decisions"].get("decisions", []))
    changes = index(data["changes"].get("changes", []))
    evidence = index(data["evidence"].get("evidence", []))
    approvals = index(data["approvals"].get("approvals", []))
    assumptions = index(data["assumptions"].get("assumptions", []))
    gate_runs = index(data["gate_runs"].get("gate_runs", []))
    deliverables = index(data["deliverables"].get("deliverables", []))
    work_items = index(data["delivery_plan"].get("work_items", []))
    standards = index(data["foundation"].get("standards", []))
    golden_paths = index(data["foundation"].get("golden_paths", []))
    standard_exceptions = index(data["foundation"].get("exceptions", []))
    ui_baselines = index(data["ui_system"].get("baselines", []))
    ui_patterns = index(data["ui_system"].get("patterns", []))
    ui_components = index(data["ui_system"].get("components", []))
    screens = index(data["ui_modules"].get("screens", []))
    manuals = index(data["ui_modules"].get("manuals", []))
    runbooks = index(data["operations"].get("runbooks", []))
    delivery_profiles = index(data["delivery_profiles"].get("delivery_profiles", []))
    surfaces = index(surface_registry.get("surfaces", []))
    for surface in surfaces.values():
        for field in ("module", "type", "key", "title", "source_patterns", "documentation_status"):
            if not surface.get(field):
                errors.append(f"{surface['id']} has no {field}")
        if surface.get("module") not in modules:
            errors.append(f"{surface['id']} references unknown module {surface.get('module')}")
        if surface.get("type") not in SURFACE_TYPES:
            errors.append(f"{surface['id']} has an invalid surface type")
        if surface.get("documentation_status") not in SURFACE_DOCUMENTATION_STATES:
            errors.append(f"{surface['id']} has an invalid documentation status")
        patterns = surface.get("source_patterns", [])
        if not isinstance(patterns, list) or not patterns or any(
            not isinstance(pattern, str) or not pattern.startswith("project/src/") for pattern in patterns
        ):
            errors.append(f"{surface['id']} source patterns must be non-empty project/src/ patterns")
        document_sources = surface.get("documentation_sources", [])
        if surface.get("documentation_status") in {"current", "stale"} and not document_sources:
            errors.append(f"{surface['id']} is documented but has no documentation sources")
        for source in document_sources:
            if not isinstance(source, str) or not source.startswith("project/.aidd/ssot/"):
                errors.append(f"{surface['id']} documentation source is not canonical: {source}")
    legacy_plan_ids: set[str] = set()
    for plan in surface_registry.get("legacy_plans", []):
        plan_id = plan.get("id", "legacy plan")
        legacy_plan_ids.add(plan_id)
        if plan.get("status") not in {"planned", "in_progress", "completed"}:
            errors.append(f"{plan_id} has an invalid status")
        if plan.get("inventory_status") not in {"planned", "in_progress", "completed"}:
            errors.append(f"{plan_id} has an invalid inventory status")
        source_roots = plan.get("source_roots", [])
        if not source_roots or any(not str(path).startswith("project/src/") for path in source_roots):
            errors.append(f"{plan_id} must identify project/src/ source roots")
        if not plan.get("work_items"):
            errors.append(f"{plan_id} has no documentation work items")
        if not plan.get("due_milestone") and not plan.get("due_release"):
            errors.append(f"{plan_id} has no due milestone or release")
    all_items: list[dict[str, Any]] = []
    for key in ("requirements", "modules", "decisions", "open_items", "assumptions", "risks", "changes", "tests", "releases", "merges", "deliverables", "evidence", "approvals", "gate_runs"):
        collection_name = {"requirements": "requirements", "modules": "modules", "decisions": "decisions", "open_items": "open_items", "assumptions": "assumptions", "risks": "risks", "changes": "changes", "tests": "test_cases", "releases": "releases", "merges": "merges", "deliverables": "deliverables", "evidence": "evidence", "approvals": "approvals", "gate_runs": "gate_runs"}[key]
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
        + data["collaboration"].get("assignment_policy_events", [])
        + data["collaboration"].get("work_assignment_events", [])
    )
    collaboration_ids = [item.get("id") for item in collaboration_items]
    if len(collaboration_ids) != len(set(collaboration_ids)):
        errors.append("duplicate IDs in collaboration.json")
    all_items.extend(collaboration_items)
    foundation_items = list(standards.values()) + list(golden_paths.values()) + list(standard_exceptions.values())
    ui_items = list(ui_baselines.values()) + list(ui_patterns.values()) + list(ui_components.values()) + list(screens.values()) + list(manuals.values())
    operations_items = list(runbooks.values())
    delivery_profile_items = list(delivery_profiles.values())
    surface_items = list(surfaces.values()) + surface_registry.get("legacy_plans", []) + [surface_policy]
    for label, items in (
        ("foundation.json", foundation_items),
        ("ui-system.json and ui-modules/*.json", ui_items),
        ("operations.json", operations_items),
        ("delivery-profiles.json", delivery_profile_items),
        ("system-surfaces.json and system-surfaces/*.json", surface_items),
    ):
        ids = [item.get("id") for item in items]
        if len(ids) != len(set(ids)):
            errors.append(f"duplicate IDs in {label}")
        all_items.extend(items)
    for merge in data["merges"].get("merges", []):
        rechecks = merge.get("rechecks", [])
        if isinstance(rechecks, list):
            all_items.extend(rechecks)
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
    technology_baselines = index(data["technology"].get("baselines", []))
    reusable_statuses = {"draft", "reviewed", "approved", "implemented", "verified", "released", "current", "template", "not_applicable", "deprecated"}
    supersedable = {**standards, **golden_paths, **ui_baselines, **ui_patterns, **ui_components, **runbooks, **delivery_profiles}
    for item in supersedable.values():
        if item.get("status") not in reusable_statuses:
            errors.append(f"{item['id']} has an invalid reusable-artifact status")
        for req_id in item.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{item['id']} references unknown requirement {req_id}")
        for module_id in item.get("modules", []):
            if module_id not in modules:
                errors.append(f"{item['id']} references unknown module {module_id}")
        target = item.get("supersedes")
        if target and target not in supersedable:
            errors.append(f"{item['id']} supersedes unknown reusable artifact {target}")
        replacement = item.get("replaced_by")
        if replacement and replacement not in supersedable:
            errors.append(f"{item['id']} references unknown replacement {replacement}")
    for item in supersedable.values():
        visited: set[str] = set()
        current = item
        while current.get("supersedes"):
            target = current["supersedes"]
            if target in visited or target == item["id"]:
                errors.append(f"{item['id']} has a reusable-artifact supersession cycle")
                break
            visited.add(target)
            current = supersedable.get(target, {})
    for standard in standards.values():
        if standard.get("kind") not in {"contract", "policy"}:
            errors.append(f"{standard['id']} must be contract or policy")
        if not standard.get("rules") or not standard.get("owner") or not standard.get("scope"):
            errors.append(f"{standard['id']} has incomplete standard details")
        baseline_id = standard.get("technology_baseline")
        if baseline_id and baseline_id not in technology_baselines:
            errors.append(f"{standard['id']} references unknown technology baseline {baseline_id}")
        for test_id in standard.get("verification", []):
            if test_id not in tests:
                errors.append(f"{standard['id']} references unknown test {test_id}")
        for evidence_id in standard.get("evidence", []):
            if evidence_id not in evidence:
                errors.append(f"{standard['id']} references unknown evidence {evidence_id}")
    for path in golden_paths.values():
        if not path.get("steps") or not path.get("implementation_paths") or not path.get("owner"):
            errors.append(f"{path['id']} has incomplete golden-path details")
        for standard_id in path.get("standards", []):
            if standard_id not in standards:
                errors.append(f"{path['id']} references unknown standard {standard_id}")
        for test_id in path.get("tests", []):
            if test_id not in tests:
                errors.append(f"{path['id']} references unknown test {test_id}")
        for implementation_path in path.get("implementation_paths", []):
            if not repository_path(implementation_path).exists():
                errors.append(f"{path['id']} references missing implementation path {implementation_path}")
    for exception in standard_exceptions.values():
        if exception.get("status") not in {"draft", "approved", "waived", "expired", "deprecated"}:
            errors.append(f"{exception['id']} has an invalid exception status")
        if exception.get("standard") not in standards:
            errors.append(f"{exception['id']} references unknown standard {exception.get('standard')}")
        if exception.get("status") in {"approved", "waived"} and not approval_matches(
            approvals, exception.get("approval"), exception["id"]
        ):
            errors.append(f"{exception['id']} references an approval that is missing, rejected, or for another subject")
        elif exception.get("approval") and not approval_matches(approvals, exception.get("approval"), exception["id"]):
            errors.append(f"{exception['id']} references an approval that is rejected or for another subject")
        for field in ("scope", "reason", "owner", "expires_at", "compensating_controls"):
            if not exception.get(field):
                errors.append(f"{exception['id']} has no {field}")
        try:
            expires_at = datetime.fromisoformat(exception.get("expires_at", "").replace("Z", "+00:00"))
            if expires_at.tzinfo is None:
                raise ValueError
            if exception.get("status") not in {"expired", "deprecated"} and expires_at <= datetime.now(expires_at.tzinfo):
                errors.append(f"{exception['id']} has expired but is still active")
        except ValueError:
            errors.append(f"{exception['id']} has an invalid expiry")
    for baseline in ui_baselines.values():
        technology_id = baseline.get("technology_baseline")
        if technology_id and technology_id not in technology_baselines:
            errors.append(f"{baseline['id']} references unknown technology baseline {technology_id}")
        if baseline.get("status") == "not_applicable" and not baseline.get("reason"):
            errors.append(f"{baseline['id']} is not applicable without a reason")
        if baseline.get("status") in {"approved", "current", "implemented", "verified", "released"} and not approval_matches(
            approvals, baseline.get("approval"), baseline["id"]
        ):
            errors.append(f"{baseline['id']} is approved or later without a valid approval")
    for pattern in ui_patterns.values():
        if pattern.get("baseline") not in ui_baselines:
            errors.append(f"{pattern['id']} references unknown UI baseline {pattern.get('baseline')}")
        if not pattern.get("purpose") or not pattern.get("states") or not pattern.get("accessibility"):
            errors.append(f"{pattern['id']} has incomplete UI-pattern details")
        for component_id in pattern.get("components", []):
            if component_id not in ui_components:
                errors.append(f"{pattern['id']} references unknown UI component {component_id}")
        if pattern.get("status") in {"approved", "current", "implemented", "verified", "released"} and not approval_matches(
            approvals, pattern.get("approval"), pattern["id"]
        ):
            errors.append(f"{pattern['id']} is approved or later without a valid approval")
    for component in ui_components.values():
        if not component.get("responsibility") or not component.get("contract") or not component.get("owner"):
            errors.append(f"{component['id']} has incomplete UI-component details")
        for standard_id in component.get("standards", []):
            if standard_id not in standards:
                errors.append(f"{component['id']} references unknown standard {standard_id}")
        for test_id in component.get("tests", []):
            if test_id not in tests:
                errors.append(f"{component['id']} references unknown test {test_id}")
        if component.get("status") in {"implemented", "verified", "released", "current"}:
            implementation_path = component.get("implementation_path")
            if not implementation_path or not (ROOT / implementation_path).exists():
                errors.append(f"{component['id']} is implemented without an existing implementation path")
        if component.get("status") in {"approved", "current", "implemented", "verified", "released"} and not approval_matches(
            approvals, component.get("approval"), component["id"]
        ):
            errors.append(f"{component['id']} is approved or later without a valid approval")
    for screen in screens.values():
        if screen.get("status") not in {"draft", "reviewed", "approved", "implemented", "verified", "released", "deprecated"}:
            errors.append(f"{screen['id']} has an invalid screen status")
        if not screen.get("title") or not screen.get("layout"):
            errors.append(f"{screen['id']} has incomplete screen details")
        if screen.get("module") not in modules:
            errors.append(f"{screen['id']} references unknown module {screen.get('module')}")
        if screen.get("baseline") not in ui_baselines:
            errors.append(f"{screen['id']} references unknown UI baseline {screen.get('baseline')}")
        if screen.get("pattern") not in ui_patterns:
            errors.append(f"{screen['id']} references unknown UI pattern {screen.get('pattern')}")
        for component_id in screen.get("components", []):
            if component_id not in ui_components:
                errors.append(f"{screen['id']} references unknown UI component {component_id}")
        for req_id in screen.get("requirements", []):
            if req_id not in requirements:
                errors.append(f"{screen['id']} references unknown requirement {req_id}")
        for test_id in screen.get("acceptance_tests", []):
            if test_id not in tests:
                errors.append(f"{screen['id']} references unknown acceptance test {test_id}")
        if screen.get("approval") and not approval_matches(approvals, screen["approval"], screen["id"]):
            errors.append(f"{screen['id']} references an approval that is rejected or for another subject")
        if screen.get("status") in {"approved", "implemented", "verified", "released"}:
            required_states = {"loading", "empty", "error", "forbidden"}
            missing_states = required_states - set(screen.get("states", {}))
            if missing_states:
                errors.append(f"{screen['id']} is missing required states: " + ", ".join(sorted(missing_states)))
            if not screen.get("accessibility") or not approval_matches(approvals, screen.get("approval"), screen["id"]):
                errors.append(f"{screen['id']} is approved or later without accessibility and approval")
    for manual in manuals.values():
        if manual.get("status") not in {"draft", "reviewed", "approved", "verified", "released", "deprecated"}:
            errors.append(f"{manual['id']} has an invalid manual status")
        screen = screens.get(manual.get("screen"))
        if not screen:
            errors.append(f"{manual['id']} references unknown screen {manual.get('screen')}")
        if not manual.get("audience") or not manual.get("steps") or not manual.get("expected_results"):
            errors.append(f"{manual['id']} has incomplete manual details")
        for evidence_id in manual.get("evidence", []):
            if evidence_id not in evidence:
                errors.append(f"{manual['id']} references unknown evidence {evidence_id}")
        if manual.get("status") in {"verified", "released"} and not manual.get("evidence"):
            errors.append(f"{manual['id']} is {manual.get('status')} without evidence")
        if manual.get("status") in {"approved", "verified", "released"} and not approval_matches(
            approvals, manual.get("approval"), manual["id"]
        ):
            errors.append(f"{manual['id']} is approved or later without a valid approval")
    for runbook in runbooks.values():
        for field in ("triggers", "steps", "verification", "rollback", "escalation", "owner"):
            if not runbook.get(field):
                errors.append(f"{runbook['id']} has no {field}")
        for test_id in runbook.get("tests", []):
            if test_id not in tests:
                errors.append(f"{runbook['id']} references unknown test {test_id}")
    for profile in delivery_profiles.values():
        rules = profile.get("release_rules", {})
        if not profile.get("audience") or not profile.get("includes"):
            errors.append(f"{profile['id']} has incomplete delivery-profile details")
        for field in ("allow_mockups", "require_verified_capture", "require_current_sources"):
            if not isinstance(rules.get(field), bool):
                errors.append(f"{profile['id']} release rule {field} must be boolean")
        if rules.get("require_verified_capture") and rules.get("allow_mockups"):
            errors.append(f"{profile['id']} cannot allow mockups when verified captures are required")
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
        if "rule_mutation" in test:
            mutation = test["rule_mutation"]
            if not isinstance(mutation.get("applicable"), bool):
                errors.append(f"{test['id']} rule mutation applicability must be boolean")
            elif mutation["applicable"]:
                if not mutation.get("rules") or not mutation.get("evidence"):
                    errors.append(f"{test['id']} applicable rule mutation has no rules or evidence")
                for evidence_id in mutation.get("evidence", []):
                    if evidence_id not in evidence:
                        errors.append(f"{test['id']} rule mutation references unknown evidence {evidence_id}")
            elif not mutation.get("reason"):
                errors.append(f"{test['id']} non-applicable rule mutation has no reason")
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
    for assumption in assumptions.values():
        for field in ("statement", "rationale", "due_gate", "status"):
            if not assumption.get(field):
                errors.append(f"{assumption['id']} has no {field}")
        if assumption.get("status") not in {"open", "confirmed", "invalidated"}:
            errors.append(f"{assumption['id']} has an invalid status")
        if assumption.get("due_gate") not in {"DG-001", "TG-001", "TG-002"}:
            errors.append(f"{assumption['id']} references unknown due gate {assumption.get('due_gate')}")
        for module_id in assumption.get("modules", []):
            if module_id not in modules:
                errors.append(f"{assumption['id']} references unknown module {module_id}")
        if assumption.get("status") != "open" and not assumption.get("resolution"):
            errors.append(f"{assumption['id']} is {assumption.get('status')} without a resolution")
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
        required_coverage = change.get("required_work_coverage")
        if not isinstance(required_coverage, list) or not required_coverage:
            errors.append(f"{change['id']} has no required work coverage")
        elif len(required_coverage) != len(set(required_coverage)) or not set(required_coverage).issubset(WORK_COVERAGE_AREAS):
            errors.append(f"{change['id']} has invalid required work coverage")
        if "options" in change:
            options = change["options"]
            if len(options) != 3 or {item.get("id") for item in options} != {"now", "later", "not_now"}:
                errors.append(f"{change['id']} options must contain now, later, and not_now")
            if sum(1 for item in options if item.get("selected")) != 1:
                errors.append(f"{change['id']} must have exactly one selected option")
        if "scope_delta" in change:
            for key, value in change["scope_delta"].items():
                if not isinstance(value, int):
                    errors.append(f"{change['id']} scope delta {key} must be an integer")
    for release in data["releases"]["releases"]:
        if release.get("delivery_profile") not in delivery_profiles:
            errors.append(f"{release['id']} references unknown delivery profile {release.get('delivery_profile')}")
        for change_id in release.get("changes", []):
            if change_id not in changes:
                errors.append(f"{release['id']} references unknown change {change_id}")
        for test_id in release.get("required_tests", []):
            if test_id not in tests:
                errors.append(f"{release['id']} references unknown test {test_id}")
        for deliverable_id in release.get("required_deliverables", []):
            if deliverable_id not in deliverables:
                errors.append(f"{release['id']} references unknown deliverable {deliverable_id}")
        for screen_id in release.get("screens", []):
            if screen_id not in screens:
                errors.append(f"{release['id']} references unknown release screen {screen_id}")
        for manual_id in release.get("manuals", []):
            if manual_id not in manuals:
                errors.append(f"{release['id']} references unknown release manual {manual_id}")
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
        for blocker in delivery_path_blockers(data, change):
            errors.append(blocker)
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
        if item.get("type") == "ui-capture":
            if item.get("capture_kind") not in {"actual", "mockup"}:
                errors.append(f"{item['id']} has an invalid UI capture kind")
            if not item.get("screens") or not item.get("environment") or not item.get("artifacts"):
                errors.append(f"{item['id']} has incomplete UI capture metadata")
            for screen_id in item.get("screens", []):
                if screen_id not in screens:
                    errors.append(f"{item['id']} references unknown captured screen {screen_id}")
            if item.get("capture_kind") == "actual" and not re.fullmatch(r"[0-9a-fA-F]{7,40}", str(item.get("commit", ""))):
                errors.append(f"{item['id']} actual UI capture is not tied to an immutable commit")
            if item.get("capture_kind") == "actual" and not is_verified_actual_capture(item):
                errors.append(
                    f"{item['id']} actual UI capture requires existing image/video artifacts outside project/docs/generated with SHA-256 hashes"
                )
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
            if not repository_path(artifact).exists():
                errors.append(f"{item['id']} references missing artifact {artifact}")
    approval_subjects = {
        **requirements, **decisions, **changes, **gate_runs, **standards, **golden_paths, **standard_exceptions,
        **ui_baselines, **ui_patterns, **ui_components, **screens, **manuals, **runbooks, **delivery_profiles,
    }
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
        if "review" in run:
            review = run["review"]
            for field in ("redteam_findings", "decision_card", "reverse_questions"):
                if not isinstance(review.get(field), list) or not review[field]:
                    errors.append(f"{run['id']} review has no {field}")
            for item in review.get("decision_card", []):
                if not item.get("decision") or item.get("reversal_cost") not in {"low", "medium", "high"}:
                    errors.append(f"{run['id']} has an invalid decision card entry")
            for item in review.get("reverse_questions", []):
                if not item.get("question") or item.get("status") not in {"open", "answered", "deferred"}:
                    errors.append(f"{run['id']} has an invalid reverse question")
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
            if exception.get("approved_by") and not approval_matches(approvals, exception["approved_by"], run["id"]):
                errors.append(f"{run['id']} exception references an approval that is missing, rejected, or for another subject")
            try:
                expires = datetime.fromisoformat(str(exception.get("expires", "")).replace("Z", "+00:00"))
                if expires.tzinfo is None:
                    raise ValueError
                if expires <= datetime.now(expires.tzinfo):
                    errors.append(f"{run['id']} has an expired gate exception {exception.get('id')}")
            except ValueError:
                errors.append(f"{run['id']} has a gate exception with an invalid expiry")
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
        assignee = work.get("assignee")
        if assignee and assignee not in {item["id"] for item in data["collaboration"].get("participants", [])}:
            errors.append(f"{work['id']} references unknown assignee {assignee}")
        elif assignee and collaboration_profile(data).get("mode") == "team" and not active_participant(data, assignee):
            errors.append(f"{work['id']} references an inactive assignee {assignee}")
        if collaboration_profile(data).get("mode") == "team" and work.get("status") == "doing" and not assignee:
            errors.append(f"{work['id']} is doing in a team profile without an assignee")
        if "verification_load" in work:
            for key in ("fix_rounds", "unverified_rules", "quality_fails", "spec_defects", "redteam_fixes"):
                value = work["verification_load"].get(key)
                if not isinstance(value, int) or value < 0:
                    errors.append(f"{work['id']} verification load {key} must be a non-negative integer")
        if work.get("type") == "documentation-reconciliation":
            if not work.get("surfaces"):
                errors.append(f"{work['id']} documentation reconciliation has no surfaces")
            for surface_id in work.get("surfaces", []):
                if surface_id not in surfaces:
                    errors.append(f"{work['id']} references unknown surface {surface_id}")
            if not work.get("target_docs"):
                errors.append(f"{work['id']} documentation reconciliation has no target docs")
            if not work.get("due_milestone") and not work.get("due_release"):
                errors.append(f"{work['id']} documentation reconciliation has no due milestone or release")
    for plan in surface_registry.get("legacy_plans", []):
        for work_id in plan.get("work_items", []):
            if work_id not in work_items:
                errors.append(f"{plan.get('id')} references unknown work item {work_id}")
        due_milestone = plan.get("due_milestone")
        if due_milestone and due_milestone not in milestones:
            errors.append(f"{plan.get('id')} references unknown milestone {due_milestone}")
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
    ruleset_path = project_distribution_path(repository.get("ruleset", ""))
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
    assignment_policy = work_assignment_policy(data)
    if assignment_policy["mode"] not in ASSIGNMENT_MODES:
        errors.append("collaboration work assignment policy has an invalid mode")
    if not isinstance(assignment_policy["delegates"], list):
        errors.append("collaboration work assignment delegates must be a list")
    elif any(delegate not in participants or participants[delegate].get("status") != "active" for delegate in assignment_policy["delegates"]):
        errors.append("collaboration work assignment delegates must be active participants")
    if assignment_policy["mode"] == "self_assignment" and assignment_policy["offline_coordination_required"] is not True:
        errors.append("self-assignment must require offline coordination")
    if assignment_policy["mode"] != "self_assignment" and assignment_policy["offline_coordination_required"] is not False:
        errors.append("offline coordination must only be required for self-assignment")
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
    if current_profile_id in profiles and profiles[current_profile_id].get("mode") == "team":
        if not any("PM" in item.get("roles", []) for item in active_participants):
            errors.append("team collaboration profile has no active PM")
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
    for event in collaboration.get("assignment_policy_events", []):
        if event.get("from_mode") and event["from_mode"] not in ASSIGNMENT_MODES:
            errors.append(f"{event['id']} has an invalid source assignment mode")
        if event.get("to_mode") not in ASSIGNMENT_MODES:
            errors.append(f"{event['id']} has an invalid target assignment mode")
        if any(delegate not in participants for delegate in event.get("delegates", [])):
            errors.append(f"{event['id']} references an unknown delegate")
        for field in ("changed_at", "changed_by", "reason"):
            if not event.get(field):
                errors.append(f"{event['id']} has no {field}")
    for event in collaboration.get("work_assignment_events", []):
        if event.get("work") not in work_items:
            errors.append(f"{event['id']} references unknown work item {event.get('work')}")
        for field in ("to_assignee", "assigned_by"):
            if event.get(field) not in participants:
                errors.append(f"{event['id']} references unknown participant {event.get(field)}")
        if event.get("from_assignee") and event["from_assignee"] not in participants:
            errors.append(f"{event['id']} references unknown previous assignee {event['from_assignee']}")
        for field in ("assigned_at", "reason"):
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
        rechecks = merge.get("rechecks", [])
        if not isinstance(rechecks, list):
            errors.append(f"{merge['id']} rechecks must be a list")
            continue
        for recheck in rechecks:
            if recheck.get("type") not in {"review", "test"}:
                errors.append(f"{recheck.get('id', merge['id'])} has invalid recheck type")
            if recheck.get("status") not in {"pending", "completed"}:
                errors.append(f"{recheck.get('id', merge['id'])} has invalid recheck status")
            if not isinstance(recheck.get("blocking"), bool):
                errors.append(f"{recheck.get('id', merge['id'])} must declare whether it blocks release")
            for module_id in recheck.get("modules", []):
                if module_id not in modules:
                    errors.append(f"{recheck.get('id', merge['id'])} references unknown module {module_id}")
            for test_id in recheck.get("tests", []):
                if test_id not in tests:
                    errors.append(f"{recheck.get('id', merge['id'])} references unknown test {test_id}")
            for evidence_id in recheck.get("evidence", []):
                if evidence_id not in evidence:
                    errors.append(f"{recheck.get('id', merge['id'])} references unknown evidence {evidence_id}")
            if recheck.get("status") == "completed":
                participant_ids = {item.get("id") for item in data["collaboration"].get("participants", [])}
                if recheck.get("reviewed_by") not in participant_ids:
                    errors.append(f"{recheck.get('id', merge['id'])} has no known reviewer")
                if not recheck.get("reviewed_at") or not recheck.get("result"):
                    errors.append(f"{recheck.get('id', merge['id'])} is completed without reviewer time and result")
                if recheck.get("type") == "test" and not recheck.get("evidence"):
                    errors.append(f"{recheck.get('id', merge['id'])} test completion has no evidence")
    known_link_ids = set(all_ids) | set(criterion_ids)
    for assumption in assumptions.values():
        for linked_id in assumption.get("links", []):
            if linked_id not in known_link_ids:
                errors.append(f"{assumption['id']} references unknown linked item {linked_id}")
    for item in data["open_items"]["open_items"]:
        for linked_id in item.get("links", []):
            if linked_id not in known_link_ids:
                errors.append(f"{item['id']} references unknown linked item {linked_id}")
    canonical_sources = set(FILES.values()) | {
        "modules/*.json", "ui-modules/*.json", "system-surfaces/*.json", "AGENTS.md", "CLAUDE.md", "README.md",
    }
    for deliverable in data["deliverables"]["deliverables"]:
        for source in deliverable.get("source", []):
            if source not in canonical_sources:
                errors.append(f"{deliverable['id']} references unknown canonical source {source}")
        replacement = deliverable.get("replaced_by")
        if replacement and replacement not in deliverables:
            errors.append(f"{deliverable['id']} references unknown replacement {replacement}")
        if deliverable.get("status") == "superseded" and not replacement:
            errors.append(f"{deliverable['id']} is superseded without a replacement")
        path_value = deliverable.get("path")
        if deliverable.get("applicability") == "required" and deliverable.get("status") == "current":
            if not path_value or not repository_path(path_value).exists():
                errors.append(f"{deliverable['id']} is current but its path is missing")
    agents_path = ROOT / "AGENTS.md"
    claude_path = ROOT / "CLAUDE.md"
    if not agents_path.exists() or not agents_path.read_text(encoding="utf-8").strip():
        errors.append("AGENTS.md canonical agent contract is missing or empty")
    if not claude_path.exists():
        errors.append("CLAUDE.md Claude adapter is missing")
    else:
        claude_lines = [line.strip() for line in claude_path.read_text(encoding="utf-8").splitlines() if line.strip()]
        if not claude_lines or claude_lines[0] != "@AGENTS.md":
            errors.append("CLAUDE.md must import the canonical AGENTS.md on its first non-empty line")
    if (ROOT / ".ai" / "core" / "agent-contract.md").exists():
        errors.append("legacy .ai/core/agent-contract.md must not duplicate the canonical AGENTS.md")
    if check_adapters and not is_kit_source():
        for target in SKILL_TARGETS:
            errors.extend(compare_trees(CANONICAL_SKILLS, target))
    if check_generated:
        expected_documents = render_documents(data)
        for filename, expected in expected_documents.items():
            path = GENERATED / filename
            if not path.exists():
                errors.append(f"missing generated document project/docs/generated/{filename}")
            elif path.read_text(encoding="utf-8") != expected:
                errors.append(f"stale generated document project/docs/generated/{filename}")
        expected_paths = {GENERATED / filename for filename in expected_documents}
        if GENERATED.exists():
            for path in GENERATED.rglob("*"):
                if path.is_file() and path not in expected_paths:
                    errors.append(f"obsolete generated document {path.relative_to(ROOT).as_posix()}")
    return errors, warnings


def generate(data: dict[str, dict[str, Any]]) -> None:
    GENERATED.mkdir(parents=True, exist_ok=True)
    documents = render_documents(data)
    for filename, content in documents.items():
        path = GENERATED / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8", newline="\n")
    # project/docs/generated is generator-owned. Remove files that no longer correspond
    # to canonical records so retired screens, mockups, manuals, and modules
    # cannot leak into a later delivery package.
    expected_paths = {GENERATED / filename for filename in documents}
    for path in GENERATED.rglob("*"):
        if path.is_file() and path not in expected_paths:
            path.unlink()
    for path in sorted((item for item in GENERATED.rglob("*") if item.is_dir()), reverse=True):
        if not any(path.iterdir()):
            path.rmdir()
    ruleset_path = ROOT / data["repository"]["ruleset"]
    write_json_atomic(ruleset_path, build_github_ruleset(data))


def migrate_requirements_to_module_specs() -> str:
    with repository_write_lock():
        return _migrate_requirements_to_module_specs_locked()


def _migrate_requirements_to_module_specs_locked() -> str:
    """Move each requirement once into a module-owned fragment.

    A cross-module requirement is stored under the first module in its existing
    ordered ``modules`` link. This is a storage location only: all affected-module
    links remain unchanged and continue to drive traceability and rendering.
    """
    data = load_records()
    requirements_payload = data["requirements"]
    if requirements_payload.get("storage") == "module-sharded":
        raise ValueError("requirements are already stored in module specification fragments")
    if module_spec_paths():
        raise ValueError("module specification fragments already exist; complete or remove the partial migration first")
    modules = index(data["modules"].get("modules", []))
    grouped: dict[str, list[dict[str, Any]]] = {module_id: [] for module_id in modules}
    for requirement in requirements_payload.get("requirements", []):
        linked_modules = requirement.get("modules", [])
        if not linked_modules or linked_modules[0] not in modules:
            raise ValueError(f"{requirement.get('id', 'requirement')} has no valid storage module")
        grouped[linked_modules[0]].append(requirement)
    MODULE_SPEC_DIR.mkdir(parents=True, exist_ok=True)
    created: list[Path] = []
    try:
        for module_id, requirements in grouped.items():
            fragment_path = MODULE_SPEC_DIR / f"{module_id}.json"
            write_json_atomic(fragment_path, {
                "schema_version": 1,
                "module": module_id,
                "requirements": requirements,
            })
            created.append(fragment_path)
        root_payload = {key: value for key, value in requirements_payload.items() if not key.startswith("_")}
        root_payload["schema_version"] = max(int(root_payload.get("schema_version", 1)), 2)
        root_payload["storage"] = "module-sharded"
        root_payload["requirements"] = []
        write_json_atomic(SSOT / FILES["requirements"], root_payload)
    except Exception:
        for created_path in reversed(created):
            if created_path.exists():
                created_path.unlink()
        raise
    return f"Migrated {sum(len(items) for items in grouped.values())} requirement(s) into {len(grouped)} module specification fragments."


def write_empty_module_ui(module_id: str) -> Path:
    path = UI_MODULE_SPEC_DIR / f"{module_id}.json"
    with repository_write_lock():
        known_modules = index(read_json(SSOT / FILES["modules"]).get("modules", []))
        if module_id not in known_modules:
            raise ValueError(f"unknown module: {module_id}")
        if path.exists():
            raise ValueError(f"module UI specification fragment already exists: {path.relative_to(SSOT)}")
        UI_MODULE_SPEC_DIR.mkdir(parents=True, exist_ok=True)
        write_json_atomic(path, {"schema_version": 1, "module": module_id, "screens": [], "manuals": []})
    return path


def init_module_ui(module_id: str) -> str:
    path = write_empty_module_ui(module_id)
    return f"Initialized optional UI specification for {module_id} at project/.aidd/ssot/{path.relative_to(SSOT).as_posix()}."


def write_empty_module_surfaces(module_id: str) -> Path:
    path = SYSTEM_SURFACE_SPEC_DIR / f"{module_id}.json"
    with repository_write_lock():
        known_modules = index(read_json(SSOT / FILES["modules"]).get("modules", []))
        if module_id not in known_modules:
            raise ValueError(f"unknown module: {module_id}")
        if path.exists():
            raise ValueError(f"module system-surface fragment already exists: {path.relative_to(SSOT)}")
        SYSTEM_SURFACE_SPEC_DIR.mkdir(parents=True, exist_ok=True)
        write_json_atomic(path, {"schema_version": 1, "module": module_id, "surfaces": []})
    return path


def init_module_surfaces(module_id: str) -> str:
    path = write_empty_module_surfaces(module_id)
    return f"Initialized system-surface inventory for {module_id} at project/.aidd/ssot/{path.relative_to(SSOT).as_posix()}."


def add_module(module_id: str, name: str, purpose: str, dependencies: list[str], status: str, with_ui: bool = False) -> str:
    if not ID_PATTERN.match(module_id) or not module_id.startswith("MOD-"):
        raise ValueError("module ID must use the MOD-XXX form")
    if not name.strip() or not purpose.strip():
        raise ValueError("module name and purpose are required")
    if status not in {"planned", "in_progress", "blocked", "done"}:
        raise ValueError("module status must be planned, in_progress, blocked, or done")
    path = MODULE_SPEC_DIR / f"{module_id}.json"
    ui_path = UI_MODULE_SPEC_DIR / f"{module_id}.json"
    surface_path = SYSTEM_SURFACE_SPEC_DIR / f"{module_id}.json"
    ui_message = ""
    with repository_write_lock():
        # Reload inside the lock so concurrent processes cannot overwrite one
        # another's module-catalog additions.
        modules_payload = read_json(SSOT / FILES["modules"])
        modules = index(modules_payload.get("modules", []))
        if module_id in modules:
            raise ValueError(f"module already exists: {module_id}")
        unknown_dependencies = sorted(set(dependencies) - set(modules))
        if unknown_dependencies:
            raise ValueError("unknown module dependencies: " + ", ".join(unknown_dependencies))
        if path.exists() or surface_path.exists() or (with_ui and ui_path.exists()):
            raise ValueError(f"module specification fragment already exists: {path.relative_to(ROOT)}")
        MODULE_SPEC_DIR.mkdir(parents=True, exist_ok=True)
        SYSTEM_SURFACE_SPEC_DIR.mkdir(parents=True, exist_ok=True)
        if with_ui:
            UI_MODULE_SPEC_DIR.mkdir(parents=True, exist_ok=True)
        created: list[Path] = []
        try:
            write_json_atomic(path, {"schema_version": 1, "module": module_id, "requirements": []})
            created.append(path)
            write_json_atomic(surface_path, {"schema_version": 1, "module": module_id, "surfaces": []})
            created.append(surface_path)
            if with_ui:
                write_json_atomic(ui_path, {"schema_version": 1, "module": module_id, "screens": [], "manuals": []})
                created.append(ui_path)
                ui_message = f" Initialized project/.aidd/ssot/{ui_path.relative_to(SSOT).as_posix()}."
            stored_payload = {key: value for key, value in modules_payload.items() if not key.startswith("_")}
            stored_payload["modules"] = list(stored_payload.get("modules", [])) + [{
                "id": module_id, "name": name.strip(), "purpose": purpose.strip(), "status": status,
                "dependencies": dependencies, "requirements": [],
            }]
            write_json_atomic(SSOT / FILES["modules"], stored_payload)
        except Exception:
            for created_path in reversed(created):
                if created_path.exists():
                    created_path.unlink()
            raise
    return f"Added {module_id}. Add requirements and executable surfaces to its module fragments.{ui_message} Run generate, then validate."


def update_module_status(module_id: str, status: str) -> str:
    if status not in {"planned", "in_progress", "blocked", "done"}:
        raise ValueError("module status must be planned, in_progress, blocked, or done")
    with repository_write_lock():
        payload = read_json(SSOT / FILES["modules"])
        module = next((item for item in payload.get("modules", []) if item.get("id") == module_id), None)
        if not module:
            raise ValueError(f"unknown module: {module_id}")
        previous = module.get("status")
        module["status"] = status
        write_json_atomic(SSOT / FILES["modules"], payload)
    return f"Updated {module_id} status: {ko_code(previous)} → {ko_code(status)}. Run generate, then validate."


def add_assumption(
    assumption_id: str, statement: str, rationale: str, due_gate: str, modules: list[str], links: list[str],
) -> str:
    if not ID_PATTERN.match(assumption_id) or not assumption_id.startswith("ASM-"):
        raise ValueError("assumption ID must use the ASM-XXX form")
    if due_gate not in {"DG-001", "TG-001", "TG-002"}:
        raise ValueError("due gate must be DG-001, TG-001, or TG-002")
    data = load_records()
    if assumption_id in index(data["assumptions"].get("assumptions", [])):
        raise ValueError(f"assumption already exists: {assumption_id}")
    known_modules = index(data["modules"].get("modules", []))
    unknown_modules = sorted(set(modules) - set(known_modules))
    if unknown_modules:
        raise ValueError("unknown assumption modules: " + ", ".join(unknown_modules))
    payload = read_json(SSOT / FILES["assumptions"])
    payload.setdefault("assumptions", []).append({
        "id": assumption_id, "statement": statement, "rationale": rationale, "modules": modules,
        "links": links, "due_gate": due_gate, "status": "open", "resolution": None,
    })
    write_json_atomic(SSOT / FILES["assumptions"], payload)
    return f"Added {assumption_id}; resolve it before {due_gate}. Run generate, then validate."


def resolve_assumption(assumption_id: str, status: str, resolution: str) -> str:
    if status not in {"confirmed", "invalidated"}:
        raise ValueError("assumption resolution status must be confirmed or invalidated")
    payload = read_json(SSOT / FILES["assumptions"])
    assumption = next((item for item in payload.get("assumptions", []) if item.get("id") == assumption_id), None)
    if not assumption:
        raise ValueError(f"unknown assumption: {assumption_id}")
    assumption["status"] = status
    assumption["resolution"] = resolution
    write_json_atomic(SSOT / FILES["assumptions"], payload)
    return f"Resolved {assumption_id} as {ko_code(status)}. Run generate, then validate."


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
    if is_kit_source():
        kit_sync = subprocess.run(
            [sys.executable, str(ROOT / ".aidd-kit-dev" / "tools" / "kit.py"), "sync-providers"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        if kit_sync.returncode:
            detail = (kit_sync.stderr or kit_sync.stdout).strip() or f"exit {kit_sync.returncode}"
            raise RuntimeError(f"Kit provider sync failed: {detail}")
    else:
        for target in SKILL_TARGETS:
            safe_replace_tree(CANONICAL_SKILLS, target)
    result = subprocess.run(
        [sys.executable, str(ROOT / ".ai" / "tools" / "aidd_hook.py"), "self-test"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if result.returncode:
        detail = (result.stderr or result.stdout).strip() or f"exit {result.returncode}"
        raise RuntimeError(f"agent harness self-test failed after synchronization: {detail}")


def git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args], cwd=ROOT, check=True, capture_output=True, text=True,
        encoding="utf-8", errors="replace",
    )
    return result.stdout.strip()


def integration_status() -> str:
    """Report local Git integration facts without fetching, pulling, or merging."""
    try:
        if git("rev-parse", "--is-inside-work-tree") != "true":
            return "# Git 통합 상태\n\n- Git 작업 트리가 아닙니다."
        branch = git("branch", "--show-current") or "(detached HEAD)"
        dirty = git("status", "--porcelain")
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "# Git 통합 상태\n\n- Git 상태를 조회할 수 없습니다."
    lines = ["# Git 통합 상태", "", f"- 현재 브랜치: `{branch}`", f"- 작업 트리: {'변경 있음' if dirty else '깨끗함'}"]
    try:
        upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}")
        counts = git("rev-list", "--left-right", "--count", "HEAD...@{upstream}").split()
        ahead, behind = (int(counts[0]), int(counts[1]))
        lines.append(f"- 추적 대상: `{upstream}`; 앞섬 {ahead} / 뒤처짐 {behind}")
        if dirty:
            lines.append("- 권장: 로컬 변경이 있으므로 자동 동기화하지 않습니다. 보존·통합 방식을 먼저 결정하세요.")
        elif ahead and behind:
            lines.append("- 알림: 양쪽 이력이 갈라졌습니다. `aidd-integration` 절차로 영향과 충돌 책임을 확인한 뒤 사용자 승인 하에 통합하세요.")
        elif behind:
            lines.append("- 권장: 사용자 승인 뒤에만 `git pull --ff-only`를 실행하세요. 이 명령은 자동 pull을 하지 않습니다.")
        elif ahead:
            lines.append("- 권장: 원격 push·PR은 별도의 사용자 승인과 저장소 통제 확인 뒤에 수행하세요.")
        else:
            lines.append("- 통합 대기: 현재 추적 브랜치 기준 차이가 없습니다. (네트워크 fetch는 수행하지 않았음)")
    except subprocess.CalledProcessError:
        lines.append("- 추적 대상이 없습니다. 원격 동기화는 자동으로 수행하지 않습니다.")
    return "\n".join(lines)


def stable_records(data: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}

    def walk(value: Any) -> None:
        if isinstance(value, dict):
            identifier = value.get("id")
            if isinstance(identifier, str) and ID_PATTERN.fullmatch(identifier):
                records[identifier] = value
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(data)
    return records


def record_references(value: Any, known: set[str], *, root: bool = True) -> set[str]:
    refs: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            if key != "id":
                refs.update(record_references(child, known, root=False))
    elif isinstance(value, list):
        for child in value:
            refs.update(record_references(child, known, root=False))
    elif isinstance(value, str) and value in known:
        refs.add(value)
    return refs


def impact_text(data: dict[str, dict[str, Any]], identifier: str) -> str:
    records = stable_records(data)
    if identifier not in records:
        raise ValueError(f"알 수 없는 안정 ID: {identifier}")
    known = set(records)
    outgoing = {item_id: record_references(record, known) - {item_id} for item_id, record in records.items()}
    incoming = {item_id: set() for item_id in known}
    for source, targets in outgoing.items():
        for target in targets:
            incoming[target].add(source)
    direct = sorted(incoming[identifier])
    dependencies = sorted(outgoing[identifier])
    indirect: set[str] = set()
    queue = list(direct)
    while queue:
        current = queue.pop(0)
        for dependent in incoming[current]:
            if dependent != identifier and dependent not in indirect and dependent not in direct:
                indirect.add(dependent)
                queue.append(dependent)
    def title(item_id: str) -> str:
        record = records[item_id]
        return str(record.get("title") or record.get("name") or record.get("statement") or "-")
    return (
        f"# {identifier} 영향 분석\n\n"
        f"- 직접 영향 대상(이 항목을 참조): {len(direct)}개\n"
        f"- 간접 영향 대상(참조 연쇄): {len(indirect)}개\n"
        f"- 선행·연결 항목(이 항목이 참조): {len(dependencies)}개\n\n"
        "## 직접 영향 대상\n\n" + table(["ID", "제목"], [[item, title(item)] for item in direct])
        + "\n\n## 간접 영향 대상\n\n" + table(["ID", "제목"], [[item, title(item)] for item in sorted(indirect)])
        + "\n\n## 선행·연결 항목\n\n" + table(["ID", "제목"], [[item, title(item)] for item in dependencies]) + "\n"
    )


def document_impact_text(data: dict[str, dict[str, Any]], paths: list[str]) -> str:
    """Report mandatory documentation review candidates after source or SSOT edits."""
    changed = [path.replace("\\", "/") for path in paths]
    if not changed:
        try:
            changed = git("diff", "--name-only").splitlines()
        except (subprocess.CalledProcessError, FileNotFoundError):
            changed = []
    source_paths = [path for path in changed if path.startswith("project/src/")]
    ssot_paths = [path for path in changed if path.startswith("project/.aidd/ssot/")]
    records = stable_records(data)
    mentioned: set[str] = set()
    for relative in source_paths:
        candidate = ROOT / relative
        if not candidate.is_file() or candidate.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            content = candidate.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        mentioned.update(identifier for identifier in records if identifier in content)
    template_rows = [
        [item["id"], item["name"], item["status"], ", ".join(item["target_patterns"])]
        for item in data["documentation"].get("templates", [])
    ]
    return (
        "# 문서 현행화 영향 후보\n\n"
        f"- 변경 소스 파일: {len(source_paths)}개\n"
        f"- 변경 정본 파일: {len(ssot_paths)}개\n"
        f"- 소스에서 발견한 안정 ID: {', '.join(sorted(mentioned)) or '없음'}\n\n"
        "## 반드시 재검토할 흐름\n\n"
        "1. 변경 의도와 영향 요구사항·모듈·CHG를 확인한다.\n"
        "2. 기능 요건 → 화면 요건 → 사용자 매뉴얼 → 운영 런북 → 테스트·증거 순으로 현재 사실을 대조한다.\n"
        "3. 새 규칙·필드·절차가 있으면 문서 포맷 기준에 먼저 추가하고 같은 유형의 기존 문서 전체를 재생성·현행화한다.\n"
        "4. 코드와 정본 중 어느 쪽도 자동 정답으로 정하지 말고, 모순은 CHG·OI·ADR로 처리한다.\n\n"
        "## 현재 문서 포맷 계약\n\n" + table(
            ["ID", "문서 유형", "상태", "소급 적용 생성물"], template_rows,
        ) + "\n\n정합성 의미 검토는 aidd-document-consistency 스킬로 수행하고, 확정 뒤 generate·validate·관련 테스트를 실행한다.\n"
    )


def documentation_commit_check(
    data: dict[str, dict[str, Any]], staged_paths: list[str],
) -> tuple[str, list[str]]:
    """Check staged product source against the staged documentation control records."""
    normalized = sorted({path.replace("\\", "/") for path in staged_paths})
    policy = data["system_surfaces"].get("policy", {})
    exclusions = policy.get("source_exclusions", ["project/src/README.md"])
    source_paths = [
        path for path in normalized
        if path.startswith("project/src/") and not any(fnmatch.fnmatch(path, pattern) for pattern in exclusions)
    ]
    if not source_paths:
        return "문서 현행화 검사: staged 제품 소스 변경 없음", []
    surfaces = data["system_surfaces"].get("surfaces", [])
    changes = [
        item for item in data["changes"].get("changes", [])
        if item.get("status") not in {"done", "verified", "released"}
    ]
    work_index = index(data["delivery_plan"].get("work_items", []))
    blockers: list[str] = []
    rows: list[list[str]] = []

    def work_is_actionable(work_id: str) -> bool:
        work = work_index.get(work_id, {})
        return bool(
            work.get("type") == "documentation-reconciliation"
            and work.get("status") != "completed"
            and work.get("target_docs")
            and (work.get("due_milestone") or work.get("due_release"))
        )

    legacy_plans = [
        item for item in data["system_surfaces"].get("legacy_plans", [])
        if item.get("status") in {"planned", "in_progress"}
        and all(work_is_actionable(work_id) for work_id in item.get("work_items", []))
        and item.get("work_items")
    ]
    for source_path in source_paths:
        matched = [
            item for item in surfaces
            if any(fnmatch.fnmatch(source_path, pattern) for pattern in item.get("source_patterns", []))
        ]
        if not matched:
            legacy_plan = next((
                item for item in legacy_plans
                if any(source_path == root.rstrip("/") or source_path.startswith(root.rstrip("/") + "/") for root in item.get("source_roots", []))
            ), None)
            if legacy_plan:
                rows.append([source_path, legacy_plan["id"], "레거시 인벤토리 계획으로 추적"])
                continue
            blockers.append(f"{source_path}에 대응하는 화면·API·배치·이벤트 표면 또는 레거시 문서화 계획이 없습니다")
            rows.append([source_path, "-", "차단"])
            continue
        for surface in matched:
            surface_id = surface["id"]
            candidates = [item for item in changes if surface_id in item.get("delivery_path", {}).get("surfaces", [])]
            if len(candidates) != 1:
                blockers.append(
                    f"{surface_id}를 담당하는 진행 중 CHG가 "
                    + ("없습니다" if not candidates else "여러 개입니다: " + ", ".join(item["id"] for item in candidates))
                )
                rows.append([source_path, surface_id, "CHG 연결 차단"])
                continue
            change = candidates[0]
            delivery_path = change.get("delivery_path", {})
            action = delivery_path.get("documentation")
            doc_state = surface.get("documentation_status")
            doc_sources = surface.get("documentation_sources", [])
            staged_doc = any(
                staged == document or fnmatch.fnmatch(staged, document)
                for staged in normalized for document in doc_sources
            )
            if doc_state in {"current", "stale"}:
                if action != "update_now":
                    blockers.append(f"{surface_id}는 기존 문서가 있어 {change['id']}에서 지금 현행화해야 합니다")
                elif not doc_sources or not staged_doc:
                    blockers.append(f"{surface_id}의 기존 문서 정본이 staged 변경에 포함되지 않았습니다")
            elif doc_state == "undocumented":
                if action == "deferred":
                    deferred = documentation_work_blockers(data, change, delivery_path)
                    blockers.extend(deferred)
                elif action in {"create_now", "update_now"}:
                    if not doc_sources or not staged_doc:
                        blockers.append(f"{surface_id}의 새 문서 정본이 staged 변경에 포함되지 않았습니다")
                else:
                    blockers.append(f"{surface_id}의 문서를 지금 작성할지 후속 WRK로 미룰지 결정되지 않았습니다")
            elif doc_state == "not_applicable":
                if action != "not_applicable" or delivery_path.get("kind") not in {"internal_refactor", "governance"}:
                    blockers.append(f"{surface_id}의 문서 영향 없음 판정과 변경 경로가 일치하지 않습니다")
            rows.append([source_path, surface_id, f"{change['id']} / {action or '미정'}"])
    report = "# staged 소스 문서 현행화 검사\n\n" + table(["소스", "표면·계획", "판정"], rows)
    return report, sorted(set(blockers))


def read_index_json(relative: str) -> dict[str, Any]:
    """Read one JSON file exactly as staged in the Git index."""
    return json.loads(git("show", f":{relative}"))


def load_staged_documentation_controls() -> dict[str, dict[str, Any]]:
    """Load only the records needed by the pre-commit documentation gate from the index."""
    data = {
        "changes": read_index_json("project/.aidd/ssot/changes.json"),
        "delivery_plan": read_index_json("project/.aidd/ssot/delivery-plan.json"),
        "system_surfaces": read_index_json("project/.aidd/ssot/system-surfaces.json"),
    }
    surface_paths = git("ls-files", "--cached", "--", "project/.aidd/ssot/system-surfaces/*.json").splitlines()
    surfaces = list(data["system_surfaces"].get("surfaces", []))
    for relative in surface_paths:
        fragment = read_index_json(relative.replace("\\", "/"))
        surfaces.extend(fragment.get("surfaces", []))
    data["system_surfaces"]["surfaces"] = surfaces
    return data


def staged_documentation_check_text() -> tuple[str, list[str]]:
    staged_paths = git("diff", "--cached", "--name-only", "--diff-filter=ACMR").splitlines()
    if not any(path.replace("\\", "/").startswith("project/src/") for path in staged_paths):
        return "문서 현행화 검사: staged 제품 소스 변경 없음", []
    try:
        data = load_staged_documentation_controls()
    except (subprocess.CalledProcessError, json.JSONDecodeError) as exc:
        return "staged 정본에서 문서 현행화 통제를 읽지 못했습니다", [str(exc)]
    return documentation_commit_check(data, staged_paths)


def configured_work_log_actor(data: dict[str, dict[str, Any]]) -> dict[str, str]:
    """Resolve the current Git identity to one verified, active AIDD actor."""
    try:
        name = git("config", "--get", "user.name")
        email = git("config", "--get", "user.email")
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        raise ValueError(
            "작업 기록을 남기려면 현재 저장소의 Git user.name과 user.email이 필요합니다. "
            "프로젝트의 신원 매핑을 확인한 뒤 다시 실행하세요."
        ) from exc
    if not name or not email:
        raise ValueError("작업 기록을 남기려면 Git user.name과 user.email을 모두 설정해야 합니다.")

    identity = normalize_git_identity(name, email)
    mappings = [
        item for item in data["collaboration"].get("identity_mappings", [])
        if any(
            normalize_git_identity(alias.get("name", ""), alias.get("email", "")) == identity
            for alias in item.get("git_identities", [])
        )
    ]
    if not mappings:
        raise ValueError(
            f"현재 Git 신원 {name} <{email}>은 collaboration.json에 매핑되지 않았습니다. "
            "identity-check로 확인하고 collaboration-identity로 사람 별칭 또는 봇을 등록하세요."
        )
    if len(mappings) != 1:
        raise ValueError(f"현재 Git 신원 {name} <{email}>에 중복된 신원 매핑이 있습니다.")
    mapping = mappings[0]
    if mapping.get("principal_type") == "human":
        actor_id = mapping.get("participant")
        participants = {item["id"]: item for item in data["collaboration"].get("participants", [])}
        participant = participants.get(actor_id)
        if not actor_id or not participant:
            raise ValueError(f"{mapping['id']}의 사람 참여자 연결이 유효하지 않습니다.")
        if participant.get("status") != "active":
            raise ValueError(f"현재 Git 신원은 비활성 참여자 {actor_id}에 연결되어 있어 작업 기록을 남길 수 없습니다.")
        actor_name = participant.get("name", actor_id)
    else:
        actor_id = mapping["id"]
        actor_name = "등록된 자동화 주체"
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9-]*", actor_id):
        raise ValueError(f"작업 기록 파일명으로 쓸 수 없는 참여자 ID입니다: {actor_id}")
    return {
        "id": actor_id,
        "name": actor_name,
        "mapping": mapping["id"],
        "principal_type": mapping.get("principal_type", "unknown"),
        "git_name": name,
        "git_email": email,
    }


def current_actor_text(data: dict[str, dict[str, Any]]) -> str:
    """Render the local execution identity without treating it as work ownership."""
    actor = configured_work_log_actor(data)
    return (
        "# 현재 로컬 작업자\n\n"
        f"- AIDD 참여자: {actor['name']} (`{actor['id']}`)\n"
        f"- Git 신원: {actor['git_name']} <{actor['git_email']}>\n"
        f"- 신원 매핑: `{actor['mapping']}` ({actor['principal_type']})\n\n"
        "이 결과는 현재 작업공간을 사용하는 사람·봇의 신원만 식별한다. 팀 작업의 담당은 WRK의 assignee와 현재 배정 방식으로 확인한다. 점유·잠금·자동 pull 검사는 사용하지 않는다.\n"
    )


def work_assignment_check_text(data: dict[str, dict[str, Any]], work_id: str) -> str:
    """Check that a team member only starts a work package assigned to them."""
    work = index(data["delivery_plan"].get("work_items", [])).get(work_id)
    if not work:
        raise ValueError(f"알 수 없는 작업: {work_id}")
    if work.get("status") == "completed":
        raise ValueError(f"완료된 작업은 다시 시작할 수 없습니다: {work_id}")
    actor = configured_work_log_actor(data)
    profile = collaboration_profile(data)
    if profile.get("mode") == "team":
        if not work.get("assignee"):
            raise ValueError(f"팀 프로필에서는 {work_id}의 책임 참여자를 먼저 배정해야 합니다.")
        if work["assignee"] != actor["id"]:
            raise ValueError(f"{work_id}은(는) {work['assignee']}에게 배정되었습니다. 현재 작업자 {actor['id']}은(는) 수행할 수 없습니다.")
    change = index(data["changes"].get("changes", [])).get(work.get("change"))
    blockers = branch_policy_blockers(data, change)
    if blockers:
        raise ValueError("; ".join(blockers))
    assignment = work.get("assignee") or "제한 없음(1인 프로필)"
    policy = work_assignment_policy(data)
    confirmation = (
        f"팀 배정 방식 {policy['mode']}과 현재 작업자 일치가 확인됐습니다. 결과·이유·다음 행동은 record-work로 남기세요."
        if profile.get("mode") == "team"
        else "1인 프로필이므로 배정 제한 없이 브랜치·작업 상태가 확인됐습니다. 결과·이유·다음 행동은 record-work로 남기세요."
    )
    return (
        "# 작업 수행 확인\n\n"
        f"- 작업: {work_id} — {work['title']}\n"
        f"- 협업 프로필: {profile['id']} {profile['name']}\n"
        f"- 현재 작업자: {actor['id']}\n"
        f"- 책임 참여자: {assignment}\n"
        f"- 브랜치: {current_git_branch() or '분리된 HEAD'}\n\n"
        f"{confirmation}\n"
    )


def assign_work(data: dict[str, dict[str, Any]], work_id: str, participant_id: str, reason: str) -> str:
    """Set the durable responsible participant under the selected allocation policy."""
    manager = configured_work_log_actor(data)
    if not reason.strip():
        raise ValueError("작업 패키지 배정 사유는 필수입니다.")
    with repository_write_lock():
        plan_payload = read_json(SSOT / FILES["delivery_plan"])
        collaboration_payload = read_json(SSOT / FILES["collaboration"])
        live_data = {**data, "collaboration": collaboration_payload}
        denial = may_allocate_work(live_data, manager["id"], participant_id)
        if denial:
            raise ValueError(denial)
        participants = {item["id"]: item for item in collaboration_payload.get("participants", [])}
        participant = participants.get(participant_id)
        if not participant or participant.get("status") != "active":
            raise ValueError(f"활성 참여자가 아닙니다: {participant_id}")
        work = next((item for item in plan_payload.get("work_items", []) if item.get("id") == work_id), None)
        if not work:
            raise ValueError(f"알 수 없는 작업: {work_id}")
        previous_assignee = work.get("assignee")
        work["assignee"] = participant_id
        events = collaboration_payload.setdefault("work_assignment_events", [])
        next_number = max((int(item["id"].split("-")[-1]) for item in events), default=0) + 1
        timestamp = datetime.now().astimezone().isoformat(timespec="seconds")
        events.append({
            "id": f"WAE-{next_number:03d}",
            "work": work_id,
            "from_assignee": previous_assignee,
            "to_assignee": participant_id,
            "assigned_by": manager["id"],
            "assigned_at": timestamp,
            "reason": reason.strip(),
        })
        write_json_atomic(SSOT / FILES["delivery_plan"], plan_payload)
        write_json_atomic(SSOT / FILES["collaboration"], collaboration_payload)
    mode = work_assignment_policy(live_data)["mode"]
    return f"{work_id} 작업 패키지의 책임 참여자를 {participant_id}로 지정했습니다. 배정 방식: {mode}. 수행 전 work-check로 확인하세요."


def update_work_assignment_policy(data: dict[str, dict[str, Any]], mode: str, delegates: list[str], reason: str) -> str:
    """Change the team allocation policy without introducing claims or remote locks."""
    if mode not in ASSIGNMENT_MODES:
        raise ValueError(f"지원하지 않는 작업 배정 방식: {mode}")
    actor = configured_work_log_actor(data)
    if not reason.strip():
        raise ValueError("작업 배정 방식 변경 사유는 필수입니다.")
    path = SSOT / FILES["collaboration"]
    with repository_write_lock():
        payload = read_json(path)
        live_data = {**data, "collaboration": payload}
        profile = collaboration_profile(live_data)
        actor_record = active_participant(live_data, actor["id"])
        if profile.get("mode") == "team" and (not actor_record or "PM" not in actor_record.get("roles", [])):
            raise ValueError("팀 프로필의 작업 배정 방식 변경은 PM 역할 참여자만 할 수 있습니다.")
        if profile.get("mode") == "solo" and (not actor_record or "소유자" not in actor_record.get("roles", [])):
            raise ValueError("1인 프로필의 작업 배정 방식 변경은 소유자 역할 참여자만 할 수 있습니다.")
        active_ids = {item["id"] for item in payload.get("participants", []) if item.get("status") == "active"}
        if any(delegate not in active_ids for delegate in delegates):
            raise ValueError("위임자는 활성 참여자여야 합니다.")
        if mode != "delegated" and delegates:
            raise ValueError("위임자는 delegated 방식에서만 지정할 수 있습니다.")
        if mode == "delegated" and not delegates:
            raise ValueError("위임 배정 방식에는 활성 위임자를 한 명 이상 지정해야 합니다.")
        previous = work_assignment_policy(live_data)
        timestamp = datetime.now().astimezone().isoformat(timespec="seconds")
        payload["work_assignment_policy"] = {
            "mode": mode,
            "delegates": sorted(set(delegates)),
            "offline_coordination_required": mode == "self_assignment",
            "changed_at": timestamp,
            "changed_by": actor["id"],
            "reason": reason.strip(),
        }
        events = payload.setdefault("assignment_policy_events", [])
        next_number = max((int(item["id"].split("-")[-1]) for item in events), default=0) + 1
        events.append({
            "id": f"APE-{next_number:03d}",
            "from_mode": previous["mode"],
            "to_mode": mode,
            "delegates": sorted(set(delegates)),
            "changed_at": timestamp,
            "changed_by": actor["id"],
            "reason": reason.strip(),
        })
        write_json_atomic(path, payload)
    return f"작업 배정 방식을 {mode}(으)로 변경했습니다. 점유·잠금·자동 pull 검사는 사용하지 않습니다."


def workload_coverage_text(data: dict[str, dict[str, Any]], change_id: str) -> tuple[str, list[str]]:
    """Check that one approved change has complete WRK coverage before allocation."""
    change = index(data["changes"].get("changes", [])).get(change_id)
    if not change:
        raise ValueError(f"알 수 없는 변경: {change_id}")
    work_items = [item for item in data["delivery_plan"].get("work_items", []) if item.get("change") == change_id]
    covered_requirements = {requirement for item in work_items for requirement in item.get("requirements", [])}
    missing_requirements = [item for item in change.get("requirements", []) if item not in covered_requirements]
    active_work = [item for item in work_items if item.get("status") != "completed"]
    profile = collaboration_profile(data)
    unassigned = [item["id"] for item in active_work if profile.get("mode") == "team" and not item.get("assignee")]
    required_coverage = set(change.get("required_work_coverage", []))
    incomplete_coverage = [
        item["id"] for item in active_work
        if not required_coverage.issubset(set(item.get("coverage", [])))
    ]
    blockers: list[str] = []
    if not work_items:
        blockers.append("연결된 작업 패키지(WRK)가 없습니다")
    if missing_requirements:
        blockers.append(f"WRK에 연결되지 않은 요구사항: {', '.join(missing_requirements)}")
    if unassigned:
        blockers.append(f"책임 참여자가 없는 미완료 작업 패키지: {', '.join(unassigned)}")
    if incomplete_coverage:
        blockers.append(f"변경에 필요한 작업 영역이 모두 명시되지 않은 작업 패키지: {', '.join(incomplete_coverage)}")
    rows = [
        [item["id"], item["title"], item.get("status", "-"), item.get("assignee") or "-", ", ".join(item.get("coverage", [])) or "-"]
        for item in work_items
    ]
    report = (
        "# 개발 작업 패키지 포괄성 점검\n\n"
        f"- 변경: {change_id} — {change['title']}\n"
        f"- 요구사항: {len(change.get('requirements', []))}개 / 연결된 작업 패키지: {len(work_items)}개\n"
        f"- 필수 작업 영역: {', '.join(sorted(required_coverage)) or '정의되지 않음'}\n"
        f"- 결과: {'배분 가능' if not blockers else '보완 필요'}\n\n"
        "## 작업 패키지\n\n"
        + table(["WRK", "작업 패키지", "상태", "책임 참여자", "포괄 범위"], rows)
        + "\n\n## 보완 사항\n\n"
        + ("\n".join(f"- {item}" for item in blockers) if blockers else "- 요구사항·배정·필수 수행 범위가 모두 연결되었습니다.")
        + "\n\n파생 요구가 발견되면 CHG·REQ를 먼저 기록하고, 같은 배정 범위이면 현재 WRK의 requirements와 coverage에 추가한다. 다른 모듈·다른 WRK·승인 범위를 넘으면 PM 또는 위임자가 새 WRK 또는 범위 변경을 결정한다.\n"
    )
    return report, blockers


def record_work_log(
    data: dict[str, dict[str, Any]], summary: str, why: str, result: str,
    next_step: str, links: list[str], day: str | None,
) -> str:
    """Append a daily entry under a verified participant-specific, Git-tracked file."""
    if day:
        try:
            current = datetime.strptime(day, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("--date must use YYYY-MM-DD") from exc
    else:
        current = datetime.now()
    actor = configured_work_log_actor(data)
    directory = PROJECT / "work-log" / current.strftime("%Y-%m") / current.strftime("%Y-%m-%d")
    path = directory / f"{actor['id']}.md"
    directory.mkdir(parents=True, exist_ok=True)
    header = (
        f"# {current.strftime('%Y-%m-%d')} 작업 기록 — {actor['id']}\n\n"
        f"- 참여자: {actor['name']} ({actor['id']})\n"
        f"- 최초 기록 Git 신원: {actor['git_name']} <{actor['git_email']}>\n"
        f"- 신원 매핑: {actor['mapping']} ({actor['principal_type']})\n\n"
        if not path.exists() else ""
    )
    links_text = ", ".join(links) if links else "없음"
    entry = (
        f"## {datetime.now().astimezone().strftime('%H:%M')} — {summary}\n\n"
        f"- 기록 Git 신원: {actor['git_name']} <{actor['git_email']}>\n"
        f"- 이유: {why}\n"
        f"- 수행·결과: {result}\n"
        f"- 다음: {next_step}\n"
        f"- 연결: {links_text}\n\n"
    )
    with path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(header + entry)
    return f"작업 기록을 {path.relative_to(ROOT).as_posix()}에 {actor['id']} 신원으로 추가했습니다."


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
        "rechecks": [],
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


def add_merge_recheck(
    merge_id: str, recheck_type: str, title: str, module_ids: list[str], test_ids: list[str], blocking: bool,
) -> str:
    merge_path = SSOT / FILES["merges"]
    payload = read_json(merge_path)
    merge = next((item for item in payload.get("merges", []) if item["id"] == merge_id), None)
    if not merge:
        raise ValueError(f"알 수 없는 병합 레코드: {merge_id}")
    if merge.get("status") != "assessed":
        raise ValueError(f"{merge_id}의 영향 평가를 먼저 완료해야 재검토를 추가할 수 있습니다")
    known_modules = {item["id"] for item in read_json(SSOT / FILES["modules"]).get("modules", [])}
    unknown_modules = sorted(set(module_ids) - known_modules)
    if unknown_modules:
        raise ValueError("알 수 없는 모듈: " + ", ".join(unknown_modules))
    known_tests = {item["id"] for item in read_json(SSOT / FILES["tests"]).get("test_cases", [])}
    unknown_tests = sorted(set(test_ids) - known_tests)
    if unknown_tests:
        raise ValueError("알 수 없는 테스트: " + ", ".join(unknown_tests))
    numbers = [
        int(recheck["id"].split("-")[1]) for item in payload.get("merges", []) for recheck in item.get("rechecks", [])
        if re.fullmatch(r"MRC-\d+", str(recheck.get("id", "")))
    ]
    recheck_id = f"MRC-{max(numbers or [0]) + 1:03d}"
    merge.setdefault("rechecks", []).append({
        "id": recheck_id,
        "type": recheck_type,
        "title": title,
        "modules": sorted(set(module_ids)),
        "tests": sorted(set(test_ids)),
        "blocking": blocking,
        "status": "pending",
        "reviewed_by": None,
        "reviewed_at": None,
        "result": None,
        "evidence": [],
    })
    write_json_atomic(merge_path, payload)
    return f"Added {recheck_id} to {merge_id}; no assignee was set. Record the actual reviewer and result when it is complete."


def complete_merge_recheck(merge_id: str, recheck_id: str, reviewed_by: str, result: str, evidence_ids: list[str]) -> str:
    merge_path = SSOT / FILES["merges"]
    payload = read_json(merge_path)
    merge = next((item for item in payload.get("merges", []) if item["id"] == merge_id), None)
    if not merge:
        raise ValueError(f"알 수 없는 병합 레코드: {merge_id}")
    recheck = next((item for item in merge.get("rechecks", []) if item.get("id") == recheck_id), None)
    if not recheck:
        raise ValueError(f"{merge_id}에 {recheck_id} 재검토가 없습니다")
    participants = {item["id"] for item in read_json(SSOT / FILES["collaboration"]).get("participants", [])}
    if reviewed_by not in participants:
        raise ValueError(f"알 수 없는 수행자: {reviewed_by}")
    known_evidence = {item["id"] for item in read_json(SSOT / FILES["evidence"]).get("evidence", [])}
    unknown_evidence = sorted(set(evidence_ids) - known_evidence)
    if unknown_evidence:
        raise ValueError("알 수 없는 증거: " + ", ".join(unknown_evidence))
    if recheck.get("type") == "test" and not evidence_ids:
        raise ValueError("재테스트 완료에는 EVD 증거를 하나 이상 연결해야 합니다")
    recheck.update({
        "status": "completed",
        "reviewed_by": reviewed_by,
        "reviewed_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "result": result,
        "evidence": sorted(set(evidence_ids)),
    })
    write_json_atomic(merge_path, payload)
    return f"Completed {merge_id}/{recheck_id}; reviewer, time, result, and evidence were recorded."


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
    selected_profile = next(item for item in working.get("profiles", []) if item["id"] == selected_profile_id)
    if selected_profile.get("mode") == "team" and not any("PM" in item.get("roles", []) for item in active_people):
        raise ValueError("팀 프로필로 전환하려면 활성 참여자 중 최소 1명에게 PM 역할을 지정해야 합니다.")
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


def bootstrap_records(project_id: str, name: str, mode: str, source_location: str | None) -> dict[str, dict[str, Any]]:
    """Return deliberately sparse product records for the discovery starting point."""
    project = {
        "schema_version": 1,
        "project_id": project_id,
        "name": name,
        "introduction": "고객과 AI가 함께 소개를 정의할 제품",
        "overview": "착수 인터뷰에서 제품 범위와 현재 상태를 정리한다.",
        "intent": "사용자 문제와 기대 성과를 합의한 뒤 구현과 검증으로 연결한다.",
        "key_features": ["착수 인터뷰에서 주요 기능을 정의한다."],
        "vision": "고객과 AI가 함께 정의할 제품 비전",
        "problem": "착수 인터뷰에서 확인할 사용자 문제와 현재 제약",
        "phase": "bootstrap",
        "delivery_mode": mode,
        "quality_profile": "undecided",
        "customer_decision_owner": "프로젝트 책임자(미정)",
        "outcomes": [],
        "scope": {"in": [], "out": []},
        "sources": ["project-bootstrap"],
    }
    if source_location:
        project["existing_source"] = source_location
    empty_collections = {
        "requirements": ("requirements", {"storage": "module-sharded"}),
        "modules": ("modules", {}),
        "architecture": (None, {"principles": [], "components": [], "flows": [], "role_lenses": [], "quality_attributes": []}),
        "decisions": ("decisions", {}),
        "open_items": ("open_items", {}),
        "assumptions": ("assumptions", {}),
        "risks": ("risks", {}),
        "changes": ("changes", {}),
        "tests": ("test_cases", {}),
        "releases": ("releases", {}),
        "merges": ("merges", {}),
        "deliverables": ("deliverables", {}),
        "evidence": ("evidence", {}),
        "approvals": ("approvals", {}),
        "gate_runs": ("gate_runs", {}),
        "scenarios": (None, {"use_cases": [], "sequences": []}),
        "delivery_plan": (None, {"milestones": [], "work_items": [], "interfaces": [], "dependencies": []}),
        "guides": ("guides", {}),
        "foundation": (None, {"standards": [], "golden_paths": [], "exceptions": []}),
        "ui_system": (None, {"baselines": [], "patterns": [], "components": []}),
        "operations": ("runbooks", {}),
        "delivery_profiles": ("delivery_profiles", {}),
        "system_surfaces": (None, {"storage": "module-sharded", "surfaces": [], "legacy_plans": []}),
    }
    records: dict[str, dict[str, Any]] = {"project": project}
    for name, (collection, extras) in empty_collections.items():
        payload = {"schema_version": 1, **extras}
        if collection:
            payload[collection] = []
        records[name] = payload
    records["repository"] = {
        "schema_version": 1, "id": "RGP-001", "platform": "미정", "default_branch": "main",
        "status": "bootstrap", "workflow": ".github/workflows/aidd.yml", "ruleset": ".github/rulesets/main.json",
        "required_checks": [], "protections": [], "options": [], "remote_verification": {},
    }
    records["collaboration"] = {
        "schema_version": 1,
        "policy": {"id": "CBG-001", "title": "협업 프로필", "rule": "착수 인터뷰에서 협업 방식을 확정한다.", "current_profile": "CBP-SOLO"},
        "identity_policy": {"id": "IDP-001", "title": "신원 대조", "automatic_membership": False},
        "work_assignment_policy": {
            "mode": "pm_controlled", "delegates": [], "offline_coordination_required": False,
            "changed_at": "미정", "changed_by": "프로젝트 책임자(미정)",
            "reason": "1인 프로필에는 배정 제한이 없으며, 팀 전환 시 PM 배정을 기본으로 사용한다.",
        },
        "profiles": [], "participants": [], "identity_mappings": [], "identity_events": [], "transitions": [],
        "assignment_policy_events": [], "work_assignment_events": [],
    }
    records["deployment"] = {
        "schema_version": 1,
        "policy": {"id": "DPP-001", "title": "배포·운영 맥락 우선", "status": "draft"},
        "gate": {"id": "DG-001", "title": "배포·운영 맥락 확인", "status": "draft"},
        "profiles": [], "interview_dimensions": [], "risk_patterns": [],
    }
    records["technology"] = {
        "schema_version": 1,
        "policy": {"id": "TGP-001", "title": "기술 스택 선정", "status": "draft"},
        "gates": [], "baselines": [],
    }
    records["methodologies"] = {
        "schema_version": 1,
        "selection_policy": {"id": "MTP-001", "title": "방법론 선택", "status": "draft"},
        "profiles": [], "methods": [],
    }
    records["evaluations"] = {
        "schema_version": 1,
        "policy": {"id": "EVP-001", "title": "AI 수행 평가", "status": "draft"},
        "scenarios": [], "runs": [],
    }
    records["documentation"] = {
        "schema_version": 1,
        "policy": {
            "id": "DOC-STD-001", "status": "draft", "owner": "프로젝트 책임자(미정)",
            "agreement_gate": "기능 구현 전", "principles": [
                "Kit 서식은 예시이며 프로젝트 착수 시 사용자와 포맷을 합의한다.",
                "새 필수 항목은 같은 문서 유형 전체에 소급 적용한다.",
                "확인된 근거만 자동으로 채우고 나머지는 미작성·OI로 남긴다.",
            ],
        },
        "templates": [
            {
                "id": "DOC-REQ", "name": "기능 요건 정의서",
                "seed": ".ai/templates/artifact/feature-spec-workbook.md",
                "target_patterns": ["requirements.md", "modules/*.md"],
                "audience": "승인자와 구현·검증 AI", "status": "draft",
                "required_sections": [{"id": "overview", "title": "기능 개요와 범위", "fill_from": "project.introduction"}],
            },
            {
                "id": "DOC-SCR", "name": "화면 요구사항 정의서",
                "seed": ".ai/templates/artifact/screen-requirements-workbook.md",
                "target_patterns": ["ui/modules/*/requirements.md"],
                "audience": "사용자, UX 검토자와 구현·검증 AI", "status": "draft",
                "required_sections": [{"id": "context", "title": "업무 맥락·진입 조건·상태", "fill_from": None}],
            },
            {
                "id": "DOC-MAN", "name": "사용자 매뉴얼",
                "seed": ".ai/templates/artifact/user-manual-workbook.md",
                "target_patterns": ["user-manual.md", "manuals/**/*.md"],
                "audience": "실제 업무 사용자", "status": "draft",
                "required_sections": [{"id": "procedure", "title": "업무 절차와 예상 결과", "fill_from": None}],
            },
            {
                "id": "DOC-RUN", "name": "운영자 가이드·런북",
                "seed": ".ai/templates/artifact/runbook-workbook.md",
                "target_patterns": ["operator-guide.md", "operations/**/*.md"],
                "audience": "운영자와 지원 담당자", "status": "draft",
                "required_sections": [{"id": "procedure", "title": "절차·확인점·복구", "fill_from": None}],
            },
            {
                "id": "DOC-LEG", "name": "레거시 시스템 문서 현행화 계획",
                "seed": ".ai/templates/artifact/legacy-reconciliation-workbook.md",
                "target_patterns": ["legacy/**/*.md", "migration/**/*.md"],
                "audience": "사용자, 분석·설계·개발·검증 AI와 PM", "status": "draft",
                "required_sections": [
                    {"id": "inventory", "title": "모듈별 구현 표면과 기존 문서 인벤토리", "fill_from": "system-surfaces"},
                    {"id": "plan", "title": "변환·현행화 작업과 마감", "fill_from": "delivery-plan"},
                ],
            },
            {
                "id": "DOC-WRK", "name": "협업 작업 기록",
                "seed": ".ai/templates/artifact/daily-work-log.md",
                "target_patterns": ["work-log/**/*.md"],
                "audience": "프로젝트 팀, PM과 감사·인수 담당자", "status": "pilot",
                "required_sections": [{"id": "context", "title": "수행 맥락·결과·다음 행동", "fill_from": None}],
            },
        ],
    }
    records["system_surfaces"] = {
        "schema_version": 1,
        "storage": "module-sharded",
        "policy": {
            "id": "SFP-001",
            "title": "실행 표면과 문서 현행화 통제",
            "source_exclusions": ["project/src/README.md"],
            "rule": "화면·API·배치·이벤트·외부 연동 변경은 현재 문서 또는 고객이 선택한 후속 문서 작업과 연결한다.",
        },
        "surfaces": [],
        "legacy_plans": [],
    }
    records["workboard"] = {
        "schema_version": 1, "id": "WB-001", "title": "현재 작업 보드",
        "updated_at": "미정", "current_focus": [], "next_actions": [], "watch_items": [],
    }
    return records


def project_bootstrap(project_id: str, name: str, mode: str, source_location: str | None = None) -> str:
    """Create a product workspace from the Kit skeleton without overwriting data."""
    if is_kit_source():
        raise RuntimeError("kit-source에서는 project-bootstrap을 실행할 수 없습니다. 별도 폴더에 export 또는 new-project로 제품 작업공간을 만드세요.")
    if PROJECT.exists():
        raise RuntimeError("project/ 폴더가 이미 있습니다. 기존 제품 산출물을 보호하기 위해 덮어쓰지 않습니다.")
    if not PROJECT_SKELETON.is_dir():
        raise RuntimeError("새 프로젝트 정본 골격(.ai/templates/project-skeleton)을 찾을 수 없습니다.")
    safe_project_id = project_id.strip()
    safe_name = name.strip()
    if not safe_project_id or not safe_name:
        raise RuntimeError("--project-id와 --name은 비워 둘 수 없습니다.")
    try:
        shutil.copytree(PROJECT_SKELETON, PROJECT)
        SSOT.mkdir(parents=True, exist_ok=True)
        GENERATED.mkdir(parents=True, exist_ok=True)
        for record_name, filename in FILES.items():
            write_json_atomic(SSOT / filename, bootstrap_records(safe_project_id, safe_name, mode, source_location)[record_name])
        write_json_atomic(ROOT / ".aidd-role.json", product_workspace_role_record())
    except OSError as exc:
        raise RuntimeError(f"프로젝트 골격을 만들지 못했습니다: {exc}") from exc
    source_note = f" 기존 소스 위치: `{source_location}`." if source_location else ""
    return (
        f"`project/`에 {safe_name} 정본 골격을 만들고 역할을 `product-workspace`로 전환했습니다.{source_note}\n"
        "기존 소스와 문서를 자동으로 이동하거나 덮어쓰지 않았습니다. 첫 AI 대화에서 목적·범위·모듈·배포 맥락을 정의하고 "
        "`project/.aidd/ssot/project.json`의 phase를 `bootstrap`에서 다음 단계로 변경하세요."
    )


def project_reconcile_role() -> str:
    """Repair a legacy template marker only after validating an existing product workspace."""
    if is_kit_source():
        raise RuntimeError("kit-source에서는 project-reconcile-role을 실행할 수 없습니다.")
    if not PROJECT.is_dir():
        raise RuntimeError("project/ 폴더가 없어 역할을 정합화할 수 없습니다. 새 템플릿이면 project-bootstrap을 사용하세요.")
    role_path = ROOT / ".aidd-role.json"
    try:
        marker = read_json(role_path)
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"역할 표식을 읽을 수 없습니다: {exc}") from exc
    if marker.get("role") != "kit-template":
        raise RuntimeError("project-reconcile-role은 역할이 kit-template인 기존 작업공간에서만 실행할 수 있습니다.")
    try:
        data = load_records()
        errors, _warnings = validate(data, check_generated=False, check_adapters=False)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        raise RuntimeError(f"기존 제품 정본을 검증할 수 없습니다: {exc}") from exc
    if errors:
        raise RuntimeError("기존 제품 정본 검증에 실패해 역할을 바꾸지 않습니다: " + "; ".join(errors[:5]))
    write_json_atomic(role_path, product_workspace_role_record())
    return "유효한 기존 제품 정본을 확인하고 역할을 `kit-template`에서 `product-workspace`로 정합화했습니다."


def project_init_status() -> str:
    root = git_repository_root()
    if root is None:
        return (
            "# 프로젝트 초기화 상태\n\n- Git 저장소: 미초기화\n"
            "- 다음 명령: `python .ai/tools/aidd.py project-init`\n"
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
    product_state = "프로젝트 정본: 준비됨" if SSOT.is_dir() else "프로젝트 정본: 없음 (`project-bootstrap` 필요)"
    return (
        "# 프로젝트 초기화 상태\n\n"
        f"- Git 저장소: 준비됨 (`{root}`)\n- 현재 브랜치: `{current_git_branch() or '분리된 HEAD 또는 커밋 전'}`\n"
        f"- Git 훅 경로: `{hook_path or '미설정'}`\n"
        f"- {product_state}\n"
        "- 다음 단계: `.gitignore`·비밀정보 검토, 프로젝트 정본 착수, Git 신원 확인·IDM 등록, 최초 기준선 커밋\n"
    )


def run_hook(platform: str, event: str) -> int:
    role_path = ROOT / ".aidd-role.json"
    if event.lower() == "stop" and role_path.is_file():
        try:
            role = json.loads(role_path.read_text(encoding="utf-8")).get("role")
        except (OSError, json.JSONDecodeError):
            role = None
        if role == "kit-source":
            completed = subprocess.run(
                [sys.executable, str(ROOT / ".aidd-kit-dev" / "tools" / "kit.py"), "validate"],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            if completed.returncode:
                reason = (completed.stdout + completed.stderr).strip()
                print(json.dumps({"decision": "block", "reason": reason}, ensure_ascii=False))
            else:
                print("{}")
            return 0
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
    sub.add_parser("migrate-module-specs", help="move existing requirements into module-owned specification fragments")
    sub.add_parser("sync-ai", help="synchronize canonical skills to both agents and verify the harness")
    sub.add_parser("integration-status", help="report local Git integration state without network or merge actions")
    sub.add_parser("current-actor", help="resolve the current local Git identity to a verified AIDD participant or bot")
    assign_work_parser = sub.add_parser("assign-work", help="assign one work item to an active HUM participant")
    assign_work_parser.add_argument("--work", required=True, help="WRK-ID")
    assign_work_parser.add_argument("--participant", required=True, help="active HUM-ID")
    assign_work_parser.add_argument("--reason", required=True, help="assignment reason recorded in the collaboration audit history")
    work_check_parser = sub.add_parser("work-check", help="verify the current actor may start one assigned WRK item")
    work_check_parser.add_argument("--work", required=True, help="WRK-ID")
    assignment_policy_parser = sub.add_parser("set-assignment-policy", help="set PM, delegated, or offline self-assignment for team work packages")
    assignment_policy_parser.add_argument("--mode", choices=sorted(ASSIGNMENT_MODES), required=True)
    assignment_policy_parser.add_argument("--delegate", action="append", default=[], help="active HUM-ID; required only for delegated mode")
    assignment_policy_parser.add_argument("--reason", required=True, help="reason for changing the allocation mode")
    workload_parser = sub.add_parser("workload-coverage", help="verify that a change has complete work-package coverage before team allocation")
    workload_parser.add_argument("--change", required=True, help="CHG-ID")
    impact_parser = sub.add_parser("impact", help="show direct and transitive canonical-record impact")
    impact_parser.add_argument("--id", required=True, help="stable AIDD ID to analyze")
    document_impact_parser = sub.add_parser("document-impact", help="report documentation reconciliation candidates after source or SSOT edits")
    document_impact_parser.add_argument("--path", action="append", default=[], help="changed relative path; repeat when needed")
    documentation_check_parser = sub.add_parser("documentation-check", help="block staged product source without documentation or an approved follow-up WRK")
    documentation_check_parser.add_argument("--staged", action="store_true", help="inspect the Git index exactly as it will be committed")
    work_log_parser = sub.add_parser("record-work", help="append a concise daily work record in the verified Git actor's own file")
    work_log_parser.add_argument("--summary", required=True, help="what was done")
    work_log_parser.add_argument("--why", required=True, help="why it was needed")
    work_log_parser.add_argument("--result", required=True, help="what changed or was confirmed")
    work_log_parser.add_argument("--next", required=True, dest="next_step", help="next action or decision")
    work_log_parser.add_argument("--link", action="append", default=[], help="related stable ID; repeat when needed")
    work_log_parser.add_argument("--date", help="YYYY-MM-DD; defaults to today")
    status_parser = sub.add_parser("status", help="render current project status")
    status_parser.add_argument("--level", choices=("executive", "detail", "module"), default="executive")
    status_parser.add_argument("--module", help="module ID for --level module")
    add_module_parser = sub.add_parser("add-module", help="add a module catalog entry and an empty module specification fragment")
    add_module_parser.add_argument("--id", required=True, help="new module ID such as MOD-BILLING")
    add_module_parser.add_argument("--name", required=True, help="module name")
    add_module_parser.add_argument("--purpose", required=True, help="module responsibility")
    add_module_parser.add_argument("--dependency", action="append", default=[], help="existing MOD-ID dependency; repeat when needed")
    add_module_parser.add_argument("--status", choices=("planned", "in_progress", "blocked", "done"), default="planned")
    add_module_parser.add_argument("--with-ui", action="store_true", help="also create an optional empty UI specification fragment")
    init_ui_parser = sub.add_parser("init-module-ui", help="create an optional empty UI specification fragment for an existing module")
    init_ui_parser.add_argument("--module", required=True, help="existing module ID")
    init_surfaces_parser = sub.add_parser("init-module-surfaces", help="create an empty executable-surface inventory for an existing module")
    init_surfaces_parser.add_argument("--module", required=True, help="existing module ID")
    module_status_parser = sub.add_parser("module-status", help="update one module's independent progress status")
    module_status_parser.add_argument("--module", required=True, help="existing module ID")
    module_status_parser.add_argument("--status", choices=("planned", "in_progress", "blocked", "done"), required=True)
    assumption_parser = sub.add_parser("add-assumption", help="record an assumption with a mandatory confirmation gate")
    assumption_parser.add_argument("--id", required=True, help="new assumption ID such as ASM-001")
    assumption_parser.add_argument("--statement", required=True, help="assumption being made")
    assumption_parser.add_argument("--rationale", required=True, help="why this provisional assumption is reasonable")
    assumption_parser.add_argument("--due-gate", required=True, choices=("DG-001", "TG-001", "TG-002"))
    assumption_parser.add_argument("--module", action="append", default=[], help="affected MOD-ID; repeat when needed")
    assumption_parser.add_argument("--link", action="append", default=[], help="affected stable ID; repeat when needed")
    resolve_assumption_parser = sub.add_parser("resolve-assumption", help="confirm or invalidate an assumption without deleting its history")
    resolve_assumption_parser.add_argument("--id", required=True)
    resolve_assumption_parser.add_argument("--status", required=True, choices=("confirmed", "invalidated"))
    resolve_assumption_parser.add_argument("--resolution", required=True)
    merge_parser = sub.add_parser("record-merge", help="record HEAD when it is a merge commit")
    merge_parser.add_argument("squash", nargs="?", choices=("0", "1"), help="Git post-merge squash flag")
    assess_parser = sub.add_parser("assess-merge", help="complete impact assessment for a recorded merge")
    assess_parser.add_argument("--merge", required=True, help="merge record ID")
    assess_parser.add_argument("--modules", nargs="*", default=[], help="affected module IDs")
    assess_parser.add_argument("--notes", required=True, help="conflict-resolution and interaction notes")
    assess_parser.add_argument("--additional-testing", required=True, help="additional regression-test decision")
    recheck_parser = sub.add_parser("add-merge-recheck", help="add an unassigned post-merge review or retest")
    recheck_parser.add_argument("--merge", required=True, help="assessed merge record ID")
    recheck_parser.add_argument("--type", choices=("review", "test"), required=True, help="recheck kind")
    recheck_parser.add_argument("--title", required=True, help="scope and completion condition")
    recheck_parser.add_argument("--module", action="append", default=[], help="affected MOD-ID; repeat when needed")
    recheck_parser.add_argument("--test", action="append", default=[], help="target TC-ID; repeat when needed")
    recheck_parser.add_argument("--blocking", action="store_true", help="block release until this recheck is complete")
    complete_recheck_parser = sub.add_parser("complete-merge-recheck", help="record the completed post-merge review or retest")
    complete_recheck_parser.add_argument("--merge", required=True, help="merge record ID")
    complete_recheck_parser.add_argument("--recheck", required=True, help="MRC-ID")
    complete_recheck_parser.add_argument("--reviewed-by", required=True, help="HUM-ID of the actual reviewer")
    complete_recheck_parser.add_argument("--result", required=True, help="review or test result and handling")
    complete_recheck_parser.add_argument("--evidence", action="append", default=[], help="EVD-ID; repeat when needed")
    sub.add_parser("install-hooks", help="configure this Git repository to use .githooks")
    sub.add_parser("project-init", help="initialize a safe local Git foundation without staging or committing files")
    sub.add_parser("project-init-status", help="show local Git initialization and hook status")
    bootstrap_parser = sub.add_parser("project-bootstrap", help="create an empty product workspace from the AIDD Kit skeleton")
    bootstrap_parser.add_argument("--project-id", required=True, help="stable project identifier, such as CRM-PORTAL")
    bootstrap_parser.add_argument("--name", required=True, help="product name")
    bootstrap_parser.add_argument("--mode", choices=("greenfield", "existing-system"), default="greenfield")
    bootstrap_parser.add_argument("--source-location", help="current location of existing source; records only, does not move files")
    sub.add_parser("project-reconcile-role", help="reconcile a legacy kit-template marker after validating an existing product workspace")
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
        try:
            sync_ai()
        except (OSError, RuntimeError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        print("Synchronized canonical skills and verified the agent harness.")
        return 0
    if args.command == "migrate-module-specs":
        try:
            print(migrate_requirements_to_module_specs())
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "add-module":
        try:
            print(add_module(args.id, args.name, args.purpose, args.dependency, args.status, args.with_ui))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "init-module-ui":
        try:
            print(init_module_ui(args.module))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "init-module-surfaces":
        try:
            print(init_module_surfaces(args.module))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "module-status":
        try:
            print(update_module_status(args.module, args.status))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "add-assumption":
        try:
            print(add_assumption(args.id, args.statement, args.rationale, args.due_gate, args.module, args.link))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "resolve-assumption":
        try:
            print(resolve_assumption(args.id, args.status, args.resolution))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
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
    if args.command == "add-merge-recheck":
        try:
            print(add_merge_recheck(args.merge, args.type, args.title, args.module, args.test, args.blocking))
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "complete-merge-recheck":
        try:
            print(complete_merge_recheck(args.merge, args.recheck, args.reviewed_by, args.result, args.evidence))
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
    if args.command == "project-bootstrap":
        try:
            print(project_bootstrap(args.project_id, args.name, args.mode, args.source_location))
        except RuntimeError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "project-reconcile-role":
        try:
            print(project_reconcile_role())
        except RuntimeError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "project-init-status":
        print(project_init_status())
        return 0
    if args.command == "integration-status":
        print(integration_status())
        return 0
    if args.command == "hook":
        return run_hook(args.platform, args.event)
    if args.command == "documentation-check":
        if not args.staged:
            print("ERROR: documentation-check currently requires --staged", file=sys.stderr)
            return 2
        report, blockers = staged_documentation_check_text()
        print(report)
        for blocker in blockers:
            print(f"BLOCKER: {blocker}")
        return 1 if blockers else 0
    try:
        data = load_records()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: unable to load canonical records: {exc}", file=sys.stderr)
        return 2
    if args.command == "generate":
        if is_bootstrap_project(data):
            print("ERROR: 프로젝트가 bootstrap 상태입니다. 정본을 채우고 phase를 다음 단계로 변경한 뒤 문서를 생성하세요.", file=sys.stderr)
            return 2
        generate(data)
        print(f"Generated {len(render_documents(data))} documents in {GENERATED.relative_to(ROOT)}.")
        return 0
    if args.command == "document-impact":
        print(document_impact_text(data, args.path))
        return 0
    if args.command == "current-actor":
        try:
            print(current_actor_text(data))
        except ValueError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "assign-work":
        try:
            print(assign_work(data, args.work, args.participant, args.reason))
        except (OSError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "set-assignment-policy":
        try:
            print(update_work_assignment_policy(data, args.mode, args.delegate, args.reason))
        except (OSError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "workload-coverage":
        try:
            report, blockers = workload_coverage_text(data, args.change)
            print(report)
        except ValueError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 1 if blockers else 0
    if args.command == "work-check":
        try:
            print(work_assignment_check_text(data, args.work))
        except (OSError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "record-work":
        try:
            print(record_work_log(data, args.summary, args.why, args.result, args.next_step, args.link, args.date))
        except (OSError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "status":
        if is_bootstrap_project(data):
            print(bootstrap_status_text(data))
            return 0
        if args.level == "module" and not args.module:
            parser.error("--module is required with --level module")
        try:
            print(status_text(data, args.level, args.module))
        except ValueError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        return 0
    if args.command == "impact":
        try:
            print(impact_text(data, args.id))
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
    if args.command == "evaluation-status":
        print(table(["시나리오", "제목", "플랫폼", "실행 상태"], evaluation_coverage(data)))
        return 0
    if args.command == "collaboration-status":
        if is_bootstrap_project(data):
            print(bootstrap_status_text(data))
            return 0
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
