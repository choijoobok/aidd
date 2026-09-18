#!/usr/bin/env python3
"""Build and validate AIDD Kit distributions without coupling project histories."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT / ".aidd-kit-dev"
MANIFEST_PATH = DEV / "export-manifest.json"
ROLE_PATH = ROOT / ".aidd-role.json"
IGNORED_PARTS = {"__pycache__", ".pytest_cache"}

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


def included(path: Path) -> bool:
    return not any(part in IGNORED_PARTS for part in path.parts) and path.suffix not in {".pyc", ".pyo"}


def copy_entry(source: Path, target: Path) -> None:
    if not source.exists():
        raise RuntimeError(f"export source missing: {source.relative_to(ROOT).as_posix()}")
    if source.is_file():
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        return
    for item in sorted(source.rglob("*"), key=lambda value: value.as_posix()):
        relative = item.relative_to(source)
        if not included(relative):
            continue
        destination = target / relative
        if item.is_dir():
            destination.mkdir(parents=True, exist_ok=True)
        elif item.is_file():
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, destination)


def replace_tree(source: Path, target: Path) -> None:
    if target.exists():
        shutil.rmtree(target)
    copy_entry(source, target)


def git_value(*args: str) -> str | None:
    completed = subprocess.run(
        ["git", *args], cwd=ROOT, check=False, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    return completed.stdout.strip() if completed.returncode == 0 else None


def file_manifest(root: Path, excluded: set[str] | None = None) -> list[dict[str, str]]:
    excluded = excluded or set()
    result: list[dict[str, str]] = []
    for path in sorted((item for item in root.rglob("*") if item.is_file()), key=lambda value: value.as_posix()):
        relative = path.relative_to(root).as_posix()
        if relative in excluded:
            continue
        result.append({"path": relative, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    return result


def aggregate_hash(files: list[dict[str, str]]) -> str:
    digest = hashlib.sha256()
    for item in files:
        digest.update(item["path"].encode("utf-8"))
        digest.update(b"\0")
        digest.update(item["sha256"].encode("ascii"))
        digest.update(b"\n")
    return digest.hexdigest()


def role_record(role: str) -> dict[str, Any]:
    return {"schema_version": 1, "role": role, "managed_by": "AIDD Kit export/bootstrap", "mutable_by_user": False}


def origin_record(stage: Path, manifest: dict[str, Any]) -> dict[str, Any]:
    payload = file_manifest(stage, {".aidd-kit-origin.json"})
    status = git_value("status", "--porcelain")
    return {
        "schema_version": 1,
        "purpose": "provenance-only",
        "upgrade_contract": "none",
        "kit_version": manifest["kit_version"],
        "source_commit": git_value("rev-parse", "HEAD") or "uncommitted",
        "source_dirty": bool(status),
        "export_manifest_sha256": hashlib.sha256(MANIFEST_PATH.read_bytes()).hexdigest(),
        "payload_sha256": aggregate_hash(payload),
    }


def skill_files(root: Path) -> dict[str, str]:
    if not root.is_dir():
        return {}
    return {
        path.relative_to(root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in root.rglob("*")
        if path.is_file() and included(path.relative_to(root))
    }


def merged_skill_root(stage: Path) -> Path:
    merged = stage / "skills"
    copy_entry(ROOT / ".ai" / "skills", merged)
    maintainer = DEV / "skills"
    if maintainer.is_dir():
        for child in sorted(maintainer.iterdir(), key=lambda value: value.name):
            destination = merged / child.name
            if destination.exists():
                raise RuntimeError(f"maintainer skill collides with portable skill: {child.name}")
            copy_entry(child, destination)
    return merged


def sync_providers() -> None:
    with tempfile.TemporaryDirectory(prefix="aidd-kit-skills-") as temporary:
        merged = merged_skill_root(Path(temporary))
        for target in (ROOT / ".agents" / "skills", ROOT / ".claude" / "skills"):
            replace_tree(merged, target)


def assemble(stage: Path, role: str, project: dict[str, str] | None = None) -> None:
    manifest = load_json(MANIFEST_PATH)
    for entry in manifest["entries"]:
        copy_entry(ROOT / entry["source"], stage / entry["target"])
    for target in (stage / ".agents" / "skills", stage / ".claude" / "skills"):
        replace_tree(stage / ".ai" / "skills", target)
    write_json(stage / ".aidd-role.json", role_record("kit-template"))
    if project:
        command = [
            sys.executable,
            str(stage / ".ai" / "tools" / "aidd.py"),
            "project-bootstrap",
            "--project-id",
            project["project_id"],
            "--name",
            project["name"],
            "--mode",
            project["mode"],
        ]
        if project.get("source_location"):
            command.extend(["--source-location", project["source_location"]])
        completed = subprocess.run(command, cwd=stage, check=False, capture_output=True, text=True, encoding="utf-8")
        if completed.returncode:
            raise RuntimeError((completed.stdout + completed.stderr).strip())
        write_json(stage / ".aidd-role.json", role_record("product-workspace"))
    elif role != "kit-template":
        raise RuntimeError(f"unsupported assembled role: {role}")
    write_json(stage / ".aidd-kit-origin.json", origin_record(stage, manifest))
    errors = validate_export_tree(stage, expect_project=bool(project))
    if errors:
        raise RuntimeError("invalid export:\n- " + "\n- ".join(errors))


def validate_export_tree(root: Path, expect_project: bool) -> list[str]:
    errors: list[str] = []
    manifest = load_json(MANIFEST_PATH)
    files = [path.relative_to(root).as_posix() for path in root.rglob("*") if path.is_file()]
    for prefix in manifest.get("forbidden_prefixes", []):
        normalized = prefix.rstrip("/")
        if any(path == normalized or path.startswith(normalized + "/") for path in files):
            errors.append(f"forbidden export prefix found: {prefix}")
    if not expect_project:
        for prefix in manifest.get("template_forbidden_prefixes", []):
            normalized = prefix.rstrip("/")
            if any(path == normalized or path.startswith(normalized + "/") for path in files):
                errors.append(f"forbidden template prefix found: {prefix}")
    for name in manifest.get("forbidden_names", []):
        if any(name in Path(path).parts for path in files):
            errors.append(f"forbidden export name found: {name}")
    for required in (
        "AGENTS.md",
        ".ai/spec/index.md",
        ".ai/docs/guides/project-team-guide.md",
        ".aidd-role.json",
        ".aidd-kit-origin.json",
    ):
        if not (root / required).is_file():
            errors.append(f"required export file missing: {required}")
    expected_role = "product-workspace" if expect_project else "kit-template"
    try:
        if load_json(root / ".aidd-role.json").get("role") != expected_role:
            errors.append(f"role marker must be {expected_role}")
    except Exception as exc:
        errors.append(f"role marker invalid: {exc}")
    if expect_project and not (root / "project" / ".aidd" / "ssot" / "project.json").is_file():
        errors.append("new-project output has no product SSOT")
    if not expect_project and (root / "project").exists():
        errors.append("template export unexpectedly contains project/")
    portable = skill_files(root / ".ai" / "skills")
    for provider in (root / ".agents" / "skills", root / ".claude" / "skills"):
        if skill_files(provider) != portable:
            errors.append(f"provider skill drift: {provider.relative_to(root).as_posix()}")
    return errors


def validate_source() -> list[str]:
    errors: list[str] = []
    try:
        active_change = load_json(DEV / "repository.json").get("active_change")
        if not isinstance(active_change, str) or not (DEV / "changes" / f"{active_change}.json").is_file():
            errors.append("repository active_change must identify an existing .aidd-kit-dev/changes/KIT-CHG-*.json file")
    except Exception as exc:
        errors.append(f"repository metadata invalid: {exc}")
    try:
        if load_json(ROLE_PATH).get("role") != "kit-source":
            errors.append("root .aidd-role.json must declare kit-source")
    except Exception as exc:
        errors.append(f"root role marker invalid: {exc}")
    if (ROOT / "project").exists():
        errors.append("kit-source root must not contain product project/")
    for required in (
        ROOT / ".ai" / "spec" / "index.md",
        ROOT / ".ai" / "docs" / "guides" / "project-team-guide.md",
        DEV / "guides" / "kit-maintainer-guide.md",
        DEV / "skills" / "aidd-kit-release" / "SKILL.md",
        DEV / "export" / "AGENTS.md",
    ):
        if not required.is_file():
            errors.append(f"required source file missing: {required.relative_to(ROOT).as_posix()}")
    portable = skill_files(ROOT / ".ai" / "skills")
    maintainer = skill_files(DEV / "skills")
    overlap = sorted(set(portable) & set(maintainer))
    if overlap:
        errors.append(f"maintainer and portable skill paths collide: {overlap}")
    expected_skills = {**portable, **maintainer}
    for provider in (ROOT / ".agents" / "skills", ROOT / ".claude" / "skills"):
        if skill_files(provider) != expected_skills:
            errors.append(f"source provider skill drift: {provider.relative_to(ROOT).as_posix()}")
    try:
        with tempfile.TemporaryDirectory(prefix="aidd-kit-validate-") as temporary:
            stage = Path(temporary) / "template"
            stage.mkdir()
            assemble(stage, "kit-template")
    except Exception as exc:
        errors.append(str(exc))
    return errors


def write_zip(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted((item for item in source.rglob("*") if item.is_file()), key=lambda value: value.as_posix()):
            relative = path.relative_to(source).as_posix()
            info = zipfile.ZipInfo(relative, (1980, 1, 1, 0, 0, 0))
            executable = relative.startswith(".githooks/") or path.suffix in {".sh"}
            info.external_attr = ((0o755 if executable else 0o644) & 0xFFFF) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, path.read_bytes())


def deliver(stage: Path, directory: str | None, archive: str | None) -> Path:
    destination = Path(directory or archive or "").expanduser().resolve()
    if destination.exists():
        raise RuntimeError(f"output already exists; refusing to overwrite: {destination}")
    if directory:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(stage, destination)
    else:
        write_zip(stage, destination)
    return destination


def add_output(parser: argparse.ArgumentParser) -> None:
    output = parser.add_mutually_exclusive_group(required=True)
    output.add_argument("--directory")
    output.add_argument("--zip", dest="archive")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="AIDD Kit source lifecycle and export tool")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("status")
    sub.add_parser("validate")
    sub.add_parser("sync-providers")
    export = sub.add_parser("export")
    add_output(export)
    project = sub.add_parser("new-project")
    add_output(project)
    project.add_argument("--project-id", required=True)
    project.add_argument("--name", required=True)
    project.add_argument("--mode", choices=("greenfield", "existing-system"), default="greenfield")
    project.add_argument("--source-location")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "status":
        repository = load_json(DEV / "repository.json")
        change_id = repository.get("active_change", "KIT-CHG-001")
        change = load_json(DEV / "changes" / f"{change_id}.json")
        print("# AIDD Kit 관리 상태")
        print(f"- 역할: `{load_json(ROLE_PATH)['role']}`")
        print(f"- 버전: `{repository['current_version']}`")
        print(f"- 현재 변경: `{change['id']}` · {change['status']}")
        print("- 배포: 허용 목록 기반 directory/zip, 자동 업그레이드·역동기화 없음")
        return 0
    if args.command == "sync-providers":
        sync_providers()
        print("portable 스킬과 Kit 관리 스킬을 원본 provider 어댑터에 동기화했습니다.")
        return 0
    if args.command == "validate":
        errors = validate_source()
        if errors:
            print("Kit validation failed:\n- " + "\n- ".join(errors), file=sys.stderr)
            return 1
        print("AIDD Kit source and export boundary validation passed")
        return 0
    project = None
    role = "kit-template"
    if args.command == "new-project":
        project = {
            "project_id": args.project_id,
            "name": args.name,
            "mode": args.mode,
            "source_location": args.source_location or "",
        }
        role = "product-workspace"
    try:
        with tempfile.TemporaryDirectory(prefix="aidd-kit-export-") as temporary:
            stage = Path(temporary) / "payload"
            stage.mkdir()
            assemble(stage, role, project)
            destination = deliver(stage, args.directory, args.archive)
        print(f"AIDD {role} created: {destination}")
        return 0
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
