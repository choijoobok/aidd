#!/usr/bin/env python3
"""Provider-neutral AIDD hook guard and harness self-test.

Pre-tool checks fail closed when their own policy/input cannot be evaluated. Session
briefing and self-test hooks are advisory and never replace OS permissions, CI, or
remote branch protection.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = ROOT / ".ai" / "hooks" / "policy.json"
CONTRACT_PATH = ROOT / ".ai" / "hooks" / "contract.json"
FALLBACK_RECOVERY_PATHS = {
    ".ai/hooks/policy.json",
    ".ai/hooks/contract.json",
    ".ai/hooks/README.md",
    ".ai/tools/aidd_hook.py",
    ".claude/settings.json",
    ".codex/hooks.json",
    ".ai/tests/test_harness.py",
}


def repository_role() -> str:
    try:
        return load_json_without_duplicate_keys(ROOT / ".aidd-role.json").get("role", "product-workspace")
    except Exception:
        return "product-workspace"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def emit_deny(reason: str) -> int:
    payload = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    return 0


def emit_warning(message: str) -> int:
    payload = {
        "systemMessage": message,
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": message,
        },
    }
    sys.stdout.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    return 0


def load_json_without_duplicate_keys(path: Path) -> Any:
    def reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        value: dict[str, Any] = {}
        for key, item in pairs:
            if key in value:
                raise ValueError(f"duplicate JSON key: {key}")
            value[key] = item
        return value

    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=reject_duplicates)


def load_policy() -> dict[str, Any]:
    value = load_json_without_duplicate_keys(POLICY_PATH)
    if value.get("version") != 1:
        raise ValueError("unsupported hook policy version")
    for key in ("generated_roots", "destructive_command_patterns", "shell_write_patterns"):
        if not isinstance(value.get(key), list):
            raise ValueError(f"policy field {key} must be a list")
    return value


def load_contract() -> dict[str, Any]:
    value = load_json_without_duplicate_keys(CONTRACT_PATH)
    if value.get("version") != 1 or not isinstance(value.get("events"), dict):
        raise ValueError("unsupported or malformed hook contract")
    if not isinstance(value.get("recovery_paths"), list):
        raise ValueError("contract field recovery_paths must be a list")
    log = value.get("local_conversation_log")
    if not isinstance(log, dict) or not isinstance(log.get("root"), str) or not isinstance(log.get("date_format"), str):
        raise ValueError("contract field local_conversation_log is malformed")
    return value


def read_input() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        raise ValueError("hook input is empty")
    value = json.loads(raw)
    if not isinstance(value, dict):
        raise ValueError("hook input must be a JSON object")
    return value


def tool_input(payload: dict[str, Any]) -> dict[str, Any]:
    for key in ("tool_input", "toolInput", "input", "arguments"):
        value = payload.get(key)
        if isinstance(value, dict):
            return value
    return payload


def tool_name(payload: dict[str, Any]) -> str:
    for key in ("tool_name", "toolName", "tool"):
        value = payload.get(key)
        if isinstance(value, str):
            return value
        if isinstance(value, dict) and isinstance(value.get("name"), str):
            return value["name"]
    return "unknown"


def scalar_strings(value: Any, keys: set[str]) -> Iterable[str]:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in keys and isinstance(child, str):
                yield child
            elif isinstance(child, (dict, list)):
                yield from scalar_strings(child, keys)
    elif isinstance(value, list):
        for child in value:
            yield from scalar_strings(child, keys)


def normalized_repo_path(raw: str) -> str | None:
    text = raw.strip().strip("'\"").replace("\\", "/")
    if not text:
        return None
    candidate = Path(text)
    if not candidate.is_absolute():
        candidate = ROOT / candidate
    try:
        return candidate.resolve(strict=False).relative_to(ROOT).as_posix()
    except (OSError, ValueError):
        return None


def target_paths(payload: dict[str, Any]) -> set[str]:
    data = tool_input(payload)
    keys = {
        "file_path",
        "filePath",
        "filename",
        "path",
        "uri",
        "target",
        "target_path",
        "destination",
        "destination_path",
        "new_path",
    }
    found = {path for raw in scalar_strings(data, keys) if (path := normalized_repo_path(raw))}
    # Codex apply_patch sends the patch body as tool_input.command. Other
    # providers use patch, patch_text, or input.
    for patch in scalar_strings(data, {"command", "patch", "patch_text", "input"}):
        for match in re.finditer(r"^\*\*\* (?:Add|Update|Delete) File:\s*(.+?)\s*$", patch, re.MULTILINE):
            if path := normalized_repo_path(match.group(1)):
                found.add(path)
    return found


def command_text(payload: dict[str, Any]) -> str:
    data = tool_input(payload)
    values = list(scalar_strings(data, {"command", "cmd", "script", "code"}))
    return "\n".join(values).strip()


def under(path: str, root: str) -> bool:
    lhs = path.casefold().strip("/")
    rhs = root.replace("\\", "/").casefold().strip("/")
    return lhs == rhs or lhs.startswith(rhs + "/")


def is_recovery_path(path: str) -> bool:
    return path.casefold() in {item.casefold() for item in FALLBACK_RECOVERY_PATHS}


def shell_write_targets(command: str) -> set[str]:
    """Best-effort targets for common write commands; policy fallback remains fail-safe."""
    found: set[str] = set()

    def add(raw: str) -> None:
        if path := normalized_repo_path(raw):
            found.add(path)

    token = r"(?:'([^']+)'|\"([^\"]+)\"|([^\s;|]+))"
    for match in re.finditer(r"(?:^|\s)(?:>>?|\|\s*tee)\s*" + token, command):
        add(next(value for value in match.groups() if value is not None))
    for match in re.finditer(r"\btee\b(?:\s+-[A-Za-z]+)*\s+" + token, command, re.IGNORECASE):
        add(next(value for value in match.groups() if value is not None))
    powershell = r"(?:Set-Content|Add-Content|Out-File|New-Item)"
    for match in re.finditer(r"\b" + powershell + r"\b\s+" + token, command, re.IGNORECASE):
        add(next(value for value in match.groups() if value is not None))
    for match in re.finditer(r"\b(?:Copy-Item|Move-Item|cp|mv)\b\s+" + token + r"\s+" + token, command, re.IGNORECASE):
        groups = [value for value in match.groups() if value is not None]
        add(groups[-1])
    for match in re.finditer(r"\bsed\b[^\r\n;|]*?\s-i(?:\S*)?\s+.*?\s+" + token, command, re.IGNORECASE):
        add(next(value for value in match.groups() if value is not None))
    return found


def recovery_allowed(kind: str, payload: dict[str, Any]) -> bool:
    paths = target_paths(payload) if kind == "file" else set()
    return bool(paths) and all(is_recovery_path(path) for path in paths)


def protect(kind: str) -> int:
    try:
        payload = read_input()
    except Exception as exc:
        return emit_deny(f"AIDD 사전 보호 내부 실패: {type(exc).__name__}: {exc}")
    try:
        policy = load_policy()
        load_contract()
        name = tool_name(payload)
        if kind == "file":
            paths = target_paths(payload)
            # This entry point is wired only to write-capable tools. Unknown
            # provider/MCP schemas must fail closed instead of bypassing the
            # generated-file guard.
            if not paths:
                return emit_deny(f"{name} 대상 경로를 해석할 수 없어 사전 보호가 차단했습니다.")
            blocked = sorted(
                path
                for path in paths
                if any(under(path, root) for root in policy["generated_roots"])
            )
            if blocked:
                return emit_deny(
                    "파생 산출물은 직접 수정할 수 없습니다: "
                    + ", ".join(blocked)
                    + ". project/.aidd/ssot 또는 .ai 정본을 수정하고 generate/sync-ai를 실행하세요."
                )
        elif kind == "shell":
            command = command_text(payload)
            if not command:
                return emit_deny(f"{name} 명령 문자열을 해석할 수 없어 사전 보호가 차단했습니다.")
            for pattern in policy["destructive_command_patterns"]:
                if re.search(pattern, command, re.IGNORECASE):
                    return emit_deny(
                        "되돌리기 어렵거나 외부 상태를 바꾸는 명령은 훅에서 차단했습니다. "
                        "정확한 대상, 롤백과 고객 승인을 확인한 별도 경로를 사용하세요."
                    )
            normalized = command.replace("\\", "/").casefold()
            writes = any(re.search(pattern, command, re.IGNORECASE) for pattern in policy["shell_write_patterns"])
            targets = shell_write_targets(command)
            target_hits_generated = any(
                any(under(path, root) for root in policy["generated_roots"])
                for path in targets
            )
            if writes and (target_hits_generated or any(root.casefold() in normalized for root in policy["generated_roots"])):
                return emit_deny(
                    "셸을 통한 파생 산출물 직접 쓰기는 차단했습니다. 정본을 수정하고 생성 명령을 사용하세요."
                )
        else:
            raise ValueError(f"unknown protection kind: {kind}")
        return 0
    except Exception as exc:  # pre-tool must fail closed
        if recovery_allowed(kind, payload):
            # A broken policy/contract must be repairable, but only through the
            # small runtime allow-list. It never overrides a normal policy deny.
            return 0
        return emit_deny(f"AIDD 사전 보호 내부 실패: {type(exc).__name__}: {exc}")


def redact_conversation(text: str) -> str:
    redacted = text
    patterns = (
        (r"\b(?:sk|rk|pk)-[A-Za-z0-9_-]{16,}\b", "[REDACTED_API_KEY]"),
        (r"\b(?:ghp|github_pat)_[A-Za-z0-9_]{16,}\b", "[REDACTED_GIT_TOKEN]"),
        (r"(?i)(bearer\s+)[A-Za-z0-9._~+/-]{12,}", r"\1[REDACTED]"),
        (r"(?i)((?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*)[^\s'\"]+", r"\1[REDACTED]"),
    )
    for pattern, replacement in patterns:
        redacted = re.sub(pattern, replacement, redacted)
    return redacted


def conversation_text(payload: dict[str, Any], role: str) -> str | None:
    keys = (
        ("prompt", "user_prompt", "userPrompt", "message", "text")
        if role == "user"
        else ("last_assistant_message", "assistant_message", "assistantMessage", "response", "output", "text")
    )
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value
    data = tool_input(payload)
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return None


def local_log(platform: str, role: str) -> int:
    """Advisory local-only transcript logging. Never surface content to the model."""
    if os.environ.get("AIDD_LOCAL_CONVERSATION_LOG") == "0":
        return 0
    try:
        payload = read_input()
        content = conversation_text(payload, role)
        if not content:
            return 0
        contract = load_contract()
        settings = contract["local_conversation_log"]
        relative = normalized_repo_path(settings["root"])
        if not relative or relative != "chat-history":
            return 0
        # The folder and the visible timestamp must use the same local calendar
        # day.  A UTC date near midnight would otherwise create a misleading file.
        now = datetime.now().astimezone()
        date_path = now.strftime(settings["date_format"])
        if "/" not in date_path or not date_path.endswith(".md"):
            return 0
        log_path = ROOT / relative / date_path
        max_chars = int(settings.get("max_entry_chars", 16000))
        max_bytes = int(settings.get("max_daily_file_bytes", 5242880))
        content = redact_conversation(content)
        truncated = len(content) > max_chars
        if truncated:
            content = content[:max_chars] + "\n[TRUNCATED]"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        if log_path.exists() and log_path.stat().st_size >= max_bytes:
            return 0
        header = f"# {now.strftime('%Y-%m-%d')} 대화 원문\n\n" if not log_path.exists() else ""
        role_name = "사용자" if role == "user" else "AI"
        entry = f"## {now.strftime('%H:%M:%S')} · {platform} · {role_name}\n\n{content}\n\n---\n\n"
        with log_path.open("a", encoding="utf-8", newline="\n") as handle:
            handle.write(header + entry)
    except Exception:
        # Logging cannot break a conversation or expose its content through errors.
        return 0
    return 0


def post_check() -> int:
    """Advisory drift check after a write; failures become warnings, never denial."""
    try:
        payload = read_input()
        paths = target_paths(payload)
        if not paths:
            paths = shell_write_targets(command_text(payload))
        warnings: list[str] = []
        if any(under(path, ".ai") for path in paths):
            errors = harness_errors()
            if errors:
                sync_command = (
                    "python .aidd-kit-dev/tools/kit.py sync-providers"
                    if repository_role() == "kit-source"
                    else "python .ai/tools/aidd.py sync-ai"
                )
                warnings.append(
                    "공통 AI 정본 변경 뒤 provider 파생물이 어긋났습니다. "
                    f"{sync_command}를 실행하세요. " + "; ".join(errors[:5])
                )
        if repository_role() == "kit-source" and any(
            under(path, ".ai") or under(path, ".aidd-kit-dev") for path in paths
        ):
            code, output = run_kit("validate")
            if code:
                warnings.append("Kit 명세·export 경계 검증 경고:\n" + output[:4000])
        source_paths = sorted(path for path in paths if under(path, "project/src"))
        if source_paths:
            code, output = run_aidd(*sum((["document-impact", "--path", path] for path in source_paths), []))
            message = "소스 변경 뒤 문서 현행화 후보를 감지했습니다. python .ai/tools/aidd.py document-impact로 범위를 확인하고, 구현 사실과 정본의 의미가 자동으로 같다고 가정하지 마세요.\n" + output[:4000]
            warnings.append(message if not code else "문서 현행화 후보 조회 경고:\n" + message)
        if any(under(path, "project/.aidd/ssot") for path in paths):
            code, output = run_aidd("validate")
            if code:
                warnings.append("AIDD 정본 변경 후 validate 경고:\n" + output[:4000])
        if warnings:
            return emit_warning("\n\n".join(warnings))
        return 0
    except Exception as exc:
        return emit_warning(f"AIDD 사후 검사 내부 경고: {type(exc).__name__}: {exc}")


def run_aidd(*args: str) -> tuple[int, str]:
    completed = subprocess.run(
        [sys.executable, str(ROOT / ".ai" / "tools" / "aidd.py"), *args],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=20,
    )
    output = (completed.stdout + completed.stderr).strip()
    return completed.returncode, output


def run_kit(*args: str) -> tuple[int, str]:
    completed = subprocess.run(
        [sys.executable, str(ROOT / ".aidd-kit-dev" / "tools" / "kit.py"), *args],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=30,
    )
    output = (completed.stdout + completed.stderr).strip()
    return completed.returncode, output


def session_brief() -> int:
    if repository_role() == "kit-source":
        sections = ["# AIDD Kit 관리 세션 브리핑"]
        try:
            code, output = run_kit("status")
            if output:
                sections.append(output[:5000])
            if code:
                sections.append(f"Kit 상태 조회 실패(exit {code}); 관리 가이드를 확인하세요.")
        except Exception as exc:
            sections.append(f"Kit 상태 조회 중 경고: {type(exc).__name__}: {exc}")
        sys.stdout.write("\n\n".join(sections)[:9000])
        return 0
    sections: list[str] = ["# AIDD 세션 브리핑"]
    for title, args in (
        ("현재 작업자", ("current-actor",)),
        ("프로젝트", ("status", "--level", "executive")),
        ("통합", ("integration-status",)),
        ("협업", ("collaboration-status",)),
        ("AI 평가", ("evaluation-status",)),
    ):
        try:
            code, output = run_aidd(*args)
            if output:
                sections.append(f"\n## {title}\n{output[:3500]}")
            if code:
                sections.append(f"\n- {title} 조회 실패(exit {code}); 작업 전에 직접 확인하세요.")
        except Exception as exc:  # advisory hook is fail open
            sections.append(f"\n- {title} 조회 중 경고: {type(exc).__name__}: {exc}")
    sys.stdout.write("\n".join(sections)[:9000])
    return 0


def file_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def skill_manifest_errors(
    common_files: dict[str, str], provider_files: dict[str, str], provider_label: str
) -> list[str]:
    errors = [
        f"skill missing: {provider_label}/{rel}"
        for rel in sorted(common_files.keys() - provider_files.keys())
    ]
    errors.extend(
        f"stale provider skill: {provider_label}/{rel}"
        for rel in sorted(provider_files.keys() - common_files.keys())
    )
    errors.extend(
        f"skill drift: {provider_label}/{rel}"
        for rel in sorted(common_files.keys() & provider_files.keys())
        if common_files[rel] != provider_files[rel]
    )
    return errors


def skill_tree_errors(common_root: Path, provider_root: Path) -> list[str]:
    if not common_root.is_dir():
        return [f"canonical skill root missing: {common_root.relative_to(ROOT).as_posix()}"]
    if not provider_root.is_dir():
        return [f"provider skill root missing: {provider_root.relative_to(ROOT).as_posix()}"]

    common_files = {
        path.relative_to(common_root).as_posix(): file_digest(path)
        for path in common_root.rglob("*")
        if path.is_file()
    }
    provider_files = {
        path.relative_to(provider_root).as_posix(): file_digest(path)
        for path in provider_root.rglob("*")
        if path.is_file()
    }
    provider_label = provider_root.relative_to(ROOT).as_posix()
    return skill_manifest_errors(common_files, provider_files, provider_label)


def harness_errors() -> list[str]:
    errors: list[str] = []
    try:
        policy = load_policy()
        for key in ("destructive_command_patterns", "shell_write_patterns"):
            for pattern in policy[key]:
                re.compile(pattern, re.IGNORECASE)
    except Exception as exc:
        errors.append(f"policy: {type(exc).__name__}: {exc}")

    try:
        contract = load_contract()
        contract_paths = set(contract["recovery_paths"])
        if contract_paths != FALLBACK_RECOVERY_PATHS:
            errors.append("contract: recovery_paths does not match the runtime allow-list")
    except Exception as exc:
        contract = {"events": {}}
        errors.append(f"contract: {type(exc).__name__}: {exc}")

    expected = set(contract["events"])
    for rel in (Path(".claude/settings.json"), Path(".codex/hooks.json")):
        try:
            value = load_json_without_duplicate_keys(ROOT / rel)
            hooks = value.get("hooks", {})
            missing = expected - set(hooks)
            if missing:
                errors.append(f"{rel.as_posix()}: missing events {sorted(missing)}")
            encoded = json.dumps(hooks, ensure_ascii=False)
            for event, definition in contract["events"].items():
                event_encoded = json.dumps(hooks.get(event, []), ensure_ascii=False)
                for token in definition.get("required_tokens", []):
                    if token not in event_encoded:
                        errors.append(f"{rel.as_posix()}: {event} missing wiring token {token}")
        except Exception as exc:
            errors.append(f"{rel.as_posix()}: {type(exc).__name__}: {exc}")

    common_root = ROOT / ".ai" / "skills"
    if repository_role() == "kit-source":
        common_files = {
            path.relative_to(common_root).as_posix(): file_digest(path)
            for path in common_root.rglob("*")
            if path.is_file()
        }
        maintainer_root = ROOT / ".aidd-kit-dev" / "skills"
        for path in maintainer_root.rglob("*"):
            if path.is_file():
                relative = path.relative_to(maintainer_root).as_posix()
                if relative in common_files:
                    errors.append(f"maintainer skill collides with portable skill: {relative}")
                common_files[relative] = file_digest(path)
        for provider in (ROOT / ".agents" / "skills", ROOT / ".claude" / "skills"):
            provider_files = {
                path.relative_to(provider).as_posix(): file_digest(path)
                for path in provider.rglob("*")
                if path.is_file()
            } if provider.is_dir() else {}
            errors.extend(skill_manifest_errors(common_files, provider_files, provider.relative_to(ROOT).as_posix()))
    else:
        for provider in (ROOT / ".agents" / "skills", ROOT / ".claude" / "skills"):
            errors.extend(skill_tree_errors(common_root, provider))
    return errors


def self_test(as_hook: bool) -> int:
    errors = harness_errors()
    if errors:
        message = "AIDD 하네스 self-test 경고:\n- " + "\n- ".join(errors)
        if as_hook:
            sys.stdout.write(message)
            return 0
        print(message, file=sys.stderr)
        return 1
    if not as_hook:
        print("AIDD harness self-test passed")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="action", required=True)
    guard = sub.add_parser("protect")
    guard.add_argument("--platform", choices=("claude", "codex"), required=True)
    guard.add_argument("--kind", choices=("file", "shell"), required=True)
    post = sub.add_parser("post-check")
    post.add_argument("--platform", choices=("claude", "codex"), required=True)
    local = sub.add_parser("local-log")
    local.add_argument("--platform", choices=("claude", "codex"), required=True)
    local.add_argument("--role", choices=("user", "assistant"), required=True)
    sub.add_parser("session-brief")
    check = sub.add_parser("self-test")
    check.add_argument("--hook", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.action == "protect":
        return protect(args.kind)
    if args.action == "session-brief":
        return session_brief()
    if args.action == "post-check":
        return post_check()
    if args.action == "local-log":
        return local_log(args.platform, args.role)
    if args.action == "self-test":
        return self_test(args.hook)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
